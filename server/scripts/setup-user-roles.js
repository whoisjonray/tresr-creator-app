#!/usr/bin/env node
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { sequelize, UserRole } = require('../models');

async function setupUserRoles() {
  try {
    console.log('🔧 Setting up user roles table...');
    
    // Create the table
    await UserRole.sync({ alter: true });
    console.log('✅ User roles table created/updated');
    
    // Add initial admin users
    const adminUsers = [
      {
        dynamicId: '31162d55-0da5-4b13-ad7c-3cafd170cebf',
        email: 'whoisjonray@gmail.com',
        role: 'admin',
        name: 'Jon Ray'
      },
      {
        dynamicId: 'admin-tresr-001', // Placeholder - update with real ID when available
        email: 'admin@tresr.com',
        role: 'admin',
        name: 'TRESR Admin'
      },
      {
        dynamicId: 'admin-nft-001', // Placeholder - update with real ID when available
        email: 'nftreasure@gmail.com',
        role: 'admin',
        name: 'NFT Admin'
      }
    ];
    
    for (const adminUser of adminUsers) {
      try {
        const [user, created] = await UserRole.findOrCreate({
          where: { email: adminUser.email },
          defaults: adminUser
        });
        
        if (created) {
          console.log(`✅ Created admin user: ${adminUser.email}`);
        } else {
          // Update existing user to admin if needed
          if (user.role !== 'admin') {
            await user.update({ role: 'admin' });
            console.log(`✅ Updated ${adminUser.email} to admin role`);
          } else {
            console.log(`ℹ️  Admin user already exists: ${adminUser.email}`);
          }
        }
      } catch (error) {
        console.error(`❌ Error processing ${adminUser.email}:`, error.message);
      }
    }
    
    console.log('\n📊 User roles summary:');
    const adminCount = await UserRole.count({ where: { role: 'admin' } });
    const creatorCount = await UserRole.count({ where: { role: 'creator' } });
    console.log(`  Admins: ${adminCount}`);
    console.log(`  Creators: ${creatorCount}`);
    
    console.log('\n✅ User roles setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

setupUserRoles();