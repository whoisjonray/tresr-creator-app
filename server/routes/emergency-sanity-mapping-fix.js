const express = require('express');
const mysql = require('mysql2/promise');
const { Client } = require('@sanity/client');
const router = express.Router();

// Initialize Sanity client
const sanityClient = new Client({
  projectId: process.env.SANITY_PROJECT_ID || 'your-project-id',
  dataset: process.env.SANITY_DATASET || 'production',
  apiVersion: '2023-01-01',
  token: process.env.SANITY_TOKEN,
  useCdn: false
});

// MySQL connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'tresr_creator_app',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

/**
 * EMERGENCY SANITY MAPPING FIX
 * 
 * This script addresses critical mapping issues identified in schema validation:
 * 1. mainImage.uri is not being mapped to thumbnail_url
 * 2. secondaryImages array is being ignored
 * 3. Positioning data (overlayTopLeft, etc.) is lost
 * 4. Raw design vs mockup confusion
 * 5. Creator attribution gaps
 * 6. Product metadata loss
 */

router.post('/emergency-fix', async (req, res) => {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log('🚨 EMERGENCY SANITY MAPPING FIX INITIATED');
    console.log('================================================');
    
    // Step 1: Add missing columns to designs table
    await addMissingColumns(connection);
    
    // Step 2: Fetch all designs from Sanity with complete data
    const sanityDesigns = await fetchAllSanityDesigns();
    console.log(`📊 Found ${sanityDesigns.length} designs in Sanity`);
    
    // Step 3: Map and update all designs with proper field mapping
    const results = await processSanityDesigns(connection, sanityDesigns);
    
    // Step 4: Verify the fixes
    const verification = await verifyFixes(connection);
    
    res.json({
      success: true,
      message: 'Emergency mapping fix completed successfully',
      results,
      verification,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Emergency fix failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  } finally {
    await connection.end();
  }
});

/**
 * Add missing columns to designs table for proper Sanity mapping
 */
async function addMissingColumns(connection) {
  console.log('🔧 Adding missing columns to designs table...');
  
  const columns = [
    'ADD COLUMN IF NOT EXISTS main_image_url VARCHAR(500) NULL',
    'ADD COLUMN IF NOT EXISTS secondary_images JSON NULL',
    'ADD COLUMN IF NOT EXISTS thumbnail_url VARCHAR(500) NULL',
    'ADD COLUMN IF NOT EXISTS overlay_position JSON NULL',
    'ADD COLUMN IF NOT EXISTS print_area JSON NULL',
    'ADD COLUMN IF NOT EXISTS design_metadata JSON NULL',
    'ADD COLUMN IF NOT EXISTS product_config JSON NULL',
    'ADD COLUMN IF NOT EXISTS sanity_sku VARCHAR(100) NULL',
    'ADD COLUMN IF NOT EXISTS cloudinary_design_id VARCHAR(100) NULL',
    'ADD COLUMN IF NOT EXISTS sanity_price DECIMAL(10,2) NULL',
    'ADD COLUMN IF NOT EXISTS sanity_regular_price DECIMAL(10,2) NULL',
    'ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) NULL',
    'ADD COLUMN IF NOT EXISTS sales_count INT DEFAULT 0',
    'ADD COLUMN IF NOT EXISTS view_count INT DEFAULT 0',
    'ADD COLUMN IF NOT EXISTS analytics_data JSON NULL'
  ];
  
  for (const column of columns) {
    try {
      await connection.execute(`ALTER TABLE designs ${column}`);
      console.log(`✅ Added column: ${column.split('ADD COLUMN IF NOT EXISTS ')[1]?.split(' ')[0]}`);
    } catch (error) {
      if (!error.message.includes('Duplicate column name')) {
        console.log(`⚠️  Column addition warning: ${error.message}`);
      }
    }
  }
}

/**
 * Fetch all designs from Sanity with comprehensive field mapping
 */
async function fetchAllSanityDesigns() {
  console.log('📡 Fetching all designs from Sanity...');
  
  const query = `
    *[_type == "design" || _type == "product"] {
      _id,
      _type,
      title,
      slug,
      sku,
      designId,
      status,
      isActive,
      isPublic,
      isFeatured,
      visibility,
      
      // Image data - CRITICAL MAPPING
      mainImage {
        _key,
        uri,
        format,
        width,
        height,
        cloudinaryImage {
          uri,
          public_id,
          format,
          width,
          height
        }
      },
      
      secondaryImages[] {
        _key,
        uri,
        format,
        width,
        height,
        cloudinaryImage {
          uri,
          public_id,
          format,
          width,
          height
        }
      },
      
      thumbnail {
        uri,
        cloudinaryImage {
          uri
        }
      },
      
      featuredImage {
        uri,
        cloudinaryImage {
          uri
        }
      },
      
      // Design positioning data - CRITICAL MAPPING
      overlayTopLeft {
        x,
        y
      },
      overlayBottomRight {
        x,
        y
      },
      printAreaTopLeft {
        x,
        y
      },
      printAreaBottomRight {
        x,
        y
      },
      
      // Creator data - CRITICAL MAPPING
      owner-> {
        _id,
        name,
        email,
        wallet
      },
      creators[]-> {
        _id,
        name,
        email,
        wallet
      },
      creator-> {
        _id,
        name,
        email,
        wallet
      },
      person-> {
        _id,
        name,
        email,
        wallet
      },
      
      // Product data
      price,
      regularPrice,
      commission,
      sales,
      views,
      allTimeViews,
      likeCount,
      
      // Product configuration
      variants,
      colors,
      sizes,
      materials,
      careInstructions,
      
      // Analytics
      analytics,
      
      // SEO and metadata
      seo,
      tags,
      metadata,
      
      // NFT data
      nftData,
      tokenId,
      contractAddress,
      mintedAt
    }
  `;
  
  const designs = await sanityClient.fetch(query);
  console.log(`✅ Fetched ${designs.length} designs from Sanity`);
  
  return designs;
}

/**
 * Process and map Sanity designs to MySQL with proper field mapping
 */
async function processSanityDesigns(connection, sanityDesigns) {
  console.log('🔄 Processing Sanity designs for MySQL mapping...');
  
  const results = {
    processed: 0,
    successful: 0,
    failed: 0,
    errors: [],
    mappings: {
      imagesFixed: 0,
      positioningFixed: 0,
      creatorsFixed: 0,
      metadataFixed: 0
    }
  };
  
  for (const design of sanityDesigns) {
    results.processed++;
    
    try {
      console.log(`\n📝 Processing design: ${design.title || design._id}`);
      
      // Map image data with proper field mapping
      const imageMapping = mapImageData(design);
      
      // Map positioning data
      const positionMapping = mapPositionData(design);
      
      // Map creator data
      const creatorMapping = await mapCreatorData(connection, design);
      
      // Map product metadata
      const metadataMapping = mapProductMetadata(design);
      
      // Map status properly
      const statusMapping = mapStatus(design);
      
      // Check if design exists in MySQL
      const [existingDesigns] = await connection.execute(
        'SELECT id, sanity_id FROM designs WHERE sanity_id = ? OR title = ?',
        [design._id, design.title]
      );
      
      if (existingDesigns.length > 0) {
        // Update existing design
        await updateExistingDesign(connection, existingDesigns[0], {
          ...imageMapping,
          ...positionMapping,
          ...creatorMapping,
          ...metadataMapping,
          ...statusMapping,
          sanity_id: design._id,
          sanity_type: design._type
        });
        
        console.log(`✅ Updated existing design: ${design.title}`);
      } else {
        // Create new design entry
        await createNewDesign(connection, design, {
          ...imageMapping,
          ...positionMapping,
          ...creatorMapping,
          ...metadataMapping,
          ...statusMapping
        });
        
        console.log(`✅ Created new design: ${design.title}`);
      }
      
      // Update result counters
      if (imageMapping.thumbnail_url) results.mappings.imagesFixed++;
      if (positionMapping.overlay_position) results.mappings.positioningFixed++;
      if (creatorMapping.creator_id) results.mappings.creatorsFixed++;
      if (metadataMapping.sanity_sku) results.mappings.metadataFixed++;
      
      results.successful++;
      
    } catch (error) {
      console.error(`❌ Failed to process design ${design._id}:`, error.message);
      results.failed++;
      results.errors.push({
        design_id: design._id,
        title: design.title,
        error: error.message
      });
    }
  }
  
  console.log('\n📊 Processing Results:');
  console.log(`✅ Successful: ${results.successful}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`🖼️  Images fixed: ${results.mappings.imagesFixed}`);
  console.log(`📍 Positioning fixed: ${results.mappings.positioningFixed}`);
  console.log(`👤 Creators fixed: ${results.mappings.creatorsFixed}`);
  console.log(`📋 Metadata fixed: ${results.mappings.metadataFixed}`);
  
  return results;
}

/**
 * Map image data with proper field distinctions
 */
function mapImageData(design) {
  const mapping = {};
  
  // Primary image mapping - handle raw designs vs mockups
  if (design.mainImage?.uri) {
    // For mockups (display purposes) - use mainImage.uri as thumbnail
    mapping.thumbnail_url = design.mainImage.uri;
    mapping.main_image_url = design.mainImage.uri;
    
    console.log(`   🖼️  Mapped main image: ${design.mainImage.uri}`);
  } else if (design.mainImage?.cloudinaryImage?.uri) {
    // For raw designs (editor purposes) - use cloudinaryImage.uri as front_design_url
    mapping.front_design_url = design.mainImage.cloudinaryImage.uri;
    mapping.thumbnail_url = design.mainImage.cloudinaryImage.uri; // Fallback for thumbnail
    
    console.log(`   🎨 Mapped raw design: ${design.mainImage.cloudinaryImage.uri}`);
  }
  
  // Secondary images mapping
  if (design.secondaryImages?.length > 0) {
    const secondaryUrls = design.secondaryImages
      .map(img => img.uri || img.cloudinaryImage?.uri)
      .filter(Boolean);
    
    if (secondaryUrls.length > 0) {
      mapping.secondary_images = JSON.stringify(secondaryUrls);
      
      // Use first secondary image as back design if available
      if (secondaryUrls[0]) {
        mapping.back_design_url = secondaryUrls[0];
      }
      
      console.log(`   🖼️  Mapped ${secondaryUrls.length} secondary images`);
    }
  }
  
  // Thumbnail fallback mapping
  if (!mapping.thumbnail_url && design.thumbnail?.uri) {
    mapping.thumbnail_url = design.thumbnail.uri;
    console.log(`   🖼️  Used thumbnail fallback: ${design.thumbnail.uri}`);
  } else if (!mapping.thumbnail_url && design.featuredImage?.uri) {
    mapping.thumbnail_url = design.featuredImage.uri;
    console.log(`   🖼️  Used featured image fallback: ${design.featuredImage.uri}`);
  }
  
  return mapping;
}

/**
 * Map positioning data to JSON format
 */
function mapPositionData(design) {
  const mapping = {};
  
  // Overlay positioning data
  if (design.overlayTopLeft || design.overlayBottomRight) {
    mapping.overlay_position = JSON.stringify({
      topLeft: design.overlayTopLeft || null,
      bottomRight: design.overlayBottomRight || null
    });
    
    console.log(`   📍 Mapped overlay positioning data`);
  }
  
  // Print area positioning data
  if (design.printAreaTopLeft || design.printAreaBottomRight) {
    mapping.print_area = JSON.stringify({
      topLeft: design.printAreaTopLeft || null,
      bottomRight: design.printAreaBottomRight || null
    });
    
    console.log(`   📍 Mapped print area data`);
  }
  
  return mapping;
}

/**
 * Map creator data with multiple creator support
 */
async function mapCreatorData(connection, design) {
  const mapping = {};
  
  // Primary creator mapping (priority order: owner, creator, person)
  let primaryCreator = design.owner || design.creator || design.person;
  
  if (primaryCreator?._id) {
    try {
      // Try to find existing creator in MySQL
      const [creators] = await connection.execute(
        'SELECT id FROM creators WHERE sanity_id = ? OR email = ?',
        [primaryCreator._id, primaryCreator.email]
      );
      
      if (creators.length > 0) {
        mapping.creator_id = creators[0].id;
        console.log(`   👤 Mapped to existing creator: ${primaryCreator.name}`);
      } else {
        console.log(`   ⚠️  Creator not found in MySQL: ${primaryCreator.name}`);
        // Could create creator here if needed
      }
    } catch (error) {
      console.log(`   ⚠️  Creator mapping error: ${error.message}`);
    }
  }
  
  // Additional creators mapping (for future collaborators table)
  if (design.creators?.length > 0) {
    const additionalCreators = design.creators
      .filter(c => c._id !== primaryCreator?._id)
      .map(c => ({
        sanity_id: c._id,
        name: c.name,
        email: c.email,
        wallet: c.wallet
      }));
    
    if (additionalCreators.length > 0) {
      mapping.additional_creators = JSON.stringify(additionalCreators);
      console.log(`   👥 Found ${additionalCreators.length} additional creators`);
    }
  }
  
  return mapping;
}

/**
 * Map product metadata
 */
function mapProductMetadata(design) {
  const mapping = {};
  
  if (design.sku) {
    mapping.sanity_sku = design.sku;
    console.log(`   📋 Mapped SKU: ${design.sku}`);
  }
  
  if (design.designId) {
    mapping.cloudinary_design_id = design.designId;
    console.log(`   🎨 Mapped design ID: ${design.designId}`);
  }
  
  if (design.price) {
    mapping.sanity_price = design.price;
    console.log(`   💰 Mapped price: $${design.price}`);
  }
  
  if (design.regularPrice) {
    mapping.sanity_regular_price = design.regularPrice;
    console.log(`   💰 Mapped regular price: $${design.regularPrice}`);
  }
  
  if (design.commission) {
    mapping.commission_rate = design.commission;
    console.log(`   💰 Mapped commission: ${design.commission}%`);
  }
  
  if (design.sales) {
    mapping.sales_count = design.sales;
    console.log(`   📊 Mapped sales count: ${design.sales}`);
  }
  
  if (design.views || design.allTimeViews) {
    mapping.view_count = design.views || design.allTimeViews || 0;
    console.log(`   👁️  Mapped view count: ${mapping.view_count}`);
  }
  
  // Product configuration
  if (design.variants || design.colors || design.sizes || design.materials) {
    mapping.product_config = JSON.stringify({
      variants: design.variants || null,
      colors: design.colors || null,
      sizes: design.sizes || null,
      materials: design.materials || null,
      careInstructions: design.careInstructions || null
    });
    
    console.log(`   ⚙️  Mapped product configuration`);
  }
  
  // Analytics and metadata
  if (design.analytics || design.nftData || design.seo) {
    mapping.analytics_data = JSON.stringify({
      analytics: design.analytics || null,
      nftData: design.nftData || null,
      seo: design.seo || null,
      tags: design.tags || null,
      metadata: design.metadata || null,
      likeCount: design.likeCount || 0,
      tokenId: design.tokenId || null,
      contractAddress: design.contractAddress || null,
      mintedAt: design.mintedAt || null
    });
    
    console.log(`   📊 Mapped analytics and metadata`);
  }
  
  return mapping;
}

/**
 * Map status with proper boolean to enum conversion
 */
function mapStatus(design) {
  let status = 'draft'; // default
  
  if (design.status) {
    status = design.status;
  } else if (design.isActive && design.isPublic) {
    status = 'published';
  } else if (design.isActive && !design.isPublic) {
    status = 'draft';
  } else if (!design.isActive) {
    status = 'archived';
  }
  
  console.log(`   📄 Mapped status: ${status}`);
  
  return { status };
}

/**
 * Update existing design with new mapped data
 */
async function updateExistingDesign(connection, existingDesign, mappedData) {
  const updateFields = [];
  const updateValues = [];
  
  // Build dynamic update query
  Object.entries(mappedData).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      updateFields.push(`${key} = ?`);
      updateValues.push(value);
    }
  });
  
  if (updateFields.length === 0) return;
  
  updateValues.push(existingDesign.id);
  
  const updateQuery = `
    UPDATE designs 
    SET ${updateFields.join(', ')}, updated_at = NOW()
    WHERE id = ?
  `;
  
  await connection.execute(updateQuery, updateValues);
}

/**
 * Create new design with mapped data
 */
async function createNewDesign(connection, sanityDesign, mappedData) {
  const fields = ['sanity_id', 'title', 'created_at', 'updated_at'];
  const values = [sanityDesign._id, sanityDesign.title, 'NOW()', 'NOW()'];
  const placeholders = ['?', '?', 'NOW()', 'NOW()'];
  
  // Add mapped data fields
  Object.entries(mappedData).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      fields.push(key);
      values.push(value);
      placeholders.push('?');
    }
  });
  
  const insertQuery = `
    INSERT INTO designs (${fields.join(', ')})
    VALUES (${placeholders.join(', ')})
  `;
  
  await connection.execute(insertQuery, values);
}

/**
 * Verify the fixes by checking updated data
 */
async function verifyFixes(connection) {
  console.log('\n🔍 Verifying emergency fixes...');
  
  const verification = {};
  
  // Check image mappings
  const [imageResults] = await connection.execute(`
    SELECT 
      COUNT(*) as total,
      COUNT(thumbnail_url) as has_thumbnail,
      COUNT(main_image_url) as has_main_image,
      COUNT(front_design_url) as has_front_design,
      COUNT(back_design_url) as has_back_design
    FROM designs 
    WHERE sanity_id IS NOT NULL
  `);
  
  verification.images = imageResults[0];
  
  // Check positioning data
  const [positionResults] = await connection.execute(`
    SELECT 
      COUNT(*) as total,
      COUNT(overlay_position) as has_overlay_position,
      COUNT(print_area) as has_print_area
    FROM designs 
    WHERE sanity_id IS NOT NULL
  `);
  
  verification.positioning = positionResults[0];
  
  // Check creator mappings
  const [creatorResults] = await connection.execute(`
    SELECT 
      COUNT(*) as total,
      COUNT(creator_id) as has_creator_id
    FROM designs 
    WHERE sanity_id IS NOT NULL
  `);
  
  verification.creators = creatorResults[0];
  
  // Check metadata
  const [metadataResults] = await connection.execute(`
    SELECT 
      COUNT(*) as total,
      COUNT(sanity_sku) as has_sku,
      COUNT(cloudinary_design_id) as has_design_id,
      COUNT(sanity_price) as has_price,
      COUNT(product_config) as has_config
    FROM designs 
    WHERE sanity_id IS NOT NULL
  `);
  
  verification.metadata = metadataResults[0];
  
  console.log('✅ Verification Results:');
  console.log(`   Images: ${verification.images.has_thumbnail}/${verification.images.total} have thumbnails`);
  console.log(`   Positioning: ${verification.positioning.has_overlay_position}/${verification.positioning.total} have positioning`);
  console.log(`   Creators: ${verification.creators.has_creator_id}/${verification.creators.total} have creator mapping`);
  console.log(`   Metadata: ${verification.metadata.has_sku}/${verification.metadata.total} have SKU data`);
  
  return verification;
}

/**
 * Test endpoint to check specific design
 */
router.get('/test-design/:id', async (req, res) => {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    const [designs] = await connection.execute(`
      SELECT 
        id,
        title,
        thumbnail_url,
        main_image_url,
        front_design_url,
        back_design_url,
        overlay_position,
        print_area,
        creator_id,
        sanity_sku,
        status,
        product_config,
        analytics_data
      FROM designs 
      WHERE id = ? OR sanity_id = ?
    `, [req.params.id, req.params.id]);
    
    if (designs.length === 0) {
      return res.status(404).json({ error: 'Design not found' });
    }
    
    const design = designs[0];
    
    // Parse JSON fields
    ['overlay_position', 'print_area', 'product_config', 'analytics_data'].forEach(field => {
      if (design[field]) {
        try {
          design[field] = JSON.parse(design[field]);
        } catch (e) {
          console.warn(`Failed to parse ${field}:`, e.message);
        }
      }
    });
    
    res.json({
      success: true,
      design,
      hasRequiredFields: {
        hasImages: !!(design.thumbnail_url || design.main_image_url),
        hasPositioning: !!(design.overlay_position || design.print_area),
        hasCreator: !!design.creator_id,
        hasMetadata: !!design.sanity_sku
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await connection.end();
  }
});

module.exports = router;