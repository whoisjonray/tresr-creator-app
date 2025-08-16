const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');

// Configuration for memelord
const MEMELORD_CONFIG = {
  dynamicId: '31162d55-0da5-4b13-ad7c-3cafd170cebf',
  sanityPersonId: 'k2r2aa8vmghuyr3he0p2eo5e',
  email: 'whoisjonray@gmail.com',
  name: 'memelord',
  username: 'timetraveler',
  bio: 'time traveler'
};

// One-time fix endpoint for production
router.get('/fix-memelord-mapping', async (req, res) => {
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
    
    // Check if creator_mappings table exists
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'creator_mappings'"
    );
    
    if (tables.length === 0) {
      // Create the table
      await connection.execute(`
        CREATE TABLE creator_mappings (
          id INT AUTO_INCREMENT PRIMARY KEY,
          sanity_person_id VARCHAR(255) UNIQUE NOT NULL,
          dynamic_id VARCHAR(255) UNIQUE,
          email VARCHAR(255),
          sanity_name VARCHAR(255),
          sanity_username VARCHAR(255),
          sanity_wallet_address VARCHAR(255),
          sanity_wallets JSON,
          is_verified BOOLEAN DEFAULT false,
          last_synced_at TIMESTAMP NULL,
          metadata JSON,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_sanity_person_id (sanity_person_id),
          INDEX idx_dynamic_id (dynamic_id),
          INDEX idx_email (email)
        )
      `);
      console.log('✅ Created creator_mappings table');
    }
    
    // Check if mapping exists
    const [existingMappings] = await connection.execute(
      'SELECT * FROM creator_mappings WHERE dynamic_id = ? OR sanity_person_id = ?',
      [MEMELORD_CONFIG.dynamicId, MEMELORD_CONFIG.sanityPersonId]
    );
    
    if (existingMappings.length > 0) {
      // Update existing
      await connection.execute(`
        UPDATE creator_mappings 
        SET 
          dynamic_id = ?,
          sanity_person_id = ?,
          email = ?,
          sanity_name = ?,
          sanity_username = ?,
          is_verified = true,
          last_synced_at = NOW()
        WHERE sanity_person_id = ? OR dynamic_id = ?
      `, [
        MEMELORD_CONFIG.dynamicId,
        MEMELORD_CONFIG.sanityPersonId,
        MEMELORD_CONFIG.email,
        MEMELORD_CONFIG.name,
        MEMELORD_CONFIG.username,
        MEMELORD_CONFIG.sanityPersonId,
        MEMELORD_CONFIG.dynamicId
      ]);
      console.log('✅ Updated existing mapping');
    } else {
      // Create new
      await connection.execute(`
        INSERT INTO creator_mappings (
          sanity_person_id,
          dynamic_id,
          email,
          sanity_name,
          sanity_username,
          is_verified,
          last_synced_at,
          metadata
        ) VALUES (?, ?, ?, ?, ?, true, NOW(), ?)
      `, [
        MEMELORD_CONFIG.sanityPersonId,
        MEMELORD_CONFIG.dynamicId,
        MEMELORD_CONFIG.email,
        MEMELORD_CONFIG.name,
        MEMELORD_CONFIG.username,
        JSON.stringify({ bio: MEMELORD_CONFIG.bio })
      ]);
      console.log('✅ Created new mapping');
    }
    
    // Also ensure creator exists
    const [creatorTables] = await connection.execute(
      "SHOW TABLES LIKE 'creators'"
    );
    
    if (creatorTables.length > 0) {
      const [existingCreators] = await connection.execute(
        'SELECT * FROM creators WHERE id = ?',
        [MEMELORD_CONFIG.dynamicId]
      );
      
      if (existingCreators.length === 0) {
        await connection.execute(`
          INSERT INTO creators (
            id,
            email,
            name,
            is_active,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, true, NOW(), NOW())
        `, [
          MEMELORD_CONFIG.dynamicId,
          MEMELORD_CONFIG.email,
          MEMELORD_CONFIG.name
        ]);
        console.log('✅ Created creator record');
      }
    }
    
    // Verify the fix
    const [verifyMapping] = await connection.execute(
      'SELECT * FROM creator_mappings WHERE dynamic_id = ?',
      [MEMELORD_CONFIG.dynamicId]
    );
    
    res.json({
      success: true,
      message: 'Production database fixed successfully!',
      mapping: verifyMapping[0] || null,
      config: MEMELORD_CONFIG
    });
    
  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

module.exports = router;