const { createClient } = require('@sanity/client');
require('dotenv').config({ path: '../.env' });

// Initialize Sanity client
const sanityClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID || 'a9vtdosx',
  dataset: process.env.SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
  apiVersion: '2024-01-01'
});

async function findRawDesignImages() {
  console.log('🔍 SEARCHING FOR RAW DESIGN IMAGE REFERENCES');
  console.log('===========================================\n');

  // 1. First check if there's a separate 'design' document type
  console.log('📦 STEP 1: Checking for design document type...\n');
  
  const designTypesQuery = `*[_type == "design"][0...3]`;
  const designs = await sanityClient.fetch(designTypesQuery);
  
  if (designs && designs.length > 0) {
    console.log(`Found ${designs.length} design documents!\n`);
    designs.forEach(design => {
      console.log('Design Document:', JSON.stringify(design, null, 2));
      console.log('---\n');
    });
  } else {
    console.log('No separate design documents found.\n');
  }

  // 2. Check the Just Grok It product for ALL fields (deep inspection)
  console.log('\n📦 STEP 2: Deep inspection of Just Grok It product...\n');
  
  const justGrokItQuery = `*[_type == "product" && designId == "v3f3qtskkwi3ieo5iyrfuhpo"][0]`;
  const justGrokIt = await sanityClient.fetch(justGrokItQuery);
  
  if (justGrokIt) {
    console.log('Searching all fields for raw image references...\n');
    
    // Recursively search for any field containing the raw image ID pattern
    const searchForRawImages = (obj, path = '') => {
      if (!obj) return;
      
      Object.entries(obj).forEach(([key, value]) => {
        const currentPath = path ? `${path}.${key}` : key;
        
        if (typeof value === 'string') {
          // Check if it contains what might be a raw image ID
          if (value.includes('ef5r64t9ehz15kw5hds8vm2t') || 
              (value.length === 24 && !value.includes('_') && value.match(/^[a-z0-9]+$/))) {
            console.log(`🎯 Potential raw image ID at ${currentPath}: ${value}`);
          }
        } else if (Array.isArray(value)) {
          value.forEach((item, index) => {
            searchForRawImages(item, `${currentPath}[${index}]`);
          });
        } else if (typeof value === 'object') {
          searchForRawImages(value, currentPath);
        }
      });
    };
    
    searchForRawImages(justGrokIt);
  }

  // 3. Check if there's a relationship through the designId
  console.log('\n📦 STEP 3: Looking for design relationships...\n');
  
  const designIdQuery = `*[_id == "v3f3qtskkwi3ieo5iyrfuhpo" || _type == "design" && _id == "v3f3qtskkwi3ieo5iyrfuhpo"]`;
  const designDoc = await sanityClient.fetch(designIdQuery);
  
  if (designDoc && designDoc.length > 0) {
    console.log('Found design document with matching ID:');
    console.log(JSON.stringify(designDoc, null, 2));
  } else {
    console.log('No separate design document found with ID v3f3qtskkwi3ieo5iyrfuhpo');
  }

  // 4. Query Cloudinary API pattern analysis
  console.log('\n📦 STEP 4: Analyzing Cloudinary URL patterns...\n');
  
  const productsWithImagesQuery = `*[_type == "product" && defined(mainImage.uri)][0...5] {
    title,
    designId,
    "mainImageUrl": mainImage.uri,
    "mainImageKey": mainImage._key,
    "mainImageTitle": mainImage.title,
    "secondaryUrls": secondaryImages[].uri,
    "secondaryKeys": secondaryImages[]._key,
    "variantImages": variants[0].images[0]
  }`;
  
  const productsWithImages = await sanityClient.fetch(productsWithImagesQuery);
  
  console.log('Analyzing Cloudinary URL patterns:\n');
  productsWithImages.forEach(product => {
    console.log(`📦 ${product.title}`);
    console.log(`   Design ID: ${product.designId}`);
    console.log(`   Main Image Key: ${product.mainImageKey}`);
    console.log(`   Main Image Title: ${product.mainImageTitle}`);
    
    if (product.mainImageUrl) {
      // Extract all IDs from the URL
      const urlParts = product.mainImageUrl.split('/');
      const filename = urlParts[urlParts.length - 1];
      const publicId = filename.split('.')[0];
      
      console.log(`   URL Public ID: ${publicId}`);
      
      // Check if the key contains additional info
      if (product.mainImageKey && product.mainImageKey !== publicId) {
        console.log(`   🎯 Key differs from URL: ${product.mainImageKey}`);
        
        // Parse the key for patterns
        const keyParts = product.mainImageKey.split('_');
        if (keyParts.length > 1) {
          console.log(`   Key parts: [${keyParts.join(', ')}]`);
          if (keyParts[0] !== product.designId) {
            console.log(`   🔥 First part differs from designId: ${keyParts[0]}`);
          }
        }
      }
    }
    console.log();
  });

  // 5. Check rawArtwork field specifically
  console.log('\n📦 STEP 5: Checking rawArtwork field...\n');
  
  const rawArtworkQuery = `*[_type == "product" && defined(rawArtwork)][0...3] {
    title,
    designId,
    rawArtwork,
    "expandedRawArtwork": rawArtwork[]{
      ...,
      asset->{
        _id,
        url,
        metadata
      }
    }
  }`;
  
  const productsWithRawArtwork = await sanityClient.fetch(rawArtworkQuery);
  
  if (productsWithRawArtwork && productsWithRawArtwork.length > 0) {
    console.log(`Found ${productsWithRawArtwork.length} products with rawArtwork!\n`);
    productsWithRawArtwork.forEach(product => {
      console.log(`📦 ${product.title}`);
      console.log('   Raw Artwork:', JSON.stringify(product.rawArtwork, null, 2));
      if (product.expandedRawArtwork) {
        console.log('   Expanded:', JSON.stringify(product.expandedRawArtwork, null, 2));
      }
      console.log();
    });
  } else {
    console.log('No products found with rawArtwork field populated.');
  }

  // 6. Try to find through Cloudinary API pattern
  console.log('\n📦 STEP 6: Cloudinary ID transformation patterns...\n');
  
  console.log('Based on your example:');
  console.log('- Design ID: v3f3qtskkwi3ieo5iyrfuhpo');
  console.log('- Raw Image ID: ef5r64t9ehz15kw5hds8vm2t');
  console.log('- Front Mockup: v3f3qtskkwi3ieo5iyrfuhpo_Front_main');
  console.log('- Back Mockup: v3f3qtskkwi3ieo5iyrfuhpo_Back_main');
  console.log('\nThe raw image ID appears to be different and not derivable from designId.');
  console.log('This suggests the raw images are either:');
  console.log('1. Stored in a separate Cloudinary folder structure');
  console.log('2. Referenced in a field we haven\'t found yet');
  console.log('3. Accessible via Cloudinary API using designId as metadata tag');
}

// Run the analysis
findRawDesignImages()
  .then(() => {
    console.log('\n✅ Analysis complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });