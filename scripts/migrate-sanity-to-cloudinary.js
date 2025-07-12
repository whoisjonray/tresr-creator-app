#!/usr/bin/env node

// Script to migrate garment images from Sanity to Cloudinary
// This fetches all productStyle documents and uploads their images to Cloudinary

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

// Function to build Sanity CDN URL
function buildSanityCdnUrl(ref) {
  if (!ref) return null;
  
  // If it's already a full URL, return it
  if (ref.startsWith('http')) return ref;
  
  // If it's a Sanity image reference, build the URL
  if (ref.includes('-')) {
    const [imageId, dimensions, format] = ref.split('-');
    return `https://cdn.sanity.io/images/${SANITY_PROJECT_ID}/${SANITY_DATASET}/${imageId}-${dimensions}.${format}`;
  }
  
  return ref;
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
    
    console.log(`✓ Uploaded: ${publicId} -> ${result.secure_url}`);
    return result.secure_url;
  } catch (error) {
    console.error(`✗ Failed to upload ${publicId}:`, error.message);
    return null;
  }
}

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

// Main migration function
async function migrateGarmentImages() {
  console.log('Fetching product styles from Sanity...');
  const productStyles = await fetchProductStyles();
  
  if (!productStyles || productStyles.length === 0) {
    console.log('No product styles found.');
    return;
  }
  
  console.log(`Found ${productStyles.length} product styles to process.`);
  
  const garmentMapping = {};
  
  for (const style of productStyles) {
    console.log(`\nProcessing: ${style.name} (${style.sku})`);
    
    // Skip if no SKU
    if (!style.sku) {
      console.log(`⚠️ Skipping ${style.name} - no SKU defined`);
      continue;
    }
    
    const garmentType = style.sku.toLowerCase().replace(/_/g, '-');
    garmentMapping[garmentType] = {};
    
    // Process parts (which contain the garment images)
    if (style.parts && style.parts.length > 0) {
      for (const part of style.parts) {
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
        
        // Process color variations
        if (part.imageForColor && part.imageForColor.length > 0) {
          for (const colorImage of part.imageForColor) {
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
    
    // Process display images if available
    if (style.displayImages && style.displayImages.length > 0) {
      for (let i = 0; i < style.displayImages.length; i++) {
        const displayImage = style.displayImages[i];
        if (displayImage && displayImage.url) {
          const publicId = `${garmentType}/display/image-${i}`;
          const cloudinaryUrl = await uploadToCloudinary(displayImage.url, publicId);
          
          if (!garmentMapping[garmentType]['display']) {
            garmentMapping[garmentType]['display'] = [];
          }
          garmentMapping[garmentType]['display'].push(cloudinaryUrl);
        }
      }
    }
  }
  
  // Save the mapping to a JSON file
  const outputPath = path.join(__dirname, '../client/src/config/garment-cloudinary-mapping.json');
  fs.writeFileSync(outputPath, JSON.stringify(garmentMapping, null, 2));
  
  console.log('\n✅ Migration complete!');
  console.log(`Garment mapping saved to: ${outputPath}`);
  
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
  
  // Fall back to placeholder
  if (garment.placeholder && garment.placeholder[side]) {
    return garment.placeholder[side];
  }
  
  return null;
};

// Get available colors for a garment type
export const getAvailableColors = (garmentType) => {
  const garment = GARMENT_IMAGES[garmentType];
  if (!garment) return [];
  
  return Object.keys(garment)
    .filter(key => key !== 'placeholder')
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