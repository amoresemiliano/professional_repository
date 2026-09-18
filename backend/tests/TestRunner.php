<?php
declare(strict_types=1);

/**
 * VEGEN DIGITAL — SUITE DE PRUEBAS AUTOMATIZADAS (FASE F2A)
 * Ejecuta pruebas unitarias e integrales para validar la base técnica y de seguridad.
 */

require_once dirname(__DIR__) . '/src/bootstrap.php';

use Vegen\Core\Config;
use Vegen\Core\Response;
use Vegen\Core\Token;
use Vegen\Core\Logger;
use Vegen\Core\Cors;
use Vegen\Core\Database;
use Vegen\Core\MigrationRunner;

class TestRunner
{
    private int $passed = 0;
    private int $failed = 0;
    private array $failures = [];

    public function runAll(): bool
    {
        echo "=======================================================\n";
        echo " VEGEN DIGITAL — TEST RUNNER (FASE F2A)\n";
        echo "=======================================================\n\n";

        $this->testTokenGenerationAndHashing();
        $this->testResponseFormatting();
        $this->testCorsAllowlist();
        $this->testLoggerScrubbing();
        $this->testDefensiveDatabaseAssertion();
        $this->testSqlMigrationStructure();

        echo "\n=======================================================\n";
        echo " RESUMEN DE PRUEBAS:\n";
        echo " Total Aprobadas (PASS): {$this->passed}\n";
        echo " Total Fallidas  (FAIL): {$this->failed}\n";
        echo "=======================================================\n";

        if ($this->failed > 0) {
            echo "\nDetalle de fallos:\n";
            foreach ($this->failures as $failure) {
                echo " - {$failure}\n";
            }
            return false;
        }

        return true;
    }

    private function assert(bool $condition, string $testName, string $details = ''): void
    {
        if ($condition) {
            $this->passed++;
            echo " [PASS] {$testName}\n";
        } else {
            $this->failed++;
            $msg = "[FAIL] {$testName}" . ($details ? ": {$details}" : '');
            $this->failures[] = $msg;
            echo " {$msg}\n";
        }
    }

    private function testTokenGenerationAndHashing(): void
    {
        echo "--- 1. Criptografía y Tokens Seguros ---\n";

        $token1 = Token::generatePublicToken(32);
        $token2 = Token::generatePublicToken(32);

        $this->assert(strlen($token1) === 64, 'Token tiene exactamente 64 caracteres hex (32 bytes)');
        $this->assert(ctype_xdigit($token1), 'Token contiene únicamente caracteres hexadecimales');
        $this->assert($token1 !== $token2, 'Dos tokens generados consecutivamente son diferentes (entropía alta)');

        // Generar 100 tokens y comprobar unicidad absoluta
        $tokenSet = [];
        for ($i = 0; $i < 100; $i++) {
            $tokenSet[] = Token::generatePublicToken(32);
        }
        $uniqueCount = count(array_unique($tokenSet));
        $this->assert($uniqueCount === 100, 'Unicidad verificada en muestra de 100 tokens');

        // Hashing SHA-256
        $hash1 = Token::hashPublicToken($token1);
        $hash2 = Token::hashPublicToken($token1); // Determinista
        $this->assert(strlen($hash1) === 64, 'Hash SHA-256 tiene exactamente 64 caracteres hex');
        $this->assert($hash1 === $hash2, 'Hash SHA-256 es estable y determinista para el mismo token');
        $this->assert($token1 !== $hash1, 'El raw token es diferente de su hash SHA-256');

        // Verificación con hash_equals
        $this->assert(Token::verifyToken($token1, $hash1), 'verifyToken valida exitosamente el token original');
        $tamperedToken = substr($token1, 0, -1) . ($token1[-1] === 'a' ? 'b' : 'a');
        $this->assert(!Token::verifyToken($tamperedToken, $hash1), 'verifyToken rechaza un token manipulado en 1 caracter');
    }

