-- TRESR SuperProduct Database Schema
-- Optimal structure for SuperProducts = one design mapped to multiple garment variants

-- Drop existing tables in correct order (foreign key dependencies)
DROP TABLE IF EXISTS `design_variants`;
DROP TABLE IF EXISTS `design_products`;
DROP TABLE IF EXISTS `superproduct_variants`;
DROP TABLE IF EXISTS `superproducts`;

-- SuperProducts table (parent entity - one per design)
CREATE TABLE `superproducts` (
  `id` VARCHAR(36) PRIMARY KEY,
  `design_id` VARCHAR(36) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `handle` VARCHAR(255) UNIQUE NOT NULL COMMENT 'URL slug for /designs/{handle}',
  `description` TEXT,
  `status` ENUM('draft', 'published', 'archived') DEFAULT 'draft',
  
  -- Design images (same design applied to all variants)
  `design_image_url` VARCHAR(500) NOT NULL,
  `design_public_id` VARCHAR(255),
  
  -- Positioning data (applied consistently across variants)
  `front_position` JSON COMMENT 'JSON object with x, y coordinates',
  `back_position` JSON COMMENT 'JSON object with x, y coordinates',
  `front_scale` DECIMAL(3,2) DEFAULT 1.0,
  `back_scale` DECIMAL(3,2) DEFAULT 1.0,
  
  -- SuperProduct metadata
  `base_price` DECIMAL(10,2) COMMENT 'Starting from price',
  `price_range_max` DECIMAL(10,2) COMMENT 'Highest variant price',
  `total_variants` INT DEFAULT 0,
  `featured_variant_id` INT NULL COMMENT 'Default variant to show',
  
  -- SEO and marketing
  `seo_title` VARCHAR(255),
  `seo_description` TEXT,
  `tags` JSON COMMENT 'Array of tags for categorization',
  `categories` JSON COMMENT 'Array of categories (apparel, drinkware, etc)',
  
  -- Shopify integration
  `shopify_page_id` BIGINT NULL COMMENT 'Shopify page ID for /designs/{handle}',
  `shopify_metafields` JSON COMMENT 'Shopify metafields data',
  
  -- Analytics
  `view_count` INT DEFAULT 0,
  `conversion_rate` DECIMAL(5,2) DEFAULT 0.00,
  
  -- Timestamps
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `published_at` TIMESTAMP NULL,
  
  FOREIGN KEY (`design_id`) REFERENCES `designs`(`id`) ON DELETE CASCADE,
  INDEX `idx_design` (`design_id`),
  INDEX `idx_handle` (`handle`),
  INDEX `idx_status` (`status`),
  INDEX `idx_published` (`published_at`),
  INDEX `idx_categories` ((CAST(categories AS CHAR(255))))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- SuperProduct Variants table (children - one per garment/color/size combo)
CREATE TABLE `superproduct_variants` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `superproduct_id` VARCHAR(36) NOT NULL,
  `garment_type` VARCHAR(50) NOT NULL COMMENT 'tee, hoodie, mug, phone-case',
  `garment_name` VARCHAR(100) NOT NULL COMMENT 'Classic T-Shirt, Pullover Hoodie',
  
  -- Variant options
  `color` VARCHAR(50) NOT NULL,
  `size` VARCHAR(20) NOT NULL,
  `fit` VARCHAR(20) NULL COMMENT 'mens, womens, unisex',
  
  -- Pricing
  `price` DECIMAL(10,2) NOT NULL,
  `cost` DECIMAL(10,2) COMMENT 'Cost for margin calculation',
  `commission_rate` DECIMAL(5,2) DEFAULT 40.00,
  
  -- Generated mockup
  `mockup_url` VARCHAR(500) NOT NULL,
  `mockup_public_id` VARCHAR(255),
  `thumbnail_url` VARCHAR(500) COMMENT 'Smaller image for grid view',
  
  -- Shopify integration
  `shopify_product_id` BIGINT NULL COMMENT 'Individual Shopify product ID',
  `shopify_variant_id` BIGINT NULL COMMENT 'Shopify variant ID within product',
  `shopify_handle` VARCHAR(255) NULL,
  
  -- Inventory and availability
  `is_available` BOOLEAN DEFAULT TRUE,
  `inventory_tracked` BOOLEAN DEFAULT FALSE,
  `inventory_quantity` INT DEFAULT 0,
  
  -- Analytics
  `sales_count` INT DEFAULT 0,
  `revenue_total` DECIMAL(10,2) DEFAULT 0.00,
  
  -- Print settings
  `print_areas` JSON COMMENT 'front, back, both',
  `print_method` VARCHAR(50) DEFAULT 'DTG',
  
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`superproduct_id`) REFERENCES `superproducts`(`id`) ON DELETE CASCADE,
  
  -- Unique constraint for variant combination
  UNIQUE KEY `unique_variant` (`superproduct_id`, `garment_type`, `color`, `size`, `fit`),
  
  INDEX `idx_superproduct` (`superproduct_id`),
  INDEX `idx_garment` (`garment_type`),
  INDEX `idx_color` (`color`),
  INDEX `idx_size` (`size`),
  INDEX `idx_shopify_product` (`shopify_product_id`),
  INDEX `idx_shopify_variant` (`shopify_variant_id`),
  INDEX `idx_available` (`is_available`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Update existing tables to link to SuperProducts

-- Update designs table to support SuperProduct relationship
ALTER TABLE `designs` ADD COLUMN `superproduct_id` VARCHAR(36) NULL;
ALTER TABLE `designs` ADD FOREIGN KEY (`superproduct_id`) REFERENCES `superproducts`(`id`) ON DELETE SET NULL;
ALTER TABLE `designs` ADD INDEX `idx_superproduct` (`superproduct_id`);

-- Update shopify_products to track SuperProduct relationship
ALTER TABLE `shopify_products` 
  ADD COLUMN `superproduct_id` VARCHAR(36) NULL,
  ADD COLUMN `variant_id` INT NULL COMMENT 'Links to superproduct_variants',
  ADD COLUMN `is_hidden` BOOLEAN DEFAULT FALSE COMMENT 'Hidden from search/collections';

ALTER TABLE `shopify_products` 
  ADD FOREIGN KEY (`superproduct_id`) REFERENCES `superproducts`(`id`) ON DELETE CASCADE,
  ADD FOREIGN KEY (`variant_id`) REFERENCES `superproduct_variants`(`id`) ON DELETE SET NULL;

-- Update creator_commissions to track SuperProduct context
ALTER TABLE `creator_commissions`
  ADD COLUMN `superproduct_id` VARCHAR(36) NULL COMMENT 'SuperProduct context',
  ADD COLUMN `variant_id` INT NULL COMMENT 'Specific variant purchased';

ALTER TABLE `creator_commissions`
  ADD FOREIGN KEY (`superproduct_id`) REFERENCES `superproducts`(`id`) ON DELETE CASCADE,
  ADD FOREIGN KEY (`variant_id`) REFERENCES `superproduct_variants`(`id`) ON DELETE SET NULL;

-- SuperProduct Collections table (many-to-many relationship)
CREATE TABLE `superproduct_collections` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `superproduct_id` VARCHAR(36) NOT NULL,
  `collection_type` ENUM('creator', 'category', 'custom', 'featured') NOT NULL,
  `collection_name` VARCHAR(255) NOT NULL,
  `collection_handle` VARCHAR(255) NOT NULL,
  `sort_order` INT DEFAULT 0,
  `is_featured` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`superproduct_id`) REFERENCES `superproducts`(`id`) ON DELETE CASCADE,
  
  INDEX `idx_superproduct` (`superproduct_id`),
  INDEX `idx_collection` (`collection_type`, `collection_handle`),
  INDEX `idx_featured` (`is_featured`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- SuperProduct Analytics table (detailed tracking)
CREATE TABLE `superproduct_analytics` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `superproduct_id` VARCHAR(36) NOT NULL,
  `event_type` ENUM('view', 'variant_select', 'add_to_cart', 'purchase', 'share') NOT NULL,
  `variant_id` INT NULL COMMENT 'Specific variant for variant-level events',
  
  -- Event data
  `event_data` JSON COMMENT 'Additional event context',
  `session_id` VARCHAR(255) NULL,
  `user_id` VARCHAR(36) NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` TEXT NULL,
  
  -- Attribution
  `referrer` VARCHAR(500) NULL,
  `utm_source` VARCHAR(100) NULL,
  `utm_medium` VARCHAR(100) NULL,
  `utm_campaign` VARCHAR(100) NULL,
  
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`superproduct_id`) REFERENCES `superproducts`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`variant_id`) REFERENCES `superproduct_variants`(`id`) ON DELETE CASCADE,
  
  INDEX `idx_superproduct_event` (`superproduct_id`, `event_type`),
  INDEX `idx_variant_event` (`variant_id`, `event_type`),
  INDEX `idx_created` (`created_at`),
  INDEX `idx_session` (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Stored procedures for SuperProduct operations

DELIMITER $$

-- Get complete SuperProduct with all variants
CREATE PROCEDURE `GetSuperProductDetails`(
  IN p_superproduct_id VARCHAR(36)
)
BEGIN
  -- Get SuperProduct info
  SELECT sp.*, 
    d.creator_id,
    c.name as creator_name,
    c.wallet_address as creator_wallet
  FROM superproducts sp
  JOIN designs d ON sp.design_id = d.id
  JOIN creators c ON d.creator_id = c.id
  WHERE sp.id = p_superproduct_id;
  
  -- Get all variants grouped by garment type
  SELECT 
    garment_type,
    garment_name,
    COUNT(*) as variant_count,
    MIN(price) as min_price,
    MAX(price) as max_price,
    GROUP_CONCAT(DISTINCT color ORDER BY color) as available_colors,
    GROUP_CONCAT(DISTINCT size ORDER BY 
      CASE size 
        WHEN 'XS' THEN 1 WHEN 'S' THEN 2 WHEN 'M' THEN 3 
        WHEN 'L' THEN 4 WHEN 'XL' THEN 5 WHEN '2XL' THEN 6 
        WHEN '3XL' THEN 7 ELSE 8 END
    ) as available_sizes
  FROM superproduct_variants 
  WHERE superproduct_id = p_superproduct_id 
    AND is_available = TRUE
  GROUP BY garment_type, garment_name
  ORDER BY MIN(price);
  
  -- Get specific variants for dynamic loading
  SELECT * FROM superproduct_variants 
  WHERE superproduct_id = p_superproduct_id 
    AND is_available = TRUE
  ORDER BY garment_type, price, color, size;
END$$

-- Get SuperProducts for a creator with analytics
CREATE PROCEDURE `GetCreatorSuperProducts`(
  IN p_creator_id VARCHAR(36),
  IN p_status VARCHAR(20),
  IN p_limit INT,
  IN p_offset INT
)
BEGIN
  SELECT 
    sp.*,
    COUNT(DISTINCT spv.id) as total_variants,
    COUNT(DISTINCT spv.garment_type) as garment_types,
    SUM(spv.sales_count) as total_sales,
    SUM(spv.revenue_total) as total_revenue,
    AVG(spv.commission_rate) as avg_commission_rate
  FROM superproducts sp
  JOIN designs d ON sp.design_id = d.id
  LEFT JOIN superproduct_variants spv ON sp.id = spv.superproduct_id
  WHERE d.creator_id = p_creator_id
    AND (p_status IS NULL OR sp.status = p_status)
  GROUP BY sp.id
  ORDER BY sp.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END$$

-- Get SuperProduct analytics summary
CREATE PROCEDURE `GetSuperProductAnalytics`(
  IN p_superproduct_id VARCHAR(36),
  IN p_days_back INT DEFAULT 30
)
BEGIN
  SELECT 
    event_type,
    COUNT(*) as event_count,
    COUNT(DISTINCT session_id) as unique_sessions,
    DATE(created_at) as event_date
  FROM superproduct_analytics
  WHERE superproduct_id = p_superproduct_id
    AND created_at >= DATE_SUB(NOW(), INTERVAL p_days_back DAY)
  GROUP BY event_type, DATE(created_at)
  ORDER BY event_date DESC, event_type;
END$$

DELIMITER ;

-- Indexes for performance optimization
CREATE INDEX idx_superproducts_creator ON superproducts(design_id);
CREATE INDEX idx_variants_price ON superproduct_variants(price);
CREATE INDEX idx_variants_sales ON superproduct_variants(sales_count DESC);
CREATE INDEX idx_analytics_date ON superproduct_analytics(created_at DESC);

-- Sample data for testing
INSERT INTO superproducts (id, design_id, title, handle, description, design_image_url, status) 
SELECT 
  CONCAT('sp-', d.id),
  d.id,
  CONCAT(d.name, ' Design'),
  LOWER(REPLACE(REPLACE(d.name, ' ', '-'), '_', '-')),
  CONCAT('Available on multiple products featuring ', d.name),
  d.front_design_url,
  d.status
FROM designs d
WHERE d.status = 'published';