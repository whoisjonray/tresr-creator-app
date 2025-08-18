/**
 * EMERGENCY PRODUCTION FIX - Edit Page Data Handler
 * 
 * This route is production-safe and handles:
 * 1. Missing database columns (auto-adds them if needed)
 * 2. Schema mismatches between dev and production
 * 3. Graceful degradation if columns cannot be added
 * 4. Proper error handling and logging
 */

const express = require('express');
const router = express.Router();
const { Sequelize } = require('sequelize');

// Constants
const WORKING_IMAGE = 'https://res.cloudinary.com/dqslerzk9/image/upload/v1740958396/products/k2r2aa8vmghuyr3he0p2eo5e/j4oapq7bcs2y75v9nrmn.png';

const DEFAULT_PRODUCT_CONFIG = {
  tee: {
    enabled: true,
    frontPosition: { x: 150, y: 100 },
    backPosition: { x: 150, y: 100 },
    selectedColor: 'Black',
    printLocation: 'front'
  },
  boxy: {
    enabled: true,
    frontPosition: { x: 150, y: 100 },
    backPosition: { x: 150, y: 100 },
    selectedColor: 'Black',
    printLocation: 'front'
  }
};

const createDesignData = (imageUrl) => ({
  elements: [{
    src: imageUrl,
    type: 'image',
    width: 400,
    height: 400,
    x: 150,
    y: 100,
    scale: 1
  }],
  canvas: {
    width: 700,
    height: 600
  }
});

// Database utility functions
class DatabaseManager {
  constructor(sequelize) {
    this.sequelize = sequelize;
  }

  async columnExists(tableName, columnName) {
    try {
      const [results] = await this.sequelize.query(
        `SHOW COLUMNS FROM \`${tableName}\` LIKE '${columnName}'`
      );
      return results.length > 0;
    } catch (error) {
      console.error(`Error checking column ${columnName}:`, error);
      return false;
    }
  }

