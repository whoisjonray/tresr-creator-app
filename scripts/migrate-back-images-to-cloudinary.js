#!/usr/bin/env node

// Script to migrate BACK images from Sanity to Cloudinary
// This complements the existing front images

const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Dynamic import for node-fetch (ES module)
let fetch;
(async () => {
  const module = await import('node-fetch');
  fetch = module.default;
})();

// Cloudinary configuration from your .env
cloudinary.config({
  cloud_name: 'dqslerzk9',
  api_key: '364274988183368',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'gJEAx4VjStv1uTKyi3DiLAwL8pQ'
});

// Sanity configuration
const SANITY_PROJECT_ID = 'a9vtdosx';
const SANITY_DATASET = 'production';
const SANITY_API_VERSION = '2024-01-01';

// GROQ query to fetch all productStyles with their BACK images specifically
const query = `*[_type == "productStyle"] {
  _id,
  name,
  sku,
  "backPart": parts[title == "Back"][0] {
    title,
    "mainImage": mainImage.asset->{
      url,
      _id
    },
    imageForColor[] {
      "color": color->{
        _id,
        name,
        hex,
        sku
      },
      "image": image.asset->{
        url,
        _id
      }
    }
  }
}[defined(backPart)]`;

// Function to fetch product styles from Sanity
async function fetchProductStyles() {
  const encodedQuery = encodeURIComponent(query);
  const url = `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}?query=${encodedQuery}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error('Failed to fetch from Sanity:', error);
    return [];
  }
}

// Function to upload image to Cloudinary
async function uploadToCloudinary(imageUrl, publicId, folder = 'garments') {
  try {
    const result = await cloudinary.uploader.upload(imageUrl, {
      public_id: publicId,
      folder: folder,
      overwrite: true,
      resource_type: 'image'
    });
    
    console.log(`✓ Uploaded: ${publicId}`);
    return result.secure_url;
  } catch (error) {
    console.error(`✗ Failed to upload ${publicId}:`, error.message);
    return null;
  }
}

// Process back images for a product style
async function processBackImages(style, backMapping) {
  console.log(`\nProcessing back images for: ${style.name} (${style.sku})`);
  
  if (!style.sku || !style.backPart) {
    console.log(`⚠️ Skipping ${style.name} - no SKU or back part`);
    return;
  }
  
  const garmentType = style.sku.toLowerCase().replace(/_/g, '-');
  
  // Initialize structure if needed
  if (!backMapping[garmentType]) {
    backMapping[garmentType] = {};
  }
  
  const part = style.backPart;
  
  // Process main back image
  if (part.mainImage && part.mainImage.url) {
    const publicId = `${garmentType}/back/main`;
    const cloudinaryUrl = await uploadToCloudinary(part.mainImage.url, publicId);
    
    if (!backMapping[garmentType]['back']) {
      backMapping[garmentType]['back'] = {};
    }
    backMapping[garmentType]['back']['main'] = cloudinaryUrl;
  }
  
  // Process color variations
  if (part.imageForColor && part.imageForColor.length > 0) {
    for (const colorImage of part.imageForColor) {
      if (colorImage.color && colorImage.image && colorImage.image.url) {
        const colorSlug = colorImage.color.name.toLowerCase().replace(/\s+/g, '-');
        const publicId = `${garmentType}/back/${colorSlug}`;
        const cloudinaryUrl = await uploadToCloudinary(colorImage.image.url, publicId);
        
        if (!backMapping[garmentType][colorSlug]) {
          backMapping[garmentType][colorSlug] = {};
        }
        backMapping[garmentType][colorSlug]['back'] = cloudinaryUrl;
      }
    }
  }
}

// Main migration function
async function migrateBackImages() {
  console.log('Fetching product styles with back images from Sanity...');
  const productStyles = await fetchProductStyles();
  
  if (!productStyles || productStyles.length === 0) {
    console.log('No product styles with back images found.');
    return;
  }
  
  console.log(`Found ${productStyles.length} product styles with back images to process.`);
  
  // Load existing garment images configuration
  const configPath = path.join(__dirname, '../client/src/config/garmentImagesCloudinary.js');
  const configContent = fs.readFileSync(configPath, 'utf8');
  
  // Extract the current GARMENT_IMAGES object
  const match = configContent.match(/export const GARMENT_IMAGES = ({[\s\S]*?});/);
  if (!match) {
    console.error('Could not parse existing garment images configuration');
    return;
  }
  
  // Parse the existing configuration
  const existingConfig = eval('(' + match[1] + ')');
  
  // Process all styles with back images
  const backMapping = {};
  for (const style of productStyles) {
    await processBackImages(style, backMapping);
  }
  
  // Merge back images into existing configuration
  console.log('\nMerging back images into existing configuration...');
  const mergedConfig = JSON.parse(JSON.stringify(existingConfig)); // Deep clone
  
  for (const [garmentType, garmentData] of Object.entries(backMapping)) {
    if (!mergedConfig[garmentType]) {
      mergedConfig[garmentType] = {};
    }
    
    // Merge each color/part
    for (const [key, value] of Object.entries(garmentData)) {
      if (!mergedConfig[garmentType][key]) {
        mergedConfig[garmentType][key] = {};
      }
      Object.assign(mergedConfig[garmentType][key], value);
    }
  }
  
  // Generate updated configuration file
  generateUpdatedConfig(mergedConfig);
  
  console.log('\n✅ Back image migration complete!');
}

// Generate updated garmentImagesCloudinary.js file
function generateUpdatedConfig(mergedConfig) {
  const configContent = `// Auto-generated garment image configuration from Sanity migration
// Generated on: ${new Date().toISOString()}
// Now includes BACK images!

export const GARMENT_IMAGES = ${JSON.stringify(mergedConfig, null, 2)};

// Helper function to get garment image
export const getGarmentImage = (garmentType, color, side = 'front') => {
  const garment = GARMENT_IMAGES[garmentType];
  if (!garment) return null;
  
  // Try exact color match
  const colorSlug = color.toLowerCase().replace(/\\s+/g, '-');
  if (garment[colorSlug] && garment[colorSlug][side]) {
    return garment[colorSlug][side];
  }
  
  // Fall back to default/main image
  if (garment[side] && garment[side].main) {
    return garment[side].main;
  }
  
  // Fall back to front if back not available
  if (side === 'back' && garment.front && garment.front.main) {
    return garment.front.main;
  }
  
  // Fall back to any available image
  const firstPart = Object.keys(garment).find(key => garment[key].main);
  if (firstPart && garment[firstPart].main) {
    return garment[firstPart].main;
  }
  
  return null;
};

// Get available colors for a garment type
export const getAvailableColors = (garmentType) => {
  const garment = GARMENT_IMAGES[garmentType];
  if (!garment) return [];
  
  return Object.keys(garment)
    .filter(key => key !== 'front' && key !== 'back' && key !== 'display')
    .map(slug => ({
      slug,
      name: slug.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ')
    }));
};
`;
  
  const configPath = path.join(__dirname, '../client/src/config/garmentImagesCloudinary.js');
  fs.writeFileSync(configPath, configContent);
  console.log(`\n✅ Updated config file: ${configPath}`);
}

// Run after fetch is loaded
setTimeout(async () => {
  if (!fetch) {
    console.error('Failed to load node-fetch');
    process.exit(1);
  }
  await migrateBackImages().catch(console.error);
}, 100);