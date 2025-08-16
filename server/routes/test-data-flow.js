const express = require('express');
const router = express.Router();
const { Sequelize } = require('sequelize');
const path = require('path');

// TEST ENDPOINT: Verify data flow without authentication
router.get('/check-designs-no-auth/:creatorId', async (req, res) => {
  try {
    const { creatorId } = req.params;
    
    console.log(`🧪 TEST: Checking designs for creator ${creatorId} (no auth)`);
    
    // Connect to SQLite database directly
    const sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: path.join(__dirname, '../database/tresr_creator.sqlite'),
      logging: false
    });
    
    // Query designs directly
    const [designs] = await sequelize.query(
      'SELECT id, name, status, front_design_url, created_at FROM designs WHERE creator_id = ? ORDER BY created_at DESC',
      {
        replacements: [creatorId]
      }
    );
    
    await sequelize.close();
    
    console.log(`✅ Found ${designs.length} designs for creator ${creatorId}`);
    
    res.json({
      success: true,
      designs: designs,
      count: designs.length,
      message: `Found ${designs.length} designs (test endpoint)`
    });
    
  } catch (error) {
    console.error('❌ Test endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      designs: []
    });
  }
});

// TEST ENDPOINT: Check Sanity import status
router.get('/check-sanity-import', async (req, res) => {
  try {
    console.log('🧪 TEST: Checking Sanity import status');
    
    const sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: path.join(__dirname, '../database/tresr_creator.sqlite'),
      logging: false
    });
    
    // Get all designs
    const [allDesigns] = await sequelize.query('SELECT creator_id, COUNT(*) as count FROM designs GROUP BY creator_id');
    
    // Get recent imports
    const [recentDesigns] = await sequelize.query(
      'SELECT id, name, creator_id, sanity_id, created_at FROM designs WHERE sanity_id IS NOT NULL ORDER BY created_at DESC LIMIT 10'
    );
    
    await sequelize.close();
    
    res.json({
      success: true,
      summary: {
        totalDesigns: allDesigns.reduce((sum, item) => sum + item.count, 0),
        designsByCreator: allDesigns,
        recentImports: recentDesigns.length,
        lastImportTime: recentDesigns[0]?.created_at || 'Never'
      },
      recentDesigns: recentDesigns
    });
    
  } catch (error) {
    console.error('❌ Sanity check error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;