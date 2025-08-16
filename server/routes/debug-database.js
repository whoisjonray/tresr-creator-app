const express = require('express');
const router = express.Router();

// Direct database query to see what's actually in there
router.get('/check-designs', async (req, res) => {
  try {
    const { Sequelize } = require('sequelize');
    
    const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
    
    if (!dbUrl) {
      return res.json({ error: 'No database URL' });
    }
    
    const sequelize = new Sequelize(dbUrl, {
      dialect: 'mysql',
      logging: false
    });
    
    // Raw query to see everything
    const [designs] = await sequelize.query(`
      SELECT id, creator_id, name, status, thumbnail_url, created_at 
      FROM designs 
      ORDER BY created_at DESC 
      LIMIT 20
    `);
    
    // Also check if the logged in user's designs exist
    const creatorId = req.session?.creator?.id;
    let userDesigns = [];
    
    if (creatorId) {
      const [userResults] = await sequelize.query(
        `SELECT id, name, status FROM designs WHERE creator_id = ?`,
        { replacements: [creatorId] }
      );
      userDesigns = userResults;
    }
    
    res.json({
      success: true,
      totalDesigns: designs.length,
      allDesigns: designs,
      userDesigns: userDesigns,
      loggedInUser: {
        id: req.session?.creator?.id,
        email: req.session?.creator?.email
      }
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Database check failed',
      details: error.message
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