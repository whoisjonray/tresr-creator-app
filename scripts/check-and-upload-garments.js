#!/usr/bin/env node

/**
 * Check and Upload TRESR Garment Images to Cloudinary
 * This script checks if images already exist before uploading to avoid duplicates
 */

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const FormData = require('form-data');

const CLOUDINARY_BASE_URL = 'https://res.cloudinary.com/dqslerzk9/image/upload/tresr-garments';
const API_URL = 'http://localhost:3002/api/admin/garments/upload';
const BRANDED_BLANKS_PATH = '/Users/user/Documents/TRESR Shopify/TRESR Branded Blanks - New';

// Check if image exists on Cloudinary
async function checkImageExists(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

// Upload single image
async function uploadImage(imagePath, productId, color, side) {
  const filename = `${productId}_${color}_${side}`;
  const cloudinaryUrl = `${CLOUDINARY_BASE_URL}/${filename}.jpg`;
  
  // Check if already exists
  const exists = await checkImageExists(cloudinaryUrl);
  if (exists) {
    console.log(`✅ Already exists: ${filename}`);
    return { success: true, exists: true, url: cloudinaryUrl };
  }
  
  console.log(`📤 Uploading: ${filename}`);
  
  try {
    const form = new FormData();
    form.append('image', fs.createReadStream(imagePath));
    form.append('productId', productId);
    form.append('color', color);
    form.append('side', side);
    
    const response = await fetch(API_URL, {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log(`✅ Uploaded: ${filename}`);
      return { success: true, exists: false, url: result.url };
    } else {
      console.error(`❌ Failed: ${filename} - ${result.error}`);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error(`❌ Error uploading ${filename}:`, error.message);
    return { success: false, error: error.message };
  }
}

// Main upload function
async function uploadGarmentImages() {
  console.log('🚀 Checking and uploading TRESR garment images...\n');
  
  const uploadQueue = [
    // Oversized Drop Shoulder (boxy) - Complete set
    { path: 'boxy-oversized-drop-shoulder/Front Shaka Wear 7.5oz PNG/Black-2000x2000-PS-ShakaWear-7.5ozMaxHeavyweightTShirt-F1.png', productId: 'boxy', color: 'black', side: 'front' },
    { path: 'boxy-oversized-drop-shoulder/Back Shaka Wear 7.5oz  PNG/Black-2000x2000-PS-ShakaWear-7.5ozMaxHeavyweightTShirt-B1.png', productId: 'boxy', color: 'black', side: 'back' },
    { path: 'boxy-oversized-drop-shoulder/Front Shaka Wear 7.5oz PNG/Natural-2000x2000-PS-ShakaWear-7.5ozMaxHeavyweightTShirt-F1.png', productId: 'boxy', color: 'natural', side: 'front' },
    { path: 'boxy-oversized-drop-shoulder/Back Shaka Wear 7.5oz  PNG/Natural-2000x2000-PS-ShakaWear-7.5ozMaxHeavyweightTShirt-B1.png', productId: 'boxy', color: 'natural', side: 'back' },
    
    // Next Level Crop Top (next-crop) - Full set needed
    { path: 'next-crop-level-crop-top/Next Level - Women_s Ideal Crop Top - 1580 - Front - PNG/Black-2000x2000-PS-NextLevel-Womens-Ideal-Crop-Top-1580-F1.png', productId: 'next-crop', color: 'black', side: 'front' },
    { path: 'next-crop-level-crop-top/Next Level - Women_s Ideal Crop Top - 1580 - Back - PNG/Black-2000x2000-Next-Level-Womens-Ideal-Crop-Top-1580-B1.png', productId: 'next-crop', color: 'black', side: 'back' },
    { path: 'next-crop-level-crop-top/Next Level - Women_s Ideal Crop Top - 1580 - Front - PNG/Antique-Gold-2000x2000-PS-NextLevel-Womens-Ideal-Crop-Top-1580-F1.png', productId: 'next-crop', color: 'gold', side: 'front' },
    { path: 'next-crop-level-crop-top/Next Level - Women_s Ideal Crop Top - 1580 - Back - PNG/Antique-Gold-2000x2000-Next-Level-Womens-Ideal-Crop-Top-1580-B1.png', productId: 'next-crop', color: 'gold', side: 'back' },
    { path: 'next-crop-level-crop-top/Next Level - Women_s Ideal Crop Top - 1580 - Front - PNG/Blue-2000x2000-PS-NextLevel-Womens-Ideal-Crop-Top-1580-F1.png', productId: 'next-crop', color: 'royal-heather', side: 'front' },
    { path: 'next-crop-level-crop-top/Next Level - Women_s Ideal Crop Top - 1580 - Back - PNG/Blue-2000x2000-Next-Level-Womens-Ideal-Crop-Top-1580-B1.png', productId: 'next-crop', color: 'royal-heather', side: 'back' },
    { path: 'next-crop-level-crop-top/Next Level - Women_s Ideal Crop Top - 1580 - Front - PNG/Dark-Grey-2000x2000-PS-NextLevel-Womens-Ideal-Crop-Top-1580-F1.png', productId: 'next-crop', color: 'dark-grey', side: 'front' },
    { path: 'next-crop-level-crop-top/Next Level - Women_s Ideal Crop Top - 1580 - Back - PNG/Dark-Grey-2000x2000-Next-Level-Womens-Ideal-Crop-Top-1580-B1.png', productId: 'next-crop', color: 'dark-grey', side: 'back' },
    { path: 'next-crop-level-crop-top/Next Level - Women_s Ideal Crop Top - 1580 - Front - PNG/Desert-Pink-2000x2000-PS-NextLevel-Womens-Ideal-Crop-Top-1580-F1.png', productId: 'next-crop', color: 'pink', side: 'front' },
    { path: 'next-crop-level-crop-top/Next Level - Women_s Ideal Crop Top - 1580 - Back - PNG/Desert-Pink-2000x2000-Next-Level-Womens-Ideal-Crop-Top-1580-B1.png', productId: 'next-crop', color: 'pink', side: 'back' },
    { path: 'next-crop-level-crop-top/Next Level - Women_s Ideal Crop Top - 1580 - Front - PNG/Grey-Heather-2000x2000-PS-NextLevel-Womens-Ideal-Crop-Top-1580-F1.png', productId: 'next-crop', color: 'light-grey', side: 'front' },
    { path: 'next-crop-level-crop-top/Next Level - Women_s Ideal Crop Top - 1580 - Back - PNG/Grey-Heather-2000x2000-Next-Level-Womens-Ideal-Crop-Top-1580-B1.png', productId: 'next-crop', color: 'light-grey', side: 'back' },
    { path: 'next-crop-level-crop-top/Next Level - Women_s Ideal Crop Top - 1580 - Front - PNG/Midnight-Navy-2000x2000-PS-NextLevel-Womens-Ideal-Crop-Top-1580-F1.png', productId: 'next-crop', color: 'navy', side: 'front' },
    { path: 'next-crop-level-crop-top/Next Level - Women_s Ideal Crop Top - 1580 - Back - PNG/Midnight-Navy-2000x2000-Next-Level-Womens-Ideal-Crop-Top-1580-B1.png', productId: 'next-crop', color: 'navy', side: 'back' },
    { path: 'next-crop-level-crop-top/Next Level - Women_s Ideal Crop Top - 1580 - Front - PNG/Red-2000x2000-PS-NextLevel-Womens-Ideal-Crop-Top-1580-F1.png', productId: 'next-crop', color: 'cardinal-red', side: 'front' },
    { path: 'next-crop-level-crop-top/Next Level - Women_s Ideal Crop Top - 1580 - Back - PNG/Red-2000x2000-Next-Level-Womens-Ideal-Crop-Top-1580-B1.png', productId: 'next-crop', color: 'cardinal-red', side: 'back' },
    { path: 'next-crop-level-crop-top/Next Level - Women_s Ideal Crop Top - 1580 - Front - PNG/White-2000x2000-PS-NextLevel-Womens-Ideal-Crop-Top-1580-F1.png', productId: 'next-crop', color: 'white', side: 'front' },
    { path: 'next-crop-level-crop-top/Next Level - Women_s Ideal Crop Top - 1580 - Back - PNG/White-Next-Level-Womens-Ideal-Crop-Top-1580-B1.png', productId: 'next-crop', color: 'white', side: 'back' },
    
    // Medium Weight Sweatshirt (mediu) - Front images
    { path: 'Medium Weight Sweatshirt/Sweater Front Transparent PNG/Black-Sweater-Front-NFTreasure-Independent-SS3000-F1.png', productId: 'mediu', color: 'black', side: 'front' },
    { path: 'Medium Weight Sweatshirt/Sweater Front Transparent PNG/White-Sweater-Front-NFTreasure-Independent-SS3000-F1.png', productId: 'mediu', color: 'white', side: 'front' },
    { path: 'Medium Weight Sweatshirt/Sweater Front Transparent PNG/Classic-Navy-Sweater-Front-NFTreasure-Independent-SS3000-F1.png', productId: 'mediu', color: 'navy', side: 'front' },
    { path: 'Medium Weight Sweatshirt/Sweater Front Transparent PNG/Grey-Heather-Sweater-Front-NFTreasure-Independent-SS3000-F1.png', productId: 'mediu', color: 'light-grey', side: 'front' },
    { path: 'Medium Weight Sweatshirt/Sweater Front Transparent PNG/Army-Heather-Sweater-Front-NFTreasure-Independent-SS3000-F1.png', productId: 'mediu', color: 'army-heather', side: 'front' },
    { path: 'Medium Weight Sweatshirt/Sweater Front Transparent PNG/Red-Sweater-Front-NFTreasure-Independent-SS3000-F1.png', productId: 'mediu', color: 'cardinal-red', side: 'front' },
    { path: 'Medium Weight Sweatshirt/Sweater Front Transparent PNG/Royal-Blue-Sweater-Front-NFTreasure-Independent-SS3000-F1.png', productId: 'mediu', color: 'royal-heather', side: 'front' },
    { path: 'Medium Weight Sweatshirt/Sweater Front Transparent PNG/Charcoal-Heather-Sweater-Front-NFTreasure-Independent-SS3000-F1.png', productId: 'mediu', color: 'dark-grey', side: 'front' },
    
    // Medium Weight Sweatshirt (mediu) - Back images
    { path: 'Medium Weight Sweatshirt/Sweater Back Transparent PNG 2000x2000/Black-Sweater-Back-NFTreasure-PS-Independent-SS3000-B1.png', productId: 'mediu', color: 'black', side: 'back' },
    { path: 'Medium Weight Sweatshirt/Sweater Back Transparent PNG 2000x2000/White-Sweater-Back-NFTreasure-PS-Independent-SS3000-B1.png', productId: 'mediu', color: 'white', side: 'back' },
    { path: 'Medium Weight Sweatshirt/Sweater Back Transparent PNG 2000x2000/Classic-Navy-Sweater-Back-NFTreasure-PS-Independent-SS3000-B1.png', productId: 'mediu', color: 'navy', side: 'back' },
    { path: 'Medium Weight Sweatshirt/Sweater Back Transparent PNG 2000x2000/Army-Heather-Sweater-Back-NFTreasure-PS-Independent-SS3000-B1.png', productId: 'mediu', color: 'army-heather', side: 'back' },
    { path: 'Medium Weight Sweatshirt/Sweater Back Transparent PNG 2000x2000/Red-Sweater-Back-NFTreasure-PS-Independent-SS3000-B1.png', productId: 'mediu', color: 'cardinal-red', side: 'back' },
    { path: 'Medium Weight Sweatshirt/Sweater Back Transparent PNG 2000x2000/Royal-Blue-Sweater-Back-NFTreasure-PS-Independent-SS3000-B1.png', productId: 'mediu', color: 'royal-heather', side: 'back' },
    { path: 'Medium Weight Sweatshirt/Sweater Back Transparent PNG 2000x2000/Charcoal-Heather-Sweater-Back-NFTreasure-PS-Independent-SS3000-B1.png', productId: 'mediu', color: 'dark-grey', side: 'back' },
    
    // Standard Polo (polo) - Front images only
    { path: 'Logo Polo/Port-Authority---Micro-Mesh-Polo K110 - Front PNG/Deep-Black-2000x2000--Port-Authority---Micro-Mesh-Polo-F1.png', productId: 'polo', color: 'black', side: 'front' },
    { path: 'Logo Polo/Port-Authority---Micro-Mesh-Polo K110 - Front PNG/White-2000x2000--Port-Authority---Micro-Mesh-Polo-F1.png', productId: 'polo', color: 'white', side: 'front' },
    { path: 'Logo Polo/Port-Authority---Micro-Mesh-Polo K110 - Front PNG/River-Blue-Navy-2000x2000--Port-Authority---Micro-Mesh-Polo-F1.png', productId: 'polo', color: 'navy', side: 'front' },
    { path: 'Logo Polo/Port-Authority---Micro-Mesh-Polo K110 - Front PNG/Graphite-2000x2000--Port-Authority---Micro-Mesh-Polo-F1.png', productId: 'polo', color: 'light-grey', side: 'front' },
  ];
  
  let uploaded = 0;
  let skipped = 0;
  let failed = 0;
  
  for (const item of uploadQueue) {
    const fullPath = path.join(BRANDED_BLANKS_PATH, item.path);
    
    if (!fs.existsSync(fullPath)) {
      console.error(`❌ File not found: ${item.path}`);
      failed++;
      continue;
    }
    
    const result = await uploadImage(fullPath, item.productId, item.color, item.side);
    
    if (result.success) {
      if (result.exists) {
        skipped++;
      } else {
        uploaded++;
      }
    } else {
      failed++;
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n📊 Upload Summary:');
  console.log(`✅ Uploaded: ${uploaded} images`);
  console.log(`⏩ Skipped (already exist): ${skipped} images`);
  console.log(`❌ Failed: ${failed} images`);
  console.log(`📁 Total processed: ${uploadQueue.length} images`);
}

// Run the upload
uploadGarmentImages().catch(console.error);