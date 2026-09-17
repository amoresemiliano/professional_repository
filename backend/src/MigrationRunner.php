<?php
declare(strict_types=1);

namespace Vegen\Core;

use PDO;
use RuntimeException;
use Throwable;

/**
 * Ejecutor seguro y defensivo de migraciones SQL para Vegen Digital.
 */
class MigrationRunner
{
    private const AUTHORIZED_DB = 'athcomar_professional_repository_dev';

    /**
     * Ejecuta una migración con comprobaciones defensivas estrictas.
     */
    public static function run(string $sqlFilePath, bool $allowTestDb = false): array
    {
        if (!file_exists($sqlFilePath)) {
            throw new RuntimeException("Archivo de migración no encontrado: {$sqlFilePath}");
        }

        $pdo = Database::getConnection();

        // 1. Comprobación defensiva obligatoria: SELECT DATABASE()
        $stmt = $pdo->query('SELECT DATABASE()');
        $currentDb = $stmt ? (string)$stmt->fetchColumn() : '';
        if ($currentDb !== self::AUTHORIZED_DB) {
            throw new RuntimeException(
                "ABORT DEFENSIVO: La base de datos activa ('{$currentDb}') NO coincide exactamente con '" . self::AUTHORIZED_DB . "'. DDL cancelado."
            );
        }

        // 2. Leer y ejecutar el script SQL
        $sqlContent = file_get_contents($sqlFilePath);
        if ($sqlContent === false) {
            throw new RuntimeException("Error al leer el archivo de migración.");
        }

        // Ejecutar bloque DDL
        $pdo->exec($sqlContent);

        // 3. Inspeccionar y recolectar evidencia del esquema resultante
        return self::inspectSchema($pdo, $currentDb);
    }

    /**
     * Inspecciona las tablas, índices y foreign keys de la base de datos.
     */
    public static function inspectSchema(PDO $pdo, string $dbName): array
    {
        // Listar tablas
        $tablesStmt = $pdo->query("SHOW TABLES");
        $tables = $tablesStmt->fetchAll(PDO::FETCH_COLUMN);

        // Listar Foreign Keys
        $fkQuery = "
            SELECT 
                TABLE_NAME, 
                COLUMN_NAME, 
                CONSTRAINT_NAME, 
                REFERENCED_TABLE_NAME, 
                REFERENCED_COLUMN_NAME
            FROM 
                INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE 
                TABLE_SCHEMA = :db 
                AND REFERENCED_TABLE_NAME IS NOT NULL
            ORDER BY 
                TABLE_NAME, CONSTRAINT_NAME
        ";
        $fkStmt = $pdo->prepare($fkQuery);
        $fkStmt->execute([':db' => $dbName]);
        $foreignKeys = $fkStmt->fetchAll();

        // Listar Índices por tabla
        $indexes = [];
        foreach ($tables as $table) {
            $idxStmt = $pdo->query("SHOW INDEX FROM `{$table}`");
            $indexes[$table] = $idxStmt->fetchAll();
        }

        // Ejecutar SELECT 1 de confirmación
        $ping = Database::ping();

        return [
            'database'     => $dbName,
            'tables'       => $tables,
            'table_count'  => count($tables),
            'foreign_keys' => $foreignKeys,
            'fk_count'     => count($foreignKeys),
            'indexes'      => $indexes,
            'ping_ok'      => $ping,
        ];
    }
}
