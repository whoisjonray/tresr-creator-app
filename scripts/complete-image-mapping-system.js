require('dotenv').config({ path: '../.env' });
const { createClient } = require('@sanity/client');
const cloudinary = require('cloudinary').v2;

// Configure Sanity
const client = createClient({
  projectId: 'a9vtdosx',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN
});

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME || 'dqslerzk9',
  api_key: process.env.CLOUDINARY_API_KEY || '364274988183368',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'gJEAx4VjStv1uTKyi3DiLAwL8pQ'
});

// Garment configuration based on discovered structure
const GARMENT_CONFIG = {
  'tee': {
    folder: 'garments/tee',
    sides: ['display', 'back'],
    colors: ['black', 'white', 'heather-grey', 'red', 'navy'],
    displayName: 'Classic Tee'
  },
  'boxy': {
    folder: 'garments/boxy',
    sides: ['display', 'back'],
    colors: ['black', 'white', 'sand', 'mint'],
    displayName: 'Boxy Tee'
  },
  'polo': {
    folder: 'garments/polo',
    sides: ['display', 'back'],
    colors: ['black', 'white', 'navy'],
    displayName: 'Polo Shirt'
  },
  'mediu': {
    folder: 'garments/mediu',
    sides: ['display', 'back'],
    colors: ['black', 'white', 'grey'],
    displayName: 'Medium Weight Tee'
  },
  'med-hood': {
    folder: 'garments/med-hood',
    sides: ['display', 'back'],
    colors: ['black', 'white', 'grey'],
    displayName: 'Medium Hoodie'
  },
  'next-crop': {
    folder: 'garments/next-crop',
    sides: ['display', 'back'],
    colors: ['black', 'white', 'pink'],
    displayName: 'Crop Top'
  },
  'wmn-hoodie': {
    folder: 'garments/wmn-hoodie',
    sides: ['display', 'back'],
    colors: ['black', 'white', 'pink'],
    displayName: 'Women\'s Hoodie'
  },
  'patch-c': {
    folder: 'garments/patch-c',
    sides: ['display'],
    colors: ['default'],
    displayName: 'Patch Circle'
  },
  'patch-flat': {
    folder: 'garments/patch-flat',
    sides: ['display'],
    colors: ['default'],
    displayName: 'Patch Flat'
  }
};

