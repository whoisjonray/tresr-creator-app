const express = require('express');
const router = express.Router();
const { Sequelize } = require('sequelize');

// Fix the scale calculation for all designs
router.post('/fix-scale-for-design/:designId', async (req, res) => {
  console.log('🔧 Fixing scale calculation for design:', req.params.designId);
  
  try {
    const { designId } = req.params;
    const user = req.session.creator || req.session.user;
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Please log in' 
      });
    }

    const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('Database URL not configured');
    }

    const sequelize = new Sequelize(dbUrl, {
      dialect: 'mysql',
      logging: false
    });

    // Get the design
    const [designs] = await sequelize.query(
      `SELECT * FROM designs WHERE id = :designId AND creator_id = :creatorId`,
      {
        replacements: { 
          designId,
          creatorId: user.id 
        }
      }
    );

    if (designs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Design not found'
      });
    }

    const design = designs[0];
    
    // Parse design_data to get image dimensions
    let designData = {};
    try {
      designData = JSON.parse(design.design_data || '{}');
    } catch (e) {
      console.log('Could not parse design_data');
    }

    // For a 1890x2362 image, the correct scale for print area should be around 15-20%
    // But the UI multiplies by 10, so we need to set it to 100 (which displays as 100%)
    // This makes 100% = the size that fits the print area, not the actual image size
    
    const CORRECT_SCALE = '100'; // This will display as 100% in the UI
    
    // Update the scale in database
    await sequelize.query(
      `UPDATE designs 
       SET frontScale = :scale,
           backScale = :scale,
           updated_at = NOW()
       WHERE id = :designId AND creator_id = :creatorId`,
      {
        replacements: {
          scale: CORRECT_SCALE,
          designId,
          creatorId: user.id
        }
      }
    );

    // Also update design_data if it exists
    if (designData.elements && designData.elements[0]) {
      // Set scale to 0.15 (15% of actual size) which fits the print area
      designData.elements[0].scale = 0.15;
      designData.elements[0].width = 280; // Print area width
      designData.elements[0].height = 350; // Print area height
      
      await sequelize.query(
        `UPDATE designs 
         SET design_data = :designData
         WHERE id = :designId AND creator_id = :creatorId`,
        {
          replacements: {
            designData: JSON.stringify(designData),
            designId,
            creatorId: user.id
          }
        }
      );
    }

    await sequelize.close();

    res.json({
      success: true,
      message: 'Scale fixed successfully',
      scale: CORRECT_SCALE,
      designData: designData
    });

  } catch (error) {
    console.error('❌ Fix scale error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get proper scale calculation
router.get('/calculate-proper-scale', (req, res) => {
  const { imageWidth, imageHeight, canvasWidth = 600, canvasHeight = 600 } = req.query;
  
  if (!imageWidth || !imageHeight) {
    return res.status(400).json({
      success: false,
      message: 'Image dimensions required'
    });
  }

  const imgW = parseInt(imageWidth);
  const imgH = parseInt(imageHeight);
  const canvW = parseInt(canvasWidth);
  const canvH = parseInt(canvasHeight);
  
  // Print area is roughly 280x350 pixels on a 600x600 canvas
  const printAreaWidth = 280;
  const printAreaHeight = 350;
  
  // Calculate scale to fit print area
  const scaleX = printAreaWidth / imgW;
  const scaleY = printAreaHeight / imgH;
  const properScale = Math.min(scaleX, scaleY);
  
  // Convert to percentage
  const scalePercentage = properScale * 100;
  
  res.json({
    success: true,
    imageSize: { width: imgW, height: imgH },
    canvasSize: { width: canvW, height: canvH },
    printArea: { width: printAreaWidth, height: printAreaHeight },
    properScale: properScale,
    scalePercentage: scalePercentage.toFixed(1) + '%',
    explanation: `A ${imgW}x${imgH} image needs to be scaled to ${scalePercentage.toFixed(1)}% to fit the ${printAreaWidth}x${printAreaHeight} print area`
  });
});

module.exports = router;