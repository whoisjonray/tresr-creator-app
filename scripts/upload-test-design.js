#!/usr/bin/env node

// Upload a test design to Cloudinary for Dynamic Mockups testing

require('dotenv').config({ path: '/Users/user/Documents/Cursor Clients/TRESR Shopify/.env' });
const cloudinary = require('cloudinary').v2;
const fs = require('fs').promises;
const path = require('path');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dqslerzk9',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function createTestDesign() {
  try {
    // Create a simple test design using HTML5 Canvas
    const { createCanvas } = require('canvas');
    const canvas = createCanvas(500, 500);
    const ctx = canvas.getContext('2d');
    
    // Create a test design
    ctx.fillStyle = '#667eea';
    ctx.fillRect(0, 0, 500, 500);
    
    // Add TRESR text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 60px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TRESR', 250, 200);
    
    // Add TEST text
    ctx.font = 'bold 40px Arial';
    ctx.fillText('TEST DESIGN', 250, 300);
    
    // Convert to base64
    const dataUrl = canvas.toDataURL('image/png');
    return dataUrl;
  } catch (error) {
    // If canvas package is not available, create a simple SVG
    console.log('Canvas package not available, creating SVG test design...');
    
    const svg = `
      <svg width="500" height="500" xmlns="http://www.w3.org/2000/svg">
        <rect width="500" height="500" fill="#667eea"/>
        <text x="250" y="200" text-anchor="middle" fill="white" 
              font-family="Arial" font-size="60" font-weight="bold">TRESR</text>
        <text x="250" y="300" text-anchor="middle" fill="white"
              font-family="Arial" font-size="40" font-weight="bold">TEST DESIGN</text>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }
}

async function uploadTestDesign() {
  try {
    console.log('📤 Creating and uploading test design to Cloudinary...');
    
    // Create test design
    const designDataUrl = await createTestDesign();
    
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(designDataUrl, {
      folder: 'tresr-designs',
      public_id: 'test-design-for-mockups',
      overwrite: true,
      resource_type: 'image',
      format: 'png',
      tags: ['test', 'dynamic-mockups']
    });
    
    console.log('✅ Test design uploaded successfully!');
    console.log(`   URL: ${result.secure_url}`);
    console.log(`   Public ID: ${result.public_id}`);
    console.log(`   Size: ${result.width}x${result.height}`);
    console.log('\n📋 Use this URL in your Dynamic Mockups tests:');
    console.log(`   ${result.secure_url}`);
    
    // Update the test script with the new URL
    const testScriptPath = path.join(__dirname, 'test-dynamic-mockups-render.js');
    const testScript = await fs.readFile(testScriptPath, 'utf-8');
    const updatedScript = testScript.replace(
      /const TEST_DESIGN_URL = .*/,
      `const TEST_DESIGN_URL = '${result.secure_url}';`
    );
    await fs.writeFile(testScriptPath, updatedScript);
    console.log('\n✅ Updated test script with new URL');
    
    return result.secure_url;
    
  } catch (error) {
    console.error('❌ Failed to upload test design:', error);
    process.exit(1);
  }
}

// Run the upload
uploadTestDesign().then(() => {
  console.log('\n🎉 Test design ready for Dynamic Mockups testing!');
}).catch(console.error);