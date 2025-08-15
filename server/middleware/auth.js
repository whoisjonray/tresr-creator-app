const { UserRole } = require('../models');

// Authentication middleware
const requireAuth = (req, res, next) => {
  // SECURITY: Always require proper authentication
  // Each user must have their own session with unique creator ID
  if (!req.session || !req.session.creator || !req.session.creator.id) {
    console.log('🔐 Authentication required - no valid session found');
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'Please log in to continue'
    });
  }
  
  // Log authenticated user for debugging
  console.log(`✅ Authenticated user: ${req.session.creator.id} (${req.session.creator.email})`);
  next();
};

// Optional auth - continues even if not authenticated
const optionalAuth = (req, res, next) => {
  // Just continue, session.creator may or may not exist
  next();
};

// Admin only middleware - now checks database
const requireAdmin = async (req, res, next) => {
  if (!req.session.creator) {
    return res.status(401).json({ 
      error: 'Authentication required' 
    });
  }
  
  try {
    // Check database for user role
    const userRole = await UserRole.findOne({
      where: { 
        dynamicId: req.session.creator.id 
      }
    });
    
    if (!userRole || userRole.role !== 'admin') {
      console.log(`🚫 Admin access denied for: ${req.session.creator.email}`);
      return res.status(403).json({ 
        error: 'Admin access required',
        message: 'You do not have admin permissions'
      });
    }
    
    console.log(`👑 Admin access granted: ${req.session.creator.email}`);
    req.session.creator.isAdmin = true;
    req.session.creator.role = 'admin';
    next();
  } catch (error) {
    console.error('Error checking admin role:', error);
    return res.status(500).json({ 
      error: 'Failed to verify admin permissions' 
    });
  }
};

// Creator only middleware
const requireCreator = async (req, res, next) => {
  if (!req.session.creator) {
    return res.status(401).json({ 
      error: 'Authentication required' 
    });
  }
  
  // During impersonation, allow access to creator routes
  if (req.session.impersonation) {
    console.log(`🎭 Impersonating creator: ${req.session.impersonation.targetEmail}`);
    next();
    return;
  }
  
  // Regular creator access
  console.log(`🎨 Creator access: ${req.session.creator.email}`);
  next();
};

module.exports = {
  requireAuth,
  optionalAuth,
  requireAdmin,
  requireCreator
};