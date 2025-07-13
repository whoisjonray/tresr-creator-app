#!/usr/bin/env node

/**
 * Production startup script that ensures database is ready
 */

async function startProduction() {
  console.log('🚀 Starting production server...');
  console.log('📅 Deployment time:', new Date().toISOString());
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Railway Environment:', process.env.RAILWAY_ENVIRONMENT);
  
  // Check for various MySQL environment variable formats
  console.log('\n🔍 Checking for MySQL environment variables:');
  console.log('MYSQL_URL:', process.env.MYSQL_URL ? 'Set ✅' : 'Not set ❌');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set ✅' : 'Not set ❌');
  console.log('MYSQLHOST:', process.env.MYSQLHOST || 'Not set ❌');
  console.log('MYSQL_HOST:', process.env.MYSQL_HOST || 'Not set ❌');
  console.log('MYSQLDATABASE:', process.env.MYSQLDATABASE || 'Not set ❌');
  console.log('MYSQL_DATABASE:', process.env.MYSQL_DATABASE || 'Not set ❌');
  
  // List all env vars starting with MYSQL or DATABASE
  console.log('\n📋 All database-related environment variables:');
  Object.keys(process.env).forEach(key => {
    if (key.includes('MYSQL') || key.includes('DATABASE') || key.includes('DB_')) {
      console.log(`${key}: ${key.includes('PASSWORD') ? '***' : (process.env[key] ? 'Set' : 'Not set')}`);
    }
  });
  
  // If no database is configured, just start the server
  if (!process.env.MYSQL_URL && !process.env.DATABASE_URL && !process.env.MYSQLHOST && process.env.NODE_ENV === 'production') {
    console.log('\n⚠️ No database configured yet, starting server without database initialization');
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