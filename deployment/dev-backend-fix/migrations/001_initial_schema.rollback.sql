-- =====================================================================
-- VEGEN DIGITAL — PLATAFORMA DE DIAGNÓSTICO
-- Rollback 001: Revertir Esquema Inicial
-- Archivo: 001_initial_schema.rollback.sql
-- NOTA: Elimina únicamente los objetos creados por 001_initial_schema.sql
-- =====================================================================

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `opportunity_score_configs`;
DROP TABLE IF EXISTS `differentials`;
DROP TABLE IF EXISTS `target_audiences`;
DROP TABLE IF EXISTS `service_answers`;
DROP TABLE IF EXISTS `services`;
DROP TABLE IF EXISTS `questionnaire_tokens`;
DROP TABLE IF EXISTS `questionnaires`;
DROP TABLE IF EXISTS `clients`;
DROP TABLE IF EXISTS `admin_users`;
DROP TABLE IF EXISTS `organizations`;

SET FOREIGN_KEY_CHECKS = 1;
