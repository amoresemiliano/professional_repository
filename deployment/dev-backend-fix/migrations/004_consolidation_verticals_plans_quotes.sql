-- VEGEN DIGITAL — MIGRACIÓN 004: CONSOLIDACIÓN DE VERTICALES, CATÁLOGO, PLANES Y PRESUPUESTOS
-- Entorno: MySQL 5.7 / MySQL 8.0 Compatible
-- Archivo: backend/migrations/004_consolidation_verticals_plans_quotes.sql

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Tabla de Verticales de Negocio
CREATE TABLE IF NOT EXISTS `business_verticals` (
  `id` VARCHAR(36) NOT NULL,
  `organization_id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `is_protected` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_bv_org_active` (`organization_id`, `is_active`, `deleted_at`),
  CONSTRAINT `fk_bv_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Catálogo de Servicios por Vertical (Service Pools)
CREATE TABLE IF NOT EXISTS `service_catalog` (
  `id` VARCHAR(36) NOT NULL,
  `organization_id` VARCHAR(36) NOT NULL,
  `vertical_id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `default_priority` TINYINT(1) NOT NULL DEFAULT 0,
  `display_order` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `is_protected` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_sc_vertical` (`vertical_id`, `is_active`, `deleted_at`),
  CONSTRAINT `fk_sc_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sc_vertical` FOREIGN KEY (`vertical_id`) REFERENCES `business_verticals` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Modificación de Clientes para asociar Vertical
ALTER TABLE `clients`
  ADD COLUMN `vertical_id` VARCHAR(36) NULL DEFAULT NULL AFTER `organization_id`,
  ADD INDEX `idx_clients_vertical` (`vertical_id`),
  ADD CONSTRAINT `fk_clients_vertical` FOREIGN KEY (`vertical_id`) REFERENCES `business_verticals` (`id`) ON DELETE SET NULL;

-- 4. Tabla de Contactos de Cliente (preparación de modelo para F4)
CREATE TABLE IF NOT EXISTS `client_contacts` (
  `id` VARCHAR(36) NOT NULL,
  `client_id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `role` VARCHAR(100) NULL,
  `whatsapp` VARCHAR(50) NULL,
  `email` VARCHAR(255) NULL,
  `is_primary` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_cc_client` (`client_id`, `deleted_at`),
  CONSTRAINT `fk_cc_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Tabla de Planes Estratégicos (Fundación)
CREATE TABLE IF NOT EXISTS `strategic_plans` (
  `id` VARCHAR(36) NOT NULL,
  `organization_id` VARCHAR(36) NOT NULL,
  `client_id` VARCHAR(36) NOT NULL,
  `questionnaire_id` VARCHAR(36) NULL DEFAULT NULL,
  `title` VARCHAR(255) NOT NULL,
  `status` ENUM('DRAFT', 'FINAL') NOT NULL DEFAULT 'DRAFT',
  `general_diagnosis` TEXT NULL,
  `general_actions` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_sp_client` (`client_id`, `deleted_at`),
  CONSTRAINT `fk_sp_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sp_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sp_questionnaire` FOREIGN KEY (`questionnaire_id`) REFERENCES `questionnaires` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Ítems del Plan Estratégico (por servicio prioritario)
CREATE TABLE IF NOT EXISTS `strategic_plan_items` (
  `id` VARCHAR(36) NOT NULL,
  `plan_id` VARCHAR(36) NOT NULL,
  `service_id` VARCHAR(36) NULL DEFAULT NULL,
  `service_name` VARCHAR(255) NOT NULL,
  `diagnosis` TEXT NULL,
  `actions` TEXT NULL,
  `display_order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_spi_plan` (`plan_id`, `display_order`),
  CONSTRAINT `fk_spi_plan` FOREIGN KEY (`plan_id`) REFERENCES `strategic_plans` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Catálogo de Servicios Propios de Vegen (para presupuestos comerciales)
CREATE TABLE IF NOT EXISTS `vegen_service_catalog` (
  `id` VARCHAR(36) NOT NULL,
  `organization_id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `base_price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'EUR',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_vsc_org` (`organization_id`, `is_active`, `deleted_at`),
  CONSTRAINT `fk_vsc_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Presupuestos (Quotes Foundation)
CREATE TABLE IF NOT EXISTS `quotes` (
  `id` VARCHAR(36) NOT NULL,
  `organization_id` VARCHAR(36) NOT NULL,
  `client_id` VARCHAR(36) NOT NULL,
  `plan_id` VARCHAR(36) NULL DEFAULT NULL,
  `title` VARCHAR(255) NOT NULL,
  `status` ENUM('DRAFT', 'PRESENTED', 'ACCEPTED', 'REJECTED') NOT NULL DEFAULT 'DRAFT',
  `subtotal` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `discount_type` ENUM('PERCENTAGE', 'FIXED') NOT NULL DEFAULT 'PERCENTAGE',
  `discount_value` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `discount_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `total` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'EUR',
  `show_discount` TINYINT(1) NOT NULL DEFAULT 1,
  `show_item_prices` TINYINT(1) NOT NULL DEFAULT 0,
  `notes` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_quotes_client` (`client_id`, `deleted_at`),
  CONSTRAINT `fk_quotes_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_quotes_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_quotes_plan` FOREIGN KEY (`plan_id`) REFERENCES `strategic_plans` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Ítems de Presupuesto (Quote Items)
CREATE TABLE IF NOT EXISTS `quote_items` (
  `id` VARCHAR(36) NOT NULL,
  `quote_id` VARCHAR(36) NOT NULL,
  `service_id` VARCHAR(36) NULL DEFAULT NULL,
  `service_name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `base_price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `final_price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `display_order` INT NOT NULL DEFAULT 0,
  `is_selected` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_qi_quote` (`quote_id`, `display_order`),
  CONSTRAINT `fk_qi_quote` FOREIGN KEY (`quote_id`) REFERENCES `quotes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