async function mapCompleteImageSystem() {
  console.log('🗺️ Creating Complete Image Mapping System\n');
  console.log('='.repeat(80));
  
  try {
    // 1. Get sample Sanity products to understand structure
    console.log('\n📦 Fetching Sanity Products...');
    const products = await client.fetch(`
      *[_type == "product" && defined(mainImage)][0...10] {
        _id,
        name,
        slug,
        designId,
        person->{
          _id,
          name,
          sanityPersonId
        },
        mainImage {
          uri,
          _type,
          format
        },
        secondaryImages[] {
          uri,
          _type,
          format
        },
        productParts[] {
          _key,
          part,
          design,
          placement,
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
        }
      }
    `);
    
    console.log(`Found ${products.length} products with images\n`);
    
    // 2. Analyze image patterns for each product
    const imageMappings = [];
    
    for (const product of products) {
      console.log(`\n📌 ${product.name || 'Unnamed Product'}`);
      console.log(`   Slug: ${product.slug?.current || 'no-slug'}`);
      console.log(`   Design ID: ${product.designId || 'no-design-id'}`);
      
      const mapping = {
        productId: product._id,
        name: product.name,
        slug: product.slug?.current,
        designId: product.designId,
        creatorId: product.person?._id || product.person?.sanityPersonId,
        images: {
          mainMockup: null,
          rawDesigns: {},
          garmentTemplates: {},
          generatedMockups: [],
          thumbnails: []
        }
      };
      
      // Extract main mockup
      if (product.mainImage?.uri) {
        mapping.images.mainMockup = product.mainImage.uri;
        console.log(`   ✅ Main mockup: ${product.mainImage.uri.split('/').pop()}`);
      }
      
      // Parse the design ID to find raw design images
      if (product.designId) {
        // Pattern: designs/{creatorId}/{designId}
        const designPath = `designs/${mapping.creatorId}/${product.designId}`;
        
        try {
          const designResources = await cloudinary.api.resources({
            type: 'upload',
            prefix: designPath,
            max_results: 10
          });
          
          if (designResources.resources.length > 0) {
            console.log(`   ✅ Found ${designResources.resources.length} raw design files`);
            designResources.resources.forEach(resource => {
              const filename = resource.public_id.split('/').pop();
              // Determine if it's front, back, or sleeve
              if (filename.includes('front')) {
                mapping.images.rawDesigns.front = resource.secure_url;
              } else if (filename.includes('back')) {
                mapping.images.rawDesigns.back = resource.secure_url;
              } else if (filename.includes('sleeve')) {
                mapping.images.rawDesigns.sleeve = resource.secure_url;
              } else {
                mapping.images.rawDesigns.main = resource.secure_url;
              }
            });
          }
        } catch (e) {
          console.log(`   ⚠️ No raw designs found in designs/${mapping.creatorId}/`);
        }
      }
      
      // Map garment templates based on product type
      if (product.productParts && product.productParts.length > 0) {
        for (const part of product.productParts) {
          const garmentType = part.part || 'tee'; // Default to tee
          const garmentConfig = GARMENT_CONFIG[garmentType];
          
          if (garmentConfig) {
            mapping.images.garmentTemplates[garmentType] = {
              folder: garmentConfig.folder,
              displayName: garmentConfig.displayName,
              templates: {}
            };
            
            // Build template URLs
            for (const side of garmentConfig.sides) {
              mapping.images.garmentTemplates[garmentType].templates[side] = {};
              for (const color of garmentConfig.colors) {
                const templateUrl = `https://res.cloudinary.com/dqslerzk9/image/upload/${garmentConfig.folder}/${side}/${color}.png`;
                mapping.images.garmentTemplates[garmentType].templates[side][color] = templateUrl;
              }
            }
            
            console.log(`   ✅ Mapped ${garmentType} templates (${garmentConfig.colors.length} colors)`);
          }
        }
      }
      
      // Extract generated mockups from secondary images
      if (product.secondaryImages && product.secondaryImages.length > 0) {
        mapping.images.generatedMockups = product.secondaryImages.map(img => img.uri);
        console.log(`   ✅ ${product.secondaryImages.length} generated mockups`);
      }
      
      // Extract variant images
      if (product.variants && product.variants.length > 0) {
        const variantImages = product.variants
          .filter(v => v.image?.uri)
          .map(v => ({
            variant: `${v.color}-${v.size}`,
            url: v.image.uri
          }));
        
        if (variantImages.length > 0) {
          mapping.images.variantMockups = variantImages;
          console.log(`   ✅ ${variantImages.length} variant-specific mockups`);
        }
      }
      
      imageMappings.push(mapping);
    }
    
    // 3. Create the complete mapping strategy
    const mappingStrategy = {
      overview: {
        totalProducts: products.length,
        foldersUsed: [
          'garments/ - Blank garment templates',
          'designs/ - Raw user-uploaded designs',
          'products/ - Generated product mockups',
          'clipart/ - Additional design elements',
          'nft/ - NFT-related images'
        ],
        workflow: [
          '1. User uploads design → Store in designs/{creatorId}/{designId}',
          '2. Select garment type (tee, boxy, etc.) from garments/ folder',
          '3. Apply design to garment at specified coordinates',
          '4. Generate mockup for each color variant',
          '5. Store mockups in products/{creatorId}/',
          '6. Save URLs in Sanity mainImage and secondaryImages'
        ]
      },
      garmentTypes: GARMENT_CONFIG,
      imageMappings: imageMappings,
      implementationGuide: {
        importProcess: `
// When importing a design from Sanity:
1. Extract mainImage.uri for thumbnail
2. Parse designId to find raw designs in designs/{creatorId}/{designId}
3. Identify garment type from productParts
4. Load garment templates from garments/{type}/
5. Store all URLs in design_data JSON field
        `,
        editingProcess: `
// When editing a design:
1. Load raw design from design_data.rawDesigns
2. Load garment template from design_data.garmentTemplates
3. Use Canvas API to composite design on garment
4. Apply placement coordinates from productParts
5. Generate new mockup and upload to Cloudinary
6. Update Sanity with new mockup URLs
        `,
        dataStructure: `
design_data: {
  rawDesigns: {
    front: "cloudinary_url",
    back: "cloudinary_url",
    sleeve: "cloudinary_url"
  },
  garmentTemplates: {
    tee: {
      display: { black: "url", white: "url", ... },
      back: { black: "url", white: "url", ... }
    }
  },
  mockups: {
    main: "cloudinary_url",
    variants: [...]
  },
  placement: {
    front: { x: 100, y: 100, width: 200, height: 200 },
    back: { x: 100, y: 100, width: 200, height: 200 }
  }
}
        `
      }
    };
    
    // 4. Save the complete mapping
    const fs = require('fs');
    fs.writeFileSync(
      '../docs/complete-image-mapping-strategy.json',
      JSON.stringify(mappingStrategy, null, 2)
    );
    
    console.log('\n\n' + '='.repeat(80));
    console.log('✅ COMPLETE IMAGE MAPPING CREATED');
    console.log('='.repeat(80));
    
    console.log('\n📊 Summary:');
    console.log(`• Analyzed ${products.length} products`);
    console.log(`• Discovered ${Object.keys(GARMENT_CONFIG).length} garment types`);
    console.log(`• Mapped garment templates, raw designs, and mockups`);
    console.log(`• Created implementation guide for import and editing`);
    
    console.log('\n📁 Key Folders:');
    console.log('• garments/ - Contains all blank garment templates');
    console.log('• designs/ - Contains raw user designs organized by creator');
    console.log('• products/ - Contains generated product mockups');
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Update import process to fetch garment templates');
    console.log('2. Store complete image data in design_data field');
    console.log('3. Implement Canvas-based mockup generation');
    console.log('4. Test with memelord (k2r2aa8vmghuyr3he0p2eo5e) products');
    
    console.log('\n📄 Mapping saved to: docs/complete-image-mapping-strategy.json');
    
    return mappingStrategy;
    
  } catch (error) {
    console.error('❌ Error creating mapping:', error);
    return null;
  }
}

// Run the mapping
mapCompleteImageSystem()
  .then(() => {
    console.log('\n✅ Mapping complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });