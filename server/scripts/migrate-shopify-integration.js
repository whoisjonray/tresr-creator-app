const database = require('../services/database');

/**
 * Migration script to add Shopify integration tables
 * Run this to add the new tables for Shopify product management and commission tracking
 */

const SHOPIFY_TABLES_SQL = `
-- Shopify Products table (track products created in Shopify)
CREATE TABLE IF NOT EXISTS \`shopify_products\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`shopify_id\` BIGINT NOT NULL UNIQUE COMMENT 'Shopify product ID',
  \`creator_id\` VARCHAR(36) NOT NULL,
  \`design_id\` VARCHAR(36) NULL COMMENT 'Associated design ID if applicable',
  \`title\` VARCHAR(255) NOT NULL,
  \`handle\` VARCHAR(255) NOT NULL,
  \`status\` ENUM('draft', 'active', 'archived', 'deleted') DEFAULT 'draft',
  \`commission_rate\` DECIMAL(5,2) DEFAULT 40.00 COMMENT 'Commission percentage',
  \`is_superproduct\` BOOLEAN DEFAULT FALSE,
  \`variant_count\` INT DEFAULT 0,
  \`total_sales\` DECIMAL(10,2) DEFAULT 0.00,
  \`total_commissions\` DECIMAL(10,2) DEFAULT 0.00,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  \`deleted_at\` TIMESTAMP NULL,
  
  INDEX \`idx_shopify_id\` (\`shopify_id\`),
  INDEX \`idx_creator\` (\`creator_id\`),
  INDEX \`idx_status\` (\`status\`),
  INDEX \`idx_created\` (\`created_at\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Creator Commissions table (track earnings from sales)
CREATE TABLE IF NOT EXISTS \`creator_commissions\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`creator_id\` VARCHAR(36) NOT NULL,
  \`order_id\` BIGINT NOT NULL COMMENT 'Shopify order ID',
  \`product_id\` BIGINT NOT NULL COMMENT 'Shopify product ID',
  \`variant_id\` BIGINT NOT NULL COMMENT 'Shopify variant ID',
  \`line_item_id\` BIGINT NOT NULL COMMENT 'Shopify line item ID',
  \`sale_amount\` DECIMAL(10,2) NOT NULL COMMENT 'Total sale amount for this item',
  \`commission_rate\` DECIMAL(5,2) NOT NULL COMMENT 'Commission percentage at time of sale',
  \`commission_amount\` DECIMAL(10,2) NOT NULL COMMENT 'Calculated commission amount',
  \`quantity\` INT NOT NULL DEFAULT 1,
  \`order_date\` TIMESTAMP NOT NULL COMMENT 'Date of the original order',
  \`status\` ENUM('pending', 'approved', 'paid', 'disputed', 'cancelled') DEFAULT 'pending',
  \`payment_date\` TIMESTAMP NULL,
  \`payment_reference\` VARCHAR(255) NULL COMMENT 'Payment transaction reference',
  \`notes\` TEXT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY \`unique_commission\` (\`order_id\`, \`line_item_id\`),
  INDEX \`idx_creator\` (\`creator_id\`),
  INDEX \`idx_order\` (\`order_id\`),
  INDEX \`idx_product\` (\`product_id\`),
  INDEX \`idx_status\` (\`status\`),
  INDEX \`idx_order_date\` (\`order_date\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Shopify Webhook Events table (track webhook processing)
CREATE TABLE IF NOT EXISTS \`shopify_webhooks\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`webhook_id\` VARCHAR(255) NOT NULL COMMENT 'Shopify webhook ID',
  \`event_type\` VARCHAR(100) NOT NULL COMMENT 'e.g., orders/create, orders/updated',
  \`shopify_order_id\` BIGINT NULL,
  \`shopify_product_id\` BIGINT NULL,
  \`payload\` JSON NOT NULL COMMENT 'Full webhook payload',
  \`processed\` BOOLEAN DEFAULT FALSE,
  \`processing_attempts\` INT DEFAULT 0,
  \`error_message\` TEXT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`processed_at\` TIMESTAMP NULL,
  
  INDEX \`idx_webhook_id\` (\`webhook_id\`),
  INDEX \`idx_event_type\` (\`event_type\`),
  INDEX \`idx_order_id\` (\`shopify_order_id\`),
  INDEX \`idx_processed\` (\`processed\`),
  INDEX \`idx_created\` (\`created_at\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Commission Payments table (track payment batches to creators)
CREATE TABLE IF NOT EXISTS \`commission_payments\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`creator_id\` VARCHAR(36) NOT NULL,
  \`payment_period_start\` DATE NOT NULL,
  \`payment_period_end\` DATE NOT NULL,
  \`total_commission_amount\` DECIMAL(10,2) NOT NULL,
  \`commission_count\` INT NOT NULL COMMENT 'Number of commissions included',
  \`payment_method\` ENUM('bank_transfer', 'paypal', 'crypto', 'check') NOT NULL,
  \`payment_reference\` VARCHAR(255) NOT NULL COMMENT 'Payment transaction reference',
  \`payment_status\` ENUM('pending', 'processing', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
  \`payment_date\` TIMESTAMP NULL,
  \`notes\` TEXT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX \`idx_creator\` (\`creator_id\`),
  INDEX \`idx_period\` (\`payment_period_start\`, \`payment_period_end\`),
  INDEX \`idx_status\` (\`payment_status\`),
  INDEX \`idx_payment_date\` (\`payment_date\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

async function runMigration() {
  try {
    console.log('🚀 Starting Shopify integration migration...');
    
    const db = await database.init();
    
    // Split SQL into individual statements and execute
    const statements = SHOPIFY_TABLES_SQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    for (const statement of statements) {
      if (statement.includes('CREATE TABLE')) {
        const tableName = statement.match(/CREATE TABLE (?:IF NOT EXISTS )?`?(\w+)`?/i)?.[1];
        console.log(`Creating table: ${tableName}`);
        
        try {
          await db.exec(statement);
          console.log(`✅ Table ${tableName} created successfully`);
        } catch (error) {
          if (error.message.includes('already exists')) {
            console.log(`⚠️ Table ${tableName} already exists, skipping...`);
          } else {
            throw error;
          }
        }
      }
    }
    
    // Add foreign key constraints (if not using SQLite)
    if (!process.env.NODE_ENV || process.env.NODE_ENV === 'production') {
      console.log('Adding foreign key constraints...');
      
      const foreignKeyConstraints = [
        `ALTER TABLE shopify_products 
         ADD CONSTRAINT fk_shopify_products_creator 
         FOREIGN KEY (creator_id) REFERENCES creators(id) ON DELETE CASCADE`,
        
        `ALTER TABLE shopify_products 
         ADD CONSTRAINT fk_shopify_products_design 
         FOREIGN KEY (design_id) REFERENCES designs(id) ON DELETE SET NULL`,
        
        `ALTER TABLE creator_commissions 
         ADD CONSTRAINT fk_creator_commissions_creator 
         FOREIGN KEY (creator_id) REFERENCES creators(id) ON DELETE CASCADE`,
        
        `ALTER TABLE creator_commissions 
         ADD CONSTRAINT fk_creator_commissions_product 
         FOREIGN KEY (product_id) REFERENCES shopify_products(shopify_id) ON DELETE CASCADE`,
        
        `ALTER TABLE commission_payments 
         ADD CONSTRAINT fk_commission_payments_creator 
         FOREIGN KEY (creator_id) REFERENCES creators(id) ON DELETE CASCADE`
      ];
      
      for (const constraint of foreignKeyConstraints) {
        try {
          await db.exec(constraint);
          console.log('✅ Foreign key constraint added');
        } catch (error) {
          if (error.message.includes('already exists') || error.message.includes('duplicate')) {
            console.log('⚠️ Foreign key constraint already exists, skipping...');
          } else {
            console.log('⚠️ Could not add foreign key constraint (might be SQLite):', error.message);
          }
        }
      }
    }
    
    console.log('✅ Shopify integration migration completed successfully!');
    console.log(`
📊 New tables created:
- shopify_products: Track products created in Shopify
- creator_commissions: Track earnings from sales (40% commission)
- shopify_webhooks: Log webhook events for debugging
- commission_payments: Track payment batches to creators

🔗 API endpoints available at:
- POST /api/shopify/products/create
- POST /api/shopify/products/superproduct  
- PUT /api/shopify/products/:id
- DELETE /api/shopify/products/:id
- POST /api/shopify/webhooks/order
- GET /api/shopify/products
- GET /api/shopify/products/:id/commissions
    `);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigration };