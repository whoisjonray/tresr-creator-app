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
    
    // First, let's check if the person exists
    const personQuery = `*[_id == "k2r2aa8vmghuyr3he0p2eo5e"][0] {
      _id,
      _type,
      name,
      username,
      email
    }`;
    
    const person = await sanityClient.fetch(personQuery);
    
    // Check the specific memelord product to see its structure
    const specificProductQuery = `*[_id == "asjpjqvsg84wtk59nl9ywlga"][0] {
      _id,
      title,
      creator,
      creators,
      "creatorRefs": creators[]._ref,
      "creatorDetails": creators[]-> {
        _id,
        name,
        username
      }
    }`;
    
    const specificProduct = await sanityClient.fetch(specificProductQuery);
    
    // Try different ways to find products
    const queries = {
      byCreatorRef: `*[_type == "product" && creator._ref == "k2r2aa8vmghuyr3he0p2eo5e"][0...5] { _id, title, creator }`,
      byCreatorsArray: `*[_type == "product" && "k2r2aa8vmghuyr3he0p2eo5e" in creators[]._ref][0...5] { _id, title, creators }`,
      byReferences: `*[_type == "product" && references("k2r2aa8vmghuyr3he0p2eo5e")][0...5] { _id, title, creators, creator }`,
      anyProduct: `*[_type == "product"][0...5] { _id, title, creator, creators, "hasCreators": defined(creators), "hasCreator": defined(creator) }`,
      byName: `*[_type == "product" && (creator->name == "memelord" || creator->username == "memelord" || "memelord" in creators[]->username)][0...5] { _id, title, creator, creators }`
    };
    
    const results = {};
    for (const [key, query] of Object.entries(queries)) {
      try {
        const data = await sanityClient.fetch(query);
        results[key] = {
          count: data ? data.length : 0,
          sample: data && data.length > 0 ? data[0] : null
        };
      } catch (err) {
        results[key] = { error: err.message };
      }
    }
    
    // Also check what persons exist
    const personsQuery = `*[_type == "person"][0...10] { _id, name, username }`;
    const persons = await sanityClient.fetch(personsQuery);
    
    res.json({
      success: true,
      person: person || 'Person not found',
      specificProduct: specificProduct || 'Product asjpjqvsg84wtk59nl9ywlga not found',
      queryResults: results,
      availablePersons: persons,
      analysis: {
        personExists: !!person,
        personId: 'k2r2aa8vmghuyr3he0p2eo5e',
        totalProductsFound: results.anyProduct?.count || 0,
        memelordProductStructure: specificProduct ? 'See specificProduct field' : 'Could not fetch'
      }
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
router.get('/test-import-hardcoded', async (req, res) => {
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