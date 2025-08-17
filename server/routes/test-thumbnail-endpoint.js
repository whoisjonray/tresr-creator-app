const express = require('express');
const router = express.Router();

// Ultra-simple test endpoint to verify the route works
router.post('/test-thumbnail-endpoint', async (req, res) => {
  try {
    console.log('🔧 Test endpoint called successfully');
    
    // Just return success without doing anything
    res.json({
      success: true,
      message: 'Test endpoint works! The route is accessible.',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Test endpoint error:', error);
    res.status(500).json({
      error: 'Test failed',
      message: error.message
    });
  }
});

// Another test that checks if models are available
router.get('/test-models-available', async (req, res) => {
  try {
    const models = req.app.get('models');
    const hasModels = models && Object.keys(models).length > 0;
    
    res.json({
      success: true,
      modelsAvailable: hasModels,
      modelNames: hasModels ? Object.keys(models) : [],
      message: hasModels ? 'Models are available' : 'Models are NOT available'
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Check failed',
      message: error.message
    });
  }
});

module.exports = router;