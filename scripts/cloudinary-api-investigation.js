const cloudinary = require('cloudinary').v2;
const { createClient } = require('@sanity/client');
require('dotenv').config({ path: '../.env' });

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'dqslerzk9',
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

async function investigateCloudinary() {
  console.log('🔍 CLOUDINARY API INVESTIGATION');
  console.log('================================\n');

  // 1. First, check if we can connect to Cloudinary
  console.log('📦 STEP 1: Testing Cloudinary connection...\n');
  
  try {
    const result = await cloudinary.api.ping();
    console.log('✅ Cloudinary connection successful:', result);
  } catch (error) {
    console.log('❌ Cloudinary connection failed. Checking if API keys are set...');
    console.log('   CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? 'Set' : 'NOT SET');
    console.log('   CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? 'Set' : 'NOT SET');
    
    if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.log('\n⚠️ Cloudinary API keys not found in .env file.');
      console.log('To use Cloudinary API, add these to your .env:');
      console.log('CLOUDINARY_API_KEY=your_api_key');
      console.log('CLOUDINARY_API_SECRET=your_api_secret');
      console.log('\nFor now, we\'ll analyze the URL patterns...\n');
    }
  }

  // 2. Analyze the known Cloudinary URLs to find patterns
  console.log('\n📦 STEP 2: Analyzing known Cloudinary URLs...\n');
  
  const knownUrls = {
    'Just Grok It': {
      designId: 'v3f3qtskkwi3ieo5iyrfuhpo',
      mainImageUrl: 'https://res.cloudinary.com/dqslerzk9/image/upload/v1740958396/products/k2r2aa8vmghuyr3he0p2eo5e/j4oapq7bcs2y75v9nrmn.png',
      backImageUrl: 'https://res.cloudinary.com/dqslerzk9/image/upload/v1740958396/products/k2r2aa8vmghuyr3he0p2eo5e/sbb8ghkchqoctgczxeoo.png',
      rawImageId: 'ef5r64t9ehz15kw5hds8vm2t' // You mentioned this
    }
  };
  
  console.log('Known patterns:');
  Object.entries(knownUrls).forEach(([product, data]) => {
    console.log(`\n${product}:`);
    console.log(`  Design ID: ${data.designId}`);
    
    // Parse main image URL
    const mainParts = data.mainImageUrl.split('/');
    const mainPublicId = mainParts.slice(-2).join('/').replace('.png', '');
    console.log(`  Main Image Public ID: ${mainPublicId}`);
    
    // Parse back image URL
    const backParts = data.backImageUrl.split('/');
    const backPublicId = backParts.slice(-2).join('/').replace('.png', '');
    console.log(`  Back Image Public ID: ${backPublicId}`);
    
    console.log(`  Raw Image ID (from your info): ${data.rawImageId}`);
    
    // Check if there's a pattern
    console.log('\n  Analysis:');
    console.log(`  - Main mockup uses: j4oapq7bcs2y75v9nrmn`);
    console.log(`  - Back mockup uses: sbb8ghkchqoctgczxeoo`);
    console.log(`  - Raw design uses: ${data.rawImageId}`);
    console.log(`  - All are in folder: products/k2r2aa8vmghuyr3he0p2eo5e`);
  });

  // 3. Try to use Cloudinary API if available
  if (process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    console.log('\n📦 STEP 3: Searching Cloudinary for related images...\n');
    
    try {
      // Search for resources with the design ID as metadata
      const searchByMetadata = await cloudinary.search
        .expression('tags=v3f3qtskkwi3ieo5iyrfuhpo OR context.designId=v3f3qtskkwi3ieo5iyrfuhpo')
        .max_results(10)
        .execute();
      
      console.log('Search by design ID metadata:');
      if (searchByMetadata.resources && searchByMetadata.resources.length > 0) {
        searchByMetadata.resources.forEach(resource => {
          console.log(`  - ${resource.public_id}: ${resource.url}`);
        });
      } else {
        console.log('  No resources found with design ID as metadata');
      }
      
      // Search in the specific folder
      const searchInFolder = await cloudinary.search
        .expression('folder:products/k2r2aa8vmghuyr3he0p2eo5e')
        .max_results(20)
        .execute();
      
      console.log('\nAll images in creator folder:');
      if (searchInFolder.resources && searchInFolder.resources.length > 0) {
        searchInFolder.resources.forEach(resource => {
          const filename = resource.public_id.split('/').pop();
          console.log(`  - ${filename}`);
          
          // Check if it matches our known patterns
          if (filename === 'ef5r64t9ehz15kw5hds8vm2t') {
            console.log('    🎯 This is the raw design image!');
          }
        });
      }
      
      // Try to get resource details for the raw image
      console.log('\nTrying to fetch raw image directly:');
      try {
        const rawImage = await cloudinary.api.resource('products/k2r2aa8vmghuyr3he0p2eo5e/ef5r64t9ehz15kw5hds8vm2t');
        console.log('✅ Found raw image:', rawImage.url);
        console.log('   Metadata:', rawImage.context || 'none');
        console.log('   Tags:', rawImage.tags || 'none');
      } catch (error) {
        console.log('❌ Could not fetch raw image directly');
      }
      
    } catch (error) {
      console.log('Error searching Cloudinary:', error.message);
    }
  }

  // 4. Check what's actually being saved in our database
  console.log('\n📦 STEP 4: Checking what\'s in our database after import...\n');
  
  const mysql = require('mysql2/promise');
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.MYSQLHOST || 'localhost',
      user: process.env.MYSQLUSER || 'root',
      password: process.env.MYSQLPASSWORD || '',
      database: process.env.MYSQLDATABASE || 'tresr_creator'
    });
    
    const [designs] = await connection.execute(
      'SELECT id, name, thumbnail_url, front_design_url, back_design_url, sanity_id FROM designs WHERE name LIKE "%Grok%"'
    );
    
    console.log('Designs in database with "Grok" in name:');
    designs.forEach(design => {
      console.log(`\n${design.name} (${design.id}):`);
      console.log(`  Sanity ID: ${design.sanity_id}`);
      console.log(`  Thumbnail: ${design.thumbnail_url || 'EMPTY'}`);
      console.log(`  Front: ${design.front_design_url || 'EMPTY'}`);
      console.log(`  Back: ${design.back_design_url || 'EMPTY'}`);
    });
    
    await connection.end();
  } catch (error) {
    console.log('Could not connect to database:', error.message);
  }

  // 5. Proposed solution
  console.log('\n📦 STEP 5: Proposed Solution\n');
  console.log('Based on the analysis:');
  console.log('1. The raw design images have different IDs than the mockups');
  console.log('2. They appear to be in the same Cloudinary folder');
  console.log('3. The relationship might be:');
  console.log('   - Store the designId from Sanity');
  console.log('   - Use Cloudinary API to search for all images with that designId as metadata');
  console.log('   - OR maintain a mapping table of designId -> rawImageId');
  console.log('\nFor the immediate thumbnail issue:');
  console.log('- The mainImage.uri field contains the correct URL');
  console.log('- We need to ensure it\'s being saved to thumbnail_url in the database');
  console.log('- Then verify the frontend is displaying it correctly');
}

// Run the investigation
investigateCloudinary()
  .then(() => {
    console.log('\n✅ Investigation complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });