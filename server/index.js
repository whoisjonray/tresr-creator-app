require('dotenv').config({ path: '../../.env' });
const express = require('express');
console.log('🚀 SERVER STARTED - BUILD v2.0 -', new Date().toISOString());
const cors = require('cors');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const { createClient } = require('redis');
const path = require('path');

// Import routes - v1 (legacy)
const authRoutes = require('./routes/auth');
const productsRoutes = require('./routes/products');
const mockupsRoutes = require('./routes/mockups');
const creatorsRoutes = require('./routes/creators');
const adminRoutes = require('./routes/admin');
const designsRoutes = require('./routes/designs');
const scansRoutes = require('./routes/scans');
const importSanityRoutes = require('./routes/importSanityDesign');

// Import v2 routes with enhanced features
// v2 routes - temporarily using fixed versions
const authV2Routes = require('./routes/auth-v2');
const usersV2Routes = require('./routes/users-v2-fixed');
// const sanityImportV2Routes = require('./routes/sanity-import-v2');
// const shopifyV2Routes = require('./routes/shopify-v2');

// Initialize database
const databaseService = require('./services/database');
const { initializeDatabase } = require('./services/database-init');

const app = express();
const PORT = process.env.PORT || process.env.CREATOR_APP_PORT || 3002;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3003',
    'http://localhost:3002',
    'https://creators.tresr.com',
    'https://becc05-b4.myshopify.com'
  ],
  credentials: true
}));

// Session configuration
const isDevelopment = process.env.NODE_ENV !== 'production';
const isRailway = process.env.RAILWAY_ENVIRONMENT === 'production';
const { sequelize } = require('./models');
const hasDatabase = sequelize !== null && (process.env.MYSQL_URL || process.env.DATABASE_URL || process.env.MYSQLHOST);
const useDbSessions = hasDatabase && (!isDevelopment || isRailway);

if (useDbSessions) {
  // Use database store in production and Railway
  const SequelizeStore = require('connect-session-sequelize')(session.Store);
  
  const sessionStore = new SequelizeStore({
    db: sequelize,
    tableName: 'sessions',
    checkExpirationInterval: 15 * 60 * 1000, // Clean up expired sessions every 15 minutes
    expiration: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
  
  app.use(session({
    secret: process.env.SESSION_SECRET || 'tresr-creator-app-secret-2025',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // Secure in production
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax',
      domain: process.env.COOKIE_DOMAIN || undefined // For Railway custom domains
    },
    name: 'tresr.session',
    proxy: true // Trust proxy for Railway
  }));
  
  // Sync session store after database is ready
  setTimeout(() => {
    sessionStore.sync()
      .then(() => console.log('✅ Session store synced'))
      .catch(err => console.error('❌ Session store sync failed:', err));
  }, 1000);
} else {
  // Use memory store in development
  console.log('📦 Using memory session store for development');
  app.use(session({
    secret: process.env.SESSION_SECRET || 'tresr-creator-app-secret-2025',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Not secure in development
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax'
    },
    name: 'tresr.session'
  }));
}

// Security headers middleware for v2 routes
app.use('/api/v2', (req, res, next) => {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // API version header
  res.setHeader('X-API-Version', '2.0');
  
  next();
});

// Rate limiting for v2 routes
const v2RateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs for v2 routes
  message: {
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests to v2 API. Please try again later.',
    retryAfter: Math.ceil(15 * 60 * 1000 / 1000) // in seconds
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  }
});

app.use('/api/v2', v2RateLimit);

// Request logging middleware for v2 routes
app.use('/api/v2', (req, res, next) => {
  const startTime = Date.now();
  
  // Generate request ID if not present
  const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  
  // Log request details
  console.log(`🔗 [${new Date().toISOString()}] ${req.method} ${req.originalUrl}`, {
    requestId,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    sessionId: req.session?.id || 'no-session',
    contentType: req.get('Content-Type')
  });
  
  // Override res.json to log response details
  const originalJson = res.json;
  res.json = function(body) {
    const duration = Date.now() - startTime;
    console.log(`✅ [${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`, {
      requestId,
      responseSize: JSON.stringify(body).length
    });
    
    if (res.statusCode >= 400) {
      console.error(`❌ Error Response [${requestId}]:`, body);
    }
    
    return originalJson.call(this, body);
  };
  
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '2.0',
    routes: {
      v1: ['auth', 'products', 'mockups', 'creators', 'admin', 'designs', 'scans', 'sanity', 'shopify'],
      v2: ['auth', 'users', 'sanity', 'shopify']
    }
  });
});

