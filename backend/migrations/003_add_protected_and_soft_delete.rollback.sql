-- VEGEN DIGITAL — ROLLBACK 003: REGISTROS PROTEGIDOS Y SOFT DELETE
-- Archivo: backend/migrations/003_add_protected_and_soft_delete.rollback.sql

ALTER TABLE `clients`
  DROP INDEX `idx_clients_org_deleted`,
  DROP COLUMN `deleted_at`,
  DROP COLUMN `is_protected`;

ALTER TABLE `questionnaires`
  DROP INDEX `idx_questionnaires_org_deleted`,
  DROP COLUMN `deleted_at`,
  DROP COLUMN `is_protected`;
