<?php
declare(strict_types=1);

namespace Vegen\Core;

/**
 * Gestor unificado de respuestas JSON y códigos de estado HTTP.
 */
class Response
{
    private static ?string $requestId = null;

    /**
     * Obtiene o inicializa el ID único de la petición (Request ID).
     */
    public static function getRequestId(): string
    {
        if (self::$requestId === null) {
            $incoming = $_SERVER['HTTP_X_REQUEST_ID'] ?? null;
            if ($incoming && preg_match('/^[a-zA-Z0-9_-]{8,64}$/', $incoming)) {
                self::$requestId = $incoming;
            } else {
                self::$requestId = bin2hex(random_bytes(16)); // 32 hex chars
            }
        }
        return self::$requestId;
    }

    /**
     * Permite fijar un Request ID específico (útil para pruebas).
     */
    public static function setRequestId(?string $id): void
    {
        self::$requestId = $id;
    }

    /**
     * Emite una respuesta JSON exitosa y finaliza el script.
     */
    public static function success(mixed $data = null, int $statusCode = 200, array $headers = []): void
    {
        self::send([
            'success' => true,
            'data'    => $data,
        ], $statusCode, $headers);
    }

    /**
     * Emite una respuesta JSON de error y finaliza el script.
     */
    public static function error(string $code, string $message, int $statusCode = 400, array $extra = [], array $headers = []): void
    {
        $errorPayload = [
            'code'       => $code,
            'message'    => $message,
            'request_id' => self::getRequestId(),
        ];

        if (!empty($extra)) {
            $errorPayload['details'] = $extra;
        }

        self::send([
            'success' => false,
            'error'   => $errorPayload,
        ], $statusCode, $headers);
    }

    /**
     * Envía la respuesta JSON con las cabeceras de seguridad requeridas.
     */
    public static function send(array $payload, int $statusCode = 200, array $headers = []): void
    {
        if (!headers_sent()) {
            http_response_code($statusCode);

            header('Content-Type: application/json; charset=utf-8');
            header('X-Content-Type-Options: nosniff');
            header('X-Request-ID: ' . self::getRequestId());

            foreach ($headers as $key => $value) {
                header("{$key}: {$value}");
            }
        }

        echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
}
