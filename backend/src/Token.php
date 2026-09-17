<?php
declare(strict_types=1);

namespace Vegen\Core;

use InvalidArgumentException;

/**
 * Utilidades criptográficas para generación, almacenamiento y verificación de tokens.
 */
class Token
{
    /**
     * Genera un token público criptográficamente seguro.
     * Retorna una cadena hexadecimal de 64 caracteres (32 bytes de entropía).
     */
    public static function generatePublicToken(int $bytes = 32): string
    {
        if ($bytes < 16) {
            throw new InvalidArgumentException('El tamaño del token debe ser de al menos 16 bytes.');
        }

        return bin2hex(random_bytes($bytes));
    }

    /**
     * Genera el hash criptográfico SHA-256 del token para su persistencia segura en la DB.
     * Longitud resultante: exactamente 64 caracteres hexadecimales.
     */
    public static function hashPublicToken(string $rawToken): string
    {
        if (empty($rawToken)) {
            throw new InvalidArgumentException('El token a hashear no puede estar vacío.');
        }

        return hash('sha256', $rawToken);
    }

    /**
     * Verifica de forma segura en tiempo constante si un token provisto coincide con el hash almacenado.
     */
    public static function verifyToken(string $rawToken, string $storedHash): bool
    {
        $calculatedHash = self::hashPublicToken($rawToken);
        return hash_equals($storedHash, $calculatedHash);
    }

    /**
     * Genera un identificador UUID v4 estándar.
     */
    public static function generateUuid(): string
    {
        $data = random_bytes(16);
        $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }
}
