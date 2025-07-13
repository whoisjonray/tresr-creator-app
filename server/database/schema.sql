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

-- Sample data for testing
INSERT INTO creators (id, email, name) VALUES 
('test-creator-1', 'test@tresr.com', 'Test Creator');