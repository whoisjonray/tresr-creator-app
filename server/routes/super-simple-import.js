const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// Super simple import - minimal dependencies
router.post('/import-one-minimal', async (req, res) => {
  try {
    console.log('🚀 Super simple import started');
    
    // Check auth
    if (!req.session?.creator?.id) {
      return res.status(401).json({ error: 'Not logged in' });
    }
    
    const creatorId = req.session.creator.id;
    const userEmail = req.session.creator.email;
    
    console.log('👤 User:', userEmail, 'ID:', creatorId);
    
    // Only for admin
    if (userEmail !== 'whoisjonray@gmail.com') {
      return res.status(403).json({ error: 'Admin only' });
    }
    
    // Create a test design directly
    const { Sequelize } = require('sequelize');
    const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
    
    if (!dbUrl) {
      return res.status(500).json({ error: 'No database URL' });
    }
    
    const sequelize = new Sequelize(dbUrl, {
      dialect: 'mysql',
      logging: console.log
    });
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    // Create a simple test design
    const designId = uuidv4();
    const testDesign = {
      id: designId,
      creator_id: creatorId,
      name: `Test Import ${new Date().toISOString().slice(0, 10)}`,
      description: 'Imported from Sanity',
      status: 'published',
      thumbnail_url: 'https://cdn.sanity.io/images/a9vtdosx/production/d89c3dc5e1c456f039ff01c5bb491bb087e026e9-1890x2362.png',
      front_design_url: 'https://cdn.sanity.io/images/a9vtdosx/production/d89c3dc5e1c456f039ff01c5bb491bb087e026e9-1890x2362.png'
    };
    
    console.log('💾 Inserting test design:', testDesign.name);
    
    // Insert using raw SQL
    await sequelize.query(
      `INSERT INTO designs (
        id, creator_id, name, description, status, 
        thumbnail_url, front_design_url, created_at, updated_at
      ) VALUES (
        :id, :creator_id, :name, :description, :status,
        :thumbnail_url, :front_design_url, NOW(), NOW()
      )`,
      {
        replacements: testDesign
      }
    );
    
    console.log('✅ Design inserted successfully');
    
    // Verify it was inserted
    const [verify] = await sequelize.query(
      'SELECT id, name, creator_id FROM designs WHERE id = :id',
      { replacements: { id: designId } }
    );
    
    console.log('🔍 Verification:', verify);
    
    // Close connection
    await sequelize.close();
    
    res.json({
      success: true,
      message: 'Test design imported successfully',
      design: testDesign,
      verification: verify[0]
    });
    
  } catch (error) {
    console.error('❌ Super simple import failed:', error);
    res.status(500).json({
      error: 'Import failed',
      message: error.message,
      type: error.constructor.name
    });
  }
});

// Get all designs for debugging
router.get('/list-all-designs', async (req, res) => {
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
    
    // Get ALL designs
    const [allDesigns] = await sequelize.query(
      'SELECT id, creator_id, name, status, created_at FROM designs ORDER BY created_at DESC'
    );
    
    // Group by creator
    const byCreator = {};
    for (const design of allDesigns) {
      if (!byCreator[design.creator_id]) {
        byCreator[design.creator_id] = [];
      }
      byCreator[design.creator_id].push(design);
    }
    
    await sequelize.close();
    
    res.json({
      success: true,
      totalDesigns: allDesigns.length,
      designs: allDesigns,
      byCreator: byCreator,
      currentUser: req.session?.creator
    });
    
  } catch (error) {
    console.error('List all designs failed:', error);
    res.json({
      error: 'Failed to list designs',
      message: error.message
    });
  }
});

module.exports = router;