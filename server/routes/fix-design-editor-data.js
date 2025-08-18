const express = require('express');
const router = express.Router();
const { Sequelize } = require('sequelize');

// FIX: Update all designs to have proper design_data structure for canvas loading
router.post('/fix-all-design-data', async (req, res) => {
  console.log('🔧 Fixing all design data structures for canvas compatibility...');
  
  try {
    const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('Database URL not configured');
    }

    const sequelize = new Sequelize(dbUrl, {
      dialect: 'mysql',
      logging: false
    });

    // Get all designs that need fixing
    const [designs] = await sequelize.query(
      `SELECT id, title, thumbnail_url, front_design_url, design_data 
       FROM designs 
       WHERE design_data IS NULL OR design_data = '' OR design_data = '{}'`
    );

    console.log(`Found ${designs.length} designs needing design_data updates`);
    
    let fixedCount = 0;
    
    for (const design of designs) {
      // Determine the best image URL
      const imageUrl = design.front_design_url || design.thumbnail_url;
      
      if (imageUrl) {
        // Create proper design_data structure
        const designData = {
          elements: [
            {
              src: imageUrl,
              type: 'image',
              width: 400,
              height: 400,
              x: 150,  // Center in 700px canvas
              y: 100,  // Center in 600px canvas
              scale: 1,
              rotation: 0
            }
          ],
          canvas: {
            width: 700,
            height: 600
          },
          metadata: {
            fixedAt: new Date().toISOString(),
            fixedBy: 'design-editor-fix'
          }
        };

        // Update the design
        await sequelize.query(
          `UPDATE designs 
           SET design_data = :designData,
               updated_at = NOW()
           WHERE id = :designId`,
          {
            replacements: {
              designId: design.id,
              designData: JSON.stringify(designData)
            }
          }
        );

        fixedCount++;
        console.log(`✅ Fixed design ${design.id}: ${design.title}`);
      } else {
        console.log(`⚠️ Skipped design ${design.id} - no image URL available`);
      }
    }

    await sequelize.close();

    console.log(`✅ Fixed ${fixedCount} designs with proper design_data structure`);
    
    res.json({
      success: true,
      message: `Fixed ${fixedCount} designs with proper design_data structure`,
      details: {
        totalFound: designs.length,
        fixed: fixedCount,
        skipped: designs.length - fixedCount
      }
    });

  } catch (error) {
    console.error('❌ Fix design data error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fix design data'
    });
  }
});

// FIX: Normalize field names (camelCase to snake_case consistency) 
router.post('/normalize-field-names', async (req, res) => {
  console.log('🔧 Normalizing design field names...');
  
  try {
    const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('Database URL not configured');
    }

    const sequelize = new Sequelize(dbUrl, {
      dialect: 'mysql',
      logging: false
    });

    // Update camelCase fields to match snake_case (database standard)
    const [updateResult] = await sequelize.query(
      `UPDATE designs 
       SET front_design_url = COALESCE(front_design_url, frontDesignUrl),
           back_design_url = COALESCE(back_design_url, backDesignUrl),
           front_design_public_id = COALESCE(front_design_public_id, frontDesignPublicId),
           back_design_public_id = COALESCE(back_design_public_id, backDesignPublicId)
       WHERE frontDesignUrl IS NOT NULL 
          OR backDesignUrl IS NOT NULL 
          OR frontDesignPublicId IS NOT NULL 
          OR backDesignPublicId IS NOT NULL`
    );

    await sequelize.close();

    console.log('✅ Normalized field names');
    
    res.json({
      success: true,
      message: 'Normalized field names to snake_case consistency',
      affectedRows: updateResult.affectedRows
    });

  } catch (error) {
    console.error('❌ Normalize field names error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to normalize field names'
    });
  }
});

// TEST: Get specific design data for debugging
router.get('/test-design/:id', async (req, res) => {
  console.log('🧪 Testing design data loading:', req.params.id);
  
  try {
    const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('Database URL not configured');
    }

    const sequelize = new Sequelize(dbUrl, {
      dialect: 'mysql',
      logging: false
    });

    const [designs] = await sequelize.query(
      `SELECT * FROM designs WHERE id = :designId LIMIT 1`,
      {
        replacements: { designId: req.params.id }
      }
    );

    await sequelize.close();

    if (designs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Design not found'
      });
    }

    const design = designs[0];
    
    // Parse design_data
    let parsedDesignData = null;
    if (design.design_data) {
      try {
        parsedDesignData = typeof design.design_data === 'string' 
          ? JSON.parse(design.design_data) 
          : design.design_data;
      } catch (e) {
        console.error('Failed to parse design_data:', e);
      }
    }

    // Test image URL resolution
    const testUrl = getTestDesignImageUrl(design, parsedDesignData);
    
    res.json({
      success: true,
      design: {
        id: design.id,
        title: design.title,
        thumbnail_url: design.thumbnail_url,
        front_design_url: design.front_design_url,
        design_data: parsedDesignData,
        resolved_image_url: testUrl
      },
      analysis: {
        has_thumbnail: !!design.thumbnail_url,
        has_front_design_url: !!design.front_design_url,
        has_design_data: !!design.design_data,
        design_data_valid: !!parsedDesignData,
        has_elements: !!(parsedDesignData?.elements?.length),
        first_element_src: parsedDesignData?.elements?.[0]?.src || null
      }
    });

  } catch (error) {
    console.error('❌ Test design error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to test design'
    });
  }
});

// Helper function (matches frontend logic)
function getTestDesignImageUrl(designData, parsedDesignData) {
  // Priority 1: front_design_url
  if (designData.front_design_url) {
    return designData.front_design_url;
  }
  
  // Priority 2: First element in design_data
  if (parsedDesignData?.elements?.[0]?.src) {
    return parsedDesignData.elements[0].src;
  }
  
  // Priority 3: thumbnail_url
  if (designData.thumbnail_url) {
    return designData.thumbnail_url;
  }
  
  return null;
}

module.exports = router;