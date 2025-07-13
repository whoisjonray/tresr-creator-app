const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dqslerzk9',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

class CloudinaryService {
  constructor() {
    console.log('Cloudinary service initialized');
    console.log('Cloud name:', cloudinary.config().cloud_name);
    console.log('API key configured:', !!cloudinary.config().api_key);
  }

  // Upload base64 image to Cloudinary
  async uploadImage(base64Image, options = {}) {
    try {
      const {
        folder = 'tresr-creator-products',
        public_id,
        tags = ['creator-product', 'generated'],
        resource_type = 'image',
        format = 'png'
      } = options;

      console.log(`📤 Uploading image to Cloudinary...`);
      console.log(`   Folder: ${folder}`);
      console.log(`   Public ID: ${public_id || 'auto-generated'}`);
      console.log(`   Tags: ${tags.join(', ')}`);

      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(base64Image, {
        folder,
        public_id,
        tags,
        resource_type,
        format,
        transformation: [
          { quality: 'auto:best' },
          { fetch_format: 'auto' }
        ]
      });

      console.log(`✅ Image uploaded successfully to Cloudinary`);
      console.log(`   URL: ${result.secure_url}`);
      console.log(`   Public ID: ${result.public_id}`);
      console.log(`   Size: ${Math.round(result.bytes / 1024)}KB`);

      return {
        url: result.secure_url,
        public_id: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
        created_at: result.created_at
      };

    } catch (error) {
      console.error('❌ Cloudinary upload failed:', error);
      throw new Error(`Failed to upload image to Cloudinary: ${error.message}`);
    }
  }

  // Upload multiple images in batch
  async uploadBatch(images) {
    const results = [];
    
    for (let i = 0; i < images.length; i++) {
      const { base64, options } = images[i];
      try {
        const result = await this.uploadImage(base64, options);
        results.push({ success: true, ...result });
      } catch (error) {
        results.push({ success: false, error: error.message });
      }
    }
    
    return results;
  }

  // Delete image from Cloudinary
  async deleteImage(publicId) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result;
    } catch (error) {
      console.error('Failed to delete image:', error);
      throw error;
    }
  }

  // Get image details
  async getImageDetails(publicId) {
    try {
      const result = await cloudinary.api.resource(publicId);
      return result;
    } catch (error) {
      console.error('Failed to get image details:', error);
      throw error;
    }
  }
}

// Create singleton instance
const cloudinaryService = new CloudinaryService();

module.exports = cloudinaryService;