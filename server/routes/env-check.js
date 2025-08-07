const express = require('express');
const router = express.Router();

// Simple endpoint to check environment variables (admin only)
router.get('/check', (req, res) => {
  // Only allow whoisjonray@gmail.com
  const email = req.session?.creator?.email || req.session?.user?.email;
  
  if (email !== 'whoisjonray@gmail.com') {
    return res.status(403).json({ 
      error: 'Admin access required' 
    });
  }
  
  // Check which Cloudinary env vars are present
  const envCheck = {
    hasCloudinaryName: !!process.env.CLOUDINARY_NAME,
    hasCloudinaryCloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
    hasCloudinaryApiKey: !!process.env.CLOUDINARY_API_KEY,
    hasCloudinaryApiSecret: !!process.env.CLOUDINARY_API_SECRET,
    
    // Show first few chars of values (for debugging)
    cloudinaryNamePrefix: process.env.CLOUDINARY_NAME ? process.env.CLOUDINARY_NAME.substring(0, 4) + '...' : 'NOT SET',
    cloudinaryCloudNamePrefix: process.env.CLOUDINARY_CLOUD_NAME ? process.env.CLOUDINARY_CLOUD_NAME.substring(0, 4) + '...' : 'NOT SET',
    
    // Check other important env vars
    nodeEnv: process.env.NODE_ENV,
    railwayEnvironment: process.env.RAILWAY_ENVIRONMENT,
    port: process.env.PORT,
    
    // List all env var keys (not values for security)
    allEnvKeys: Object.keys(process.env).filter(key => 
      !key.includes('SECRET') && 
      !key.includes('TOKEN') && 
      !key.includes('PASSWORD') &&
      !key.includes('API_KEY')
    ).sort()
  };
  
  res.json({
    success: true,
    environment: envCheck,
    message: 'Environment variables check'
  });
});

module.exports = router;