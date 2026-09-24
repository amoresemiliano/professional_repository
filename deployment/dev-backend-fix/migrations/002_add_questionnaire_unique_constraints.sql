-- Migration 002: Add unique constraints for questionnaire target audiences and differentials
-- Vegen Digital — Plataforma de Diagnostico

ALTER TABLE `target_audiences`
    ADD CONSTRAINT `uq_target_audiences_q_key` UNIQUE (`questionnaire_id`, `audience_key`);

ALTER TABLE `differentials`
    ADD CONSTRAINT `uq_differentials_q_key` UNIQUE (`questionnaire_id`, `differential_key`);
