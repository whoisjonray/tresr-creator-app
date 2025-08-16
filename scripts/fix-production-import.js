#!/usr/bin/env node

/**
 * Fix Production Import Issue for memelord
 * 
 * This script fixes the production database to enable design imports
 * for memelord (Jon Ray - whoisjonray@gmail.com)
 * 
 * Mappings:
 * - Dynamic.xyz ID: 31162d55-0da5-4b13-ad7c-3cafd170cebf
 * - Sanity Person ID: k2r2aa8vmghuyr3he0p2eo5e
 * - Email: whoisjonray@gmail.com
 * - Name: memelord
 */

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Configuration for memelord
const MEMELORD_CONFIG = {
  dynamicId: '31162d55-0da5-4b13-ad7c-3cafd170cebf',
  sanityPersonId: 'k2r2aa8vmghuyr3he0p2eo5e',
  email: 'whoisjonray@gmail.com',
  name: 'memelord',
  username: 'timetraveler',
  bio: 'time traveler'
};

async function getConnection() {
  // Try Railway production database
  if (process.env.MYSQL_URL) {
    console.log('📡 Connecting to Railway production database...');
    return await mysql.createConnection(process.env.MYSQL_URL);
  }
  
  // Try individual Railway vars
  if (process.env.MYSQLHOST) {
    console.log('📡 Connecting to Railway with individual vars...');
    return await mysql.createConnection({
      host: process.env.MYSQLHOST,
      port: process.env.MYSQLPORT || 3306,
      user: process.env.MYSQLUSER,
      password: process.env.MYSQLPASSWORD,
      database: process.env.MYSQLDATABASE
    });
  }
  
  throw new Error('No database connection available. Set MYSQL_URL or Railway environment variables.');
}

async function fixProductionDatabase() {
  let connection;
  
  try {
    connection = await getConnection();
    console.log('✅ Connected to production database\n');
    
    // Step 1: Check if creator_mappings table exists
    console.log('🔍 Checking for creator_mappings table...');
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'creator_mappings'"
    );
    
    if (tables.length === 0) {
      console.log('⚠️  Table creator_mappings does not exist. Creating it...');
      
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
    } else {
      console.log('✅ Table creator_mappings exists');
    }
    
    // Step 2: Check if memelord mapping exists
    console.log('\n🔍 Checking for existing memelord mapping...');
    const [existingMappings] = await connection.execute(
      'SELECT * FROM creator_mappings WHERE dynamic_id = ? OR sanity_person_id = ?',
      [MEMELORD_CONFIG.dynamicId, MEMELORD_CONFIG.sanityPersonId]
    );
    
    if (existingMappings.length > 0) {
      console.log('⚠️  Found existing mapping:', existingMappings[0]);
      console.log('🔧 Updating mapping to ensure correct values...');
      
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
      console.log('📝 Creating new mapping for memelord...');
      
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
      
      console.log('✅ Created new mapping for memelord');
    }
    
    // Step 3: Check if creators table exists and has memelord
    console.log('\n🔍 Checking creators table...');
    const [creatorTables] = await connection.execute(
      "SHOW TABLES LIKE 'creators'"
    );
    
    if (creatorTables.length > 0) {
      const [existingCreators] = await connection.execute(
        'SELECT * FROM creators WHERE id = ?',
        [MEMELORD_CONFIG.dynamicId]
      );
      
      if (existingCreators.length === 0) {
        console.log('📝 Creating creator record...');
        
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
      } else {
        console.log('✅ Creator record already exists');
      }
    }
    
    // Step 4: Verify the fix
    console.log('\n🔍 Verifying the fix...');
    const [verifyMapping] = await connection.execute(
      'SELECT * FROM creator_mappings WHERE dynamic_id = ?',
      [MEMELORD_CONFIG.dynamicId]
    );
    
    if (verifyMapping.length > 0) {
      console.log('✅ SUCCESS! Mapping verified:');
      console.log('   Dynamic ID:', verifyMapping[0].dynamic_id);
      console.log('   Sanity Person ID:', verifyMapping[0].sanity_person_id);
      console.log('   Email:', verifyMapping[0].email);
      console.log('   Name:', verifyMapping[0].sanity_name);
      
      console.log('\n🎉 Production database is now fixed!');
      console.log('   memelord should now be able to import designs.');
      console.log('   Test at: https://creators.tresr.com');
    } else {
      console.error('❌ ERROR: Mapping was not created successfully');
    }
    
  } catch (error) {
    console.error('❌ Database Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the fix
console.log('🚀 Starting Production Database Fix for memelord');
console.log('================================================\n');

fixProductionDatabase()
  .then(() => {
    console.log('\n✅ Fix completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Fix failed:', error);
    process.exit(1);
  });