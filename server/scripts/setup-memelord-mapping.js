#!/usr/bin/env node
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function setupMemelordMapping() {
  try {
    console.log('🔧 Setting up memelord mapping...');
    
    // Import models after environment is loaded
    const { sequelize, CreatorMapping, UserRole } = require('../models');
    
    if (!sequelize) {
      console.error('❌ No database connection available');
      process.exit(1);
    }
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    // Ensure tables exist
    if (CreatorMapping) {
      await CreatorMapping.sync({ alter: false });
      console.log('✅ CreatorMapping table ready');
    } else {
      console.error('❌ CreatorMapping model not available');
      process.exit(1);
    }
    
    // Create the memelord mapping
    const memelordData = {
      sanityPersonId: 'k2r2aa8vmghuyr3he0p2eo5e',
      dynamicId: '31162d55-0da5-4b13-ad7c-3cafd170cebf',
      email: 'whoisjonray@gmail.com',
      sanityName: 'memelord',
      isVerified: true,
      metadata: {
        note: 'Production setup - Jon Ray / memelord',
        createdBy: 'setup-script',
        createdAt: new Date().toISOString()
      }
    };
    
    console.log('📝 Creating mapping for:');
    console.log('   Sanity Person ID:', memelordData.sanityPersonId);
    console.log('   Dynamic ID:', memelordData.dynamicId);
    console.log('   Email:', memelordData.email);
    console.log('   Name:', memelordData.sanityName);
    
    const [mapping, created] = await CreatorMapping.findOrCreate({
      where: { sanityPersonId: memelordData.sanityPersonId },
      defaults: memelordData
    });
    
    if (created) {
      console.log('✅ Created new memelord mapping');
    } else {
      // Update existing
      await mapping.update(memelordData);
      console.log('✅ Updated existing memelord mapping');
    }
    
    // Also ensure user role is admin
    if (UserRole) {
      const [userRole, roleCreated] = await UserRole.findOrCreate({
        where: { dynamicId: memelordData.dynamicId },
        defaults: {
          dynamicId: memelordData.dynamicId,
          email: memelordData.email,
          name: 'Jon Ray',
          role: 'admin'
        }
      });
      
      if (!roleCreated && userRole.role !== 'admin') {
        await userRole.update({ role: 'admin' });
        console.log('✅ Updated user role to admin');
      } else if (roleCreated) {
        console.log('✅ Created admin user role');
      } else {
        console.log('✅ User role already set to admin');
      }
    }
    
    // Verify the mapping
    const verification = await CreatorMapping.findOne({
      where: { dynamicId: memelordData.dynamicId }
    });
    
    if (verification) {
      console.log('\n✅ MAPPING VERIFIED:');
      console.log('   ID:', verification.id);
      console.log('   Sanity Person:', verification.sanityPersonId);
      console.log('   Dynamic User:', verification.dynamicId);
      console.log('   Email:', verification.email);
      console.log('   Last Synced:', verification.lastSyncedAt || 'Never');
    } else {
      console.error('❌ Mapping verification failed');
    }
    
    console.log('\n✅ Setup complete!');
    console.log('You can now import Sanity designs at https://creators.tresr.com');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

// Run the setup
setupMemelordMapping();