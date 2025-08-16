const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { requireAuth } = require('../middleware/auth');
const { logActivity } = require('../middleware/logging');
const { cacheResponse } = require('../middleware/cache');
const { UserRole, Design, CreatorMapping } = require('../models');
const shopifyService = require('../services/shopify');

// Rate limiting
const generalLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later' }
});

const publishLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit publishing to 10 per hour
  message: { error: 'Publishing rate limit exceeded. Please try again in an hour.' }
});

// Input validation schemas
const profileUpdateValidation = [
  body('displayName')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Display name must be between 2 and 50 characters')
    .trim()
    .escape(),
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio must not exceed 500 characters')
    .trim(),
  body('website')
    .optional()
    .isURL()
    .withMessage('Website must be a valid URL'),
  body('socialLinks.instagram')
    .optional()
    .isURL()
    .withMessage('Instagram link must be a valid URL'),
  body('socialLinks.twitter')
    .optional()
    .isURL()
    .withMessage('Twitter link must be a valid URL'),
  body('socialLinks.tiktok')
    .optional()
    .isURL()
    .withMessage('TikTok link must be a valid URL'),
  body('preferences.emailNotifications')
    .optional()
    .isBoolean()
    .withMessage('Email notifications must be a boolean'),
  body('preferences.marketingEmails')
    .optional()
    .isBoolean()
    .withMessage('Marketing emails must be a boolean')
];

const designsQueryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['draft', 'published', 'pending', 'rejected'])
    .withMessage('Status must be one of: draft, published, pending, rejected'),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'title', 'status'])
    .withMessage('SortBy must be one of: createdAt, updatedAt, title, status'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('SortOrder must be asc or desc'),
  query('search')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters')
    .trim()
];

const publishDesignValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid design ID'),
  body('publishOptions.price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('publishOptions.tags')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Tags must be an array with maximum 10 items'),
  body('publishOptions.description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters')
    .trim()
];

const commissionsQueryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['pending', 'paid', 'cancelled'])
    .withMessage('Status must be one of: pending, paid, cancelled'),
  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('DateFrom must be a valid ISO date'),
  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('DateTo must be a valid ISO date')
];

const analyticsQueryValidation = [
  query('period')
    .optional()
    .isIn(['7d', '30d', '90d', '1y'])
    .withMessage('Period must be one of: 7d, 30d, 90d, 1y'),
  query('metrics')
    .optional()
    .isArray()
    .withMessage('Metrics must be an array')
];

// Error handling middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Helper function to format user profile response
const formatUserProfile = (user) => {
  return {
    id: user._id,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    bio: user.bio,
    website: user.website,
    avatar: user.avatar,
    socialLinks: user.socialLinks || {},
    preferences: user.preferences || {},
    stats: {
      totalDesigns: user.totalDesigns || 0,
      publishedDesigns: user.publishedDesigns || 0,
      totalEarnings: user.totalEarnings || 0,
      followerCount: user.followerCount || 0
    },
    memberSince: user.createdAt,
    lastActive: user.lastActive,
    verificationStatus: user.verificationStatus || 'pending'
  };
};

/**
 * @route   GET /api/users/profile
 * @desc    Get user profile with designs summary
 * @access  Private
 */
