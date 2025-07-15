#!/usr/bin/env node

const cloudinary = require('cloudinary').v2;
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dqslerzk9',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Base path for garment images
const GARMENT_BASE_PATH = '/Users/user/Documents/TRESR Shopify/TRESR Branded Blanks - New';

// Garment configurations with priority products first
const garmentConfig = {
  'boxy': {
    name: 'Oversized Drop Shoulder',
    folder: 'boxy-oversized-drop-shoulder',
    colors: [
      { fileFront: 'Black-2000x2000-PS-ShakaWear-7.5ozMaxHeavyweightTShirt-F1', fileBack: 'Black-2000x2000-PS-ShakaWear-7.5ozMaxHeavyweightTShirt-B1', color: 'black' },
      { fileFront: 'Cardinal-Red-2000x2000-PS-ShakaWear-7.5ozMaxHeavyweightTShirt-F1', fileBack: 'Cardinal-Red-2000x2000-PS-ShakaWear-7.5ozMaxHeavyweightTShirt-B1', color: 'cardinal-red' },
      { fileFront: 'Heather-Grey-2000x2000-PS-ShakaWear-7.5ozMaxHeavyweightTShirt-F1', fileBack: 'Dark-Heather-Grey-2000x2000-PS-ShakaWear-7.5ozMaxHeavyweightTShirt-B1', color: 'heather-grey' },
      { fileFront: 'Natural-2000x2000-PS-ShakaWear-7.5ozMaxHeavyweightTShirt-F1', fileBack: 'Natural-2000x2000-PS-ShakaWear-7.5ozMaxHeavyweightTShirt-B1', color: 'natural' },
      { fileFront: 'Navy-2000x2000-PS-ShakaWear-7.5ozMaxHeavyweightTShirt-F1', fileBack: 'Navy-2000x2000-PS-ShakaWear-7.5ozMaxHeavyweightTShirt-B1', color: 'navy' },
      { fileFront: 'White-2000x2000-PS-ShakaWear-7.5ozMaxHeavyweightTShirt-F1', fileBack: 'White-2000x2000-PS-ShakaWear-7.5ozMaxHeavyweightTShirt-B1', color: 'white' }
    ],
    frontPath: 'Front Shaka Wear 7.5oz PNG',
    backPath: 'Back Shaka Wear 7.5oz  PNG',
    extension: '.png'
  },
  'next-crop': {
    name: 'Next Level Crop Top',
    folder: 'Women_s Crop Tee',
    colors: [
      { file: 'Black-2000x2000-PS-NextLevel-Womens-Ideal-Crop-Top-1580-F1', color: 'black', front: true },
      { file: 'Black-2000x2000-Next-Level-Womens-Ideal-Crop-Top-1580-B1', color: 'black', back: true },
      { file: 'White-2000x2000-PS-NextLevel-Womens-Ideal-Crop-Top-1580-F1', color: 'white', front: true },
      { file: 'White-Next-Level-Womens-Ideal-Crop-Top-1580-B1', color: 'white', back: true },
      { file: 'Grey-Heather-2000x2000-PS-NextLevel-Womens-Ideal-Crop-Top-1580-F1', color: 'grey-heather', front: true },
      { file: 'Grey-Heather-2000x2000-Next-Level-Womens-Ideal-Crop-Top-1580-B1', color: 'grey-heather', back: true },
      { file: 'Midnight-Navy-2000x2000-PS-NextLevel-Womens-Ideal-Crop-Top-1580-F1', color: 'midnight-navy', front: true },
      { file: 'Midnight-Navy-2000x2000-Next-Level-Womens-Ideal-Crop-Top-1580-B1', color: 'midnight-navy', back: true },
      { file: 'Red-2000x2000-PS-NextLevel-Womens-Ideal-Crop-Top-1580-F1', color: 'red', front: true },
      { file: 'Red-2000x2000-Next-Level-Womens-Ideal-Crop-Top-1580-B1', color: 'red', back: true }
    ],
    frontPath: 'Next Level - Women_s Ideal Crop Top - 1580 - Front - PNG',
    backPath: 'Next Level - Women_s Ideal Crop Top - 1580 - Back - PNG',
    extension: '.png'
  },
  'polo': {
    name: 'Standard Polo',
    folder: 'Logo Polo',
    colors: [
      { file: 'Deep-Black-2000x2000--Port-Authority---Micro-Mesh-Polo-F1', color: 'black' },
      { file: 'White-2000x2000--Port-Authority---Micro-Mesh-Polo-F1', color: 'white' },
      { file: 'River-Blue-Navy-2000x2000--Port-Authority---Micro-Mesh-Polo-F1', color: 'navy' },
      { file: 'Rich-Red-2000x2000--Port-Authority---Micro-Mesh-Polo-F1', color: 'red' },
      { file: 'Graphite-2000x2000--Port-Authority---Micro-Mesh-Polo-F1', color: 'graphite' }
    ],
    frontPath: 'Port-Authority---Micro-Mesh-Polo K110 - Front PNG',
    backPath: 'Port-Authority---Micro-Mesh-Polo K110 - Back PNG',
    extension: '.png'
  },
  'mediu': {
    name: 'Medium Weight Sweatshirt',
    folder: 'Medium Weight Sweatshirt',
    colors: [
      { file: 'Black-Sweater-Front-NFTreasure-Independent-SS3000-F1', color: 'black' },
      { file: 'White-Sweater-Front-NFTreasure-Independent-SS3000-F1', color: 'white' },
      { file: 'Classic-Navy-Sweater-Front-NFTreasure-Independent-SS3000-F1', color: 'navy' },
      { file: 'Red-Sweater-Front-NFTreasure-Independent-SS3000-F1', color: 'red' },
      { file: 'Grey-Heather-Sweater-Front-NFTreasure-Independent-SS3000-F1', color: 'grey-heather' }
    ],
    frontPath: 'Sweater Front Transparent PNG',
    backPath: 'Sweater Back Transparent PNG 2000x2000',
    extension: '.png'
  },
  'tee': {
    name: 'Medium Weight T-Shirt',
    folder: 'tee-medium-weight-tshirt',
    colors: [
      { file: 'Black-Back-T-shirt-Nftreasure-2000-x-2000-', color: 'black' },
      { file: 'Cardinal-Red-Back-T-shirt-Nftreasure-2000-x-2000-', color: 'cardinal-red' },
      { file: 'Dark-Heather-Grey-Back-T-shirt-Nftreasure-2000-x-2000-', color: 'dark-heather-grey' },
      { file: 'Natural-Back-T-shirt-Nftreasure-2000-x-2000-', color: 'natural' },
      { file: 'White-Back-T-shirt-Nftreasure-2000-x-2000-', color: 'white' }
    ],
    frontPath: null, // Front images seem to be missing
    backPath: 'Back Next Level Tee Blank PNG 2000x2000',
    extension: '.png'
  },
  'med-hood': {
    name: 'Medium Weight Hoodie',
    folder: 'Hoodie',
    colors: [
      { file: 'Black-Hoody-Front-NFTreasure-PS-Independent-IND4000-F1', color: 'black' },
      { file: 'White-Hoody-Front-NFTreasure-PS-Independent-IND4000-F1', color: 'white' },
      { file: 'Gold-Hoody-Front-NFTreasure-PS-Independent-IND4000-F1', color: 'gold' },
      { file: 'Red-Hoody-Front-NFTreasure-PS-Independent-IND4000-F1', color: 'red' },
      { file: 'Classic-Navy-Hoody-Front-NFTreasure-PS-Independent-IND4000-F1', color: 'navy' }
    ],
    frontPath: 'Hoodie Front Transparent PNG',
    backPath: 'Hoodie Back PNG Transparent 2000x2000',
    extension: '.png'
  },
  'patch-c': {
    name: 'Patch Hat - Curved',
    folder: 'Patch Hat',
    colors: [
      { file: '1. Patch Hat - Curved Brim - Black', color: 'black' },
      { file: '1. Patch Hat - Curved Brim - Grey', color: 'grey' }
    ],
    frontPath: '',
    backPath: null,
    extension: '.png'
  },
  'patch-flat': {
    name: 'Patch Hat - Flat',
    folder: 'Patch Hat',
    colors: [
      { file: '2. Patch Hat - Flat Brim - Black', color: 'black' },
      { file: '2. Patch Hat - Flat Brim - Navy', color: 'navy' }
    ],
    frontPath: '',
    backPath: null,
    extension: '.png'
  }
};

// Upload results storage
const uploadResults = [];
let totalUploaded = 0;
let totalFailed = 0;

async function uploadGarmentImage(filePath, productId, colorName, side) {
  try {
    console.log(`📤 Uploading: ${productId} - ${colorName} - ${side}`);
    
    const publicId = `${productId}_${colorName}_${side}`;
    
    const result = await cloudinary.uploader.upload(filePath, {
      public_id: publicId,
      folder: 'tresr-garments',
      resource_type: 'image',
      overwrite: true,
      tags: ['garment', productId, colorName, side],
      context: {
        productId,
        colorName,
        side,
        productName: garmentConfig[productId]?.name || productId
      },
      transformation: [
        { width: 2000, height: 2000, crop: 'limit' },
        { quality: 'auto:best' },
        { fetch_format: 'auto' }
      ]
    });
    
    totalUploaded++;
    
    return {
      success: true,
      publicId: result.public_id,
      url: result.secure_url,
      productId,
      colorName,
      side,
      width: result.width,
      height: result.height,
      bytes: result.bytes
    };
  } catch (error) {
    console.error(`❌ Failed to upload ${productId} - ${colorName} - ${side}:`, error.message);
    totalFailed++;
    return {
      success: false,
      productId,
      colorName,
      side,
      error: error.message
    };
  }
}

