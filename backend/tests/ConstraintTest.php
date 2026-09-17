<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/src/bootstrap.php';

use Vegen\Core\Database;

$pdo = Database::getConnection();

$t1 = $pdo->query("SHOW CREATE TABLE target_audiences")->fetch(PDO::FETCH_ASSOC)['Create Table'];
$t2 = $pdo->query("SHOW CREATE TABLE differentials")->fetch(PDO::FETCH_ASSOC)['Create Table'];

$hasAudiencesConstraint = strpos($t1, 'uq_target_audiences_q_key') !== false;
$hasDifferentialsConstraint = strpos($t2, 'uq_differentials_q_key') !== false;

echo "uq_target_audiences_q_key: " . ($hasAudiencesConstraint ? "PASS" : "FAIL") . "\n";
echo "uq_differentials_q_key: " . ($hasDifferentialsConstraint ? "PASS" : "FAIL") . "\n";

if (!$hasAudiencesConstraint || !$hasDifferentialsConstraint) {
    exit(1);
}
