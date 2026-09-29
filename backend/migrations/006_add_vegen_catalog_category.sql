ALTER TABLE `vegen_service_catalog`
ADD COLUMN `category` VARCHAR(100) NULL DEFAULT 'General' AFTER `name`;
