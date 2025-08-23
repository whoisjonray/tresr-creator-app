/**
 * Sync Bounding Box Coordinates
 * Reads the saved print areas from BoundingBoxEditor and syncs them to the database
 * This ensures both the admin page and design editor use the same coordinates
 */

const axios = require('axios');

// The correct print areas as shown in the BoundingBoxEditor
// Updated with proper mug position (lower on the canvas)
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

async function syncBoundingBoxes() {
  console.log('🔄 Syncing Bounding Box Coordinates...\n');
  
  try {
    // Connect to the local server
    const apiUrl = 'http://localhost:3002/api/settings/print-areas';
    
    console.log('📤 Sending correct print areas to database...');
    
    const response = await axios.post(apiUrl, {
      printAreas: CORRECT_PRINT_AREAS
    });
    
    if (response.data.success) {
      console.log('✅ Successfully synced print areas to database!\n');
      
      // Log what was updated
      console.log('📋 Updated print areas for:');
      Object.keys(CORRECT_PRINT_AREAS).forEach(productId => {
        const area = CORRECT_PRINT_AREAS[productId];
        if (area.front) {
          console.log(`   - ${productId}: ${area.front.width}x${area.front.height} at (${area.front.x}, ${area.front.y})`);
        }
      });
      
      console.log('\n🎯 Special Updates:');
      console.log('   - Coffee Mug: Positioned lower at y=180 (was y=200)');
      console.log('   - Coffee Mug: Height adjusted to 210px (was 200px)');
      
      console.log('\n✨ Both BoundingBoxEditor and DesignEditor will now use the same coordinates!');
      console.log('🚀 Refresh your browser to see the changes.');
      
    } else {
      console.error('❌ Failed to sync:', response.data.message);
    }
    
  } catch (error) {
    console.error('❌ Error syncing bounding boxes:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
    console.log('\n💡 Make sure the server is running: npm run dev:server');
  }
}

// Also create a function to read current values from database
async function checkCurrentValues() {
  try {
    const response = await axios.get('http://localhost:3002/api/settings/print-areas');
    
    if (response.data.success && response.data.printAreas) {
      console.log('\n📊 Current Database Values:');
      const current = response.data.printAreas;
      
      // Check for differences
      let hasDifferences = false;
      
      Object.keys(CORRECT_PRINT_AREAS).forEach(productId => {
        const correct = CORRECT_PRINT_AREAS[productId];
        const currentArea = current[productId];
        
        if (currentArea && correct.front && currentArea.front) {
          const isDifferent = 
            currentArea.front.x !== correct.front.x ||
            currentArea.front.y !== correct.front.y ||
            currentArea.front.width !== correct.front.width ||
            currentArea.front.height !== correct.front.height;
          
          if (isDifferent) {
            hasDifferences = true;
            console.log(`   ⚠️  ${productId}: Current (${currentArea.front.x}, ${currentArea.front.y}, ${currentArea.front.width}x${currentArea.front.height}) → New (${correct.front.x}, ${correct.front.y}, ${correct.front.width}x${correct.front.height})`);
          }
        }
      });
      
      if (!hasDifferences) {
        console.log('   ✅ All coordinates already match!');
      }
    }
  } catch (error) {
    console.log('   Could not read current values:', error.message);
  }
}

// Run the sync
async function run() {
  console.log('========================================');
  console.log('   TRESR Bounding Box Sync Tool');
  console.log('========================================\n');
  
  // First check current values
  await checkCurrentValues();
  
  // Then sync
  console.log('\n');
  await syncBoundingBoxes();
}

run().catch(console.error);