router.get('/profile', 
  generalLimit,
  authenticateToken,
  cacheMiddleware(300), // Cache for 5 minutes
  logActivity('profile_view'),
  async (req, res) => {
    try {
      const user = await User.findById(req.user.id)
        .select('-password -refreshToken')
        .populate('recentDesigns', 'title thumbnail status createdAt', null, { 
          limit: 5, 
          sort: { createdAt: -1 } 
        });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const profileData = formatUserProfile(user);
      
      // Add recent designs to profile
      profileData.recentDesigns = user.recentDesigns || [];

      res.json({
        success: true,
        data: profileData
      });
    } catch (error) {
      console.error('Profile fetch error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch profile',
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
      });
    }
  }
);

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile',
  generalLimit,
  authenticateToken,
  profileUpdateValidation,
  handleValidationErrors,
  logActivity('profile_update'),
  async (req, res) => {
    try {
      const allowedUpdates = [
        'displayName', 'bio', 'website', 'socialLinks', 'preferences'
      ];
      
      const updates = {};
      allowedUpdates.forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });

      // Validate social links if provided
      if (updates.socialLinks) {
        const validPlatforms = ['instagram', 'twitter', 'tiktok', 'youtube'];
        const filteredSocialLinks = {};
        
        validPlatforms.forEach(platform => {
          if (updates.socialLinks[platform]) {
            filteredSocialLinks[platform] = updates.socialLinks[platform];
          }
        });
        
        updates.socialLinks = filteredSocialLinks;
      }

      updates.updatedAt = new Date();

      const user = await User.findByIdAndUpdate(
        req.user.id,
        { $set: updates },
        { new: true, runValidators: true }
      ).select('-password -refreshToken');

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: formatUserProfile(user)
      });
    } catch (error) {
      console.error('Profile update error:', error);
      
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          error: 'Validation failed',
          details: Object.values(error.errors).map(err => err.message)
        });
      }
      
      res.status(500).json({ 
        error: 'Failed to update profile',
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
      });
    }
  }
);

/**
 * @route   GET /api/users/designs
 * @desc    List user's designs with pagination and filtering
 * @access  Private
 */
router.get('/designs',
  generalLimit,
  authenticateToken,
  designsQueryValidation,
  handleValidationErrors,
  cacheMiddleware(60), // Cache for 1 minute
  logActivity('designs_list'),
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        search
      } = req.query;

      // Build query
      const query = { creatorId: req.user.id };
      
      if (status) {
        query.status = status;
      }

      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ];
      }

      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Execute query with pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      const [designs, totalCount] = await Promise.all([
        Design.find(query)
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit))
          .select('title description thumbnail status tags createdAt updatedAt earnings views likes')
          .lean(),
        Design.countDocuments(query)
      ]);

      const totalPages = Math.ceil(totalCount / parseInt(limit));

      res.json({
        success: true,
        data: {
          designs,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalCount,
            hasNextPage: parseInt(page) < totalPages,
            hasPrevPage: parseInt(page) > 1
          }
        }
      });
    } catch (error) {
      console.error('Designs list error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch designs',
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
      });
    }
  }
);

/**
 * @route   POST /api/users/designs/:id/publish
 * @desc    Publish design to Shopify
 * @access  Private
 */
router.post('/designs/:id/publish',
  publishLimit,
  authenticateToken,
  publishDesignValidation,
  handleValidationErrors,
  logActivity('design_publish'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { publishOptions = {} } = req.body;

      // Verify design ownership
      const design = await Design.findOne({
        _id: id,
        creatorId: req.user.id
      });

      if (!design) {
        return res.status(404).json({ error: 'Design not found or access denied' });
      }

      // Check if design is already published
      if (design.status === 'published') {
        return res.status(400).json({ error: 'Design is already published' });
      }

      // Validate design has required fields for publishing
      const requiredFields = ['title', 'description', 'designFile', 'thumbnail'];
      const missingFields = requiredFields.filter(field => !design[field]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({
          error: 'Design missing required fields for publishing',
          missingFields
        });
      }

      // Update design with publish options
      const updateData = {
        status: 'pending',
        publishedAt: new Date(),
        ...publishOptions
      };

      await Design.findByIdAndUpdate(id, updateData);

      // Attempt to publish to Shopify
      try {
        const shopifyResult = await publishToShopify(design, publishOptions);
        
        await Design.findByIdAndUpdate(id, {
          status: 'published',
          shopifyProductId: shopifyResult.productId,
          publishedAt: new Date()
        });

        // Update user stats
        await User.findByIdAndUpdate(req.user.id, {
          $inc: { publishedDesigns: 1 }
        });

        res.json({
          success: true,
          message: 'Design published successfully',
          data: {
            designId: id,
            shopifyProductId: shopifyResult.productId,
            productUrl: shopifyResult.productUrl
          }
        });
      } catch (shopifyError) {
        // Revert status if Shopify publish fails
        await Design.findByIdAndUpdate(id, { status: 'draft' });
        
        console.error('Shopify publish error:', shopifyError);
        res.status(500).json({
          error: 'Failed to publish to Shopify',
          details: shopifyError.message
        });
      }
    } catch (error) {
      console.error('Design publish error:', error);
      res.status(500).json({ 
        error: 'Failed to publish design',
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
      });
    }
  }
);

