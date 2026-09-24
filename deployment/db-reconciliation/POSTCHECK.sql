-- VEGEN DIGITAL — DB DEV RECONCILIATION
-- POSTCHECK.sql (READ ONLY)
-- Instrucciones: Ejecutar estas consultas en phpMyAdmin (base de datos: athcomar_professional_repository_dev)
-- DESPUÉS de aplicar las migraciones 003, 004, 005 y el seeder.

-- 1. Verificar columnas agregadas en clients (003 y 004)
SELECT id, name, is_protected, vertical_id, deleted_at FROM clients LIMIT 5;

-- 2. Verificar columnas agregadas en questionnaires (003)
SELECT id, client_id, is_protected, deleted_at FROM questionnaires LIMIT 5;

-- 3. Verificar creación de las tablas de vertical y catálogo y el resultado del seeder (004 y 005)
SELECT * FROM business_verticals;
SELECT * FROM service_catalog;
SELECT * FROM vegen_service_catalog;

-- 4. Verificar tablas vacías preparadas para los nuevos módulos (004 y 005)
SELECT COUNT(*) AS total_strategic_plans FROM strategic_plans;
SELECT COUNT(*) AS total_strategic_plan_items FROM strategic_plan_items;
SELECT COUNT(*) AS total_quotes FROM quotes;
SELECT COUNT(*) AS total_quote_items FROM quote_items;
SELECT COUNT(*) AS total_client_contacts FROM client_contacts;
