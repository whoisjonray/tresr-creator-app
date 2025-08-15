const express = require('express');
const router = express.Router();

// Super simple test - just check if we can reach this endpoint
router.get('/ping', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Endpoint is working',
    session: req.session?.creator ? 'Has session' : 'No session'
  });
});

// Test Sanity fetch only
router.get('/test-sanity-only', async (req, res) => {
  try {
    const { createClient } = require('@sanity/client');
    
    const sanityClient = createClient({
      projectId: 'a9vtdosx',
      dataset: 'production',
      useCdn: true,
      apiVersion: '2024-01-01'
    });
    
    // Just count products
    const count = await sanityClient.fetch(`count(*[_type == "product" && "k2r2aa8vmghuyr3he0p2eo5e" in creators[]._ref])`);
    
    res.json({
      success: true,
      count: count,
      message: `Found ${count} memelord products in Sanity`
    });
  } catch (error) {
    res.status(500).json({
      error: 'Sanity test failed',
      details: error.message
    });
  }
});

// Test database only
router.get('/test-db-only', async (req, res) => {
  try {
    const { Sequelize } = require('sequelize');
    
    const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
    
    if (!dbUrl) {
      return res.json({ error: 'No database URL found in environment' });
    }
    
    const sequelize = new Sequelize(dbUrl, {
      dialect: 'mysql',
      logging: false
    });
    
    await sequelize.authenticate();
    
    // Try to query
    const [results] = await sequelize.query('SELECT 1 as test');
    
    res.json({
      success: true,
      message: 'Database connection works',
      test: results
    });
  } catch (error) {
    res.status(500).json({
      error: 'Database test failed',
      details: error.message
    });
  }
});

// Minimal import - just one design, no loops
router.post('/import-one', async (req, res) => {
  try {
    // Check session
    if (!req.session?.creator?.email) {
      return res.status(401).json({ error: 'Not logged in' });
    }
    
    if (req.session.creator.email !== 'whoisjonray@gmail.com') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    // Get one design from Sanity
    const { createClient } = require('@sanity/client');
    const sanityClient = createClient({
      projectId: 'a9vtdosx',
      dataset: 'production',
      useCdn: true,
      apiVersion: '2024-01-01'
    });
    
    const designs = await sanityClient.fetch(`
      *[_type == "product" && "k2r2aa8vmghuyr3he0p2eo5e" in creators[]._ref][0...1] {
        _id,
        title,
        description
      }
    `);
    
    if (!designs || designs.length === 0) {
      return res.json({ 
        success: false, 
        message: 'No designs found in Sanity' 
      });
    }
    
    const design = designs[0];
    
    // Try to save to database
    const { Sequelize } = require('sequelize');
    const { v4: uuidv4 } = require('uuid');
    
    const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
    if (!dbUrl) {
      return res.json({ 
        success: false, 
        message: 'No database URL',
        design: design 
      });
    }
    
    const sequelize = new Sequelize(dbUrl, {
      dialect: 'mysql',
      logging: false
    });
    
    // Create table if needed
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS test_imports (
        id VARCHAR(36) PRIMARY KEY,
        sanity_id VARCHAR(255),
        title VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(() => {});
    
    // Insert the one design
    const id = uuidv4();
    await sequelize.query(
      'INSERT INTO test_imports (id, sanity_id, title) VALUES (?, ?, ?)',
      {
        replacements: [id, design._id, design.title]
      }
    );
    
    res.json({
      success: true,
      message: 'Imported one design successfully',
      design: {
        id: id,
        sanityId: design._id,
        title: design.title
      }
    });
    
  } catch (error) {
    console.error('Import one failed:', error);
    res.status(500).json({
      error: 'Import failed',
      details: error.message,
      stack: error.stack.split('\n').slice(0, 5)
    });
  }
});

module.exports = router;