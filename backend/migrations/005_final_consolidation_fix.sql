-- VEGEN DIGITAL — MIGRACIÓN 005: FINAL CONSOLIDATION FIX
-- Entorno: MySQL 5.7 / MySQL 8.0 Compatible
-- Archivo: backend/migrations/005_final_consolidation_fix.sql

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Asegurar tabla de catálogo de servicios Vegen
CREATE TABLE IF NOT EXISTS `vegen_service_catalog` (
  `id` VARCHAR(36) NOT NULL,
  `organization_id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) NULL DEFAULT 'General',
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

-- 2. Asegurar estructura de presupuestos e ítems
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
