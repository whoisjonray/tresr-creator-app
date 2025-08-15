const express = require('express');
const router = express.Router();
const { createClient } = require('@sanity/client');
const { Design, CreatorMapping, UserRole } = require('../../models');
const { requireAdmin, requireAuth } = require('../../middleware/auth');

// Sanity client
const sanityClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID || 'a9vtdosx',
  dataset: process.env.SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
  apiVersion: '2024-01-01'
});

// Convert Sanity bounding box to center-based coordinates
function convertBoundingBoxToCenter(topLeft, bottomRight) {
  if (!topLeft || !bottomRight) {
    // Default position if no bounding box
    return {
      x: 150,
      y: 150,
      width: 150,
      height: 150
    };
  }
  
  const width = bottomRight.x - topLeft.x;
  const height = bottomRight.y - topLeft.y;
  const centerX = topLeft.x + (width / 2);
  const centerY = topLeft.y + (height / 2);
  
  return {
    x: centerX,
    y: centerY,
    width: width,
    height: height
  };
}

// Map a Sanity person to a Dynamic.xyz user
router.post('/map-person', requireAdmin, async (req, res) => {
  try {
    const { sanityPersonId, dynamicId, email } = req.body;
    
    if (!sanityPersonId || !dynamicId || !email) {
      return res.status(400).json({
        error: 'Missing required fields: sanityPersonId, dynamicId, email'
      });
    }
    
    // Fetch person from Sanity
    const person = await sanityClient.fetch(`*[_id == "${sanityPersonId}"][0] {
      _id,
      _type,
      name,
      email,
      username,
      walletAddress,
      wallets[],
      bio,
      isVerified,
      ...
    }`);
    
    if (!person) {
      return res.status(404).json({
        error: 'Person not found in Sanity'
      });
    }
    
    // Create or update mapping
    const [mapping, created] = await CreatorMapping.findOrCreate({
      where: { sanityPersonId },
      defaults: {
        sanityPersonId,
        dynamicId,
        email,
        sanityName: person.name || person.username,
        sanityUsername: person.username,
        sanityWalletAddress: person.walletAddress,
        sanityWallets: person.wallets || [],
        isVerified: true,
        metadata: {
          bio: person.bio,
          originalEmail: person.email
        }
      }
    });
    
    if (!created) {
      // Update existing mapping
      await mapping.update({
        dynamicId,
        email,
        sanityName: person.name || person.username,
        sanityUsername: person.username,
        sanityWalletAddress: person.walletAddress,
        sanityWallets: person.wallets || [],
        isVerified: true
      });
    }
    
    res.json({
      success: true,
      message: created ? 'Mapping created' : 'Mapping updated',
      mapping: mapping
    });
  } catch (error) {
    console.error('Error mapping person:', error);
    res.status(500).json({ error: error.message });
  }
});

