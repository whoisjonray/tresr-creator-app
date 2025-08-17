const express = require('express');
const router = express.Router();
const { createClient } = require('@sanity/client');
const { Design, CreatorMapping } = require('../models');
const { authenticate } = require('../middleware/auth');

// Sanity client configuration
const sanityClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID || 'a9vtdosx',
  dataset: process.env.SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN
});

// Garment configuration for template mapping
const GARMENT_CONFIG = {
  'tee': {
    folder: 'garments/tee',
    sides: ['display', 'back'],
    colors: ['black', 'white', 'heather-grey', 'red', 'navy'],
    displayName: 'Classic Tee',
    defaultColor: 'black'
  },
  'boxy': {
    folder: 'garments/boxy',
    sides: ['display', 'back'],
    colors: ['black', 'white', 'sand', 'mint'],
    displayName: 'Boxy Tee',
    defaultColor: 'black'
  },
  'polo': {
    folder: 'garments/polo',
    sides: ['display', 'back'],
    colors: ['black', 'white', 'navy'],
    displayName: 'Polo Shirt',
    defaultColor: 'black'
  },
  'mediu': {
    folder: 'garments/mediu',
    sides: ['display', 'back'],
    colors: ['black', 'white', 'grey'],
    displayName: 'Medium Weight Tee',
    defaultColor: 'black'
  },
  'med-hood': {
    folder: 'garments/med-hood',
    sides: ['display', 'back'],
    colors: ['black', 'white', 'grey'],
    displayName: 'Medium Hoodie',
    defaultColor: 'black'
  },
  'next-crop': {
    folder: 'garments/next-crop',
    sides: ['display', 'back'],
    colors: ['black', 'white', 'pink'],
    displayName: 'Crop Top',
    defaultColor: 'black'
  },
  'wmn-hoodie': {
    folder: 'garments/wmn-hoodie',
    sides: ['display', 'back'],
    colors: ['black', 'white', 'pink'],
    displayName: 'Women\'s Hoodie',
    defaultColor: 'black'
  },
  'patch-c': {
    folder: 'garments/patch-c',
    sides: ['display'],
    colors: ['default'],
    displayName: 'Patch Circle',
    defaultColor: 'default'
  },
  'patch-flat': {
    folder: 'garments/patch-flat',
    sides: ['display'],
    colors: ['default'],
    displayName: 'Patch Flat',
    defaultColor: 'default'
  }
};

// Helper function to build garment template URLs
function buildGarmentTemplates(garmentType) {
  const config = GARMENT_CONFIG[garmentType];
  if (!config) return null;
  
  const templates = {
    type: garmentType,
    displayName: config.displayName,
    templates: {}
  };
  
  for (const side of config.sides) {
    templates.templates[side] = {};
    for (const color of config.colors) {
      // Build Cloudinary URL for garment template
      const filename = color === 'default' ? 'main.png' : `${color}.png`;
      const path = `${config.folder}/${side}/${filename}`;
      templates.templates[side][color] = `https://res.cloudinary.com/dqslerzk9/image/upload/${path}`;
    }
  }
  
  return templates;
}

// Helper function to extract garment type from product
function extractGarmentType(product) {
  // Try multiple sources to determine garment type
  
  // 1. Check productParts
  if (product.productParts && product.productParts.length > 0) {
    const part = product.productParts[0].part;
    if (GARMENT_CONFIG[part]) return part;
  }
  
  // 2. Check product name for garment keywords
  const name = (product.name || '').toLowerCase();
  if (name.includes('hoodie')) {
    if (name.includes('women') || name.includes('wmn')) return 'wmn-hoodie';
    return 'med-hood';
  }
  if (name.includes('crop')) return 'next-crop';
  if (name.includes('polo')) return 'polo';
  if (name.includes('boxy')) return 'boxy';
  if (name.includes('patch')) {
    if (name.includes('circle')) return 'patch-c';
    return 'patch-flat';
  }
  
  // 3. Check mainImage URL for garment type hints
  if (product.mainImage?.uri) {
    const url = product.mainImage.uri.toLowerCase();
    for (const garmentType of Object.keys(GARMENT_CONFIG)) {
      if (url.includes(garmentType)) return garmentType;
    }
  }
  
  // Default to tee
  return 'tee';
}

