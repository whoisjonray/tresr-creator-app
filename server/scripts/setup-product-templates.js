#!/usr/bin/env node
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { sequelize, ProductTemplate } = require('../models');
const defaultTemplates = require('../config/defaultProductTemplates');

async function setupProductTemplates() {
  try {
    console.log('📦 Setting up product templates table...');
    
    // Ensure database connection
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    // Sync the ProductTemplate model (create table if doesn't exist)
    await ProductTemplate.sync({ alter: true });
    console.log('✅ Product templates table ready');
    
    // Check if we need to seed default templates
    const existingCount = await ProductTemplate.count();
    
    if (existingCount === 0) {
      console.log('📝 Seeding default templates...');
      
      // Insert default templates
      for (const template of defaultTemplates) {
        try {
          await ProductTemplate.create({
            ...template,
            isCustom: false,
            createdBy: 'system'
          });
          console.log(`  ✅ Added: ${template.name}`);
        } catch (error) {
          if (error.name === 'SequelizeUniqueConstraintError') {
            console.log(`  ⏭️ Skipped (exists): ${template.name}`);
          } else {
            console.error(`  ❌ Error adding ${template.name}:`, error.message);
          }
        }
      }
      
      console.log('✅ Default templates seeded');
    } else {
      console.log(`ℹ️ Templates already exist (${existingCount} found)`);
      
      // Ensure all default templates exist
      for (const template of defaultTemplates) {
        const existing = await ProductTemplate.findByPk(template.id);
        if (!existing) {
          await ProductTemplate.create({
            ...template,
            isCustom: false,
            createdBy: 'system'
          });
          console.log(`  ✅ Added missing default: ${template.name}`);
        }
      }
    }
    
    // List all templates
    const allTemplates = await ProductTemplate.findAll({
      attributes: ['id', 'name', 'category', 'isCustom'],
      order: [['category', 'ASC'], ['name', 'ASC']]
    });
    
    console.log('\n📋 Current templates:');
    allTemplates.forEach(t => {
      console.log(`  - ${t.name} (${t.category}) ${t.isCustom ? '[CUSTOM]' : ''}`);
    });
    
    console.log('\n✅ Product templates setup complete!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error setting up product templates:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  setupProductTemplates();
}

module.exports = setupProductTemplates;