-- VEGEN DIGITAL — DB DEV RECONCILIATION
-- PRECHECK.sql (READ ONLY)
-- Instrucciones: Ejecutar estas consultas en phpMyAdmin (base de datos: athcomar_professional_repository_dev)
-- para confirmar el estado antes de aplicar las migraciones 003, 004 y 005.

-- 1. Verificar existencia de la organización Vegen
SELECT id, name FROM organizations LIMIT 1;

-- 2. Conteo de clientes actuales
SELECT COUNT(*) AS total_clients FROM clients;

-- 3. Conteo de cuestionarios actuales
SELECT COUNT(*) AS total_questionnaires FROM questionnaires;

-- 4. Verificar existencia de columnas en clients (debería dar error si is_protected NO existe, confirmando que falta aplicar migración 003)
-- Si la migración NO está aplicada, esto devolverá un error: "#1054 - Unknown column 'is_protected' in 'field list'"
SELECT id, name, is_protected, vertical_id, deleted_at FROM clients LIMIT 1;

-- 5. Verificar existencia de columnas en questionnaires (debería dar error si no existen, por la misma razón)
SELECT id, is_protected, deleted_at FROM questionnaires LIMIT 1;

-- 6. Verificar existencia de tablas consolidadas (si fallan indicando que la tabla no existe, confirma que faltan 004 y 005)
SELECT COUNT(*) AS total_verticals FROM business_verticals;
SELECT COUNT(*) AS total_service_catalog FROM service_catalog;
SELECT COUNT(*) AS total_strategic_plans FROM strategic_plans;
SELECT COUNT(*) AS total_quotes FROM quotes;
SELECT COUNT(*) AS total_vegen_catalog FROM vegen_service_catalog;