async function processGarmentProduct(productId, config) {
  console.log(`\n🎨 Processing ${config.name} (${productId})...`);
  
  const results = [];
  
  for (const colorConfig of config.colors) {
    // Determine sides based on config
    const sides = [];
    
    if (colorConfig.front !== false && config.frontPath !== null) {
      sides.push({ side: 'front', path: config.frontPath || '' });
    }
    
    if (colorConfig.back !== false && config.backPath !== null) {
      sides.push({ side: 'back', path: config.backPath || '' });
    }
    
    // For items like hats that don't have front/back distinction
    if (!config.frontPath && !config.backPath) {
      sides.push({ side: 'front', path: '' });
    }
    
    for (const { side, path: subPath } of sides) {
      // Determine the correct filename based on side
      let fileBase;
      if (side === 'front' && colorConfig.fileFront) {
        fileBase = colorConfig.fileFront;
      } else if (side === 'back' && colorConfig.fileBack) {
        fileBase = colorConfig.fileBack;
      } else if (colorConfig.file) {
        fileBase = colorConfig.file;
      } else {
        console.warn(`⚠️ No file defined for ${productId} - ${colorConfig.color} - ${side}`);
        continue;
      }
      
      const fileName = `${fileBase}${config.extension}`;
      const filePath = path.join(GARMENT_BASE_PATH, config.folder, subPath, fileName);
      
      try {
        // Check if file exists
        await fs.access(filePath);
        
        const result = await uploadGarmentImage(
          filePath,
          productId,
          colorConfig.color,
          side
        );
        
        results.push(result);
        uploadResults.push(result);
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.warn(`⚠️ File not found: ${filePath}`);
        const notFoundResult = {
          success: false,
          productId,
          colorName: colorConfig.color,
          side,
          error: 'File not found',
          filePath
        };
        results.push(notFoundResult);
        uploadResults.push(notFoundResult);
        totalFailed++;
      }
    }
  }
  
  return results;
}

