<?php
declare(strict_types=1);

namespace Vegen\Core;

use PDO;
use PDOException;
use RuntimeException;

/**
 * Conexión segura a Base de Datos mediante PDO.
 * Patrón Singleton / Factory con configuraciones estrictas de seguridad.
 */
class Database
{
    private static ?PDO $instance = null;

    /**
     * Retorna la instancia activa de PDO.
     */
    public static function getConnection(): PDO
    {
        if (self::$instance === null) {
            self::$instance = self::createConnection();
        }

        return self::$instance;
    }

    /**
     * Permite inyectar una instancia PDO (ideal para pruebas y mocks).
     */
    public static function setConnection(?PDO $pdo): void
    {
        self::$instance = $pdo;
    }

    /**
     * Crea una nueva conexión PDO con las opciones de seguridad requeridas.
     */
    private static function createConnection(): PDO
    {
        $dbConfig = Config::get('database');

        if (!$dbConfig || !is_array($dbConfig)) {
            throw new RuntimeException('Configuración de base de datos no encontrada o inválida.');
        }

        $host    = $dbConfig['host'] ?? 'localhost';
        $port    = (int)($dbConfig['port'] ?? 3306);
        $name    = $dbConfig['name'] ?? '';
        $user    = $dbConfig['user'] ?? '';
        $pass    = $dbConfig['password'] ?? '';
        $charset = $dbConfig['charset'] ?? 'utf8mb4';

        $dsn = "mysql:host={$host};port={$port};dbname={$name};charset={$charset}";

        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES '{$charset}' COLLATE 'utf8mb4_unicode_ci'",
        ];

        try {
            return new PDO($dsn, $user, $pass, $options);
        } catch (PDOException $e) {
            Logger::error('Error de conexión PDO a la base de datos', [
                'code' => $e->getCode(),
                // NO registrar $dsn con usuario ni contraseña
            ]);

            throw new RuntimeException('No fue posible establecer conexión con el motor de base de datos.');
        }
    }

    /**
     * Ejecuta una comprobación de vida (ping) contra la base de datos.
     * Retorna true si 'SELECT 1' responde exitosamente.
     */
    public static function ping(): bool
    {
        try {
            $pdo = self::getConnection();
            $stmt = $pdo->query('SELECT 1');
            return $stmt !== false && $stmt->fetchColumn() !== false;
        } catch (\Throwable $e) {
            Logger::warning('Fallo en Database::ping()', ['error' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * Obtiene el nombre real de la base de datos actualmente seleccionada.
     */
    public static function getCurrentDatabaseName(): ?string
    {
        try {
            $pdo = self::getConnection();
            $stmt = $pdo->query('SELECT DATABASE()');
            $db = $stmt->fetchColumn();
            return $db ? (string)$db : null;
        } catch (\Throwable $e) {
            return null;
        }
    }

    /**
     * Comprobación defensiva obligatoria: aborta si la DB activa no coincide exactamente con la esperada.
     */
    public static function assertTargetDatabase(string $expectedDbName): void
    {
        $current = self::getCurrentDatabaseName();
        if ($current !== $expectedDbName) {
            throw new RuntimeException(
                "ABORT DEFENSIVO: La base de datos conectada ('{$current}') NO coincide exactamente con la esperada ('{$expectedDbName}'). Operación cancelada."
            );
        }
    }
}
