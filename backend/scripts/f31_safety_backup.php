<?php
declare(strict_types=1);

/**
 * FASE 0 — SAFETY GATE & BACKUP UTILITY
 * Exporta los datos de desarrollo antes de aplicar la migración F3.1.
 */

require_once dirname(__DIR__) . '/src/bootstrap.php';

use Vegen\Core\Database;

try {
    Database::assertTargetDatabase('athcomar_professional_repository_dev');
    $pdo = Database::getConnection();

    echo "=== FASE 0: AUDITORÍA DE DATOS EXISTENTES ===\n";

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

    echo "\n--- Clientes en base de datos ---\n";
    $clients = $pdo->query("SELECT id, organization_id, name, professional_sector, country, created_at FROM clients ORDER BY created_at ASC")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($clients as $c) {
        echo sprintf("ID: %s | Creado: %s | Sector: %s\n", $c['id'], $c['created_at'], $c['professional_sector']);
    }

    echo "\n--- Cuestionarios en base de datos ---\n";
    $qs = $pdo->query("SELECT q.id, q.client_id, q.title, q.status, q.current_step, q.submitted_at, q.created_at FROM questionnaires q ORDER BY q.created_at ASC")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($qs as $q) {
        echo sprintf("ID: %s | ClientID: %s | Status: %s | Step: %d | Created: %s\n", $q['id'], $q['client_id'], $q['status'], $q['current_step'], $q['created_at']);
    }

    // Generar SQL Backup
    $backupDir = dirname(__DIR__) . '/local';
    if (!is_dir($backupDir)) {
        mkdir($backupDir, 0755, true);
    }
    $backupFile = $backupDir . '/backup_f31_pre_migration.sql';

    $sqlDump = "-- VEGEN DIGITAL - BACKUP PRE-MIGRATION F3.1\n";
    $sqlDump .= "-- Generated at: " . date('Y-m-d H:i:s') . "\n";
    $sqlDump .= "-- Database: athcomar_professional_repository_dev\n\n";
    $sqlDump .= "SET FOREIGN_KEY_CHECKS=0;\n\n";

    $backupTables = [
        'clients',
        'questionnaires',
        'questionnaire_tokens',
        'services',
        'service_answers',
        'target_audiences',
        'differentials'
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
