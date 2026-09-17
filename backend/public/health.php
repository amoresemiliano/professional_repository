<?php
declare(strict_types=1);

// Permitir ser invocado directamente o vía router index.php
if (!defined('VEGEN_BOOTSTRAPPED')) {
    // Buscar bootstrap relativo al archivo actual
    $bootstrapCandidates = [
        dirname(__DIR__) . '/src/bootstrap.php',
        dirname(__DIR__, 4) . '/vegen_professional/src/bootstrap.php',
    ];

    $loaded = false;
    foreach ($bootstrapCandidates as $candidate) {
        if (file_exists($candidate)) {
            require_once $candidate;
            $loaded = true;
            break;
        }
    }

    if (!$loaded) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'success' => false,
            'error'   => [
                'code'    => 'BOOTSTRAP_ERROR',
                'message' => 'No fue posible inicializar el núcleo de la aplicación.'
            ]
        ]);
        exit;
    }

    define('VEGEN_BOOTSTRAPPED', true);
}

use Vegen\Core\Response;
use Vegen\Core\Database;
use Vegen\Core\Logger;

// Solo permitir peticiones GET
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method !== 'GET') {
    Response::error('METHOD_NOT_ALLOWED', 'Método HTTP no permitido.', 405);
}

// 1. Verificar conectividad con la base de datos
$dbOk = Database::ping();

if (!$dbOk) {
    Logger::error('Health check fallido: la base de datos no responde al ping');
    Response::error(
        'DATABASE_UNAVAILABLE',
        'El servicio de base de datos no se encuentra disponible temporalmente.',
        503
    );
}

// 2. Respuesta de salud limpia y segura
Response::success([
    'status'   => 'ok',
    'database' => 'ok',
], 200);
