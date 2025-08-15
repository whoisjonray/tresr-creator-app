const express = require('express');
const router = express.Router();
const { createClient } = require('@sanity/client');

// Direct test endpoint - no auth, no models, just Sanity
router.get('/test-sanity-fetch', async (req, res) => {
  try {
    // Sanity client
    const sanityClient = createClient({
      projectId: 'a9vtdosx',
      dataset: 'production',
      useCdn: true,
      apiVersion: '2024-01-01'
    });
    
    // Fetch designs for memelord
    const query = `*[_type == "product" && creator._ref == "k2r2aa8vmghuyr3he0p2eo5e"] {
      _id,
      title,
      "slug": slug.current,
      description,
      "images": images[] {
        asset-> {
          url
        }
      }
    }[0...5]`; // Limit to 5 for testing
    
    const designs = await sanityClient.fetch(query);
    
    res.json({
      success: true,
      message: `Found ${designs.length} designs from Sanity`,
      designs: designs.map(d => ({
        id: d._id,
        title: d.title,
        slug: d.slug,
        hasImages: !!(d.images && d.images.length > 0)
      }))
    });
  } catch (error) {
    res.status(500).json({
      error: 'Sanity fetch failed',
      details: error.message
    });
  }
});

// Test database directly
router.get('/test-database', async (req, res) => {
  try {
    const { sequelize } = require('../models');
    
    if (!sequelize) {
      return res.json({ error: 'No database connection' });
    }
    
    // Run raw query
    const [results] = await sequelize.query('SELECT * FROM creator_mappings');
    
    res.json({
      success: true,
      mappings: results,
      count: results.length
    });
  } catch (error) {
    res.status(500).json({
      error: 'Database query failed',
      details: error.message
    });
  }
});

// Test import with hardcoded values
router.post('/test-import-hardcoded', async (req, res) => {
  try {
    // Get models directly
    const path = require('path');
    require('dotenv').config({ path: path.join(__dirname, '../../.env') });
    
    const { Sequelize, DataTypes } = require('sequelize');
    const sequelize = new Sequelize(process.env.MYSQL_URL || process.env.DATABASE_URL, {
      dialect: 'mysql',
      logging: false
    });
    
    // Define CreatorMapping inline
    const CreatorMapping = sequelize.define('CreatorMapping', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      sanityPersonId: {
        type: DataTypes.STRING,
        field: 'sanity_person_id'
      },
      dynamicId: {
        type: DataTypes.STRING,
        field: 'dynamic_id'
      },
      email: {
        type: DataTypes.STRING
      }
    }, {
      tableName: 'creator_mappings',
      timestamps: false
    });
    
    // Try to find mapping
    const mapping = await CreatorMapping.findOne({
      where: { 
        dynamicId: '31162d55-0da5-4b13-ad7c-3cafd170cebf' 
      }
    });
    
    res.json({
      success: true,
      mappingFound: !!mapping,
      mapping: mapping ? {
        id: mapping.id,
        sanityPersonId: mapping.sanityPersonId,
        dynamicId: mapping.dynamicId,
        email: mapping.email
      } : null
    });
  } catch (error) {
    res.status(500).json({
      error: 'Test failed',
      details: error.message,
      stack: error.stack
    });
  }
});

module.exports = router;