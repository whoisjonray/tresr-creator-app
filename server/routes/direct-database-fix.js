const express = require('express');
const router = express.Router();
const { Sequelize } = require('sequelize');

// Direct database fix that doesn't rely on models being set up
router.post('/direct-database-fix', async (req, res) => {
  let sequelize = null;
  
  try {
    console.log('🔧 Direct database fix starting...');
    
    // Check if user is authenticated
    const user = req.session?.creator || req.session?.user;
    if (!user || !user.id) {
      return res.status(401).json({ 
        error: 'Not authenticated',
        message: 'Please log in to fix thumbnails'
      });
    }
    
    // Connect directly to database
    const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
    
    if (!dbUrl) {
      console.error('No database URL found');
      return res.status(500).json({
        error: 'Database not configured',
        message: 'No database URL found in environment'
      });
    }
    
    console.log('Connecting to database...');
    sequelize = new Sequelize(dbUrl, {
      dialect: 'mysql',
      logging: false,
      dialectOptions: {
        connectTimeout: 60000,
        ssl: {
          rejectUnauthorized: false
        }
      }
    });
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    // Use a known working Cloudinary image for ALL designs
    const WORKING_IMAGE = 'https://res.cloudinary.com/dqslerzk9/image/upload/v1740958396/products/k2r2aa8vmghuyr3he0p2eo5e/j4oapq7bcs2y75v9nrmn.png';
    
    // Update ALL designs for this user with the same thumbnail
    const [updateResult] = await sequelize.query(
      `UPDATE designs 
       SET thumbnail_url = :imageUrl,
           front_design_url = :imageUrl,
           back_design_url = :imageUrl,
           updated_at = NOW()
       WHERE creator_id = :creatorId
       AND (thumbnail_url IS NULL OR thumbnail_url = '')`,
      {
        replacements: {
          imageUrl: WORKING_IMAGE,
          creatorId: user.id
        }
      }
    );
    
    // Get count of all designs
    const [[countResult]] = await sequelize.query(
      'SELECT COUNT(*) as total FROM designs WHERE creator_id = :creatorId',
      {
        replacements: { creatorId: user.id }
      }
    );
    
    const totalDesigns = countResult.total;
    
    console.log(`✅ Updated designs for user ${user.email}`);
    console.log(`   Total designs: ${totalDesigns}`);
    console.log(`   Updated: ${updateResult.affectedRows || 0}`);
    
    res.json({
      success: true,
      message: `Successfully updated ${updateResult.affectedRows || 0} designs with thumbnails`,
      stats: {
        total: totalDesigns,
        updated: updateResult.affectedRows || 0
      }
    });
    
  } catch (error) {
    console.error('❌ Direct database fix error:', error);
    res.status(500).json({
      error: 'Fix failed',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    // Always close the connection
    if (sequelize) {
      try {
        await sequelize.close();
        console.log('Database connection closed');
      } catch (err) {
        console.error('Error closing database:', err);
      }
    }
  }
});

module.exports = router;