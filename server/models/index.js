const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Database connection configuration
const isDevelopment = process.env.NODE_ENV !== 'production';
const isRailway = process.env.RAILWAY_ENVIRONMENT === 'production';
const isSQLite = isDevelopment && !process.env.DB_HOST && !process.env.MYSQL_URL;

let sequelize = null;
let Creator = null;
let Design = null;
let DesignProduct = null;
let DesignVariant = null;
let DesignAnalytics = null;

// In production without database, skip everything
if (process.env.NODE_ENV === 'production' && !process.env.MYSQL_URL && !process.env.MYSQLHOST) {
  console.log('⚠️ No database configuration found, running without database');
} else {
  // Initialize Sequelize based on environment
  if (process.env.MYSQL_URL) {
    console.log('📦 Using Railway MySQL database');
    sequelize = new Sequelize(process.env.MYSQL_URL, {
      dialect: 'mysql',
      logging: isDevelopment ? console.log : false,
      pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
    });
  } else if (isRailway && process.env.MYSQLHOST) {
    console.log('📦 Using Railway MySQL database (individual vars)');
    sequelize = new Sequelize(
      process.env.MYSQLDATABASE || 'railway',
      process.env.MYSQLUSER || 'root',
      process.env.MYSQLPASSWORD || '',
      {
        host: process.env.MYSQLHOST,
        port: process.env.MYSQLPORT || 3306,
        dialect: 'mysql',
        logging: isDevelopment ? console.log : false,
        pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
      }
    );
  } else if (isSQLite) {
    console.log('📦 Using SQLite for local development');
    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: path.join(__dirname, '../database/tresr_creator.sqlite'),
      logging: isDevelopment ? console.log : false
    });
  } else {
    try {
      sequelize = new Sequelize(
        process.env.DB_NAME || 'tresr_creator',
        process.env.DB_USER || 'root',
        process.env.DB_PASSWORD || 'root',
        {
          host: process.env.DB_HOST || 'localhost',
          port: process.env.DB_PORT || 3306,
          dialect: 'mysql',
          logging: isDevelopment ? console.log : false,
          pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
        }
      );
    } catch (error) {
      console.error('Failed to initialize Sequelize:', error.message);
      sequelize = null;
    }
  }

  // Only define models if sequelize is available
  if (sequelize) {
    // Creator Model
    Creator = sequelize.define('Creator', {
      id: {
        type: DataTypes.STRING(36),
        primaryKey: true
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true
        }
      },
      name: {
        type: DataTypes.STRING(255)
      },
      walletAddress: {
        type: DataTypes.STRING(42),
        field: 'wallet_address'
      },
      avatarUrl: {
        type: DataTypes.STRING(500),
        field: 'avatar_url'
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active'
      }
    }, {
      tableName: 'creators',
      timestamps: true,
      underscored: true
    });

    // Design Model
    Design = sequelize.define('Design', {
      id: {
        type: DataTypes.STRING(36),
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
      },
      creatorId: {
        type: DataTypes.STRING(36),
        allowNull: false,
        field: 'creator_id'
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT
      },
      status: {
        type: DataTypes.ENUM('draft', 'published', 'archived'),
        defaultValue: 'draft'
      },
      frontDesignUrl: {
        type: DataTypes.STRING(500),
        field: 'front_design_url'
      },
      frontDesignPublicId: {
        type: DataTypes.STRING(255),
        field: 'front_design_public_id'
      },
      backDesignUrl: {
        type: DataTypes.STRING(500),
        field: 'back_design_url'
      },
      backDesignPublicId: {
        type: DataTypes.STRING(255),
        field: 'back_design_public_id'
      },
      frontPosition: {
        type: DataTypes.JSON,
        field: 'front_position',
        defaultValue: { x: 200, y: 150 }
      },
      backPosition: {
        type: DataTypes.JSON,
        field: 'back_position',
        defaultValue: { x: 200, y: 150 }
      },
      frontScale: {
        type: DataTypes.DECIMAL(3, 2),
        field: 'front_scale',
        defaultValue: 1.0
      },
      backScale: {
        type: DataTypes.DECIMAL(3, 2),
        field: 'back_scale',
        defaultValue: 1.0
      },
      tags: {
        type: DataTypes.JSON,
        defaultValue: []
      },
      printMethod: {
        type: DataTypes.STRING(50),
        field: 'print_method',
        defaultValue: 'DTG'
      },
      nfcExperience: {
        type: DataTypes.STRING(50),
        field: 'nfc_experience'
      },
      publishedAt: {
        type: DataTypes.DATE,
        field: 'published_at'
      }
    }, {
      tableName: 'designs',
      timestamps: true,
      underscored: true
    });

    // Design Product Model
    DesignProduct = sequelize.define('DesignProduct', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      designId: {
        type: DataTypes.STRING(36),
        allowNull: false,
        field: 'design_id'
      },
      productTemplateId: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'product_template_id'
      },
      isEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_enabled'
      },
      selectedColors: {
        type: DataTypes.JSON,
        field: 'selected_colors',
        defaultValue: []
      },
      priceOverride: {
        type: DataTypes.DECIMAL(10, 2),
        field: 'price_override'
      },
      printLocation: {
        type: DataTypes.ENUM('front', 'back', 'both'),
        defaultValue: 'front',
        field: 'print_location'
      },
      shopifyProductId: {
        type: DataTypes.BIGINT,
        field: 'shopify_product_id'
      },
      shopifyHandle: {
        type: DataTypes.STRING(255),
        field: 'shopify_handle'
      }
    }, {
      tableName: 'design_products',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ['design_id', 'product_template_id']
        }
      ]
    });

    // Design Variant Model
    DesignVariant = sequelize.define('DesignVariant', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      designProductId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'design_product_id'
      },
      color: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      side: {
        type: DataTypes.ENUM('front', 'back'),
        defaultValue: 'front'
      },
      mockupUrl: {
        type: DataTypes.STRING(500),
        allowNull: false,
        field: 'mockup_url'
      },
      mockupPublicId: {
        type: DataTypes.STRING(255),
        field: 'mockup_public_id'
      },
      mockupWidth: {
        type: DataTypes.INTEGER,
        defaultValue: 2000,
        field: 'mockup_width'
      },
      mockupHeight: {
        type: DataTypes.INTEGER,
        defaultValue: 2000,
        field: 'mockup_height'
      },
      fileSizeKb: {
        type: DataTypes.INTEGER,
        field: 'file_size_kb'
      },
      generatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'generated_at'
      }
    }, {
      tableName: 'design_variants',
      timestamps: false
    });

    // Design Analytics Model
    DesignAnalytics = sequelize.define('DesignAnalytics', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      designId: {
        type: DataTypes.STRING(36),
        allowNull: false,
        field: 'design_id'
      },
      eventType: {
        type: DataTypes.ENUM('view', 'share', 'purchase'),
        allowNull: false,
        field: 'event_type'
      },
      eventData: {
        type: DataTypes.JSON,
        field: 'event_data'
      }
    }, {
      tableName: 'design_analytics',
      timestamps: false,
      createdAt: 'created_at'
    });

    // Define associations
    Creator.hasMany(Design, { foreignKey: 'creator_id', as: 'designs' });
    Design.belongsTo(Creator, { foreignKey: 'creator_id', as: 'creator' });

    Design.hasMany(DesignProduct, { foreignKey: 'design_id', as: 'products' });
    DesignProduct.belongsTo(Design, { foreignKey: 'design_id', as: 'design' });

    DesignProduct.hasMany(DesignVariant, { foreignKey: 'design_product_id', as: 'variants' });
    DesignVariant.belongsTo(DesignProduct, { foreignKey: 'design_product_id', as: 'product' });

    Design.hasMany(DesignAnalytics, { foreignKey: 'design_id', as: 'analytics' });
    DesignAnalytics.belongsTo(Design, { foreignKey: 'design_id', as: 'design' });

    // Helper methods
    Design.prototype.updateStatus = async function(newStatus) {
      this.status = newStatus;
      if (newStatus === 'published' && !this.publishedAt) {
        this.publishedAt = new Date();
      }
      return await this.save();
    };

    Design.prototype.getVariantCount = async function() {
      const products = await this.getProducts({ include: ['variants'] });
      return products.reduce((sum, product) => sum + product.variants.length, 0);
    };

    Design.findPaginated = async function(creatorId, { limit = 20, offset = 0, status = null }) {
      const where = { creatorId };
      if (status) where.status = status;
      
      const { count, rows } = await Design.findAndCountAll({
        where,
        limit,
        offset,
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: DesignProduct,
            as: 'products',
            attributes: ['id', 'productTemplateId', 'isEnabled'],
            include: [{
              model: DesignVariant,
              as: 'variants',
              attributes: ['id', 'color', 'mockupUrl']
            }]
          }
        ]
      });
      
      return {
        total: count,
        designs: rows,
        hasMore: offset + limit < count
      };
    };

    Design.clearImageCache = async function(designId) {
      console.log(`Clearing image cache for design ${designId}`);
    };
  }
}

module.exports = {
  sequelize,
  Creator,
  Design,
  DesignProduct,
  DesignVariant,
  DesignAnalytics
};