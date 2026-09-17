<?php
declare(strict_types=1);

namespace Vegen\Core;

/**
 * Manejador de CORS con Allowlist estricta y cabeceras de seguridad HTTP.
 */
class Cors
{
    /**
     * Aplica las cabeceras CORS y de seguridad correspondientes a la petición actual.
     * Si es una petición preflight (OPTIONS), finaliza con 204.
     */
    public static function handle(): void
    {
        self::applySecurityHeaders();

        $origin = $_SERVER['HTTP_ORIGIN'] ?? null;
        if (!$origin) {
            return;
        }

        $corsConfig = Config::get('cors') ?? [];
        $allowedOrigins = $corsConfig['allowed_origins'] ?? [];

        if (self::isOriginAllowed($origin, $allowedOrigins)) {
            if (!headers_sent()) {
                header("Access-Control-Allow-Origin: {$origin}");
                header('Access-Control-Allow-Credentials: true');
                header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
                header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Request-ID');
                
                $maxAge = (int)($corsConfig['max_age'] ?? 86400);
                header("Access-Control-Max-Age: {$maxAge}");
                header('Vary: Origin');
            }
        }

        // Si es una petición preflight (OPTIONS), responder de inmediato con 204 No Content
        if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
            http_response_code(204);
            exit;
        }
    }

    /**
     * Valida si un origen está en la lista blanca (coincidencia exacta o patrón local).
     */
    public static function isOriginAllowed(string $origin, array $allowedOrigins): bool
    {
        $normalizedOrigin = rtrim(strtolower($origin), '/');

        foreach ($allowedOrigins as $allowed) {
            if (rtrim(strtolower($allowed), '/') === $normalizedOrigin) {
                return true;
            }
        }

        return false;
    }

    /**
     * Emite cabeceras de seguridad estándar recomendadas.
     */
    public static function applySecurityHeaders(): void
    {
        if (!headers_sent()) {
            header('X-Content-Type-Options: nosniff');
            header('Referrer-Policy: strict-origin-when-cross-origin');
            header('X-Frame-Options: DENY');
        }
    }
}
