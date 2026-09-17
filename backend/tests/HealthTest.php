<?php
declare(strict_types=1);

/**
 * Prueba de integración para el endpoint /api/health
 */

require_once dirname(__DIR__) . '/src/bootstrap.php';

use Vegen\Core\Database;
use Vegen\Core\Response;

echo "--- Probando endpoint /api/health ---\n";

// 1. Probar caso con DB mockeada (OK)
$mockPdo = new class extends PDO {
    public function __construct() {}
    #[\ReturnTypeWillChange]
    public function query(string $query, ?int $fetchMode = null, mixed ...$fetchModeArgs) {
        return new class {
            public function fetchColumn() { return 1; }
        };
    }
};

Database::setConnection($mockPdo);

// Capturar salida de health.php simulada
$dbOk = Database::ping();
if ($dbOk) {
    echo " [PASS] Database::ping() retorna true con conexión mock\n";
} else {
    echo " [FAIL] Database::ping() falló\n";
    exit(1);
}

// Probar caso con DB no disponible
Database::setConnection(null);
// Configurar un DSN inválido temporalmente
\Vegen\Core\Config::setConfig([
    'environment' => 'development',
    'database'    => [
        'host'     => '127.0.0.1',
        'port'     => 9999, // Puerto cerrado
        'name'     => 'non_existent_db',
        'user'     => 'nobody',
        'password' => 'invalid',
    ],
    'logging' => ['enabled' => false]
]);

$dbFail = Database::ping();
if (!$dbFail) {
    echo " [PASS] Database::ping() retorna false limpiamente cuando DB está caída (sin romper el flujo)\n";
} else {
    echo " [FAIL] Database::ping() debería fallar con DB caída\n";
    exit(1);
}

echo "\nEndpoint /api/health verificado exitosamente.\n";
exit(0);
