-- VEGEN DIGITAL — ROLLBACK MIGRACIÓN 004: CONSOLIDACIÓN DE VERTICALES, CATÁLOGO, PLANES Y PRESUPUESTOS
-- Entorno: MySQL 5.7 / MySQL 8.0 Compatible
-- Archivo: backend/migrations/004_consolidation_verticals_plans_quotes.rollback.sql

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `quote_items`;
DROP TABLE IF EXISTS `quotes`;
DROP TABLE IF EXISTS `vegen_service_catalog`;
DROP TABLE IF EXISTS `strategic_plan_items`;
DROP TABLE IF EXISTS `strategic_plans`;
DROP TABLE IF EXISTS `client_contacts`;

ALTER TABLE `clients`
  DROP FOREIGN KEY `fk_clients_vertical`,
  DROP INDEX `idx_clients_vertical`,
  DROP COLUMN `vertical_id`;

DROP TABLE IF EXISTS `service_catalog`;
DROP TABLE IF EXISTS `business_verticals`;

SET FOREIGN_KEY_CHECKS = 1;
