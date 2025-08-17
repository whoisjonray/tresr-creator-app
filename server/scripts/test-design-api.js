const databaseService = require('../services/database');

/**
 * Test script to verify design data is being returned correctly
 * Tests the getDesignById function with the test design
 */

async function testDesignAPI() {
  try {
    console.log('🔍 Testing design API...');
    
    // Test with the test design we created
    const testCreatorId = 'test-creator-1';
    const testDesignId = 'test-design-001';
    
    console.log(`\n📋 Fetching design: ${testDesignId} for creator: ${testCreatorId}`);
    
    const design = await databaseService.getDesignById(testDesignId, testCreatorId);
    
    if (!design) {
      console.log('❌ Design not found');
      return;
    }
    
    console.log('✅ Design found!');
    console.log('\n📊 Design data:');
    console.log('  - ID:', design.id || design.sanityId);
    console.log('  - Name:', design.name);
    console.log('  - Creator ID:', design.creatorId);
    console.log('  - Front Design URL:', design.frontDesignUrl);
    console.log('  - Back Design URL:', design.backDesignUrl);
    
    console.log('\n🎯 Position Data:');
    console.log('  - Front Position:', design.frontPosition);
    console.log('  - Back Position:', design.backPosition);
    console.log('  - Front Scale:', design.frontScale);
    console.log('  - Back Scale:', design.backScale);
    
    console.log('\n📦 Design Data:');
    console.log('  - Design Data:', design.designData);
    
    // Check for required fields for design editor
    const requiredFields = [
      'frontDesignUrl', 'backDesignUrl', 'frontPosition', 'backPosition', 
      'frontScale', 'backScale', 'designData'
    ];
    
    console.log('\n✅ Required fields check:');
    requiredFields.forEach(field => {
      const exists = design[field] !== undefined && design[field] !== null;
      console.log(`  - ${field}: ${exists ? '✅' : '❌'} ${exists ? '(exists)' : '(missing)'}`);
    });
    
    // Check if designData has coordinates
    if (design.designData && design.designData.coordinates) {
      console.log('\n🎯 Coordinate data check:');
      console.log('  - Front coordinates:', design.designData.coordinates.front);
      console.log('  - Back coordinates:', design.designData.coordinates.back);
    } else {
      console.log('\n❌ Missing coordinate data in designData');
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

// Run test if called directly
if (require.main === module) {
  testDesignAPI()
    .then(() => {
      console.log('\n🎉 Test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testDesignAPI };