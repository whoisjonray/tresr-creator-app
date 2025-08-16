#!/usr/bin/env node
/**
 * Production Database Diagnostic Script
 * 
 * This script checks the current state of the production database
 * to understand why creators.tresr.com is returning 0 designs.
 * 
 * It will check:
 * 1. Database connection
 * 2. Tables existence (creator_mappings, designs, creators)
 * 3. Data in each table
 * 4. Specific mappings for Jon Ray / memelord
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.production') });
const { Sequelize } = require('sequelize');

// Production database configuration
const PRODUCTION_DB_URL = process.env.MYSQL_URL || process.env.DATABASE_URL;

if (!PRODUCTION_DB_URL) {
  console.error('❌ No production database URL found in environment variables');
  console.log('Available environment variables:');
  Object.keys(process.env).filter(key => key.includes('DATABASE') || key.includes('MYSQL')).forEach(key => {
    console.log(`  ${key}: ${process.env[key] ? '[SET]' : '[NOT SET]'}`);
  });
  process.exit(1);
}

async function connectToDatabase() {
  console.log('🔌 Connecting to production database...');
  console.log(`📍 Database URL: ${PRODUCTION_DB_URL.replace(/\/\/.*:.*@/, '//***:***@')}`);
  
  const sequelize = new Sequelize(PRODUCTION_DB_URL, {
    dialect: 'mysql',
    logging: false, // Disable query logging for cleaner output
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });

  try {
    await sequelize.authenticate();
    console.log('✅ Production database connection established\n');
    return sequelize;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    throw error;
  }
}

async function checkTables(sequelize) {
  console.log('📋 Checking database tables...');
  
  try {
    const [tables] = await sequelize.query("SHOW TABLES");
    const tableNames = tables.map(t => Object.values(t)[0]);
    
    console.log(`Found ${tables.length} tables:`);
    tableNames.forEach(name => console.log(`  - ${name}`));
    
    const requiredTables = ['creator_mappings', 'designs', 'creators'];
    const missingTables = requiredTables.filter(table => !tableNames.includes(table));
    
    if (missingTables.length > 0) {
      console.log(`\n⚠️ Missing required tables: ${missingTables.join(', ')}`);
    } else {
      console.log('\n✅ All required tables exist');
    }
    
    return { tableNames, missingTables };
  } catch (error) {
    console.error('❌ Error checking tables:', error.message);
    return { tableNames: [], missingTables: ['creator_mappings', 'designs', 'creators'] };
  }
}

async function checkCreatorMappings(sequelize) {
  console.log('\n👥 Checking creator_mappings table...');
  
  try {
    const [mappings] = await sequelize.query('SELECT * FROM creator_mappings');
    
    console.log(`Found ${mappings.length} creator mappings:`);
    
    if (mappings.length === 0) {
      console.log('⚠️ No creator mappings found - this is likely the root cause!');
      return { count: 0, hasJonMapping: false };
    }
    
    mappings.forEach((mapping, index) => {
      console.log(`\n${index + 1}. ${mapping.sanity_name || 'Unknown'}`);
      console.log(`   Email: ${mapping.email}`);
      console.log(`   Sanity ID: ${mapping.sanity_person_id}`);
      console.log(`   Dynamic ID: ${mapping.dynamic_id}`);
      console.log(`   Verified: ${mapping.is_verified ? '✅' : '⚠️'}`);
    });
    
    // Check for Jon Ray specifically
    const jonMapping = mappings.find(m => m.email === 'whoisjonray@gmail.com');
    const hasJonMapping = !!jonMapping;
    
    if (hasJonMapping) {
      console.log('\n✅ Jon Ray mapping found');
    } else {
      console.log('\n❌ Jon Ray mapping NOT found - this is the problem!');
    }
    
    return { count: mappings.length, hasJonMapping, mappings };
    
  } catch (error) {
    console.error('❌ Error checking creator_mappings:', error.message);
    return { count: 0, hasJonMapping: false, error: error.message };
  }
}

async function checkDesigns(sequelize) {
  console.log('\n🎨 Checking designs table...');
  
  try {
    const [designs] = await sequelize.query('SELECT COUNT(*) as total FROM designs');
    const totalDesigns = designs[0].total;
    
    console.log(`Total designs in database: ${totalDesigns}`);
    
    if (totalDesigns === 0) {
      console.log('⚠️ No designs found in database');
      return { total: 0 };
    }
    
    // Check designs by creator
    const [byCreator] = await sequelize.query(`
      SELECT creator_id, COUNT(*) as design_count 
      FROM designs 
      GROUP BY creator_id 
      ORDER BY design_count DESC
    `);
    
    console.log('\nDesigns by creator:');
    byCreator.forEach(row => {
      console.log(`  Creator ${row.creator_id}: ${row.design_count} designs`);
    });
    
    // Check for Jon Ray's designs specifically
    const jonCreatorId = '31162d55-0da5-4b13-ad7c-3cafd170cebf';
    const [jonDesigns] = await sequelize.query(
      'SELECT COUNT(*) as count FROM designs WHERE creator_id = ?',
      { replacements: [jonCreatorId] }
    );
    
    console.log(`\n🎯 Jon Ray's designs (creator_id: ${jonCreatorId}): ${jonDesigns[0].count}`);
    
    return { 
      total: totalDesigns, 
      byCreator, 
      jonDesignCount: jonDesigns[0].count 
    };
    
  } catch (error) {
    console.error('❌ Error checking designs:', error.message);
    return { total: 0, error: error.message };
  }
}

async function checkCreators(sequelize) {
  console.log('\n👤 Checking creators table...');
  
  try {
    const [creators] = await sequelize.query('SELECT * FROM creators LIMIT 10');
    
    console.log(`Found ${creators.length} creators (showing first 10):`);
    
    creators.forEach((creator, index) => {
      console.log(`\n${index + 1}. ${creator.name || 'Unknown'}`);
      console.log(`   ID: ${creator.id}`);
      console.log(`   Email: ${creator.email}`);
      console.log(`   Active: ${creator.is_active ? '✅' : '❌'}`);
    });
    
    // Check for Jon Ray specifically
    const jonEmail = 'whoisjonray@gmail.com';
    const [jonCreator] = await sequelize.query(
      'SELECT * FROM creators WHERE email = ?',
      { replacements: [jonEmail] }
    );
    
    if (jonCreator.length > 0) {
      console.log(`\n✅ Jon Ray found in creators table:`);
      console.log(`   ID: ${jonCreator[0].id}`);
      console.log(`   Email: ${jonCreator[0].email}`);
      console.log(`   Active: ${jonCreator[0].is_active ? '✅' : '❌'}`);
    } else {
      console.log(`\n❌ Jon Ray NOT found in creators table`);
    }
    
    return { 
      total: creators.length, 
      creators, 
      hasJonCreator: jonCreator.length > 0,
      jonCreator: jonCreator[0] || null
    };
    
  } catch (error) {
    console.error('❌ Error checking creators:', error.message);
    return { total: 0, error: error.message };
  }
}

async function diagnoseIssue(results) {
  console.log('\n🔍 DIAGNOSIS SUMMARY');
  console.log('=====================================');
  
  const issues = [];
  const fixes = [];
  
  // Check for missing tables
  if (results.tables.missingTables.length > 0) {
    issues.push(`Missing tables: ${results.tables.missingTables.join(', ')}`);
    fixes.push('Run database migration script to create missing tables');
  }
  
  // Check creator mappings
  if (!results.mappings || results.mappings.count === 0) {
    issues.push('No creator mappings found');
    fixes.push('Run populate-production-creator-mappings.js script');
  } else if (!results.mappings.hasJonMapping) {
    issues.push('Jon Ray creator mapping missing');
    fixes.push('Run populate-production-creator-mappings.js script');
  }
  
  // Check designs
  if (!results.designs || results.designs.total === 0) {
    issues.push('No designs in database');
    fixes.push('Import designs from Sanity using direct-import API');
  } else if (results.designs.jonDesignCount === 0) {
    issues.push('No designs for Jon Ray found');
    fixes.push('Import Jon Ray\'s designs from Sanity');
  }
  
  // Check creators
  if (!results.creators || !results.creators.hasJonCreator) {
    issues.push('Jon Ray not found in creators table');
    fixes.push('Create Jon Ray entry in creators table');
  }
  
  if (issues.length === 0) {
    console.log('✅ No issues found - database appears to be properly configured');
    console.log('\nIf still getting 0 designs, check:');
    console.log('1. Application server logs');
    console.log('2. Authentication flow');
    console.log('3. API endpoint routing');
  } else {
    console.log('❌ Issues found:');
    issues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue}`);
    });
    
    console.log('\n🔧 Recommended fixes:');
    fixes.forEach((fix, index) => {
      console.log(`   ${index + 1}. ${fix}`);
    });
  }
  
  console.log('\n📝 Next steps:');
  console.log('1. Run: node scripts/populate-production-creator-mappings.js');
  console.log('2. Test login at https://creators.tresr.com');
  console.log('3. Check if designs now load properly');
}

async function main() {
  let sequelize;
  
  try {
    console.log('🚀 Starting production database diagnosis...');
    
    // Connect to database
    sequelize = await connectToDatabase();
    
    const results = {};
    
    // Check tables
    results.tables = await checkTables(sequelize);
    
    // Check creator mappings if table exists
    if (results.tables.tableNames.includes('creator_mappings')) {
      results.mappings = await checkCreatorMappings(sequelize);
    }
    
    // Check designs if table exists
    if (results.tables.tableNames.includes('designs')) {
      results.designs = await checkDesigns(sequelize);
    }
    
    // Check creators if table exists
    if (results.tables.tableNames.includes('creators')) {
      results.creators = await checkCreators(sequelize);
    }
    
    // Diagnose issues
    await diagnoseIssue(results);
    
    console.log('\n✅ Diagnosis completed!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Diagnosis failed:', error.message);
    
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    
    process.exit(1);
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
}

// Handle script interruption gracefully
process.on('SIGINT', () => {
  console.log('\n⚠️ Diagnosis interrupted by user');
  process.exit(1);
});

// Run the script
main();