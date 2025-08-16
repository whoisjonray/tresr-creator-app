const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// IMPORT ALL 151 MEMELORD DESIGNS RIGHT NOW
router.post('/import-all-memelord', async (req, res) => {
  try {
    console.log('🚀 IMPORTING ALL MEMELORD DESIGNS NOW');
    
    // Check auth
    if (req.session?.creator?.email !== 'whoisjonray@gmail.com') {
      return res.status(403).json({ error: 'Admin only' });
    }
    
    const creatorId = req.session.creator.id;
    
    // Get ALL memelord designs from Sanity
    const { createClient } = require('@sanity/client');
    const sanityClient = createClient({
      projectId: 'a9vtdosx',
      dataset: 'production',
      useCdn: false,
      apiVersion: '2024-01-01'
    });
    
    console.log('📋 Fetching ALL memelord designs from Sanity...');
    const designs = await sanityClient.fetch(`
      *[_type == "product" && "k2r2aa8vmghuyr3he0p2eo5e" in creators[]._ref] {
        _id,
        title,
        description,
        "slug": slug.current,
        "images": images[] {
          asset-> {
            url
          }
        },
        overlayTopLeft,
        overlayBottomRight
      }
    `);
    
    console.log(`✅ Found ${designs.length} designs in Sanity`);
    
    // Connect to database
    const { Sequelize } = require('sequelize');
    const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
    
    if (!dbUrl) {
      return res.status(500).json({ error: 'No database URL' });
    }
    
    const sequelize = new Sequelize(dbUrl, {
      dialect: 'mysql',
      logging: false
    });
    
    // Clear existing memelord designs
    console.log('🗑️ Clearing old designs...');
    await sequelize.query(
      'DELETE FROM designs WHERE creator_id = :creatorId',
      { replacements: { creatorId } }
    );
    
    // Import each design
    const imported = [];
    console.log('💾 Importing designs to database...');
    
    for (const design of designs) {
      try {
        const id = uuidv4();
        const imageUrl = design.images?.[0]?.asset?.url || '';
        
        // Convert bounding box if exists
        let frontPosition = { x: 150, y: 150, width: 150, height: 150 };
        if (design.overlayTopLeft && design.overlayBottomRight) {
          const width = design.overlayBottomRight.x - design.overlayTopLeft.x;
          const height = design.overlayBottomRight.y - design.overlayTopLeft.y;
          frontPosition = {
            x: design.overlayTopLeft.x + (width / 2),
            y: design.overlayTopLeft.y + (height / 2),
            width: width,
            height: height
          };
        }
        
        await sequelize.query(
          `INSERT INTO designs (
            id, creator_id, sanity_id, name, description,
            status, thumbnail_url, front_design_url,
            front_position, back_position,
            created_at, updated_at
          ) VALUES (
            :id, :creatorId, :sanityId, :name, :description,
            'published', :imageUrl, :imageUrl,
            :frontPosition, :frontPosition,
            NOW(), NOW()
          )`,
          {
            replacements: {
              id,
              creatorId,
              sanityId: design._id,
              name: design.title || 'Untitled',
              description: design.description || '',
              imageUrl,
              frontPosition: JSON.stringify(frontPosition)
            }
          }
        );
        
        imported.push({
          id,
          name: design.title,
          imageUrl
        });
        
      } catch (err) {
        console.error(`Failed to import ${design.title}:`, err.message);
      }
    }
    
    console.log(`✅ Successfully imported ${imported.length} designs`);
    
    // Get all designs to return
    const [allDesigns] = await sequelize.query(
      'SELECT * FROM designs WHERE creator_id = :creatorId ORDER BY created_at DESC',
      { replacements: { creatorId } }
    );
    
    await sequelize.close();
    
    res.json({
      success: true,
      message: `Imported ${imported.length} of ${designs.length} designs`,
      imported: imported.length,
      total: designs.length,
      designs: allDesigns
    });
    
  } catch (error) {
    console.error('Import all failed:', error);
    res.status(500).json({
      error: 'Import failed',
      message: error.message
    });
  }
});

module.exports = router;