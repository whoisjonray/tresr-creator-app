const cloudinary = require('cloudinary').v2;
const { createClient } = require('@sanity/client');
require('dotenv').config({ path: '../.env' });

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME || 'dqslerzk9',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Initialize Sanity client
const sanityClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID || 'a9vtdosx',
  dataset: process.env.SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
  apiVersion: '2024-01-01'
});

async function discoverAllImagesForProduct(productTitle, designId, creatorId) {
  console.log(`\n🔍 Discovering ALL images for: ${productTitle}`);
  console.log(`   Design ID: ${designId}`);
  console.log(`   Creator ID: ${creatorId}`);
  console.log('   ================================\n');

  const allImages = {
    mockups: [],
    rawDesigns: [],
    variants: [],
    other: []
  };

  try {
    // 1. Search in products folder for this creator
    console.log(`   📁 Searching products/${creatorId}/...`);
    const productSearch = await cloudinary.search
      .expression(`folder:products/${creatorId}`)
      .max_results(500)
      .execute();

    if (productSearch.resources) {
      productSearch.resources.forEach(resource => {
        const filename = resource.public_id.split('/').pop();
        const url = resource.secure_url || resource.url;
        
        // Categorize based on filename patterns
        if (filename.includes(designId)) {
          allImages.mockups.push({
            type: 'mockup-by-designId',
            filename,
            url,
            publicId: resource.public_id
          });
        } else if (filename.includes('_Front_') || filename.includes('_Back_')) {
          allImages.mockups.push({
            type: 'mockup-by-pattern',
            filename,
            url,
            publicId: resource.public_id
          });
        } else {
          allImages.other.push({
            type: 'product-other',
            filename,
            url,
            publicId: resource.public_id
          });
        }
      });
    }

    // 2. Search in designs folder for this creator
    console.log(`   📁 Searching designs/${creatorId}/...`);
    const designSearch = await cloudinary.search
      .expression(`folder:designs/${creatorId}`)
      .max_results(500)
      .execute();

    if (designSearch.resources) {
      designSearch.resources.forEach(resource => {
        const filename = resource.public_id.split('/').pop();
        const url = resource.secure_url || resource.url;
        
        // These are likely the raw design files
        allImages.rawDesigns.push({
          type: 'raw-design',
          filename,
          url,
          publicId: resource.public_id,
          metadata: resource.context || {},
          tags: resource.tags || []
        });
      });
    }

    // 3. Search by tags if designId exists
    if (designId) {
      console.log(`   🏷️ Searching by tag: ${designId}...`);
      const tagSearch = await cloudinary.search
        .expression(`tags=${designId}`)
        .max_results(100)
        .execute();

      if (tagSearch.resources) {
        tagSearch.resources.forEach(resource => {
          const filename = resource.public_id.split('/').pop();
          const url = resource.secure_url || resource.url;
          
          // Check if we already have this image
          const alreadyFound = [...allImages.mockups, ...allImages.rawDesigns, ...allImages.other]
            .some(img => img.publicId === resource.public_id);
          
          if (!alreadyFound) {
            allImages.other.push({
              type: 'tagged-with-designId',
              filename,
              url,
              publicId: resource.public_id
            });
          }
        });
      }
    }

  } catch (error) {
    console.error('   ❌ Error searching Cloudinary:', error.message);
  }

  return allImages;
}

async function analyzeAllProducts() {
  console.log('🚀 COMPLETE CLOUDINARY IMAGE DISCOVERY');
  console.log('======================================\n');

  // Get memelord's products from Sanity
  const memelordQuery = `*[_type == "product" && (
    "k2r2aa8vmghuyr3he0p2eo5e" in creators[]._ref ||
    creator._ref == "k2r2aa8vmghuyr3he0p2eo5e"
  )][0...5] {
    _id,
    title,
    designId,
    mainImage {
      uri,
      _key,
      title
    },
    secondaryImages[] {
      uri,
      _key,
      title
    }
  }`;

  const products = await sanityClient.fetch(memelordQuery);
  
  console.log(`Found ${products.length} products to analyze\n`);

  const imageMapping = {};

  for (const product of products) {
    const allImages = await discoverAllImagesForProduct(
      product.title,
      product.designId,
      'k2r2aa8vmghuyr3he0p2eo5e'
    );

    // Summary
    console.log(`   📊 Summary:`);
    console.log(`      Mockups: ${allImages.mockups.length}`);
    console.log(`      Raw Designs: ${allImages.rawDesigns.length}`);
    console.log(`      Variants: ${allImages.variants.length}`);
    console.log(`      Other: ${allImages.other.length}`);
    
    // Show specific images
    if (allImages.mockups.length > 0) {
      console.log(`\n   🖼️ Mockup Images:`);
      allImages.mockups.slice(0, 3).forEach(img => {
        console.log(`      - ${img.filename}: ${img.url.substring(0, 80)}...`);
      });
    }
    
    if (allImages.rawDesigns.length > 0) {
      console.log(`\n   🎨 Raw Design Images:`);
      allImages.rawDesigns.slice(0, 3).forEach(img => {
        console.log(`      - ${img.filename}: ${img.url.substring(0, 80)}...`);
      });
    }

    // Store mapping
    imageMapping[product._id] = {
      title: product.title,
      designId: product.designId,
      sanityMainImage: product.mainImage?.uri,
      sanitySecondaryImages: product.secondaryImages?.map(img => img.uri),
      cloudinaryImages: allImages
    };
  }

  // Create a comprehensive mapping document
  console.log('\n\n📝 CREATING COMPREHENSIVE IMAGE MAPPING...\n');
  
  const fs = require('fs');
  fs.writeFileSync(
    'cloudinary-image-mapping.json',
    JSON.stringify(imageMapping, null, 2)
  );
  
  console.log('✅ Saved complete image mapping to cloudinary-image-mapping.json');

  // Propose the solution
  console.log('\n\n🎯 SOLUTION FOR COMPLETE IMAGE ACCESS:');
  console.log('=========================================\n');
  console.log('1. Each product has images in TWO Cloudinary folders:');
  console.log('   - products/{creatorId}/ - Contains mockups');
  console.log('   - designs/{creatorId}/ - Contains raw design files');
  console.log('\n2. To properly import ALL images, we need to:');
  console.log('   a. Query mainImage and secondaryImages from Sanity (mockups)');
  console.log('   b. Use Cloudinary API to find raw designs in designs/ folder');
  console.log('   c. Store ALL URLs in design_data JSON field');
  console.log('\n3. The design_data structure should be:');
  console.log(JSON.stringify({
    mockups: {
      front: 'mainImage.uri',
      back: 'secondaryImages[0].uri',
      additional: ['other mockup URLs']
    },
    rawDesigns: {
      front: 'from designs/ folder',
      back: 'from designs/ folder',
      original: 'original upload'
    },
    designId: 'from Sanity',
    cloudinaryFolder: 'products/{creatorId}'
  }, null, 2));
}

// Run the analysis
analyzeAllProducts()
  .then(() => {
    console.log('\n✅ Complete discovery finished!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });