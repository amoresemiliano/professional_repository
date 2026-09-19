<?php
declare(strict_types=1);

namespace Vegen\Core;

use PDO;

/**
 * Controlador de Administración (Clientes, Cuestionarios, Verticales, Catálogo, Planes y Presupuestos).
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
                c.organization_id,
                c.vertical_id,
                bv.name AS vertical_name,
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
            LEFT JOIN business_verticals bv ON bv.id = c.vertical_id
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
        $verticalId = !empty($input['vertical_id']) ? trim((string)$input['vertical_id']) : null;

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
                id, organization_id, vertical_id, name, professional_sector, country,
                contact_name, contact_email, contact_phone, notes, is_protected, created_at, updated_at
            ) VALUES (
                :id, :org_id, :vertical_id, :name, :sector, :country,
                :c_name, :c_email, :c_phone, :notes, 0, NOW(), NOW()
            )
        ");
        $stmt->execute([
            ':id'          => $clientId,
            ':org_id'      => $admin['organization_id'],
            ':vertical_id' => $verticalId,
            ':name'        => $name,
            ':sector'      => $sector,
            ':country'     => $country,
            ':c_name'      => $contactName,
            ':c_email'     => $contactEmail,
            ':c_phone'     => $contactPhone !== '' ? $contactPhone : null,
            ':notes'       => $notes !== '' ? $notes : null,
        ]);

        Response::success([
            'id'                  => $clientId,
            'organization_id'     => $admin['organization_id'],
            'vertical_id'         => $verticalId,
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
            SELECT 
                c.*,
                bv.name AS vertical_name
            FROM clients c
            LEFT JOIN business_verticals bv ON bv.id = c.vertical_id
            WHERE c.id = :id AND c.organization_id = :org_id AND c.deleted_at IS NULL
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
            SELECT id, is_protected, vertical_id FROM clients
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
        $verticalId = array_key_exists('vertical_id', $input) 
            ? (!empty($input['vertical_id']) ? trim((string)$input['vertical_id']) : null)
            : $client['vertical_id'];

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
                vertical_id = :vertical_id,
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
            ':id'          => $id,
            ':org_id'      => $admin['organization_id'],
            ':vertical_id' => $verticalId,
            ':name'        => $name,
            ':sector'      => $sector,
            ':country'     => $country,
            ':c_name'      => $contactName,
            ':c_email'     => $contactEmail,
            ':c_phone'     => $contactPhone !== '' ? $contactPhone : null,
            ':notes'       => $notes !== '' ? $notes : null,
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
     * Snapshotting obligatorio: Copia el catálogo de la vertical del cliente al crear el cuestionario.
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

        $stmtClient = $pdo->prepare("
            SELECT id, name, vertical_id FROM clients
            WHERE id = :id AND organization_id = :org_id AND deleted_at IS NULL
            LIMIT 1
        ");
        $stmtClient->execute([':id' => $clientId, ':org_id' => $admin['organization_id']]);
        $client = $stmtClient->fetch();

        if (!$client) {
            Response::error('CLIENT_NOT_FOUND', 'El cliente especificado no existe, fue archivado o no pertenece a su organización.', 404);
        }

        $questionnaireId = Token::generateUuid();
        $tokenId = Token::generateUuid();
        $rawToken = Token::generatePublicToken(32);
        $tokenHash = Token::hashPublicToken($rawToken);
        $expiresAt = date('Y-m-d H:i:s', strtotime('+90 days'));

        $pdo->beginTransaction();
        try {
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

            // SNAPSHOTTING DEL POOL DE SERVICIOS
            $servicesToSnapshot = [];
            if (!empty($client['vertical_id'])) {
                $stmtCatalog = $pdo->prepare("
                    SELECT name, default_priority, display_order
                    FROM service_catalog
                    WHERE vertical_id = :v_id AND is_active = 1 AND deleted_at IS NULL
                    ORDER BY display_order ASC, created_at ASC
                ");
                $stmtCatalog->execute([':v_id' => $client['vertical_id']]);
                $servicesToSnapshot = $stmtCatalog->fetchAll();
            }

            // Fallback si no hay vertical asignada o catálogo vacío
            if (empty($servicesToSnapshot)) {
                $servicesToSnapshot = [
                    ['name' => 'Visados y Autorizaciones de Residencia', 'default_priority' => 1, 'display_order' => 1],
                    ['name' => 'Nacionalidad Española por Residencia', 'default_priority' => 1, 'display_order' => 2],
                    ['name' => 'Arraigo y Regularización Extraordinaria', 'default_priority' => 1, 'display_order' => 3],
                    ['name' => 'Recursos Contencioso-Administrativos', 'default_priority' => 0, 'display_order' => 4],
                    ['name' => 'Constitución de Sociedades para Extranjeros', 'default_priority' => 0, 'display_order' => 5],
                ];
            }

            $stmtInsertService = $pdo->prepare("
                INSERT INTO services (id, questionnaire_id, name, is_custom, is_priority, display_order, created_at, updated_at)
                VALUES (:id, :q_id, :name, 0, :is_priority, :order, NOW(), NOW())
            ");

            foreach ($servicesToSnapshot as $idx => $srv) {
                $serviceUuid = Token::generateUuid();
                $stmtInsertService->execute([
                    ':id'          => $serviceUuid,
                    ':q_id'        => $questionnaireId,
                    ':name'        => $srv['name'],
                    ':is_priority' => (int)($srv['default_priority'] ?? 0),
                    ':order'       => (int)($srv['display_order'] ?? ($idx + 1)),
                ]);
            }

            $pdo->commit();

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
                bv.name AS vertical_name,
                (SELECT COUNT(*) FROM services s WHERE s.questionnaire_id = q.id) AS total_services_count,
                (SELECT COUNT(*) FROM services s2 WHERE s2.questionnaire_id = q.id AND s2.is_priority = 1) AS priority_services_count,
                (SELECT qt.id FROM questionnaire_tokens qt WHERE qt.questionnaire_id = q.id AND qt.is_revoked = 0 ORDER BY qt.created_at DESC LIMIT 1) AS token_id
            FROM questionnaires q
            JOIN clients c ON q.client_id = c.id
            LEFT JOIN business_verticals bv ON bv.id = c.vertical_id
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

        $stmtQ = $pdo->prepare("
            SELECT 
                q.*,
                c.name AS client_name,
                c.professional_sector AS client_sector,
                c.contact_name AS client_contact_name,
                c.contact_email AS client_contact_email,
                c.country AS client_country,
                c.is_protected AS client_is_protected,
                bv.name AS vertical_name,
                (SELECT qt.id FROM questionnaire_tokens qt WHERE qt.questionnaire_id = q.id AND qt.is_revoked = 0 ORDER BY qt.created_at DESC LIMIT 1) AS token_id
            FROM questionnaires q
            JOIN clients c ON q.client_id = c.id
            LEFT JOIN business_verticals bv ON bv.id = c.vertical_id
            WHERE q.id = :id AND q.organization_id = :org_id AND q.deleted_at IS NULL
            LIMIT 1
        ");
        $stmtQ->execute([':id' => $id, ':org_id' => $admin['organization_id']]);
        $questionnaire = $stmtQ->fetch();

        if (!$questionnaire) {
            Response::error('QUESTIONNAIRE_NOT_FOUND', 'Cuestionario no encontrado o ha sido archivado.', 404);
        }

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

        $stmtAud = $pdo->prepare("
            SELECT id, audience_key, custom_label, priority
            FROM target_audiences
            WHERE questionnaire_id = :q_id
            ORDER BY created_at ASC
        ");
        $stmtAud->execute([':q_id' => $id]);
        $audiences = $stmtAud->fetchAll();

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
     * PUT /api/admin/questionnaires/{id}
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
     * DELETE /api/admin/questionnaires/{id}
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

    // ==========================================
    // VERTICALES DE NEGOCIO (CRUD)
    // ==========================================

    /**
     * GET /api/admin/verticals
     */
    public static function getVerticals(): void
    {
        $admin = Auth::requireAdmin();
        $pdo = Database::getConnection();

        $stmt = $pdo->prepare("
            SELECT 
                bv.*,
                (SELECT COUNT(*) FROM service_catalog sc WHERE sc.vertical_id = bv.id AND sc.deleted_at IS NULL) AS services_count,
                (SELECT COUNT(*) FROM clients c WHERE c.vertical_id = bv.id AND c.deleted_at IS NULL) AS clients_count
            FROM business_verticals bv
            WHERE bv.organization_id = :org_id AND bv.deleted_at IS NULL
            ORDER BY bv.created_at ASC
        ");
        $stmt->execute([':org_id' => $admin['organization_id']]);
        Response::success($stmt->fetchAll());
    }

    /**
     * POST /api/admin/verticals
     */
    public static function createVertical(): void
    {
        $admin = Auth::requireAdmin();
        $input = self::getJsonBody();

        $name = trim((string)($input['name'] ?? ''));
        $slug = trim((string)($input['slug'] ?? ''));
        $description = trim((string)($input['description'] ?? ''));
        $isActive = isset($input['is_active']) ? (int)(bool)$input['is_active'] : 1;

        if ($name === '') {
            Response::error('VALIDATION_ERROR', 'El nombre de la vertical es obligatorio.', 422);
        }

        if ($slug === '') {
            $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $name), '-'));
        }

        $pdo = Database::getConnection();
        $id = Token::generateUuid();

        $stmt = $pdo->prepare("
            INSERT INTO business_verticals (id, organization_id, name, slug, description, is_active, is_protected, created_at, updated_at)
            VALUES (:id, :org_id, :name, :slug, :desc, :is_active, 0, NOW(), NOW())
        ");
        $stmt->execute([
            ':id'        => $id,
            ':org_id'    => $admin['organization_id'],
            ':name'      => $name,
            ':slug'      => $slug,
            ':desc'      => $description !== '' ? $description : null,
            ':is_active' => $isActive,
        ]);

        Response::success([
            'id'          => $id,
            'name'        => $name,
            'slug'        => $slug,
            'description' => $description,
            'is_active'   => $isActive,
            'is_protected'=> 0,
        ], 201);
    }

    /**
     * PUT /api/admin/verticals/{id}
     */
    public static function updateVertical(string $id): void
    {
        $admin = Auth::requireAdmin();
        $pdo = Database::getConnection();

        $stmt = $pdo->prepare("SELECT * FROM business_verticals WHERE id = :id AND organization_id = :org_id AND deleted_at IS NULL LIMIT 1");
        $stmt->execute([':id' => $id, ':org_id' => $admin['organization_id']]);
        $vertical = $stmt->fetch();

        if (!$vertical) {
            Response::error('NOT_FOUND', 'Vertical no encontrada o archivada.', 404);
        }

        $input = self::getJsonBody();
        $name = trim((string)($input['name'] ?? $vertical['name']));
        $slug = trim((string)($input['slug'] ?? $vertical['slug']));
        $description = array_key_exists('description', $input) ? trim((string)$input['description']) : $vertical['description'];
        $isActive = isset($input['is_active']) ? (int)(bool)$input['is_active'] : (int)$vertical['is_active'];

        if ($name === '') {
            Response::error('VALIDATION_ERROR', 'El nombre de la vertical no puede estar vacío.', 422);
        }

        $upd = $pdo->prepare("
            UPDATE business_verticals
            SET name = :name, slug = :slug, description = :desc, is_active = :is_active, updated_at = NOW()
            WHERE id = :id AND organization_id = :org_id
        ");
        $upd->execute([
            ':name'      => $name,
            ':slug'      => $slug,
            ':desc'      => $description !== '' ? $description : null,
            ':is_active' => $isActive,
            ':id'        => $id,
            ':org_id'    => $admin['organization_id'],
        ]);

        $stmt->execute([':id' => $id, ':org_id' => $admin['organization_id']]);
        Response::success($stmt->fetch());
    }

    /**
     * DELETE /api/admin/verticals/{id}
     */
    public static function archiveVertical(string $id): void
    {
        $admin = Auth::requireAdmin();
        $pdo = Database::getConnection();

        $stmt = $pdo->prepare("SELECT id, is_protected, deleted_at FROM business_verticals WHERE id = :id AND organization_id = :org_id LIMIT 1");
        $stmt->execute([':id' => $id, ':org_id' => $admin['organization_id']]);
        $v = $stmt->fetch();

        if (!$v || $v['deleted_at'] !== null) {
            Response::error('NOT_FOUND', 'Vertical no encontrada o ya archivada.', 404);
        }

        if ((int)$v['is_protected'] === 1) {
            Response::error('RECORD_PROTECTED', 'No es posible archivar una vertical protegida.', 409);
        }

        $upd = $pdo->prepare("UPDATE business_verticals SET deleted_at = NOW(), updated_at = NOW() WHERE id = :id AND organization_id = :org_id");
        $upd->execute([':id' => $id, ':org_id' => $admin['organization_id']]);

        Response::success(['archived' => true, 'id' => $id]);
    }

    // ==========================================
    // CATÁLOGO DE SERVICIOS POR VERTICAL
    // ==========================================

    /**
     * GET /api/admin/catalog-services
     */
    public static function getCatalogServices(): void
    {
        $admin = Auth::requireAdmin();
        $pdo = Database::getConnection();
        $verticalId = !empty($_GET['vertical_id']) ? trim((string)$_GET['vertical_id']) : null;

        $sql = "
            SELECT sc.*, bv.name AS vertical_name
            FROM service_catalog sc
            JOIN business_verticals bv ON bv.id = sc.vertical_id
            WHERE sc.organization_id = :org_id AND sc.deleted_at IS NULL
        ";
        $params = [':org_id' => $admin['organization_id']];

        if ($verticalId) {
            $sql .= " AND sc.vertical_id = :v_id";
            $params[':v_id'] = $verticalId;
        }

        $sql .= " ORDER BY sc.display_order ASC, sc.created_at ASC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        Response::success($stmt->fetchAll());
    }

    /**
     * POST /api/admin/catalog-services
     */
    public static function createCatalogService(): void
    {
        $input = self::getJsonBody();
        $verticalId = trim((string)($input['vertical_id'] ?? ''));
        self::createCatalogServiceForVertical($verticalId);
    }

    /**
     * POST /api/admin/verticals/{id}/services
     */
    public static function createCatalogServiceForVertical(string $verticalId): void
    {
        $admin = Auth::requireAdmin();
        $input = self::getJsonBody();

        $name = trim((string)($input['name'] ?? ''));
        $description = trim((string)($input['description'] ?? ''));
        $defaultPriority = isset($input['default_priority']) ? (int)(bool)$input['default_priority'] : 0;
        $displayOrder = isset($input['display_order']) ? (int)$input['display_order'] : 0;
        $isActive = isset($input['is_active']) ? (int)(bool)$input['is_active'] : 1;

        if ($verticalId === '' || $name === '') {
            Response::error('VALIDATION_ERROR', 'La vertical y el nombre del servicio son obligatorios.', 422);
        }

        $pdo = Database::getConnection();
        $id = Token::generateUuid();

        $stmt = $pdo->prepare("
            INSERT INTO service_catalog (id, organization_id, vertical_id, name, description, default_priority, display_order, is_active, is_protected, created_at, updated_at)
            VALUES (:id, :org_id, :v_id, :name, :desc, :def_pri, :disp_ord, :is_active, 0, NOW(), NOW())
        ");
        $stmt->execute([
            ':id'        => $id,
            ':org_id'    => $admin['organization_id'],
            ':v_id'      => $verticalId,
            ':name'      => $name,
            ':desc'      => $description !== '' ? $description : null,
            ':def_pri'   => $defaultPriority,
            ':disp_ord'  => $displayOrder,
            ':is_active' => $isActive,
        ]);

        Response::success([
            'id'               => $id,
            'vertical_id'      => $verticalId,
            'name'             => $name,
            'description'      => $description,
            'default_priority' => $defaultPriority,
            'display_order'    => $displayOrder,
            'is_active'        => $isActive,
        ], 201);
    }

    /**
     * PUT /api/admin/catalog-services/{id}
     */
    public static function updateCatalogService(string $id): void
    {
        $admin = Auth::requireAdmin();
        $pdo = Database::getConnection();

        $stmt = $pdo->prepare("SELECT * FROM service_catalog WHERE id = :id AND organization_id = :org_id AND deleted_at IS NULL LIMIT 1");
        $stmt->execute([':id' => $id, ':org_id' => $admin['organization_id']]);
        $service = $stmt->fetch();

        if (!$service) {
            Response::error('NOT_FOUND', 'Servicio no encontrado en el catálogo.', 404);
        }

        $input = self::getJsonBody();
        $name = trim((string)($input['name'] ?? $service['name']));
        $description = array_key_exists('description', $input) ? trim((string)$input['description']) : $service['description'];
        $defaultPriority = isset($input['default_priority']) ? (int)(bool)$input['default_priority'] : (int)$service['default_priority'];
        $displayOrder = isset($input['display_order']) ? (int)$input['display_order'] : (int)$service['display_order'];
        $isActive = isset($input['is_active']) ? (int)(bool)$input['is_active'] : (int)$service['is_active'];
        $verticalId = !empty($input['vertical_id']) ? trim((string)$input['vertical_id']) : $service['vertical_id'];

        if ($name === '') {
            Response::error('VALIDATION_ERROR', 'El nombre del servicio es obligatorio.', 422);
        }

        $upd = $pdo->prepare("
            UPDATE service_catalog
            SET vertical_id = :v_id, name = :name, description = :desc, default_priority = :def_pri, display_order = :disp_ord, is_active = :is_active, updated_at = NOW()
            WHERE id = :id AND organization_id = :org_id
        ");
        $upd->execute([
            ':v_id'      => $verticalId,
            ':name'      => $name,
            ':desc'      => $description !== '' ? $description : null,
            ':def_pri'   => $defaultPriority,
            ':disp_ord'  => $displayOrder,
            ':is_active' => $isActive,
            ':id'        => $id,
            ':org_id'    => $admin['organization_id'],
        ]);

        $stmt->execute([':id' => $id, ':org_id' => $admin['organization_id']]);
        Response::success($stmt->fetch());
    }

    /**
     * DELETE /api/admin/catalog-services/{id}
     */
    public static function archiveCatalogService(string $id): void
    {
        $admin = Auth::requireAdmin();
        $pdo = Database::getConnection();

        $stmt = $pdo->prepare("SELECT id, is_protected, deleted_at FROM service_catalog WHERE id = :id AND organization_id = :org_id LIMIT 1");
        $stmt->execute([':id' => $id, ':org_id' => $admin['organization_id']]);
        $s = $stmt->fetch();

        if (!$s || $s['deleted_at'] !== null) {
            Response::error('NOT_FOUND', 'Servicio no encontrado o ya archivado.', 404);
        }

        if ((int)$s['is_protected'] === 1) {
            Response::error('RECORD_PROTECTED', 'No es posible archivar un servicio protegido.', 409);
        }

        $upd = $pdo->prepare("UPDATE service_catalog SET deleted_at = NOW(), updated_at = NOW() WHERE id = :id AND organization_id = :org_id");
        $upd->execute([':id' => $id, ':org_id' => $admin['organization_id']]);

        Response::success(['archived' => true, 'id' => $id]);
    }

    // ==========================================
    // PLANES ESTRATÉGICOS (CRUD)
    // ==========================================

    /**
     * GET /api/admin/strategic-plans
     */
    public static function getStrategicPlans(): void
    {
        $admin = Auth::requireAdmin();
        $pdo = Database::getConnection();
        $clientId = !empty($_GET['client_id']) ? trim((string)$_GET['client_id']) : null;

        $sql = "
            SELECT 
                sp.*,
                c.name AS client_name,
                (SELECT COUNT(*) FROM strategic_plan_items spi WHERE spi.plan_id = sp.id) AS items_count
            FROM strategic_plans sp
            JOIN clients c ON c.id = sp.client_id
            WHERE sp.organization_id = :org_id AND sp.deleted_at IS NULL
        ";
        $params = [':org_id' => $admin['organization_id']];

        if ($clientId) {
            $sql .= " AND sp.client_id = :client_id";
            $params[':client_id'] = $clientId;
        }

        $sql .= " ORDER BY sp.created_at DESC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        Response::success($stmt->fetchAll());
    }

    /**
     * GET /api/admin/strategic-plans/{id}
     */
    public static function getStrategicPlanDetail(string $id): void
    {
        $admin = Auth::requireAdmin();
        $pdo = Database::getConnection();

        $stmt = $pdo->prepare("
            SELECT 
                sp.*,
                c.name AS client_name,
                c.professional_sector AS client_sector
            FROM strategic_plans sp
            JOIN clients c ON c.id = sp.client_id
            WHERE sp.id = :id AND sp.organization_id = :org_id AND sp.deleted_at IS NULL
            LIMIT 1
        ");
        $stmt->execute([':id' => $id, ':org_id' => $admin['organization_id']]);
        $plan = $stmt->fetch();

        if (!$plan) {
            Response::error('NOT_FOUND', 'Plan estratégico no encontrado o archivado.', 404);
        }

        $stmtItems = $pdo->prepare("
            SELECT * FROM strategic_plan_items
            WHERE plan_id = :id
            ORDER BY display_order ASC, created_at ASC
        ");
        $stmtItems->execute([':id' => $id]);
        $plan['items'] = $stmtItems->fetchAll();

        Response::success($plan);
    }

    /**
     * POST /api/admin/strategic-plans
     */
    public static function createStrategicPlan(): void
    {
        $admin = Auth::requireAdmin();
        $input = self::getJsonBody();

        $clientId = trim((string)($input['client_id'] ?? ''));
        $questionnaireId = !empty($input['questionnaire_id']) ? trim((string)$input['questionnaire_id']) : null;
        $title = trim((string)($input['title'] ?? 'Plan Estratégico de Crecimiento'));
        $status = in_array(($input['status'] ?? ''), ['DRAFT', 'FINAL'], true) ? $input['status'] : 'DRAFT';
        $generalDiagnosis = trim((string)($input['general_diagnosis'] ?? ''));
        $generalActions = isset($input['general_actions']) ? (is_array($input['general_actions']) ? json_encode($input['general_actions']) : trim((string)$input['general_actions'])) : null;
        $items = is_array($input['items'] ?? null) ? $input['items'] : [];

        if ($clientId === '') {
            Response::error('VALIDATION_ERROR', 'El cliente es obligatorio.', 422);
        }

        $pdo = Database::getConnection();
        $planId = Token::generateUuid();

        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare("
                INSERT INTO strategic_plans (id, organization_id, client_id, questionnaire_id, title, status, general_diagnosis, general_actions, created_at, updated_at)
                VALUES (:id, :org_id, :c_id, :q_id, :title, :status, :diag, :act, NOW(), NOW())
            ");
            $stmt->execute([
                ':id'     => $planId,
                ':org_id' => $admin['organization_id'],
                ':c_id'   => $clientId,
                ':q_id'   => $questionnaireId,
                ':title'  => $title,
                ':status' => $status,
                ':diag'   => $generalDiagnosis !== '' ? $generalDiagnosis : null,
                ':act'    => $generalActions,
            ]);

            if (!empty($items)) {
                $stmtItem = $pdo->prepare("
                    INSERT INTO strategic_plan_items (id, plan_id, service_id, service_name, diagnosis, actions, display_order, created_at, updated_at)
                    VALUES (:id, :p_id, :s_id, :s_name, :diag, :act, :order, NOW(), NOW())
                ");
                foreach ($items as $idx => $item) {
                    $actionsVal = isset($item['actions']) ? (is_array($item['actions']) ? json_encode($item['actions']) : trim((string)$item['actions'])) : null;
                    $stmtItem->execute([
                        ':id'     => Token::generateUuid(),
                        ':p_id'   => $planId,
                        ':s_id'   => !empty($item['service_id']) ? $item['service_id'] : null,
                        ':s_name' => trim((string)($item['service_name'] ?? 'Servicio')),
                        ':diag'   => !empty($item['diagnosis']) ? trim((string)$item['diagnosis']) : null,
                        ':act'    => $actionsVal,
                        ':order'  => (int)($item['display_order'] ?? ($idx + 1)),
                    ]);
                }
            }

            $pdo->commit();
            self::getStrategicPlanDetail($planId);
        } catch (\Throwable $e) {
            $pdo->rollBack();
            Logger::error('Error al crear plan estratégico', ['error' => $e->getMessage()]);
            Response::error('SERVER_ERROR', 'Error interno al crear plan estratégico.', 500);
        }
    }

    /**
     * PUT /api/admin/strategic-plans/{id}
     */
    public static function updateStrategicPlan(string $id): void
    {
        $admin = Auth::requireAdmin();
        $pdo = Database::getConnection();

        $stmt = $pdo->prepare("SELECT id FROM strategic_plans WHERE id = :id AND organization_id = :org_id AND deleted_at IS NULL LIMIT 1");
        $stmt->execute([':id' => $id, ':org_id' => $admin['organization_id']]);
        if (!$stmt->fetch()) {
            Response::error('NOT_FOUND', 'Plan no encontrado o archivado.', 404);
        }

        $input = self::getJsonBody();
        $title = trim((string)($input['title'] ?? 'Plan Estratégico'));
        $status = in_array(($input['status'] ?? ''), ['DRAFT', 'FINAL'], true) ? $input['status'] : 'DRAFT';
        $generalDiagnosis = trim((string)($input['general_diagnosis'] ?? ''));
        $generalActions = isset($input['general_actions']) ? (is_array($input['general_actions']) ? json_encode($input['general_actions']) : trim((string)$input['general_actions'])) : null;
        $items = isset($input['items']) && is_array($input['items']) ? $input['items'] : null;

        $pdo->beginTransaction();
        try {
            $upd = $pdo->prepare("
                UPDATE strategic_plans
                SET title = :title, status = :status, general_diagnosis = :diag, general_actions = :act, updated_at = NOW()
                WHERE id = :id AND organization_id = :org_id
            ");
            $upd->execute([
                ':title'  => $title,
                ':status' => $status,
                ':diag'   => $generalDiagnosis !== '' ? $generalDiagnosis : null,
                ':act'    => $generalActions,
                ':id'     => $id,
                ':org_id' => $admin['organization_id'],
            ]);

            if ($items !== null) {
                $del = $pdo->prepare("DELETE FROM strategic_plan_items WHERE plan_id = :id");
                $del->execute([':id' => $id]);

                $stmtItem = $pdo->prepare("
                    INSERT INTO strategic_plan_items (id, plan_id, service_id, service_name, diagnosis, actions, display_order, created_at, updated_at)
                    VALUES (:id, :p_id, :s_id, :s_name, :diag, :act, :order, NOW(), NOW())
                ");
                foreach ($items as $idx => $item) {
                    $actionsVal = isset($item['actions']) ? (is_array($item['actions']) ? json_encode($item['actions']) : trim((string)$item['actions'])) : null;
                    $stmtItem->execute([
                        ':id'     => Token::generateUuid(),
                        ':p_id'   => $id,
                        ':s_id'   => !empty($item['service_id']) ? $item['service_id'] : null,
                        ':s_name' => trim((string)($item['service_name'] ?? 'Servicio')),
                        ':diag'   => !empty($item['diagnosis']) ? trim((string)$item['diagnosis']) : null,
                        ':act'    => $actionsVal,
                        ':order'  => (int)($item['display_order'] ?? ($idx + 1)),
                    ]);
                }
            }

            $pdo->commit();
            self::getStrategicPlanDetail($id);
        } catch (\Throwable $e) {
            $pdo->rollBack();
            Logger::error('Error al actualizar plan estratégico', ['error' => $e->getMessage()]);
            Response::error('SERVER_ERROR', 'Error al actualizar plan.', 500);
        }
    }

    /**
     * DELETE /api/admin/strategic-plans/{id}
     */
    public static function archiveStrategicPlan(string $id): void
    {
        $admin = Auth::requireAdmin();
        $pdo = Database::getConnection();

        $upd = $pdo->prepare("UPDATE strategic_plans SET deleted_at = NOW(), updated_at = NOW() WHERE id = :id AND organization_id = :org_id");
        $upd->execute([':id' => $id, ':org_id' => $admin['organization_id']]);

        Response::success(['archived' => true, 'id' => $id]);
    }

    // ==========================================
    // CATÁLOGO VEGEN & PRESUPUESTOS (QUOTES)
    // ==========================================

    /**
     * GET /api/admin/vegen-services
     */
    public static function getVegenServices(): void
    {
        $admin = Auth::requireAdmin();
        $pdo = Database::getConnection();

        $stmt = $pdo->prepare("
            SELECT * FROM vegen_service_catalog
            WHERE organization_id = :org_id AND deleted_at IS NULL
            ORDER BY created_at ASC
        ");
        $stmt->execute([':org_id' => $admin['organization_id']]);
        Response::success($stmt->fetchAll());
    }

    /**
     * POST /api/admin/vegen-services
     */
    public static function createVegenService(): void
    {
        $admin = Auth::requireAdmin();
        $input = self::getJsonBody();

        $name = trim((string)($input['name'] ?? ''));
        $description = trim((string)($input['description'] ?? ''));
        $basePrice = (float)($input['base_price'] ?? 0.00);
        $currency = trim((string)($input['currency'] ?? 'EUR'));
        $isActive = isset($input['is_active']) ? (int)(bool)$input['is_active'] : 1;

        if ($name === '') {
            Response::error('VALIDATION_ERROR', 'El nombre del servicio es obligatorio.', 422);
        }

        $pdo = Database::getConnection();
        $id = Token::generateUuid();

        $stmt = $pdo->prepare("
            INSERT INTO vegen_service_catalog (id, organization_id, name, description, base_price, currency, is_active, created_at, updated_at)
            VALUES (:id, :org_id, :name, :desc, :price, :curr, :is_active, NOW(), NOW())
        ");
        $stmt->execute([
            ':id'        => $id,
            ':org_id'    => $admin['organization_id'],
            ':name'      => $name,
            ':desc'      => $description !== '' ? $description : null,
            ':price'     => $basePrice,
            ':curr'      => $currency,
            ':is_active' => $isActive,
        ]);

        Response::success([
            'id'          => $id,
            'name'        => $name,
            'description' => $description,
            'base_price'  => $basePrice,
            'currency'    => $currency,
            'is_active'   => $isActive,
        ], 201);
    }

    /**
     * PUT /api/admin/vegen-services/{id}
     */
    public static function updateVegenService(string $id): void
    {
        $admin = Auth::requireAdmin();
        $pdo = Database::getConnection();

        $stmt = $pdo->prepare("SELECT * FROM vegen_service_catalog WHERE id = :id AND organization_id = :org_id AND deleted_at IS NULL LIMIT 1");
        $stmt->execute([':id' => $id, ':org_id' => $admin['organization_id']]);
        $service = $stmt->fetch();

        if (!$service) {
            Response::error('NOT_FOUND', 'Servicio no encontrado.', 404);
        }

        $input = self::getJsonBody();
        $name = trim((string)($input['name'] ?? $service['name']));
        $description = array_key_exists('description', $input) ? trim((string)$input['description']) : $service['description'];
        $basePrice = isset($input['base_price']) ? (float)$input['base_price'] : (float)$service['base_price'];
        $currency = trim((string)($input['currency'] ?? $service['currency']));
        $isActive = isset($input['is_active']) ? (int)(bool)$input['is_active'] : (int)$service['is_active'];

        if ($name === '') {
            Response::error('VALIDATION_ERROR', 'El nombre no puede estar vacío.', 422);
        }

        $upd = $pdo->prepare("
            UPDATE vegen_service_catalog
            SET name = :name, description = :desc, base_price = :price, currency = :curr, is_active = :is_active, updated_at = NOW()
            WHERE id = :id AND organization_id = :org_id
        ");
        $upd->execute([
            ':name'      => $name,
            ':desc'      => $description !== '' ? $description : null,
            ':price'     => $basePrice,
            ':curr'      => $currency,
            ':is_active' => $isActive,
            ':id'        => $id,
            ':org_id'    => $admin['organization_id'],
        ]);

        $stmt->execute([':id' => $id, ':org_id' => $admin['organization_id']]);
        Response::success($stmt->fetch());
    }

    /**
     * DELETE /api/admin/vegen-services/{id}
     */
    public static function archiveVegenService(string $id): void
    {
        $admin = Auth::requireAdmin();
        $pdo = Database::getConnection();

        $upd = $pdo->prepare("UPDATE vegen_service_catalog SET deleted_at = NOW(), updated_at = NOW() WHERE id = :id AND organization_id = :org_id");
        $upd->execute([':id' => $id, ':org_id' => $admin['organization_id']]);

        Response::success(['archived' => true, 'id' => $id]);
    }

    /**
     * GET /api/admin/quotes
     */
    public static function getQuotes(): void
    {
        $admin = Auth::requireAdmin();
        $pdo = Database::getConnection();
        $clientId = !empty($_GET['client_id']) ? trim((string)$_GET['client_id']) : null;

        $sql = "
            SELECT 
                q.*,
                c.name AS client_name,
                (SELECT COUNT(*) FROM quote_items qi WHERE qi.quote_id = q.id AND qi.is_selected = 1) AS items_count
            FROM quotes q
            JOIN clients c ON c.id = q.client_id
            WHERE q.organization_id = :org_id AND q.deleted_at IS NULL
        ";
        $params = [':org_id' => $admin['organization_id']];

        if ($clientId) {
            $sql .= " AND q.client_id = :client_id";
            $params[':client_id'] = $clientId;
        }

        $sql .= " ORDER BY q.created_at DESC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        Response::success($stmt->fetchAll());
    }

    /**
     * GET /api/admin/quotes/{id}
     */
    public static function getQuoteDetail(string $id): void
    {
        $admin = Auth::requireAdmin();
        $pdo = Database::getConnection();

        $stmt = $pdo->prepare("
            SELECT 
                q.*,
                c.name AS client_name,
                c.professional_sector AS client_sector,
                c.contact_name AS client_contact_name,
                c.contact_email AS client_contact_email
            FROM quotes q
            JOIN clients c ON c.id = q.client_id
            WHERE q.id = :id AND q.organization_id = :org_id AND q.deleted_at IS NULL
            LIMIT 1
        ");
        $stmt->execute([':id' => $id, ':org_id' => $admin['organization_id']]);
        $quote = $stmt->fetch();

        if (!$quote) {
            Response::error('NOT_FOUND', 'Presupuesto no encontrado o archivado.', 404);
        }

        $stmtItems = $pdo->prepare("
            SELECT * FROM quote_items
            WHERE quote_id = :id
            ORDER BY display_order ASC, created_at ASC
        ");
        $stmtItems->execute([':id' => $id]);
        $quote['items'] = $stmtItems->fetchAll();

        Response::success($quote);
    }

    /**
     * POST /api/admin/quotes
     */
    public static function createQuote(): void
    {
        $admin = Auth::requireAdmin();
        $input = self::getJsonBody();

        $clientId = trim((string)($input['client_id'] ?? ''));
        $planId = !empty($input['plan_id']) ? trim((string)$input['plan_id']) : null;
        $title = trim((string)($input['title'] ?? 'Propuesta de Acompañamiento Estratégico'));
        $status = in_array(($input['status'] ?? ''), ['DRAFT', 'PRESENTED', 'ACCEPTED', 'REJECTED'], true) ? $input['status'] : 'DRAFT';
        $discountType = in_array(($input['discount_type'] ?? ''), ['PERCENTAGE', 'FIXED'], true) ? $input['discount_type'] : 'PERCENTAGE';
        $discountValue = (float)($input['discount_value'] ?? 0.00);
        $showDiscount = isset($input['show_discount']) ? (int)(bool)$input['show_discount'] : 1;
        $showItemPrices = isset($input['show_item_prices']) ? (int)(bool)$input['show_item_prices'] : 0;
        $notes = trim((string)($input['notes'] ?? ''));
        $items = is_array($input['items'] ?? null) ? $input['items'] : [];

        if ($clientId === '') {
            Response::error('VALIDATION_ERROR', 'El cliente es obligatorio.', 422);
        }

        // Calcular subtotal
        $subtotal = 0.00;
        foreach ($items as $item) {
            $isSelected = isset($item['is_selected']) ? (bool)$item['is_selected'] : true;
            if ($isSelected) {
                $subtotal += (float)($item['final_price'] ?? ($item['base_price'] ?? 0.00));
            }
        }

        // Calcular descuento
        $discountAmount = 0.00;
        if ($discountType === 'PERCENTAGE') {
            $discountAmount = round($subtotal * ($discountValue / 100.0), 2);
        } else {
            $discountAmount = min($subtotal, round($discountValue, 2));
        }

        $total = max(0.00, round($subtotal - $discountAmount, 2));

        $pdo = Database::getConnection();
        $quoteId = Token::generateUuid();

        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare("
                INSERT INTO quotes (
                    id, organization_id, client_id, plan_id, title, status,
                    subtotal, discount_type, discount_value, discount_amount, total,
                    currency, show_discount, show_item_prices, notes, created_at, updated_at
                ) VALUES (
                    :id, :org_id, :c_id, :p_id, :title, :status,
                    :subtotal, :disc_type, :disc_val, :disc_amt, :total,
                    'EUR', :show_disc, :show_item_prices, :notes, NOW(), NOW()
                )
            ");
            $stmt->execute([
                ':id'               => $quoteId,
                ':org_id'           => $admin['organization_id'],
                ':c_id'             => $clientId,
                ':p_id'             => $planId,
                ':title'            => $title,
                ':status'           => $status,
                ':subtotal'         => $subtotal,
                ':disc_type'        => $discountType,
                ':disc_val'         => $discountValue,
                ':disc_amt'         => $discountAmount,
                ':total'            => $total,
                ':show_disc'        => $showDiscount,
                ':show_item_prices' => $showItemPrices,
                ':notes'            => $notes !== '' ? $notes : null,
            ]);

            if (!empty($items)) {
                $stmtItem = $pdo->prepare("
                    INSERT INTO quote_items (
                        id, quote_id, service_id, service_name, description,
                        base_price, final_price, display_order, is_selected, created_at, updated_at
                    ) VALUES (
                        :id, :q_id, :s_id, :s_name, :desc,
                        :base_price, :final_price, :order, :is_selected, NOW(), NOW()
                    )
                ");

                foreach ($items as $idx => $item) {
                    $baseP = (float)($item['base_price'] ?? 0.00);
                    $finalP = isset($item['final_price']) ? (float)$item['final_price'] : $baseP;
                    $stmtItem->execute([
                        ':id'          => Token::generateUuid(),
                        ':q_id'        => $quoteId,
                        ':s_id'        => !empty($item['service_id']) ? $item['service_id'] : null,
                        ':s_name'      => trim((string)($item['service_name'] ?? 'Servicio Vegen')),
                        ':desc'        => !empty($item['description']) ? trim((string)$item['description']) : null,
                        ':base_price'  => $baseP,
                        ':final_price' => $finalP,
                        ':order'       => (int)($item['display_order'] ?? ($idx + 1)),
                        ':is_selected' => isset($item['is_selected']) ? (int)(bool)$item['is_selected'] : 1,
                    ]);
                }
            }

            $pdo->commit();
            self::getQuoteDetail($quoteId);
        } catch (\Throwable $e) {
            $pdo->rollBack();
            Logger::error('Error al crear presupuesto', ['error' => $e->getMessage()]);
            Response::error('SERVER_ERROR', 'Error al crear presupuesto.', 500);
        }
    }

    /**
     * PUT /api/admin/quotes/{id}
     */
    public static function updateQuote(string $id): void
    {
        $admin = Auth::requireAdmin();
        $pdo = Database::getConnection();

        $stmt = $pdo->prepare("SELECT id FROM quotes WHERE id = :id AND organization_id = :org_id AND deleted_at IS NULL LIMIT 1");
        $stmt->execute([':id' => $id, ':org_id' => $admin['organization_id']]);
        if (!$stmt->fetch()) {
            Response::error('NOT_FOUND', 'Presupuesto no encontrado o archivado.', 404);
        }

        $input = self::getJsonBody();
        $title = trim((string)($input['title'] ?? 'Presupuesto'));
        $status = in_array(($input['status'] ?? ''), ['DRAFT', 'PRESENTED', 'ACCEPTED', 'REJECTED'], true) ? $input['status'] : 'DRAFT';
        $discountType = in_array(($input['discount_type'] ?? ''), ['PERCENTAGE', 'FIXED'], true) ? $input['discount_type'] : 'PERCENTAGE';
        $discountValue = (float)($input['discount_value'] ?? 0.00);
        $showDiscount = isset($input['show_discount']) ? (int)(bool)$input['show_discount'] : 1;
        $showItemPrices = isset($input['show_item_prices']) ? (int)(bool)$input['show_item_prices'] : 0;
        $notes = trim((string)($input['notes'] ?? ''));
        $items = isset($input['items']) && is_array($input['items']) ? $input['items'] : [];

        // Calcular subtotal
        $subtotal = 0.00;
        foreach ($items as $item) {
            $isSelected = isset($item['is_selected']) ? (bool)$item['is_selected'] : true;
            if ($isSelected) {
                $subtotal += (float)($item['final_price'] ?? ($item['base_price'] ?? 0.00));
            }
        }

        // Calcular descuento
        $discountAmount = 0.00;
        if ($discountType === 'PERCENTAGE') {
            $discountAmount = round($subtotal * ($discountValue / 100.0), 2);
        } else {
            $discountAmount = min($subtotal, round($discountValue, 2));
        }

        $total = max(0.00, round($subtotal - $discountAmount, 2));

        $pdo->beginTransaction();
        try {
            $upd = $pdo->prepare("
                UPDATE quotes
                SET 
                    title = :title,
                    status = :status,
                    subtotal = :subtotal,
                    discount_type = :disc_type,
                    discount_value = :disc_val,
                    discount_amount = :disc_amt,
                    total = :total,
                    show_discount = :show_disc,
                    show_item_prices = :show_item_prices,
                    notes = :notes,
                    updated_at = NOW()
                WHERE id = :id AND organization_id = :org_id
            ");
            $upd->execute([
                ':title'            => $title,
                ':status'           => $status,
                ':subtotal'         => $subtotal,
                ':disc_type'        => $discountType,
                ':disc_val'         => $discountValue,
                ':disc_amt'         => $discountAmount,
                ':total'            => $total,
                ':show_disc'        => $showDiscount,
                ':show_item_prices' => $showItemPrices,
                ':notes'            => $notes !== '' ? $notes : null,
                ':id'               => $id,
                ':org_id'           => $admin['organization_id'],
            ]);

            // Reemplazar items
            $del = $pdo->prepare("DELETE FROM quote_items WHERE quote_id = :id");
            $del->execute([':id' => $id]);

            if (!empty($items)) {
                $stmtItem = $pdo->prepare("
                    INSERT INTO quote_items (
                        id, quote_id, service_id, service_name, description,
                        base_price, final_price, display_order, is_selected, created_at, updated_at
                    ) VALUES (
                        :id, :q_id, :s_id, :s_name, :desc,
                        :base_price, :final_price, :order, :is_selected, NOW(), NOW()
                    )
                ");

                foreach ($items as $idx => $item) {
                    $baseP = (float)($item['base_price'] ?? 0.00);
                    $finalP = isset($item['final_price']) ? (float)$item['final_price'] : $baseP;
                    $stmtItem->execute([
                        ':id'          => Token::generateUuid(),
                        ':q_id'        => $id,
                        ':s_id'        => !empty($item['service_id']) ? $item['service_id'] : null,
                        ':s_name'      => trim((string)($item['service_name'] ?? 'Servicio Vegen')),
                        ':desc'        => !empty($item['description']) ? trim((string)$item['description']) : null,
                        ':base_price'  => $baseP,
                        ':final_price' => $finalP,
                        ':order'       => (int)($item['display_order'] ?? ($idx + 1)),
                        ':is_selected' => isset($item['is_selected']) ? (int)(bool)$item['is_selected'] : 1,
                    ]);
                }
            }

            $pdo->commit();
            self::getQuoteDetail($id);
        } catch (\Throwable $e) {
            $pdo->rollBack();
            Logger::error('Error al actualizar presupuesto', ['error' => $e->getMessage()]);
            Response::error('SERVER_ERROR', 'Error al actualizar presupuesto.', 500);
        }
    }

    /**
     * DELETE /api/admin/quotes/{id}
     */
    public static function archiveQuote(string $id): void
    {
        $admin = Auth::requireAdmin();
        $pdo = Database::getConnection();

        $upd = $pdo->prepare("UPDATE quotes SET deleted_at = NOW(), updated_at = NOW() WHERE id = :id AND organization_id = :org_id");
        $upd->execute([':id' => $id, ':org_id' => $admin['organization_id']]);

        Response::success(['archived' => true, 'id' => $id]);
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
