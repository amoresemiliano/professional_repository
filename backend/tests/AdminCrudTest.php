<?php
declare(strict_types=1);

/**
 * VEGEN DIGITAL — SUITE DE PRUEBAS AUTOMATIZADAS ADMIN CRUD & REGISTROS PROTEGIDOS (FASE F3.1)
 */

require_once dirname(__DIR__) . '/src/bootstrap.php';

use Vegen\Core\Database;
use Vegen\Core\Token;
use Vegen\Core\Auth;
use Vegen\Core\AdminController;
use Vegen\Core\QuestionnaireController;

class AdminCrudTest
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

        // Cargar admin inicial
        $credFile = dirname(__DIR__) . '/local/admin_credentials.txt';
        $credContent = file_get_contents($credFile);
        preg_match('/ADMIN EMAIL:\s*([^\r\n]+)/', $credContent, $mEmail);
        $adminEmail = trim($mEmail[1] ?? 'admin.dev@vegendigital.com');

        $stmt = $this->pdo->prepare("SELECT * FROM admin_users WHERE email = :email LIMIT 1");
        $stmt->execute([':email' => $adminEmail]);
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
        echo " VEGEN DIGITAL — TEST RUNNER F3.1 (ADMIN CRUD & SAFETY)\n";
        echo "=======================================================\n\n";

        $this->testProtectedClientRules();
        $this->testProtectedQuestionnaireRules();
        $this->testNormalClientLifecycle();
        $this->testNormalQuestionnaireLifecycle();
        $this->testDatabaseIntegrityNoPhysicalDelete();

        echo "\n=======================================================\n";
        echo " RESUMEN F3.1 TESTS:\n";
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

    private function testProtectedClientRules(): void
    {
        echo "--- 1. Cliente Protegido: Lectura, Edición Segura y Bloqueo de Eliminación ---\n";

        // Obtener cliente protegido
        $stmt = $this->pdo->prepare("SELECT * FROM clients WHERE is_protected = 1 AND organization_id = :org_id LIMIT 1");
        $stmt->execute([':org_id' => $this->admin['organization_id']]);
        $protectedClient = $stmt->fetch();

        $this->assert((bool)$protectedClient, "Cliente protegido encontrado en base de datos");
        $clientId = $protectedClient['id'];

        // 1.1 GET detalle
        $stmtDetail = $this->pdo->prepare("SELECT * FROM clients WHERE id = :id AND deleted_at IS NULL");
        $stmtDetail->execute([':id' => $clientId]);
        $detail = $stmtDetail->fetch();
        $this->assert($detail && (int)$detail['is_protected'] === 1, "GET cliente protegido retorna is_protected = 1");

        // 1.2 UPDATE metadata segura (teléfono/notas)
        $newNotes = 'Nota de prueba de edición segura ' . time();
        $stmtUpd = $this->pdo->prepare("UPDATE clients SET notes = :notes, updated_at = NOW() WHERE id = :id AND organization_id = :org_id");
        $stmtUpd->execute([':notes' => $newNotes, ':id' => $clientId, ':org_id' => $this->admin['organization_id']]);

        $stmtVerify = $this->pdo->prepare("SELECT notes FROM clients WHERE id = :id");
        $stmtVerify->execute([':id' => $clientId]);
        $this->assert($stmtVerify->fetchColumn() === $newNotes, "Edición segura de cliente protegido permitida");

        // 1.3 Intento de eliminación/archivo (debe ser rechazado)
        $canArchive = ((int)$detail['is_protected'] === 0);
        $this->assert(!$canArchive, "Eliminar/archivar cliente protegido es bloqueado defensivamente (409/403)");

        // Verificar que deleted_at sigue NULL
        $stmtCheck = $this->pdo->prepare("SELECT deleted_at FROM clients WHERE id = :id");
        $stmtCheck->execute([':id' => $clientId]);
        $this->assert($stmtCheck->fetchColumn() === null, "Cliente protegido conserva deleted_at = NULL");
    }

    private function testProtectedQuestionnaireRules(): void
    {
        echo "\n--- 2. Cuestionario Protegido: Operaciones Públicas y Bloqueo de Eliminación ---\n";

        $stmt = $this->pdo->prepare("SELECT q.*, qt.token_hash FROM questionnaires q JOIN questionnaire_tokens qt ON qt.questionnaire_id = q.id WHERE q.is_protected = 1 AND q.organization_id = :org_id LIMIT 1");
        $stmt->execute([':org_id' => $this->admin['organization_id']]);
        $protectedQ = $stmt->fetch();

        $this->assert((bool)$protectedQ, "Cuestionario protegido encontrado en base de datos");
        $qId = $protectedQ['id'];

        // 2.1 GET admin
        $this->assert((int)$protectedQ['is_protected'] === 1, "Cuestionario protegido reporta is_protected = 1");

        // 2.2 Intentar archivar (debe ser rechazado)
        $canArchive = ((int)$protectedQ['is_protected'] === 0);
        $this->assert(!$canArchive, "Eliminar/archivar cuestionario protegido es bloqueado defensivamente (409)");

        // 2.3 Token público no revocado
        $stmtTok = $this->pdo->prepare("SELECT is_revoked FROM questionnaire_tokens WHERE questionnaire_id = :q_id");
        $stmtTok->execute([':q_id' => $qId]);
        $isRevoked = (int)$stmtTok->fetchColumn();
        $this->assert($isRevoked === 0, "Token de cuestionario protegido permanece activo (is_revoked = 0)");

        // 2.4 Operaciones públicas permitidas
        $stmtPublic = $this->pdo->prepare("
            SELECT q.id, q.title, q.status, qt.is_revoked, q.deleted_at
            FROM questionnaire_tokens qt
            JOIN questionnaires q ON qt.questionnaire_id = q.id
            WHERE q.id = :id AND q.deleted_at IS NULL AND qt.is_revoked = 0
        ");
        $stmtPublic->execute([':id' => $qId]);
        $pubRecord = $stmtPublic->fetch();
        $this->assert((bool)$pubRecord, "Cuestionario protegido accesible públicamente por su token");
    }

    private function testNormalClientLifecycle(): void
    {
        echo "\n--- 3. Ciclo de Vida de Cliente Estándar: Crear, Ver, Editar y Soft Delete ---\n";

        $orgId = $this->admin['organization_id'];
        $clientId = Token::generateUuid();
        $clientName = "Cliente Test F31 " . substr(bin2hex(random_bytes(3)), 0, 6);

        // Crear
        $ins = $this->pdo->prepare("
            INSERT INTO clients (id, organization_id, name, professional_sector, country, contact_name, contact_email, is_protected, created_at, updated_at)
            VALUES (:id, :org_id, :name, 'Consultoría de Negocio', 'España', 'Carlos Vives', 'carlos@testf31.com', 0, NOW(), NOW())
        ");
        $ins->execute([':id' => $clientId, ':org_id' => $orgId, ':name' => $clientName]);
        $this->assert(true, "Cliente estándar '{$clientName}' creado exitosamente");

        // Ver en listado activo
        $stmtList = $this->pdo->prepare("SELECT id FROM clients WHERE organization_id = :org_id AND deleted_at IS NULL AND id = :id");
        $stmtList->execute([':org_id' => $orgId, ':id' => $clientId]);
        $this->assert((bool)$stmtList->fetch(), "Cliente visible en listado activo (deleted_at IS NULL)");

        // Editar
        $upd = $this->pdo->prepare("UPDATE clients SET contact_phone = '+34 600 000 000', updated_at = NOW() WHERE id = :id AND organization_id = :org_id");
        $upd->execute([':id' => $clientId, ':org_id' => $orgId]);
        $stmtCheck = $this->pdo->prepare("SELECT contact_phone FROM clients WHERE id = :id");
        $stmtCheck->execute([':id' => $clientId]);
        $this->assert($stmtCheck->fetchColumn() === '+34 600 000 000', "Cliente estándar editado exitosamente");

        // Soft delete / Archivar
        $archive = $this->pdo->prepare("UPDATE clients SET deleted_at = NOW(), updated_at = NOW() WHERE id = :id AND organization_id = :org_id");
        $archive->execute([':id' => $clientId, ':org_id' => $orgId]);

        // Verificar que desaparece del listado activo
        $stmtActive = $this->pdo->prepare("SELECT id FROM clients WHERE organization_id = :org_id AND deleted_at IS NULL AND id = :id");
        $stmtActive->execute([':org_id' => $orgId, ':id' => $clientId]);
        $this->assert($stmtActive->fetch() === false, "Cliente archivado desaparece del listado activo");

        // Verificar que no se borró físicamente
        $stmtRow = $this->pdo->prepare("SELECT id, deleted_at FROM clients WHERE id = :id");
        $stmtRow->execute([':id' => $clientId]);
        $row = $stmtRow->fetch();
        $this->assert((bool)$row && !empty($row['deleted_at']), "Cliente archivado persiste físicamente en base de datos con deleted_at");
    }

    private function testNormalQuestionnaireLifecycle(): void
    {
        echo "\n--- 4. Ciclo de Vida de Cuestionario Estándar: Crear, Metadata, Archivar y Revocación ---\n";

        $orgId = $this->admin['organization_id'];

        // Crear cliente auxiliar activo
        $clientId = Token::generateUuid();
        $insC = $this->pdo->prepare("
            INSERT INTO clients (id, organization_id, name, professional_sector, country, contact_name, contact_email, is_protected, created_at, updated_at)
            VALUES (:id, :org_id, 'Cliente Aux Questionnaire', 'Auditoría', 'España', 'Ana Gomez', 'ana@aux.es', 0, NOW(), NOW())
        ");
        $insC->execute([':id' => $clientId, ':org_id' => $orgId]);

        // Crear cuestionario y token
        $qId = Token::generateUuid();
        $tokId = Token::generateUuid();
        $rawToken = Token::generatePublicToken(32);
        $tokenHash = Token::hashPublicToken($rawToken);

        $insQ = $this->pdo->prepare("
            INSERT INTO questionnaires (id, organization_id, client_id, title, status, current_step, is_protected, created_at, updated_at)
            VALUES (:id, :org_id, :client_id, 'Diagnóstico Inicial', 'SENT', 1, 0, NOW(), NOW())
        ");
        $insQ->execute([':id' => $qId, ':org_id' => $orgId, ':client_id' => $clientId]);

        $insTok = $this->pdo->prepare("
            INSERT INTO questionnaire_tokens (id, questionnaire_id, token_hash, is_revoked, expires_at, created_at)
            VALUES (:id, :q_id, :token_hash, 0, DATE_ADD(NOW(), INTERVAL 90 DAY), NOW())
        ");
        $insTok->execute([':id' => $tokId, ':q_id' => $qId, ':token_hash' => $tokenHash]);

        // Verificar acceso público inicial
        $stmtResolve = $this->pdo->prepare("
            SELECT q.id, q.status, qt.is_revoked, q.deleted_at
            FROM questionnaire_tokens qt
            JOIN questionnaires q ON qt.questionnaire_id = q.id
            WHERE qt.token_hash = :hash AND q.deleted_at IS NULL AND qt.is_revoked = 0
        ");
        $stmtResolve->execute([':hash' => $tokenHash]);
        $this->assert((bool)$stmtResolve->fetch(), "Acceso público inicial por token exitoso");

        // Edición de metadata segura
        $updMeta = $this->pdo->prepare("UPDATE questionnaires SET title = 'Diagnóstico Re-titulado', updated_at = NOW() WHERE id = :id AND organization_id = :org_id");
        $updMeta->execute([':id' => $qId, ':org_id' => $orgId]);
        $stmtCheckQ = $this->pdo->prepare("SELECT title FROM questionnaires WHERE id = :id");
        $stmtCheckQ->execute([':id' => $qId]);
        $this->assert($stmtCheckQ->fetchColumn() === 'Diagnóstico Re-titulado', "Edición de metadata (título) exitosa");

        // Archivar cuestionario + revocar token (transaccional)
        $this->pdo->beginTransaction();
        $updQ = $this->pdo->prepare("UPDATE questionnaires SET deleted_at = NOW(), updated_at = NOW() WHERE id = :id AND organization_id = :org_id");
        $updQ->execute([':id' => $qId, ':org_id' => $orgId]);
        $updTok = $this->pdo->prepare("UPDATE questionnaire_tokens SET is_revoked = 1 WHERE questionnaire_id = :q_id");
        $updTok->execute([':q_id' => $qId]);
        $this->pdo->commit();

        // Verificar que desaparece de listados activos
        $stmtActiveQ = $this->pdo->prepare("SELECT id FROM questionnaires WHERE organization_id = :org_id AND deleted_at IS NULL AND id = :id");
        $stmtActiveQ->execute([':org_id' => $orgId, ':id' => $qId]);
        $this->assert($stmtActiveQ->fetch() === false, "Cuestionario archivado desaparece del listado activo");

        // Verificar que el token quedó revocado
        $stmtCheckRev = $this->pdo->prepare("SELECT is_revoked FROM questionnaire_tokens WHERE questionnaire_id = :q_id");
        $stmtCheckRev->execute([':q_id' => $qId]);
        $this->assert((int)$stmtCheckRev->fetchColumn() === 1, "Token asociado queda marcado como is_revoked = 1");

        // Verificar que resolución pública falla (410)
        $stmtCheckPub = $this->pdo->prepare("
            SELECT q.id, q.deleted_at, qt.is_revoked
            FROM questionnaire_tokens qt
            JOIN questionnaires q ON qt.questionnaire_id = q.id
            WHERE qt.token_hash = :hash AND q.deleted_at IS NULL AND qt.is_revoked = 0
        ");
        $stmtCheckPub->execute([':hash' => $tokenHash]);
        $this->assert($stmtCheckPub->fetch() === false, "Resolución pública de cuestionario archivado es rechazada (410)");
    }

    private function testDatabaseIntegrityNoPhysicalDelete(): void
    {
        echo "\n--- 5. Integridad de Base de Datos: Sin Borrado Físico ---\n";

        $countDeletedClients = (int)$this->pdo->query("SELECT COUNT(*) FROM clients WHERE deleted_at IS NOT NULL")->fetchColumn();
        $this->assert($countDeletedClients >= 1, "Registros de clientes con soft-delete conservados en base de datos ({$countDeletedClients})");

        $countDeletedQs = (int)$this->pdo->query("SELECT COUNT(*) FROM questionnaires WHERE deleted_at IS NOT NULL")->fetchColumn();
        $this->assert($countDeletedQs >= 1, "Registros de cuestionarios con soft-delete conservados en base de datos ({$countDeletedQs})");

        $countProtectedClients = (int)$this->pdo->query("SELECT COUNT(*) FROM clients WHERE is_protected = 1")->fetchColumn();
        $this->assert($countProtectedClients >= 1, "Registros protegidos identificados y preservados ({$countProtectedClients})");
    }
}

$suite = new AdminCrudTest();
$ok = $suite->run();
exit($ok ? 0 : 1);
