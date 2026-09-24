<?php
declare(strict_types=1);

/**
 * CONSOLIDATION PHASE — SAFETY GATE & BACKUP UTILITY
 * Exports development data before applying migration 004_consolidation_verticals_plans_quotes.sql.
 */

require_once dirname(__DIR__) . '/src/bootstrap.php';

use Vegen\Core\Database;

try {
    Database::assertTargetDatabase('athcomar_professional_repository_dev');
    $pdo = Database::getConnection();

    echo "=== CONSOLIDATION PHASE: AUDITORÍA DE DATOS DEV ===\n";

    $tables = [
        'organizations',
        'admin_users',
        'clients',
        'questionnaires',
        'questionnaire_tokens',
        'services',
        'service_answers',
        'target_audiences',
        'differentials',
        'opportunity_score_configs'
    ];

    foreach ($tables as $table) {
        $count = (int)$pdo->query("SELECT COUNT(*) FROM `{$table}`")->fetchColumn();
        echo sprintf("Tabla %-28s : %d registros\n", $table, $count);
    }

    echo "\n--- Clientes protegidos ---\n";
    $clients = $pdo->query("SELECT id, name, is_protected, deleted_at FROM clients WHERE is_protected = 1")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($clients as $c) {
        echo sprintf("Protected Client ID: %s | Name: %s | Deleted: %s\n", $c['id'], $c['name'], $c['deleted_at'] ?? 'NO');
    }

    echo "\n--- Cuestionarios protegidos ---\n";
    $qs = $pdo->query("SELECT id, client_id, is_protected, status, deleted_at FROM questionnaires WHERE is_protected = 1")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($qs as $q) {
        echo sprintf("Protected Questionnaire ID: %s | ClientID: %s | Status: %s\n", $q['id'], $q['client_id'], $q['status']);
    }

    // Generar SQL Backup
    $backupDir = dirname(__DIR__) . '/local';
    if (!is_dir($backupDir)) {
        mkdir($backupDir, 0755, true);
    }
    $backupFile = $backupDir . '/backup_consolidation_pre_migration.sql';

    $sqlDump = "-- VEGEN DIGITAL - BACKUP PRE-MIGRATION CONSOLIDATION PHASE 004\n";
    $sqlDump .= "-- Generated at: " . date('Y-m-d H:i:s') . "\n";
    $sqlDump .= "-- Database: athcomar_professional_repository_dev\n\n";
    $sqlDump .= "SET FOREIGN_KEY_CHECKS=0;\n\n";

    $backupTables = [
        'organizations',
        'admin_users',
        'clients',
        'questionnaires',
        'questionnaire_tokens',
        'services',
        'service_answers',
        'target_audiences',
        'differentials',
        'opportunity_score_configs'
    ];

    foreach ($backupTables as $table) {
        $rows = $pdo->query("SELECT * FROM `{$table}`")->fetchAll(PDO::FETCH_ASSOC);
        $sqlDump .= "-- Table: {$table} (" . count($rows) . " rows)\n";
        if (!empty($rows)) {
            $cols = array_keys($rows[0]);
            $colList = implode('`, `', $cols);
            foreach ($rows as $row) {
                $vals = array_map(function ($val) use ($pdo) {
                    if ($val === null) return 'NULL';
                    return $pdo->quote((string)$val);
                }, array_values($row));
                $valList = implode(', ', $vals);
                $sqlDump .= "INSERT INTO `{$table}` (`{$colList}`) VALUES ({$valList});\n";
            }
        }
        $sqlDump .= "\n";
    }

    $sqlDump .= "SET FOREIGN_KEY_CHECKS=1;\n";

    file_put_contents($backupFile, $sqlDump);
    echo "\n[OK] Backup guardado exitosamente en:\n     {$backupFile}\n";
    echo "     Tamaño: " . strlen($sqlDump) . " bytes\n";

} catch (\Throwable $e) {
    echo "\n[ERROR]: " . $e->getMessage() . "\n";
    exit(1);
}
