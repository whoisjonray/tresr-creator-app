#!/usr/bin/env node

/**
 * TRESR Creator App Database Migration v2
 * 
 * Creates complete database schema for:
 * - User management (Dynamic.xyz integration)
 * - Creator mappings (Sanity to Dynamic)
 * - Design catalog (imported from Sanity)
 * - Product management (Shopify integration)
 * - Commission tracking (40% creator earnings)
 * 
 * Supports both SQLite and MySQL databases
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const mysql = require('mysql2/promise');

// Database configuration
const config = {
  sqlite: {
    database: path.join(__dirname, '../data/tresr-creator.db')
  },
  mysql: {
    host: process.env.MYSQL_HOST || 'localhost',
    port: process.env.MYSQL_PORT || 3306,
    user: process.env.MYSQL_USER || 'tresr_app',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'tresr_creator_app'
  }
};

// SQL Schema Definitions
const sqlSchemas = {
  sqlite: {
    // Users table - Dynamic.xyz authentication
    users: `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dynamic_user_id TEXT UNIQUE NOT NULL,
        wallet_address TEXT UNIQUE,
        email TEXT UNIQUE,
        username TEXT UNIQUE,
        display_name TEXT,
        profile_image_url TEXT,
        bio TEXT,
        social_links TEXT, -- JSON string for social media links
        user_type TEXT CHECK(user_type IN ('creator', 'customer', 'admin')) DEFAULT 'customer',
        verification_status TEXT CHECK(verification_status IN ('pending', 'verified', 'rejected')) DEFAULT 'pending',
        nfkey_level INTEGER DEFAULT 0,
        total_earnings DECIMAL(15,2) DEFAULT 0.00,
        commission_rate DECIMAL(5,4) DEFAULT 0.4000, -- 40% default
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME,
        is_active BOOLEAN DEFAULT 1,
        metadata TEXT -- JSON string for additional user data
      )
    `,

    // Creator mappings - Links Sanity creators to Dynamic users
    creator_mappings: `
      CREATE TABLE IF NOT EXISTS creator_mappings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sanity_creator_id TEXT UNIQUE NOT NULL,
        dynamic_user_id TEXT NOT NULL,
        creator_name TEXT NOT NULL,
        sanity_slug TEXT,
        wallet_address TEXT,
        social_handles TEXT, -- JSON string
        creator_tier TEXT CHECK(creator_tier IN ('bronze', 'silver', 'gold', 'platinum')) DEFAULT 'bronze',
        total_designs INTEGER DEFAULT 0,
        total_sales INTEGER DEFAULT 0,
        total_commissions DECIMAL(15,2) DEFAULT 0.00,
        mapping_confidence DECIMAL(3,2) DEFAULT 1.00, -- 0.00 to 1.00
        verification_method TEXT, -- 'wallet', 'manual', 'social', etc.
        mapped_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        verified_at DATETIME,
        notes TEXT,
        FOREIGN KEY (dynamic_user_id) REFERENCES users(dynamic_user_id) ON DELETE CASCADE
      )
    `,

    // Designs table - Imported from Sanity
    designs: `
      CREATE TABLE IF NOT EXISTS designs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sanity_design_id TEXT UNIQUE NOT NULL,
        creator_mapping_id INTEGER,
        title TEXT NOT NULL,
        description TEXT,
        slug TEXT UNIQUE,
        category TEXT,
        tags TEXT, -- JSON array as string
        design_url TEXT, -- Cloudinary or image URL
        thumbnail_url TEXT,
        high_res_url TEXT,
        design_type TEXT CHECK(design_type IN ('graphic', 'pattern', 'text', 'mixed')) DEFAULT 'graphic',
        color_palette TEXT, -- JSON array of colors
        style_tags TEXT, -- JSON array of style descriptors
        popularity_score DECIMAL(5,2) DEFAULT 0.00,
        download_count INTEGER DEFAULT 0,
        favorite_count INTEGER DEFAULT 0,
        view_count INTEGER DEFAULT 0,
        is_featured BOOLEAN DEFAULT 0,
        is_public BOOLEAN DEFAULT 1,
        price_tier TEXT CHECK(price_tier IN ('free', 'premium', 'exclusive')) DEFAULT 'free',
        license_type TEXT DEFAULT 'commercial',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        imported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        sanity_metadata TEXT, -- JSON string of original Sanity data
        FOREIGN KEY (creator_mapping_id) REFERENCES creator_mappings(id) ON DELETE SET NULL
      )
    `,

    // Products table - Shopify product integration
    products: `
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shopify_product_id TEXT UNIQUE NOT NULL,
        design_id INTEGER,
        creator_mapping_id INTEGER,
        title TEXT NOT NULL,
        handle TEXT UNIQUE NOT NULL,
        description TEXT,
        product_type TEXT,
        vendor TEXT,
        status TEXT CHECK(status IN ('active', 'draft', 'archived')) DEFAULT 'draft',
        price DECIMAL(10,2),
        compare_at_price DECIMAL(10,2),
        sku TEXT,
        barcode TEXT,
        weight DECIMAL(8,2),
        weight_unit TEXT DEFAULT 'g',
        requires_shipping BOOLEAN DEFAULT 1,
        taxable BOOLEAN DEFAULT 1,
        inventory_quantity INTEGER DEFAULT 0,
        inventory_management TEXT DEFAULT 'shopify',
        inventory_policy TEXT DEFAULT 'deny',
        fulfillment_service TEXT DEFAULT 'manual',
        tags TEXT, -- JSON array as string
        images TEXT, -- JSON array of image URLs
        variants TEXT, -- JSON array of variant data
        options TEXT, -- JSON array of option data
        metafields TEXT, -- JSON object of custom fields
        seo_title TEXT,
        seo_description TEXT,
        sales_count INTEGER DEFAULT 0,
        revenue_total DECIMAL(15,2) DEFAULT 0.00,
        commission_paid DECIMAL(15,2) DEFAULT 0.00,
        commission_pending DECIMAL(15,2) DEFAULT 0.00,
        is_featured BOOLEAN DEFAULT 0,
        featured_position INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        published_at DATETIME,
        shopify_created_at DATETIME,
        shopify_updated_at DATETIME,
        FOREIGN KEY (design_id) REFERENCES designs(id) ON DELETE SET NULL,
        FOREIGN KEY (creator_mapping_id) REFERENCES creator_mappings(id) ON DELETE SET NULL
      )
    `,

    // Commissions table - 40% creator earnings tracking
    commissions: `
      CREATE TABLE IF NOT EXISTS commissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        creator_mapping_id INTEGER NOT NULL,
        product_id INTEGER,
        order_id TEXT, -- Shopify order ID
        line_item_id TEXT, -- Shopify line item ID
        sale_amount DECIMAL(10,2) NOT NULL,
        commission_rate DECIMAL(5,4) DEFAULT 0.4000, -- 40%
        commission_amount DECIMAL(10,2) NOT NULL,
        currency TEXT DEFAULT 'USD',
        payment_status TEXT CHECK(payment_status IN ('pending', 'processing', 'paid', 'failed', 'cancelled')) DEFAULT 'pending',
        payment_method TEXT, -- 'stripe', 'paypal', 'crypto', etc.
        payment_reference TEXT, -- External payment ID
        transaction_hash TEXT, -- Blockchain transaction if crypto
        wallet_address TEXT, -- Recipient wallet
        sale_date DATETIME NOT NULL,
        commission_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        payment_date DATETIME,
        due_date DATETIME, -- When payment is due
        notes TEXT,
        metadata TEXT, -- JSON string for additional data
        shopify_order_data TEXT, -- JSON string of order details
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (creator_mapping_id) REFERENCES creator_mappings(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
      )
    `,

    // Sales tracking table
    sales: `
      CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shopify_order_id TEXT NOT NULL,
        shopify_line_item_id TEXT UNIQUE NOT NULL,
        product_id INTEGER,
        creator_mapping_id INTEGER,
        customer_email TEXT,
        customer_name TEXT,
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        discount_amount DECIMAL(10,2) DEFAULT 0.00,
        tax_amount DECIMAL(10,2) DEFAULT 0.00,
        currency TEXT DEFAULT 'USD',
        order_status TEXT,
        fulfillment_status TEXT,
        financial_status TEXT,
        refund_amount DECIMAL(10,2) DEFAULT 0.00,
        commission_calculated BOOLEAN DEFAULT 0,
        commission_id INTEGER,
        sale_date DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        shopify_data TEXT, -- JSON string of full order data
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
        FOREIGN KEY (creator_mapping_id) REFERENCES creator_mappings(id) ON DELETE SET NULL,
        FOREIGN KEY (commission_id) REFERENCES commissions(id) ON DELETE SET NULL
      )
    `,

    // Analytics and performance tracking
    analytics: `
      CREATE TABLE IF NOT EXISTS analytics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entity_type TEXT NOT NULL, -- 'user', 'creator', 'design', 'product'
        entity_id INTEGER NOT NULL,
        metric_name TEXT NOT NULL, -- 'views', 'sales', 'revenue', 'commissions'
        metric_value DECIMAL(15,4) NOT NULL,
        metric_date DATE NOT NULL,
        time_period TEXT DEFAULT 'daily', -- 'hourly', 'daily', 'weekly', 'monthly'
        metadata TEXT, -- JSON string for additional context
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `,

    // Payment tracking
    payments: `
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        creator_mapping_id INTEGER NOT NULL,
        payment_type TEXT CHECK(payment_type IN ('commission', 'bonus', 'refund', 'adjustment')) DEFAULT 'commission',
        amount DECIMAL(15,2) NOT NULL,
        currency TEXT DEFAULT 'USD',
        payment_method TEXT NOT NULL, -- 'stripe', 'paypal', 'crypto', 'bank_transfer'
        payment_reference TEXT, -- External payment system reference
        transaction_hash TEXT, -- For crypto payments
        wallet_address TEXT,
        status TEXT CHECK(status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')) DEFAULT 'pending',
        commission_ids TEXT, -- JSON array of commission IDs included in this payment
        total_commissions DECIMAL(15,2), -- Sum of commissions in this payment
        fees DECIMAL(10,2) DEFAULT 0.00, -- Payment processing fees
        net_amount DECIMAL(15,2), -- Amount after fees
        scheduled_date DATETIME,
        processed_date DATETIME,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (creator_mapping_id) REFERENCES creator_mappings(id) ON DELETE CASCADE
      )
    `
  },

  mysql: {
    // Users table - Dynamic.xyz authentication
    users: `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        dynamic_user_id VARCHAR(255) UNIQUE NOT NULL,
        wallet_address VARCHAR(255) UNIQUE,
        email VARCHAR(255) UNIQUE,
        username VARCHAR(100) UNIQUE,
        display_name VARCHAR(255),
        profile_image_url TEXT,
        bio TEXT,
        social_links JSON,
        user_type ENUM('creator', 'customer', 'admin') DEFAULT 'customer',
        verification_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
        nfkey_level INT DEFAULT 0,
        total_earnings DECIMAL(15,2) DEFAULT 0.00,
        commission_rate DECIMAL(5,4) DEFAULT 0.4000,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        last_login TIMESTAMP NULL,
        is_active BOOLEAN DEFAULT TRUE,
        metadata JSON,
        INDEX idx_dynamic_user_id (dynamic_user_id),
        INDEX idx_wallet_address (wallet_address),
        INDEX idx_email (email),
        INDEX idx_user_type (user_type),
        INDEX idx_verification_status (verification_status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `,

    // Creator mappings - Links Sanity creators to Dynamic users
    creator_mappings: `
      CREATE TABLE IF NOT EXISTS creator_mappings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sanity_creator_id VARCHAR(255) UNIQUE NOT NULL,
        dynamic_user_id VARCHAR(255) NOT NULL,
        creator_name VARCHAR(255) NOT NULL,
        sanity_slug VARCHAR(255),
        wallet_address VARCHAR(255),
        social_handles JSON,
        creator_tier ENUM('bronze', 'silver', 'gold', 'platinum') DEFAULT 'bronze',
        total_designs INT DEFAULT 0,
        total_sales INT DEFAULT 0,
        total_commissions DECIMAL(15,2) DEFAULT 0.00,
        mapping_confidence DECIMAL(3,2) DEFAULT 1.00,
        verification_method VARCHAR(100),
        mapped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        verified_at TIMESTAMP NULL,
        notes TEXT,
        INDEX idx_sanity_creator_id (sanity_creator_id),
        INDEX idx_dynamic_user_id (dynamic_user_id),
        INDEX idx_wallet_address (wallet_address),
        INDEX idx_creator_tier (creator_tier),
        INDEX idx_verification_status (verification_method),
        FOREIGN KEY (dynamic_user_id) REFERENCES users(dynamic_user_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `,

    // Designs table - Imported from Sanity
    designs: `
      CREATE TABLE IF NOT EXISTS designs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sanity_design_id VARCHAR(255) UNIQUE NOT NULL,
        creator_mapping_id INT,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        slug VARCHAR(255) UNIQUE,
        category VARCHAR(100),
        tags JSON,
        design_url TEXT,
        thumbnail_url TEXT,
        high_res_url TEXT,
        design_type ENUM('graphic', 'pattern', 'text', 'mixed') DEFAULT 'graphic',
        color_palette JSON,
        style_tags JSON,
        popularity_score DECIMAL(5,2) DEFAULT 0.00,
        download_count INT DEFAULT 0,
        favorite_count INT DEFAULT 0,
        view_count INT DEFAULT 0,
        is_featured BOOLEAN DEFAULT FALSE,
        is_public BOOLEAN DEFAULT TRUE,
        price_tier ENUM('free', 'premium', 'exclusive') DEFAULT 'free',
        license_type VARCHAR(100) DEFAULT 'commercial',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        sanity_metadata JSON,
        INDEX idx_sanity_design_id (sanity_design_id),
        INDEX idx_creator_mapping_id (creator_mapping_id),
        INDEX idx_slug (slug),
        INDEX idx_category (category),
        INDEX idx_design_type (design_type),
        INDEX idx_is_featured (is_featured),
        INDEX idx_is_public (is_public),
        INDEX idx_popularity_score (popularity_score),
        FULLTEXT idx_title_description (title, description),
        FOREIGN KEY (creator_mapping_id) REFERENCES creator_mappings(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `,

    // Products table - Shopify product integration
    products: `
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        shopify_product_id VARCHAR(255) UNIQUE NOT NULL,
        design_id INT,
        creator_mapping_id INT,
        title VARCHAR(500) NOT NULL,
        handle VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        product_type VARCHAR(255),
        vendor VARCHAR(255),
        status ENUM('active', 'draft', 'archived') DEFAULT 'draft',
        price DECIMAL(10,2),
        compare_at_price DECIMAL(10,2),
        sku VARCHAR(255),
        barcode VARCHAR(255),
        weight DECIMAL(8,2),
        weight_unit VARCHAR(10) DEFAULT 'g',
        requires_shipping BOOLEAN DEFAULT TRUE,
        taxable BOOLEAN DEFAULT TRUE,
        inventory_quantity INT DEFAULT 0,
        inventory_management VARCHAR(100) DEFAULT 'shopify',
        inventory_policy VARCHAR(100) DEFAULT 'deny',
        fulfillment_service VARCHAR(100) DEFAULT 'manual',
        tags JSON,
        images JSON,
        variants JSON,
        options JSON,
        metafields JSON,
        seo_title VARCHAR(255),
        seo_description TEXT,
        sales_count INT DEFAULT 0,
        revenue_total DECIMAL(15,2) DEFAULT 0.00,
        commission_paid DECIMAL(15,2) DEFAULT 0.00,
        commission_pending DECIMAL(15,2) DEFAULT 0.00,
        is_featured BOOLEAN DEFAULT FALSE,
        featured_position INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        published_at TIMESTAMP NULL,
        shopify_created_at TIMESTAMP NULL,
        shopify_updated_at TIMESTAMP NULL,
        INDEX idx_shopify_product_id (shopify_product_id),
        INDEX idx_design_id (design_id),
        INDEX idx_creator_mapping_id (creator_mapping_id),
        INDEX idx_handle (handle),
        INDEX idx_status (status),
        INDEX idx_product_type (product_type),
        INDEX idx_vendor (vendor),
        INDEX idx_is_featured (is_featured),
        INDEX idx_sales_count (sales_count),
        FULLTEXT idx_title_description (title, description),
        FOREIGN KEY (design_id) REFERENCES designs(id) ON DELETE SET NULL,
        FOREIGN KEY (creator_mapping_id) REFERENCES creator_mappings(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `,

    // Commissions table - 40% creator earnings tracking
    commissions: `
      CREATE TABLE IF NOT EXISTS commissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        creator_mapping_id INT NOT NULL,
        product_id INT,
        order_id VARCHAR(255),
        line_item_id VARCHAR(255),
        sale_amount DECIMAL(10,2) NOT NULL,
        commission_rate DECIMAL(5,4) DEFAULT 0.4000,
        commission_amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'USD',
        payment_status ENUM('pending', 'processing', 'paid', 'failed', 'cancelled') DEFAULT 'pending',
        payment_method VARCHAR(100),
        payment_reference VARCHAR(255),
        transaction_hash VARCHAR(255),
        wallet_address VARCHAR(255),
        sale_date TIMESTAMP NOT NULL,
        commission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        payment_date TIMESTAMP NULL,
        due_date TIMESTAMP NULL,
        notes TEXT,
        metadata JSON,
        shopify_order_data JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_creator_mapping_id (creator_mapping_id),
        INDEX idx_product_id (product_id),
        INDEX idx_order_id (order_id),
        INDEX idx_line_item_id (line_item_id),
        INDEX idx_payment_status (payment_status),
        INDEX idx_sale_date (sale_date),
        INDEX idx_commission_date (commission_date),
        INDEX idx_payment_date (payment_date),
        FOREIGN KEY (creator_mapping_id) REFERENCES creator_mappings(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `,

    // Sales tracking table
    sales: `
      CREATE TABLE IF NOT EXISTS sales (
        id INT AUTO_INCREMENT PRIMARY KEY,
        shopify_order_id VARCHAR(255) NOT NULL,
        shopify_line_item_id VARCHAR(255) UNIQUE NOT NULL,
        product_id INT,
        creator_mapping_id INT,
        customer_email VARCHAR(255),
        customer_name VARCHAR(255),
        quantity INT NOT NULL DEFAULT 1,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        discount_amount DECIMAL(10,2) DEFAULT 0.00,
        tax_amount DECIMAL(10,2) DEFAULT 0.00,
        currency VARCHAR(10) DEFAULT 'USD',
        order_status VARCHAR(100),
        fulfillment_status VARCHAR(100),
        financial_status VARCHAR(100),
        refund_amount DECIMAL(10,2) DEFAULT 0.00,
        commission_calculated BOOLEAN DEFAULT FALSE,
        commission_id INT,
        sale_date TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        shopify_data JSON,
        INDEX idx_shopify_order_id (shopify_order_id),
        INDEX idx_shopify_line_item_id (shopify_line_item_id),
        INDEX idx_product_id (product_id),
        INDEX idx_creator_mapping_id (creator_mapping_id),
        INDEX idx_customer_email (customer_email),
        INDEX idx_sale_date (sale_date),
        INDEX idx_commission_calculated (commission_calculated),
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
        FOREIGN KEY (creator_mapping_id) REFERENCES creator_mappings(id) ON DELETE SET NULL,
        FOREIGN KEY (commission_id) REFERENCES commissions(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `,

    // Analytics and performance tracking
    analytics: `
      CREATE TABLE IF NOT EXISTS analytics (
        id INT AUTO_INCREMENT PRIMARY KEY,
        entity_type VARCHAR(50) NOT NULL,
        entity_id INT NOT NULL,
        metric_name VARCHAR(100) NOT NULL,
        metric_value DECIMAL(15,4) NOT NULL,
        metric_date DATE NOT NULL,
        time_period VARCHAR(20) DEFAULT 'daily',
        metadata JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_entity (entity_type, entity_id),
        INDEX idx_metric (metric_name),
        INDEX idx_date (metric_date),
        INDEX idx_time_period (time_period),
        INDEX idx_composite (entity_type, entity_id, metric_name, metric_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `,

    // Payment tracking
    payments: `
      CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        creator_mapping_id INT NOT NULL,
        payment_type ENUM('commission', 'bonus', 'refund', 'adjustment') DEFAULT 'commission',
        amount DECIMAL(15,2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'USD',
        payment_method VARCHAR(100) NOT NULL,
        payment_reference VARCHAR(255),
        transaction_hash VARCHAR(255),
        wallet_address VARCHAR(255),
        status ENUM('pending', 'processing', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
        commission_ids JSON,
        total_commissions DECIMAL(15,2),
        fees DECIMAL(10,2) DEFAULT 0.00,
        net_amount DECIMAL(15,2),
        scheduled_date TIMESTAMP NULL,
        processed_date TIMESTAMP NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_creator_mapping_id (creator_mapping_id),
        INDEX idx_payment_type (payment_type),
        INDEX idx_payment_method (payment_method),
        INDEX idx_status (status),
        INDEX idx_scheduled_date (scheduled_date),
        INDEX idx_processed_date (processed_date),
        FOREIGN KEY (creator_mapping_id) REFERENCES creator_mappings(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `
  }
};

// Database initialization functions
class DatabaseMigrator {
  constructor(dbType = 'sqlite') {
    this.dbType = dbType;
    this.config = config[dbType];
    this.schemas = sqlSchemas[dbType];
  }

  async initSQLite() {
    const dbDir = path.dirname(this.config.database);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.config.database, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('✅ Connected to SQLite database');
          resolve(db);
        }
      });
    });
  }

  async initMySQL() {
    try {
      const connection = await mysql.createConnection({
        host: this.config.host,
        port: this.config.port,
        user: this.config.user,
        password: this.config.password
      });

      // Create database if it doesn't exist
      await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${this.config.database}\``);
      await connection.end();

      // Connect to the created database
      const db = await mysql.createConnection(this.config);
      console.log('✅ Connected to MySQL database');
      return db;
    } catch (error) {
      console.error('❌ MySQL connection failed:', error.message);
      throw error;
    }
  }

  async executeSQLite(db, sql) {
    return new Promise((resolve, reject) => {
      db.exec(sql, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async executeMySQL(db, sql) {
    await db.execute(sql);
  }

  async createTables(db) {
    const tableOrder = [
      'users',
      'creator_mappings', 
      'designs',
      'products',
      'commissions',
      'sales',
      'analytics',
      'payments'
    ];

    console.log('🔧 Creating database tables...');

    for (const tableName of tableOrder) {
      try {
        const sql = this.schemas[tableName];
        
        if (this.dbType === 'sqlite') {
          await this.executeSQLite(db, sql);
        } else {
          await this.executeMySQL(db, sql);
        }
        
        console.log(`✅ Created table: ${tableName}`);
      } catch (error) {
        console.error(`❌ Failed to create table ${tableName}:`, error.message);
        throw error;
      }
    }
  }

  async createIndexes(db) {
    console.log('🔧 Creating additional indexes...');

    const additionalIndexes = {
      sqlite: [
        'CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at)',
        'CREATE INDEX IF NOT EXISTS idx_commissions_amount ON commissions(commission_amount)',
        'CREATE INDEX IF NOT EXISTS idx_sales_total_price ON sales(total_price)',
        'CREATE INDEX IF NOT EXISTS idx_products_price ON products(price)',
        'CREATE INDEX IF NOT EXISTS idx_designs_created_at ON designs(created_at)'
      ],
      mysql: [
        'CREATE INDEX idx_users_created_at ON users(created_at)',
        'CREATE INDEX idx_commissions_amount ON commissions(commission_amount)',
        'CREATE INDEX idx_sales_total_price ON sales(total_price)',
        'CREATE INDEX idx_products_price ON products(price)',
        'CREATE INDEX idx_designs_created_at ON designs(created_at)'
      ]
    };

    const indexes = additionalIndexes[this.dbType] || [];

    for (const indexSQL of indexes) {
      try {
        if (this.dbType === 'sqlite') {
          await this.executeSQLite(db, indexSQL);
        } else {
          await this.executeMySQL(db, indexSQL);
        }
        console.log('✅ Created additional index');
      } catch (error) {
        // Index might already exist, continue
        console.log('ℹ️ Index already exists or creation skipped');
      }
    }
  }

  async seedInitialData(db) {
    console.log('🌱 Seeding initial data...');

    const seedData = {
      sqlite: [
        // Insert admin user
        `INSERT OR IGNORE INTO users (
          dynamic_user_id, email, username, display_name, user_type, 
          verification_status, commission_rate
        ) VALUES (
          'admin-dynamic-id', 'admin@tresr.com', 'admin', 'TRESR Admin', 
          'admin', 'verified', 0.0000
        )`,
        
        // Insert sample creator tiers for reference
        `INSERT OR IGNORE INTO analytics (
          entity_type, entity_id, metric_name, metric_value, metric_date
        ) VALUES 
          ('system', 0, 'commission_rate_bronze', 0.4000, date('now')),
          ('system', 0, 'commission_rate_silver', 0.4500, date('now')),
          ('system', 0, 'commission_rate_gold', 0.5000, date('now')),
          ('system', 0, 'commission_rate_platinum', 0.5500, date('now'))`
      ],
      mysql: [
        // Insert admin user
        `INSERT IGNORE INTO users (
          dynamic_user_id, email, username, display_name, user_type, 
          verification_status, commission_rate
        ) VALUES (
          'admin-dynamic-id', 'admin@tresr.com', 'admin', 'TRESR Admin', 
          'admin', 'verified', 0.0000
        )`,
        
        // Insert sample creator tiers for reference
        `INSERT IGNORE INTO analytics (
          entity_type, entity_id, metric_name, metric_value, metric_date
        ) VALUES 
          ('system', 0, 'commission_rate_bronze', 0.4000, CURDATE()),
          ('system', 0, 'commission_rate_silver', 0.4500, CURDATE()),
          ('system', 0, 'commission_rate_gold', 0.5000, CURDATE()),
          ('system', 0, 'commission_rate_platinum', 0.5500, CURDATE())`
      ]
    };

    const queries = seedData[this.dbType] || [];

    for (const query of queries) {
      try {
        if (this.dbType === 'sqlite') {
          await this.executeSQLite(db, query);
        } else {
          await this.executeMySQL(db, query);
        }
        console.log('✅ Seeded initial data');
      } catch (error) {
        console.error('❌ Failed to seed data:', error.message);
      }
    }
  }

  async migrate() {
    console.log(`🚀 Starting database migration for ${this.dbType.toUpperCase()}...`);

    let db;
    try {
      // Initialize database connection
      if (this.dbType === 'sqlite') {
        db = await this.initSQLite();
      } else {
        db = await this.initMySQL();
      }

      // Create tables
      await this.createTables(db);

      // Create additional indexes
      await this.createIndexes(db);

      // Seed initial data
      await this.seedInitialData(db);

      console.log('🎉 Database migration completed successfully!');

      // Close connection
      if (this.dbType === 'sqlite') {
        db.close();
      } else {
        await db.end();
      }

    } catch (error) {
      console.error('❌ Migration failed:', error);
      
      if (db) {
        if (this.dbType === 'sqlite') {
          db.close();
        } else {
          await db.end();
        }
      }
      
      process.exit(1);
    }
  }

  // Utility method to test database connection
  async testConnection() {
    try {
      let db;
      if (this.dbType === 'sqlite') {
        db = await this.initSQLite();
        db.close();
      } else {
        db = await this.initMySQL();
        await db.end();
      }
      console.log(`✅ ${this.dbType.toUpperCase()} connection test successful`);
      return true;
    } catch (error) {
      console.error(`❌ ${this.dbType.toUpperCase()} connection test failed:`, error.message);
      return false;
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'migrate';
  const dbType = args[1] || 'sqlite';

  if (!['sqlite', 'mysql'].includes(dbType)) {
    console.error('❌ Invalid database type. Use "sqlite" or "mysql"');
    process.exit(1);
  }

  const migrator = new DatabaseMigrator(dbType);

  switch (command) {
    case 'migrate':
      await migrator.migrate();
      break;
    
    case 'test':
      await migrator.testConnection();
      break;
    
    case 'help':
      console.log(`
TRESR Creator App Database Migration v2

Usage:
  node migrate-database-v2.js [command] [database_type]

Commands:
  migrate    Run full database migration (default)
  test       Test database connection
  help       Show this help message

Database Types:
  sqlite     Use SQLite database (default)
  mysql      Use MySQL database

Examples:
  node migrate-database-v2.js migrate sqlite
  node migrate-database-v2.js migrate mysql
  node migrate-database-v2.js test mysql

Environment Variables (for MySQL):
  MYSQL_HOST      - MySQL host (default: localhost)
  MYSQL_PORT      - MySQL port (default: 3306)
  MYSQL_USER      - MySQL username (default: tresr_app)
  MYSQL_PASSWORD  - MySQL password (required)
  MYSQL_DATABASE  - MySQL database name (default: tresr_creator_app)
      `);
      break;
    
    default:
      console.error('❌ Unknown command. Use "help" for usage information.');
      process.exit(1);
  }
}

// Export for use as module
module.exports = { DatabaseMigrator, sqlSchemas, config };

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}