#!/usr/bin/env node
/**
 * Production Creator Mappings Population Script
 * 
 * This script fixes the issue where creators.tresr.com returns 0 designs
 * by ensuring the production database has the correct creator mappings
 * between Dynamic.xyz user IDs and Sanity person IDs.
 * 
 * Problem: Production database lacks the mapping table that connects:
 * - Dynamic.xyz ID: 31162d55-0da5-4b13-ad7c-3cafd170cebf (Jon Ray / whoisjonray@gmail.com)
 * - Sanity person ID: k2r2aa8vmghuyr3he0p2eo5e (memelord)
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.production') });
const { Sequelize, DataTypes } = require('sequelize');

// Production database configuration
const PRODUCTION_DB_URL = process.env.MYSQL_URL || process.env.DATABASE_URL;

if (!PRODUCTION_DB_URL) {
  console.error('❌ No production database URL found in environment variables');
  console.log('Expected: MYSQL_URL or DATABASE_URL');
  process.exit(1);
}

// Known creator mappings that need to be in production
const CREATOR_MAPPINGS = [
  {
    sanityPersonId: 'k2r2aa8vmghuyr3he0p2eo5e',
    dynamicId: '31162d55-0da5-4b13-ad7c-3cafd170cebf',
    email: 'whoisjonray@gmail.com',
    sanityName: 'memelord',
    sanityUsername: 'memelord',
    isVerified: true,
    metadata: {
      note: 'Primary creator - Jon Ray / memelord',
      setupDate: new Date().toISOString(),
      source: 'production_fix_script'
    }
  }
  // Add more creators here as needed
];

async function connectToDatabase() {
  console.log('🔌 Connecting to production database...');
  
  const sequelize = new Sequelize(PRODUCTION_DB_URL, {
    dialect: 'mysql',
    logging: console.log, // Enable logging to see what's happening
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });

  try {
    await sequelize.authenticate();
    console.log('✅ Production database connection established');
    return sequelize;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    throw error;
  }
}

function defineCreatorMappingModel(sequelize) {
  const CreatorMapping = sequelize.define('CreatorMapping', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    sanityPersonId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'sanity_person_id',
      comment: 'Sanity person._id (e.g., k2r2aa8vmghuyr3he0p2eo5e)'
    },
    dynamicId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'dynamic_id',
      comment: 'Dynamic.xyz user ID (e.g., 31162d55-0da5-4b13-ad7c-3cafd170cebf)'
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'User email (e.g., whoisjonray@gmail.com)'
    },
    sanityName: {
      type: DataTypes.STRING,
      field: 'sanity_name',
      comment: 'Name in Sanity (e.g., memelord)'
    },
    sanityUsername: {
      type: DataTypes.STRING,
      field: 'sanity_username',
      comment: 'Username in Sanity'
    },
    sanityWalletAddress: {
      type: DataTypes.STRING,
      field: 'sanity_wallet_address',
      comment: 'Primary wallet from Sanity'
    },
    sanityWallets: {
      type: DataTypes.JSON,
      field: 'sanity_wallets',
      comment: 'All wallets from Sanity person',
      defaultValue: []
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_verified',
      comment: 'Whether this mapping has been verified'
    },
    lastSyncedAt: {
      type: DataTypes.DATE,
      field: 'last_synced_at',
      comment: 'Last time designs were synced from Sanity'
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {},
      comment: 'Additional metadata from Sanity'
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'updated_at'
    }
  }, {
    tableName: 'creator_mappings',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['sanity_person_id']
      },
      {
        unique: true,
        fields: ['dynamic_id']
      },
      {
        fields: ['email']
      }
    ]
  });

  return CreatorMapping;
}

async function checkDatabaseState(sequelize) {
  console.log('\n📊 Checking current database state...');
  
  try {
    // Check if creator_mappings table exists
    const [tables] = await sequelize.query("SHOW TABLES LIKE 'creator_mappings'");
    
    if (tables.length === 0) {
      console.log('⚠️ creator_mappings table does not exist');
      return { hasTable: false, mappings: [] };
    }
    
    console.log('✅ creator_mappings table exists');
    
    // Check existing mappings
    const [mappings] = await sequelize.query('SELECT * FROM creator_mappings');
    console.log(`📋 Found ${mappings.length} existing creator mappings`);
    
    if (mappings.length > 0) {
      console.log('\nExisting mappings:');
      mappings.forEach(mapping => {
        console.log(`  - ${mapping.sanity_name || 'Unknown'} (${mapping.email})`);
        console.log(`    Sanity ID: ${mapping.sanity_person_id}`);
        console.log(`    Dynamic ID: ${mapping.dynamic_id}`);
        console.log(`    Verified: ${mapping.is_verified}`);
      });
    }
    
    return { hasTable: true, mappings };
  } catch (error) {
    console.error('❌ Error checking database state:', error.message);
    return { hasTable: false, mappings: [], error: error.message };
  }
}

async function createCreatorMappingsTable(sequelize) {
  console.log('\n🔧 Creating creator_mappings table...');
  
  const CreatorMapping = defineCreatorMappingModel(sequelize);
  
  try {
    await CreatorMapping.sync({ force: false });
    console.log('✅ creator_mappings table created successfully');
    return CreatorMapping;
  } catch (error) {
    console.error('❌ Error creating table:', error.message);
    throw error;
  }
}

async function populateCreatorMappings(sequelize, CreatorMapping) {
  console.log('\n👥 Populating creator mappings...');
  
  const results = {
    created: 0,
    updated: 0,
    errors: 0,
    details: []
  };
  
  for (const mappingData of CREATOR_MAPPINGS) {
    try {
      console.log(`\n Processing ${mappingData.sanityName} (${mappingData.email})...`);
      
      // Check if mapping already exists
      const existing = await CreatorMapping.findOne({
        where: {
          sanityPersonId: mappingData.sanityPersonId
        }
      });
      
      if (existing) {
        // Update existing mapping
        await existing.update(mappingData);
        console.log(`  ✅ Updated existing mapping for ${mappingData.sanityName}`);
        results.updated++;
        results.details.push(`Updated: ${mappingData.sanityName}`);
      } else {
        // Create new mapping
        const newMapping = await CreatorMapping.create(mappingData);
        console.log(`  ✅ Created new mapping for ${mappingData.sanityName}`);
        results.created++;
        results.details.push(`Created: ${mappingData.sanityName} (ID: ${newMapping.id})`);
      }
      
    } catch (error) {
      console.error(`  ❌ Error processing ${mappingData.sanityName}:`, error.message);
      results.errors++;
      results.details.push(`Error: ${mappingData.sanityName} - ${error.message}`);
    }
  }
  
  return results;
}

async function verifyMappings(sequelize) {
  console.log('\n🔍 Verifying creator mappings...');
  
  try {
    const [mappings] = await sequelize.query(`
      SELECT 
        sanity_person_id,
        dynamic_id,
        email,
        sanity_name,
        is_verified,
        created_at,
        updated_at
      FROM creator_mappings 
      ORDER BY created_at DESC
    `);
    
    console.log(`\n📊 Final verification - ${mappings.length} total mappings:`);
    
    mappings.forEach((mapping, index) => {
      console.log(`\n${index + 1}. ${mapping.sanity_name || 'Unknown'}`);
      console.log(`   Email: ${mapping.email}`);
      console.log(`   Sanity ID: ${mapping.sanity_person_id}`);
      console.log(`   Dynamic ID: ${mapping.dynamic_id}`);
      console.log(`   Verified: ${mapping.is_verified ? '✅' : '⚠️'}`);
      console.log(`   Created: ${mapping.created_at}`);
    });
    
    // Check specifically for Jon Ray / memelord mapping
    const jonMapping = mappings.find(m => m.email === 'whoisjonray@gmail.com');
    
    if (jonMapping) {
      console.log('\n🎯 Critical mapping verification:');
      console.log(`✅ Jon Ray (whoisjonray@gmail.com) mapping found`);
      console.log(`   Dynamic ID: ${jonMapping.dynamic_id}`);
      console.log(`   Sanity ID: ${jonMapping.sanity_person_id}`);
      console.log(`   This should fix the 0 designs issue at creators.tresr.com`);
    } else {
      console.log('\n❌ Critical mapping missing:');
      console.log('   Jon Ray (whoisjonray@gmail.com) mapping NOT found');
      console.log('   This will still cause 0 designs issue at creators.tresr.com');
    }
    
    return mappings;
    
  } catch (error) {
    console.error('❌ Error verifying mappings:', error.message);
    throw error;
  }
}

async function main() {
  let sequelize;
  
  try {
    console.log('🚀 Starting production creator mappings population...');
    console.log(`📍 Target database: ${PRODUCTION_DB_URL.replace(/\/\/.*:.*@/, '//***:***@')}`);
    
    // Connect to database
    sequelize = await connectToDatabase();
    
    // Check current state
    const currentState = await checkDatabaseState(sequelize);
    
    // Create table if needed
    let CreatorMapping;
    if (!currentState.hasTable) {
      CreatorMapping = await createCreatorMappingsTable(sequelize);
    } else {
      CreatorMapping = defineCreatorMappingModel(sequelize);
    }
    
    // Populate mappings
    const results = await populateCreatorMappings(sequelize, CreatorMapping);
    
    // Verify final state
    await verifyMappings(sequelize);
    
    // Summary
    console.log('\n🎉 Creator mappings population completed!');
    console.log(`📊 Results:`);
    console.log(`   Created: ${results.created} new mappings`);
    console.log(`   Updated: ${results.updated} existing mappings`);
    console.log(`   Errors: ${results.errors} errors`);
    
    if (results.details.length > 0) {
      console.log('\n📝 Details:');
      results.details.forEach(detail => console.log(`   - ${detail}`));
    }
    
    console.log('\n✅ Next steps:');
    console.log('1. Test login at https://creators.tresr.com with whoisjonray@gmail.com');
    console.log('2. Check that designs are now loading (should be > 0)');
    console.log('3. If still 0 designs, check the designs table population');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Script failed:', error.message);
    
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    
    process.exit(1);
  } finally {
    if (sequelize) {
      await sequelize.close();
      console.log('🔌 Database connection closed');
    }
  }
}

// Handle script interruption gracefully
process.on('SIGINT', () => {
  console.log('\n⚠️ Script interrupted by user');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the script
main();