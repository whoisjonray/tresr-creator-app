const sqlite3 = require('sqlite3').verbose();
const path = require('path');

/**
 * Test public design access to verify the design editor can load designs
 * without authentication for published designs
 */

async function testPublicDesignAccess() {
  const dbPath = path.join(__dirname, '../data/tresr-creator.db');
  const testDesignId = 'test-design-001';
  
  console.log('🔍 Testing public design access...');
  console.log(`📋 Looking for design: ${testDesignId}`);
  
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('SQLite connection error:', err);
        reject(err);
        return;
      }
    });

    const query = `
      SELECT 
        id, sanity_design_id as sanityId, creator_id as creatorId, 
        title as name, description,
        front_design_url as frontDesignUrl, back_design_url as backDesignUrl,
        front_design_public_id as frontDesignPublicId, back_design_public_id as backDesignPublicId,
        front_position as frontPosition, back_position as backPosition,
        front_scale as frontScale, back_scale as backScale,
        design_data as designData, thumbnail_url as thumbnailUrl,
        tags, print_method as printMethod, nfc_experience as nfcExperience,
        status, published_at as publishedAt, created_at as createdAt, updated_at as updatedAt
      FROM designs 
      WHERE (id = ? OR sanity_design_id = ?) AND (status = 'published' OR status IS NULL)
    `;

    db.get(query, [testDesignId, testDesignId], (err, row) => {
      db.close();
      
      if (err) {
        console.error('❌ Error fetching design:', err);
        reject(err);
        return;
      }

      if (!row) {
        console.log('❌ Design not found or not published');
        resolve(null);
        return;
      }

      // Parse JSON fields
      try {
        if (row.frontPosition) row.frontPosition = JSON.parse(row.frontPosition);
        if (row.backPosition) row.backPosition = JSON.parse(row.backPosition);
        if (row.designData) row.designData = JSON.parse(row.designData);
        if (row.tags) row.tags = JSON.parse(row.tags);
      } catch (parseError) {
        console.warn('JSON parsing error:', parseError);
      }

      console.log('✅ Design found via public access!');
      console.log('\n📊 Design data for editor:');
      console.log('  - ID:', row.sanityId);
      console.log('  - Name:', row.name);
      console.log('  - Status:', row.status);
      console.log('  - Front Design URL:', row.frontDesignUrl);
      console.log('  - Back Design URL:', row.backDesignUrl);
      
      console.log('\n🎯 Editor coordinate data:');
      console.log('  - Front Position:', row.frontPosition);
      console.log('  - Back Position:', row.backPosition);
      console.log('  - Design Data:', row.designData);
      
      // Verify editor requirements
      const editorReady = row.frontDesignUrl && row.frontPosition && row.designData;
      console.log(`\n${editorReady ? '✅' : '❌'} Design editor ready: ${editorReady ? 'YES' : 'NO'}`);
      
      if (editorReady) {
        console.log('\n🎉 Design editor should work with URL:');
        console.log(`   /design/${row.sanityId}/edit`);
        console.log('\n📡 API endpoint for frontend:');
        console.log(`   GET /api/designs/${row.sanityId}/public`);
      }

      resolve(row);
    });
  });
}

// Run test if called directly
if (require.main === module) {
  testPublicDesignAccess()
    .then(() => {
      console.log('\n🎉 Public access test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testPublicDesignAccess };