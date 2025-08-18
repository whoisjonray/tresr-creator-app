const express = require('express');
const router = express.Router();
const { Sequelize } = require('sequelize');

// Try to load Sanity client, but don't crash if it's not available
let client = null;
try {
  const sanityClient = require('@sanity/client');
  // Initialize Sanity client
  client = sanityClient({
  projectId: process.env.SANITY_PROJECT_ID || 'mdzw81ys',
  dataset: process.env.SANITY_DATASET || 'production',
  apiVersion: '2023-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
  });
} catch (error) {
  console.warn('⚠️ @sanity/client not available, Sanity features disabled');
  console.warn('   This is expected in production if package not installed');
}

// Map Sanity design to get the correct raw design image URLs
async function getDesignImagesFromSanity(sanityDesignId) {
  if (!client) {
    console.error('❌ Sanity client not available');
    return null;
  }
  
  try {
    // Fetch the design from Sanity with all image data
    const query = `*[_type == "product" && _id == $designId][0] {
      _id,
      title,
      "mainImage": mainImage {
        "uri": asset->url,
        "publicId": asset->_ref,
        asset-> {
          _id,
          url,
          metadata {
            dimensions,
            lqip
          }
        }
      },
      "secondaryImages": secondaryImages[] {
        "uri": asset->url,
        "publicId": asset->_ref,
        asset-> {
          _id,
          url,
          metadata {
            dimensions,
            lqip
          }
        }
      },
      "images": images[] {
        _key,
        asset-> {
          _id,
          url,
          metadata
        }
      }
    }`;
    
    const design = await client.fetch(query, { designId: sanityDesignId });
    
    if (!design) {
      console.log(`❌ No design found in Sanity for ID: ${sanityDesignId}`);
      return null;
    }
    
    console.log(`✅ Found design in Sanity: ${design.title}`);
    
    // Extract image URLs
    let frontImageUrl = null;
    let backImageUrl = null;
    
    // Priority 1: Check mainImage.uri (raw design)
    if (design.mainImage?.uri) {
      frontImageUrl = design.mainImage.uri;
      console.log('  Found mainImage.uri:', frontImageUrl);
    }
    // Priority 2: Check mainImage.asset.url
    else if (design.mainImage?.asset?.url) {
      frontImageUrl = design.mainImage.asset.url;
      console.log('  Found mainImage.asset.url:', frontImageUrl);
    }
    // Priority 3: Check first image in images array
    else if (design.images?.[0]?.asset?.url) {
      frontImageUrl = design.images[0].asset.url;
      console.log('  Found images[0].asset.url:', frontImageUrl);
    }
    
    // For back image, check secondaryImages
    if (design.secondaryImages?.[0]?.uri) {
      backImageUrl = design.secondaryImages[0].uri;
      console.log('  Found secondaryImages[0].uri:', backImageUrl);
    } else if (design.secondaryImages?.[0]?.asset?.url) {
      backImageUrl = design.secondaryImages[0].asset.url;
      console.log('  Found secondaryImages[0].asset.url:', backImageUrl);
    } else if (design.images?.[1]?.asset?.url) {
      // Fallback to second image in images array
      backImageUrl = design.images[1].asset.url;
      console.log('  Found images[1].asset.url:', backImageUrl);
    }
    
    // If we still don't have a back image, use the front
    if (!backImageUrl && frontImageUrl) {
      backImageUrl = frontImageUrl;
      console.log('  Using front image for back');
    }
    
    return {
      title: design.title,
      frontImageUrl,
      backImageUrl,
      sanityId: design._id
    };
    
  } catch (error) {
    console.error(`❌ Error fetching design from Sanity:`, error);
    return null;
  }
}

