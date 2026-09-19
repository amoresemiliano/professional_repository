<?php
declare(strict_types=1);

/**
 * CONSOLIDATION PHASE SEEDER
 * Seeds initial business vertical, service catalog, and vegen services catalogue.
 */

require_once dirname(__DIR__) . '/src/bootstrap.php';

use Vegen\Core\Database;
use Vegen\Core\Token;

try {
    Database::assertTargetDatabase('athcomar_professional_repository_dev');
    $pdo = Database::getConnection();

    // Obtener organización principal
    $orgId = $pdo->query("SELECT id FROM organizations LIMIT 1")->fetchColumn();
    if (!$orgId) {
        throw new RuntimeException("No se encontró ninguna organización en la base de datos.");
    }

    echo "=== SEEDING CONSOLIDATION DATA (Org: {$orgId}) ===\n";

    // 1. Business Vertical
    $stmt = $pdo->prepare("SELECT id FROM business_verticals WHERE slug = 'extranjeria-legal' LIMIT 1");
    $stmt->execute();
    $verticalId = $stmt->fetchColumn();

    if (!$verticalId) {
        $verticalId = Token::generateUuid();
        $stmtInsert = $pdo->prepare("
            INSERT INTO business_verticals (id, organization_id, name, slug, description, is_active, is_protected, created_at, updated_at)
            VALUES (:id, :org_id, 'Servicios Jurídicos y Extranjería', 'extranjeria-legal', 'Despachos jurídicos y especialistas en extranjería, visados y regularización.', 1, 1, NOW(), NOW())
        ");
        $stmtInsert->execute([':id' => $verticalId, ':org_id' => $orgId]);
        echo "[OK] Creada Vertical: Servicios Jurídicos y Extranjería (ID: {$verticalId})\n";
    } else {
        echo "[INFO] Vertical existente (ID: {$verticalId})\n";
    }

    // 2. Service Catalog for this Vertical
    $initialCatalog = [
        ['name' => 'Visados y Autorizaciones de Residencia', 'priority' => 1, 'order' => 1, 'desc' => 'Gestión integral de visados y permisos de residencia.'],
        ['name' => 'Nacionalidad Española por Residencia', 'priority' => 1, 'order' => 2, 'desc' => 'Expedientes y recursos de nacionalidad española.'],
        ['name' => 'Arraigo y Regularización Extraordinaria', 'priority' => 1, 'order' => 3, 'desc' => 'Arraigo social, laboral, familiar y para la formación.'],
        ['name' => 'Recursos Contencioso-Administrativos', 'priority' => 0, 'order' => 4, 'desc' => 'Defensa jurídica ante denegaciones administrativas.'],
        ['name' => 'Constitución de Sociedades para Extranjeros', 'priority' => 0, 'order' => 5, 'desc' => 'Asesoramiento mercantil y visados para inversores / nómadas.'],
    ];

    foreach ($initialCatalog as $srv) {
        $stmtCheck = $pdo->prepare("SELECT id FROM service_catalog WHERE vertical_id = :v_id AND name = :name LIMIT 1");
        $stmtCheck->execute([':v_id' => $verticalId, ':name' => $srv['name']]);
        if (!$stmtCheck->fetchColumn()) {
            $srvId = Token::generateUuid();
            $stmtIns = $pdo->prepare("
                INSERT INTO service_catalog (id, organization_id, vertical_id, name, description, default_priority, display_order, is_active, is_protected, created_at, updated_at)
                VALUES (:id, :org_id, :v_id, :name, :desc, :priority, :order, 1, 0, NOW(), NOW())
            ");
            $stmtIns->execute([
                ':id'       => $srvId,
                ':org_id'   => $orgId,
                ':v_id'     => $verticalId,
                ':name'     => $srv['name'],
                ':desc'     => $srv['desc'],
                ':priority' => $srv['priority'],
                ':order'    => $srv['order'],
            ]);
            echo "  + Servicio catálogo: {$srv['name']}\n";
        }
    }

    // 3. Vegen Service Catalog (for Quotes)
    $vegenServices = [
        ['name' => 'Diagnóstico y Auditoría Comercial Estratégica', 'price' => 950.00, 'desc' => 'Análisis exhaustivo del portfolio de servicios, oportunidades y dimensionamiento comercial.'],
        ['name' => 'Diseño de Propuesta de Valor y Reempaquetado', 'price' => 1800.00, 'desc' => 'Reestructuración de servicios prioritarios con tarifas optimizadas y enfoque a conversión.'],
        ['name' => 'Sistema Integral de Captación y Cualificación Digital', 'price' => 2400.00, 'desc' => 'Funnels de captación de leads cualificados y automatización del primer contacto.'],
        ['name' => 'Acompañamiento y Optimización Comercial (Mensual)', 'price' => 1200.00, 'desc' => 'Seguimiento mensual, optimización de conversión y asesoramiento táctico.'],
    ];

    foreach ($vegenServices as $vs) {
        $stmtCheck = $pdo->prepare("SELECT id FROM vegen_service_catalog WHERE organization_id = :org_id AND name = :name LIMIT 1");
        $stmtCheck->execute([':org_id' => $orgId, ':name' => $vs['name']]);
        if (!$stmtCheck->fetchColumn()) {
            $vId = Token::generateUuid();
            $stmtIns = $pdo->prepare("
                INSERT INTO vegen_service_catalog (id, organization_id, name, description, base_price, currency, is_active, created_at, updated_at)
                VALUES (:id, :org_id, :name, :desc, :price, 'EUR', 1, NOW(), NOW())
            ");
            $stmtIns->execute([
                ':id'     => $vId,
                ':org_id' => $orgId,
                ':name'   => $vs['name'],
                ':desc'   => $vs['desc'],
                ':price'  => $vs['price'],
            ]);
            echo "  + Vegen servicio catálogo: {$vs['name']} ({$vs['price']} EUR)\n";
        }
    }

    // 4. Asignar vertical por defecto a clientes sin vertical_id asignada
    $stmtUpd = $pdo->prepare("UPDATE clients SET vertical_id = :v_id WHERE vertical_id IS NULL");
    $stmtUpd->execute([':v_id' => $verticalId]);
    echo "[OK] Clientes actualizados con vertical por defecto.\n";

    echo "=== SEEDING CONSOLIDATION COMPLETADO ===\n";

} catch (\Throwable $e) {
    echo "[ERROR]: " . $e->getMessage() . "\n";
    exit(1);
}
