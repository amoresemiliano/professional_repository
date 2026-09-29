<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/src/bootstrap.php';

use Vegen\Core\Database;

Database::assertTargetDatabase('athcomar_professional_repository_dev');
$pdo = Database::getConnection();

// Marcar registros reales como is_protected = 1
$clientIds = ['54f7fbee-e550-409f-ba59-51f42230b680', '5f04157f-4b57-442f-88a0-3336d0187e01'];
$qIds = ['2ead0256-afae-4b00-9cae-42436ab22322'];

$stmtC = $pdo->prepare("UPDATE clients SET is_protected = 1 WHERE id = :id");
foreach ($clientIds as $cid) {
    $stmtC->execute([':id' => $cid]);
}

$stmtQ = $pdo->prepare("UPDATE questionnaires SET is_protected = 1 WHERE id = :id");
foreach ($qIds as $qid) {
    $stmtQ->execute([':id' => $qid]);
}

echo "=== REGISTROS PROTEGIDOS ACTUALIZADOS ===\n";
$protectedClients = $pdo->query("SELECT id, name, is_protected, deleted_at FROM clients WHERE is_protected = 1")->fetchAll(PDO::FETCH_ASSOC);
echo "Clientes protegidos: " . count($protectedClients) . "\n";
foreach ($protectedClients as $pc) {
    echo " - Client ID: " . $pc['id'] . " (Protected: " . $pc['is_protected'] . ")\n";
}

$protectedQs = $pdo->query("SELECT id, title, is_protected, deleted_at FROM questionnaires WHERE is_protected = 1")->fetchAll(PDO::FETCH_ASSOC);
echo "Cuestionarios protegidos: " . count($protectedQs) . "\n";
foreach ($protectedQs as $pq) {
    echo " - Questionnaire ID: " . $pq['id'] . " (Protected: " . $pq['is_protected'] . ")\n";
}
