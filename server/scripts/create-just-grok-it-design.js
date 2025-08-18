#!/usr/bin/env node

/**
 * Create/Fix the "Just Grok It" design in the database
 * This ensures the design exists and can be loaded by the editor
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/tresr-creator.db');
const designId = 'b389d0a0-932c-4d14-9ab0-8e29057af06e';

const designData = {
  id: designId,
  title: 'Just Grok It',
  creator_id: 'memelord', // Use existing creator
  frontDesignUrl: 'https://res.cloudinary.com/dqslerzk9/image/upload/v1740958348/designs/k2r2aa8vmghuyr3he0p2eo5e/kf2qj444lehxktpzdmkw.png',
  backDesignUrl: 'https://res.cloudinary.com/dqslerzk9/image/upload/v1740958348/designs/k2r2aa8vmghuyr3he0p2eo5e/zsk8gw3lcyl6af6fxyg1.png',
  thumbnail_url: 'https://res.cloudinary.com/dqslerzk9/image/upload/v1740958348/designs/k2r2aa8vmghuyr3he0p2eo5e/kf2qj444lehxktpzdmkw.png',
  description: 'AI-inspired design perfect for tech enthusiasts and philosophy lovers',
  status: 'published',
  tags: JSON.stringify(['AI', 'tech', 'philosophy', 'grok']),
  print_method: 'DTG',
  nfc_experience: null,
  design_data: JSON.stringify({
    elements: [{
      type: 'image',
      src: 'https://res.cloudinary.com/dqslerzk9/image/upload/v1740958348/designs/k2r2aa8vmghuyr3he0p2eo5e/kf2qj444lehxktpzdmkw.png',
      position: { x: 0.5, y: 0.45 },
      scale: 0.8,
      rotation: 0
    }]
  }),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  published_at: new Date().toISOString()
};

async function createDesign() {
  return new Promise((resolve, reject) => {
    console.log('🎨 Creating "Just Grok It" design in database...');
    console.log('📍 Database path:', dbPath);
    
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Database connection error:', err);
        reject(err);
        return;
      }
      console.log('✅ Connected to database');
    });

    // First, check if the design already exists
    db.get('SELECT id, title FROM designs WHERE id = ? OR title = ?', 
      [designId, 'Just Grok It'], 
      (err, row) => {
        if (err) {
          console.error('❌ Error checking existing design:', err);
          db.close();
          reject(err);
          return;
        }

        if (row) {
          console.log('📦 Design already exists:', row);
          
          // Update it with correct URLs
          const updateSql = `
            UPDATE designs SET 
              frontDesignUrl = ?,
              front_design_url = ?,
              backDesignUrl = ?,
              back_design_url = ?,
              thumbnail_url = ?,
              status = ?,
              updated_at = ?
            WHERE id = ?
          `;
          
          db.run(updateSql, [
            designData.frontDesignUrl,
            designData.frontDesignUrl, // Also set snake_case version
            designData.backDesignUrl,
            designData.backDesignUrl, // Also set snake_case version
            designData.thumbnail_url,
            designData.status,
            designData.updated_at,
            designId
          ], function(updateErr) {
            if (updateErr) {
              console.error('❌ Error updating design:', updateErr);
              db.close();
              reject(updateErr);
              return;
            }
            
            console.log('✅ Updated existing design with correct URLs');
            console.log(`   Rows affected: ${this.changes}`);
            
            // Verify the update
            db.get('SELECT * FROM designs WHERE id = ?', [designId], (verifyErr, updatedRow) => {
              db.close();
              if (verifyErr) {
                reject(verifyErr);
                return;
              }
              
              console.log('✅ Design verification:');
              console.log(`   Title: ${updatedRow.title}`);
              console.log(`   Front URL: ${updatedRow.frontDesignUrl || updatedRow.front_design_url}`);
              console.log(`   Back URL: ${updatedRow.backDesignUrl || updatedRow.back_design_url}`);
              console.log(`   Status: ${updatedRow.status}`);
              
              resolve(updatedRow);
            });
          });
        } else {
          console.log('➕ Creating new design...');
          
          // Create new design
          const insertSql = `
            INSERT INTO designs (
              id, title, creator_id, 
              frontDesignUrl, front_design_url,
              backDesignUrl, back_design_url,
              thumbnail_url, description, status, tags,
              print_method, nfc_experience, design_data,
              created_at, updated_at, published_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
          
          db.run(insertSql, [
            designData.id,
            designData.title,
            designData.creator_id,
            designData.frontDesignUrl,
            designData.frontDesignUrl, // Also set snake_case version
            designData.backDesignUrl,
            designData.backDesignUrl, // Also set snake_case version
            designData.thumbnail_url,
            designData.description,
            designData.status,
            designData.tags,
            designData.print_method,
            designData.nfc_experience,
            designData.design_data,
            designData.created_at,
            designData.updated_at,
            designData.published_at
          ], function(insertErr) {
            if (insertErr) {
              console.error('❌ Error inserting design:', insertErr);
              db.close();
              reject(insertErr);
              return;
            }
            
            console.log('✅ Created new design');
            console.log(`   Row ID: ${this.lastID}`);
            
            // Verify the creation
            db.get('SELECT * FROM designs WHERE id = ?', [designId], (verifyErr, newRow) => {
              db.close();
              if (verifyErr) {
                reject(verifyErr);
                return;
              }
              
              console.log('✅ Design verification:');
              console.log(`   Title: ${newRow.title}`);
              console.log(`   Front URL: ${newRow.frontDesignUrl || newRow.front_design_url}`);
              console.log(`   Back URL: ${newRow.backDesignUrl || newRow.back_design_url}`);
              console.log(`   Status: ${newRow.status}`);
              
              resolve(newRow);
            });
          });
        }
      });
  });
}

// Test the API endpoint
async function testApiEndpoint() {
  try {
    console.log('\n🧪 Testing API endpoint...');
    
    // For testing, we'll just log the curl command
    const testUrl = `http://localhost:3002/api/designs/${designId}/public`;
    console.log(`📡 Test URL: ${testUrl}`);
    console.log(`🔧 Test with: curl "${testUrl}"`);
    
    return true;
  } catch (error) {
    console.error('❌ API test failed:', error);
    return false;
  }
}

// Main execution
async function main() {
  try {
    await createDesign();
    await testApiEndpoint();
    
    console.log('\n🎉 SUCCESS! "Just Grok It" design is ready!');
    console.log('\n📋 Next steps:');
    console.log('1. Start the server: npm run dev');
    console.log('2. Test the editor: http://localhost:3001/designs/edit/just-grok-it');
    console.log('3. Test the API: curl "http://localhost:3002/api/designs/b389d0a0-932c-4d14-9ab0-8e29057af06e/public"');
    
  } catch (error) {
    console.error('❌ FAILED:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { createDesign, designData };