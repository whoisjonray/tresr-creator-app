const express = require('express');
const router = express.Router();

// Direct database query to see what's actually in there
router.get('/check-designs', async (req, res) => {
  try {
    const { Sequelize } = require('sequelize');
    
    const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
    
    if (!dbUrl) {
      return res.json({ 
        error: 'No database URL',
        env: {
          hasMysqlUrl: !!process.env.MYSQL_URL,
          hasDatabaseUrl: !!process.env.DATABASE_URL
        }
      });
    }
    
    console.log('🔍 Debug check-designs called');
    console.log('   DB URL type:', dbUrl.includes('mysql') ? 'MySQL' : 'Unknown');
    console.log('   Session user:', req.session?.creator?.email);
    
    const sequelize = new Sequelize(dbUrl, {
      dialect: 'mysql',
      logging: console.log  // Enable logging to see queries
    });
    
    // Test connection first
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Raw query to see everything
    let designs = [];
    try {
      const result = await sequelize.query(`
        SELECT id, creator_id, name, status, thumbnail_url, created_at 
        FROM designs 
        ORDER BY created_at DESC 
        LIMIT 20
      `);
      designs = result[0];
      console.log(`✅ Found ${designs.length} total designs`);
    } catch (queryError) {
      console.error('❌ Query error:', queryError);
      designs = [];
    }
    
    // Also check if the logged in user's designs exist
    const creatorId = req.session?.creator?.id;
    let userDesigns = [];
    
    if (creatorId) {
      try {
        const [userResults] = await sequelize.query(
          `SELECT id, name, status, created_at FROM designs WHERE creator_id = ?`,
          { replacements: [creatorId] }
        );
        userDesigns = userResults;
        console.log(`✅ Found ${userDesigns.length} designs for user ${creatorId}`);
      } catch (userError) {
        console.error('❌ User query error:', userError);
      }
    }
    
    // Close connection
    await sequelize.close();
    
    res.json({
      success: true,
      totalDesigns: designs.length,
      allDesigns: designs,
      userDesigns: userDesigns,
      loggedInUser: {
        id: req.session?.creator?.id,
        email: req.session?.creator?.email
      },
      databaseInfo: {
        connected: true,
        dialect: 'mysql'
      }
    });
    
  } catch (error) {
    console.error('❌ Database check failed:', error);
    res.json({
      success: false,
      error: 'Database check failed',
      details: error.message,
      stack: error.stack?.split('\n').slice(0, 5)
    });
  }
});

// Check what the /api/designs endpoint is actually returning
router.get('/check-api-designs', async (req, res) => {
  try {
    const databaseService = require('../services/database');
    
    if (!req.session?.creator) {
      return res.json({ error: 'Not logged in' });
    }
    
    const result = await databaseService.getCreatorDesigns(req.session.creator.id, {
      page: 1,
      limit: 20
    });
    
    res.json({
      success: true,
      serviceResult: result,
      sessionUser: req.session.creator
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Service check failed',
      details: error.message
    });
  }
});

module.exports = router;