// Import designs for current user (simplified endpoint)
router.post('/import-my-designs', requireAuth, async (req, res) => {
  try {
    const dynamicId = req.session.creator.id;
    
    // Find mapping
    const mapping = await CreatorMapping.findOne({
      where: { dynamicId }
    });
    
    if (!mapping) {
      return res.status(404).json({
        error: 'No Sanity mapping found for your account. Please contact admin.'
      });
    }
    
    // Fetch all products/designs from Sanity for this person
    const designs = await sanityClient.fetch(`*[_type == "product" && creator._ref == "${mapping.sanityPersonId}"] {
      _id,
      title,
      "slug": slug.current,
      description,
      creator,
      "images": images[] {
        _key,
        asset-> {
          _id,
          url
        }
      },
      overlayTopLeft,
      overlayBottomRight,
      overlayPosition,
      printArea,
      productStyles[]-> {
        _id,
        name,
        sku,
        garmentType
      },
      tags[],
      isActive,
      publishedAt,
      createdAt,
      ...
    }`);
    
    console.log(`Found ${designs.length} designs for ${mapping.email}`);
    
    const importedDesigns = [];
    const errors = [];
    
    for (const sanityDesign of designs) {
      try {
        // Convert bounding box coordinates
        const frontPosition = convertBoundingBoxToCenter(
          sanityDesign.overlayTopLeft,
          sanityDesign.overlayBottomRight
        );
        
        // Get main image URL
        const mainImage = sanityDesign.images?.[0]?.asset?.url;
        
        // Check if design already exists
        let design = await Design.findOne({
          where: { 
            sanityId: sanityDesign._id,
            creatorId: dynamicId
          }
        });
        
        const designData = {
          sanityId: sanityDesign._id,
          creatorId: dynamicId,
          name: sanityDesign.title,
          description: sanityDesign.description || '',
          thumbnailUrl: mainImage || '',
          frontDesignUrl: mainImage || '',
          backDesignUrl: '', // Will be updated if back image exists
          designData: {
            sanitySlug: sanityDesign.slug,
            tags: sanityDesign.tags || [],
            productStyles: sanityDesign.productStyles || [],
            originalCreator: mapping.sanityName
          },
          frontPosition: frontPosition,
          backPosition: frontPosition, // Same as front by default
          frontScale: 1,
          backScale: 1,
          status: sanityDesign.isActive ? 'published' : 'draft'
        };
        
        if (design) {
          // Update existing design
          await design.update(designData);
          console.log(`Updated design: ${sanityDesign.title}`);
        } else {
          // Create new design
          design = await Design.create(designData);
          console.log(`Created design: ${sanityDesign.title}`);
        }
        
        importedDesigns.push({
          id: design.id,
          name: design.name,
          sanityId: design.sanityId
        });
        
      } catch (designError) {
        console.error(`Error importing design ${sanityDesign.title}:`, designError);
        errors.push({
          design: sanityDesign.title,
          error: designError.message
        });
      }
    }
    
    // Update last synced time
    await mapping.update({
      lastSyncedAt: new Date()
    });
    
    res.json({
      success: true,
      message: `Imported ${importedDesigns.length} designs`,
      imported: importedDesigns,
      errors: errors,
      total: designs.length
    });
    
  } catch (error) {
    console.error('Error importing designs:', error);
    res.status(500).json({ error: error.message });
  }
});

