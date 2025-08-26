const express = require('express');
const router = express.Router();
const multer = require('multer');
const openaiService = require('../services/openaiService');

// Configure multer for image upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Rate limiting middleware for AI requests
const aiRateLimit = (req, res, next) => {
  // Simple in-memory rate limiting (in production, use Redis)
  const userEmail = req.session?.creator?.email || req.session?.user?.email;
  const guestIP = req.ip;
  const identifier = userEmail || guestIP;
  
  if (!req.app.locals.aiRequests) {
    req.app.locals.aiRequests = new Map();
  }
  
  const now = Date.now();
  const hour = 60 * 60 * 1000;
  const userRequests = req.app.locals.aiRequests.get(identifier) || [];
  
  // Remove requests older than 1 hour
  const recentRequests = userRequests.filter(time => now - time < hour);
  
  // Allow 10 requests per hour for authenticated users, 3 for guests
  const limit = userEmail ? 10 : 3;
  
  if (recentRequests.length >= limit) {
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded. Please try again later.',
      limit: limit,
      resetTime: new Date(Math.min(...recentRequests) + hour).toISOString()
    });
  }
  
  // Record this request
  recentRequests.push(now);
  req.app.locals.aiRequests.set(identifier, recentRequests);
  
  next();
};

// Check if AI service is available
router.get('/status', (req, res) => {
  const isAvailable = openaiService.isAvailable();
  const usageInfo = openaiService.getUsageInfo();
  
  res.json({
    success: true,
    available: isAvailable,
    ...usageInfo,
    rateLimit: {
      authenticated: 10,
      guest: 3,
      window: '1 hour'
    }
  });
});

// Analyze uploaded image
router.post('/analyze-image', aiRateLimit, upload.single('image'), async (req, res) => {
  try {
    if (!openaiService.isAvailable()) {
      return res.status(503).json({
        success: false,
        error: 'AI service not available. Please configure OpenAI API key.'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }

    // Convert buffer to base64 data URL
    const imageBuffer = req.file.buffer;
    const imageBase64 = imageBuffer.toString('base64');
    const mimeType = req.file.mimetype;
    const imageDataUrl = `data:${mimeType};base64,${imageBase64}`;

    // Parse analysis options from request
    const options = {
      includeMetaDescription: req.body.includeMetaDescription !== 'false',
      includeSeoDescription: req.body.includeSeoDescription !== 'false', 
      includeTagSuggestions: req.body.includeTagSuggestions !== 'false',
      includeColorAnalysis: req.body.includeColorAnalysis !== 'false',
      targetAudience: req.body.targetAudience || 'general',
      designType: req.body.designType || 'graphic'
    };

    console.log(`🤖 Analyzing image for ${req.session?.creator?.email || 'guest user'}`);
    
    // Perform AI analysis
    const analysisResult = await openaiService.analyzeDesignImage(imageDataUrl, options);
    
    // Log successful analysis
    console.log(`✅ AI analysis complete - ${analysisResult.metadata.tokens_used} tokens used`);
    
    res.json({
      success: true,
      ...analysisResult
    });

  } catch (error) {
    console.error('AI analysis error:', error);
    
    // Provide helpful error messages
    let errorMessage = 'Analysis failed';
    if (error.message.includes('API key')) {
      errorMessage = 'AI service configuration error';
    } else if (error.message.includes('rate limit')) {
      errorMessage = 'API rate limit exceeded. Please try again later.';
    } else if (error.message.includes('content policy')) {
      errorMessage = 'Image content not supported for analysis';
    }
    
    res.status(500).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Analyze image from URL
router.post('/analyze-url', aiRateLimit, async (req, res) => {
  try {
    if (!openaiService.isAvailable()) {
      return res.status(503).json({
        success: false,
        error: 'AI service not available'
      });
    }

    const { imageUrl, ...options } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        error: 'Image URL is required'
      });
    }

    // Validate URL format
    try {
      new URL(imageUrl);
    } catch {
      return res.status(400).json({
        success: false,
        error: 'Invalid image URL format'
      });
    }

    console.log(`🤖 Analyzing image URL for ${req.session?.creator?.email || 'guest user'}`);
    
    const analysisResult = await openaiService.analyzeDesignImage(imageUrl, options);
    
    console.log(`✅ AI analysis complete - ${analysisResult.metadata.tokens_used} tokens used`);
    
    res.json({
      success: true,
      ...analysisResult
    });

  } catch (error) {
    console.error('URL analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze image from URL',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Generate alternative content
router.post('/generate-alternatives', aiRateLimit, async (req, res) => {
  try {
    if (!openaiService.isAvailable()) {
      return res.status(503).json({
        success: false,
        error: 'AI service not available'
      });
    }

    const { existingData, variant = 'casual' } = req.body;
    
    if (!existingData) {
      return res.status(400).json({
        success: false,
        error: 'Existing design data is required'
      });
    }

    const validVariants = ['casual', 'professional', 'edgy', 'minimal'];
    if (!validVariants.includes(variant)) {
      return res.status(400).json({
        success: false,
        error: `Invalid variant. Must be one of: ${validVariants.join(', ')}`
      });
    }

    console.log(`🤖 Generating ${variant} alternatives for ${req.session?.creator?.email || 'guest user'}`);
    
    const alternatives = await openaiService.generateAlternativeContent(existingData, variant);
    
    console.log(`✅ Alternatives generated - ${alternatives.metadata.tokens_used} tokens used`);
    
    res.json({
      success: true,
      ...alternatives
    });

  } catch (error) {
    console.error('Alternative generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate alternatives',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get user's AI usage stats (authenticated users only)
router.get('/usage', (req, res) => {
  const userEmail = req.session?.creator?.email || req.session?.user?.email;
  
  if (!userEmail) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  const userRequests = req.app.locals.aiRequests?.get(userEmail) || [];
  const now = Date.now();
  const hour = 60 * 60 * 1000;
  const recentRequests = userRequests.filter(time => now - time < hour);
  
  res.json({
    success: true,
    usage: {
      requestsThisHour: recentRequests.length,
      limit: 10,
      remaining: Math.max(0, 10 - recentRequests.length),
      resetTime: recentRequests.length > 0 
        ? new Date(Math.min(...recentRequests) + hour).toISOString()
        : null
    }
  });
});

module.exports = router;