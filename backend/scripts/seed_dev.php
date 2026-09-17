<?php
declare(strict_types=1);

/**
 * VEGEN DIGITAL — SCRIPT DE SEEDING (DESARROLLO EXCLUSIVO)
 * Crea la organización inicial, admin de desarrollo y datos iniciales para pruebas.
 * 
 * GUARD DE SEGURIDAD: Solo puede ejecutarse contra athcomar_professional_repository_dev
 */

require_once dirname(__DIR__) . '/src/bootstrap.php';

use Vegen\Core\Database;
use Vegen\Core\Token;

echo "=======================================================\n";
echo " VEGEN DIGITAL — SEEDER DE DESARROLLO\n";
echo "=======================================================\n\n";

function generateUuid(): string
{
    $data = random_bytes(16);
    $data[6] = chr(ord($data[6]) & 0x0f | 0x40); // Version 4
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80); // Variant
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

try {
    // 1. Guard defensivo de Base de Datos
    Database::assertTargetDatabase('athcomar_professional_repository_dev');
    $pdo = Database::getConnection();

    echo "1. Base de datos verificada: athcomar_professional_repository_dev [OK]\n";

    // 2. Organización inicial: 'Vegen Digital'
    $stmtOrg = $pdo->prepare("SELECT id FROM organizations WHERE name = :name LIMIT 1");
    $stmtOrg->execute([':name' => 'Vegen Digital']);
    $orgId = $stmtOrg->fetchColumn();

    if (!$orgId) {
        $orgId = generateUuid();
        $insOrg = $pdo->prepare("INSERT INTO organizations (id, name) VALUES (:id, :name)");
        $insOrg->execute([':id' => $orgId, ':name' => 'Vegen Digital']);
        echo "2. Organización 'Vegen Digital' creada exitosamente.\n";
    } else {
        echo "2. Organización 'Vegen Digital' ya existente (ID: {$orgId}).\n";
    }

    // 3. Admin initial user (solo dev)
    $devEmail = 'admin.dev@vegendigital.com';
    $stmtAdmin = $pdo->prepare("SELECT id FROM admin_users WHERE email = :email LIMIT 1");
    $stmtAdmin->execute([':email' => $devEmail]);
    $adminId = $stmtAdmin->fetchColumn();

    $localDir = dirname(__DIR__) . '/local';
    if (!is_dir($localDir)) {
        mkdir($localDir, 0700, true);
    }
    $credFile = $localDir . '/admin_credentials.txt';

    if (!$adminId) {
        // Generar contraseña temporal segura
        $tempPassword = 'VgnDev!' . bin2hex(random_bytes(6)) . 'A9#';
        $passwordHash = password_hash($tempPassword, PASSWORD_DEFAULT);
        $adminId = generateUuid();

        $insAdmin = $pdo->prepare("
            INSERT INTO admin_users (id, organization_id, email, password_hash, is_active)
            VALUES (:id, :org_id, :email, :password_hash, 1)
        ");
        $insAdmin->execute([
            ':id'            => $adminId,
            ':org_id'        => $orgId,
            ':email'         => $devEmail,
            ':password_hash' => $passwordHash,
        ]);

        // Guardar credenciales exclusivamente en backend/local/admin_credentials.txt
        $credContent = "ADMIN EMAIL: {$devEmail}\nADMIN TEMP PASSWORD: {$tempPassword}\n";
        file_put_contents($credFile, $credContent);

        echo "3. Usuario admin creado. Credenciales guardadas en backend/local/admin_credentials.txt (SIN mostrar en pantalla/logs).\n";
    } else {
        echo "3. Usuario admin ya existente.\n";
    }

    // 4. Cliente inicial para pruebas: Dr. Berlioz
    $stmtClient = $pdo->prepare("SELECT id FROM clients WHERE organization_id = :org_id AND name = :name LIMIT 1");
    $stmtClient->execute([':org_id' => $orgId, ':name' => 'Dr. Berlioz']);
    $clientId = $stmtClient->fetchColumn();

    if (!$clientId) {
        $clientId = generateUuid();
        $insClient = $pdo->prepare("
            INSERT INTO clients (id, organization_id, name, professional_sector, country, contact_name, contact_email)
            VALUES (:id, :org_id, :name, :sector, :country, :c_name, :c_email)
        ");
        $insClient->execute([
            ':id'       => $clientId,
            ':org_id'   => $orgId,
            ':name'     => 'Dr. Berlioz',
            ':sector'   => 'Servicios jurídicos',
            ':country'  => 'España',
            ':c_name'   => 'Dr. Berlioz',
            ':c_email'  => 'contacto@drberlioz.com',
        ]);
        echo "4. Cliente inicial 'Dr. Berlioz' creado exitosamente con sector 'Servicios jurídicos'.\n";
    } else {
        $updClient = $pdo->prepare("
            UPDATE clients 
            SET professional_sector = 'Servicios jurídicos', updated_at = NOW() 
            WHERE id = :id
        ");
        $updClient->execute([':id' => $clientId]);
        echo "4. Cliente inicial 'Dr. Berlioz' actualizado con sector 'Servicios jurídicos'.\n";
    }

    echo "\n=======================================================\n";
    echo " SEEDING DE DESARROLLO COMPLETADO CON ÉXITO\n";
    echo "=======================================================\n";
    exit(0);

} catch (\Throwable $e) {
    echo "\n[ERROR EN SEEDING]: " . $e->getMessage() . "\n";
    exit(1);
}
