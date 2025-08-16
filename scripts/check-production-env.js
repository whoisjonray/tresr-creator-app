#!/usr/bin/env node
/**
 * Production Environment Check
 * 
 * This script verifies that all required environment variables
 * are properly configured for production deployment.
 */

const path = require('path');
const fs = require('fs');

console.log('🔍 Checking production environment configuration...\n');

// Check if .env.production exists
const envProdPath = path.join(__dirname, '../.env.production');
if (!fs.existsSync(envProdPath)) {
  console.error('❌ .env.production file not found');
  console.log('Expected location:', envProdPath);
  process.exit(1);
}

// Load production environment
require('dotenv').config({ path: envProdPath });

// Required environment variables
const requiredVars = [
  'NODE_ENV',
  'MYSQL_URL',
  'SHOPIFY_APP_URL',
  'DYNAMIC_AUTH_URL'
];

// Optional but recommended
const optionalVars = [
  'DATABASE_URL',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'SANITY_PROJECT_ID',
  'SANITY_DATASET'
];

console.log('✅ .env.production file found\n');

// Check required variables
console.log('📋 Required Environment Variables:');
console.log('===================================');

let missingRequired = [];
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    // Mask sensitive values
    let displayValue = value;
    if (varName.includes('URL') && value.includes('@')) {
      displayValue = value.replace(/\/\/.*:.*@/, '//***:***@');
    }
    console.log(`✅ ${varName}: ${displayValue}`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
    missingRequired.push(varName);
  }
});

// Check optional variables
console.log('\n📋 Optional Environment Variables:');
console.log('==================================');

let missingOptional = [];
optionalVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    // Mask sensitive values
    let displayValue = value;
    if (varName.includes('SECRET') || varName.includes('KEY')) {
      displayValue = value.substring(0, 4) + '***';
    }
    console.log(`✅ ${varName}: ${displayValue}`);
  } else {
    console.log(`⚠️ ${varName}: NOT SET`);
    missingOptional.push(varName);
  }
});

// Summary
console.log('\n📊 Configuration Summary:');
console.log('=========================');

if (missingRequired.length === 0) {
  console.log('✅ All required environment variables are configured');
} else {
  console.log(`❌ Missing ${missingRequired.length} required variables: ${missingRequired.join(', ')}`);
}

if (missingOptional.length === 0) {
  console.log('✅ All optional environment variables are configured');
} else {
  console.log(`⚠️ Missing ${missingOptional.length} optional variables: ${missingOptional.join(', ')}`);
}

// Database URL validation
console.log('\n🔌 Database Connection Check:');
console.log('=============================');

const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
if (dbUrl) {
  try {
    const url = new URL(dbUrl);
    console.log(`✅ Database URL format valid`);
    console.log(`   Protocol: ${url.protocol}`);
    console.log(`   Host: ${url.hostname}`);
    console.log(`   Port: ${url.port || 'default'}`);
    console.log(`   Database: ${url.pathname.substring(1)}`);
    console.log(`   Username: ${url.username}`);
  } catch (error) {
    console.log(`❌ Database URL format invalid: ${error.message}`);
  }
} else {
  console.log('❌ No database URL configured');
}

// Recommendations
console.log('\n💡 Recommendations:');
console.log('===================');

if (missingRequired.length > 0) {
  console.log('1. Add missing required environment variables to .env.production');
  console.log('2. Ensure DATABASE_URL points to your production MySQL database');
  console.log('3. Verify SHOPIFY_APP_URL and DYNAMIC_AUTH_URL are correct');
}

if (missingOptional.includes('CLOUDINARY_CLOUD_NAME')) {
  console.log('4. Add Cloudinary credentials for image uploads');
}

if (missingOptional.includes('SANITY_PROJECT_ID')) {
  console.log('5. Add Sanity credentials for design imports');
}

console.log('\n🚀 Ready to run production scripts:');
console.log('====================================');

if (missingRequired.length === 0) {
  console.log('✅ Environment is ready for production scripts');
  console.log('   Run: ./scripts/fix-production-creator-mappings.sh');
} else {
  console.log('❌ Fix missing environment variables before running production scripts');
}

process.exit(missingRequired.length === 0 ? 0 : 1);