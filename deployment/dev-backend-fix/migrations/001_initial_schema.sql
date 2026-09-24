-- =====================================================================
-- VEGEN DIGITAL — PLATAFORMA DE DIAGNÓSTICO
-- Migración 001: Esquema Inicial
-- Archivo: 001_initial_schema.sql
-- Motor: InnoDB
-- Charset: utf8mb4 / Collation: utf8mb4_unicode_ci
-- Compatibilidad: MySQL 5.7.44+
-- =====================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Tabla: organizations
CREATE TABLE IF NOT EXISTS `organizations` (
  `id` CHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabla: admin_users
CREATE TABLE IF NOT EXISTS `admin_users` (
  `id` CHAR(36) NOT NULL,
  `organization_id` CHAR(36) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `last_login_at` DATETIME NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_admin_users_email` (`email`),
  KEY `idx_admin_users_organization_id` (`organization_id`),
  CONSTRAINT `fk_admin_users_organization`
    FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabla: clients
CREATE TABLE IF NOT EXISTS `clients` (
  `id` CHAR(36) NOT NULL,
  `organization_id` CHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `professional_sector` VARCHAR(100) NULL,
  `country` VARCHAR(100) NULL,
  `contact_name` VARCHAR(255) NULL,
  `contact_email` VARCHAR(255) NULL,
  `contact_phone` VARCHAR(50) NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_clients_organization_id` (`organization_id`),
  CONSTRAINT `fk_clients_organization`
    FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabla: questionnaires
CREATE TABLE IF NOT EXISTS `questionnaires` (
  `id` CHAR(36) NOT NULL,
  `organization_id` CHAR(36) NOT NULL,
  `client_id` CHAR(36) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `status` ENUM('DRAFT', 'SENT', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  `current_step` INT NOT NULL DEFAULT 1,
  `final_pitch` TEXT NULL,
  `submitted_at` DATETIME NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_questionnaires_organization_id` (`organization_id`),
  KEY `idx_questionnaires_client_id` (`client_id`),
  KEY `idx_questionnaires_status` (`status`),
  CONSTRAINT `fk_questionnaires_organization`
    FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_questionnaires_client`
    FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Tabla: questionnaire_tokens
CREATE TABLE IF NOT EXISTS `questionnaire_tokens` (
  `id` CHAR(36) NOT NULL,
  `questionnaire_id` CHAR(36) NOT NULL,
  `token_hash` CHAR(64) NOT NULL,
  `is_revoked` TINYINT(1) NOT NULL DEFAULT 0,
  `expires_at` DATETIME NOT NULL,
  `last_accessed_at` DATETIME NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tokens_token_hash` (`token_hash`),
  KEY `idx_tokens_questionnaire_id` (`questionnaire_id`),
  CONSTRAINT `fk_tokens_questionnaire`
    FOREIGN KEY (`questionnaire_id`) REFERENCES `questionnaires` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Tabla: services
CREATE TABLE IF NOT EXISTS `services` (
  `id` CHAR(36) NOT NULL,
  `questionnaire_id` CHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `is_custom` TINYINT(1) NOT NULL DEFAULT 0,
  `is_priority` TINYINT(1) NOT NULL DEFAULT 0,
  `display_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_services_questionnaire_id` (`questionnaire_id`),
  CONSTRAINT `fk_services_questionnaire`
    FOREIGN KEY (`questionnaire_id`) REFERENCES `questionnaires` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Tabla: service_answers
CREATE TABLE IF NOT EXISTS `service_answers` (
  `service_id` CHAR(36) NOT NULL,
  `client_problem` TEXT NULL,
  `solution_actions` TEXT NULL,
  `expected_result` TEXT NULL,
  `typical_duration` VARCHAR(100) NULL,
  `pricing_model` VARCHAR(50) NULL,
  `price_min` DECIMAL(12,2) NULL,
  `price_max` DECIMAL(12,2) NULL,
  `currency` VARCHAR(3) NOT NULL DEFAULT 'EUR',
  `price_notes` TEXT NULL,
  `market_position` VARCHAR(50) NULL,
  `estimated_market_price` DECIMAL(12,2) NULL,
  `market_notes` TEXT NULL,
  `profitability_score` TINYINT NULL,
  `profitability_is_uncertain` TINYINT(1) NOT NULL DEFAULT 0,
  `operational_ease_score` TINYINT NULL,
  `operational_issues` TEXT NULL,
  `operational_issues_other` TEXT NULL,
  `operational_notes` TEXT NULL,
  `remote_capability` VARCHAR(50) NULL,
  `remote_channels` TEXT NULL,
  `remote_channels_other` TEXT NULL,
  `remote_notes` TEXT NULL,
  `opportunity_score` DECIMAL(5,2) NULL,
  `score_version` VARCHAR(20) NULL,
  `score_breakdown` JSON NULL,
  `score_calculated_at` DATETIME NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`service_id`),
  CONSTRAINT `fk_service_answers_service`
    FOREIGN KEY (`service_id`) REFERENCES `services` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Tabla: target_audiences
CREATE TABLE IF NOT EXISTS `target_audiences` (
  `id` CHAR(36) NOT NULL,
  `questionnaire_id` CHAR(36) NOT NULL,
  `audience_key` VARCHAR(100) NOT NULL,
  `custom_label` VARCHAR(255) NULL,
  `priority` ENUM('high', 'medium', 'low') NOT NULL DEFAULT 'medium',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_target_audiences_q_key` (`questionnaire_id`, `audience_key`),
  KEY `idx_target_audiences_questionnaire_id` (`questionnaire_id`),
  CONSTRAINT `fk_target_audiences_questionnaire`
    FOREIGN KEY (`questionnaire_id`) REFERENCES `questionnaires` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Tabla: differentials
CREATE TABLE IF NOT EXISTS `differentials` (
  `id` CHAR(36) NOT NULL,
  `questionnaire_id` CHAR(36) NOT NULL,
  `differential_key` VARCHAR(100) NOT NULL,
  `custom_label` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_differentials_q_key` (`questionnaire_id`, `differential_key`),
  KEY `idx_differentials_questionnaire_id` (`questionnaire_id`),
  CONSTRAINT `fk_differentials_questionnaire`
    FOREIGN KEY (`questionnaire_id`) REFERENCES `questionnaires` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Tabla: opportunity_score_configs
CREATE TABLE IF NOT EXISTS `opportunity_score_configs` (
  `id` CHAR(36) NOT NULL,
  `organization_id` CHAR(36) NOT NULL,
  `version` VARCHAR(50) NOT NULL,
  `weight_priority` DECIMAL(4,3) NOT NULL DEFAULT 0.200,
  `weight_profitability` DECIMAL(4,3) NOT NULL DEFAULT 0.300,
  `weight_operational_ease` DECIMAL(4,3) NOT NULL DEFAULT 0.200,
  `weight_remote_scalability` DECIMAL(4,3) NOT NULL DEFAULT 0.200,
  `weight_market_position` DECIMAL(4,3) NOT NULL DEFAULT 0.100,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_score_configs_organization_id` (`organization_id`),
  CONSTRAINT `fk_score_configs_organization`
    FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