  async addColumnIfMissing(tableName, columnName, definition) {
    try {
      const exists = await this.columnExists(tableName, columnName);
      if (!exists) {
        await this.sequelize.query(
          `ALTER TABLE \`${tableName}\` ADD COLUMN ${definition}`
        );
        console.log(`✅ Added missing column: ${columnName}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`❌ Failed to add column ${columnName}:`, error);
      return false;
    }
  }

  async ensureCriticalColumns() {
    const requiredColumns = [
      {
        name: 'design_data',
        definition: 'design_data JSON COMMENT "Canvas design editor data"'
      },
      {
        name: 'product_config',
        definition: 'product_config JSON COMMENT "Product configuration data"'
      },
      {
        name: 'thumbnail_url',
        definition: 'thumbnail_url VARCHAR(500) COMMENT "Design thumbnail image URL"'
      },
      {
        name: 'front_position', 
        definition: 'front_position JSON COMMENT "Front design position {x, y}"'
      },
      {
        name: 'back_position',
        definition: 'back_position JSON COMMENT "Back design position {x, y}"'
      },
      {
        name: 'front_scale',
        definition: 'front_scale DECIMAL(3,2) DEFAULT 1.0 COMMENT "Front design scale"'
      },
      {
        name: 'back_scale',
        definition: 'back_scale DECIMAL(3,2) DEFAULT 1.0 COMMENT "Back design scale"'
      }
    ];

    const results = {
      added: [],
      existing: [],
      failed: []
    };

    for (const column of requiredColumns) {
      try {
        const wasAdded = await this.addColumnIfMissing('designs', column.name, column.definition);
        if (wasAdded) {
          results.added.push(column.name);
        } else {
          results.existing.push(column.name);
        }
      } catch (error) {
        results.failed.push({ name: column.name, error: error.message });
      }
    }

    return results;
  }

  async getAvailableColumns() {
    const columns = {
      design_data: await this.columnExists('designs', 'design_data'),
      product_config: await this.columnExists('designs', 'product_config'),
      thumbnail_url: await this.columnExists('designs', 'thumbnail_url'),
      front_design_url: await this.columnExists('designs', 'front_design_url'),
      back_design_url: await this.columnExists('designs', 'back_design_url'),
      front_position: await this.columnExists('designs', 'front_position'),
      back_position: await this.columnExists('designs', 'back_position'),
      front_scale: await this.columnExists('designs', 'front_scale'),
      back_scale: await this.columnExists('designs', 'back_scale'),
      updated_at: await this.columnExists('designs', 'updated_at')
    };
    
    return columns;
  }

  buildSafeSelectQuery(availableColumns) {
    const safeColumns = ['id', 'name', 'creator_id'];
    
    // Add available columns or NULL placeholders
    Object.entries(availableColumns).forEach(([column, exists]) => {
      if (exists) {
        safeColumns.push(column);
      } else {
        safeColumns.push(`NULL as ${column}`);
      }
    });
    
    return `SELECT ${safeColumns.join(', ')} FROM designs WHERE creator_id = :creatorId`;
  }

  buildSafeUpdateQuery(availableColumns, designData) {
    const updateClauses = [];
    const replacements = { designId: designData.id };

    // Only include columns that actually exist
    if (availableColumns.design_data) {
      updateClauses.push('design_data = :designData');
      replacements.designData = designData.designData;
    }
    
    if (availableColumns.product_config) {
      updateClauses.push('product_config = :productConfig');
      replacements.productConfig = designData.productConfig;
    }
    
    if (availableColumns.thumbnail_url) {
      updateClauses.push('thumbnail_url = :imageUrl');
      replacements.imageUrl = designData.imageUrl;
    }
    
    if (availableColumns.front_design_url) {
      updateClauses.push('front_design_url = :imageUrl');
    }
    
    if (availableColumns.back_design_url) {
      updateClauses.push('back_design_url = :imageUrl');
    }
    
    if (availableColumns.front_position) {
      updateClauses.push('front_position = :frontPosition');
      replacements.frontPosition = designData.frontPosition;
    }
    
    if (availableColumns.back_position) {
      updateClauses.push('back_position = :backPosition');
      replacements.backPosition = designData.backPosition;
    }
    
    if (availableColumns.front_scale) {
      updateClauses.push('front_scale = :scale');
      replacements.scale = designData.scale;
    }
    
    if (availableColumns.back_scale) {
      updateClauses.push('back_scale = :scale');
    }
    
    if (availableColumns.updated_at) {
      updateClauses.push('updated_at = NOW()');
    }

    if (updateClauses.length === 0) {
      return null; // Cannot update anything
    }

    return {
      query: `UPDATE designs SET ${updateClauses.join(', ')} WHERE id = :designId`,
      replacements
    };
  }
}

// Main route handler
router.post('/emergency-fix-edit-page', async (req, res) => {
  console.log('🚨 EMERGENCY: Starting production-safe edit page fix...');
  
  let sequelize = null;
  
  try {
    // Authentication check
    const user = req.session.creator || req.session.user;
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Database connection
    const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('Database URL not configured - check MYSQL_URL or DATABASE_URL environment variables');
    }

    sequelize = new Sequelize(dbUrl, {
      dialect: 'mysql',
      logging: false,
      pool: { 
        max: 5, 
        min: 0, 
        acquire: 30000, 
        idle: 10000 
      }
    });

    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    const dbManager = new DatabaseManager(sequelize);

    // Step 1: Ensure critical columns exist
    console.log('🔧 Ensuring critical database columns exist...');
    const columnResults = await dbManager.ensureCriticalColumns();
    
    console.log(`📊 Column Status - Added: ${columnResults.added.length}, Existing: ${columnResults.existing.length}, Failed: ${columnResults.failed.length}`);
    
    if (columnResults.failed.length > 0) {
      console.warn('⚠️ Some columns could not be added:', columnResults.failed);
    }

    // Step 2: Check available columns for safe querying
    const availableColumns = await dbManager.getAvailableColumns();
    console.log('📋 Available columns:', Object.entries(availableColumns).filter(([k, v]) => v).map(([k]) => k));

    // Step 3: Get user's designs with safe query
    const selectQuery = dbManager.buildSafeSelectQuery(availableColumns);
    const [designs] = await sequelize.query(selectQuery, {
      replacements: { creatorId: user.id }
    });

    console.log(`Found ${designs.length} designs to process`);

    if (designs.length === 0) {
      await sequelize.close();
      return res.json({
        success: true,
        message: 'No designs found to update',
        stats: {
          total: 0,
          updated: 0,
          skipped: 0
        }
      });
    }

    // Step 4: Update each design
    let updatedCount = 0;
    let skippedCount = 0;
    const errors = [];

    for (const design of designs) {
      try {
        // Prepare design data
        const imageUrl = design.thumbnail_url || WORKING_IMAGE;
        const designData = createDesignData(imageUrl);
        
        let productConfig;
        try {
          productConfig = design.product_config ? JSON.parse(design.product_config) : DEFAULT_PRODUCT_CONFIG;
        } catch (e) {
          productConfig = DEFAULT_PRODUCT_CONFIG;
        }

        const updateData = {
          id: design.id,
          designData: JSON.stringify(designData),
          productConfig: JSON.stringify(productConfig),
          imageUrl: imageUrl,
          frontPosition: JSON.stringify({ x: 150, y: 100 }),
          backPosition: JSON.stringify({ x: 150, y: 100 }),
          scale: '1.0'
        };

        // Build safe update query
        const updateQuery = dbManager.buildSafeUpdateQuery(availableColumns, updateData);
        
        if (!updateQuery) {
          console.log(`⚠️ No updatable columns for design: ${design.name}`);
          skippedCount++;
          continue;
        }

        // Execute update
        const [updateResult] = await sequelize.query(updateQuery.query, {
          replacements: updateQuery.replacements
        });
        
        if (updateResult > 0) {
          updatedCount++;
          console.log(`✅ Updated design: ${design.name}`);
        } else {
          skippedCount++;
          console.log(`⚠️ No changes made to design: ${design.name}`);
        }

      } catch (designError) {
        console.error(`❌ Failed to update design ${design.name}:`, designError);
        errors.push({
          design: design.name,
          error: designError.message
        });
        skippedCount++;
      }
    }

    // Close database connection
    await sequelize.close();

    const stats = {
      total: designs.length,
      updated: updatedCount,
      skipped: skippedCount,
      errors: errors.length,
      columnsAdded: columnResults.added
    };

    console.log(`✅ Emergency fix completed - Updated: ${updatedCount}, Skipped: ${skippedCount}, Errors: ${errors.length}`);
    
    // Return success response
    res.json({
      success: true,
      message: `Emergency fix completed successfully`,
      stats,
      columnResults,
      availableColumns,
      errors: errors.slice(0, 5) // Limit error details in response
    });

  } catch (error) {
    console.error('💥 Emergency fix failed:', error);
    
    // Close connection if open
    if (sequelize) {
      try {
        await sequelize.close();
      } catch (closeError) {
        console.error('Error closing database connection:', closeError);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Emergency fix failed',
      error: error.message,
      code: error.code || 'UNKNOWN_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Health check endpoint
router.get('/emergency-fix-status', async (req, res) => {
  try {
    const user = req.session.creator || req.session.user;
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
    if (!dbUrl) {
      return res.status(500).json({
        success: false,
        message: 'Database not configured'
      });
    }

    const sequelize = new Sequelize(dbUrl, {
      dialect: 'mysql',
      logging: false
    });

    await sequelize.authenticate();
    const dbManager = new DatabaseManager(sequelize);
    const availableColumns = await dbManager.getAvailableColumns();
    await sequelize.close();

    res.json({
      success: true,
      databaseConnected: true,
      availableColumns,
      missingColumns: Object.entries(availableColumns).filter(([k, v]) => !v).map(([k]) => k),
      readyForFix: Object.values(availableColumns).some(v => v)
    });

  } catch (error) {
    console.error('Status check failed:', error);
    res.status(500).json({
      success: false,
      message: 'Status check failed',
      error: error.message
    });
  }
});

module.exports = router;