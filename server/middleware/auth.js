// Authentication middleware
const requireAuth = (req, res, next) => {
  // Allow development access
  if (process.env.NODE_ENV === 'development') {
    req.session = req.session || {};
    req.session.creator = {
      id: 'dev-creator',
      email: 'dev@tresr.com',
      name: 'Dev Creator'
    };
    return next();
  }
  
  if (!req.session.creator) {
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'Please log in to continue'
    });
  }
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