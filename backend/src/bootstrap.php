<?php
declare(strict_types=1);

namespace Vegen;

use Vegen\Core\Config;
use Vegen\Core\Response;
use Vegen\Core\Logger;
use Vegen\Core\Cors;
use Throwable;

// 1. Autoloader simple para el namespace Vegen\Core
spl_autoload_register(function (string $class): void {
    $prefix = 'Vegen\\Core\\';
    $baseDir = __DIR__ . '/';

    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }

    $relativeClass = substr($class, $len);
    $file = $baseDir . str_replace('\\', '/', $relativeClass) . '.php';

    if (file_exists($file)) {
        require $file;
    }
});

// 2. Control de reporte de errores PHP según entorno
try {
    $env = Config::get('environment', 'production');
} catch (Throwable $e) {
    $env = 'production';
}

if ($env === 'development') {
    ini_set('display_errors', '1');
    error_reporting(E_ALL);
} else {
    ini_set('display_errors', '0');
    error_reporting(0);
}

// 3. Manejador global de excepciones no capturadas
set_exception_handler(function (Throwable $e): void {
    Logger::critical('Excepción no capturada en aplicación', [
        'type'    => get_class($e),
        'message' => $e->getMessage(),
        'file'    => basename($e->getFile()),
        'line'    => $e->getLine(),
    ]);

    Response::error('INTERNAL_SERVER_ERROR', 'Ha ocurrido un error interno en el servidor.', 500);
});

// 4. Configuración segura para sesiones (HttpOnly, Secure, use_only_cookies, SameSite configurable)
function configureSecureSession(): void
{
    if (session_status() === PHP_SESSION_NONE && !headers_sent()) {
        $sessionConfig = Config::get('session') ?? [];

        ini_set('session.use_strict_mode', '1');
        ini_set('session.use_only_cookies', ($sessionConfig['use_only_cookies'] ?? true) ? '1' : '0');
        ini_set('session.cookie_httponly', ($sessionConfig['cookie_httponly'] ?? true) ? '1' : '0');
        ini_set('session.cookie_secure', ($sessionConfig['cookie_secure'] ?? true) ? '1' : '0');

        if (!empty($sessionConfig['cookie_samesite'])) {
            ini_set('session.cookie_samesite', (string)$sessionConfig['cookie_samesite']);
        }
    }
}

// 5. Aplicar CORS y cabeceras de seguridad
Cors::handle();
