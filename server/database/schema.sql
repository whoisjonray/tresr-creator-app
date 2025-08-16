-- TRESR Creator App Database Schema
-- Designed for scalability to 944+ users
-- Replace localStorage with proper relational database

-- Drop existing tables if they exist (for development)
DROP TABLE IF EXISTS `design_variants`;
DROP TABLE IF EXISTS `design_products`;
DROP TABLE IF EXISTS `designs`;
DROP TABLE IF EXISTS `creators`;

-- Creators table (synced with Dynamic.xyz auth)
CREATE TABLE `creators` (
  `id` VARCHAR(36) PRIMARY KEY,
  `email` VARCHAR(255) UNIQUE NOT NULL,
  `name` VARCHAR(255),
  `wallet_address` VARCHAR(42),
  `avatar_url` VARCHAR(500),
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_email` (`email`),
  INDEX `idx_wallet` (`wallet_address`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Designs table (main design records)
CREATE TABLE `designs` (
  `id` VARCHAR(36) PRIMARY KEY,
  `creator_id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `status` ENUM('draft', 'published', 'archived') DEFAULT 'draft',
  
  -- Design images (stored as Cloudinary URLs)
  `front_design_url` VARCHAR(500),
  `front_design_public_id` VARCHAR(255),
  `back_design_url` VARCHAR(500),
  `back_design_public_id` VARCHAR(255),
  
  -- Design positioning data
  `front_position` JSON COMMENT 'JSON object with x, y coordinates',
  `back_position` JSON COMMENT 'JSON object with x, y coordinates',
  `front_scale` DECIMAL(3,2) DEFAULT 1.0,
  `back_scale` DECIMAL(3,2) DEFAULT 1.0,
  
  -- Metadata
  `tags` JSON COMMENT 'Array of tags',
  `print_method` VARCHAR(50) DEFAULT 'DTG',
  `nfc_experience` VARCHAR(50),
  
  -- Timestamps
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `published_at` TIMESTAMP NULL,
  
  FOREIGN KEY (`creator_id`) REFERENCES `creators`(`id`) ON DELETE CASCADE,
  INDEX `idx_creator` (`creator_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Design Products table (which products are enabled for each design)
CREATE TABLE `design_products` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `design_id` VARCHAR(36) NOT NULL,
  `product_template_id` VARCHAR(50) NOT NULL COMMENT 'e.g., tee, hoodie, hat',
  `is_enabled` BOOLEAN DEFAULT TRUE,
  `selected_colors` JSON COMMENT 'Array of selected color names',
  `price_override` DECIMAL(10,2) NULL COMMENT 'Optional custom price',
  `print_location` ENUM('front', 'back', 'both') DEFAULT 'front',
  
  -- Shopify integration
  `shopify_product_id` BIGINT NULL COMMENT 'Shopify product ID when published',
  `shopify_handle` VARCHAR(255) NULL,
  
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`design_id`) REFERENCES `designs`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_design_product` (`design_id`, `product_template_id`),
  INDEX `idx_design` (`design_id`),
  INDEX `idx_shopify` (`shopify_product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Design Variants table (generated mockup images for each color/product)
CREATE TABLE `design_variants` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `design_product_id` INT NOT NULL,
  `color` VARCHAR(50) NOT NULL,
  `side` ENUM('front', 'back') DEFAULT 'front',
  
  -- Generated mockup images (Cloudinary URLs)
  `mockup_url` VARCHAR(500) NOT NULL,
  `mockup_public_id` VARCHAR(255),
  `mockup_width` INT DEFAULT 2000,
  `mockup_height` INT DEFAULT 2000,
  
  -- Metadata
  `generated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `file_size_kb` INT COMMENT 'File size in KB',
  
  FOREIGN KEY (`design_product_id`) REFERENCES `design_products`(`id`) ON DELETE CASCADE,
  INDEX `idx_product` (`design_product_id`),
  INDEX `idx_color` (`color`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sessions table (for scaling beyond express-session memory store)
CREATE TABLE IF NOT EXISTS `sessions` (
  `session_id` VARCHAR(128) PRIMARY KEY,
  `expires` INT UNSIGNED NOT NULL,
  `data` MEDIUMTEXT,
  INDEX `idx_expires` (`expires`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Analytics table (track design performance)
CREATE TABLE `design_analytics` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `design_id` VARCHAR(36) NOT NULL,
  `event_type` ENUM('view', 'share', 'purchase') NOT NULL,
  `event_data` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`design_id`) REFERENCES `designs`(`id`) ON DELETE CASCADE,
  INDEX `idx_design_event` (`design_id`, `event_type`),
  INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Stored procedures for common operations

DELIMITER $$

-- Get paginated designs for a creator
CREATE PROCEDURE `GetCreatorDesigns`(
  IN p_creator_id VARCHAR(36),
  IN p_status VARCHAR(20),
  IN p_limit INT,
  IN p_offset INT
)
BEGIN
  SELECT 
    d.*,
    COUNT(DISTINCT dp.id) as product_count,
    COUNT(DISTINCT dv.id) as variant_count
  FROM designs d
  LEFT JOIN design_products dp ON d.id = dp.design_id
  LEFT JOIN design_variants dv ON dp.id = dv.design_product_id
  WHERE d.creator_id = p_creator_id
    AND (p_status IS NULL OR d.status = p_status)
  GROUP BY d.id
  ORDER BY d.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END$$

-- Get design with all products and variants
CREATE PROCEDURE `GetDesignDetails`(
  IN p_design_id VARCHAR(36)
)
BEGIN
  -- Get design info
  SELECT * FROM designs WHERE id = p_design_id;
  
  -- Get products
  SELECT * FROM design_products WHERE design_id = p_design_id;
  
  -- Get variants
  SELECT dv.*, dp.product_template_id 
  FROM design_variants dv
  JOIN design_products dp ON dv.design_product_id = dp.id
  WHERE dp.design_id = p_design_id;
END$$

DELIMITER ;

-- Shopify Products table (track products created in Shopify)
CREATE TABLE `shopify_products` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `shopify_id` BIGINT NOT NULL UNIQUE COMMENT 'Shopify product ID',
  `creator_id` VARCHAR(36) NOT NULL,
  `design_id` VARCHAR(36) NULL COMMENT 'Associated design ID if applicable',
  `title` VARCHAR(255) NOT NULL,
  `handle` VARCHAR(255) NOT NULL,
  `status` ENUM('draft', 'active', 'archived', 'deleted') DEFAULT 'draft',
  `commission_rate` DECIMAL(5,2) DEFAULT 40.00 COMMENT 'Commission percentage',
  `is_superproduct` BOOLEAN DEFAULT FALSE,
  `variant_count` INT DEFAULT 0,
  `total_sales` DECIMAL(10,2) DEFAULT 0.00,
  `total_commissions` DECIMAL(10,2) DEFAULT 0.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL,
  
  FOREIGN KEY (`creator_id`) REFERENCES `creators`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`design_id`) REFERENCES `designs`(`id`) ON DELETE SET NULL,
  INDEX `idx_shopify_id` (`shopify_id`),
  INDEX `idx_creator` (`creator_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Creator Commissions table (track earnings from sales)
CREATE TABLE `creator_commissions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `creator_id` VARCHAR(36) NOT NULL,
  `order_id` BIGINT NOT NULL COMMENT 'Shopify order ID',
  `product_id` BIGINT NOT NULL COMMENT 'Shopify product ID',
  `variant_id` BIGINT NOT NULL COMMENT 'Shopify variant ID',
  `line_item_id` BIGINT NOT NULL COMMENT 'Shopify line item ID',
  `sale_amount` DECIMAL(10,2) NOT NULL COMMENT 'Total sale amount for this item',
  `commission_rate` DECIMAL(5,2) NOT NULL COMMENT 'Commission percentage at time of sale',
  `commission_amount` DECIMAL(10,2) NOT NULL COMMENT 'Calculated commission amount',
  `quantity` INT NOT NULL DEFAULT 1,
  `order_date` TIMESTAMP NOT NULL COMMENT 'Date of the original order',
  `status` ENUM('pending', 'approved', 'paid', 'disputed', 'cancelled') DEFAULT 'pending',
  `payment_date` TIMESTAMP NULL,
  `payment_reference` VARCHAR(255) NULL COMMENT 'Payment transaction reference',
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`creator_id`) REFERENCES `creators`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `shopify_products`(`shopify_id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_commission` (`order_id`, `line_item_id`),
  INDEX `idx_creator` (`creator_id`),
  INDEX `idx_order` (`order_id`),
  INDEX `idx_product` (`product_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_order_date` (`order_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Shopify Webhook Events table (track webhook processing)
CREATE TABLE `shopify_webhooks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `webhook_id` VARCHAR(255) NOT NULL COMMENT 'Shopify webhook ID',
  `event_type` VARCHAR(100) NOT NULL COMMENT 'e.g., orders/create, orders/updated',
  `shopify_order_id` BIGINT NULL,
  `shopify_product_id` BIGINT NULL,
  `payload` JSON NOT NULL COMMENT 'Full webhook payload',
  `processed` BOOLEAN DEFAULT FALSE,
  `processing_attempts` INT DEFAULT 0,
  `error_message` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `processed_at` TIMESTAMP NULL,
  
  INDEX `idx_webhook_id` (`webhook_id`),
  INDEX `idx_event_type` (`event_type`),
  INDEX `idx_order_id` (`shopify_order_id`),
  INDEX `idx_processed` (`processed`),
  INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Commission Payments table (track payment batches to creators)
CREATE TABLE `commission_payments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `creator_id` VARCHAR(36) NOT NULL,
  `payment_period_start` DATE NOT NULL,
  `payment_period_end` DATE NOT NULL,
  `total_commission_amount` DECIMAL(10,2) NOT NULL,
  `commission_count` INT NOT NULL COMMENT 'Number of commissions included',
  `payment_method` ENUM('bank_transfer', 'paypal', 'crypto', 'check') NOT NULL,
  `payment_reference` VARCHAR(255) NOT NULL COMMENT 'Payment transaction reference',
  `payment_status` ENUM('pending', 'processing', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
  `payment_date` TIMESTAMP NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`creator_id`) REFERENCES `creators`(`id`) ON DELETE CASCADE,
  INDEX `idx_creator` (`creator_id`),
  INDEX `idx_period` (`payment_period_start`, `payment_period_end`),
  INDEX `idx_status` (`payment_status`),
  INDEX `idx_payment_date` (`payment_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sample data for testing
INSERT INTO creators (id, email, name) VALUES 
('test-creator-1', 'test@tresr.com', 'Test Creator');