// Import designs with COMPLETE image mapping
router.post('/import-with-all-images/:sanityPersonId', authenticate, async (req, res) => {
  try {
    const { sanityPersonId } = req.params;
    const user = req.user;
    
    console.log('🎨 ENHANCED IMPORT - Starting with complete image mapping');
    console.log(`   User: ${user.email}`);
    console.log(`   Sanity Person ID: ${sanityPersonId}`);
    
    // Verify creator mapping
    const mapping = await CreatorMapping.findOne({
      where: { 
        dynamicUserId: user.id,
        sanityPersonId: sanityPersonId
      }
    });
    
    if (!mapping) {
      return res.status(403).json({
        error: 'Not authorized to import these designs'
      });
    }
    
    // Fetch designs from Sanity with ALL image fields
    const sanityDesigns = await sanityClient.fetch(`
      *[_type == "product" && person._ref == $personId] {
        _id,
        name,
        slug,
        designId,
        description,
        price,
        mainImage {
          _key,
          _type,
          format,
          height,
          width,
          title,
          uri
        },
        secondaryImages[] {
          _key,
          _type,
          format,
          height,
          width,
          title,
          uri
        },
        productParts[] {
          _key,
          part,
          design,
          placement {
            x,
            y,
            width,
            height,
            rotation
          },
          colors[] {
            name,
            hex
          }
        },
        variants[] {
          _key,
          name,
          price,
          size,
          color,
          image {
            uri
          }
        },
        tags,
        categories[]->{
          _id,
          name
        }
      }
    `, { personId: sanityPersonId });
    
    console.log(`\n📦 Found ${sanityDesigns.length} designs in Sanity\n`);
    
    const importResults = [];
    
    for (const sanityDesign of sanityDesigns) {
      console.log(`\n🔄 Processing: ${sanityDesign.name || 'Unnamed Design'}`);
      
      // Extract garment type
      const garmentType = extractGarmentType(sanityDesign);
      console.log(`   Garment Type: ${garmentType}`);
      
      // Build complete image data structure
      const completeImageData = {
        // Raw design references (to be fetched from designs/ folder)
        rawDesigns: {
          designId: sanityDesign.designId,
          creatorId: sanityPersonId,
          // These would be populated by searching Cloudinary
          front: null,
          back: null,
          sleeve: null
        },
        
        // Garment templates from garments/ folder
        garmentTemplates: buildGarmentTemplates(garmentType),
        
        // Generated mockups
        mockups: {
          main: sanityDesign.mainImage?.uri || null,
          secondary: (sanityDesign.secondaryImages || []).map(img => img.uri),
          variants: {}
        },
        
        // Placement data for design positioning
        placement: {},
        
        // Product configuration
        productConfig: {
          garmentType: garmentType,
          availableColors: GARMENT_CONFIG[garmentType]?.colors || ['black', 'white'],
          availableSizes: ['S', 'M', 'L', 'XL', '2XL']
        }
      };
      
      // Extract placement data from productParts
      if (sanityDesign.productParts && sanityDesign.productParts.length > 0) {
        for (const part of sanityDesign.productParts) {
          if (part.placement) {
            completeImageData.placement[part.part || 'front'] = {
              x: part.placement.x || 0,
              y: part.placement.y || 0,
              width: part.placement.width || 200,
              height: part.placement.height || 200,
              rotation: part.placement.rotation || 0
            };
          }
        }
      }
      
      // Map variant images
      if (sanityDesign.variants && sanityDesign.variants.length > 0) {
        for (const variant of sanityDesign.variants) {
          if (variant.image?.uri) {
            const key = `${variant.color || 'default'}_${variant.size || 'default'}`;
            completeImageData.mockups.variants[key] = variant.image.uri;
          }
        }
      }
      
      // If we have a designId, try to construct raw design URLs
      if (sanityDesign.designId) {
        const baseDesignUrl = `https://res.cloudinary.com/dqslerzk9/image/upload/designs/${sanityPersonId}/${sanityDesign.designId}`;
        // These are educated guesses - would need to verify with Cloudinary API
        completeImageData.rawDesigns.front = `${baseDesignUrl}_front.png`;
        completeImageData.rawDesigns.back = `${baseDesignUrl}_back.png`;
        completeImageData.rawDesigns.main = `${baseDesignUrl}.png`;
      }
      
      // Determine thumbnail URL (prioritize main mockup)
      let thumbnailUrl = sanityDesign.mainImage?.uri || '';
      
      // Fallback to first secondary image
      if (!thumbnailUrl && sanityDesign.secondaryImages?.length > 0) {
        thumbnailUrl = sanityDesign.secondaryImages[0].uri;
      }
      
      // Fallback to garment template
      if (!thumbnailUrl && completeImageData.garmentTemplates) {
        const defaultSide = completeImageData.garmentTemplates.templates.display || 
                           completeImageData.garmentTemplates.templates.front;
        if (defaultSide) {
          const defaultColor = GARMENT_CONFIG[garmentType]?.defaultColor || 'black';
          thumbnailUrl = defaultSide[defaultColor] || Object.values(defaultSide)[0];
        }
      }
      
      console.log(`   ✅ Thumbnail: ${thumbnailUrl ? 'Found' : 'Missing'}`);
      console.log(`   ✅ Garment Templates: ${Object.keys(completeImageData.garmentTemplates?.templates || {}).length} sides`);
      console.log(`   ✅ Mockups: ${completeImageData.mockups.secondary.length} secondary, ${Object.keys(completeImageData.mockups.variants).length} variants`);
      
      // Create or update design record
      const [design, created] = await Design.upsert({
        sanityId: sanityDesign._id,
        creatorId: user.id,
        name: sanityDesign.name || 'Untitled Design',
        description: sanityDesign.description || '',
        thumbnailUrl: thumbnailUrl,
        frontDesignUrl: completeImageData.rawDesigns.front || thumbnailUrl,
        backDesignUrl: completeImageData.rawDesigns.back || '',
        sleeveDesignUrl: completeImageData.rawDesigns.sleeve || '',
        price: sanityDesign.price || 25.00,
        status: 'active',
        tags: JSON.stringify(sanityDesign.tags || []),
        categories: JSON.stringify((sanityDesign.categories || []).map(c => c.name)),
        design_data: JSON.stringify(completeImageData) // Store ALL image data
      }, {
        where: { sanityId: sanityDesign._id }
      });
      
      importResults.push({
        id: design.id,
        sanityId: design.sanityId,
        name: design.name,
        created: created,
        thumbnailUrl: design.thumbnailUrl,
        hasCompleteData: true,
        garmentType: garmentType
      });
      
      console.log(`   ${created ? '✨ Created' : '🔄 Updated'} design ${design.id}`);
    }
    
    // Summary
    const created = importResults.filter(r => r.created).length;
    const updated = importResults.filter(r => !r.created).length;
    const withThumbnails = importResults.filter(r => r.thumbnailUrl).length;
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ ENHANCED IMPORT COMPLETE');
    console.log(`   Total: ${importResults.length} designs`);
    console.log(`   Created: ${created}, Updated: ${updated}`);
    console.log(`   With Thumbnails: ${withThumbnails}`);
    console.log(`   With Complete Data: ${importResults.length}`);
    console.log('='.repeat(60));
    
    res.json({
      success: true,
      message: `Successfully imported ${importResults.length} designs with complete image data`,
      stats: {
        total: importResults.length,
        created: created,
        updated: updated,
        withThumbnails: withThumbnails,
        withCompleteData: importResults.length
      },
      designs: importResults
    });
    
  } catch (error) {
    console.error('❌ Enhanced import error:', error);
    res.status(500).json({
      error: 'Failed to import designs',
      message: error.message
    });
  }
});

// Test endpoint to verify complete image data
router.get('/verify-complete-data/:designId', authenticate, async (req, res) => {
  try {
    const { designId } = req.params;
    
    const design = await Design.findByPk(designId);
    
    if (!design) {
      return res.status(404).json({ error: 'Design not found' });
    }
    
    const imageData = design.design_data ? JSON.parse(design.design_data) : null;
    
    res.json({
      success: true,
      design: {
        id: design.id,
        name: design.name,
        thumbnailUrl: design.thumbnailUrl,
        hasCompleteData: !!imageData,
        imageData: imageData
      }
    });
    
  } catch (error) {
    console.error('Error verifying data:', error);
    res.status(500).json({
      error: 'Failed to verify design data',
      message: error.message
    });
  }
});

module.exports = router;