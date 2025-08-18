const { Sequelize } = require('sequelize');
require('dotenv').config();

async function migrateMissingColumns() {
  console.log('🔄 Starting database column migration...');
  
  try {
    // Create database connection
    const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('Database URL not configured');
    }

    const sequelize = new Sequelize(dbUrl, {
      dialect: 'mysql',
      logging: console.log
    });

    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    /**
     * Check if a column exists in a table
     */
    const columnExists = async (tableName, columnName) => {
      try {
        const [results] = await sequelize.query(
          `SHOW COLUMNS FROM \`${tableName}\` LIKE '${columnName}'`
        );
        return results.length > 0;
      } catch (error) {
        console.error(`Error checking column ${columnName}:`, error);
        return false;
      }
    };

    // Define columns that should exist in the designs table
    const requiredColumns = [
      {
        name: 'product_config',
        definition: 'product_config JSON COMMENT "Product configuration data"',
        description: 'Store product template configurations and settings'
      },
      {
        name: 'front_position', 
        definition: 'front_position JSON COMMENT "Front design position coordinates {x, y}"',
        description: 'Position of design on front of garment'
      },
      {
        name: 'back_position',
        definition: 'back_position JSON COMMENT "Back design position coordinates {x, y}"',
        description: 'Position of design on back of garment'
      },
      {
        name: 'front_scale',
        definition: 'front_scale DECIMAL(3,2) DEFAULT 1.0 COMMENT "Front design scale factor"',
        description: 'Scale factor for front design (1.0 = original size)'
      },
      {
        name: 'back_scale',
        definition: 'back_scale DECIMAL(3,2) DEFAULT 1.0 COMMENT "Back design scale factor"',
        description: 'Scale factor for back design (1.0 = original size)'
      },
      {
        name: 'design_data',
        definition: 'design_data JSON COMMENT "Canvas design editor data"',
        description: 'Complete design editor state and canvas data'
      },
      {
        name: 'thumbnail_url',
        definition: 'thumbnail_url VARCHAR(500) COMMENT "Design thumbnail image URL"',
        description: 'Cloudinary URL for design thumbnail/preview image'
      }
    ];

    console.log('\n📋 Checking required columns...');

    const tableName = 'designs';
    const columnsToAdd = [];
    const existingColumns = [];

    // Check each required column
    for (const column of requiredColumns) {
      const exists = await columnExists(tableName, column.name);
      if (exists) {
        existingColumns.push(column.name);
        console.log(`✅ Column exists: ${column.name}`);
      } else {
        columnsToAdd.push(column);
        console.log(`❌ Missing column: ${column.name} - ${column.description}`);
      }
    }

    console.log(`\n📊 Column Status: ${existingColumns.length} exist, ${columnsToAdd.length} missing`);

    if (columnsToAdd.length === 0) {
      console.log('🎉 All required columns already exist! No migration needed.');
      await sequelize.close();
      return;
    }

    console.log('\n🔧 Adding missing columns...');

    let addedCount = 0;
    const errors = [];

    for (const column of columnsToAdd) {
      try {
        console.log(`\n⏳ Adding column: ${column.name}`);
        console.log(`   Definition: ${column.definition}`);
        
        await sequelize.query(
          `ALTER TABLE \`${tableName}\` ADD COLUMN ${column.definition}`
        );
        
        addedCount++;
        console.log(`✅ Successfully added: ${column.name}`);
        
        // Verify the column was added
        const verified = await columnExists(tableName, column.name);
        if (verified) {
          console.log(`✅ Verified: ${column.name} is now available`);
        } else {
          console.log(`⚠️ Warning: Could not verify ${column.name} was added`);
        }
        
      } catch (error) {
        errors.push({ column: column.name, error: error.message });
        console.error(`❌ Failed to add column ${column.name}:`, error.message);
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Columns added: ${addedCount}`);
    console.log(`   ❌ Errors: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('\n⚠️ Errors encountered:');
      errors.forEach(({ column, error }) => {
        console.log(`   - ${column}: ${error}`);
      });
    }

    // Show final table structure
    console.log('\n📋 Final table structure:');
    const [tableStructure] = await sequelize.query('SHOW COLUMNS FROM designs');
    tableStructure.forEach(column => {
      const isNew = columnsToAdd.some(c => c.name === column.Field);
      const prefix = isNew ? '🆕' : '   ';
      console.log(`${prefix} ${column.Field} (${column.Type}) ${column.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${column.Default ? `DEFAULT ${column.Default}` : ''}`);
    });

    await sequelize.close();
    console.log('\n✅ Database migration completed successfully!');

    if (addedCount > 0) {
      console.log('\n🚀 Next steps:');
      console.log('   1. The FIX EDIT PAGE button should now work');
      console.log('   2. Existing designs will use default values for new columns');
      console.log('   3. Future designs will have full edit capabilities');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateMissingColumns()
    .then(() => {
      console.log('\n🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateMissingColumns };