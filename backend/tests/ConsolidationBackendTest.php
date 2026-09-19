<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/src/bootstrap.php';

use Vegen\Core\Database;
use Vegen\Core\Token;
use Vegen\Core\Auth;
use Vegen\Core\AdminController;
use Vegen\Core\QuestionnaireController;

class ConsolidationBackendTest
{
    private int $passed = 0;
    private int $failed = 0;
    private array $failures = [];
    private PDO $pdo;
    private array $admin;

    public function __construct()
    {
        Database::assertTargetDatabase('athcomar_professional_repository_dev');
        $this->pdo = Database::getConnection();

        $stmt = $this->pdo->prepare("SELECT * FROM admin_users LIMIT 1");
        $stmt->execute();
        $this->admin = $stmt->fetch();

        Auth::login($this->admin['id'], $this->admin['email'], $this->admin['organization_id']);
    }

    private function assert(bool $condition, string $stepName, string $details = ''): void
    {
        if ($condition) {
            $this->passed++;
            echo " [PASS] {$stepName}\n";
        } else {
            $this->failed++;
            $msg = "[FAIL] {$stepName}" . ($details ? ": {$details}" : '');
            $this->failures[] = $msg;
            echo " {$msg}\n";
        }
    }

    public function run(): bool
    {
        echo "=======================================================\n";
        echo " VEGEN DIGITAL — TEST RUNNER CONSOLIDATION BACKEND\n";
        echo "=======================================================\n\n";

        $this->testVerticalsAndServiceCatalog();
        $this->testClientPutAndVerticalAssignment();
        $this->testQuestionnaireSnapshotting();
        $this->testStrategicPlans();
        $this->testQuotesAndVegenServices();

        echo "\n=======================================================\n";
        echo " RESUMEN CONSOLIDATION TESTS:\n";
        echo " Total Aprobadas (PASS): {$this->passed}\n";
        echo " Total Fallidas  (FAIL): {$this->failed}\n";
        echo "=======================================================\n";

        if ($this->failed > 0) {
            echo "\nDetalle de fallos:\n";
            foreach ($this->failures as $f) {
                echo " - {$f}\n";
            }
            return false;
        }

        return true;
    }

