const { UserRole } = require('../models');

// Authentication middleware
const requireAuth = (req, res, next) => {
  // SECURITY: Always require proper authentication
  // Handle both old (.user) and new (.creator) session formats
  const user = req.session?.creator || req.session?.user;
  
  if (!req.session || !user || !user.id) {
    console.log('🔐 Authentication required - no valid session found');
    console.log('Session debug:', {
      hasSession: !!req.session,
      hasCreator: !!req.session?.creator,
      hasUser: !!req.session?.user,
      sessionKeys: Object.keys(req.session || {})
    });
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'Please log in to continue'
    });
  }
  
  // Ensure both formats are available for compatibility
  if (!req.session.creator) {
    req.session.creator = user;
  }
  if (!req.session.user) {
    req.session.user = user;
  }
  
  // Attach user to request for easy access
  req.user = user;
  
  // Log authenticated user for debugging
  console.log(`✅ Authenticated user: ${user.id} (${user.email})`);
  next();
};

// Optional auth - continues even if not authenticated
const optionalAuth = (req, res, next) => {
  // Just continue, session.creator may or may not exist
  next();
};

// Admin only middleware - now checks database
const requireAdmin = async (req, res, next) => {
  const user = req.session?.creator || req.session?.user;
  
  if (!user) {
    return res.status(401).json({ 
      error: 'Authentication required' 
    });
  }
  
  try {
    // Check database for user role
    const userRole = await UserRole.findOne({
      where: { 
        dynamicId: user.id 
      }
    });
    
    if (!userRole || userRole.role !== 'admin') {
      console.log(`🚫 Admin access denied for: ${user.email}`);
      return res.status(403).json({ 
        error: 'Admin access required',
        message: 'You do not have admin permissions'
      });
    }
    
    console.log(`👑 Admin access granted: ${user.email}`);
    
    // Update both session formats
    if (req.session.creator) {
      req.session.creator.isAdmin = true;
      req.session.creator.role = 'admin';
    }
    if (req.session.user) {
      req.session.user.isAdmin = true;
      req.session.user.role = 'admin';
    }
    
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
  const user = req.session?.creator || req.session?.user;
  
  if (!user) {
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
  console.log(`🎨 Creator access: ${user.email}`);
  next();
};

module.exports = {
  requireAuth,
  optionalAuth,
  requireAdmin,
  requireCreator
};