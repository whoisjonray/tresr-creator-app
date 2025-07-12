#!/usr/bin/env node

// Script to help migrate garment images from TRESR.com
// This script helps you copy/organize your existing garment images

const fs = require('fs');
const path = require('path');

// Configuration
const SOURCE_DIR = process.argv[2] || '/path/to/tresr-images'; // Update this path
const DEST_DIR = process.argv[3] || path.join(__dirname, '../public/garments');

// Expected garment structure
const GARMENT_STRUCTURE = {
  'classic-tee': ['black', 'white', 'navy', 'red', 'gray', 'heather-gray', 'forest-green', 'royal-blue', 'orange', 'yellow', 'pink', 'purple'],
  'premium-tee': ['black', 'white', 'navy', 'gray', 'red'],
  'hoodie': ['black', 'white', 'navy', 'red', 'gray', 'heather-gray', 'royal-blue', 'forest-green'],
  'crewneck': ['black', 'white', 'navy', 'gray', 'red', 'forest-green', 'royal-blue'],
  'long-sleeve': ['black', 'white', 'navy', 'gray', 'red'],
  'tank': ['black', 'white', 'gray', 'navy', 'red', 'royal-blue'],
  'mug': ['white', 'black', 'navy', 'red', 'two-tone-black', 'two-tone-red', 'two-tone-blue'],
  'phone-case': ['black', 'clear', 'white', 'navy', 'pink'],
  'sticker': ['white', 'clear', 'holographic'],
  'tote': ['natural', 'black', 'navy', 'red'],
  'poster': ['white', 'black'],
  'hat': ['black', 'white', 'navy', 'gray', 'red', 'khaki']
};

// Create directory structure
function createDirectoryStructure() {
  console.log('Creating directory structure...');
  
  // Create main garments directory
  if (!fs.existsSync(DEST_DIR)) {
    fs.mkdirSync(DEST_DIR, { recursive: true });
  }
  
  // Create subdirectories for each garment type
  Object.keys(GARMENT_STRUCTURE).forEach(garmentType => {
    const garmentDir = path.join(DEST_DIR, garmentType);
    if (!fs.existsSync(garmentDir)) {
      fs.mkdirSync(garmentDir, { recursive: true });
      console.log(`Created directory: ${garmentDir}`);
    }
  });
}

// Generate a report of expected vs found images
function generateImageReport() {
  console.log('\n=== Garment Image Report ===\n');
  
  let totalExpected = 0;
  let totalFound = 0;
  
  Object.entries(GARMENT_STRUCTURE).forEach(([garmentType, colors]) => {
    console.log(`\n${garmentType.toUpperCase()}:`);
    
    colors.forEach(color => {
      const expectedPath = path.join(DEST_DIR, garmentType, `${color}.jpg`);
      const exists = fs.existsSync(expectedPath);
      totalExpected++;
      
      if (exists) {
        totalFound++;
        console.log(`  ✓ ${color}.jpg`);
      } else {
        console.log(`  ✗ ${color}.jpg (missing)`);
      }
    });
  });
  
  console.log('\n=== Summary ===');
  console.log(`Total Expected: ${totalExpected}`);
  console.log(`Total Found: ${totalFound}`);
  console.log(`Missing: ${totalExpected - totalFound}`);
  console.log(`Coverage: ${((totalFound / totalExpected) * 100).toFixed(1)}%`);
}

// Generate example HTML to preview all mockups
function generatePreviewHTML() {
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Garment Image Preview</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 20px;
      background: #f3f4f6;
    }
    .garment-section {
      margin-bottom: 40px;
    }
    .garment-title {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 20px;
      text-transform: capitalize;
    }
    .color-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 20px;
    }
    .color-item {
      background: white;
      border-radius: 8px;
      padding: 10px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .color-item img {
      width: 100%;
      height: 200px;
      object-fit: contain;
      margin-bottom: 10px;
    }
    .color-name {
      font-weight: bold;
      text-transform: capitalize;
    }
    .missing {
      background: #fee;
      color: #c00;
    }
  </style>
</head>
<body>
  <h1>TRESR Garment Image Preview</h1>
`;

  Object.entries(GARMENT_STRUCTURE).forEach(([garmentType, colors]) => {
    htmlContent += `
  <div class="garment-section">
    <h2 class="garment-title">${garmentType.replace('-', ' ')}</h2>
    <div class="color-grid">`;
    
    colors.forEach(color => {
      const imagePath = `/garments/${garmentType}/${color}.jpg`;
      const exists = fs.existsSync(path.join(DEST_DIR, garmentType, `${color}.jpg`));
      
      htmlContent += `
      <div class="color-item ${exists ? '' : 'missing'}">
        <img src="${imagePath}" alt="${garmentType} in ${color}" onerror="this.src='/garments/placeholder.jpg'">
        <div class="color-name">${color.replace('-', ' ')}</div>
      </div>`;
    });
    
    htmlContent += `
    </div>
  </div>`;
  });

  htmlContent += `
</body>
</html>`;

  const previewPath = path.join(DEST_DIR, '..', 'garment-preview.html');
  fs.writeFileSync(previewPath, htmlContent);
  console.log(`\nPreview HTML generated at: ${previewPath}`);
}

// Main execution
function main() {
  console.log('TRESR Garment Image Migration Tool');
  console.log('===================================\n');
  
  // Create directory structure
  createDirectoryStructure();
  
  // Generate report
  generateImageReport();
  
  // Generate preview HTML
  generatePreviewHTML();
  
  console.log('\n\nNext Steps:');
  console.log('1. Copy your garment images from TRESR.com to the appropriate directories');
  console.log('2. Use the naming convention: {color}.jpg (e.g., black.jpg, navy.jpg)');
  console.log('3. Update the IMAGE_BASE_URL in your .env file if using a CDN');
  console.log('4. Open garment-preview.html in a browser to verify all images');
}

// Run the script
main();