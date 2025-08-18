const express = require('express');
const router = express.Router();
const { Sequelize } = require('sequelize');

// The working Cloudinary image we'll use as the base
const WORKING_IMAGE = 'https://res.cloudinary.com/dqslerzk9/image/upload/v1740958396/products/k2r2aa8vmghuyr3he0p2eo5e/j4oapq7bcs2y75v9nrmn.png';

// Default product templates that should be available
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
  },
  'next-crop': {
    enabled: true,
    frontPosition: { x: 150, y: 80 },
    backPosition: { x: 150, y: 80 },
    selectedColor: 'Black',
    printLocation: 'front'
  },
  'wmn-hoodie': {
    enabled: true,
    frontPosition: { x: 150, y: 120 },
    backPosition: { x: 150, y: 120 },
    selectedColor: 'Black',
    printLocation: 'front'
  },
  'med-hood': {
    enabled: true,
    frontPosition: { x: 150, y: 120 },
    backPosition: { x: 150, y: 120 },
    selectedColor: 'Black',
    printLocation: 'front'
  }
};

// Create the design_data structure that the edit page expects
const createDesignData = (imageUrl) => {
  return {
    elements: [
      {
        src: imageUrl,
        type: 'image',
        width: 400,
        height: 400,
        x: 150,
        y: 100,
        scale: 1
      }
    ],
    canvas: {
      width: 700,
      height: 600
    }
  };
};

/**
 * Check if a column exists in a table
 * @param {Sequelize} sequelize - Sequelize instance
 * @param {string} tableName - Table name to check
 * @param {string} columnName - Column name to check
 * @returns {boolean} - Whether the column exists
 */
async function columnExists(sequelize, tableName, columnName) {
  try {
    const [results] = await sequelize.query(
      `SHOW COLUMNS FROM \`${tableName}\` LIKE '${columnName}'`
    );
    return results.length > 0;
  } catch (error) {
    console.error(`Error checking column ${columnName} in ${tableName}:`, error);
    return false;
  }
}

/**
 * Add missing columns to the designs table
 * @param {Sequelize} sequelize - Sequelize instance
 */
async function ensureColumnsExist(sequelize) {
  const tableName = 'designs';
  const columnsToAdd = [
    {
      name: 'product_config',
      definition: 'product_config JSON COMMENT "Product configuration data"'
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
    },
    {
      name: 'design_data',
      definition: 'design_data JSON COMMENT "Canvas design data"'
    },
    {
      name: 'thumbnail_url',
      definition: 'thumbnail_url VARCHAR(500) COMMENT "Design thumbnail URL"'
    }
  ];

  const columnsAdded = [];
  
  for (const column of columnsToAdd) {
    const exists = await columnExists(sequelize, tableName, column.name);
    if (!exists) {
      try {
        await sequelize.query(
          `ALTER TABLE \`${tableName}\` ADD COLUMN ${column.definition}`
        );
        columnsAdded.push(column.name);
        console.log(`✅ Added missing column: ${column.name}`);
      } catch (error) {
        console.error(`❌ Failed to add column ${column.name}:`, error);
      }
    }
  }
  
  return columnsAdded;
}

/**
 * Build update query based on available columns
 * @param {Sequelize} sequelize - Sequelize instance
 * @returns {Object} - Query parts for update
 */