async function uploadAllGarments() {
  console.log('🚀 Starting TRESR garment image upload to Cloudinary...\n');
  console.log('📋 Priority products will be uploaded first:\n');
  
  // Define upload order - priority products first
  const uploadOrder = ['boxy', 'next-crop', 'polo', 'mediu', 'tee', 'med-hood', 'patch-c', 'patch-flat'];
  
  for (const productId of uploadOrder) {
    if (garmentConfig[productId]) {
      await processGarmentProduct(productId, garmentConfig[productId]);
    }
  }
  
  // Generate summary report
  await generateReport();
}

async function generateReport() {
  console.log('\n📊 Upload Summary:');
  console.log(`✅ Successfully uploaded: ${totalUploaded} images`);
  console.log(`❌ Failed uploads: ${totalFailed} images`);
  
  // Group results by product
  const productGroups = {};
  uploadResults.forEach(result => {
    if (!productGroups[result.productId]) {
      productGroups[result.productId] = {
        name: garmentConfig[result.productId]?.name || result.productId,
        successful: [],
        failed: []
      };
    }
    
    if (result.success) {
      productGroups[result.productId].successful.push(result);
    } else {
      productGroups[result.productId].failed.push(result);
    }
  });
  
  // Generate detailed report
  let report = `# TRESR Garment Images Upload Report
  
Generated: ${new Date().toISOString()}
Total Uploads Attempted: ${uploadResults.length}
Successful: ${totalUploaded}
Failed: ${totalFailed}

## Upload Results by Product

`;
  
  for (const [productId, group] of Object.entries(productGroups)) {
    report += `\n### ${group.name} (${productId})\n`;
    report += `- ✅ Successful: ${group.successful.length}\n`;
    report += `- ❌ Failed: ${group.failed.length}\n\n`;
    
    if (group.successful.length > 0) {
      report += `#### Successfully Uploaded:\n`;
      group.successful.forEach(result => {
        report += `- ${result.colorName} (${result.side}): ${result.url}\n`;
      });
      report += '\n';
    }
    
    if (group.failed.length > 0) {
      report += `#### Failed Uploads:\n`;
      group.failed.forEach(result => {
        report += `- ${result.colorName} (${result.side}): ${result.error}\n`;
        if (result.filePath) {
          report += `  File path: ${result.filePath}\n`;
        }
      });
      report += '\n';
    }
  }
  
  // Add usage examples
  report += `\n## Usage in Application

### React Component Example:
\`\`\`jsx
// Garment image URL pattern
const getGarmentImage = (productId, color, side = 'front') => {
  return \`https://res.cloudinary.com/dqslerzk9/image/upload/tresr-garments/\${productId}_\${color}_\${side}.png\`;
};

// Usage
<img src={getGarmentImage('boxy', 'black', 'front')} alt="Oversized Drop Shoulder - Black" />
\`\`\`

### Direct URLs for Priority Products:
`;

  // Add direct URLs for priority products
  const priorityProducts = ['boxy', 'next-crop', 'polo', 'mediu'];
  priorityProducts.forEach(productId => {
    if (productGroups[productId] && productGroups[productId].successful.length > 0) {
      report += `\n#### ${productGroups[productId].name}:\n`;
      productGroups[productId].successful.slice(0, 3).forEach(result => {
        report += `- ${result.colorName} (${result.side}): ${result.url}\n`;
      });
    }
  });
  
  // Save report
  const reportPath = path.join(__dirname, '../docs/garment-images-cloudinary-report.md');
  await fs.writeFile(reportPath, report);
  console.log(`\n✅ Report saved to: ${reportPath}`);
  
  // Also save JSON data for programmatic use
  const jsonData = {
    generated: new Date().toISOString(),
    stats: {
      total: uploadResults.length,
      successful: totalUploaded,
      failed: totalFailed
    },
    products: productGroups,
    baseFolder: 'tresr-garments'
  };
  
  const jsonPath = path.join(__dirname, '../docs/garment-images-cloudinary.json');
  await fs.writeFile(jsonPath, JSON.stringify(jsonData, null, 2));
  console.log(`✅ JSON data saved to: ${jsonPath}`);
}

// Run the upload
uploadAllGarments().catch(console.error);