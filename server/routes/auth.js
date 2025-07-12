const express = require('express');
const router = express.Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');

// Verify Dynamic.xyz JWT and create creator session
router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    // Verify token with Dynamic.xyz backend
    const verifyResponse = await axios.post(
      `${process.env.SHOPIFY_APP_URL || 'https://vibes.tresr.com'}/api/dynamic-verify`,
      { jwt: token }
    );

    if (!verifyResponse.data.success) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userData = verifyResponse.data.user;
    
    // Check if user is a creator
    const isCreator = userData.metadata?.is_creator || 
                     userData.tags?.includes('creator') ||
                     false;

    if (!isCreator) {
      return res.status(403).json({ 
        error: 'Access denied. Creator account required.' 
      });
    }

    // Create session
    req.session.creator = {
      id: userData.id,
      email: userData.email,
      walletAddress: userData.verifiedCredentials?.[0]?.address,
      name: userData.alias || userData.email.split('@')[0],
      shopifyCustomerId: userData.metadata?.shopify_customer_id
    };

    res.json({
      success: true,
      creator: req.session.creator
    });

  } catch (error) {
    console.error('Auth verification error:', error);
    res.status(500).json({ 
      error: 'Authentication failed',
      message: error.message 
    });
  }
});

// Get current creator session
router.get('/me', (req, res) => {
  // In development, create a session if none exists
  if (process.env.NODE_ENV === 'development' && !req.session.creator) {
    req.session.creator = {
      id: 'dev-creator',
      email: 'dev@tresr.com',
      name: 'Dev Creator',
      isCreator: true
    };
  }

  if (!req.session.creator) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  res.json({
    success: true,
    creator: req.session.creator
  });
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ success: true });
  });
});

// OAuth callback handler for Dynamic.xyz
router.get('/callback', async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.redirect('/login?error=no_token');
    }

    // Verify token
    const verifyResponse = await axios.post(
      `${process.env.SHOPIFY_APP_URL}/api/dynamic-verify`,
      { jwt: token }
    );

    if (verifyResponse.data.success) {
      // Create session (handled by /verify endpoint)
      // Redirect to creator dashboard
      res.redirect('/dashboard');
    } else {
      res.redirect('/login?error=invalid_token');
    }

  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect('/login?error=auth_failed');
  }
});

module.exports = router;