// API Routes - v2 (Enhanced) - Mount first for priority
app.use('/api/v2/auth', authV2Routes);
app.use('/api/v2/users', usersV2Routes);
// Temporarily disabled until fixed
// app.use('/api/v2/sanity', sanityImportV2Routes);
// app.use('/api/v2/shopify', shopifyV2Routes);

// Debug route for testing imports
app.use('/api/debug', require('./routes/debug-import'));
app.use('/api/fix', require('./routes/fix-production'));
app.use('/api/fix', require('./routes/fix-missing-thumbnails'));
// Temporarily disabled - causing Railway crashes
// app.use('/api/fix', require('./routes/fix-all-thumbnails-production'));
app.use('/api/fix', require('./routes/hardcoded-thumbnail-fix'));
app.use('/api/fix', require('./routes/simple-thumbnail-fix'));
app.use('/api/fix', require('./routes/direct-database-fix'));
app.use('/api/fix', require('./routes/fix-edit-page-data'));
app.use('/api/fix', require('./routes/emergency-fix-edit-page')); // 🚨 PRODUCTION EMERGENCY FIX
app.use('/api/test', require('./routes/test-thumbnail-endpoint'));
app.use('/api/debug', require('./routes/debug-design-data'));
app.use('/api/fix-design-editor', require('./routes/fix-design-editor-data'));
app.use('/api/fix', require('./routes/final-comprehensive-fix'));
// Sanity image fix - won't crash if @sanity/client not available
try {
  app.use('/api/fix', require('./routes/fix-design-images-from-sanity'));
} catch (err) {
  console.warn('⚠️ Sanity image fix route not loaded (package not available)');
}
// Cloudinary mapping fix - no external dependencies, always safe
app.use('/api/fix', require('./routes/fix-with-cloudinary-mappings'));
// Just Grok It focused fix
app.use('/api/fix', require('./routes/fix-just-grok-it'));
app.use('/api/schema', require('./routes/fix-production-schema'));
app.use('/api/fix', require('./routes/fix-publish-validation'));
app.use('/api/fix', require('./routes/fix-update-existing-product'));

// CRITICAL: Main import endpoint that frontend actually calls!
app.use('/api/sanity/person', require('./routes/sanity-person-import'));
// Temporarily disabled to fix Railway deployment
// app.use('/api/sanity/enhanced', require('./routes/enhanced-import-with-all-images'));

// API Routes - v1 (Legacy) - Maintain backward compatibility
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/mockups', mockupsRoutes);
app.use('/api/creators', creatorsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/impersonate', require('./routes/admin/impersonate'));
app.use('/api/designs', designsRoutes);
app.use('/api', scansRoutes);
app.use('/api/sanity', importSanityRoutes);

// Legacy shopify route (keep for backward compatibility)
// app.use('/api/shopify', shopifyV2Routes);

// Only load Sanity person routes if @sanity/client is available
try {
  require('@sanity/client');
  app.use('/api/sanity/person', require('./routes/sanity/importPersonDesigns'));
} catch (error) {
  console.log('⚠️ Sanity client not available, skipping person import routes');
}
app.use('/api/settings', require('./routes/settings-db'));
app.use('/api/ai', require('./routes/ai-analysis'));

// TEST ROUTES: Data flow debugging
app.use('/api/test', require('./routes/test-data-flow'));
// Temporarily disabled to fix Railway deployment
// app.use('/api/test/thumbnails', require('./routes/test-thumbnail-display'));

// DEBUG ROUTES: Authentication flow debugging (temporary)
app.use('/api/debug-auth', require('./debug-auth-test'));
app.use('/api/templates', require('./routes/productTemplates'));
app.use('/api/env', require('./routes/env-check'));

// Temporary setup route (remove after setup)
app.use('/api/setup', require('./routes/setup-mapping'));
app.use('/api/test', require('./routes/test-import'));
app.use('/api/direct', require('./routes/direct-import'));
app.use('/api/simple', require('./routes/simple-test'));
app.use('/api/debug', require('./routes/debug-database'));
app.use('/api/super-simple', require('./routes/super-simple-import'));
app.use('/api/import-now', require('./routes/import-all-now'));

// Fulfillment routes for print shop integration
app.use('/api/fulfillment', require('./routes/fulfillment'));

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the React app
  app.use(express.static(path.join(__dirname, '../client/dist')));
  
  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
  });
}