async function buildUpdateQuery(sequelize) {
  const tableName = 'designs';
  
  // Check which columns exist
  const columnChecks = {
    design_data: await columnExists(sequelize, tableName, 'design_data'),
    product_config: await columnExists(sequelize, tableName, 'product_config'),
    front_design_url: await columnExists(sequelize, tableName, 'front_design_url'),
    back_design_url: await columnExists(sequelize, tableName, 'back_design_url'),
    front_position: await columnExists(sequelize, tableName, 'front_position'),
    back_position: await columnExists(sequelize, tableName, 'back_position'),
    front_scale: await columnExists(sequelize, tableName, 'front_scale'),
    back_scale: await columnExists(sequelize, tableName, 'back_scale'),
    thumbnail_url: await columnExists(sequelize, tableName, 'thumbnail_url'),
    updated_at: await columnExists(sequelize, tableName, 'updated_at')
  };

  // Build SET clause dynamically
  const setClauses = [];
  const replacements = { designId: null }; // Will be set per design

  if (columnChecks.design_data) {
    setClauses.push('design_data = :designData');
    replacements.designData = null; // Will be set per design
  }
  
  if (columnChecks.product_config) {
    setClauses.push('product_config = :productConfig');
    replacements.productConfig = null; // Will be set per design
  }
  
  if (columnChecks.front_design_url) {
    setClauses.push('front_design_url = :imageUrl');
    replacements.imageUrl = null; // Will be set per design
  }
  
  if (columnChecks.back_design_url) {
    setClauses.push('back_design_url = :imageUrl'); // Same image for both
  }
  
  if (columnChecks.front_position) {
    setClauses.push('front_position = :frontPosition');
    replacements.frontPosition = null; // Will be set per design
  }
  
  if (columnChecks.back_position) {
    setClauses.push('back_position = :backPosition');
    replacements.backPosition = null; // Will be set per design
  }
  
  if (columnChecks.front_scale) {
    setClauses.push('front_scale = :scale');
    replacements.scale = null; // Will be set per design
  }
  
  if (columnChecks.back_scale) {
    setClauses.push('back_scale = :scale'); // Same scale for both
  }

  if (columnChecks.thumbnail_url) {
    setClauses.push('thumbnail_url = :imageUrl'); // Same as design URL
  }
  
  if (columnChecks.updated_at) {
    setClauses.push('updated_at = NOW()');
  }

  const query = setClauses.length > 0 
    ? `UPDATE designs SET ${setClauses.join(', ')} WHERE id = :designId`
    : null;

  return { query, replacements, columnChecks };
}