// Import designs for a mapped person (admin endpoint)
router.post('/import-designs/:dynamicId', requireAdmin, async (req, res) => {
  try {
    const { dynamicId } = req.params;
    
    // Find mapping
    const mapping = await CreatorMapping.findOne({
      where: { dynamicId }
    });
    
    if (!mapping) {
      return res.status(404).json({
        error: 'No mapping found for this Dynamic ID. Please map the person first.'
      });
    }
    
    // Fetch all products/designs from Sanity for this person
    const designs = await sanityClient.fetch(`*[_type == "product" && creator._ref == "${mapping.sanityPersonId}"] {
      _id,
      title,
      "slug": slug.current,
      description,
      creator,
      "images": images[] {
        _key,
        asset-> {
          _id,
          url
        }
      },
      overlayTopLeft,
      overlayBottomRight,
      overlayPosition,
      printArea,
      productStyles[]-> {
        _id,
        name,
        sku,
        garmentType
      },
      tags[],
      isActive,
      publishedAt,
      createdAt,
      ...
    }`);
    
    console.log(`Found ${designs.length} designs for ${mapping.email}`);
    
    const importedDesigns = [];
    const errors = [];
    
    for (const sanityDesign of designs) {
      try {
        // Convert bounding box coordinates
        const frontPosition = convertBoundingBoxToCenter(
          sanityDesign.overlayTopLeft,
          sanityDesign.overlayBottomRight
        );
        
        // Get main image URL
        const mainImage = sanityDesign.images?.[0]?.asset?.url;
        
        // Check if design already exists
        let design = await Design.findOne({
          where: { 
            sanityId: sanityDesign._id,
            creatorId: dynamicId
          }
        });
        
        const designData = {
          sanityId: sanityDesign._id,
          creatorId: dynamicId,
          name: sanityDesign.title,
          description: sanityDesign.description || '',
          thumbnailUrl: mainImage || '',
          frontDesignUrl: mainImage || '',
          backDesignUrl: '', // Will be updated if back image exists
          designData: {
            sanitySlug: sanityDesign.slug,
            tags: sanityDesign.tags || [],
            productStyles: sanityDesign.productStyles || [],
            originalCreator: mapping.sanityName
          },
          frontPosition: frontPosition,
          backPosition: frontPosition, // Same as front by default
          frontScale: 1,
          backScale: 1,
          status: sanityDesign.isActive ? 'published' : 'draft'
        };
        
        if (design) {
          // Update existing design
          await design.update(designData);
          console.log(`Updated design: ${sanityDesign.title}`);
        } else {
          // Create new design
          design = await Design.create(designData);
          console.log(`Created design: ${sanityDesign.title}`);
        }
        
        importedDesigns.push({
          id: design.id,
          name: design.name,
          sanityId: design.sanityId
        });
        
      } catch (designError) {
        console.error(`Error importing design ${sanityDesign.title}:`, designError);
        errors.push({
          design: sanityDesign.title,
          error: designError.message
        });
      }
    }
    
    // Update last synced time
    await mapping.update({
      lastSyncedAt: new Date()
    });
    
    res.json({
      success: true,
      message: `Imported ${importedDesigns.length} designs`,
      imported: importedDesigns,
      errors: errors,
      total: designs.length
    });
    
  } catch (error) {
    console.error('Error importing designs:', error);
    res.status(500).json({ error: error.message });
  }
});

// Setup memelord mapping (one-time setup)
router.post('/setup-memelord', requireAdmin, async (req, res) => {
  try {
    // Create mapping for memelord
    const memelordMapping = {
      sanityPersonId: 'k2r2aa8vmghuyr3he0p2eo5e',
      dynamicId: '31162d55-0da5-4b13-ad7c-3cafd170cebf',
      email: 'whoisjonray@gmail.com'
    };
    
    // First, make sure user role exists
    const [userRole] = await UserRole.findOrCreate({
      where: { dynamicId: memelordMapping.dynamicId },
      defaults: {
        dynamicId: memelordMapping.dynamicId,
        email: memelordMapping.email,
        name: 'Jon Ray',
        role: 'admin'
      }
    });
    
    // Map the person
    const mapResponse = await fetch(`http://localhost:${process.env.PORT || 3002}/api/sanity/person/map-person`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': req.headers.cookie // Pass session
      },
      body: JSON.stringify(memelordMapping)
    });
    
    const mapResult = await mapResponse.json();
    
    if (!mapResponse.ok) {
      throw new Error(mapResult.error || 'Failed to map person');
    }
    
    // Import designs
    const importResponse = await fetch(`http://localhost:${process.env.PORT || 3002}/api/sanity/person/import-designs/${memelordMapping.dynamicId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': req.headers.cookie // Pass session
      }
    });
    
    const importResult = await importResponse.json();
    
    res.json({
      success: true,
      mapping: mapResult,
      import: importResult
    });
    
  } catch (error) {
    console.error('Error setting up memelord:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all mappings
router.get('/mappings', requireAdmin, async (req, res) => {
  try {
    const mappings = await CreatorMapping.findAll({
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      mappings: mappings
    });
  } catch (error) {
    console.error('Error fetching mappings:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get designs for current user
router.get('/my-designs', async (req, res) => {
  try {
    if (!req.session.creator) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const designs = await Design.findAll({
      where: { 
        creatorId: req.session.creator.id 
      },
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      designs: designs
    });
  } catch (error) {
    console.error('Error fetching designs:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;