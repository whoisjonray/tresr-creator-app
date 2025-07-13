#!/usr/bin/env node

/**
 * Database setup script for TRESR Creator App
 * Run this to create the database and tables
 * 
 * Usage: node server/scripts/setup-database.js
 */

require('dotenv').config({ path: '../../.env' });
const { sequelize } = require('../models');
const fs = require('fs').promises;
const path = require('path');

async function setupDatabase() {
  console.log('🚀 Starting database setup...\n');

  try {
    // Check if using SQLite for local development
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const isSQLite = isDevelopment && !process.env.DB_HOST;
    
    if (!isSQLite) {
      // Only try MySQL if we have host configuration
      const mysql = require('mysql2/promise');
      
      // Create connection without database to create it if needed
      const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'root'
      });

      const dbName = process.env.DB_NAME || 'tresr_creator';

      // Create database if it doesn't exist
      console.log(`📦 Creating database ${dbName} if it doesn't exist...`);
      await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      console.log(`✅ Database ${dbName} ready\n`);

      // Close initial connection
      await connection.end();
    } else {
      console.log('📦 Using SQLite for local development\n');
    }

    // Test Sequelize connection
    console.log('🔌 Testing Sequelize connection...');
    await sequelize.authenticate();
    console.log('✅ Sequelize connected successfully\n');

    // Sync all models (creates tables)
    console.log('📊 Creating tables from models...');
    await sequelize.sync({ alter: true });
    console.log('✅ All tables created/updated successfully\n');

    // Run SQL schema for stored procedures if exists
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    try {
      const schema = await fs.readFile(schemaPath, 'utf8');
      
      // Split by delimiter to handle stored procedures
      const statements = schema.split('DELIMITER $$')
        .filter(s => s.trim())
        .flatMap(s => {
          if (s.includes('DELIMITER ;')) {
            const parts = s.split('DELIMITER ;');
            return [parts[0] + '$$', ...parts[1].split(';').filter(s => s.trim())];
          }
          return s.split(';').filter(s => s.trim());
        });

      console.log('🏗️ Running stored procedures...');
      for (const statement of statements) {
        const trimmed = statement.trim();
        if (trimmed && !trimmed.startsWith('--') && !trimmed.startsWith('DROP')) {
          try {
            await sequelize.query(trimmed);
          } catch (err) {
            // Ignore errors for procedures that might already exist
            if (!err.message.includes('already exists')) {
              console.warn(`⚠️ Warning: ${err.message}`);
            }
          }
        }
      }
      console.log('✅ Stored procedures created\n');
    } catch (err) {
      console.log('ℹ️ No schema.sql file found or error reading it\n');
    }

    // Create test data in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🧪 Creating test data...');
      
      const { Creator } = require('../models');
      
      const [testCreator, created] = await Creator.findOrCreate({
        where: { email: 'test@tresr.com' },
        defaults: {
          id: 'test-creator-1',
          name: 'Test Creator',
          email: 'test@tresr.com'
        }
      });

      if (created) {
        console.log('✅ Test creator created');
      } else {
        console.log('ℹ️ Test creator already exists');
      }
    }

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\nDatabase configuration:');
    if (isSQLite) {
      console.log(`  Type: SQLite (local development)`);
      console.log(`  File: ../database/tresr_creator.sqlite`);
    } else {
      console.log(`  Type: MySQL`);
      console.log(`  Host: ${process.env.DB_HOST || 'localhost'}`);
      console.log(`  Port: ${process.env.DB_PORT || 3306}`);
      console.log(`  Database: ${process.env.DB_NAME || 'tresr_creator'}`);
      console.log(`  User: ${process.env.DB_USER || 'root'}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Database setup failed:', error);
    process.exit(1);
  }
}

// Run setup
setupDatabase();