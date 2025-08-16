const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');

// Emergency fix to add missing columns to production database
router.get('/fix-schema', async (req, res) => {
  let connection;
  
  try {
    // Get database connection
    if (process.env.MYSQL_URL) {
      connection = await mysql.createConnection(process.env.MYSQL_URL);
    } else if (process.env.MYSQLHOST) {
      connection = await mysql.createConnection({
        host: process.env.MYSQLHOST,
        port: process.env.MYSQLPORT || 3306,
        user: process.env.MYSQLUSER,
        password: process.env.MYSQLPASSWORD,
        database: process.env.MYSQLDATABASE
      });
    } else {
      return res.status(500).json({ error: 'No database connection available' });
    }
    
    console.log('✅ Connected to production database');
    
    // Check if designs table exists
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'designs'"
    );
    
    if (tables.length === 0) {
      return res.status(404).json({ error: 'Designs table does not exist' });
    }
    
    // Check current columns
    const [columns] = await connection.execute(
      "SHOW COLUMNS FROM designs"
    );
    
    const columnNames = columns.map(col => col.Field);
    console.log('Current columns:', columnNames);
    
    // Add missing columns
    const fixes = [];
    
    // Check for sanity_id column
    if (!columnNames.includes('sanity_id')) {
      console.log('Adding sanity_id column...');
      await connection.execute(`
        ALTER TABLE designs 
        ADD COLUMN sanity_id VARCHAR(255) UNIQUE
      `);
      fixes.push('Added sanity_id column');
    }
    
    // Check for thumbnail_url column
    if (!columnNames.includes('thumbnail_url')) {
      console.log('Adding thumbnail_url column...');
      await connection.execute(`
        ALTER TABLE designs 
        ADD COLUMN thumbnail_url TEXT
      `);
      fixes.push('Added thumbnail_url column');
    }
    
    // Check for design_data column
    if (!columnNames.includes('design_data')) {
      console.log('Adding design_data column...');
      await connection.execute(`
        ALTER TABLE designs 
        ADD COLUMN design_data JSON
      `);
      fixes.push('Added design_data column');
    }
    
    // Verify the fixes
    const [newColumns] = await connection.execute(
      "SHOW COLUMNS FROM designs"
    );
    
    res.json({
      success: true,
      message: 'Schema fixed successfully!',
      fixes: fixes.length > 0 ? fixes : ['No fixes needed - all columns exist'],
      columns: newColumns.map(col => col.Field)
    });
    
  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({
      error: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

module.exports = router;