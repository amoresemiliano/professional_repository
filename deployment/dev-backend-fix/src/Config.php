<?php
declare(strict_types=1);

namespace Vegen\Core;

use RuntimeException;

/**
 * Gestor centralizado y seguro de configuración.
 * Localiza y carga el archivo de configuración fuera de public_html.
 */
class Config
{
    private static ?array $settings = null;
    private static ?string $loadedPath = null;

    /**
     * Carga o retorna la configuración activa.
     */
    public static function get(?string $key = null, mixed $default = null): mixed
    {
        if (self::$settings === null) {
            self::load();
        }

        if ($key === null) {
            return self::$settings;
        }

        $segments = explode('.', $key);
        $current = self::$settings;

        foreach ($segments as $segment) {
            if (!is_array($current) || !array_key_exists($segment, $current)) {
                return $default;
            }
            $current = $current[$segment];
        }

        return $current;
    }

    /**
     * Permite inyectar configuración manualmente (usado principalmente en tests).
     */
    public static function setConfig(array $config, ?string $path = 'in-memory'): void
    {
        self::$settings = $config;
        self::$loadedPath = $path;
    }

    /**
     * Retorna la ruta del archivo de configuración cargado (sin exponer secretos).
     */
    public static function getLoadedPath(): ?string
    {
        return self::$loadedPath;
    }

    /**
     * Resetea la configuración en memoria (útil para tests).
     */
    public static function reset(): void
    {
        self::$settings = null;
        self::$loadedPath = null;
    }

    /**
     * Determina y carga el archivo de configuración correspondiente.
     * Resolución estricta:
     * 1. VEGEN_CONFIG_FILE con ruta absoluta explícita.
     * 2. config.local.php únicamente para desarrollo local, gitignored.
     */
    private static function load(): void
    {
        // 1. Variable de entorno explícita con ruta absoluta (servidor o CLI)
        $envPath = getenv('VEGEN_CONFIG_FILE') ?: ($_SERVER['VEGEN_CONFIG_FILE'] ?? null);
        if ($envPath && is_string($envPath) && file_exists($envPath)) {
            $config = require $envPath;
            if (is_array($config)) {
                self::$settings = $config;
                self::$loadedPath = $envPath;
                return;
            }
        }

        // 2. Configuración local exclusiva para desarrollo local (gitignored)
        $localPath = dirname(__DIR__) . '/config/config.local.php';
        if (file_exists($localPath)) {
            $config = require $localPath;
            if (is_array($config)) {
                self::$settings = $config;
                self::$loadedPath = $localPath;
                return;
            }
        }

        throw new RuntimeException(
            'CRITICAL: Archivo de configuración privado no encontrado. ' .
            'Configure VEGEN_CONFIG_FILE con una ruta absoluta válida o defina backend/config/config.local.php para desarrollo local.'
        );
    }
}
