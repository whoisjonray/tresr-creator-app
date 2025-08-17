const sqlite3 = require('sqlite3').verbose();
const path = require('path');

/**
 * Migration script to update SQLite database schema to match the expected design structure
 * This fixes the missing design_data, front_position, back_position etc. fields
 */

const dbPath = path.join(__dirname, '../data/tresr-creator.db');

function runMigration() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        reject(err);
        return;
      }
      console.log('✅ Connected to SQLite database');
    });

    // Start transaction
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      // Check current table structure
      db.all("PRAGMA table_info(designs)", (err, columns) => {
        if (err) {
          console.error('Error checking table info:', err);
          db.run('ROLLBACK');
          reject(err);
          return;
        }
        
        console.log('Current columns:', columns.map(c => c.name));
        const existingColumns = columns.map(c => c.name);

        // Add missing columns to designs table (only if they don't exist)
        const newColumns = [
          { name: 'front_design_url', sql: "ALTER TABLE designs ADD COLUMN front_design_url TEXT" },
          { name: 'front_design_public_id', sql: "ALTER TABLE designs ADD COLUMN front_design_public_id TEXT" },
          { name: 'back_design_url', sql: "ALTER TABLE designs ADD COLUMN back_design_url TEXT" },
          { name: 'back_design_public_id', sql: "ALTER TABLE designs ADD COLUMN back_design_public_id TEXT" },
          { name: 'front_position', sql: "ALTER TABLE designs ADD COLUMN front_position TEXT" },
          { name: 'back_position', sql: "ALTER TABLE designs ADD COLUMN back_position TEXT" },
          { name: 'front_scale', sql: "ALTER TABLE designs ADD COLUMN front_scale REAL DEFAULT 1.0" },
          { name: 'back_scale', sql: "ALTER TABLE designs ADD COLUMN back_scale REAL DEFAULT 1.0" },
          { name: 'design_data', sql: "ALTER TABLE designs ADD COLUMN design_data TEXT" },
          { name: 'print_method', sql: "ALTER TABLE designs ADD COLUMN print_method TEXT DEFAULT 'DTG'" },
          { name: 'nfc_experience', sql: "ALTER TABLE designs ADD COLUMN nfc_experience TEXT" },
          { name: 'status', sql: "ALTER TABLE designs ADD COLUMN status TEXT DEFAULT 'draft'" },
          { name: 'published_at', sql: "ALTER TABLE designs ADD COLUMN published_at DATETIME" },
          { name: 'creator_id', sql: "ALTER TABLE designs ADD COLUMN creator_id TEXT" }
        ];
        
        const migrations = newColumns.filter(col => !existingColumns.includes(col.name)).map(col => col.sql);

        console.log(`Found ${migrations.length} columns to add`);
        
        if (migrations.length === 0) {
          console.log('✅ All columns already exist, no migration needed');
          db.run('COMMIT');
          db.close();
          resolve();
          return;
        }

        let completed = 0;
        let errors = [];

        migrations.forEach((migration, index) => {
          db.run(migration, (err) => {
            if (err && !err.message.includes('duplicate column name')) {
              console.error(`❌ Migration ${index + 1} failed:`, err.message);
              errors.push(err.message);
            } else if (!err) {
              console.log(`✅ Migration ${index + 1} completed`);
            } else {
              console.log(`⚠️ Migration ${index + 1} skipped (column exists)`);
            }
            
            completed++;
            
            if (completed === migrations.length) {
              if (errors.length === 0) {
                console.log('🎉 All migrations completed successfully');
                
                // Migrate existing data if any
                db.run(`UPDATE designs SET 
                  front_position = COALESCE(front_position, '{"x": 150, "y": 150, "width": 150, "height": 150}'),
                  back_position = COALESCE(back_position, '{"x": 150, "y": 150, "width": 150, "height": 150}'),
                  design_data = COALESCE(design_data, '{}'),
                  front_design_url = COALESCE(front_design_url, design_url),
                  status = COALESCE(status, 'published')
                WHERE front_position IS NULL OR front_position = ''`, (err) => {
                  if (err) {
                    console.error('❌ Data migration failed:', err);
                    db.run('ROLLBACK');
                    reject(err);
                  } else {
                    console.log('✅ Data migration completed');
                    db.run('COMMIT');
                    db.close();
                    resolve();
                  }
                });
              } else {
                console.error('❌ Some migrations failed:', errors);
                db.run('ROLLBACK');
                reject(new Error('Migration failed'));
              }
            }
          });
        });
      });
    });
  });
}

// Run migration if called directly
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('🚀 Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigration };