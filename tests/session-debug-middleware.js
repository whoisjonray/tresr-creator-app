/**
 * Session Debug Middleware
 * Provides detailed logging for authentication flow debugging
 */

/**
 * Middleware to debug session state and authentication flow
 */
const sessionDebugMiddleware = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const requestId = req.headers['x-request-id'] || `req_${Date.now()}`;
  
  console.log('\n🔍 === SESSION DEBUG ===');
  console.log(`Time: ${timestamp}`);
  console.log(`Request ID: ${requestId}`);
  console.log(`Method: ${req.method}`);
  console.log(`Path: ${req.originalUrl}`);
  console.log(`IP: ${req.ip || req.connection.remoteAddress}`);
  console.log(`User-Agent: ${req.get('User-Agent')}`);
  
  // Session analysis
  console.log('\n📋 Session Analysis:');
  console.log(`Session exists: ${!!req.session}`);
  console.log(`Session ID: ${req.sessionID || 'none'}`);
  
  if (req.session) {
    console.log(`Session data keys: ${Object.keys(req.session)}`);
    console.log(`Has creator: ${!!req.session.creator}`);
    
    if (req.session.creator) {
      console.log(`Creator ID: ${req.session.creator.id}`);
      console.log(`Creator email: ${req.session.creator.email}`);
      console.log(`Creator name: ${req.session.creator.name}`);
      console.log(`Is authenticated: ${req.session.creator.isAuthenticated}`);
      console.log(`Authenticated at: ${req.session.creator.authenticatedAt}`);
      console.log(`Role: ${req.session.creator.role || 'none'}`);
      console.log(`Is admin: ${req.session.creator.isAdmin || false}`);
    }
  }
  
  // Cookie analysis
  console.log('\n🍪 Cookie Analysis:');
  const cookies = req.headers.cookie;
  if (cookies) {
    console.log(`Raw cookies: ${cookies}`);
    const cookieArray = cookies.split(';').map(c => c.trim());
    console.log(`Cookie count: ${cookieArray.length}`);
    
    const sessionCookie = cookieArray.find(c => c.startsWith('tresr.session='));
    console.log(`Session cookie found: ${!!sessionCookie}`);
    if (sessionCookie) {
      console.log(`Session cookie length: ${sessionCookie.length}`);
    }
  } else {
    console.log('No cookies found');
  }
  
  // Headers analysis
  console.log('\n📡 Headers Analysis:');
  console.log(`Content-Type: ${req.get('Content-Type') || 'none'}`);
  console.log(`Authorization: ${req.get('Authorization') ? 'present' : 'none'}`);
  console.log(`Origin: ${req.get('Origin') || 'none'}`);
  console.log(`Referer: ${req.get('Referer') || 'none'}`);
  
  // Dynamic.xyz specific
  console.log('\n🔐 Dynamic.xyz Analysis:');
  if (req.body && req.body.token) {
    console.log(`Token present: true`);
    console.log(`Token length: ${req.body.token.length}`);
    console.log(`Token type: ${req.body.token.startsWith('{') ? 'JSON' : 'JWT'}`);
    console.log(`Token preview: ${req.body.token.substring(0, 50)}...`);
  } else {
    console.log('No token in request body');
  }
  
  console.log('🔍 ================\n');
  
  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(body) {
    console.log('\n📤 === RESPONSE DEBUG ===');
    console.log(`Request ID: ${requestId}`);
    console.log(`Status: ${res.statusCode}`);
    console.log(`Response size: ${JSON.stringify(body).length} bytes`);
    
    if (body.success !== undefined) {
      console.log(`Success: ${body.success}`);
    }
    
    if (body.error) {
      console.log(`Error: ${body.error}`);
      console.log(`Message: ${body.message || 'none'}`);
    }
    
    if (body.user) {
      console.log(`User returned: ${!!body.user}`);
      console.log(`User ID: ${body.user.id || 'none'}`);
      console.log(`User authenticated: ${body.user.isAuthenticated || false}`);
    }
    
    if (body.session) {
      console.log(`Session info: ${!!body.session}`);
      console.log(`Session ID: ${body.session.id || 'none'}`);
    }
    
    // Check if Set-Cookie headers are being sent
    const setCookie = res.getHeaders()['set-cookie'];
    if (setCookie) {
      console.log(`Set-Cookie headers: ${setCookie.length}`);
      setCookie.forEach((cookie, index) => {
        console.log(`  Cookie ${index + 1}: ${cookie.substring(0, 100)}...`);
      });
    } else {
      console.log('No Set-Cookie headers');
    }
    
    console.log('📤 ==================\n');
    
    return originalJson.call(this, body);
  };
  
  next();
};

/**
 * Middleware specifically for authentication routes
 */
