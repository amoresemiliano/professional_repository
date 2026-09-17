-- Rollback Migration 002: Drop unique constraints for questionnaire target audiences and differentials
-- Vegen Digital — Plataforma de Diagnostico

ALTER TABLE `target_audiences`
    DROP INDEX `uq_target_audiences_q_key`;

ALTER TABLE `differentials`
    DROP INDEX `uq_differentials_q_key`;
