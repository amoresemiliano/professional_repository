-- VEGEN DIGITAL — ROLLBACK MIGRACIÓN 005
-- Entorno: MySQL 5.7 / MySQL 8.0 Compatible
-- Archivo: backend/migrations/005_final_consolidation_fix.rollback.sql

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `quote_items`;
DROP TABLE IF EXISTS `quotes`;
DROP TABLE IF EXISTS `vegen_service_catalog`;

SET FOREIGN_KEY_CHECKS = 1;
