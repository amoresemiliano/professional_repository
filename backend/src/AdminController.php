<?php
declare(strict_types=1);

namespace Vegen\Core;

use PDO;

/**
 * Controlador de Administración (Clientes y Cuestionarios).
 * CRUD Seguro con Registros Protegidos, Soft-Delete y Aislamiento por Organización.
 */
class AdminController
{
    /**
     * GET /api/admin/clients
     */
    public static function getClients(): void
    {
        $admin = Auth::requireAdmin();
        $pdo = Database::getConnection();

        $stmt = $pdo->prepare("
            SELECT 
                c.id,
                c.name,
                c.professional_sector,
                c.country,
                c.contact_name,
                c.contact_email,
                c.contact_phone,
                c.notes,
                c.is_protected,
                c.created_at,
                c.updated_at,
                (SELECT COUNT(*) FROM questionnaires q WHERE q.client_id = c.id AND q.deleted_at IS NULL) AS questionnaires_count,
                (SELECT q2.status FROM questionnaires q2 WHERE q2.client_id = c.id AND q2.deleted_at IS NULL ORDER BY q2.created_at DESC LIMIT 1) AS latest_status,
                (SELECT qt.id FROM questionnaires q3 JOIN questionnaire_tokens qt ON qt.questionnaire_id = q3.id WHERE q3.client_id = c.id AND q3.deleted_at IS NULL AND qt.is_revoked = 0 ORDER BY q3.created_at DESC LIMIT 1) AS token_id
            FROM clients c
            WHERE c.organization_id = :org_id
              AND c.deleted_at IS NULL
            ORDER BY c.created_at DESC
        ");
        $stmt->execute([':org_id' => $admin['organization_id']]);
        $clients = $stmt->fetchAll();

        Response::success($clients);
    }

    /**
     * POST /api/admin/clients
     */
    public static function createClient(): void
    {
        $admin = Auth::requireAdmin();
        $input = self::getJsonBody();

        $name = trim((string)($input['name'] ?? ''));
        $sector = trim((string)($input['professional_sector'] ?? ($input['sector'] ?? '')));
        $country = trim((string)($input['country'] ?? 'España'));
        $contactName = trim((string)($input['contact_name'] ?? ($input['contactName'] ?? '')));
        $contactEmail = trim((string)($input['contact_email'] ?? ($input['contactEmail'] ?? '')));
        $contactPhone = trim((string)($input['contact_phone'] ?? ($input['contactPhone'] ?? '')));
        $notes = trim((string)($input['notes'] ?? ''));

        if ($name === '' || $sector === '' || $contactName === '' || $contactEmail === '') {
            Response::error('VALIDATION_ERROR', 'Los campos nombre, sector, contacto y correo electrónico son obligatorios.', 422);
        }

        if (!filter_var($contactEmail, FILTER_VALIDATE_EMAIL)) {
            Response::error('INVALID_EMAIL', 'El formato del correo electrónico de contacto es inválido.', 422);
        }

        $pdo = Database::getConnection();
        $clientId = Token::generateUuid();

        $stmt = $pdo->prepare("
            INSERT INTO clients (
                id, organization_id, name, professional_sector, country,
                contact_name, contact_email, contact_phone, notes, is_protected, created_at, updated_at
            ) VALUES (
                :id, :org_id, :name, :sector, :country,
                :c_name, :c_email, :c_phone, :notes, 0, NOW(), NOW()
            )
        ");
        $stmt->execute([
            ':id'       => $clientId,
            ':org_id'   => $admin['organization_id'],
            ':name'     => $name,
            ':sector'   => $sector,
            ':country'  => $country,
            ':c_name'   => $contactName,
            ':c_email'  => $contactEmail,
            ':c_phone'  => $contactPhone !== '' ? $contactPhone : null,
            ':notes'    => $notes !== '' ? $notes : null,
        ]);

        Response::success([
            'id'                  => $clientId,
            'organization_id'     => $admin['organization_id'],
            'name'                => $name,
            'professional_sector' => $sector,
            'country'             => $country,
            'contact_name'        => $contactName,
            'contact_email'       => $contactEmail,
            'contact_phone'       => $contactPhone,
            'notes'               => $notes,
            'is_protected'        => 0,
        ], 201);
    }

    /**
     * GET /api/admin/clients/{id}
     */
    public static function getClient(string $id): void
    {
        $admin = Auth::requireAdmin();
        $pdo = Database::getConnection();

        $stmt = $pdo->prepare("
            SELECT * FROM clients
            WHERE id = :id AND organization_id = :org_id AND deleted_at IS NULL
            LIMIT 1
        ");
        $stmt->execute([':id' => $id, ':org_id' => $admin['organization_id']]);
        $client = $stmt->fetch();

        if (!$client) {
            Response::error('CLIENT_NOT_FOUND', 'Cliente no encontrado o ha sido archivado.', 404);
        }

        // Cargar cuestionarios asociados al cliente
        $stmtQ = $pdo->prepare("
            SELECT 
                q.id,
                q.title,
                q.status,
                q.current_step,
                q.is_protected,
                q.created_at,
                q.updated_at,
                q.submitted_at,
                (SELECT COUNT(*) FROM services s WHERE s.questionnaire_id = q.id) AS services_count,
                (SELECT qt.id FROM questionnaire_tokens qt WHERE qt.questionnaire_id = q.id AND qt.is_revoked = 0 ORDER BY qt.created_at DESC LIMIT 1) AS token_id
            FROM questionnaires q
            WHERE q.client_id = :client_id AND q.deleted_at IS NULL
            ORDER BY q.created_at DESC
        ");
        $stmtQ->execute([':client_id' => $id]);
        $client['questionnaires'] = $stmtQ->fetchAll();

        Response::success($client);
    }

    /**
     * PUT /api/admin/clients/{id}
     */
    public static function updateClient(string $id): void
    {
        $admin = Auth::requireAdmin();
        $pdo = Database::getConnection();

        // 1. Verificar existencia y pertenencia
        $stmt = $pdo->prepare("
            SELECT id, is_protected FROM clients
            WHERE id = :id AND organization_id = :org_id AND deleted_at IS NULL
            LIMIT 1
        ");
        $stmt->execute([':id' => $id, ':org_id' => $admin['organization_id']]);
        $client = $stmt->fetch();

        if (!$client) {
            Response::error('CLIENT_NOT_FOUND', 'Cliente no encontrado o ha sido archivado.', 404);
        }

        $input = self::getJsonBody();
        $name = trim((string)($input['name'] ?? ''));
        $sector = trim((string)($input['professional_sector'] ?? ($input['sector'] ?? '')));
        $country = trim((string)($input['country'] ?? 'España'));
        $contactName = trim((string)($input['contact_name'] ?? ($input['contactName'] ?? '')));
        $contactEmail = trim((string)($input['contact_email'] ?? ($input['contactEmail'] ?? '')));
        $contactPhone = trim((string)($input['contact_phone'] ?? ($input['contactPhone'] ?? '')));
        $notes = trim((string)($input['notes'] ?? ''));

        if ($name === '' || $sector === '' || $contactName === '' || $contactEmail === '') {
            Response::error('VALIDATION_ERROR', 'Los campos nombre, sector, contacto y correo electrónico son obligatorios.', 422);
        }

        if (!filter_var($contactEmail, FILTER_VALIDATE_EMAIL)) {
            Response::error('INVALID_EMAIL', 'El formato del correo electrónico de contacto es inválido.', 422);
        }

        $upd = $pdo->prepare("
            UPDATE clients
            SET 
                name = :name,
                professional_sector = :sector,
                country = :country,
                contact_name = :c_name,
                contact_email = :c_email,
                contact_phone = :c_phone,
                notes = :notes,
                updated_at = NOW()
            WHERE id = :id AND organization_id = :org_id
        ");
        $upd->execute([
            ':id'       => $id,
            ':org_id'   => $admin['organization_id'],
            ':name'     => $name,
            ':sector'   => $sector,
            ':country'  => $country,
            ':c_name'   => $contactName,
            ':c_email'  => $contactEmail,
            ':c_phone'  => $contactPhone !== '' ? $contactPhone : null,
            ':notes'    => $notes !== '' ? $notes : null,
        ]);

        self::getClient($id);
    }

    /**
     * DELETE /api/admin/clients/{id} (Soft delete / Archivar)
     */
    public static function archiveClient(string $id): void
    {
        $admin = Auth::requireAdmin();
        $pdo = Database::getConnection();

        $stmt = $pdo->prepare("
            SELECT id, is_protected, deleted_at FROM clients
            WHERE id = :id AND organization_id = :org_id LIMIT 1
        ");
        $stmt->execute([':id' => $id, ':org_id' => $admin['organization_id']]);
        $client = $stmt->fetch();

        if (!$client || $client['deleted_at'] !== null) {
            Response::error('CLIENT_NOT_FOUND', 'Cliente no encontrado o ya archivado.', 404);
        }

        if ((int)$client['is_protected'] === 1) {
            Response::error('RECORD_PROTECTED', 'No es posible archivar o eliminar un cliente protegido.', 409);
        }

        // Soft delete seguro
        $upd = $pdo->prepare("
            UPDATE clients 
            SET deleted_at = NOW(), updated_at = NOW()
            WHERE id = :id AND organization_id = :org_id
        ");
        $upd->execute([':id' => $id, ':org_id' => $admin['organization_id']]);

        Response::success([
            'archived' => true,
            'id'       => $id,
            'message'  => 'Cliente archivado correctamente.',
        ]);
    }

    /**
     * POST /api/admin/questionnaires
     */
    public static function createQuestionnaire(): void
    {
        $admin = Auth::requireAdmin();
        $input = self::getJsonBody();

        $clientId = trim((string)($input['client_id'] ?? ($input['clientId'] ?? '')));
        $title = trim((string)($input['title'] ?? 'Cuestionario de Diagnóstico'));

        if ($clientId === '') {
            Response::error('VALIDATION_ERROR', 'El parámetro client_id es obligatorio.', 422);
        }

        $pdo = Database::getConnection();

        // Validar que el cliente pertenezca a la organización y esté activo (no archivado)
        $stmtClient = $pdo->prepare("
            SELECT id, name FROM clients
            WHERE id = :id AND organization_id = :org_id AND deleted_at IS NULL
            LIMIT 1
        ");
        $stmtClient->execute([':id' => $clientId, ':org_id' => $admin['organization_id']]);
        $client = $stmtClient->fetch();

        if (!$client) {
            Response::error('CLIENT_NOT_FOUND', 'El cliente especificado no existe, fue archivado o no pertenece a su organización.', 404);
        }

        // Generación de identificadores y token público seguro
        $questionnaireId = Token::generateUuid();
        $tokenId = Token::generateUuid();
        $rawToken = Token::generatePublicToken(32); // 64 hex characters
        $tokenHash = Token::hashPublicToken($rawToken);
        $expiresAt = date('Y-m-d H:i:s', strtotime('+90 days'));

        $pdo->beginTransaction();
        try {
            // Convención documentada: estado SENT al generar enlace de cuestionario
            $stmtQ = $pdo->prepare("
                INSERT INTO questionnaires (
                    id, organization_id, client_id, title, status, current_step, is_protected, created_at, updated_at
                ) VALUES (
                    :id, :org_id, :client_id, :title, 'SENT', 1, 0, NOW(), NOW()
                )
            ");
            $stmtQ->execute([
                ':id'        => $questionnaireId,
                ':org_id'    => $admin['organization_id'],
                ':client_id' => $clientId,
                ':title'     => $title,
            ]);

            // Persistir sólo el hash SHA-256 en la base de datos
            $stmtTok = $pdo->prepare("
                INSERT INTO questionnaire_tokens (
                    id, questionnaire_id, token_hash, is_revoked, expires_at, created_at
                ) VALUES (
                    :id, :q_id, :token_hash, 0, :expires_at, NOW()
                )
            ");
            $stmtTok->execute([
                ':id'         => $tokenId,
                ':q_id'       => $questionnaireId,
                ':token_hash' => $tokenHash,
                ':expires_at' => $expiresAt,
            ]);

            $pdo->commit();

            // Devolver raw token una única vez
            Response::success([
                'questionnaire_id' => $questionnaireId,
                'client_id'        => $clientId,
                'client_name'      => $client['name'],
                'title'            => $title,
                'status'           => 'SENT',
                'is_protected'     => 0,
                'token'            => $rawToken,
                'url'              => "/q/{$rawToken}",
                'expires_at'       => $expiresAt,
            ], 201);
        } catch (\Throwable $e) {
            $pdo->rollBack();
            Logger::error('Error al crear cuestionario', ['error' => $e->getMessage()]);
            Response::error('SERVER_ERROR', 'Error interno al crear el cuestionario.', 500);
        }
    }

    /**
     * GET /api/admin/questionnaires
     */
    public static function getQuestionnaires(): void
    {
        $admin = Auth::requireAdmin();
        $pdo = Database::getConnection();

        $stmt = $pdo->prepare("
            SELECT 
                q.id,
                q.title,
                q.status,
                q.current_step,
                q.final_pitch,
                q.is_protected,
                q.submitted_at,
                q.created_at,
                q.updated_at,
                c.id AS client_id,
                c.name AS client_name,
                c.professional_sector AS client_sector,
                c.contact_name AS client_contact_name,
                c.contact_email AS client_contact_email,
                c.is_protected AS client_is_protected,
                (SELECT COUNT(*) FROM services s WHERE s.questionnaire_id = q.id) AS total_services_count,
                (SELECT COUNT(*) FROM services s2 WHERE s2.questionnaire_id = q.id AND s2.is_priority = 1) AS priority_services_count,
                (SELECT qt.id FROM questionnaire_tokens qt WHERE qt.questionnaire_id = q.id AND qt.is_revoked = 0 ORDER BY qt.created_at DESC LIMIT 1) AS token_id
            FROM questionnaires q
            JOIN clients c ON q.client_id = c.id
            WHERE q.organization_id = :org_id
              AND q.deleted_at IS NULL
              AND c.deleted_at IS NULL
            ORDER BY q.created_at DESC
        ");
        $stmt->execute([':org_id' => $admin['organization_id']]);
        $questionnaires = $stmt->fetchAll();

        Response::success($questionnaires);
    }

    /**
     * GET /api/admin/questionnaires/{id}
     */
    public static function getQuestionnaireDetail(string $id): void
    {
        $admin = Auth::requireAdmin();
        $pdo = Database::getConnection();

        // 1. Cargar cuestionario y cliente
        $stmtQ = $pdo->prepare("
            SELECT 
                q.*,
                c.name AS client_name,
                c.professional_sector AS client_sector,
                c.contact_name,
                c.contact_email,
                c.contact_phone,
                c.is_protected AS client_is_protected,
                c.notes AS client_notes,
                (SELECT qt.id FROM questionnaire_tokens qt WHERE qt.questionnaire_id = q.id AND qt.is_revoked = 0 ORDER BY qt.created_at DESC LIMIT 1) AS token_id
            FROM questionnaires q
            JOIN clients c ON q.client_id = c.id
            WHERE q.id = :id 
              AND q.organization_id = :org_id
              AND q.deleted_at IS NULL
            LIMIT 1
        ");
        $stmtQ->execute([':id' => $id, ':org_id' => $admin['organization_id']]);
        $questionnaire = $stmtQ->fetch();

        if (!$questionnaire) {
            Response::error('QUESTIONNAIRE_NOT_FOUND', 'Cuestionario no encontrado o ha sido archivado.', 404);
        }

        // 2. Cargar servicios y respuestas
        $stmtS = $pdo->prepare("
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
                a.remote_notes,
                a.opportunity_score,
                a.score_version
            FROM services s
            LEFT JOIN service_answers a ON a.service_id = s.id
            WHERE s.questionnaire_id = :q_id
            ORDER BY s.display_order ASC, s.created_at ASC
        ");
        $stmtS->execute([':q_id' => $id]);
        $services = $stmtS->fetchAll();

        // 3. Cargar públicos objetivo
        $stmtAud = $pdo->prepare("
            SELECT id, audience_key, custom_label, priority
            FROM target_audiences
            WHERE questionnaire_id = :q_id
            ORDER BY created_at ASC
        ");
        $stmtAud->execute([':q_id' => $id]);
        $audiences = $stmtAud->fetchAll();

        // 4. Cargar diferenciales
        $stmtDiff = $pdo->prepare("
            SELECT id, differential_key, custom_label
            FROM differentials
            WHERE questionnaire_id = :q_id
            ORDER BY created_at ASC
        ");
        $stmtDiff->execute([':q_id' => $id]);
        $differentials = $stmtDiff->fetchAll();

        Response::success([
            'questionnaire'    => $questionnaire,
            'services'         => $services,
            'target_audiences' => $audiences,
            'differentials'    => $differentials,
        ]);
    }

    /**
     * PUT /api/admin/questionnaires/{id} (Edición exclusiva de metadata segura)
     * RIESGO JULES: NO modificar tablas hijas ni respuestas aquí.
     */
    public static function updateQuestionnaire(string $id): void
    {
        $admin = Auth::requireAdmin();
        $pdo = Database::getConnection();

        $stmt = $pdo->prepare("
            SELECT id, is_protected, deleted_at FROM questionnaires
            WHERE id = :id AND organization_id = :org_id AND deleted_at IS NULL
            LIMIT 1
        ");
        $stmt->execute([':id' => $id, ':org_id' => $admin['organization_id']]);
        $q = $stmt->fetch();

        if (!$q) {
            Response::error('QUESTIONNAIRE_NOT_FOUND', 'Cuestionario no encontrado o archivado.', 404);
        }

        $input = self::getJsonBody();
        $title = trim((string)($input['title'] ?? ''));

        if ($title === '') {
            Response::error('VALIDATION_ERROR', 'El título del cuestionario es obligatorio.', 422);
        }

        $upd = $pdo->prepare("
            UPDATE questionnaires
            SET title = :title, updated_at = NOW()
            WHERE id = :id AND organization_id = :org_id
        ");
        $upd->execute([
            ':title'  => $title,
            ':id'     => $id,
            ':org_id' => $admin['organization_id'],
        ]);

        self::getQuestionnaireDetail($id);
    }

    /**
     * DELETE /api/admin/questionnaires/{id} (Soft delete / Archivar cuestionario y revocar tokens)
     */
    public static function archiveQuestionnaire(string $id): void
    {
        $admin = Auth::requireAdmin();
        $pdo = Database::getConnection();

        $stmt = $pdo->prepare("
            SELECT id, is_protected, deleted_at FROM questionnaires
            WHERE id = :id AND organization_id = :org_id LIMIT 1
        ");
        $stmt->execute([':id' => $id, ':org_id' => $admin['organization_id']]);
        $q = $stmt->fetch();

        if (!$q || $q['deleted_at'] !== null) {
            Response::error('QUESTIONNAIRE_NOT_FOUND', 'Cuestionario no encontrado o ya archivado.', 404);
        }

        if ((int)$q['is_protected'] === 1) {
            Response::error('RECORD_PROTECTED', 'No es posible archivar o eliminar un cuestionario protegido.', 409);
        }

        // Transaccional: soft delete en cuestionario + revocar todos sus tokens asociados
        $pdo->beginTransaction();
        try {
            $updQ = $pdo->prepare("
                UPDATE questionnaires
                SET deleted_at = NOW(), updated_at = NOW()
                WHERE id = :id AND organization_id = :org_id
            ");
            $updQ->execute([':id' => $id, ':org_id' => $admin['organization_id']]);

            $updTok = $pdo->prepare("
                UPDATE questionnaire_tokens
                SET is_revoked = 1
                WHERE questionnaire_id = :q_id
            ");
            $updTok->execute([':q_id' => $id]);

            $pdo->commit();

            Response::success([
                'archived' => true,
                'id'       => $id,
                'message'  => 'Cuestionario archivado y enlace revocado exitosamente.',
            ]);
        } catch (\Throwable $e) {
            $pdo->rollBack();
            Logger::error('Error al archivar cuestionario', ['error' => $e->getMessage()]);
            Response::error('SERVER_ERROR', 'Error interno al archivar el cuestionario.', 500);
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