const authDebugMiddleware = (req, res, next) => {
  console.log('\n🔐 === AUTH DEBUG START ===');
  console.log(`Auth endpoint: ${req.originalUrl}`);
  console.log(`Method: ${req.method}`);
  
  // Track session changes
  const originalSessionData = req.session ? JSON.stringify(req.session) : null;
  
  // Override session save to track changes
  if (req.session) {
    const originalSave = req.session.save;
    req.session.save = function(callback) {
      console.log('💾 Session save triggered');
      console.log(`Session ID: ${req.sessionID}`);
      console.log(`Session data: ${JSON.stringify(req.session, null, 2)}`);
      
      return originalSave.call(this, (err) => {
        if (err) {
          console.error('❌ Session save failed:', err);
        } else {
          console.log('✅ Session saved successfully');
        }
        if (callback) callback(err);
      });
    };
  }
  
  // Hook into response to track session changes
  const originalEnd = res.end;
  res.end = function(...args) {
    const finalSessionData = req.session ? JSON.stringify(req.session) : null;
    
    if (originalSessionData !== finalSessionData) {
      console.log('\n🔄 Session changed during request:');
      console.log('Before:', originalSessionData);
      console.log('After:', finalSessionData);
    }
    
    console.log('🔐 === AUTH DEBUG END ===\n');
    return originalEnd.apply(this, args);
  };
  
  next();
};

/**
 * Middleware to test session persistence
 */
const sessionPersistenceTest = (req, res, next) => {
  // Only run on specific test endpoint
  if (req.path !== '/api/test-session-persistence') {
    return next();
  }
  
  console.log('\n🧪 === SESSION PERSISTENCE TEST ===');
  
  if (req.method === 'POST') {
    // Set test data in session
    req.session.testData = {
      timestamp: Date.now(),
      requestId: `test_${Math.random().toString(36).substr(2, 9)}`,
      userAgent: req.get('User-Agent')
    };
    
    req.session.save((err) => {
      if (err) {
        console.error('❌ Failed to save test session:', err);
        return res.status(500).json({ error: 'Session save failed' });
      }
      
      console.log('✅ Test session data saved');
      console.log(`Session ID: ${req.sessionID}`);
      console.log(`Test data: ${JSON.stringify(req.session.testData)}`);
      
      res.json({
        success: true,
        sessionId: req.sessionID,
        testData: req.session.testData
      });
    });
  } else if (req.method === 'GET') {
    // Retrieve test data from session
    console.log(`Checking session: ${req.sessionID}`);
    console.log(`Session exists: ${!!req.session}`);
    console.log(`Test data exists: ${!!req.session?.testData}`);
    
    if (req.session?.testData) {
      console.log(`Retrieved test data: ${JSON.stringify(req.session.testData)}`);
      console.log(`Data age: ${Date.now() - req.session.testData.timestamp}ms`);
    }
    
    res.json({
      success: true,
      sessionId: req.sessionID,
      hasSession: !!req.session,
      testData: req.session?.testData || null,
      allSessionKeys: req.session ? Object.keys(req.session) : []
    });
  }
  
  console.log('🧪 ========================\n');
};

/**
 * Dynamic.xyz token analysis middleware
 */
const dynamicTokenAnalysis = (req, res, next) => {
  if (req.body?.token && req.path.includes('/auth/')) {
    console.log('\n🎯 === DYNAMIC TOKEN ANALYSIS ===');
    
    const token = req.body.token;
    console.log(`Token length: ${token.length}`);
    console.log(`Token starts with: ${token.substring(0, 20)}...`);
    
    // Try to determine token type
    if (token.startsWith('{')) {
      console.log('Token type: JSON format');
      try {
        const parsed = JSON.parse(token);
        console.log('JSON token fields:');
        Object.keys(parsed).forEach(key => {
          console.log(`  ${key}: ${typeof parsed[key]} (${String(parsed[key]).substring(0, 50)}...)`);
        });
      } catch (e) {
        console.log('❌ Failed to parse as JSON:', e.message);
      }
    } else {
      console.log('Token type: JWT format');
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.decode(token, { complete: true });
        if (decoded) {
          console.log('JWT header:', decoded.header);
          console.log('JWT payload fields:');
          Object.keys(decoded.payload).forEach(key => {
            console.log(`  ${key}: ${typeof decoded.payload[key]} (${String(decoded.payload[key]).substring(0, 50)}...)`);
          });
        }
      } catch (e) {
        console.log('❌ Failed to decode as JWT:', e.message);
      }
    }
    
    console.log('🎯 ==========================\n');
  }
  
  next();
};

module.exports = {
  sessionDebugMiddleware,
  authDebugMiddleware,
  sessionPersistenceTest,
  dynamicTokenAnalysis
};