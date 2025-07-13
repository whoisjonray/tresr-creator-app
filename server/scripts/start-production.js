#!/usr/bin/env node

/**
 * Production startup script that ensures database is ready
 */

async function startProduction() {
  console.log('🚀 Starting production server...');
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Railway Environment:', process.env.RAILWAY_ENVIRONMENT);
  console.log('MySQL URL:', process.env.MYSQL_URL ? 'Set' : 'Not set');
  console.log('MySQL Host:', process.env.MYSQLHOST || 'Not set');
  
  // If no database is configured, just start the server
  if (!process.env.MYSQL_URL && !process.env.MYSQLHOST && process.env.NODE_ENV === 'production') {
    console.log('⚠️ No database configured yet, starting server without database initialization');
    console.log('💡 Add MySQL to your Railway project to enable database features');
    
    // Start server directly
    require('../index.js');
    return;
  }
  
  try {
    // Only initialize database if configured
    const { sequelize } = require('../models');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Sync database models (creates tables if they don't exist)
    await sequelize.sync({ alter: false }); // Don't alter in production
    console.log('✅ Database models synchronized');
    
    // Start the actual server
    require('../index.js');
    
  } catch (error) {
    console.error('⚠️ Database connection failed:', error.message);
    console.log('💡 Starting server without database features');
    
    // Start server anyway
    require('../index.js');
  }
}

startProduction();