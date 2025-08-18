const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('🔧 Fixing Design Editor Issues...');

// Database path
const dbPath = path.join(__dirname, '../server/data/tresr-creator.db');

// Fix all design data structures
function fixDesignDataStructures() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Database connection error:', err);
        reject(err);
        return;
      }
      console.log('📂 Connected to SQLite database');
    });

    // Get all designs that need fixing
    db.all(
      `SELECT id, title, thumbnail_url, front_design_url, design_data 
       FROM designs 
       WHERE design_data IS NULL OR design_data = '' OR design_data = '{}'`,
      (err, designs) => {
        if (err) {
          console.error('❌ Error fetching designs:', err);
          reject(err);
          return;
        }

        console.log(`📋 Found ${designs.length} designs needing design_data updates`);
        let fixedCount = 0;
        let completed = 0;

        if (designs.length === 0) {
          console.log('✅ No designs need fixing');
          db.close();
          resolve(0);
          return;
        }

        designs.forEach((design) => {
          // Determine the best image URL
          const imageUrl = design.front_design_url || design.thumbnail_url;
          
          if (imageUrl) {
            // Create proper design_data structure
            const designData = {
              elements: [
                {
                  src: imageUrl,
                  type: 'image',
                  width: 400,
                  height: 400,
                  x: 150,  // Center in 700px canvas
                  y: 100,  // Center in 600px canvas
                  scale: 1,
                  rotation: 0
                }
              ],
              canvas: {
                width: 700,
                height: 600
              },
              metadata: {
                fixedAt: new Date().toISOString(),
                fixedBy: 'design-editor-fix-script'
              }
            };

            // Update the design
            db.run(
              `UPDATE designs 
               SET design_data = ?,
                   updated_at = datetime('now')
               WHERE id = ?`,
              [JSON.stringify(designData), design.id],
              function(err) {
                completed++;
                
                if (err) {
                  console.error(`❌ Error updating design ${design.id}:`, err);
                } else {
                  fixedCount++;
                  console.log(`✅ Fixed design ${design.id}: ${design.title}`);
                }

                // Check if all updates are complete
                if (completed === designs.length) {
                  console.log(`✅ Fixed ${fixedCount} designs with proper design_data structure`);
                  db.close();
                  resolve(fixedCount);
                }
              }
            );
          } else {
            completed++;
            console.log(`⚠️ Skipped design ${design.id} - no image URL available`);
            
            if (completed === designs.length) {
              console.log(`✅ Fixed ${fixedCount} designs with proper design_data structure`);
              db.close();
              resolve(fixedCount);
            }
          }
        });
      }
    );
  });
}

// Test design data loading (like frontend would do)
function testDesignLoading(designId) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(err);
        return;
      }
    });

    db.get(
      `SELECT * FROM designs WHERE id = ? LIMIT 1`,
      [designId],
      (err, design) => {
        if (err) {
          reject(err);
          return;
        }

        if (!design) {
          reject(new Error('Design not found'));
          return;
        }

        // Parse design_data
        let parsedDesignData = null;
        if (design.design_data) {
          try {
            parsedDesignData = typeof design.design_data === 'string' 
              ? JSON.parse(design.design_data) 
              : design.design_data;
          } catch (e) {
            console.error('Failed to parse design_data:', e);
          }
        }

        // Test image URL resolution (matches frontend logic)
        function getTestDesignImageUrl(designData, parsedDesignData) {
          // Priority 1: front_design_url
          if (designData.front_design_url) {
            return designData.front_design_url;
          }
          
          // Priority 2: First element in design_data
          if (parsedDesignData?.elements?.[0]?.src) {
            return parsedDesignData.elements[0].src;
          }
          
          // Priority 3: thumbnail_url
          if (designData.thumbnail_url) {
            return designData.thumbnail_url;
          }
          
          return null;
        }

        const resolvedImageUrl = getTestDesignImageUrl(design, parsedDesignData);

        const result = {
          design: {
            id: design.id,
            title: design.title,
            thumbnail_url: design.thumbnail_url,
            front_design_url: design.front_design_url,
            design_data: parsedDesignData,
            resolved_image_url: resolvedImageUrl
          },
          analysis: {
            has_thumbnail: !!design.thumbnail_url,
            has_front_design_url: !!design.front_design_url,
            has_design_data: !!design.design_data,
            design_data_valid: !!parsedDesignData,
            has_elements: !!(parsedDesignData?.elements?.length),
            first_element_src: parsedDesignData?.elements?.[0]?.src || null,
            image_url_resolved: !!resolvedImageUrl
          }
        };

        console.log('🧪 Test Results for Design', designId);
        console.log(JSON.stringify(result, null, 2));

        db.close();
        resolve(result);
      }
    );
  });
}

// Run the fixes
async function main() {
  try {
    console.log('🚀 Starting Design Editor Fixes...');
    
    // Fix all design data structures
    const fixedCount = await fixDesignDataStructures();
    console.log(`✅ Fixed ${fixedCount} designs`);
    
    // Test with the first design
    console.log('\n🧪 Testing design loading...');
    try {
      await testDesignLoading('1');
    } catch (testError) {
      console.log('⚠️ No design with ID "1" found, this is normal if using UUIDs');
    }
    
    console.log('\n✅ All fixes completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Restart the server');
    console.log('2. Navigate to /design/[id]/edit');
    console.log('3. Verify that images load in the canvas');
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  }
}

main();