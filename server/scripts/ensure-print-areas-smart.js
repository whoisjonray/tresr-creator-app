const fs = require('fs').promises;
const path = require('path');

async function ensurePrintAreasSmart() {
  console.log('🔍 Smart print areas check starting...');
  
  // CORRECT print areas based on your actual settings
  const CORRECT_PRINT_AREAS = {
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
    'baby-tee': { 
      front: { width: 240, height: 300, x: 180, y: 100 },
      back: { width: 240, height: 300, x: 180, y: 100 }
    },
    'sweat': { 
      front: { width: 260, height: 330, x: 170, y: 135 },
      back: { width: 260, height: 330, x: 170, y: 135 }
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
    }
  };
  
  // Determine paths based on environment
  const persistentPath = '/app/persistent';
  const localConfigPath = path.join(__dirname, '../config/printAreas.json');
  
  let configPath;
  if (process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT) {
    configPath = path.join(persistentPath, 'printAreas.json');
    console.log('📁 Production mode - using persistent path:', configPath);
    
    // Ensure persistent directory exists
    await fs.mkdir(persistentPath, { recursive: true });
  } else {
    configPath = localConfigPath;
    console.log('📁 Development mode - using local path:', configPath);
    
    // Ensure local config directory exists
    await fs.mkdir(path.dirname(configPath), { recursive: true });
  }
  
  try {
    // Check if file exists
    const fileExists = await fs.access(configPath).then(() => true).catch(() => false);
    
    if (fileExists) {
      // File exists - validate it but NEVER OVERWRITE USER DATA
      console.log('✅ Found existing print areas file');
      
      try {
        const content = await fs.readFile(configPath, 'utf8');
        const data = JSON.parse(content);
        
        // Check if file has actual content (not just empty object)
        if (Object.keys(data).length > 0) {
          console.log('✅ Existing configuration is valid with', Object.keys(data).length, 'garments');
          console.log('🔒 PRESERVING existing user configuration');
          
          // Log first product's coordinates for verification
          const firstProduct = Object.keys(data)[0];
          if (firstProduct && data[firstProduct]) {
            console.log(`📍 Sample coordinates for ${firstProduct}:`, data[firstProduct]);
          }
          
          return; // DO NOT OVERWRITE!
        } else {
          console.log('⚠️ Configuration file is empty, writing defaults');
          await fs.writeFile(configPath, JSON.stringify(CORRECT_PRINT_AREAS, null, 2));
        }
      } catch (parseError) {
        console.error('⚠️ Invalid JSON in existing file, writing correct defaults');
        await fs.writeFile(configPath, JSON.stringify(CORRECT_PRINT_AREAS, null, 2));
      }
    } else {
      // File doesn't exist - create with correct defaults
      console.log('📝 No configuration found, creating with correct defaults');
      await fs.writeFile(configPath, JSON.stringify(CORRECT_PRINT_AREAS, null, 2));
      console.log('✅ Created print areas configuration with correct coordinates');
    }
    
  } catch (error) {
    console.error('❌ Error in smart print areas check:', error);
    // Try to create default file anyway
    try {
      await fs.writeFile(configPath, JSON.stringify(CORRECT_PRINT_AREAS, null, 2));
      console.log('✅ Created fallback configuration');
    } catch (writeError) {
      console.error('❌ Failed to write fallback configuration:', writeError);
    }
  }
}

// Run if called directly
if (require.main === module) {
  ensurePrintAreasSmart()
    .then(() => console.log('✨ Smart print areas check complete'))
    .catch(err => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}

module.exports = ensurePrintAreasSmart;