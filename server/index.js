require('dotenv').config({ path: '../../.env' });
const express = require('express');
console.log('🚀 SERVER STARTED - BUILD v2.0 -', new Date().toISOString());
const cors = require('cors');
const session = require('express-session');
const { createClient } = require('redis');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const productsRoutes = require('./routes/products');
const mockupsRoutes = require('./routes/mockups');
const creatorsRoutes = require('./routes/creators');
const adminRoutes = require('./routes/admin');
const designsRoutes = require('./routes/designs');

// Initialize database
const databaseService = require('./services/database');

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
const useDbSessions = !isDevelopment || isRailway || process.env.MYSQL_URL;

if (useDbSessions) {
  // Use database store in production and Railway
  const SequelizeStore = require('connect-session-sequelize')(session.Store);
  const { sequelize } = require('./models');
  
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

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/mockups', mockupsRoutes);
app.use('/api/creators', creatorsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/designs', designsRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the React app
  app.use(express.static(path.join(__dirname, '../client/dist')));
  
  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: true,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: true,
    message: 'Route not found'
  });
});

// Start server
const actualPort = process.env.PORT || PORT;
console.log(`Railway PORT: ${process.env.PORT}, Configured PORT: ${PORT}, Using: ${actualPort}`);

app.listen(actualPort, '0.0.0.0', () => {
  console.log(`TRESR Creator Server running on port ${actualPort}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Dynamic.xyz Auth URL: ${process.env.DYNAMIC_AUTH_URL || 'Not configured'}`);
  console.log(`Shopify Backend URL: ${process.env.SHOPIFY_APP_URL || 'Not configured'}`);
});