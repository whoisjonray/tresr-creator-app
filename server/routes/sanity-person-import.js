const express = require('express');
const router = express.Router();
const { createClient } = require('@sanity/client');
const { requireAuth } = require('../middleware/auth');

// Initialize Sanity client
const sanityClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID || 'a9vtdosx',
  dataset: process.env.SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
  apiVersion: '2024-01-01'
});

// Import designs for authenticated user (temporary bypass for testing)
router.post('/import-my-designs-no-auth', async (req, res) => {
  try {
    console.log('🚀 Starting import (no auth) for test user');
    
    // Use hardcoded test user for now
    const user = {
      id: '31162d55-0da5-4b13-ad7c-3cafd170cebf',
      email: 'test@tresr.ai',
      name: 'Test User'
    };
    
    // Get database models
    const models = req.app.get('models');
    const { CreatorMapping, Design, Creator } = models;
    
    // Find creator mapping
    const mapping = await CreatorMapping.findOne({
      where: { dynamicId: user.id }
    });
    
    if (!mapping) {
      console.log('❌ No mapping found for user:', user.id);
      return res.status(404).json({ 
        error: 'No Sanity mapping found',
        message: 'Please contact admin to set up your account mapping.'
      });
    }
    
    console.log('✅ Found mapping:', {
      dynamicId: mapping.dynamicId,
      sanityPersonId: mapping.sanityPersonId,
      email: mapping.email
    });
    
    // Ensure creator exists in creators table
    let creator = await Creator.findByPk(user.id);
    if (!creator) {
      console.log('📝 Creating creator record...');
      creator = await Creator.create({
        id: user.id,
        email: user.email || mapping.email,
        name: user.name || mapping.sanityName || 'Unknown Creator',
        isActive: true
      });
    }
    
    // Fetch designs from Sanity
    const query = `*[_type == "product" && (
      references("${mapping.sanityPersonId}") || 
      "${mapping.sanityPersonId}" in creators[]._ref ||
      creator._ref == "${mapping.sanityPersonId}"
    )] {
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
      },
      overlayTopLeft,
      overlayBottomRight,
      printAreaTopLeft,
      printAreaBottomRight,
      isActive,
      tags,
      productStyles,
      sales,
      views
    }`;
    
    console.log('🔍 Fetching designs from Sanity...');
    const sanityDesigns = await sanityClient.fetch(query);
    console.log(`📦 Found ${sanityDesigns.length} designs in Sanity`);
    
    // Import designs
    let imported = 0;
    let updated = 0;
    let errors = [];
    
    for (const sanityDesign of sanityDesigns) {
      try {
        // Convert bounding box to center position if needed
        let frontPosition = { x: 150, y: 150, width: 150, height: 150 };
        if (sanityDesign.overlayTopLeft && sanityDesign.overlayBottomRight) {
          const width = sanityDesign.overlayBottomRight.x - sanityDesign.overlayTopLeft.x;
          const height = sanityDesign.overlayBottomRight.y - sanityDesign.overlayTopLeft.y;
          frontPosition = {
            x: sanityDesign.overlayTopLeft.x + width / 2,
            y: sanityDesign.overlayTopLeft.y + height / 2,
            width,
            height
          };
        }
        
        const designData = {
          sanityId: sanityDesign._id,
          creatorId: user.id,
          name: sanityDesign.title || 'Untitled Design',
          description: sanityDesign.description || '',
          thumbnailUrl: sanityDesign.images?.[0]?.asset?.url || '',
          frontDesignUrl: sanityDesign.images?.[0]?.asset?.url || '',
          backDesignUrl: sanityDesign.images?.[1]?.asset?.url || '',
          tags: sanityDesign.tags || [],
          frontPosition: frontPosition,
          backPosition: { x: 150, y: 150, width: 150, height: 150 },
          frontScale: 1,
          backScale: 1,
          status: sanityDesign.isActive ? 'published' : 'draft',
          designData: {
            productStyles: sanityDesign.productStyles,
            sales: sanityDesign.sales || 0,
            views: sanityDesign.views || 0,
            slug: sanityDesign.slug
          }
        };
        
        // Check if design exists
        const existingDesign = await Design.findOne({
          where: {
            sanityId: sanityDesign._id,
            creatorId: user.id
          }
        });
        
        if (existingDesign) {
          // Update existing design
          await existingDesign.update(designData);
          updated++;
        } else {
          // Create new design
          await Design.create(designData);
          imported++;
        }
        
      } catch (error) {
        console.error(`❌ Error importing design ${sanityDesign.title}:`, error.message);
        errors.push({
          design: sanityDesign.title,
          error: error.message
        });
      }
    }
    
    console.log(`✅ Import complete: ${imported} new, ${updated} updated, ${errors.length} errors`);
    
    // Return success response
    res.json({
      success: true,
      message: `Successfully imported ${imported + updated} designs`,
      stats: {
        totalFound: sanityDesigns.length,
        imported,
        updated,
        errors: errors.length
      },
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    console.error('❌ Import error:', error);
    res.status(500).json({
      error: 'Import failed',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Import designs for authenticated user
router.post('/import-my-designs', requireAuth, async (req, res) => {
  try {
    // Handle both old (.user) and new (.creator) session formats
    const user = req.session.creator || req.session.user || req.user;
    console.log('🚀 Starting import for user:', user?.email);
    console.log('Session debug:', {
      hasCreator: !!req.session?.creator,
      hasUser: !!req.session?.user,
      hasReqUser: !!req.user,
      sessionKeys: Object.keys(req.session || {})
    });
    
    if (!user || !user.id) {
      return res.status(401).json({ 
        error: 'Not authenticated',
        message: 'Please log in to import designs'
      });
    }
    
    // Get database models
    const models = req.app.get('models');
    const { CreatorMapping, Design, Creator } = models;
    
    // Find creator mapping
    const mapping = await CreatorMapping.findOne({
      where: { dynamicId: user.id }
    });
    
    if (!mapping) {
      console.log('❌ No mapping found for user:', user.id);
      return res.status(404).json({ 
        error: 'No Sanity mapping found',
        message: 'Please contact admin to set up your account mapping.'
      });
    }
    
    console.log('✅ Found mapping:', {
      dynamicId: mapping.dynamicId,
      sanityPersonId: mapping.sanityPersonId,
      email: mapping.email
    });
    
    // Ensure creator exists in creators table
    let creator = await Creator.findByPk(user.id);
    if (!creator) {
      console.log('📝 Creating creator record...');
      creator = await Creator.create({
        id: user.id,
        email: user.email || mapping.email,
        name: user.name || mapping.sanityName || 'Unknown Creator',
        isActive: true
      });
    }
    
    // Fetch designs from Sanity
    const query = `*[_type == "product" && (
      references("${mapping.sanityPersonId}") || 
      "${mapping.sanityPersonId}" in creators[]._ref ||
      creator._ref == "${mapping.sanityPersonId}"
    )] {
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
      },
      overlayTopLeft,
      overlayBottomRight,
      printAreaTopLeft,
      printAreaBottomRight,
      isActive,
      tags,
      productStyles,
      sales,
      views
    }`;
    
    console.log('🔍 Fetching designs from Sanity...');
    const sanityDesigns = await sanityClient.fetch(query);
    console.log(`📦 Found ${sanityDesigns.length} designs in Sanity`);
    
    // Import designs
    let imported = 0;
    let updated = 0;
    let errors = [];
    
    for (const sanityDesign of sanityDesigns) {
      try {
        // Convert bounding box to center position if needed
        let frontPosition = { x: 150, y: 150, width: 150, height: 150 };
        if (sanityDesign.overlayTopLeft && sanityDesign.overlayBottomRight) {
          const width = sanityDesign.overlayBottomRight.x - sanityDesign.overlayTopLeft.x;
          const height = sanityDesign.overlayBottomRight.y - sanityDesign.overlayTopLeft.y;
          frontPosition = {
            x: sanityDesign.overlayTopLeft.x + width / 2,
            y: sanityDesign.overlayTopLeft.y + height / 2,
            width,
            height
          };
        }
        
        const designData = {
          sanityId: sanityDesign._id,
          creatorId: user.id,
          name: sanityDesign.title || 'Untitled Design',
          description: sanityDesign.description || '',
          thumbnailUrl: sanityDesign.images?.[0]?.asset?.url || '',
          frontDesignUrl: sanityDesign.images?.[0]?.asset?.url || '',
          backDesignUrl: sanityDesign.images?.[1]?.asset?.url || '',
          tags: sanityDesign.tags || [],
          frontPosition: frontPosition,
          backPosition: { x: 150, y: 150, width: 150, height: 150 },
          frontScale: 1,
          backScale: 1,
          status: sanityDesign.isActive ? 'published' : 'draft',
          designData: {
            productStyles: sanityDesign.productStyles,
            sales: sanityDesign.sales || 0,
            views: sanityDesign.views || 0,
            slug: sanityDesign.slug
          }
        };
        
        // Check if design exists
        const existingDesign = await Design.findOne({
          where: {
            sanityId: sanityDesign._id,
            creatorId: user.id
          }
        });
        
        if (existingDesign) {
          // Update existing design
          await existingDesign.update(designData);
          updated++;
        } else {
          // Create new design
          await Design.create(designData);
          imported++;
        }
        
      } catch (error) {
        console.error(`❌ Error importing design ${sanityDesign.title}:`, error.message);
        errors.push({
          design: sanityDesign.title,
          error: error.message
        });
      }
    }
    
    console.log(`✅ Import complete: ${imported} new, ${updated} updated, ${errors.length} errors`);
    
    // Return success response
    res.json({
      success: true,
      message: `Successfully imported ${imported + updated} designs`,
      stats: {
        totalFound: sanityDesigns.length,
        imported,
        updated,
        errors: errors.length
      },
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    console.error('❌ Import error:', error);
    res.status(500).json({
      error: 'Import failed',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;