// Enhanced error handling middleware for v2 routes
app.use('/api/v2', (err, req, res, next) => {
  console.error(`❌ [v2 Error] ${req.method} ${req.originalUrl}:`, {
    error: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString(),
    sessionId: req.session?.id || 'no-session'
  });

  // Enhanced error response for v2 routes
  const errorResponse = {
    success: false,
    error: err.code || 'INTERNAL_ERROR',
    message: err.message || 'An unexpected error occurred',
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id'] || `req_${Date.now()}`,
    ...(process.env.NODE_ENV !== 'production' && { 
      stack: err.stack,
      details: err.details || null 
    })
  };

  // Set appropriate status code
  let statusCode = err.status || err.statusCode || 500;
  
  // Map common error types to status codes
  if (err.code === 'VALIDATION_ERROR') statusCode = 400;
  else if (err.code === 'UNAUTHORIZED') statusCode = 401;
  else if (err.code === 'FORBIDDEN') statusCode = 403;
  else if (err.code === 'NOT_FOUND') statusCode = 404;
  else if (err.code === 'RATE_LIMIT_EXCEEDED') statusCode = 429;

  res.status(statusCode).json(errorResponse);
});

// General error handling middleware (for v1 routes)
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Check if response was already sent
  if (res.headersSent) {
    return next(err);
  }
  
  res.status(err.status || 500).json({
    error: true,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Enhanced 404 handler
app.use((req, res) => {
  const isV2Route = req.originalUrl.startsWith('/api/v2');
  
  if (isV2Route) {
    res.status(404).json({
      success: false,
      error: 'ROUTE_NOT_FOUND',
      message: `API endpoint ${req.originalUrl} not found`,
      timestamp: new Date().toISOString(),
      availableEndpoints: {
        auth: '/api/v2/auth',
        users: '/api/v2/users', 
        sanity: '/api/v2/sanity',
        shopify: '/api/v2/shopify'
      }
    });
  } else {
    res.status(404).json({
      error: true,
      message: 'Route not found'
    });
  }
});

// Start server
const actualPort = process.env.PORT || PORT;
console.log(`Railway PORT: ${process.env.PORT}, Configured PORT: ${PORT}, Using: ${actualPort}`);

app.listen(actualPort, '0.0.0.0', async () => {
  console.log(`TRESR Creator Server running on port ${actualPort}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Dynamic.xyz Auth URL: ${process.env.DYNAMIC_AUTH_URL || 'Not configured'}`);
  console.log(`Shopify Backend URL: ${process.env.SHOPIFY_APP_URL || 'Not configured'}`);
  
  // Display available API routes
  console.log('\n📡 API Routes Available:');
  console.log('🔹 v2 Routes (Enhanced):');
  console.log('  • POST   /api/v2/auth/login        - Enhanced authentication');
  console.log('  • GET    /api/v2/users/profile     - User profile management');
  console.log('  • POST   /api/v2/sanity/import     - Batch Sanity imports');
  console.log('  • GET    /api/v2/shopify/products  - Shopify product sync');
  console.log('🔹 v1 Routes (Legacy - Maintained):');
  console.log('  • /api/auth/* - Authentication');
  console.log('  • /api/products/* - Product management');
  console.log('  • /api/creators/* - Creator management');
  console.log('  • /api/admin/* - Admin functions');
  console.log('  • /api/designs/* - Design operations');
  
  // Initialize database tables after server starts
  setTimeout(async () => {
    await initializeDatabase();
    console.log('✅ Server initialization complete\n');
  }, 2000);
});