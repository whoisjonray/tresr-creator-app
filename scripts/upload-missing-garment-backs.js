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

// Missing back images to upload
const missingBackImages = [
  // Boxy back images
  { productId: 'boxy', color: 'black', file: 'Black-2000x2000-PS-ShakaWear-7.5ozMaxHeavyweightTShirt-B1.png', folder: 'boxy-oversized-drop-shoulder/Back Shaka Wear 7.5oz  PNG' },
  { productId: 'boxy', color: 'cardinal-red', file: 'Cardinal-Red-2000x2000-PS-ShakaWear-7.5ozMaxHeavyweightTShirt-B1.png', folder: 'boxy-oversized-drop-shoulder/Back Shaka Wear 7.5oz  PNG' },
  { productId: 'boxy', color: 'heather-grey', file: 'Dark-Heather-Grey-2000x2000-PS-ShakaWear-7.5ozMaxHeavyweightTShirt-B1.png', folder: 'boxy-oversized-drop-shoulder/Back Shaka Wear 7.5oz  PNG' },
  { productId: 'boxy', color: 'natural', file: 'Natural-2000x2000-PS-ShakaWear-7.5ozMaxHeavyweightTShirt-B1.png', folder: 'boxy-oversized-drop-shoulder/Back Shaka Wear 7.5oz  PNG' },
  { productId: 'boxy', color: 'navy', file: 'Navy-2000x2000-PS-ShakaWear-7.5ozMaxHeavyweightTShirt-B1.png', folder: 'boxy-oversized-drop-shoulder/Back Shaka Wear 7.5oz  PNG' },
  { productId: 'boxy', color: 'white', file: 'White-2000x2000-PS-ShakaWear-7.5ozMaxHeavyweightTShirt-B1.png', folder: 'boxy-oversized-drop-shoulder/Back Shaka Wear 7.5oz  PNG' },
  
  // Medium Weight Sweatshirt back images
  { productId: 'mediu', color: 'black', file: 'Black-Sweater-Back-NFTreasure-PS-Independent-SS3000-B1.png', folder: 'Medium Weight Sweatshirt/Sweater Back Transparent PNG 2000x2000' },
  { productId: 'mediu', color: 'white', file: 'White-Sweater-Back-NFTreasure-PS-Independent-SS3000-B1.png', folder: 'Medium Weight Sweatshirt/Sweater Back Transparent PNG 2000x2000' },
  { productId: 'mediu', color: 'navy', file: 'Classic-Navy-Sweater-Back-NFTreasure-PS-Independent-SS3000-B1.png', folder: 'Medium Weight Sweatshirt/Sweater Back Transparent PNG 2000x2000' },
  { productId: 'mediu', color: 'red', file: 'Red-Sweater-Back-NFTreasure-PS-Independent-SS3000-B1.png', folder: 'Medium Weight Sweatshirt/Sweater Back Transparent PNG 2000x2000' },
  { productId: 'mediu', color: 'grey-heather', file: 'Charcoal-Heather-Sweater-Back-NFTreasure-PS-Independent-SS3000-B1.png', folder: 'Medium Weight Sweatshirt/Sweater Back Transparent PNG 2000x2000' },
  
  // Hoodie back images
  { productId: 'med-hood', color: 'black', file: 'Black-Hoody-Back-NFTreasure-2000x2000-PS-Independent-IND4000-B1.png', folder: 'Hoodie/Hoodie Back PNG Transparent 2000x2000' },
  { productId: 'med-hood', color: 'white', file: 'White-Hoody-Back-NFTreasure-2000x2000-PS-Independent-IND4000-B1.png', folder: 'Hoodie/Hoodie Back PNG Transparent 2000x2000' },
  { productId: 'med-hood', color: 'gold', file: 'Gold-Hoody-Back-NFTreasure-2000x2000-PS-Independent-IND4000-B1.png', folder: 'Hoodie/Hoodie Back PNG Transparent 2000x2000' },
  { productId: 'med-hood', color: 'navy', file: 'Classic-Navy-Hoody-Back-NFTreasure-2000x2000-PS-Independent-IND4000-B1.png', folder: 'Hoodie/Hoodie Back PNG Transparent 2000x2000' }
];

let totalUploaded = 0;
let totalFailed = 0;
const uploadResults = [];

async function uploadGarmentImage(filePath, productId, colorName, side = 'back') {
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
        side
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

async function uploadMissingBackImages() {
  console.log('🚀 Uploading missing back images to Cloudinary...\n');
  
  for (const imageConfig of missingBackImages) {
    const filePath = path.join(GARMENT_BASE_PATH, imageConfig.folder, imageConfig.file);
    
    try {
      // Check if file exists
      await fs.access(filePath);
      
      const result = await uploadGarmentImage(
        filePath,
        imageConfig.productId,
        imageConfig.color,
        'back'
      );
      
      uploadResults.push(result);
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.warn(`⚠️ File not found: ${filePath}`);
      const notFoundResult = {
        success: false,
        productId: imageConfig.productId,
        colorName: imageConfig.color,
        side: 'back',
        error: 'File not found',
        filePath
      };
      uploadResults.push(notFoundResult);
      totalFailed++;
    }
  }
  
  // Generate summary
  console.log('\n📊 Upload Summary:');
  console.log(`✅ Successfully uploaded: ${totalUploaded} images`);
  console.log(`❌ Failed uploads: ${totalFailed} images`);
  
  // Show successful uploads
  if (totalUploaded > 0) {
    console.log('\n✅ Successfully uploaded back images:');
    uploadResults.filter(r => r.success).forEach(result => {
      console.log(`- ${result.productId} ${result.colorName}: ${result.url}`);
    });
  }
  
  // Show failed uploads
  if (totalFailed > 0) {
    console.log('\n❌ Failed uploads:');
    uploadResults.filter(r => !r.success).forEach(result => {
      console.log(`- ${result.productId} ${result.colorName}: ${result.error}`);
      if (result.filePath) {
        console.log(`  File: ${result.filePath}`);
      }
    });
  }
}

// Run the upload
uploadMissingBackImages().catch(console.error);