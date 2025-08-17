/**
 * Temporary debug route to test authentication flow
 * This can be removed after debugging is complete
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('./middleware/auth');
const { 
  sessionDebugMiddleware, 
  authDebugMiddleware, 
  sessionPersistenceTest,
  dynamicTokenAnalysis 
} = require('../tests/session-debug-middleware');

// Apply debug middleware to all routes in this router
router.use(sessionDebugMiddleware);
router.use(dynamicTokenAnalysis);

// Session debug endpoint
router.get('/session-debug', (req, res) => {
  res.json({
    hasSession: !!req.session,
    sessionId: req.sessionID,
    creator: req.session?.creator || null,
    cookies: req.headers.cookie || null,
    sessionKeys: req.session ? Object.keys(req.session) : [],
    timestamp: new Date().toISOString()
  });
});

// Protected route for testing authentication
router.get('/protected', requireAuth, (req, res) => {
  res.json({
    success: true,
    message: 'Access granted to protected route',
    user: req.session.creator,
    sessionId: req.sessionID,
    timestamp: new Date().toISOString()
  });
});

// Session persistence test
router.use('/test-session-persistence', sessionPersistenceTest);

// Apply auth debug to all auth-related routes
router.use('/v2/auth/*', authDebugMiddleware);

module.exports = router;