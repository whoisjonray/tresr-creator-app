#!/usr/bin/env node

// Batch script to migrate garment images from Sanity to Cloudinary
// Processes in smaller batches to avoid timeouts

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

// GROQ query to fetch all productStyles with their images
const query = `*[_type == "productStyle"] {
  _id,
  name,
  sku,
  "colors": colors[]->{
    _id,
    name,
    hex,
    sku
  },
  parts[] {
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
  },
  templateDetails,
  displayImages[] {
    "url": asset->url,
    "_id": asset->_id
  }
}`;

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

// Process a single product style
async function processProductStyle(style, garmentMapping) {
  console.log(`\nProcessing: ${style.name} (${style.sku})`);
  
  // Skip if no SKU
  if (!style.sku) {
    console.log(`⚠️ Skipping ${style.name} - no SKU defined`);
    return;
  }
  
  const garmentType = style.sku.toLowerCase().replace(/_/g, '-');
  if (!garmentMapping[garmentType]) {
    garmentMapping[garmentType] = {};
  }
  
  // Process parts (which contain the garment images)
  if (style.parts && style.parts.length > 0) {
    // Only process the first part for each style to reduce uploads
    const part = style.parts[0];
    const partName = part.title ? part.title.toLowerCase().replace(/\s+/g, '-') : 'default';
    
    // Process main image
    if (part.mainImage && part.mainImage.url) {
      const publicId = `${garmentType}/${partName}/main`;
      const cloudinaryUrl = await uploadToCloudinary(part.mainImage.url, publicId);
      
      if (!garmentMapping[garmentType][partName]) {
        garmentMapping[garmentType][partName] = {};
      }
      garmentMapping[garmentType][partName]['main'] = cloudinaryUrl;
    }
    
    // Process up to 5 color variations to reduce time
    if (part.imageForColor && part.imageForColor.length > 0) {
      const colorsToProcess = part.imageForColor.slice(0, 5);
      for (const colorImage of colorsToProcess) {
        if (colorImage.color && colorImage.image && colorImage.image.url) {
          const colorSlug = colorImage.color.name.toLowerCase().replace(/\s+/g, '-');
          const publicId = `${garmentType}/${partName}/${colorSlug}`;
          const cloudinaryUrl = await uploadToCloudinary(colorImage.image.url, publicId);
          
          if (!garmentMapping[garmentType][colorSlug]) {
            garmentMapping[garmentType][colorSlug] = {};
          }
          garmentMapping[garmentType][colorSlug][partName] = cloudinaryUrl;
        }
      }
    }
  }
}

// Main migration function
async function migrateGarmentImages() {
  console.log('Fetching product styles from Sanity...');
  const productStyles = await fetchProductStyles();
  
  if (!productStyles || productStyles.length === 0) {
    console.log('No product styles found.');
    return;
  }
  
  console.log(`Found ${productStyles.length} product styles to process.`);
  
  // Load existing mapping if it exists
  const mappingPath = path.join(__dirname, '../client/src/config/garment-cloudinary-mapping.json');
  let garmentMapping = {};
  
  if (fs.existsSync(mappingPath)) {
    garmentMapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
    console.log('Loaded existing mapping.');
  }
  
  // Process all styles
  const stylesToProcess = productStyles;
  
  for (const style of stylesToProcess) {
    await processProductStyle(style, garmentMapping);
  }
  
  // Save the mapping to a JSON file
  fs.writeFileSync(mappingPath, JSON.stringify(garmentMapping, null, 2));
  
  console.log('\n✅ Batch complete!');
  console.log(`Garment mapping saved to: ${mappingPath}`);
  
  // Generate the updated garmentImages.js file
  generateGarmentImagesConfig(garmentMapping);
}

// Generate updated garmentImages.js configuration
function generateGarmentImagesConfig(mapping) {
  const configContent = `// Auto-generated garment image configuration from Sanity migration
// Generated on: ${new Date().toISOString()}

export const GARMENT_IMAGES = ${JSON.stringify(mapping, null, 2)};

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
  if (garment.front && garment.front.main) {
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
  console.log(`\n✅ Generated config file: ${configPath}`);
}

// Run the migration after fetch is loaded
setTimeout(async () => {
  if (!fetch) {
    console.error('Failed to load node-fetch');
    process.exit(1);
  }
  await migrateGarmentImages().catch(console.error);
}, 100);