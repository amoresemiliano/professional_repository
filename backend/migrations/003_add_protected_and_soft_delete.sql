-- VEGEN DIGITAL — MIGRACIÓN 003: REGISTROS PROTEGIDOS Y SOFT DELETE
-- Entorno: MySQL 5.7 / MySQL 8.0 Compatible
-- Archivo: backend/migrations/003_add_protected_and_soft_delete.sql

ALTER TABLE `clients`
  ADD COLUMN `is_protected` TINYINT(1) NOT NULL DEFAULT 0 AFTER `notes`,
  ADD COLUMN `deleted_at` DATETIME NULL DEFAULT NULL AFTER `updated_at`,
  ADD INDEX `idx_clients_org_deleted` (`organization_id`, `deleted_at`);

ALTER TABLE `questionnaires`
  ADD COLUMN `is_protected` TINYINT(1) NOT NULL DEFAULT 0 AFTER `final_pitch`,
  ADD COLUMN `deleted_at` DATETIME NULL DEFAULT NULL AFTER `updated_at`,
  ADD INDEX `idx_questionnaires_org_deleted` (`organization_id`, `deleted_at`);
