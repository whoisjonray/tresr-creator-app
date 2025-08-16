const express = require('express');
const router = express.Router();
const dynamicAuth = require('../services/dynamicAuth');
const { UserRole, CreatorMapping, Creator } = require('../models');

/**
 * Enhanced Authentication API v2
 * 
 * Provides secure authentication endpoints with improved error handling,
 * session management, and creator statistics integration.
 */

/**
 * POST /api/auth/login
 * Dynamic.xyz token verification and session creation
 */
router.post('/login', async (req, res) => {
  try {
    const { token } = req.body;

    // Validate input
    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Authentication token is required'
      });
    }

    // Verify token with Dynamic.xyz service
    let userData;
    try {
      userData = await dynamicAuth.verifyToken(token.trim());
    } catch (tokenError) {
      console.error('Token verification failed:', tokenError.message);
      return res.status(401).json({
        success: false,
        error: 'TOKEN_VERIFICATION_FAILED',
        message: 'Invalid or expired authentication token'
      });
    }

    // Validate required user data
    if (!userData.id || !userData.email) {
      return res.status(400).json({
        success: false,
        error: 'INCOMPLETE_USER_DATA',
        message: 'Authentication token missing required user information'
      });
    }

    // Check or create user role in database
    let userRole = null;
    if (UserRole) {
      try {
        userRole = await UserRole.findOne({
          where: { dynamicId: userData.id }
        });

        if (!userRole) {
          // Create new user with creator role by default
          userRole = await UserRole.create({
            dynamicId: userData.id,
            email: userData.email,
            name: userData.name || userData.email.split('@')[0],
            role: 'creator'
          });
          console.log(`📝 Created new user role for: ${userData.email}`);
        } else {
          // Update name and email if changed
          const updates = {};
          if (userRole.name !== userData.name) updates.name = userData.name;
          if (userRole.email !== userData.email) updates.email = userData.email;
          
          if (Object.keys(updates).length > 0) {
            await userRole.update(updates);
            console.log(`📝 Updated user data for: ${userData.email}`);
          }
        }
      } catch (dbError) {
        console.error('Database error during user role management:', dbError);
        // Continue without role management if DB is unavailable
      }
    }

    // Create session using Dynamic Auth service
    const sessionData = dynamicAuth.createSession(userData, req.session);

    // Enhance session with role information
    if (userRole) {
      req.session.creator = {
        ...sessionData,
        role: userRole.role,
        isAdmin: userRole.role === 'admin',
        dbId: userRole.id
      };
    }

    // Security audit log
    console.log('🔐 === LOGIN SUCCESS ===');
    console.log(`User ID: ${userData.id}`);
    console.log(`Email: ${userData.email}`);
    console.log(`Name: ${userData.name}`);
    console.log(`Role: ${userRole?.role || 'unknown'}`);
    console.log(`Session ID: ${req.sessionID}`);
    console.log(`IP: ${req.ip}`);
    console.log(`User Agent: ${req.get('User-Agent')}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log('🔐 =====================');

    // Return success response
    res.json({
      success: true,
      user: {
        id: req.session.creator.id,
        email: req.session.creator.email,
        name: req.session.creator.name,
        walletAddress: req.session.creator.walletAddress,
        role: req.session.creator.role || 'creator',
        isAdmin: req.session.creator.isAdmin || false,
        isAuthenticated: true,
        authenticatedAt: req.session.creator.authenticatedAt
      },
      session: {
        id: req.sessionID,
        expiresAt: new Date(Date.now() + (24 * 60 * 60 * 1000)).toISOString() // 24 hours
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'AUTHENTICATION_ERROR',
      message: 'An error occurred during authentication'
    });
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user with creator data
 */
router.get('/me', async (req, res) => {
  try {
    // Check session validity
    if (!dynamicAuth.validateSession(req.session)) {
      return res.status(401).json({
        success: false,
        error: 'SESSION_INVALID',
        message: 'Authentication session is invalid or expired'
      });
    }

    const creator = req.session.creator;
    if (!creator) {
      return res.status(401).json({
        success: false,
        error: 'NOT_AUTHENTICATED',
        message: 'User is not authenticated'
      });
    }

    // Get additional creator data from database
    let creatorData = null;
    let designCount = 0;
    let creatorMapping = null;

    if (Creator && creator.id) {
      try {
        creatorData = await Creator.findByPk(creator.id);
        
        // Get design count if available
        if (creatorData) {
          const designs = await creatorData.getDesigns();
          designCount = designs ? designs.length : 0;
        }
      } catch (dbError) {
        console.warn('Could not fetch creator data from database:', dbError.message);
      }
    }

    // Get creator mapping if available
    if (CreatorMapping && creator.id) {
      try {
        creatorMapping = await CreatorMapping.findOne({
          where: { dynamicId: creator.id }
        });
      } catch (dbError) {
        console.warn('Could not fetch creator mapping:', dbError.message);
      }
    }

    res.json({
      success: true,
      user: {
        id: creator.id,
        email: creator.email,
        name: creator.name,
        walletAddress: creator.walletAddress,
        role: creator.role || 'creator',
        isAdmin: creator.isAdmin || false,
        isAuthenticated: true,
        authenticatedAt: creator.authenticatedAt,
        // Additional profile data
        avatarUrl: creatorData?.avatarUrl,
        isActive: creatorData?.isActive !== false,
        designCount: designCount,
        // Creator mapping data
        sanityPersonId: creatorMapping?.sanityPersonId,
        shopifyCreatorId: creatorMapping?.shopifyCreatorId
      },
      session: {
        id: req.sessionID,
        valid: true,
        expiresAt: new Date(Date.now() + (24 * 60 * 60 * 1000)).toISOString()
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'USER_FETCH_ERROR',
      message: 'An error occurred while fetching user data'
    });
  }
});

/**
 * POST /api/auth/logout
 * End current session and clear authentication
 */
router.post('/logout', (req, res) => {
  try {
    const creatorId = req.session.creator?.id;
    const sessionId = req.sessionID;

    // Destroy session
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
        return res.status(500).json({
          success: false,
          error: 'LOGOUT_ERROR',
          message: 'Failed to end session properly'
        });
      }

      // Security audit log
      console.log('🔓 === LOGOUT SUCCESS ===');
      console.log(`User ID: ${creatorId || 'unknown'}`);
      console.log(`Session ID: ${sessionId}`);
      console.log(`IP: ${req.ip}`);
      console.log(`Timestamp: ${new Date().toISOString()}`);
      console.log('🔓 ======================');

      res.json({
        success: true,
        message: 'Successfully logged out'
      });
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'LOGOUT_ERROR',
      message: 'An error occurred during logout'
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh current session and extend expiration
 */
router.post('/refresh', async (req, res) => {
  try {
    // Check if session exists and is valid
    if (!req.session.creator) {
      return res.status(401).json({
        success: false,
        error: 'NO_SESSION',
        message: 'No active session to refresh'
      });
    }

    // Validate session
    if (!dynamicAuth.validateSession(req.session)) {
      return res.status(401).json({
        success: false,
        error: 'SESSION_EXPIRED',
        message: 'Session has expired and cannot be refreshed'
      });
    }

    // Update session timestamp
    req.session.creator.authenticatedAt = new Date().toISOString();

    // Force session save
    req.session.save((err) => {
      if (err) {
        console.error('Session refresh error:', err);
        return res.status(500).json({
          success: false,
          error: 'REFRESH_ERROR',
          message: 'Failed to refresh session'
        });
      }

      console.log(`🔄 Session refreshed for user: ${req.session.creator.id}`);

      res.json({
        success: true,
        message: 'Session refreshed successfully',
        user: {
          id: req.session.creator.id,
          email: req.session.creator.email,
          name: req.session.creator.name,
          role: req.session.creator.role,
          isAuthenticated: true,
          authenticatedAt: req.session.creator.authenticatedAt
        },
        session: {
          id: req.sessionID,
          refreshedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + (24 * 60 * 60 * 1000)).toISOString()
        }
      });
    });

  } catch (error) {
    console.error('Session refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'REFRESH_ERROR',
      message: 'An error occurred while refreshing session'
    });
  }
});

/**
 * GET /api/auth/creator-stats
 * Get detailed creator statistics and performance metrics
 */
router.get('/creator-stats', async (req, res) => {
  try {
    // Verify authentication
    if (!req.session.creator) {
      return res.status(401).json({
        success: false,
        error: 'NOT_AUTHENTICATED',
        message: 'Authentication required to access creator statistics'
      });
    }

    const creatorId = req.session.creator.id;
    const stats = {
      creator: {
        id: creatorId,
        name: req.session.creator.name,
        email: req.session.creator.email,
        role: req.session.creator.role
      },
      designs: {
        total: 0,
        published: 0,
        draft: 0,
        archived: 0
      },
      products: {
        total: 0,
        enabled: 0,
        variants: 0
      },
      analytics: {
        totalViews: 0,
        totalShares: 0,
        totalPurchases: 0
      },
      performance: {
        averageDesignsPerMonth: 0,
        publishRate: 0,
        lastActivity: null
      }
    };

    // Fetch creator data from database if available
    if (Creator) {
      try {
        const creator = await Creator.findByPk(creatorId, {
          include: [{
            association: 'designs',
            include: [
              {
                association: 'products',
                include: ['variants']
              },
              {
                association: 'analytics'
              }
            ]
          }]
        });

        if (creator && creator.designs) {
          stats.designs.total = creator.designs.length;
          
          // Count designs by status
          creator.designs.forEach(design => {
            stats.designs[design.status] = (stats.designs[design.status] || 0) + 1;
            
            // Count products and variants
            if (design.products) {
              design.products.forEach(product => {
                stats.products.total++;
                if (product.isEnabled) stats.products.enabled++;
                if (product.variants) {
                  stats.products.variants += product.variants.length;
                }
              });
            }

            // Count analytics events
            if (design.analytics) {
              design.analytics.forEach(event => {
                if (event.eventType === 'view') stats.analytics.totalViews++;
                else if (event.eventType === 'share') stats.analytics.totalShares++;
                else if (event.eventType === 'purchase') stats.analytics.totalPurchases++;
              });
            }

            // Track last activity
            const designDate = new Date(design.updatedAt || design.createdAt);
            if (!stats.performance.lastActivity || designDate > new Date(stats.performance.lastActivity)) {
              stats.performance.lastActivity = designDate.toISOString();
            }
          });

          // Calculate performance metrics
          if (stats.designs.total > 0) {
            stats.performance.publishRate = Math.round((stats.designs.published / stats.designs.total) * 100);
            
            // Calculate average designs per month (rough estimate)
            if (creator.createdAt) {
              const monthsSinceJoin = Math.max(1, Math.floor((Date.now() - new Date(creator.createdAt).getTime()) / (30 * 24 * 60 * 60 * 1000)));
              stats.performance.averageDesignsPerMonth = Math.round(stats.designs.total / monthsSinceJoin * 10) / 10;
            }
          }
        }

      } catch (dbError) {
        console.warn('Could not fetch creator statistics from database:', dbError.message);
        // Continue with empty stats if database is unavailable
      }
    }

    // Get creator mapping information
    if (CreatorMapping) {
      try {
        const mapping = await CreatorMapping.findOne({
          where: { dynamicId: creatorId }
        });
        
        if (mapping) {
          stats.creator.sanityPersonId = mapping.sanityPersonId;
          stats.creator.shopifyCreatorId = mapping.shopifyCreatorId;
          stats.creator.hasMappings = true;
        }
      } catch (dbError) {
        console.warn('Could not fetch creator mapping:', dbError.message);
      }
    }

    res.json({
      success: true,
      statistics: stats,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Creator stats error:', error);
    res.status(500).json({
      success: false,
      error: 'STATS_ERROR',
      message: 'An error occurred while fetching creator statistics'
    });
  }
});

/**
 * Error handling middleware for auth routes
 */
router.use((error, req, res, next) => {
  console.error('Auth route error:', error);
  
  res.status(500).json({
    success: false,
    error: 'INTERNAL_SERVER_ERROR',
    message: 'An internal server error occurred'
  });
});

module.exports = router;