<?php
declare(strict_types=1);

/**
 * VEGEN DIGITAL — SCRIPT DE MIGRACIÓN CLI
 * Ejecuta 001_initial_schema.sql sobre athcomar_professional_repository_dev
 * 
 * Uso en servidor:
 * php migrate.php
 */

require_once dirname(__DIR__) . '/src/bootstrap.php';

use Vegen\Core\Config;
use Vegen\Core\Database;
use Vegen\Core\MigrationRunner;

echo "=======================================================\n";
echo " VEGEN DIGITAL — EJECUTOR DE MIGRACIÓN (FASE F2A)\n";
echo "=======================================================\n\n";

try {
    $migrationSqlFile = dirname(__DIR__) . '/migrations/001_initial_schema.sql';
    echo "1. Archivo de migración objetivo:\n   {$migrationSqlFile}\n\n";

    echo "2. Conectando y validando base de datos objetivo...\n";
    $currentDb = Database::getCurrentDatabaseName();
    echo "   Base de datos conectada: '{$currentDb}'\n";

    echo "\n3. Ejecutando comprobación defensiva...\n";
    Database::assertTargetDatabase('athcomar_professional_repository_dev');
    echo "   [OK] Coincidencia exacta con 'athcomar_professional_repository_dev'.\n\n";

    $migrationsDir = dirname(__DIR__) . '/migrations';
    $filesToRun = [];

    if (!empty($argv[1])) {
        $specified = $argv[1];
        $targetFile = file_exists($specified) ? $specified : $migrationsDir . '/' . basename($specified);
        if (!file_exists($targetFile)) {
            throw new RuntimeException("Archivo de migración especificado no existe: {$targetFile}");
        }
        $filesToRun[] = $targetFile;
    } else {
        $files = glob($migrationsDir . '/*.sql');
        sort($files);
        foreach ($files as $file) {
            if (strpos(basename($file), '.rollback.') === false) {
                $filesToRun[] = $file;
            }
        }
    }

    echo "4. Aplicando migraciones pendientes...\n";
    $lastResult = null;
    foreach ($filesToRun as $migrationSqlFile) {
        echo "   -> Ejecutando " . basename($migrationSqlFile) . "...\n";
        try {
            $lastResult = MigrationRunner::run($migrationSqlFile);
            echo "      [OK] " . basename($migrationSqlFile) . " aplicada exitosamente.\n";
        } catch (\Throwable $e) {
            // Si el error es clave duplicada u objeto ya existente en DDL no idempotente, informar
            if (strpos($e->getMessage(), 'Duplicate key name') !== false || strpos($e->getMessage(), 'already exists') !== false) {
                echo "      [SKIP] " . basename($migrationSqlFile) . " (ya aplicada previamente: " . $e->getMessage() . ")\n";
            } else {
                throw $e;
            }
        }
    }

    $pdo = Database::getConnection();
    $lastResult = MigrationRunner::inspectSchema($pdo, $currentDb);

    echo "\n5. Evidencia de Tablas Creadas ({$lastResult['table_count']}):\n";
    foreach ($lastResult['tables'] as $table) {
        echo "   - {$table}\n";
    }

    echo "\n6. Evidencia de Foreign Keys ({$lastResult['fk_count']}):\n";
    foreach ($lastResult['foreign_keys'] as $fk) {
        echo "   - {$fk['TABLE_NAME']}.{$fk['COLUMN_NAME']} -> {$fk['REFERENCED_TABLE_NAME']}.{$fk['REFERENCED_COLUMN_NAME']} ({$fk['CONSTRAINT_NAME']})\n";
    }

    echo "\n7. Verificación de Conectividad (SELECT 1):\n";
    echo "   Ping: " . ($lastResult['ping_ok'] ? 'PASS' : 'FAIL') . "\n";

    echo "\n=======================================================\n";
    echo " MIGRACIÓN COMPLETADA CON ÉXITO\n";
    echo "=======================================================\n";
    exit(0);

} catch (\Throwable $e) {
    echo "\n[ERROR CRÍTICO EN MIGRACIÓN]\n";
    echo "Mensaje: " . $e->getMessage() . "\n";
    echo "Operación cancelada por seguridad.\n";
    exit(1);
}
