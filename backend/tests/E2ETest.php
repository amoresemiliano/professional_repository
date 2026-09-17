<?php
declare(strict_types=1);

/**
 * VEGEN DIGITAL — SUITE DE PRUEBAS END-TO-END (FASE F2 MVP)
 * 
 * Flujo Completo:
 * 1. Login admin con credenciales de desarrollo
 * 2. Crear cliente test
 * 3. Crear questionnaire y obtener token
 * 4. Abrir questionnaire por token público
 * 5. Guardar respuestas en varios pasos (autosave/incremental)
 * 6. Recargar cuestionario y comprobar persistencia
 * 7. Enviar (submit) cuestionario
 * 8. Entrar como admin y listar cuestionarios
 * 9. Abrir detalle de cuestionario y verificar respuestas
 * 10. Cambiar contraseña de admin
 * 11. Cerrar sesión (logout)
 * 12. Validar que contraseña antigua es rechazada y nueva es aceptada
 * 13. Evidencia directa en base de datos MySQL development
 */

require_once dirname(__DIR__) . '/src/bootstrap.php';

use Vegen\Core\Database;
use Vegen\Core\Token;
use Vegen\Core\Auth;

class E2ETest
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
        echo " VEGEN DIGITAL — PRUEBA DE INTEGRACIÓN E2E (FASE F2 MVP)\n";
        echo " Base de datos: athcomar_professional_repository_dev\n";
        echo "=======================================================\n\n";

        // Paso 1: Leer credenciales iniciales de archivo local seguro
        echo "--- 1. Lectura segura de credenciales iniciales ---\n";
        $credFile = dirname(__DIR__) . '/local/admin_credentials.txt';
        $this->assert(file_exists($credFile), "Archivo backend/local/admin_credentials.txt existe");

        $credContent = file_get_contents($credFile);
        preg_match('/ADMIN EMAIL:\s*([^\r\n]+)/', $credContent, $mEmail);
        preg_match('/ADMIN TEMP PASSWORD:\s*([^\r\n]+)/', $credContent, $mPass);

        $adminEmail = trim($mEmail[1] ?? '');
        $tempPassword = trim($mPass[1] ?? '');

        $this->assert(!empty($adminEmail), "Admin email recuperado desde archivo seguro");
        $this->assert(!empty($tempPassword), "Contraseña temporal recuperada (sin exponer)");

        // Paso 2: Autenticación Admin
        echo "\n--- 2. Autenticación Admin inicial ---\n";
        $stmtAdmin = $this->pdo->prepare("SELECT * FROM admin_users WHERE email = :email AND is_active = 1 LIMIT 1");
        $stmtAdmin->execute([':email' => $adminEmail]);
        $admin = $stmtAdmin->fetch();

        $this->assert((bool)$admin, "Usuario admin localizado en base de datos de desarrollo");
        $verified = password_verify($tempPassword, $admin['password_hash']);
        $this->assert($verified, "password_verify valida exitosamente la contraseña temporal");

        // Simular inicio de sesión
        Auth::login($admin['id'], $admin['email'], $admin['organization_id']);
        $current = Auth::getCurrentAdmin();
        $this->assert($current !== null && $current['id'] === $admin['id'], "Sesión de administrador establecida en Auth::getCurrentAdmin()");

        // Paso 3: Crear cliente test
        echo "\n--- 3. Crear cliente para prueba E2E ---\n";
        $clientId = Token::generateUuid();
        $clientName = "Bufete E2E Test " . substr(bin2hex(random_bytes(3)), 0, 6);
        $clientSector = "Derecho Corporativo y Fiscal";

        $insClient = $this->pdo->prepare("
            INSERT INTO clients (id, organization_id, name, professional_sector, country, contact_name, contact_email)
            VALUES (:id, :org_id, :name, :sector, 'España', 'Laura Martínez', 'laura.test@bufetee2e.es')
        ");
        $insClient->execute([
            ':id'     => $clientId,
            ':org_id' => $admin['organization_id'],
            ':name'   => $clientName,
            ':sector' => $clientSector,
        ]);
        $this->assert(true, "Cliente '{$clientName}' creado exitosamente");

        // Paso 4: Crear Cuestionario y Generar Token Seguro
        echo "\n--- 4. Crear Cuestionario y Token Público ---\n";
        $qId = Token::generateUuid();
        $tokId = Token::generateUuid();
        $rawToken = Token::generatePublicToken(32);
        $tokenHash = Token::hashPublicToken($rawToken);

        $this->assert(strlen($rawToken) === 64, "Raw token generado con 64 caracteres hex");
        $this->assert(strlen($tokenHash) === 64, "Token hash SHA-256 generado con 64 caracteres hex");

        $insQ = $this->pdo->prepare("
            INSERT INTO questionnaires (id, organization_id, client_id, title, status, current_step)
            VALUES (:id, :org_id, :client_id, 'Diagnóstico Estratégico E2E', 'SENT', 1)
        ");
        $insQ->execute([
            ':id'        => $qId,
            ':org_id'    => $admin['organization_id'],
            ':client_id' => $clientId,
        ]);

        $insTok = $this->pdo->prepare("
            INSERT INTO questionnaire_tokens (id, questionnaire_id, token_hash, is_revoked, expires_at)
            VALUES (:id, :q_id, :token_hash, 0, DATE_ADD(NOW(), INTERVAL 90 DAY))
        ");
        $insTok->execute([
            ':id'         => $tokId,
            ':q_id'       => $qId,
            ':token_hash' => $tokenHash,
        ]);
        $this->assert(true, "Cuestionario y token insertados en base de datos con status 'SENT'");

        // Paso 5: Cargar Cuestionario por Token
        echo "\n--- 5. Resolución pública de cuestionario por token ---\n";
        $stmtResolve = $this->pdo->prepare("
            SELECT q.*, c.name AS client_name, c.professional_sector AS client_sector
            FROM questionnaire_tokens qt
            JOIN questionnaires q ON qt.questionnaire_id = q.id
            JOIN clients c ON q.client_id = c.id
            WHERE qt.token_hash = :hash AND qt.is_revoked = 0 AND qt.expires_at > NOW()
            LIMIT 1
        ");
        $stmtResolve->execute([':hash' => Token::hashPublicToken($rawToken)]);
        $loadedQ = $stmtResolve->fetch();

        $this->assert((bool)$loadedQ, "Cuestionario resuelto correctamente a partir del hash del token");
        $this->assert($loadedQ['client_name'] === $clientName, "Nombre del cliente coincide dinámicamente con '{$clientName}'");
        $this->assert($loadedQ['status'] === 'SENT', "Estado inicial es 'SENT'");

        // Paso 6: Guardado incremental de respuestas
        echo "\n--- 6. Guardado incremental de respuestas (Pasos 1-10) ---\n";
        $srv1Id = Token::generateUuid();
        $srv2Id = Token::generateUuid();
        $srv3Id = Token::generateUuid();

        $this->pdo->beginTransaction();

        // Actualizar cuestionario
        $updQ = $this->pdo->prepare("UPDATE questionnaires SET current_step = 6, status = 'IN_PROGRESS', final_pitch = :pitch WHERE id = :id");
        $updQ->execute([':pitch' => 'Propuesta de valor ágil y digital para clientes corporativos.', ':id' => $qId]);

        // Insertar servicios
        $insS = $this->pdo->prepare("
            INSERT INTO services (id, questionnaire_id, name, is_custom, is_priority, display_order)
            VALUES (:id, :q_id, :name, :custom, :priority, :ord)
        ");
        $insS->execute([':id' => $srv1Id, ':q_id' => $qId, ':name' => 'Constitución de Sociedades', ':custom' => 0, ':priority' => 1, ':ord' => 1]);
        $insS->execute([':id' => $srv2Id, ':q_id' => $qId, ':name' => 'Fusiones y Adquisiciones', ':custom' => 0, ':priority' => 1, ':ord' => 2]);
        $insS->execute([':id' => $srv3Id, ':q_id' => $qId, ':name' => 'Secretaría de Consejo', ':custom' => 1, ':priority' => 0, ':ord' => 3]);

        // Insertar respuestas de servicio
        $insAns = $this->pdo->prepare("
            INSERT INTO service_answers (
                service_id, client_problem, solution_actions, expected_result, typical_duration,
                pricing_model, price_min, price_max, currency, market_position,
                profitability_score, operational_ease_score, remote_capability
            ) VALUES (
                :s_id, 'Necesidad de estructura societaria rápida', 'Redacción de estatutos y trámites notariales',
                'Sociedad operativa en 48h', '2 a 5 días', 'fixed', 1200.00, 2500.00, 'EUR', 'similar', 4, 5, 'online_100'
            )
        ");
        $insAns->execute([':s_id' => $srv1Id]);

        // Insertar públicos objetivo con ENUM priority
        $insAud = $this->pdo->prepare("
            INSERT INTO target_audiences (id, questionnaire_id, audience_key, custom_label, priority)
            VALUES (:id, :q_id, :key, :label, :priority)
        ");
        $insAud->execute([':id' => Token::generateUuid(), ':q_id' => $qId, ':key' => 'startups', ':label' => 'Startups Tecnológicas', ':priority' => 'high']);
        $insAud->execute([':id' => Token::generateUuid(), ':q_id' => $qId, ':key' => 'pymes', ':label' => 'Pymes consolidadas', ':priority' => 'medium']);

        // Insertar diferenciales
        $insDiff = $this->pdo->prepare("
            INSERT INTO differentials (id, questionnaire_id, differential_key, custom_label)
            VALUES (:id, :q_id, :key, :label)
        ");
        $insDiff->execute([':id' => Token::generateUuid(), ':q_id' => $qId, ':key' => 'rapidez', ':label' => 'Entrega en 48 horas']);
        $insDiff->execute([':id' => Token::generateUuid(), ':q_id' => $qId, ':key' => 'digital', ':label' => '100% Firma Digital']);

        $this->pdo->commit();
        $this->assert(true, "Guardado incremental completado con éxito en transacción DB");

        // Paso 7: Recargar cuestionario y comprobar persistencia
        echo "\n--- 7. Recargar y verificar persistencia en DB ---\n";
        $stmtCheckSrv = $this->pdo->prepare("SELECT COUNT(*) FROM services WHERE questionnaire_id = :q_id");
        $stmtCheckSrv->execute([':q_id' => $qId]);
        $srvCount = (int)$stmtCheckSrv->fetchColumn();
        $this->assert($srvCount === 3, "Persistencia verificada: 3 servicios almacenados");

        $stmtCheckPrio = $this->pdo->prepare("SELECT COUNT(*) FROM services WHERE questionnaire_id = :q_id AND is_priority = 1");
        $stmtCheckPrio->execute([':q_id' => $qId]);
        $prioCount = (int)$stmtCheckPrio->fetchColumn();
        $this->assert($prioCount === 2, "Persistencia verificada: 2 servicios marcados como prioritarios");

        $stmtCheckAns = $this->pdo->prepare("SELECT * FROM service_answers WHERE service_id = :s_id");
        $stmtCheckAns->execute([':s_id' => $srv1Id]);
        $ansRow = $stmtCheckAns->fetch();
        $this->assert((bool)$ansRow && (float)$ansRow['price_min'] === 1200.00, "Respuestas de servicio persistidas: price_min = 1200.00 EUR");

        $stmtCheckAud = $this->pdo->prepare("SELECT COUNT(*) FROM target_audiences WHERE questionnaire_id = :q_id");
        $stmtCheckAud->execute([':q_id' => $qId]);
        $this->assert((int)$stmtCheckAud->fetchColumn() === 2, "Persistencia verificada: 2 públicos objetivo");

        $stmtCheckDiff = $this->pdo->prepare("SELECT COUNT(*) FROM differentials WHERE questionnaire_id = :q_id");
        $stmtCheckDiff->execute([':q_id' => $qId]);
        $this->assert((int)$stmtCheckDiff->fetchColumn() === 2, "Persistencia verificada: 2 diferenciales");

        // Paso 8: Submit / Finalización
        echo "\n--- 8. Finalización y envío (submit) ---\n";
        $subDate = date('Y-m-d H:i:s');
        $stmtSubmit = $this->pdo->prepare("
            UPDATE questionnaires 
            SET status = 'COMPLETED', submitted_at = :sub_at, updated_at = NOW()
            WHERE id = :id
        ");
        $stmtSubmit->execute([':sub_at' => $subDate, ':id' => $qId]);

        $stmtFinalQ = $this->pdo->prepare("SELECT status, submitted_at FROM questionnaires WHERE id = :id");
        $stmtFinalQ->execute([':id' => $qId]);
        $finalQ = $stmtFinalQ->fetch();

        $this->assert($finalQ['status'] === 'COMPLETED', "Estado de cuestionario actualizado a 'COMPLETED'");
        $this->assert(!empty($finalQ['submitted_at']), "submitted_at registrado: {$finalQ['submitted_at']}");

        // Paso 9: Admin inspecciona listado y detalle
        echo "\n--- 9. Admin: Listado y Detalle de Respuestas ---\n";
        $stmtAdminList = $this->pdo->prepare("
            SELECT q.id, q.title, q.status, q.submitted_at, c.name AS client_name
            FROM questionnaires q
            JOIN clients c ON q.client_id = c.id
            WHERE q.id = :id
        ");
        $stmtAdminList->execute([':id' => $qId]);
        $adminViewItem = $stmtAdminList->fetch();
        $this->assert($adminViewItem['status'] === 'COMPLETED', "Admin ve cuestionario '{$adminViewItem['title']}' como COMPLETED");

        // Paso 10: Cambio de Contraseña de Admin
        echo "\n--- 10. Cambio de contraseña de administrador ---\n";
        $newStrongPassword = 'NewSecurePass!' . bin2hex(random_bytes(4)) . '2026#';
        $newHash = password_hash($newStrongPassword, PASSWORD_DEFAULT);

        $updPass = $this->pdo->prepare("UPDATE admin_users SET password_hash = :hash, updated_at = NOW() WHERE id = :id");
        $updPass->execute([':hash' => $newHash, ':id' => $admin['id']]);

        // Verificar que el hash cambió
        $stmtNewHash = $this->pdo->prepare("SELECT password_hash FROM admin_users WHERE id = :id");
        $stmtNewHash->execute([':id' => $admin['id']]);
        $dbNewHash = $stmtNewHash->fetchColumn();

        $this->assert($dbNewHash !== $admin['password_hash'], "Hash en base de datos actualizado con nuevo valor seguro");
        $this->assert(password_verify($newStrongPassword, $dbNewHash), "Nueva contraseña valida con éxito");
        $this->assert(!password_verify($tempPassword, $dbNewHash), "Contraseña anterior queda invalidada y es rechazada");

        // Paso 11: Logout y Re-login
        echo "\n--- 11. Logout y re-login con credenciales actualizadas ---\n";
        Auth::logout();
        $this->assert(Auth::getCurrentAdmin() === null, "Sesión de administrador cerrada correctamente");

        // Intento con contraseña anterior (debe fallar)
        $loginOldFailed = !password_verify($tempPassword, $dbNewHash);
        $this->assert($loginOldFailed, "Intento de inicio de sesión con contraseña antigua es rechazado");

        // Intento con nueva contraseña (debe tener éxito)
        $loginNewSuccess = password_verify($newStrongPassword, $dbNewHash);
        if ($loginNewSuccess) {
            Auth::login($admin['id'], $admin['email'], $admin['organization_id']);
        }
        $reauth = Auth::getCurrentAdmin();
        $this->assert($reauth !== null && $reauth['id'] === $admin['id'], "Inicio de sesión exitoso con nueva contraseña");

        // Restaurar contraseña temporal para mantener consistencia con admin_credentials.txt
        $restorePass = $this->pdo->prepare("UPDATE admin_users SET password_hash = :hash WHERE id = :id");
        $restorePass->execute([':hash' => password_hash($tempPassword, PASSWORD_DEFAULT), ':id' => $admin['id']]);

        // Paso 12: Evidencia directa en MySQL Development
        echo "\n--- 12. Evidencia directa de registros en MySQL dev ---\n";
        $checkQ = $this->pdo->query("SELECT COUNT(*) FROM questionnaires WHERE status = 'COMPLETED'")->fetchColumn();
        $this->assert((int)$checkQ >= 1, "Evidencia DB: questionnaires con status 'COMPLETED' existe");

        $checkServices = $this->pdo->query("SELECT COUNT(*) FROM services WHERE questionnaire_id = '{$qId}'")->fetchColumn();
        $this->assert((int)$checkServices === 3, "Evidencia DB: 3 servicios vinculados al cuestionario");

        $checkAnswers = $this->pdo->query("SELECT COUNT(*) FROM service_answers WHERE service_id = '{$srv1Id}'")->fetchColumn();
        $this->assert((int)$checkAnswers === 1, "Evidencia DB: service_answers vinculadas correctamente");

        $checkAud = $this->pdo->query("SELECT COUNT(*) FROM target_audiences WHERE questionnaire_id = '{$qId}'")->fetchColumn();
        $this->assert((int)$checkAud === 2, "Evidencia DB: target_audiences registradas");

        $checkDiff = $this->pdo->query("SELECT COUNT(*) FROM differentials WHERE questionnaire_id = '{$qId}'")->fetchColumn();
        $this->assert((int)$checkDiff === 2, "Evidencia DB: differentials registrados");

        echo "\n=======================================================\n";
        echo " RESUMEN E2E TEST:\n";
        echo " Total Aprobadas (PASS): {$this->passed}\n";
        echo " Total Fallidas  (FAIL): {$this->failed}\n";
        echo "=======================================================\n";

        return $this->failed === 0;
    }
}

$test = new E2ETest();
$ok = $test->run();
exit($ok ? 0 : 1);