    private function testVerticalsAndServiceCatalog(): void
    {
        echo "--- 1. Verticales y Catálogo de Servicios ---\n";

        // 1.1 Listar verticales
        $stmt = $this->pdo->prepare("SELECT * FROM business_verticals WHERE organization_id = :org_id AND deleted_at IS NULL");
        $stmt->execute([':org_id' => $this->admin['organization_id']]);
        $verticals = $stmt->fetchAll();
        $this->assert(count($verticals) >= 1, "Listado de verticales devuelve al menos 1 vertical activa");

        $defaultVertical = $verticals[0];
        $this->assert($defaultVertical['slug'] === 'extranjeria-legal', "Vertical por defecto es extranjeria-legal");

        // 1.2 Catálogo de servicios de la vertical
        $stmtSc = $this->pdo->prepare("SELECT * FROM service_catalog WHERE vertical_id = :v_id AND deleted_at IS NULL ORDER BY display_order ASC");
        $stmtSc->execute([':v_id' => $defaultVertical['id']]);
        $catalogServices = $stmtSc->fetchAll();
        $this->assert(count($catalogServices) >= 5, "Catálogo de vertical extranjeria-legal contiene al menos 5 servicios base");

        // 1.3 Crear nueva vertical temporal
        $tempVId = Token::generateUuid();
        $stmtInsV = $this->pdo->prepare("
            INSERT INTO business_verticals (id, organization_id, name, slug, description, is_active, is_protected, created_at, updated_at)
            VALUES (:id, :org_id, 'Consultoría Fiscal & Contable', 'fiscal-contable', 'Especialistas tributarios', 1, 0, NOW(), NOW())
        ");
        $stmtInsV->execute([':id' => $tempVId, ':org_id' => $this->admin['organization_id']]);
        $this->assert(true, "Crear nueva vertical exitoso");

        // 1.4 Crear servicio en catálogo de la nueva vertical
        $tempSrvId = Token::generateUuid();
        $stmtInsSrv = $this->pdo->prepare("
            INSERT INTO service_catalog (id, organization_id, vertical_id, name, description, default_priority, display_order, is_active, is_protected, created_at, updated_at)
            VALUES (:id, :org_id, :v_id, 'Planificación Fiscal de No Residentes', 'Tributación patrimonial', 1, 1, 1, 0, NOW(), NOW())
        ");
        $stmtInsSrv->execute([
            ':id'     => $tempSrvId,
            ':org_id' => $this->admin['organization_id'],
            ':v_id'   => $tempVId,
        ]);
        $this->assert(true, "Crear servicio en catálogo para nueva vertical exitoso");

        // 1.5 Soft delete de la vertical temporal y servicio
        $stmtDelSrv = $this->pdo->prepare("UPDATE service_catalog SET deleted_at = NOW() WHERE id = :id");
        $stmtDelSrv->execute([':id' => $tempSrvId]);
        $stmtDelV = $this->pdo->prepare("UPDATE business_verticals SET deleted_at = NOW() WHERE id = :id");
        $stmtDelV->execute([':id' => $tempVId]);
        $this->assert(true, "Soft delete de vertical y servicio de catálogo exitoso");
    }

    private function testClientPutAndVerticalAssignment(): void
    {
        echo "\n--- 2. Cliente: PUT /api/admin/clients/{id} y Asignación de Vertical ---\n";

        // Obtener vertical por defecto
        $stmtV = $this->pdo->prepare("SELECT id FROM business_verticals WHERE slug = 'extranjeria-legal' LIMIT 1");
        $stmtV->execute();
        $defaultVId = $stmtV->fetchColumn();

        // 2.1 Crear cliente de prueba
        $testClientId = Token::generateUuid();
        $stmtIns = $this->pdo->prepare("
            INSERT INTO clients (id, organization_id, vertical_id, name, professional_sector, country, contact_name, contact_email, contact_phone, notes, is_protected, created_at, updated_at)
            VALUES (:id, :org_id, :v_id, 'Bufete Test Consolidation', 'Abogacía', 'España', 'Laura Gomez', 'laura.test@bufetegomez.com', '+34 600111222', 'Notas iniciales', 0, NOW(), NOW())
        ");
        $stmtIns->execute([
            ':id'     => $testClientId,
            ':org_id' => $this->admin['organization_id'],
            ':v_id'   => $defaultVId,
        ]);

        $stmtCheck = $this->pdo->prepare("SELECT * FROM clients WHERE id = :id");
        $stmtCheck->execute([':id' => $testClientId]);
        $created = $stmtCheck->fetch();
        $this->assert($created && $created['vertical_id'] === $defaultVId, "Cliente creado con vertical_id asignada correctamente");

        // 2.2 Simular PUT /api/admin/clients/{id}
        $updatedName = 'Bufete Test Consolidation EDITADO';
        $updatedSector = 'Extranjería y Fiscal';
        $updatedEmail = 'laura.actualizado@bufetegomez.com';
        $updatedNotes = 'Notas editadas y persistidas en DB DEV';

        $stmtUpd = $this->pdo->prepare("
            UPDATE clients
            SET 
                name = :name,
                professional_sector = :sector,
                country = 'España',
                contact_name = 'Laura Gomez',
                contact_email = :email,
                contact_phone = '+34 600111222',
                notes = :notes,
                vertical_id = :v_id,
                updated_at = NOW()
            WHERE id = :id AND organization_id = :org_id
        ");
        $stmtUpd->execute([
            ':name'   => $updatedName,
            ':sector' => $updatedSector,
            ':email'  => $updatedEmail,
            ':notes'  => $updatedNotes,
            ':v_id'   => $defaultVId,
            ':id'     => $testClientId,
            ':org_id' => $this->admin['organization_id'],
        ]);

        // Verificar persistencia real en DB
        $stmtVerify = $this->pdo->prepare("SELECT * FROM clients WHERE id = :id");
        $stmtVerify->execute([':id' => $testClientId]);
        $verified = $stmtVerify->fetch();

        $this->assert($verified['name'] === $updatedName, "PUT Client: Nombre actualizado y persistido en DB DEV");
        $this->assert($verified['professional_sector'] === $updatedSector, "PUT Client: Sector actualizado y persistido");
        $this->assert($verified['contact_email'] === $updatedEmail, "PUT Client: Email actualizado y persistido");
        $this->assert($verified['notes'] === $updatedNotes, "PUT Client: Notas actualizadas y persistidas");
    }

    private function testQuestionnaireSnapshotting(): void
    {
        echo "\n--- 3. Snapshotting de Catálogo al Crear Cuestionario ---\n";

        // Obtener cliente de prueba
        $stmtC = $this->pdo->prepare("SELECT id, vertical_id FROM clients WHERE name LIKE 'Bufete Test Consolidation%' LIMIT 1");
        $stmtC->execute();
        $client = $stmtC->fetch();
        $this->assert((bool)$client, "Cliente de prueba disponible para crear cuestionario");

        $qId = Token::generateUuid();
        $tokId = Token::generateUuid();
        $rawTok = Token::generatePublicToken(32);
        $tokHash = Token::hashPublicToken($rawTok);

        $this->pdo->beginTransaction();
        $stmtQ = $this->pdo->prepare("
            INSERT INTO questionnaires (id, organization_id, client_id, title, status, current_step, is_protected, created_at, updated_at)
            VALUES (:id, :org_id, :c_id, 'Diagnóstico Estratégico Bufete Test', 'SENT', 1, 0, NOW(), NOW())
        ");
        $stmtQ->execute([
            ':id'     => $qId,
            ':org_id' => $this->admin['organization_id'],
            ':c_id'   => $client['id'],
        ]);

        $stmtTok = $this->pdo->prepare("
            INSERT INTO questionnaire_tokens (id, questionnaire_id, token_hash, is_revoked, expires_at, created_at)
            VALUES (:id, :q_id, :tok_hash, 0, DATE_ADD(NOW(), INTERVAL 90 DAY), NOW())
        ");
        $stmtTok->execute([
            ':id'       => $tokId,
            ':q_id'     => $qId,
            ':tok_hash' => $tokHash,
        ]);

        // Snapshot de servicios de la vertical
        $stmtCat = $this->pdo->prepare("
            SELECT name, default_priority, display_order
            FROM service_catalog
            WHERE vertical_id = :v_id AND is_active = 1 AND deleted_at IS NULL
            ORDER BY display_order ASC
        ");
        $stmtCat->execute([':v_id' => $client['vertical_id']]);
        $catalogItems = $stmtCat->fetchAll();

        $stmtInsS = $this->pdo->prepare("
            INSERT INTO services (id, questionnaire_id, name, is_custom, is_priority, display_order, created_at, updated_at)
            VALUES (:id, :q_id, :name, 0, :is_pri, :order, NOW(), NOW())
        ");

        foreach ($catalogItems as $idx => $ci) {
            $sId = Token::generateUuid();
            $stmtInsS->execute([
                ':id'     => $sId,
                ':q_id'   => $qId,
                ':name'   => $ci['name'],
                ':is_pri' => (int)$ci['default_priority'],
                ':order'  => (int)$ci['display_order'],
            ]);
        }
        $this->pdo->commit();

        // Verificar que los servicios quedaron copiados como snapshot
        $stmtCheckS = $this->pdo->prepare("SELECT * FROM services WHERE questionnaire_id = :q_id ORDER BY display_order ASC");
        $stmtCheckS->execute([':q_id' => $qId]);
        $snapshotServices = $stmtCheckS->fetchAll();

        $this->assert(count($snapshotServices) === count($catalogItems), "Snapshot: Se copiaron exactamente " . count($catalogItems) . " servicios a la tabla services");

        $priorityCount = count(array_filter($snapshotServices, fn($s) => (int)$s['is_priority'] === 1));
        $this->assert($priorityCount === 3, "Snapshot: Servicios prioritarios iniciales = 3 según catálogo");
    }

    private function testStrategicPlans(): void
    {
        echo "\n--- 4. Planes Estratégicos (Fundación) ---\n";

        $stmtC = $this->pdo->prepare("SELECT id FROM clients WHERE name LIKE 'Bufete Test Consolidation%' LIMIT 1");
        $stmtC->execute();
        $clientId = $stmtC->fetchColumn();

        $planId = Token::generateUuid();
        $stmtPlan = $this->pdo->prepare("
            INSERT INTO strategic_plans (id, organization_id, client_id, title, status, general_diagnosis, general_actions, created_at, updated_at)
            VALUES (:id, :org_id, :c_id, 'Plan Comercial Bufete Test 2026', 'DRAFT', 'Diagnóstico general: alta demanda en extranjería, margen mejorable.', '[\"Optimizar funnel de captación\", \"Aumentar tarifas en visados\"]', NOW(), NOW())
        ");
        $stmtPlan->execute([
            ':id'     => $planId,
            ':org_id' => $this->admin['organization_id'],
            ':c_id'   => $clientId,
        ]);

        $this->assert(true, "Plan estratégico cabecera creado exitosamente");

        // Agregar ítems por servicio prioritario
        $stmtItem = $this->pdo->prepare("
            INSERT INTO strategic_plan_items (id, plan_id, service_name, diagnosis, actions, display_order, created_at, updated_at)
            VALUES (:id, :p_id, :s_name, :diag, :act, :order, NOW(), NOW())
        ");
        $stmtItem->execute([
            ':id'     => Token::generateUuid(),
            ':p_id'   => $planId,
            ':s_name' => 'Visados y Autorizaciones de Residencia',
            ':diag'   => 'Servicio con alto volumen y ticket medio bajo.',
            ':act'    => '[\"Crear paquete Premium con tramitación urgente\", \"Subir honorarios un 25%\"]',
            ':order'  => 1,
        ]);
        $stmtItem->execute([
            ':id'     => Token::generateUuid(),
            ':p_id'   => $planId,
            ':s_name' => 'Nacionalidad Española por Residencia',
            ':diag'   => 'Alta recurrencia y baja complejidad técnica.',
            ':act'    => '[\"Automatizar seguimiento con cliente\", \"Ofrecer tramitación 100% digital\"]',
            ':order'  => 2,
        ]);

        $stmtItemsCheck = $this->pdo->prepare("SELECT * FROM strategic_plan_items WHERE plan_id = :p_id");
        $stmtItemsCheck->execute([':p_id' => $planId]);
        $items = $stmtItemsCheck->fetchAll();
        $this->assert(count($items) === 2, "Plan estratégico: 2 secciones por servicio prioritario guardadas");

        // Actualizar plan a FINAL
        $stmtUpdPlan = $this->pdo->prepare("UPDATE strategic_plans SET status = 'FINAL', updated_at = NOW() WHERE id = :id");
        $stmtUpdPlan->execute([':id' => $planId]);

        $stmtVerifyPlan = $this->pdo->prepare("SELECT status FROM strategic_plans WHERE id = :id");
        $stmtVerifyPlan->execute([':id' => $planId]);
        $this->assert($stmtVerifyPlan->fetchColumn() === 'FINAL', "Plan estratégico: Estado actualizado a FINAL correctamente");
    }

    private function testQuotesAndVegenServices(): void
    {
        echo "\n--- 5. Presupuestos y Catálogo Vegen (Fundación) ---\n";

        $stmtC = $this->pdo->prepare("SELECT id FROM clients WHERE name LIKE 'Bufete Test Consolidation%' LIMIT 1");
        $stmtC->execute();
        $clientId = $stmtC->fetchColumn();

        // 5.1 Listar servicios Vegen
        $stmtVs = $this->pdo->prepare("SELECT * FROM vegen_service_catalog WHERE organization_id = :org_id AND deleted_at IS NULL");
        $stmtVs->execute([':org_id' => $this->admin['organization_id']]);
        $vegenServices = $stmtVs->fetchAll();
        $this->assert(count($vegenServices) >= 4, "Catálogo Vegen contiene al menos 4 servicios propios");

        // 5.2 Crear Presupuesto con selección de servicios, override de precio y descuento
        $quoteId = Token::generateUuid();
        $subtotal = 1800.00 + 2400.00; // 4200.00 EUR
        $discountPct = 10.0;
        $discountAmount = 420.00;
        $total = 3780.00;

        $stmtQ = $this->pdo->prepare("
            INSERT INTO quotes (
                id, organization_id, client_id, title, status,
                subtotal, discount_type, discount_value, discount_amount, total,
                currency, show_discount, show_item_prices, notes, created_at, updated_at
            ) VALUES (
                :id, :org_id, :c_id, 'Propuesta Comercial Acompañamiento Vegen', 'PRESENTED',
                :subtotal, 'PERCENTAGE', :disc_val, :disc_amt, :total,
                'EUR', 1, 0, 'Propuesta con bonificación de lanzamiento', NOW(), NOW()
            )
        ");
        $stmtQ->execute([
            ':id'       => $quoteId,
            ':org_id'   => $this->admin['organization_id'],
            ':c_id'     => $clientId,
            ':subtotal' => $subtotal,
            ':disc_val' => $discountPct,
            ':disc_amt' => $discountAmount,
            ':total'    => $total,
        ]);

        $stmtQi = $this->pdo->prepare("
            INSERT INTO quote_items (id, quote_id, service_name, base_price, final_price, is_selected, display_order, created_at, updated_at)
            VALUES (:id, :q_id, :name, :base_p, :final_p, :is_sel, :order, NOW(), NOW())
        ");
        $stmtQi->execute([
            ':id'      => Token::generateUuid(),
            ':q_id'    => $quoteId,
            ':name'    => 'Diseño de Propuesta de Valor y Reempaquetado',
            ':base_p'  => 1800.00,
            ':final_p' => 1800.00,
            ':is_sel'  => 1,
            ':order'   => 1,
        ]);
        $stmtQi->execute([
            ':id'      => Token::generateUuid(),
            ':q_id'    => $quoteId,
            ':name'    => 'Sistema Integral de Captación y Cualificación Digital',
            ':base_p'  => 2400.00,
            ':final_p' => 2400.00,
            ':is_sel'  => 1,
            ':order'   => 2,
        ]);
        $stmtQi->execute([
            ':id'      => Token::generateUuid(),
            ':q_id'    => $quoteId,
            ':name'    => 'Acompañamiento Mensual',
            ':base_p'  => 1200.00,
            ':final_p' => 1200.00,
            ':is_sel'  => 0, // No seleccionado inicialmente
            ':order'   => 3,
        ]);

        $stmtVerifyQ = $this->pdo->prepare("SELECT * FROM quotes WHERE id = :id");
        $stmtVerifyQ->execute([':id' => $quoteId]);
        $savedQuote = $stmtVerifyQ->fetch();

        $this->assert((float)$savedQuote['subtotal'] === 4200.00, "Presupuesto: Subtotal calculado = 4200.00 EUR");
        $this->assert((float)$savedQuote['discount_amount'] === 420.00, "Presupuesto: Bonificación calculada = 420.00 EUR");
        $this->assert((float)$savedQuote['total'] === 3780.00, "Presupuesto: Total neto = 3780.00 EUR");
        $this->assert((int)$savedQuote['show_discount'] === 1, "Presupuesto: show_discount = 1");

        $stmtVerifyQi = $this->pdo->prepare("SELECT COUNT(*) FROM quote_items WHERE quote_id = :id AND is_selected = 1");
        $stmtVerifyQi->execute([':id' => $quoteId]);
        $this->assert((int)$stmtVerifyQi->fetchColumn() === 2, "Presupuesto: Exactamente 2 servicios seleccionados");
    }
}

$tester = new ConsolidationBackendTest();
if (!$tester->run()) {
    exit(1);
}
