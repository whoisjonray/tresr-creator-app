/**
 * Direct Sync Bounding Box Coordinates
 * Directly writes the correct print areas to the config file
 */

const fs = require('fs').promises;
const path = require('path');

// The correct print areas with proper mug position
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
    front: { width: 200, height: 210, x: 200, y: 180 },  // Lower position for proper mug placement
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

async function directSync() {
  console.log('========================================');
  console.log('   Direct Bounding Box Sync');
  console.log('========================================\n');
  
  try {
    // Path to the config file
    const configPath = path.join(__dirname, '../server/config/print-areas.json');
    const configDir = path.dirname(configPath);
    
    // Create config directory if it doesn't exist
    await fs.mkdir(configDir, { recursive: true });
    
    // Write the correct print areas directly
    await fs.writeFile(
      configPath,
      JSON.stringify(CORRECT_PRINT_AREAS, null, 2),
      'utf8'
    );
    
    console.log('✅ Successfully wrote print areas to config file!');
    console.log(`📁 File location: ${configPath}\n`);
    
    console.log('📋 Updated print areas:');
    console.log('   - Coffee Mug: 200x210 at (200, 180) - positioned lower');
    console.log('   - T-Shirt: 280x350 at (160, 125)');
    console.log('   - Boxy: 300x350 at (150, 125)');
    console.log('   - Next Level Crop: 200x200 at (200, 150)');
    console.log('   - And all other products...\n');
    
    console.log('✨ The DesignEditor will now use these coordinates!');
    console.log('🚀 Refresh your browser to see the changes.');
    
  } catch (error) {
    console.error('❌ Error writing config file:', error.message);
  }
}

directSync().catch(console.error);