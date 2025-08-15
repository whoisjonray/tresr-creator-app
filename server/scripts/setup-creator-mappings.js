#!/usr/bin/env node
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { sequelize, CreatorMapping, UserRole } = require('../models');

async function setupCreatorMappings() {
  try {
    console.log('🔧 Setting up creator mappings table...');
    
    // Create the table
    await CreatorMapping.sync({ alter: true });
    console.log('✅ Creator mappings table created/updated');
    
    // Set up memelord mapping
    console.log('\n🎭 Setting up memelord (Jon Ray) mapping...');
    
    const memelordData = {
      sanityPersonId: 'k2r2aa8vmghuyr3he0p2eo5e',
      dynamicId: '31162d55-0da5-4b13-ad7c-3cafd170cebf',
      email: 'whoisjonray@gmail.com',
      sanityName: 'memelord',
      isVerified: true,
      metadata: {
        note: 'Initial setup - Jon Ray / memelord'
      }
    };
    
    const [mapping, created] = await CreatorMapping.findOrCreate({
      where: { sanityPersonId: memelordData.sanityPersonId },
      defaults: memelordData
    });
    
    if (created) {
      console.log('✅ Created memelord mapping');
    } else {
      // Update if exists
      await mapping.update(memelordData);
      console.log('✅ Updated memelord mapping');
    }
    
    // Show all mappings
    console.log('\n📊 Current creator mappings:');
    const allMappings = await CreatorMapping.findAll();
    
    for (const map of allMappings) {
      console.log(`  ${map.sanityName || 'Unknown'} (${map.email})`);
      console.log(`    Sanity ID: ${map.sanityPersonId}`);
      console.log(`    Dynamic ID: ${map.dynamicId}`);
      console.log(`    Last Synced: ${map.lastSyncedAt || 'Never'}`);
    }
    
    console.log('\n✅ Creator mappings setup complete!');
    console.log('\n📝 Next steps:');
    console.log('1. Log in as whoisjonray@gmail.com at https://creators.tresr.com');
    console.log('2. Go to Admin > Import from Sanity (or use the API)');
    console.log('3. Your designs will be imported with proper bounding boxes');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

setupCreatorMappings();