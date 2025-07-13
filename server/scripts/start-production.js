#!/usr/bin/env node

/**
 * Production startup script that ensures database is ready
 */

const { sequelize } = require('../models');

async function startProduction() {
  console.log('🚀 Starting production server...');
  
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Sync database models (creates tables if they don't exist)
    await sequelize.sync({ alter: false }); // Don't alter in production
    console.log('✅ Database models synchronized');
    
    // Start the actual server
    require('../index.js');
    
  } catch (error) {
    console.error('❌ Failed to start production server:', error);
    process.exit(1);
  }
}

startProduction();