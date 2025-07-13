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

// Admin only middleware
const requireAdmin = (req, res, next) => {
  if (!req.session.creator) {
    return res.status(401).json({ 
      error: 'Authentication required' 
    });
  }
  
  if (!req.session.creator.isAdmin) {
    return res.status(403).json({ 
      error: 'Admin access required' 
    });
  }
  
  next();
};

module.exports = {
  requireAuth,
  optionalAuth,
  requireAdmin
};