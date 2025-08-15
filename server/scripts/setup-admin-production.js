#!/usr/bin/env node
/**
 * Production script to set up admin users
 * Run this AFTER deployment to add admin roles
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Force production environment
process.env.NODE_ENV = 'production';

const { sequelize, UserRole } = require('../models');

async function setupAdminUsers() {
  try {
    console.log('🔧 Setting up admin users in production...');
    
    // Check if we have a database connection
    if (!sequelize) {
      console.error('❌ No database connection available');
      process.exit(1);
    }
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Ensure table exists
    await UserRole.sync({ alter: true });
    console.log('✅ User roles table ready');
    
    // Add/Update Jon Ray as admin with correct Dynamic ID
    const jonRayUser = {
      dynamicId: '31162d55-0da5-4b13-ad7c-3cafd170cebf',
      email: 'whoisjonray@gmail.com',
      role: 'admin',
      name: 'Jon Ray'
    };
    
    try {
      // First try to find by email
      let user = await UserRole.findOne({
        where: { email: jonRayUser.email }
      });
      
      if (user) {
        // Update existing user to admin with correct Dynamic ID
        await user.update({
          dynamicId: jonRayUser.dynamicId,
          role: 'admin',
          name: jonRayUser.name
        });
        console.log(`✅ Updated ${jonRayUser.email} to admin role with correct Dynamic ID`);
      } else {
        // Create new admin user
        await UserRole.create(jonRayUser);
        console.log(`✅ Created admin user: ${jonRayUser.email}`);
      }
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        // Dynamic ID might exist with different email, update it
        console.log('⚠️  Dynamic ID conflict, attempting to resolve...');
        
        // Find by Dynamic ID
        const existingUser = await UserRole.findOne({
          where: { dynamicId: jonRayUser.dynamicId }
        });
        
        if (existingUser) {
          await existingUser.update({
            email: jonRayUser.email,
            role: 'admin',
            name: jonRayUser.name
          });
          console.log(`✅ Updated existing user to admin: ${jonRayUser.email}`);
        }
      } else {
        console.error(`❌ Error processing ${jonRayUser.email}:`, error.message);
      }
    }
    
    // Add other admin users if needed
    const otherAdmins = [
      {
        dynamicId: 'admin-tresr-' + Date.now(), // Temporary ID
        email: 'admin@tresr.com',
        role: 'admin',
        name: 'TRESR Admin'
      },
      {
        dynamicId: 'admin-nft-' + Date.now(), // Temporary ID
        email: 'nftreasure@gmail.com',
        role: 'admin',
        name: 'NFT Admin'
      }
    ];
    
    for (const admin of otherAdmins) {
      try {
        const [user, created] = await UserRole.findOrCreate({
          where: { email: admin.email },
          defaults: admin
        });
        
        if (created) {
          console.log(`✅ Created admin user: ${admin.email}`);
        } else if (user.role !== 'admin') {
          await user.update({ role: 'admin' });
          console.log(`✅ Updated ${admin.email} to admin role`);
        } else {
          console.log(`ℹ️  Admin user already exists: ${admin.email}`);
        }
      } catch (error) {
        console.log(`⚠️  Skipping ${admin.email}: ${error.message}`);
      }
    }
    
    // Show summary
    console.log('\n📊 User roles summary:');
    const adminCount = await UserRole.count({ where: { role: 'admin' } });
    const creatorCount = await UserRole.count({ where: { role: 'creator' } });
    console.log(`  Admins: ${adminCount}`);
    console.log(`  Creators: ${creatorCount}`);
    
    // List all admins
    const allAdmins = await UserRole.findAll({
      where: { role: 'admin' },
      attributes: ['email', 'dynamicId', 'name']
    });
    
    console.log('\n👑 Admin users:');
    allAdmins.forEach(admin => {
      console.log(`  - ${admin.email} (${admin.name || 'No name'}) [${admin.dynamicId}]`);
    });
    
    console.log('\n✅ Admin setup complete!');
    console.log('🔄 Please log out and log back in to see admin features.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

// Run immediately
setupAdminUsers();