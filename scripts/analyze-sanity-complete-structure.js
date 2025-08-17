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

async function analyzeCompleteStructure() {
  console.log('🔍 COMPLETE SANITY STRUCTURE ANALYSIS');
  console.log('=====================================\n');

  // 1. First, get the specific "Just Grok It" product to understand its structure
  console.log('📦 STEP 1: Analyzing "Just Grok It - Banner Tee"...\n');
  
  const justGrokItQuery = `*[_type == "product" && title match "Just Grok It*"][0]`;
  const justGrokIt = await sanityClient.fetch(justGrokItQuery);
  
  if (justGrokIt) {
    console.log('Found product with Sanity ID:', justGrokIt._id);
    console.log('\n🔑 ALL FIELDS IN THIS PRODUCT:');
    console.log('================================');
    
    // Log every single field
    Object.keys(justGrokIt).forEach(key => {
      const value = justGrokIt[key];
      console.log(`\n📌 ${key}:`);
      
      if (value === null || value === undefined) {
        console.log('   [empty]');
      } else if (typeof value === 'object') {
        console.log('   Type:', Array.isArray(value) ? 'Array' : 'Object');
        console.log('   Value:', JSON.stringify(value, null, 2).substring(0, 500));
      } else {
        console.log('   Type:', typeof value);
        console.log('   Value:', value);
      }
    });
  }

  // 2. Now get ALL products with expanded references
  console.log('\n\n📦 STEP 2: Fetching ALL products with expanded fields...\n');
  
  const allProductsQuery = `*[_type == "product"] {
    _id,
    _type,
    _createdAt,
    _updatedAt,
    title,
    "slug": slug.current,
    description,
    
    // Direct image fields
    images,
    "expandedImages": images[]{
      _key,
      _type,
      asset->{
        _id,
        url,
        metadata
      }
    },
    
    // Design reference
    design->{
      _id,
      _type,
      name,
      "designImages": images,
      "cloudinaryId": cloudinaryId,
      "rawImages": rawImages,
      "mockups": mockups
    },
    
    // Raw artwork
    rawArtwork,
    "expandedRawArtwork": rawArtwork[]{
      _key,
      _type,
      asset->{
        _id,
        url,
        metadata
      },
      canvasData,
      cloudinaryId
    },
    
    // Creator/Person reference
    creator->{
      _id,
      name,
      slug,
      email
    },
    "creators": creators[]->{ 
      _id,
      name,
      email
    },
    
    // Product details
    productType,
    productStyles,
    isActive,
    tags,
    
    // Position data
    overlayTopLeft,
    overlayBottomRight,
    printAreaTopLeft,
    printAreaBottomRight,
    
    // Cloudinary specific fields
    cloudinaryId,
    cloudinaryUrls,
    cloudinaryData,
    
    // Other potential image fields
    thumbnail,
    featuredImage,
    mainImage,
    productImages,
    mockupImages,
    
    // Sales data
    sales,
    views,
    
    // Any other fields
    ...
  }[0...3]`; // Get first 3 for detailed analysis
  
  const products = await sanityClient.fetch(allProductsQuery);
  
  console.log(`\n📊 Found ${products.length} products for analysis\n`);
  
  // Analyze field patterns
  const fieldAnalysis = {};
  
  products.forEach((product, index) => {
    console.log(`\n📦 Product ${index + 1}: ${product.title}`);
    console.log('   Sanity ID:', product._id);
    
    Object.keys(product).forEach(key => {
      if (!fieldAnalysis[key]) {
        fieldAnalysis[key] = {
          occurrences: 0,
          hasValue: 0,
          sampleValues: [],
          types: new Set()
        };
      }
      
      fieldAnalysis[key].occurrences++;
      
      const value = product[key];
      if (value !== null && value !== undefined && 
          !(Array.isArray(value) && value.length === 0) &&
          !(typeof value === 'object' && Object.keys(value).length === 0)) {
        fieldAnalysis[key].hasValue++;
        
        // Store sample values
        if (fieldAnalysis[key].sampleValues.length < 2) {
          if (typeof value === 'string' && value.includes('cloudinary')) {
            fieldAnalysis[key].sampleValues.push(value);
          } else if (Array.isArray(value) && value.length > 0) {
            fieldAnalysis[key].sampleValues.push(`Array(${value.length}): ${JSON.stringify(value[0], null, 2).substring(0, 200)}`);
          } else if (typeof value === 'object') {
            fieldAnalysis[key].sampleValues.push(`Object: ${JSON.stringify(value, null, 2).substring(0, 200)}`);
          } else {
            fieldAnalysis[key].sampleValues.push(value);
          }
        }
        
        fieldAnalysis[key].types.add(Array.isArray(value) ? 'array' : typeof value);
      }
    });
  });
  
  // 3. Report findings
  console.log('\n\n📊 FIELD ANALYSIS REPORT');
  console.log('========================\n');
  
  console.log('🖼️ IMAGE-RELATED FIELDS:');
  Object.entries(fieldAnalysis).forEach(([field, analysis]) => {
    if (field.toLowerCase().includes('image') || 
        field.toLowerCase().includes('cloudinary') ||
        field.toLowerCase().includes('artwork') ||
        field.toLowerCase().includes('mockup') ||
        field.toLowerCase().includes('thumbnail')) {
      console.log(`\n📌 ${field}:`);
      console.log(`   Found in: ${analysis.occurrences}/${products.length} products`);
      console.log(`   Has value: ${analysis.hasValue}/${analysis.occurrences} times`);
      console.log(`   Types: ${Array.from(analysis.types).join(', ')}`);
      if (analysis.sampleValues.length > 0) {
        console.log('   Sample values:');
        analysis.sampleValues.forEach(val => {
          console.log(`     - ${typeof val === 'string' ? val.substring(0, 200) : val}`);
        });
      }
    }
  });
  
  // 4. Look for specific Cloudinary patterns
  console.log('\n\n🔍 CLOUDINARY URL PATTERNS:');
  console.log('============================\n');
  
  products.forEach(product => {
    const cloudinaryUrls = [];
    
    // Search all fields for Cloudinary URLs
    const searchObject = (obj, path = '') => {
      if (!obj) return;
      
      Object.entries(obj).forEach(([key, value]) => {
        const currentPath = path ? `${path}.${key}` : key;
        
        if (typeof value === 'string' && value.includes('cloudinary')) {
          cloudinaryUrls.push({ path: currentPath, url: value });
        } else if (Array.isArray(value)) {
          value.forEach((item, index) => {
            if (typeof item === 'string' && item.includes('cloudinary')) {
              cloudinaryUrls.push({ path: `${currentPath}[${index}]`, url: item });
            } else if (typeof item === 'object') {
              searchObject(item, `${currentPath}[${index}]`);
            }
          });
        } else if (typeof value === 'object') {
          searchObject(value, currentPath);
        }
      });
    };
    
    searchObject(product);
    
    if (cloudinaryUrls.length > 0) {
      console.log(`\n📦 ${product.title}:`);
      cloudinaryUrls.forEach(({ path, url }) => {
        console.log(`   ${path}: ${url}`);
        
        // Extract Cloudinary ID from URL
        const match = url.match(/\/([^\/]+)\.(jpg|png|webp)$/);
        if (match) {
          console.log(`     -> Cloudinary ID: ${match[1]}`);
        }
      });
    }
  });
  
  // 5. Specific query for memelord's products
  console.log('\n\n👤 MEMELORD PRODUCTS ANALYSIS:');
  console.log('================================\n');
  
  const memelordQuery = `*[_type == "product" && (
    references("k2r2aa8vmghuyr3he0p2eo5e") || 
    "k2r2aa8vmghuyr3he0p2eo5e" in creators[]._ref ||
    creator._ref == "k2r2aa8vmghuyr3he0p2eo5e"
  )][0...5] {
    _id,
    title,
    "allImageFields": {
      "images": images,
      "rawArtwork": rawArtwork,
      "cloudinaryId": cloudinaryId,
      "cloudinaryUrls": cloudinaryUrls,
      "thumbnail": thumbnail,
      "featuredImage": featuredImage,
      "mainImage": mainImage,
      "productImages": productImages,
      "mockupImages": mockupImages
    },
    "expandedRawArtwork": rawArtwork[]{
      _key,
      _type,
      asset->{
        _id,
        url
      },
      canvasData,
      cloudinaryId,
      cloudinaryUrl
    }
  }`;
  
  const memelordProducts = await sanityClient.fetch(memelordQuery);
  
  console.log(`Found ${memelordProducts.length} memelord products\n`);
  
  memelordProducts.forEach(product => {
    console.log(`\n📦 ${product.title}`);
    console.log('   Sanity ID:', product._id);
    console.log('   Image fields with values:');
    
    Object.entries(product.allImageFields).forEach(([field, value]) => {
      if (value && !(Array.isArray(value) && value.length === 0)) {
        console.log(`     ${field}:`, JSON.stringify(value, null, 2).substring(0, 300));
      }
    });
    
    if (product.expandedRawArtwork && product.expandedRawArtwork.length > 0) {
      console.log('   Expanded Raw Artwork:');
      product.expandedRawArtwork.forEach((artwork, i) => {
        console.log(`     [${i}]:`, JSON.stringify(artwork, null, 2).substring(0, 300));
      });
    }
  });
}

// Run the analysis
analyzeCompleteStructure()
  .then(() => {
    console.log('\n✅ Analysis complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });