const express = require('express');
const router = express.Router();
const { createClient } = require('@sanity/client');

// Debug endpoint to test Sanity connection
router.get('/test-sanity', async (req, res) => {
  try {
    const sanityClient = createClient({
      projectId: process.env.SANITY_PROJECT_ID || 'a9vtdosx',
      dataset: process.env.SANITY_DATASET || 'production',
      token: process.env.SANITY_API_TOKEN,
      useCdn: true,
      apiVersion: '2024-01-01'
    });
    
    // Test with memelord
    const sanityPersonId = 'k2r2aa8vmghuyr3he0p2eo5e';
    
    const query = `*[_type == "product" && (references("${sanityPersonId}") || "${sanityPersonId}" in creators[]._ref)] {
      _id,
      title
    }`;
    
    const designs = await sanityClient.fetch(query);
    
    res.json({
      success: true,
      config: {
        projectId: process.env.SANITY_PROJECT_ID || 'a9vtdosx',
        dataset: process.env.SANITY_DATASET || 'production',
        tokenConfigured: !!process.env.SANITY_API_TOKEN,
        tokenLength: process.env.SANITY_API_TOKEN ? process.env.SANITY_API_TOKEN.length : 0
      },
      testQuery: {
        personId: sanityPersonId,
        designsFound: designs.length,
        firstThree: designs.slice(0, 3).map(d => d.title)
      }
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
});

// Debug import for specific user
router.post('/test-import', async (req, res) => {
  try {
    const dynamicId = req.body.dynamicId || '31162d55-0da5-4b13-ad7c-3cafd170cebf'; // memelord default
    
    // Get models
    const models = require('../models');
    const { CreatorMapping, Design, sequelize } = models;
    
    // Find mapping
    const mapping = await CreatorMapping.findOne({
      where: { dynamicId }
    });
    
    if (!mapping) {
      return res.json({
        error: 'No mapping found',
        dynamicId,
        searchedIn: 'creator_mappings table'
      });
    }

    // Ensure creator exists in creators table (for foreign key constraint)
    console.log('🔍 Checking if creator exists in creators table...');
    const { Creator } = models;
    
    let existingCreator = await Creator.findByPk(dynamicId);
    let creatorWasCreated = false;

    if (!existingCreator) {
      console.log('📝 Creating creator record in creators table...');
      existingCreator = await Creator.create({
        id: dynamicId,
        email: mapping.email,
        name: mapping.sanityName || 'Unknown Creator',
        walletAddress: mapping.sanityWalletAddress || null,
        isActive: true
      });
      creatorWasCreated = true;
      console.log('✅ Creator record created successfully');
    } else {
      console.log('✅ Creator already exists in creators table');
    }
    
    // Fetch from Sanity
    const sanityClient = createClient({
      projectId: process.env.SANITY_PROJECT_ID || 'a9vtdosx',
      dataset: process.env.SANITY_DATASET || 'production',
      token: process.env.SANITY_API_TOKEN,
      useCdn: true,
      apiVersion: '2024-01-01'
    });
    
    const query = `*[_type == "product" && (references("${mapping.sanityPersonId}") || "${mapping.sanityPersonId}" in creators[]._ref)] {
      _id,
      title,
      "slug": slug.current,
      description,
      "images": images[] {
        _key,
        asset-> {
          _id,
          url
        }
      }
    }`;
    
    const designs = await sanityClient.fetch(query);
    
    console.log(`📦 Sanity fetch results: Found ${designs.length} designs for creator ${mapping.sanityPersonId}`);
    if (designs.length > 0) {
      console.log('📦 First design sample:', {
        id: designs[0]._id,
        title: designs[0].title,
        hasImages: !!designs[0].images?.length
      });
    }
    
    // Import first 5 as test
    const imported = [];
    let updatedCount = 0;
    let createdCount = 0;
    
    for (const design of designs.slice(0, 5)) {
      // Check if already exists
      const existingDesign = await Design.findOne({
        where: {
          sanityId: design._id,
          creatorId: dynamicId
        }
      });
      
      // Prepare design data for upsert
      const designData = {
        sanityId: design._id,
        creatorId: dynamicId,
        name: design.title,
        description: design.description || '',
        thumbnailUrl: design.images?.[0]?.asset?.url || '',
        frontDesignUrl: design.images?.[0]?.asset?.url || '',
        backDesignUrl: '',
        tags: [design.slug],
        frontPosition: { x: 150, y: 150, width: 150, height: 150 },
        backPosition: { x: 150, y: 150, width: 150, height: 150 },
        frontScale: 1,
        backScale: 1,
        status: 'draft'
      };
      
      if (existingDesign) {
        // Update existing design
        console.log('📝 Updating existing design:', design.title);
        await existingDesign.update(designData);
        imported.push(`${design.title} (updated)`);
        updatedCount++;
      } else {
        // Create new design
        console.log('🔧 Creating new design:', design.title);
        const newDesign = await Design.create(designData);
        imported.push(`${newDesign.name} (created)`);
        createdCount++;
      }
    }
    
    res.json({
      success: true,
      creatorStatus: {
        dynamicId,
        creatorExisted: !creatorWasCreated,
        creatorCreated: creatorWasCreated
      },
      mapping: {
        dynamicId: mapping.dynamicId,
        sanityPersonId: mapping.sanityPersonId,
        email: mapping.email,
        name: mapping.sanityName
      },
      sanityResults: {
        totalFound: designs.length,
        processed: imported.length,
        created: createdCount,
        updated: updatedCount,
        importedTitles: imported
      }
    });
    
  } catch (error) {
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
});

module.exports = router;