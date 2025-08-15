#!/usr/bin/env node
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { sequelize, Design, CreatorMapping } = require('../models');

async function migrate() {
  try {
    console.log('🔧 Running database migration...');
    
    // Sync Design model to add new fields
    console.log('📦 Adding new fields to Design table...');
    await Design.sync({ alter: true });
    console.log('✅ Design table updated');
    
    // Create CreatorMapping table
    console.log('📦 Creating CreatorMapping table...');
    await CreatorMapping.sync({ force: false });
    console.log('✅ CreatorMapping table ready');
    
    // Add memelord mapping
    console.log('🎭 Setting up memelord mapping...');
    const [mapping, created] = await CreatorMapping.findOrCreate({
      where: { sanityPersonId: 'k2r2aa8vmghuyr3he0p2eo5e' },
      defaults: {
        sanityPersonId: 'k2r2aa8vmghuyr3he0p2eo5e',
        dynamicId: '31162d55-0da5-4b13-ad7c-3cafd170cebf',
        email: 'whoisjonray@gmail.com',
        sanityName: 'memelord',
        isVerified: true,
        metadata: {
          note: 'Initial setup - Jon Ray / memelord'
        }
      }
    });
    
    if (created) {
      console.log('✅ Created memelord mapping');
    } else {
      console.log('✅ Memelord mapping already exists');
    }
    
    console.log('\n✅ Migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();