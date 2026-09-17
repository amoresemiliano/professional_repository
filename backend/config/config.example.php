<?php
/**
 * VEGEN DIGITAL — PLATAFORMA DE DIAGNÓSTICO
 * Archivo de Ejemplo de Configuración (SEGURO - SIN SECRETOS)
 * 
 * Resolución de configuración:
 * 1. En servidor Bluehost: definir la variable de entorno VEGEN_CONFIG_FILE
 *    apuntando a la ruta absoluta del archivo privado (fuera de public_html):
 *    SetEnv VEGEN_CONFIG_FILE "/home/<account>/vegen_professional/config/development.php"
 * 
 * 2. En desarrollo local: copiar este archivo a backend/config/config.local.php (gitignored)
 */

declare(strict_types=1);

return [
    // Entorno: 'development' | 'production'
    'environment' => 'development',

    // Configuración de Base de Datos MySQL 5.7
    'database' => [
        'host'     => 'localhost',
        'port'     => 3306,
        'name'     => 'athcomar_professional_repository_dev',
        'user'     => 'athcomar_professional_repo_dev',
        'password' => 'REPLACE_WITH_SECURE_PASSWORD',
        'charset'  => 'utf8mb4',
    ],

    // Política de CORS - Allowlist de orígenes autorizados
    'cors' => [
        'allowed_origins' => [
            'http://localhost:3000',
            'http://localhost:5173',
            // 'https://tu-preview-vercel.vercel.app',
            // 'https://vegendigital.com',
        ],
        'allow_credentials' => true,
        'max_age'           => 86400, // 24 horas para preflight OPTIONS
    ],

    // Parámetros para Sesiones y Cookies
    'session' => [
        'cookie_name'     => 'vegen_sess',
        'cookie_lifetime' => 0, // sesión de navegador
        'cookie_httponly' => true,
        'cookie_secure'   => true, // Obligatorio HTTPS en producción
        'cookie_samesite' => 'Lax', // 'Lax' | 'Strict' | 'None'
    ],

    // Rutas del Sistema de Archivos (Fuera de public_html)
    'paths' => [
        'logs'    => dirname(__DIR__, 2) . '/logs',
        'storage' => dirname(__DIR__, 2) . '/storage',
    ],

    // Logging
    'logging' => [
        'enabled'   => true,
        'min_level' => 'INFO', // 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR'
        'file'      => 'app.log',
    ],
];
