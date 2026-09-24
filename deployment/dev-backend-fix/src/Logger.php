<?php
declare(strict_types=1);

namespace Vegen\Core;

/**
 * Sistema de Logging Seguro.
 * Registra eventos operativos y errores ofuscando cualquier dato sensible.
 */
class Logger
{
    private const SENSITIVE_KEYS = [
        'password',
        'passwd',
        'secret',
        'token',
        'auth',
        'authorization',
        'cookie',
        'session',
        'api_key',
        'apikey',
        'database_password',
        'db_pass',
    ];

    /**
     * Registra un mensaje informativo.
     */
    public static function info(string $message, array $context = []): void
    {
        self::log('INFO', $message, $context);
    }

    /**
     * Registra una advertencia.
     */
    public static function warning(string $message, array $context = []): void
    {
        self::log('WARNING', $message, $context);
    }

    /**
     * Registra un error.
     */
    public static function error(string $message, array $context = []): void
    {
        self::log('ERROR', $message, $context);
    }

    /**
     * Registra un error crítico.
     */
    public static function critical(string $message, array $context = []): void
    {
        self::log('CRITICAL', $message, $context);
    }

    /**
     * Formatea y escribe la entrada de log en archivo seguro.
     */
    public static function log(string $severity, string $message, array $context = []): void
    {
        $logConfig = Config::get('logging') ?? [];
        $enabled = $logConfig['enabled'] ?? true;

        if (!$enabled) {
            return;
        }

        $timestamp = gmdate('Y-m-d\TH:i:s\Z');
        $requestId = Response::getRequestId();
        $endpoint  = $_SERVER['REQUEST_URI'] ?? 'CLI';

        $safeContext = self::scrubSensitiveData($context);
        $contextJson = !empty($safeContext) ? ' | context=' . json_encode($safeContext, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) : '';

        $logEntry = sprintf(
            "[%s] [%s] [%s] [%s] %s%s%s",
            $timestamp,
            strtoupper($severity),
            $requestId,
            $endpoint,
            $message,
            $contextJson,
            PHP_EOL
        );

        $logDir = Config::get('paths.logs') ?: (dirname(__DIR__, 2) . '/logs');
        if (!is_dir($logDir)) {
            @mkdir($logDir, 0750, true);
        }

        $fileName = $logConfig['file'] ?? 'app.log';
        $logFilePath = rtrim($logDir, '/\\') . '/' . $fileName;

        @file_put_contents($logFilePath, $logEntry, FILE_APPEND | LOCK_EX);
    }

    /**
     * Ofusca recursivamente campos y valores sensibles.
     */
    public static function scrubSensitiveData(array $data): array
    {
        $sanitized = [];

        foreach ($data as $key => $value) {
            $lowerKey = strtolower((string)$key);
            $isSensitive = false;

            foreach (self::SENSITIVE_KEYS as $sensitiveTerm) {
                if (str_contains($lowerKey, $sensitiveTerm)) {
                    $isSensitive = true;
                    break;
                }
            }

            if ($isSensitive) {
                $sanitized[$key] = '[REDACTED]';
            } elseif (is_array($value)) {
                $sanitized[$key] = self::scrubSensitiveData($value);
            } else {
                $sanitized[$key] = $value;
            }
        }

        return $sanitized;
    }
}
