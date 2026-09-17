<?php
declare(strict_types=1);

namespace Vegen\Core;

use PDO;

/**
 * Controlador Público de Cuestionarios (Acceso mediante token criptográfico).
 */
class QuestionnaireController
{
    /**
     * Valida el token público y retorna los datos del token y cuestionario.
     */
    private static function resolveToken(string $token): array
    {
        $token = trim($token);
        if ($token === '') {
            Response::error('TOKEN_INVALID', 'Token inválido o no proporcionado.', 400);
        }

        $tokenHash = Token::hashPublicToken($token);
        $pdo = Database::getConnection();

        $stmt = $pdo->prepare("
            SELECT 
                qt.id AS token_id,
                qt.questionnaire_id,
                qt.is_revoked,
                qt.expires_at,
                q.id,
                q.organization_id,
                q.client_id,
                q.title,
                q.status,
                q.current_step,
                q.final_pitch,
                q.submitted_at,
                c.name AS client_name,
                c.professional_sector AS client_sector
            FROM questionnaire_tokens qt
            JOIN questionnaires q ON qt.questionnaire_id = q.id
            JOIN clients c ON q.client_id = c.id
            WHERE qt.token_hash = :hash OR qt.id = :token OR q.id = :token
            LIMIT 1
        ");
        $stmt->execute([':hash' => $tokenHash, ':token' => $token]);
        $record = $stmt->fetch();

        if (!$record) {
            Response::error('TOKEN_NOT_FOUND', 'El cuestionario solicitado no existe o el enlace es incorrecto.', 404);
        }

        if ((int)$record['is_revoked'] === 1) {
            Response::error('TOKEN_REVOKED', 'Este enlace de acceso ha sido revocado.', 410);
        }

        if (strtotime($record['expires_at']) < time()) {
            Response::error('TOKEN_EXPIRED', 'Este enlace de acceso ha expirado.', 410);
        }

        // Registrar acceso
        try {
            $upd = $pdo->prepare("UPDATE questionnaire_tokens SET last_accessed_at = NOW() WHERE id = :id");
            $upd->execute([':id' => $record['token_id']]);
        } catch (\Throwable $e) {
            // No bloquear lectura si falla timestamp de acceso
        }

        return $record;
    }

    /**
     * GET /api/q/{token}
     */
    public static function getByToken(string $token): void
    {
        $resolved = self::resolveToken($token);
        $questionnaireId = $resolved['questionnaire_id'];
        $pdo = Database::getConnection();

        // 1. Cargar servicios y respuestas asociadas
        $stmtServices = $pdo->prepare("
            SELECT 
                s.id,
                s.name,
                s.is_custom,
                s.is_priority,
                s.display_order,
                a.client_problem,
                a.solution_actions,
                a.expected_result,
                a.typical_duration,
                a.pricing_model,
                a.price_min,
                a.price_max,
                a.currency,
                a.price_notes,
                a.market_position,
                a.estimated_market_price,
                a.market_notes,
                a.profitability_score,
                a.profitability_is_uncertain,
                a.operational_ease_score,
                a.operational_issues,
                a.operational_issues_other,
                a.operational_notes,
                a.remote_capability,
                a.remote_channels,
                a.remote_channels_other,
                a.remote_notes
            FROM services s
            LEFT JOIN service_answers a ON a.service_id = s.id
            WHERE s.questionnaire_id = :q_id
            ORDER BY s.display_order ASC, s.created_at ASC
        ");
        $stmtServices->execute([':q_id' => $questionnaireId]);
        $services = $stmtServices->fetchAll();

        // 2. Cargar públicos objetivo
        $stmtAud = $pdo->prepare("
            SELECT id, audience_key, custom_label, priority
            FROM target_audiences
            WHERE questionnaire_id = :q_id
            ORDER BY created_at ASC
        ");
        $stmtAud->execute([':q_id' => $questionnaireId]);
        $audiences = $stmtAud->fetchAll();

        // 3. Cargar diferenciales
        $stmtDiff = $pdo->prepare("
            SELECT id, differential_key, custom_label
            FROM differentials
            WHERE questionnaire_id = :q_id
            ORDER BY created_at ASC
        ");
        $stmtDiff->execute([':q_id' => $questionnaireId]);
        $differentials = $stmtDiff->fetchAll();

        Response::success([
            'id'               => $resolved['id'],
            'title'            => $resolved['title'],
            'status'           => $resolved['status'],
            'current_step'     => (int)$resolved['current_step'],
            'final_pitch'      => $resolved['final_pitch'],
            'submitted_at'     => $resolved['submitted_at'],
            'client_name'      => $resolved['client_name'],
            'client_sector'    => $resolved['client_sector'],
            'services'         => $services,
            'target_audiences' => $audiences,
            'differentials'    => $differentials,
        ]);
    }

    /**
     * PUT /api/q/{token} (o POST /api/q/{token}/save)
     */
    public static function save(string $token): void
    {
        $resolved = self::resolveToken($token);
        $questionnaireId = $resolved['questionnaire_id'];

        if ($resolved['status'] === 'COMPLETED') {
            Response::error('QUESTIONNAIRE_ALREADY_COMPLETED', 'Este cuestionario ya ha sido completado y no admite modificaciones.', 400);
        }

        $input = self::getJsonBody();
        $currentStep = isset($input['current_step']) ? (int)$input['current_step'] : null;
        $finalPitch = isset($input['final_pitch']) ? (string)$input['final_pitch'] : null;

        $pdo = Database::getConnection();
        $pdo->beginTransaction();

        try {
            // 1. Actualizar cuestionario
            if ($currentStep !== null || $finalPitch !== null) {
                $fields = [];
                $params = [':id' => $questionnaireId];

                if ($currentStep !== null) {
                    $fields[] = 'current_step = :step';
                    $params[':step'] = $currentStep;
                }
                if ($finalPitch !== null) {
                    $fields[] = 'final_pitch = :pitch';
                    $params[':pitch'] = $finalPitch;
                }

                $fields[] = "updated_at = NOW()";
                if ($resolved['status'] === 'SENT') {
                    $fields[] = "status = 'IN_PROGRESS'";
                }

                $sql = "UPDATE questionnaires SET " . implode(', ', $fields) . " WHERE id = :id";
                $updQ = $pdo->prepare($sql);
                $updQ->execute($params);
            }

            // 2. Persistir servicios y respuestas si se reciben
            if (isset($input['services']) && is_array($input['services'])) {
                self::persistServices($pdo, $questionnaireId, $input['services']);
            }

            // 3. Persistir públicos objetivo si se reciben
            if (isset($input['target_audiences']) && is_array($input['target_audiences'])) {
                self::persistTargetAudiences($pdo, $questionnaireId, $input['target_audiences']);
            }

            // 4. Persistir diferenciales si se reciben
            if (isset($input['differentials']) && is_array($input['differentials'])) {
                self::persistDifferentials($pdo, $questionnaireId, $input['differentials']);
            }

            $pdo->commit();

            Response::success([
                'saved'        => true,
                'current_step' => $currentStep ?? (int)$resolved['current_step'],
            ]);
        } catch (\Throwable $e) {
            $pdo->rollBack();
            Logger::error('Error guardando respuestas de cuestionario', ['error' => $e->getMessage()]);
            Response::error('SERVER_ERROR', 'Error interno al guardar las respuestas.', 500);
        }
    }

    /**
     * POST /api/q/{token}/submit
     */
    public static function submit(string $token): void
    {
        $resolved = self::resolveToken($token);
        $questionnaireId = $resolved['questionnaire_id'];

        // Idempotencia: si ya fue completado, devolver éxito sin duplicar cambios
        if ($resolved['status'] === 'COMPLETED') {
            Response::success([
                'submitted'        => true,
                'already_completed'=> true,
                'status'           => 'COMPLETED',
                'submitted_at'     => $resolved['submitted_at'],
            ]);
        }

        $input = self::getJsonBody();
        $pdo = Database::getConnection();
        $pdo->beginTransaction();

        try {
            // Guardar cualquier estado final incluido en el submit
            if (isset($input['services']) && is_array($input['services'])) {
                self::persistServices($pdo, $questionnaireId, $input['services']);
            }
            if (isset($input['target_audiences']) && is_array($input['target_audiences'])) {
                self::persistTargetAudiences($pdo, $questionnaireId, $input['target_audiences']);
            }
            if (isset($input['differentials']) && is_array($input['differentials'])) {
                self::persistDifferentials($pdo, $questionnaireId, $input['differentials']);
            }
            if (isset($input['final_pitch'])) {
                $updPitch = $pdo->prepare("UPDATE questionnaires SET final_pitch = :pitch WHERE id = :id");
                $updPitch->execute([':pitch' => (string)$input['final_pitch'], ':id' => $questionnaireId]);
            }

            // Marcar cuestionario como COMPLETED
            $submittedAt = date('Y-m-d H:i:s');
            $stmtSubmit = $pdo->prepare("
                UPDATE questionnaires 
                SET status = 'COMPLETED', submitted_at = :sub_at, updated_at = NOW()
                WHERE id = :id
            ");
            $stmtSubmit->execute([
                ':sub_at' => $submittedAt,
                ':id'     => $questionnaireId,
            ]);

            $pdo->commit();

            Response::success([
                'submitted'    => true,
                'status'       => 'COMPLETED',
                'submitted_at' => $submittedAt,
            ]);
        } catch (\Throwable $e) {
            $pdo->rollBack();
            Logger::error('Error enviando cuestionario', ['error' => $e->getMessage()]);
            Response::error('SERVER_ERROR', 'Error interno al enviar el cuestionario.', 500);
        }
    }

    private static function persistServices(PDO $pdo, string $questionnaireId, array $servicesList): void
    {
        $existingServiceIdsStmt = $pdo->prepare("SELECT id FROM services WHERE questionnaire_id = :q_id");
        $existingServiceIdsStmt->execute([':q_id' => $questionnaireId]);
        $existingIds = $existingServiceIdsStmt->fetchAll(PDO::FETCH_COLUMN);

        $processedIds = [];

        foreach ($servicesList as $index => $srv) {
            if (!is_array($srv)) continue;

            $name = trim((string)($srv['name'] ?? ''));
            if ($name === '') continue;

            $srvId = (string)($srv['id'] ?? '');
            $isExisting = in_array($srvId, $existingIds, true);

            if (!$isExisting || strlen($srvId) < 10) {
                $srvId = Token::generateUuid();
                $insS = $pdo->prepare("
                    INSERT INTO services (id, questionnaire_id, name, is_custom, is_priority, display_order, created_at, updated_at)
                    VALUES (:id, :q_id, :name, :custom, :priority, :order, NOW(), NOW())
                ");
                $insS->execute([
                    ':id'       => $srvId,
                    ':q_id'     => $questionnaireId,
                    ':name'     => $name,
                    ':custom'   => !empty($srv['is_custom']) ? 1 : 0,
                    ':priority' => !empty($srv['is_priority']) ? 1 : 0,
                    ':order'    => (int)($srv['display_order'] ?? $index),
                ]);
            } else {
                $updS = $pdo->prepare("
                    UPDATE services 
                    SET name = :name, is_custom = :custom, is_priority = :priority, display_order = :order, updated_at = NOW()
                    WHERE id = :id AND questionnaire_id = :q_id
                ");
                $updS->execute([
                    ':name'     => $name,
                    ':custom'   => !empty($srv['is_custom']) ? 1 : 0,
                    ':priority' => !empty($srv['is_priority']) ? 1 : 0,
                    ':order'    => (int)($srv['display_order'] ?? $index),
                    ':id'       => $srvId,
                    ':q_id'     => $questionnaireId,
                ]);
            }

            $processedIds[] = $srvId;

            // Guardar / actualizar respuestas del servicio
            $insAns = $pdo->prepare("
                INSERT INTO service_answers (
                    service_id, client_problem, solution_actions, expected_result, typical_duration,
                    pricing_model, price_min, price_max, currency, price_notes,
                    market_position, estimated_market_price, market_notes,
                    profitability_score, profitability_is_uncertain, operational_ease_score,
                    operational_issues, operational_issues_other, operational_notes,
                    remote_capability, remote_channels, remote_channels_other, remote_notes,
                    created_at, updated_at
                ) VALUES (
                    :service_id, :problem, :solution, :result, :duration,
                    :pricing_model, :p_min, :p_max, :currency, :p_notes,
                    :market_pos, :est_price, :m_notes,
                    :profit_score, :profit_uncert, :ease_score,
                    :issues, :issues_other, :op_notes,
                    :remote_cap, :remote_chan, :remote_chan_other, :remote_notes,
                    NOW(), NOW()
                )
                ON DUPLICATE KEY UPDATE
                    client_problem = VALUES(client_problem),
                    solution_actions = VALUES(solution_actions),
                    expected_result = VALUES(expected_result),
                    typical_duration = VALUES(typical_duration),
                    pricing_model = VALUES(pricing_model),
                    price_min = VALUES(price_min),
                    price_max = VALUES(price_max),
                    currency = VALUES(currency),
                    price_notes = VALUES(price_notes),
                    market_position = VALUES(market_position),
                    estimated_market_price = VALUES(estimated_market_price),
                    market_notes = VALUES(market_notes),
                    profitability_score = VALUES(profitability_score),
                    profitability_is_uncertain = VALUES(profitability_is_uncertain),
                    operational_ease_score = VALUES(operational_ease_score),
                    operational_issues = VALUES(operational_issues),
                    operational_issues_other = VALUES(operational_issues_other),
                    operational_notes = VALUES(operational_notes),
                    remote_capability = VALUES(remote_capability),
                    remote_channels = VALUES(remote_channels),
                    remote_channels_other = VALUES(remote_channels_other),
                    remote_notes = VALUES(remote_notes),
                    updated_at = NOW()
            ");

            $insAns->execute([
                ':service_id'         => $srvId,
                ':problem'            => $srv['client_problem'] ?? null,
                ':solution'           => $srv['solution_actions'] ?? null,
                ':result'             => $srv['expected_result'] ?? null,
                ':duration'           => $srv['typical_duration'] ?? null,
                ':pricing_model'      => $srv['pricing_model'] ?? null,
                ':p_min'              => isset($srv['price_min']) && is_numeric($srv['price_min']) ? $srv['price_min'] : null,
                ':p_max'              => isset($srv['price_max']) && is_numeric($srv['price_max']) ? $srv['price_max'] : null,
                ':currency'           => $srv['currency'] ?? 'EUR',
                ':p_notes'            => $srv['price_notes'] ?? null,
                ':market_pos'         => $srv['market_position'] ?? null,
                ':est_price'          => isset($srv['estimated_market_price']) && is_numeric($srv['estimated_market_price']) ? $srv['estimated_market_price'] : null,
                ':m_notes'            => $srv['market_notes'] ?? null,
                ':profit_score'       => isset($srv['profitability_score']) && is_numeric($srv['profitability_score']) ? (int)$srv['profitability_score'] : null,
                ':profit_uncert'      => !empty($srv['profitability_is_uncertain']) ? 1 : 0,
                ':ease_score'         => isset($srv['operational_ease_score']) && is_numeric($srv['operational_ease_score']) ? (int)$srv['operational_ease_score'] : null,
                ':issues'             => isset($srv['operational_issues']) ? (is_array($srv['operational_issues']) ? json_encode($srv['operational_issues']) : (string)$srv['operational_issues']) : null,
                ':issues_other'       => $srv['operational_issues_other'] ?? null,
                ':op_notes'           => $srv['operational_notes'] ?? null,
                ':remote_cap'         => $srv['remote_capability'] ?? null,
                ':remote_chan'        => isset($srv['remote_channels']) ? (is_array($srv['remote_channels']) ? json_encode($srv['remote_channels']) : (string)$srv['remote_channels']) : null,
                ':remote_chan_other'  => $srv['remote_channels_other'] ?? null,
                ':remote_notes'       => $srv['remote_notes'] ?? null,
            ]);
        }

        // Eliminar servicios borrados por el usuario
        if (!empty($processedIds)) {
            $inClause = implode(',', array_fill(0, count($processedIds), '?'));
            $delStmt = $pdo->prepare("DELETE FROM services WHERE questionnaire_id = ? AND id NOT IN ({$inClause})");
            $params = array_merge([$questionnaireId], $processedIds);
            $delStmt->execute($params);
        }
    }

    private static function persistTargetAudiences(PDO $pdo, string $questionnaireId, array $audiences): void
    {
        // Limpiar audiencias anteriores para el cuestionario y reinsertar
        $del = $pdo->prepare("DELETE FROM target_audiences WHERE questionnaire_id = :q_id");
        $del->execute([':q_id' => $questionnaireId]);

        $ins = $pdo->prepare("
            INSERT INTO target_audiences (id, questionnaire_id, audience_key, custom_label, priority, created_at)
            VALUES (:id, :q_id, :key, :label, :priority, NOW())
        ");

        foreach ($audiences as $aud) {
            if (!is_array($aud)) continue;
            $key = trim((string)($aud['audience_key'] ?? ($aud['key'] ?? '')));
            if ($key === '') continue;

            $priority = strtolower(trim((string)($aud['priority'] ?? 'medium')));
            // Validación estricta en PHP del ENUM
            if (!in_array($priority, ['high', 'medium', 'low'], true)) {
                $priority = 'medium';
            }

            $ins->execute([
                ':id'       => Token::generateUuid(),
                ':q_id'     => $questionnaireId,
                ':key'      => $key,
                ':label'    => $aud['custom_label'] ?? ($aud['label'] ?? null),
                ':priority' => $priority,
            ]);
        }
    }

    private static function persistDifferentials(PDO $pdo, string $questionnaireId, array $differentials): void
    {
        $del = $pdo->prepare("DELETE FROM differentials WHERE questionnaire_id = :q_id");
        $del->execute([':q_id' => $questionnaireId]);

        $ins = $pdo->prepare("
            INSERT INTO differentials (id, questionnaire_id, differential_key, custom_label, created_at)
            VALUES (:id, :q_id, :key, :label, NOW())
        ");

        foreach ($differentials as $diff) {
            if (!is_array($diff)) continue;
            $key = trim((string)($diff['differential_key'] ?? ($diff['key'] ?? '')));
            if ($key === '') continue;

            $ins->execute([
                ':id'    => Token::generateUuid(),
                ':q_id'  => $questionnaireId,
                ':key'   => $key,
                ':label' => $diff['custom_label'] ?? ($diff['label'] ?? null),
            ]);
        }
    }

    private static function getJsonBody(): array
    {
        $raw = file_get_contents('php://input');
        if (empty($raw)) {
            return $_POST ?? [];
        }

        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : [];
    }
}
