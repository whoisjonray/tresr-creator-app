const express = require('express');
const router = express.Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');

// Verify Dynamic.xyz JWT and create creator session
router.post('/verify', async (req, res) => {
  try {
    console.log('Auth verify called');
    const { token } = req.body;
    console.log('Token received:', token ? 'Yes' : 'No');
    
    if (!token) {
      console.log('No token provided');
      return res.status(400).json({ error: 'Token required' });
    }

    // For now, decode the JWT to get user info (temporary solution)
    // In production, this should verify the signature with Dynamic's public key
    try {
      const decoded = jwt.decode(token);
      console.log('Decoded JWT:', JSON.stringify(decoded, null, 2));
      
      if (!decoded || !decoded.sub) {
        return res.status(401).json({ error: 'Invalid token format' });
      }

      // Extract user data from JWT
      const userData = {
        id: decoded.sub,
        email: decoded.email || 'creator@tresr.com',
        alias: decoded.alias || decoded.email?.split('@')[0] || 'Creator',
        verifiedCredentials: decoded.verifiedCredentials || []
      };
      
      // For now, allow all authenticated users as creators
      // TODO: Implement proper creator permission checking
      
      // Create session
      req.session.creator = {
        id: userData.id,
        email: userData.email,
        walletAddress: userData.verifiedCredentials?.[0]?.address,
        name: userData.alias || userData.email.split('@')[0],
        isCreator: true
      };
      
      console.log('Created session creator:', req.session.creator);
      console.log('Session ID:', req.sessionID);

      res.json({
        success: true,
        creator: req.session.creator
      });

    } catch (jwtError) {
      console.error('JWT decode error:', jwtError);
      return res.status(401).json({ error: 'Invalid token' });
    }

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
  console.log('Auth /me called');
  console.log('Session ID:', req.sessionID);
  console.log('Session creator:', req.session.creator);
  console.log('NODE_ENV:', process.env.NODE_ENV);
  
  // In development, create a session if none exists
  if (process.env.NODE_ENV === 'development' && !req.session.creator) {
    console.log('Creating dev session');
    req.session.creator = {
      id: 'dev-creator',
      email: 'dev@tresr.com',
      name: 'Dev Creator',
      isCreator: true
    };
  }

  if (!req.session.creator) {
    console.log('No creator session found, returning 401');
    return res.status(401).json({ error: 'Not authenticated' });
  }

  console.log('Returning creator session');
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