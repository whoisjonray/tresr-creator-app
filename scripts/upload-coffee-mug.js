const cloudinary = require('cloudinary').v2;
const fs = require('fs');
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dqslerzk9',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function uploadCoffeeMug() {
  try {
    console.log('Uploading coffee mug image to Cloudinary...');
    
    const result = await cloudinary.uploader.upload('/tmp/coffee-mug.jpg', {
      folder: 'garments/mug',
      public_id: 'white-coffee-mug',
      overwrite: true,
      resource_type: 'image'
    });
    
    console.log('✅ Coffee mug uploaded successfully!');
    console.log('URL:', result.secure_url);
    
    // Update the config file
    const configPath = './client/src/config/garmentImagesCloudinary.js';
    let configContent = fs.readFileSync(configPath, 'utf8');
    
    // Replace the placeholder URL with the actual URL
    configContent = configContent.replace(
      'https://res.cloudinary.com/dqslerzk9/image/upload/v1755816000/garments/mug/white-coffee-mug.jpg',
      result.secure_url
    );
    
    fs.writeFileSync(configPath, configContent);
    console.log('✅ Config file updated with actual URL');
    
    return result.secure_url;
  } catch (error) {
    console.error('Error uploading coffee mug:', error);
    process.exit(1);
  }
}

uploadCoffeeMug();