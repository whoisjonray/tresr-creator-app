#!/usr/bin/env node

/**
 * One-time migration script to move print areas from file-based to database storage
 * Run this once to migrate existing configurations
 */

const { sequelize } = require('../models');
const PrintAreaConfig = require('../models/PrintAreaConfig')(sequelize);
const fs = require('fs').promises;
const path = require('path');

async function migratePrintAreasToDatabase() {
  console.log('🔄 Starting print areas migration to database...');
  
  try {
    // Ensure database is connected
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Sync the PrintAreaConfig model
    await PrintAreaConfig.sync();
    console.log('✅ PrintAreaConfig table ready');
    
    // Default print areas (master reference)
    const defaultPrintAreas = {
      'tee': { 
        front: { width: 280, height: 350, x: 160, y: 125 },
        back: { width: 280, height: 350, x: 160, y: 125 }
      },
      'boxy': { 
        front: { width: 300, height: 350, x: 150, y: 125 },
        back: { width: 300, height: 350, x: 150, y: 125 }
      },
      'next-crop': { 
        front: { width: 200, height: 200, x: 200, y: 150 },
        back: { width: 200, height: 200, x: 200, y: 150 }
      },
      'wmn-hoodie': { 
        front: { width: 240, height: 320, x: 180, y: 140 },
        back: { width: 240, height: 320, x: 180, y: 140 }
      },
      'med-hood': { 
        front: { width: 260, height: 340, x: 170, y: 130 },
        back: { width: 260, height: 340, x: 170, y: 130 }
      },
      'mediu': { 
        front: { width: 260, height: 330, x: 170, y: 135 },
        back: { width: 260, height: 330, x: 170, y: 135 }
      },
      'polo': { 
        front: { width: 200, height: 250, x: 200, y: 100 },
        back: { width: 200, height: 250, x: 200, y: 100 }
      },
      'patch-c': { 
        front: { width: 120, height: 80, x: 240, y: 260 },
        back: null
      },
      'patch-flat': { 
        front: { width: 140, height: 80, x: 230, y: 260 },
        back: null
      },
      'mug': { 
        front: { width: 200, height: 210, x: 200, y: 180 },
        back: null
      },
      'art-sqsm': { 
        front: { width: 560, height: 560, x: 20, y: 20 },
        back: null
      },
      'art-sqm': { 
        front: { width: 560, height: 560, x: 20, y: 20 },
        back: null
      },
      'art-lg': { 
        front: { width: 560, height: 560, x: 20, y: 20 },
        back: null
      },
      'nft': { 
        front: { width: 400, height: 560, x: 100, y: 20 },
        back: null
      },
      'baby-tee': { 
        front: { width: 240, height: 300, x: 180, y: 100 },
        back: { width: 240, height: 300, x: 180, y: 100 }
      },
      'sweat': { 
        front: { width: 260, height: 330, x: 170, y: 135 },
        back: { width: 260, height: 330, x: 170, y: 135 }
      }
    };

    // Check if configuration already exists
    const existingConfig = await PrintAreaConfig.getConfig('global_print_areas');
    
    if (existingConfig) {
      console.log('ℹ️ Print areas configuration already exists in database');
      console.log('   Garments configured:', Object.keys(existingConfig).length);
      
      // Check if we should update with any missing garments
      const missingGarments = Object.keys(defaultPrintAreas).filter(
        key => !existingConfig[key]
      );
      
      if (missingGarments.length > 0) {
        console.log('🔄 Adding missing garments:', missingGarments.join(', '));
        const updatedAreas = { ...existingConfig };
        missingGarments.forEach(key => {
          updatedAreas[key] = defaultPrintAreas[key];
        });
        
        await PrintAreaConfig.setConfig('global_print_areas', updatedAreas, 'migration-script');
        console.log('✅ Updated configuration with missing garments');
      } else {
        console.log('✅ Configuration is complete, no migration needed');
      }
      return;
    }

    // Try to migrate from existing file sources
    let migratedAreas = null;
    const filePaths = [
      '/app/persistent/printAreas.json',           // Railway persistent volume
      path.join(__dirname, '../config/printAreas.json'), // Local config
      path.join(__dirname, '../../client/src/config/printAreas.json') // Client config
    ];
    
    for (const filePath of filePaths) {
      try {
        console.log(`🔍 Checking for existing config at: ${filePath}`);
        const data = await fs.readFile(filePath, 'utf8');
        const parsedData = JSON.parse(data);
        
        if (parsedData && Object.keys(parsedData).length > 0) {
          console.log(`✅ Found existing configuration with ${Object.keys(parsedData).length} garments`);
          migratedAreas = parsedData;
          break;
        }
      } catch (error) {
        console.log(`❌ No config found at ${filePath}`);
      }
    }
    
    // Use migrated areas or defaults
    const areasToSave = migratedAreas || defaultPrintAreas;
    const source = migratedAreas ? 'migrated from files' : 'default configuration';
    
    // Save to database
    await PrintAreaConfig.setConfig('global_print_areas', areasToSave, 'migration-script');
    
    console.log(`✅ Successfully saved print areas to database (${source})`);
    console.log(`   Garments configured: ${Object.keys(areasToSave).length}`);
    
    // Create backup metadata
    const migrationMetadata = {
      migratedAt: new Date().toISOString(),
      source: source,
      garmentCount: Object.keys(areasToSave).length,
      garments: Object.keys(areasToSave)
    };
    
    await PrintAreaConfig.setConfig('migration_metadata', migrationMetadata, 'migration-script');
    console.log('✅ Migration metadata saved');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if called directly
if (require.main === module) {
  migratePrintAreasToDatabase()
    .then(() => {
      console.log('🎉 Migration completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = migratePrintAreasToDatabase;