/**
 * @route   GET /api/users/commissions
 * @desc    Get commission history with filtering
 * @access  Private
 */
router.get('/commissions',
  generalLimit,
  authenticateToken,
  commissionsQueryValidation,
  handleValidationErrors,
  cacheMiddleware(300), // Cache for 5 minutes
  logActivity('commissions_view'),
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        dateFrom,
        dateTo
      } = req.query;

      // Build query
      const query = { creatorId: req.user.id };
      
      if (status) {
        query.status = status;
      }

      if (dateFrom || dateTo) {
        query.createdAt = {};
        if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
        if (dateTo) query.createdAt.$lte = new Date(dateTo);
      }

      // Execute query with pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      const [commissions, totalCount, summary] = await Promise.all([
        Commission.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .populate('designId', 'title thumbnail')
          .populate('orderId', 'orderNumber totalAmount')
          .lean(),
        Commission.countDocuments(query),
        Commission.aggregate([
          { $match: query },
          {
            $group: {
              _id: '$status',
              total: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          }
        ])
      ]);

      const totalPages = Math.ceil(totalCount / parseInt(limit));

      // Format summary
      const summaryFormatted = {
        totalEarnings: 0,
        pendingEarnings: 0,
        paidEarnings: 0,
        totalCommissions: totalCount
      };

      summary.forEach(item => {
        summaryFormatted.totalEarnings += item.total;
        if (item._id === 'pending') summaryFormatted.pendingEarnings = item.total;
        if (item._id === 'paid') summaryFormatted.paidEarnings = item.total;
      });

      res.json({
        success: true,
        data: {
          commissions,
          summary: summaryFormatted,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalCount,
            hasNextPage: parseInt(page) < totalPages,
            hasPrevPage: parseInt(page) > 1
          }
        }
      });
    } catch (error) {
      console.error('Commissions fetch error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch commissions',
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
      });
    }
  }
);

/**
 * @route   GET /api/users/analytics
 * @desc    Get user analytics and insights
 * @access  Private
 */
router.get('/analytics',
  generalLimit,
  authenticateToken,
  analyticsQueryValidation,
  handleValidationErrors,
  cacheMiddleware(600), // Cache for 10 minutes
  logActivity('analytics_view'),
  async (req, res) => {
    try {
      const { period = '30d', metrics } = req.query;
      
      // Calculate date range
      const now = new Date();
      const periodMap = {
        '7d': 7,
        '30d': 30,
        '90d': 90,
        '1y': 365
      };
      
      const daysBack = periodMap[period] || 30;
      const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));

      const analytics = await Analytics.getUserAnalytics(req.user.id, {
        startDate,
        endDate: now,
        metrics: metrics || ['designs', 'earnings', 'views', 'engagement']
      });

      // Get trending designs
      const trendingDesigns = await Design.find({
        creatorId: req.user.id,
        createdAt: { $gte: startDate }
      })
      .sort({ views: -1, likes: -1 })
      .limit(5)
      .select('title thumbnail views likes earnings')
      .lean();

      // Get performance insights
      const insights = await Analytics.getPerformanceInsights(req.user.id, {
        period: daysBack
      });

      res.json({
        success: true,
        data: {
          period,
          dateRange: {
            start: startDate,
            end: now
          },
          analytics,
          trendingDesigns,
          insights,
          lastUpdated: new Date()
        }
      });
    } catch (error) {
      console.error('Analytics fetch error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch analytics',
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
      });
    }
  }
);

// Error handling middleware for this router
router.use((error, req, res, next) => {
  console.error('User API Error:', error);
  
  if (error.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid ID format' });
  }
  
  if (error.code === 11000) {
    return res.status(409).json({ error: 'Duplicate entry' });
  }
  
  res.status(500).json({ 
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { details: error.message })
  });
});

module.exports = router;