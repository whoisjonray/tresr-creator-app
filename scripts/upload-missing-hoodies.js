const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dqslerzk9',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function uploadHoodieImages() {
  const uploads = [];
  
  // Check and upload hoodie back images
  const hoodieBackDir = '/Users/user/Documents/***TRESR/Hoodie/Hoodie Back PNG Transparent 2000x2000';
  const hoodieFrontDir = '/Users/user/Documents/***TRESR/Hoodie/Hoodie Front Transparent PNG';
  
  // Map of local file names to Cloudinary names and colors
  const colorMappings = {
    // Add mappings based on what files exist
    'gold': 'gold',
    'white': 'white',
    'light-grey': 'light-grey',
    'gray': 'light-grey',
    'heather-grey': 'light-grey',
    'cardinal-red': 'cardinal-red',
    'red': 'cardinal-red',
    'alpine-green': 'alpine-green',
    'green': 'alpine-green',
    'navy': 'navy',
    'classic-navy': 'navy',
    'mint': 'mint',
    'sage': 'mint'
  };
  
  try {
    // List files in directories
    if (fs.existsSync(hoodieBackDir)) {
      const backFiles = fs.readdirSync(hoodieBackDir);
      console.log('Found back files:', backFiles);
      
      for (const file of backFiles) {
        if (file.endsWith('.png') || file.endsWith('.PNG')) {
          // Extract color from filename (e.g., "Alpine-Green-Hoody-Back-..." -> "alpine-green")
          let colorMatch = file.split('-Hoody-')[0].toLowerCase().replace(/-/g, '-');
          
          // Map to standard color names
          if (colorMatch === 'alpine-green') colorMatch = 'alpine-green';
          else if (colorMatch === 'grey-heather') colorMatch = 'light-grey';
          else if (colorMatch === 'classic-navy') colorMatch = 'navy';
          else if (colorMatch === 'red') colorMatch = 'cardinal-red';
          
          const cloudinaryColor = colorMatch;
          
          const result = await cloudinary.uploader.upload(
            path.join(hoodieBackDir, file),
            {
              folder: 'garments/med-hood/back',
              public_id: cloudinaryColor,
              overwrite: true,
              resource_type: 'image'
            }
          );
          
          console.log(`✅ Uploaded ${file} as med-hood/back/${cloudinaryColor}`);
          uploads.push({ color: cloudinaryColor, side: 'back', url: result.secure_url });
        }
      }
    }
    
    if (fs.existsSync(hoodieFrontDir)) {
      const frontFiles = fs.readdirSync(hoodieFrontDir);
      console.log('Found front files:', frontFiles);
      
      for (const file of frontFiles) {
        if (file.endsWith('.png') || file.endsWith('.PNG')) {
          // Extract color from filename (e.g., "Alpine-Green-Hoody-Front-..." -> "alpine-green")
          let colorMatch = file.split('-Hoody-')[0].toLowerCase().replace(/-/g, '-');
          
          // Map to standard color names
          if (colorMatch === 'alpine-green') colorMatch = 'alpine-green';
          else if (colorMatch === 'grey-heather') colorMatch = 'light-grey';
          else if (colorMatch === 'classic-navy') colorMatch = 'navy';
          else if (colorMatch === 'red') colorMatch = 'cardinal-red';
          
          const cloudinaryColor = colorMatch;
          
          const result = await cloudinary.uploader.upload(
            path.join(hoodieFrontDir, file),
            {
              folder: 'garments/med-hood/front',
              public_id: cloudinaryColor,
              overwrite: true,
              resource_type: 'image'
            }
          );
          
          console.log(`✅ Uploaded ${file} as med-hood/front/${cloudinaryColor}`);
          uploads.push({ color: cloudinaryColor, side: 'front', url: result.secure_url });
        }
      }
    }
    
    // Output the URLs for config update
    console.log('\n📋 Add these to garmentImagesCloudinary.js:');
    uploads.forEach(({ color, side, url }) => {
      console.log(`"${color}": { "${side}": "${url}" },`);
    });
    
  } catch (error) {
    console.error('Error uploading hoodie images:', error);
  }
}

// Also upload the correct coffee mug
async function uploadCoffeeMug() {
  try {
    const mugPath = '/Users/user/Documents/***TRESR/coffee-mug.jpg';
    
    if (fs.existsSync(mugPath)) {
      const result = await cloudinary.uploader.upload(mugPath, {
        folder: 'garments/mug',
        public_id: 'white-coffee-mug-correct',
        overwrite: true,
        resource_type: 'image'
      });
      
      console.log('\n✅ Coffee mug uploaded successfully!');
      console.log('URL:', result.secure_url);
      
      return result.secure_url;
    } else {
      console.error('Coffee mug file not found at:', mugPath);
    }
  } catch (error) {
    console.error('Error uploading coffee mug:', error);
  }
}

async function main() {
  console.log('Starting uploads...\n');
  await uploadHoodieImages();
  await uploadCoffeeMug();
  console.log('\n✨ Upload complete!');
}

main();