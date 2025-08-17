const { v4: uuidv4 } = require('uuid');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

/**
 * Create a test design with all required fields for testing the design editor
 */

const dbPath = path.join(__dirname, '../data/tresr-creator.db');

function createTestDesign() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        reject(err);
        return;
      }
      console.log('✅ Connected to SQLite database');
    });

    const testDesign = {
      id: uuidv4(),
      sanity_design_id: 'test-design-001',
      creator_id: 'test-creator-1',
      title: 'Test Design for Editor',
      description: 'A test design to verify the design editor functionality',
      slug: 'test-design-for-editor',
      category: 'test',
      tags: '["test", "editor", "sample"]',
      design_url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      thumbnail_url: 'https://res.cloudinary.com/demo/image/upload/w_400,h_400,c_fill/sample.jpg',
      high_res_url: 'https://res.cloudinary.com/demo/image/upload/w_2000,h_2000/sample.jpg',
      front_design_url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      back_design_url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      front_design_public_id: 'sample',
      back_design_public_id: 'sample',
      front_position: '{"x": 200, "y": 150, "width": 150, "height": 150}',
      back_position: '{"x": 200, "y": 150, "width": 150, "height": 150}',
      front_scale: 1.0,
      back_scale: 1.0,
      design_data: '{"coordinates": {"front": {"x": 200, "y": 150, "width": 150, "height": 150}, "back": {"x": 200, "y": 150, "width": 150, "height": 150}}, "layers": [], "metadata": {"testDesign": true}}',
      print_method: 'DTG',
      nfc_experience: 'test-experience',
      status: 'published',
      published_at: new Date().toISOString(),
      design_type: 'graphic',
      is_public: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      imported_at: new Date().toISOString()
    };

    const insertSQL = `
      INSERT INTO designs (
        sanity_design_id, creator_id, title, description, slug, category, tags,
        design_url, thumbnail_url, high_res_url, front_design_url, back_design_url,
        front_design_public_id, back_design_public_id, front_position, back_position,
        front_scale, back_scale, design_data, print_method, nfc_experience, status,
        published_at, design_type, is_public, created_at, updated_at, imported_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      testDesign.sanity_design_id, testDesign.creator_id, testDesign.title, testDesign.description,
      testDesign.slug, testDesign.category, testDesign.tags, testDesign.design_url,
      testDesign.thumbnail_url, testDesign.high_res_url, testDesign.front_design_url,
      testDesign.back_design_url, testDesign.front_design_public_id, testDesign.back_design_public_id,
      testDesign.front_position, testDesign.back_position, testDesign.front_scale, testDesign.back_scale,
      testDesign.design_data, testDesign.print_method, testDesign.nfc_experience, testDesign.status,
      testDesign.published_at, testDesign.design_type, testDesign.is_public, testDesign.created_at,
      testDesign.updated_at, testDesign.imported_at
    ];

    db.run(insertSQL, values, function(err) {
      if (err) {
        console.error('❌ Error inserting test design:', err);
        reject(err);
      } else {
        console.log('✅ Test design created with ID:', this.lastID);
        console.log('📝 Design details:');
        console.log('  - Title:', testDesign.title);
        console.log('  - Creator ID:', testDesign.creator_id);
        console.log('  - Sanity ID:', testDesign.sanity_design_id);
        console.log('  - Front Position:', testDesign.front_position);
        console.log('  - Design Data:', testDesign.design_data);
        
        db.close();
        resolve({
          id: this.lastID,
          ...testDesign
        });
      }
    });
  });
}

// Run if called directly
if (require.main === module) {
  createTestDesign()
    .then((design) => {
      console.log('🚀 Test design created successfully');
      console.log('   You can now test the design editor with URL:');
      console.log(`   /design/${design.sanity_design_id}/edit`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Failed to create test design:', error);
      process.exit(1);
    });
}

module.exports = { createTestDesign };