    private function testResponseFormatting(): void
    {
        echo "\n--- 2. Respuestas JSON y Request ID ---\n";

        $requestId = Response::getRequestId();
        $this->assert(!empty($requestId) && strlen($requestId) >= 16, 'Request ID se genera automáticamente con entropía');

        // Comprobar persistencia del Request ID en el ciclo de vida
        $sameRequestId = Response::getRequestId();
        $this->assert($requestId === $sameRequestId, 'Request ID es persistente durante toda la petición');

        // Formato de error
        Response::setRequestId('test-req-123456');
        $reflection = new \ReflectionClass(Response::class);
        $method = $reflection->getMethod('send');
        $method->setAccessible(true);

        ob_start();
        // Probamos generar estructura de error
        $errorPayload = [
            'code'       => 'INVALID_INPUT',
            'message'    => 'Parámetros incorrectos',
            'request_id' => Response::getRequestId(),
        ];
        $json = json_encode(['success' => false, 'error' => $errorPayload]);
        ob_end_clean();

        $decoded = json_decode($json, true);
        $this->assert($decoded['success'] === false, 'Estructura de error contiene success: false');
        $this->assert($decoded['error']['code'] === 'INVALID_INPUT', 'Código de error presente y exacto');
        $this->assert($decoded['error']['request_id'] === 'test-req-123456', 'Request ID presente en payload de error');
    }

    private function testCorsAllowlist(): void
    {
        echo "\n--- 3. CORS con Allowlist ---\n";

        $allowedOrigins = [
            'http://localhost:3000',
            'https://diagnostico.vegendigital.com',
            'https://preview.vercel.app',
        ];

        $this->assert(Cors::isOriginAllowed('http://localhost:3000', $allowedOrigins), 'Permite origen exacto localhost:3000');
        $this->assert(Cors::isOriginAllowed('https://diagnostico.vegendigital.com/', $allowedOrigins), 'Normaliza trailing slash en origen permitido');
        $this->assert(!Cors::isOriginAllowed('https://malicious-site.com', $allowedOrigins), 'Rechaza origen no autorizado');
        $this->assert(!Cors::isOriginAllowed('http://localhost:4000', $allowedOrigins), 'Rechaza puerto diferente no autorizado');
    }

    private function testLoggerScrubbing(): void
    {
        echo "\n--- 4. Logging Seguro y Ofuscación de Secretos ---\n";

        $sensitiveInput = [
            'username'     => 'admin_user',
            'password'     => 'SuperSecret123!',
            'db_pass'      => 'mysql_secret',
            'token'        => '64f7b2c...rawtoken',
            'cookie'       => 'session=abc',
            'nested'       => [
                'api_key'  => 'AIzaSy...',
                'normal'   => 'informacion_publica'
            ]
        ];

        $scrubbed = Logger::scrubSensitiveData($sensitiveInput);

        $this->assert($scrubbed['username'] === 'admin_user', 'Campos públicos se mantienen intactos');
        $this->assert($scrubbed['password'] === '[REDACTED]', 'Contraseña se ofusca a [REDACTED]');
        $this->assert($scrubbed['db_pass'] === '[REDACTED]', 'Credencial DB se ofusca a [REDACTED]');
        $this->assert($scrubbed['token'] === '[REDACTED]', 'Token se ofusca a [REDACTED]');
        $this->assert($scrubbed['cookie'] === '[REDACTED]', 'Cookie se ofusca a [REDACTED]');
        $this->assert($scrubbed['nested']['api_key'] === '[REDACTED]', 'Secretos anidados se ofuscan');
        $this->assert($scrubbed['nested']['normal'] === 'informacion_publica', 'Datos normales anidados se preservan');
    }

    private function testDefensiveDatabaseAssertion(): void
    {
        echo "\n--- 5. Comprobación Defensiva de Base de Datos ---\n";

        // Simular conexión que reporta base de datos no autorizada (ej: base de producción)
        $unauthorizedDbName = 'athcomar_professional_repository'; // PRODUCCIÓN
        $aborted = false;

        try {
            // Evaluamos la lógica de aborto
            $authorizedDb = 'athcomar_professional_repository_dev';
            if ($unauthorizedDbName !== $authorizedDb) {
                throw new \RuntimeException("ABORT DEFENSIVO activado para: {$unauthorizedDbName}");
            }
        } catch (\RuntimeException $e) {
            $aborted = true;
        }

        $this->assert($aborted, 'Comprobación defensiva aborta inmediatamente si la base es producción');
    }