router.post('/fix-edit-page-data', async (req, res) => {
  console.log('🔧 Starting production-safe edit page data fix...');
  
  try {
    const user = req.session.creator || req.session.user;
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Please log in' 
      });
    }

    // Create direct database connection
    const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('Database URL not configured');
    }

    const sequelize = new Sequelize(dbUrl, {
      dialect: 'mysql',
      logging: false
    });

    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Ensure missing columns exist
    const columnsAdded = await ensureColumnsExist(sequelize);
    if (columnsAdded.length > 0) {
      console.log(`✅ Added ${columnsAdded.length} missing columns: ${columnsAdded.join(', ')}`);
    }

    // Build update query based on available columns
    const { query, replacements: baseReplacements, columnChecks } = await buildUpdateQuery(sequelize);
    
    if (!query) {
      await sequelize.close();
      return res.status(500).json({
        success: false,
        message: 'No updatable columns found in designs table'
      });
    }

    console.log('📋 Available columns:', Object.entries(columnChecks).filter(([k, v]) => v).map(([k]) => k));

    // Get all designs for this user - use safe column selection
    const selectColumns = [
      'id', 
      'name',
      columnChecks.thumbnail_url ? 'thumbnail_url' : 'NULL as thumbnail_url',
      columnChecks.front_design_url ? 'front_design_url' : 'NULL as front_design_url', 
      columnChecks.back_design_url ? 'back_design_url' : 'NULL as back_design_url',
      columnChecks.design_data ? 'design_data' : 'NULL as design_data',
      columnChecks.product_config ? 'product_config' : 'NULL as product_config'
    ].join(', ');

    const [designs] = await sequelize.query(
      `SELECT ${selectColumns} FROM designs WHERE creator_id = :creatorId`,
      {
        replacements: { creatorId: user.id }
      }
    );

    console.log(`Found ${designs.length} designs to update`);

    let updatedCount = 0;
    
    for (const design of designs) {
      try {
        // Use the existing thumbnail URL or fallback to our working image
        const imageUrl = design.thumbnail_url || WORKING_IMAGE;
        
        // Create the design_data structure
        const designData = createDesignData(imageUrl);
        
        // Parse existing product_config or use defaults
        let productConfig;
        try {
          productConfig = design.product_config ? JSON.parse(design.product_config) : DEFAULT_PRODUCT_CONFIG;
        } catch (e) {
          productConfig = DEFAULT_PRODUCT_CONFIG;
        }
        
        // Prepare replacements for this design
        const designReplacements = {
          ...baseReplacements,
          designId: design.id,
          designData: JSON.stringify(designData),
          productConfig: JSON.stringify(productConfig),
          imageUrl: imageUrl,
          frontPosition: JSON.stringify({ x: 150, y: 100 }),
          backPosition: JSON.stringify({ x: 150, y: 100 }),
          scale: '1.0'
        };
        
        // Update the design
        const [updateResult] = await sequelize.query(query, {
          replacements: designReplacements
        });
        
        if (updateResult > 0) {
          updatedCount++;
          console.log(`✅ Updated design: ${design.name}`);
        }
      } catch (designError) {
        console.error(`❌ Failed to update design ${design.name}:`, designError);
        // Continue with other designs
      }
    }

    // Close connection
    await sequelize.close();

    console.log(`✅ Successfully updated ${updatedCount} designs with edit data`);
    
    res.json({
      success: true,
      message: `Updated ${updatedCount} designs with complete edit data`,
      stats: {
        total: designs.length,
        updated: updatedCount,
        columnsAdded: columnsAdded
      },
      columnStatus: columnChecks
    });

  } catch (error) {
    console.error('❌ Fix edit page data error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fix edit page data',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get a single design to test if the fix worked
router.get('/test-design/:id', async (req, res) => {
  try {
    const user = req.session.creator || req.session.user;
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Please log in' 
      });
    }

    // Create direct database connection
    const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('Database URL not configured');
    }

    const sequelize = new Sequelize(dbUrl, {
      dialect: 'mysql',
      logging: false
    });

    // Check which columns exist for safe querying
    const tableName = 'designs';
    const availableColumns = [];
    const potentialColumns = [
      'id', 'creator_id', 'name', 'description', 'status',
      'front_design_url', 'back_design_url', 'front_position', 'back_position',
      'front_scale', 'back_scale', 'design_data', 'product_config',
      'thumbnail_url', 'created_at', 'updated_at'
    ];

    for (const column of potentialColumns) {
      if (await columnExists(sequelize, tableName, column)) {
        availableColumns.push(column);
      }
    }

    const selectClause = availableColumns.join(', ');
    
    const [designs] = await sequelize.query(
      `SELECT ${selectClause} FROM designs 
       WHERE id = :designId AND creator_id = :creatorId
       LIMIT 1`,
      {
        replacements: { 
          designId: req.params.id,
          creatorId: user.id 
        }
      }
    );

    await sequelize.close();

    if (designs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Design not found'
      });
    }

    const design = designs[0];
    
    // Parse JSON fields safely
    const jsonFields = ['design_data', 'product_config', 'front_position', 'back_position'];
    
    for (const field of jsonFields) {
      if (design[field] && typeof design[field] === 'string') {
        try {
          design[field] = JSON.parse(design[field]);
        } catch (e) {
          console.error(`Error parsing JSON field ${field}:`, e);
          design[field] = null;
        }
      }
    }

    res.json({
      success: true,
      design: design,
      availableColumns: availableColumns
    });

  } catch (error) {
    console.error('❌ Test design error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get test design'
    });
  }
});

// Check database schema and column status
router.get('/check-schema', async (req, res) => {
  try {
    const user = req.session.creator || req.session.user;
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Please log in' 
      });
    }

    const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('Database URL not configured');
    }

    const sequelize = new Sequelize(dbUrl, {
      dialect: 'mysql',
      logging: false
    });

    await sequelize.authenticate();

    // Get table structure
    const [columns] = await sequelize.query('SHOW COLUMNS FROM designs');
    
    // Check for specific columns we need
    const requiredColumns = [
      'product_config', 'front_position', 'back_position', 
      'front_scale', 'back_scale', 'design_data', 'thumbnail_url'
    ];
    
    const columnStatus = {};
    for (const col of requiredColumns) {
      columnStatus[col] = await columnExists(sequelize, 'designs', col);
    }

    await sequelize.close();

    res.json({
      success: true,
      tableColumns: columns,
      requiredColumnStatus: columnStatus,
      missingColumns: requiredColumns.filter(col => !columnStatus[col])
    });

  } catch (error) {
    console.error('❌ Schema check error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to check schema'
    });
  }
});

module.exports = router;