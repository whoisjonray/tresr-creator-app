const fs = require('fs').promises;
const path = require('path');

async function ensurePrintAreas() {
  console.log('🔍 Checking for print areas configuration...');
  
  // Default print areas configuration
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
    'baby-tee': { 
      front: { width: 240, height: 300, x: 180, y: 100 },
      back: { width: 240, height: 300, x: 180, y: 100 }
    },
    'sweat': { 
      front: { width: 260, height: 330, x: 170, y: 135 },
      back: { width: 260, height: 330, x: 170, y: 135 }
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
  
  // Check if file exists
  try {
    const exists = await fs.access(configPath).then(() => true).catch(() => false);
    
    if (!exists) {
      console.log('⚠️ No print areas file found, creating with defaults...');
      await fs.writeFile(configPath, JSON.stringify(defaultPrintAreas, null, 2));
      console.log('✅ Created default print areas configuration');
    } else {
      // Validate existing file
      const content = await fs.readFile(configPath, 'utf8');
      try {
        const data = JSON.parse(content);
        console.log('✅ Found existing print areas configuration with', Object.keys(data).length, 'garments');
      } catch (parseError) {
        console.log('⚠️ Invalid JSON in print areas file, recreating with defaults...');
        await fs.writeFile(configPath, JSON.stringify(defaultPrintAreas, null, 2));
        console.log('✅ Recreated print areas configuration');
      }
    }
  } catch (error) {
    console.error('❌ Error ensuring print areas:', error);
    // Try to create default file anyway
    try {
      await fs.writeFile(configPath, JSON.stringify(defaultPrintAreas, null, 2));
      console.log('✅ Created fallback print areas configuration');
    } catch (writeError) {
      console.error('❌ Failed to write fallback configuration:', writeError);
    }
  }
}

// Run if called directly
if (require.main === module) {
  ensurePrintAreas()
    .then(() => console.log('✨ Print areas check complete'))
    .catch(err => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}

module.exports = ensurePrintAreas;