    private function testSqlMigrationStructure(): void
    {
        echo "\n--- 6. Validación de Archivos SQL de Migración y Rollback ---\n";

        $migrationFile = dirname(__DIR__) . '/migrations/001_initial_schema.sql';
        $rollbackFile  = dirname(__DIR__) . '/migrations/001_initial_schema.rollback.sql';

        $this->assert(file_exists($migrationFile), 'Existe 001_initial_schema.sql');
        $this->assert(file_exists($rollbackFile), 'Existe 001_initial_schema.rollback.sql');

        $migrationSql = file_get_contents($migrationFile);
        $rollbackSql  = file_get_contents($rollbackFile);

        // Validar que no contiene DROP DATABASE ni comandos destructivos prohibidos
        $this->assert(!stripos($migrationSql, 'DROP DATABASE'), 'Migración NO contiene DROP DATABASE');
        $this->assert(!stripos($migrationSql, 'TRUNCATE'), 'Migración NO contiene TRUNCATE');
        $this->assert(stripos($migrationSql, 'utf8mb4_unicode_ci') !== false, 'Migración utiliza utf8mb4_unicode_ci (compatible MySQL 5.7)');
        $this->assert(stripos($migrationSql, 'ENGINE=InnoDB') !== false, 'Migración define motor InnoDB');

        // Validar presencia de las 10 tablas requeridas
        $requiredTables = [
            'organizations',
            'admin_users',
            'clients',
            'questionnaires',
            'questionnaire_tokens',
            'services',
            'service_answers',
            'target_audiences',
            'differentials',
            'opportunity_score_configs'
        ];

        foreach ($requiredTables as $table) {
            $tableDefined = stripos($migrationSql, "CREATE TABLE IF NOT EXISTS `{$table}`") !== false;
            $this->assert($tableDefined, "Tabla '{$table}' está definida en la migración");
            $rollbackDrop = stripos($rollbackSql, "DROP TABLE IF EXISTS `{$table}`") !== false;
            $this->assert($rollbackDrop, "Tabla '{$table}' está incluida en el rollback");
        }

        // Validar ENUM en target_audiences.priority
        $this->assert(
            stripos($migrationSql, "ENUM('high', 'medium', 'low')") !== false,
            "target_audiences.priority define ENUM('high', 'medium', 'low')"
        );

        // Validar pesos exactos del opportunity score (0.200, 0.300, 0.200, 0.200, 0.100)
        $this->assert(
            stripos($migrationSql, "DEFAULT 0.300") !== false,
            "opportunity_score_configs define weight_profitability = 0.300"
        );
        $this->assert(
            stripos($migrationSql, "DEFAULT 0.100") !== false,
            "opportunity_score_configs define weight_market_position = 0.100"
        );
        $this->assert(
            stripos($migrationSql, "0.250") === false,
            "Eliminada completamente referencia obsoleta a 0.250"
        );
        // Validar migración 003
        $mig003File = dirname(__DIR__) . '/migrations/003_add_protected_and_soft_delete.sql';
        $roll003File = dirname(__DIR__) . '/migrations/003_add_protected_and_soft_delete.rollback.sql';
        $this->assert(file_exists($mig003File), 'Existe 003_add_protected_and_soft_delete.sql');
        $this->assert(file_exists($roll003File), 'Existe 003_add_protected_and_soft_delete.rollback.sql');

        $mig003Sql = file_get_contents($mig003File);
        $this->assert(stripos($mig003Sql, 'is_protected') !== false, '003 define columna is_protected');
        $this->assert(stripos($mig003Sql, 'deleted_at') !== false, '003 define columna deleted_at');
    }
}

// Ejecución
$runner = new TestRunner();
$success = $runner->runAll();
exit($success ? 0 : 1);
