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
        ['name' => 'Estrategia Digital', 'price' => 1200.00, 'desc' => 'Auditoría integral, posicionamiento y plan de crecimiento digital.'],
        ['name' => 'Desarrollo Web', 'price' => 2500.00, 'desc' => 'Sitio web profesional corporativo de alto rendimiento y conversión.'],
        ['name' => 'Landing Page', 'price' => 950.00, 'desc' => 'Página de aterrizaje optimizada para captación de leads y ventas.'],
        ['name' => 'SEO', 'price' => 800.00, 'desc' => 'Optimización orgánica para motores de búsqueda y posicionamiento nacional.'],
        ['name' => 'SEO Local', 'price' => 600.00, 'desc' => 'Optimización de Google Business Profile y posicionamiento geolocalizado.'],
        ['name' => 'Google Ads', 'price' => 750.00, 'desc' => 'Gestión y optimización de campañas de búsqueda y display en Google.'],
        ['name' => 'Meta Ads', 'price' => 750.00, 'desc' => 'Campañas de captación y retargeting en Instagram y Facebook.'],
        ['name' => 'LinkedIn Ads', 'price' => 850.00, 'desc' => 'Publicidad B2B segmentada por cargo, sector y empresa.'],
        ['name' => 'Gestión de Redes Sociales', 'price' => 650.00, 'desc' => 'Creación de contenido, planificación editorial y gestión de comunidad.'],
        ['name' => 'Email Marketing', 'price' => 550.00, 'desc' => 'Secuencias automatizadas de bienvenida, nutrición y fidelización.'],
        ['name' => 'Automatización / n8n', 'price' => 1100.00, 'desc' => 'Flujos de trabajo conectados y automatización de procesos operativos.'],
        ['name' => 'CRM', 'price' => 1400.00, 'desc' => 'Implementación, configuración y capacitación en pipeline de ventas.'],
        ['name' => 'Integraciones', 'price' => 950.00, 'desc' => 'Conexión vía API entre pasarelas de pago, formularios y sistemas internos.'],
        ['name' => 'Analítica / Tracking', 'price' => 650.00, 'desc' => 'Configuración avanzada de GA4, Google Tag Manager y eventos de conversión.'],
        ['name' => 'Consultoría de IA', 'price' => 1500.00, 'desc' => 'Diagnóstico de viabilidad e integración de IA en la empresa.'],
        ['name' => 'Automatizaciones con IA', 'price' => 1800.00, 'desc' => 'Agentes y procesamiento inteligente de datos y documentos.'],
        ['name' => 'Chatbots / Asistentes IA', 'price' => 1200.00, 'desc' => 'Asistente conversacional inteligente entrenado con conocimiento del negocio.'],
        ['name' => 'Producción de contenido', 'price' => 700.00, 'desc' => 'Redacción persuasiva, artículos especializados y contenido multimedia.'],
        ['name' => 'Branding / Identidad', 'price' => 1600.00, 'desc' => 'Identidad visual, guía de estilo y activos de marca.'],
        ['name' => 'Mantenimiento Web', 'price' => 350.00, 'desc' => 'Actualizaciones, seguridad, copias de seguridad y monitorización.'],
        ['name' => 'Soporte / Optimización', 'price' => 500.00, 'desc' => 'Bolsa de horas para optimización continua de conversión y soporte.'],
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
