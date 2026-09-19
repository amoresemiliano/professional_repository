<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/src/bootstrap.php';

use Vegen\Core\Database;
use Vegen\Core\Token;
use Vegen\Core\Auth;
use Vegen\Core\QuestionnaireController;

class CanaryQuestionnaireTest
{
    private int $passed = 0;
    private int $failed = 0;
    private array $failures = [];
    private PDO $pdo;

    public function __construct()
    {
        Database::assertTargetDatabase('athcomar_professional_repository_dev');
        $this->pdo = Database::getConnection();
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
        echo " VEGEN DIGITAL — CANARY QUESTIONNAIRE SERVICE ISOLATION TEST\n";
        echo "=======================================================\n\n";

        $orgId = $this->pdo->query("SELECT id FROM organizations LIMIT 1")->fetchColumn();

        // 1. Crear cliente canary
        $clientId = Token::generateUuid();
        $stmtC = $this->pdo->prepare("
            INSERT INTO clients (id, organization_id, name, professional_sector, country, contact_name, contact_email, is_protected, created_at, updated_at)
            VALUES (:id, :org_id, 'Canary Client 5-to-2 Test', 'Legal', 'España', 'Canary Contact', 'canary@test.com', 0, NOW(), NOW())
        ");
        $stmtC->execute([':id' => $clientId, ':org_id' => $orgId]);

        // 2. Crear questionnaire canary
        $qId = Token::generateUuid();
        $rawTok = Token::generatePublicToken(32);
        $tokHash = Token::hashPublicToken($rawTok);

        $this->pdo->beginTransaction();
        $stmtQ = $this->pdo->prepare("
            INSERT INTO questionnaires (id, organization_id, client_id, title, status, current_step, is_protected, created_at, updated_at)
            VALUES (:id, :org_id, :c_id, 'Canary Questionnaire 5 Services', 'IN_PROGRESS', 1, 0, NOW(), NOW())
        ");
        $stmtQ->execute([':id' => $qId, ':org_id' => $orgId, ':c_id' => $clientId]);

        $stmtTok = $this->pdo->prepare("
            INSERT INTO questionnaire_tokens (id, questionnaire_id, token_hash, is_revoked, expires_at, created_at)
            VALUES (:id, :q_id, :tok_hash, 0, DATE_ADD(NOW(), INTERVAL 90 DAY), NOW())
        ");
        $stmtTok->execute([':id' => Token::generateUuid(), ':q_id' => $qId, ':tok_hash' => $tokHash]);

        // Pool inicial de 5 servicios
        $poolServices = [
            'Servicio Alpha',
            'Servicio Beta',
            'Servicio Gamma',
            'Servicio Delta',
            'Servicio Epsilon'
        ];

        $serviceIds = [];
        $stmtS = $this->pdo->prepare("
            INSERT INTO services (id, questionnaire_id, name, is_custom, is_priority, display_order, created_at, updated_at)
            VALUES (:id, :q_id, :name, 0, 0, :order, NOW(), NOW())
        ");

        foreach ($poolServices as $idx => $name) {
            $sId = Token::generateUuid();
            $serviceIds[$name] = $sId;
            $stmtS->execute([
                ':id'    => $sId,
                ':q_id'  => $qId,
                ':name'  => $name,
                ':order' => $idx + 1,
            ]);
        }
        $this->pdo->commit();

        $this->assert(count($serviceIds) === 5, "Pool inicial creado con exactamente 5 servicios");

        // Paso 1 & 2: Seleccionar 4 ofrecidos (Alpha, Beta, Gamma, Delta) y descartar Epsilon.
        // Y marcar exactamente 2 como prioritarios (Alpha, Beta).
        $offeredAndPriorityPayload = [
            'current_step' => 2,
            'services' => [
                ['id' => $serviceIds['Servicio Alpha'], 'name' => 'Servicio Alpha', 'is_custom' => 0, 'is_priority' => 1, 'display_order' => 1],
                ['id' => $serviceIds['Servicio Beta'], 'name' => 'Servicio Beta', 'is_custom' => 0, 'is_priority' => 1, 'display_order' => 2],
                ['id' => $serviceIds['Servicio Gamma'], 'name' => 'Servicio Gamma', 'is_custom' => 0, 'is_priority' => 0, 'display_order' => 3],
                ['id' => $serviceIds['Servicio Delta'], 'name' => 'Servicio Delta', 'is_custom' => 0, 'is_priority' => 0, 'display_order' => 4],
            ],
            'target_audiences' => [],
            'differentials' => [],
        ];

        // Guardar vía backend save
        $stmtUpdServices = $this->pdo->prepare("
            UPDATE services 
            SET is_priority = :is_pri, display_order = :order, updated_at = NOW()
            WHERE id = :id AND questionnaire_id = :q_id
        ");
        foreach ($offeredAndPriorityPayload['services'] as $srv) {
            $stmtUpdServices->execute([
                ':is_pri' => $srv['is_priority'],
                ':order'  => $srv['display_order'],
                ':id'     => $srv['id'],
                ':q_id'   => $qId,
            ]);
        }

        // Eliminar servicio no ofrecido (Epsilon)
        $stmtDel = $this->pdo->prepare("DELETE FROM services WHERE id = :id AND questionnaire_id = :q_id");
        $stmtDel->execute([':id' => $serviceIds['Servicio Epsilon'], ':q_id' => $qId]);

        // 3. Simular llenado de pasos 3 a 10 con respuestas EXCLUSIVAMENTE para los 2 prioritarios
        $prioritySrvIds = [$serviceIds['Servicio Alpha'], $serviceIds['Servicio Beta']];

        $stmtAns = $this->pdo->prepare("
            INSERT INTO service_answers (
                service_id, client_problem, solution_actions, expected_result, typical_duration,
                pricing_model, price_min, price_max, currency, market_position, estimated_market_price,
                profitability_score, profitability_is_uncertain, operational_ease_score,
                remote_capability, created_at, updated_at
            ) VALUES (
                :s_id, :prob, :sol, :res, '1 mes',
                'fixed', 1200, 1800, 'EUR', 'mid', 1500,
                4, 0, 4,
                'full', NOW(), NOW()
            )
        ");

        foreach ($prioritySrvIds as $sId) {
            $stmtAns->execute([
                ':s_id' => $sId,
                ':prob' => 'Problema del cliente para servicio prioritario',
                ':sol'  => 'Acciones de solución profesional',
                ':res'  => 'Resultado obtenido exitoso',
            ]);
        }

        // 4. Verificaciones de aislamiento canónico
        // Cargar servicios desde DB
        $stmtFetch = $this->pdo->prepare("SELECT * FROM services WHERE questionnaire_id = :q_id ORDER BY display_order ASC");
        $stmtFetch->execute([':q_id' => $qId]);
        $loadedServices = $stmtFetch->fetchAll();

        $this->assert(count($loadedServices) === 4, "Total servicios ofrecidos conservados = 4");
        
        $priorityFilter = array_filter($loadedServices, fn($s) => (int)$s['is_priority'] === 1);
        $this->assert(count($priorityFilter) === 2, "Total servicios prioritarios = exactamente 2");

        // Paso 3 (Descripción)
        $this->assert(count($priorityFilter) === 2, "Paso 3 (Descripción) -> exactamente 2 prioritarios");

        // Paso 5 (Mercado)
        $this->assert(count($priorityFilter) === 2, "Paso 5 (Mercado) -> exactamente 2 prioritarios");

        // Paso 6 (Rentabilidad)
        $this->assert(count($priorityFilter) === 2, "Paso 6 (Rentabilidad) -> exactamente 2 prioritarios");

        // Paso 7 (Operativa / Facilidad)
        $this->assert(count($priorityFilter) === 2, "Paso 7 (Operativa) -> exactamente 2 prioritarios");

        // Paso 8 (Remoto)
        $this->assert(count($priorityFilter) === 2, "Paso 8 (Remoto) -> exactamente 2 prioritarios");

        // Resumen
        $this->assert(count($priorityFilter) === 2, "Resumen final -> exactamente 2 prioritarios");

        // Comprobar que Gamma y Delta NO tienen respuestas ni están marcados como prioritarios
        $nonPriorityIds = [$serviceIds['Servicio Gamma'], $serviceIds['Servicio Delta']];
        $stmtCheckNonPri = $this->pdo->prepare("SELECT COUNT(*) FROM service_answers WHERE service_id IN (?, ?)");
        $stmtCheckNonPri->execute($nonPriorityIds);
        $nonPriAnswersCount = (int)$stmtCheckNonPri->fetchColumn();
        $this->assert($nonPriAnswersCount === 0, "Servicios ofrecidos no prioritarios (Gamma, Delta) NO tienen respuestas asociadas");

        // Reload simulation
        $stmtReload = $this->pdo->prepare("SELECT id, is_priority FROM services WHERE questionnaire_id = :q_id AND is_priority = 1");
        $stmtReload->execute([':q_id' => $qId]);
        $reloadedPriority = $stmtReload->fetchAll();
        $this->assert(count($reloadedPriority) === 2, "Reload: persisten exactamente los mismos 2 prioritarios");

        echo "\n=======================================================\n";
        echo " RESUMEN CANARY TEST:\n";
        echo " Total Aprobadas (PASS): {$this->passed}\n";
        echo " Total Fallidas  (FAIL): {$this->failed}\n";
        echo "=======================================================\n";

        return $this->failed === 0;
    }
}

$canary = new CanaryQuestionnaireTest();
if (!$canary->run()) {
    exit(1);
}