// Fix all designs with correct Sanity images
router.post('/fix-with-sanity-images', async (req, res) => {
  console.log('🚀 Starting Sanity image fix...');
  
  if (!client) {
    return res.status(503).json({
      success: false,
      message: '@sanity/client not available in production',
      hint: 'This feature requires the Sanity client package which is not installed in production'
    });
  }
  
  try {
    const user = req.session.creator || req.session.user;
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Please log in' 
      });
    }

    // Check if Sanity client is configured
    if (!process.env.SANITY_API_TOKEN) {
      console.warn('⚠️ SANITY_API_TOKEN not configured, will try without token');
    }

    // Create direct database connection
    const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('Database URL not configured');
    }

    const sequelize = new Sequelize(dbUrl, {
      dialect: 'mysql',
      logging: false
    });

    // Get all designs with their Sanity IDs
    const [designs] = await sequelize.query(
      `SELECT id, name, sanityId, sanity_design_id, thumbnail_url
       FROM designs 
       WHERE creator_id = :creatorId
       AND (sanityId IS NOT NULL OR sanity_design_id IS NOT NULL)`,
      {
        replacements: { creatorId: user.id }
      }
    );

    console.log(`Found ${designs.length} designs with Sanity IDs`);

    let updatedCount = 0;
    let skippedCount = 0;
    const updates = [];
    
    for (const design of designs) {
      const sanityId = design.sanityId || design.sanity_design_id;
      
      if (!sanityId) {
        console.log(`⏭️ Skipping design ${design.name} - no Sanity ID`);
        skippedCount++;
        continue;
      }
      
      console.log(`\n🔍 Processing: ${design.name} (Sanity: ${sanityId})`);
      
      // Get the correct images from Sanity
      const sanityData = await getDesignImagesFromSanity(sanityId);
      
      if (!sanityData || !sanityData.frontImageUrl) {
        console.log(`⏭️ No images found in Sanity for ${design.name}`);
        skippedCount++;
        continue;
      }
      
      // Create proper design_data structure with the raw design image
      const designData = {
        elements: [
          {
            src: sanityData.frontImageUrl,
            type: 'image',
            width: 400,
            height: 400,
            x: 150,
            y: 100,
            scale: 1
          }
        ],
        canvas: {
          width: 700,
          height: 600
        }
      };
      
      // Update the design with correct Sanity images
      const [updateResult] = await sequelize.query(
        `UPDATE designs 
         SET thumbnail_url = :frontUrl,
             front_design_url = :frontUrl,
             back_design_url = :backUrl,
             design_data = :designData,
             updated_at = NOW()
         WHERE id = :designId`,
        {
          replacements: {
            designId: design.id,
            frontUrl: sanityData.frontImageUrl,
            backUrl: sanityData.backImageUrl,
            designData: JSON.stringify(designData)
          }
        }
      );
      
      if (updateResult > 0) {
        updatedCount++;
        updates.push({
          id: design.id,
          name: design.name,
          frontImage: sanityData.frontImageUrl,
          backImage: sanityData.backImageUrl
        });
        console.log(`  ✅ Updated with Sanity images`);
      }
    }

    // For designs without Sanity IDs, try to match by name
    if (skippedCount > 0) {
      console.log(`\n🔍 Attempting to match ${skippedCount} designs by name...`);
      
      const [designsWithoutSanity] = await sequelize.query(
        `SELECT id, name 
         FROM designs 
         WHERE creator_id = :creatorId
         AND (sanityId IS NULL AND sanity_design_id IS NULL)`,
        {
          replacements: { creatorId: user.id }
        }
      );
      
      for (const design of designsWithoutSanity) {
        // Try to find matching design in Sanity by title
        const query = `*[_type == "product" && title match $title][0]._id`;
        try {
          const sanityId = await client.fetch(query, { title: `*${design.name}*` });
          if (sanityId) {
            console.log(`  📎 Matched "${design.name}" to Sanity ID: ${sanityId}`);
            // Update the design with the Sanity ID for future use
            await sequelize.query(
              `UPDATE designs SET sanityId = :sanityId WHERE id = :designId`,
              {
                replacements: {
                  designId: design.id,
                  sanityId: sanityId
                }
              }
            );
          }
        } catch (e) {
          // Ignore match errors
        }
      }
    }

    await sequelize.close();

    console.log(`\n✅ Successfully updated ${updatedCount} designs with Sanity images`);
    
    res.json({
      success: true,
      message: `Updated ${updatedCount} designs with correct Sanity images`,
      stats: {
        total: designs.length,
        updated: updatedCount,
        skipped: skippedCount
      },
      updates: updates.slice(0, 5) // Show first 5 updates as examples
    });

  } catch (error) {
    console.error('❌ Fix Sanity images error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fix images from Sanity',
      hint: 'Make sure SANITY_API_TOKEN is configured in Railway environment'
    });
  }
});

// Test endpoint to check Sanity connection and fetch a sample design
router.get('/test-sanity-connection', async (req, res) => {
  if (!client) {
    return res.status(503).json({
      success: false,
      message: 'Sanity client not available',
      configured: {
        hasClient: false,
        hasToken: !!process.env.SANITY_API_TOKEN,
        projectId: process.env.SANITY_PROJECT_ID || 'mdzw81ys',
        dataset: process.env.SANITY_DATASET || 'production'
      }
    });
  }
  
  try {
    // Test with a known design ID
    const testId = 'k2r2aa8vmghuyr3he0p2eo5e';
    const sanityData = await getDesignImagesFromSanity(testId);
    
    res.json({
      success: true,
      message: 'Sanity connection working',
      sampleDesign: sanityData,
      configured: {
        hasToken: !!process.env.SANITY_API_TOKEN,
        projectId: process.env.SANITY_PROJECT_ID || 'mdzw81ys',
        dataset: process.env.SANITY_DATASET || 'production'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Sanity connection failed',
      error: error.message,
      hint: 'Check SANITY_API_TOKEN in Railway environment variables'
    });
  }
});

module.exports = router;