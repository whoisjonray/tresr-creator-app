/**
 * Comprehensive Authentication Flow Test Suite
 * Tests Dynamic.xyz authentication, session management, and cookie/CORS settings
 */

const request = require('supertest');
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const jwt = require('jsonwebtoken');

// Mock the database models
jest.mock('../server/models', () => ({
  UserRole: {
    findOne: jest.fn(),
    create: jest.fn()
  },
  CreatorMapping: {
    findOne: jest.fn()
  },
  Creator: {
    findByPk: jest.fn()
  }
}));

// Mock Dynamic Auth service
jest.mock('../server/services/dynamicAuth', () => ({
  verifyToken: jest.fn(),
  createSession: jest.fn(),
  validateSession: jest.fn()
}));

const authV2Routes = require('../server/routes/auth-v2');
const { requireAuth } = require('../server/middleware/auth');
const { UserRole } = require('../server/models');
const dynamicAuth = require('../server/services/dynamicAuth');

describe('Authentication Flow Tests', () => {
  let app;
  let agent;

  beforeEach(() => {
    // Create fresh Express app for each test
    app = express();
    
    // Configure middleware exactly like server
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ extended: true, limit: '50mb' }));
    
    // CORS configuration (matching server)
    app.use(cors({
      origin: [
        'http://localhost:3003',
        'http://localhost:3002',
        'https://creators.tresr.com',
        'https://becc05-b4.myshopify.com'
      ],
      credentials: true
    }));
    
    // Session configuration (using memory store for tests)
    app.use(session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false, // Not secure in tests
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        sameSite: 'lax'
      },
      name: 'tresr.session'
    }));
    
    // Mount auth routes
    app.use('/api/v2/auth', authV2Routes);
    
    // Test route that requires authentication
    app.get('/api/protected', requireAuth, (req, res) => {
      res.json({
        success: true,
        user: req.session.creator,
        sessionId: req.sessionID
      });
    });
    
    // Test route to check session data
    app.get('/api/session-debug', (req, res) => {
      res.json({
        hasSession: !!req.session,
        sessionId: req.sessionID,
        creator: req.session.creator || null,
        cookies: req.headers.cookie || null
      });
    });
    
    // Create agent for persistent cookies
    agent = request.agent(app);
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('Dynamic.xyz Token Verification', () => {
    test('should verify valid JWT token from Dynamic.xyz', async () => {
      const mockUserData = {
        id: 'dyn_12345',
        email: 'test@example.com',
        name: 'Test User',
        walletAddress: '0x123...'
      };
      
      const mockUserRole = {
        id: 1,
        dynamicId: 'dyn_12345',
        email: 'test@example.com',
        role: 'creator',
        update: jest.fn()
      };
      
      dynamicAuth.verifyToken.mockResolvedValue(mockUserData);
      dynamicAuth.createSession.mockReturnValue({
        id: mockUserData.id,
        email: mockUserData.email,
        name: mockUserData.name,
        isAuthenticated: true,
        authenticatedAt: new Date().toISOString()
      });
      UserRole.findOne.mockResolvedValue(mockUserRole);
      
      const validToken = jwt.sign(
        { 
          sub: 'dyn_12345',
          email: 'test@example.com',
          name: 'Test User'
        },
        'test-secret'
      );
      
      const response = await agent
        .post('/api/v2/auth/login')
        .send({ token: validToken })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.user.id).toBe('dyn_12345');
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.user.isAuthenticated).toBe(true);
      expect(dynamicAuth.verifyToken).toHaveBeenCalledWith(validToken);
    });

    test('should handle JSON token format (fallback for newer SDK)', async () => {
      const mockUserData = {
        id: 'dyn_12345',
        email: 'test@example.com',
        name: 'Test User'
      };
      
      const jsonToken = JSON.stringify({
        sub: 'dyn_12345',
        email: 'test@example.com',
        sessionId: 'session_123',
        name: 'Test User'
      });
      
      dynamicAuth.verifyToken.mockResolvedValue(mockUserData);
      dynamicAuth.createSession.mockReturnValue({
        ...mockUserData,
        isAuthenticated: true,
        authenticatedAt: new Date().toISOString()
      });
      UserRole.findOne.mockResolvedValue(null);
      UserRole.create.mockResolvedValue({
        id: 1,
        dynamicId: 'dyn_12345',
        role: 'creator'
      });
      
      const response = await agent
        .post('/api/v2/auth/login')
        .send({ token: jsonToken })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.user.id).toBe('dyn_12345');
    });

    test('should reject invalid tokens', async () => {
      dynamicAuth.verifyToken.mockRejectedValue(new Error('Invalid token'));
      
      const response = await agent
        .post('/api/v2/auth/login')
        .send({ token: 'invalid-token' })
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('TOKEN_VERIFICATION_FAILED');
    });

    test('should reject empty or missing tokens', async () => {
      const response = await agent
        .post('/api/v2/auth/login')
        .send({ token: '' })
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('INVALID_TOKEN');
    });
  });

  describe('Session Creation and req.user Population', () => {
    test('should create session and populate req.session.creator', async () => {
      const mockUserData = {
        id: 'dyn_12345',
        email: 'test@example.com',
        name: 'Test User'
      };
      
      dynamicAuth.verifyToken.mockResolvedValue(mockUserData);
      dynamicAuth.createSession.mockReturnValue({
        ...mockUserData,
        isAuthenticated: true,
        authenticatedAt: new Date().toISOString()
      });
      UserRole.findOne.mockResolvedValue({
        id: 1,
        role: 'creator'
      });
      
      // Login first
      const loginResponse = await agent
        .post('/api/v2/auth/login')
        .send({ token: 'valid-token' })
        .expect(200);
      
      expect(loginResponse.headers['set-cookie']).toBeDefined();
      
      // Check session debug endpoint
      const sessionResponse = await agent
        .get('/api/session-debug')
        .expect(200);
      
      expect(sessionResponse.body.hasSession).toBe(true);
      expect(sessionResponse.body.creator).toBeTruthy();
      expect(sessionResponse.body.creator.id).toBe('dyn_12345');
      expect(sessionResponse.body.creator.isAuthenticated).toBe(true);
    });

    test('should persist session across requests', async () => {
      const mockUserData = {
        id: 'dyn_12345',
        email: 'test@example.com',
        name: 'Test User'
      };
      
      dynamicAuth.verifyToken.mockResolvedValue(mockUserData);
      dynamicAuth.createSession.mockReturnValue({
        ...mockUserData,
        isAuthenticated: true,
        authenticatedAt: new Date().toISOString()
      });
      UserRole.findOne.mockResolvedValue({ role: 'creator' });
      
      // Login
      await agent
        .post('/api/v2/auth/login')
        .send({ token: 'valid-token' })
        .expect(200);
      
      // Test protected route with same agent (persisted cookies)
      const protectedResponse = await agent
        .get('/api/protected')
        .expect(200);
      
      expect(protectedResponse.body.success).toBe(true);
      expect(protectedResponse.body.user.id).toBe('dyn_12345');
      expect(protectedResponse.body.user.isAuthenticated).toBe(true);
    });

    test('should fail protected routes without authentication', async () => {
      const response = await request(app)
        .get('/api/protected')
        .expect(401);
      
      expect(response.body.error).toBe('Authentication required');
    });
  });

  describe('Authentication Middleware Chain', () => {
    test('requireAuth middleware should validate session correctly', async () => {
      // Test without session
      const unauthResponse = await request(app)
        .get('/api/protected')
        .expect(401);
      
      expect(unauthResponse.body.error).toBe('Authentication required');
      
      // Setup authenticated session
      const mockUserData = {
        id: 'dyn_12345',
        email: 'test@example.com',
        name: 'Test User'
      };
      
      dynamicAuth.verifyToken.mockResolvedValue(mockUserData);
      dynamicAuth.createSession.mockReturnValue({
        ...mockUserData,
        isAuthenticated: true,
        authenticatedAt: new Date().toISOString()
      });
      UserRole.findOne.mockResolvedValue({ role: 'creator' });
      
      // Login
      await agent
        .post('/api/v2/auth/login')
        .send({ token: 'valid-token' })
        .expect(200);
      
      // Test authenticated access
      const authResponse = await agent
        .get('/api/protected')
        .expect(200);
      
      expect(authResponse.body.success).toBe(true);
      expect(authResponse.body.user.id).toBe('dyn_12345');
    });

    test('should handle /me endpoint correctly', async () => {
      const mockUserData = {
        id: 'dyn_12345',
        email: 'test@example.com',
        name: 'Test User'
      };
      
      dynamicAuth.verifyToken.mockResolvedValue(mockUserData);
      dynamicAuth.createSession.mockReturnValue({
        ...mockUserData,
        isAuthenticated: true,
        authenticatedAt: new Date().toISOString()
      });
      dynamicAuth.validateSession.mockReturnValue(true);
      UserRole.findOne.mockResolvedValue({ role: 'creator' });
      
      // Login first
      await agent
        .post('/api/v2/auth/login')
        .send({ token: 'valid-token' })
        .expect(200);
      
      // Test /me endpoint
      const meResponse = await agent
        .get('/api/v2/auth/me')
        .expect(200);
      
      expect(meResponse.body.success).toBe(true);
      expect(meResponse.body.user.id).toBe('dyn_12345');
      expect(meResponse.body.user.isAuthenticated).toBe(true);
      expect(meResponse.body.session.valid).toBe(true);
    });
  });

  describe('Cookie and CORS Configuration', () => {
    test('should set session cookies with correct attributes', async () => {
      const mockUserData = {
        id: 'dyn_12345',
        email: 'test@example.com',
        name: 'Test User'
      };
      
      dynamicAuth.verifyToken.mockResolvedValue(mockUserData);
      dynamicAuth.createSession.mockReturnValue({
        ...mockUserData,
        isAuthenticated: true,
        authenticatedAt: new Date().toISOString()
      });
      UserRole.findOne.mockResolvedValue({ role: 'creator' });
      
      const response = await agent
        .post('/api/v2/auth/login')
        .send({ token: 'valid-token' })
        .expect(200);
      
      const setCookieHeader = response.headers['set-cookie'];
      expect(setCookieHeader).toBeDefined();
      
      const sessionCookie = setCookieHeader.find(cookie => 
        cookie.startsWith('tresr.session=')
      );
      expect(sessionCookie).toBeDefined();
      expect(sessionCookie).toContain('HttpOnly');
      expect(sessionCookie).toContain('SameSite=Lax');
      // Should not contain Secure in test environment
      expect(sessionCookie).not.toContain('Secure');
    });

    test('should handle CORS correctly for allowed origins', async () => {
      const allowedOrigins = [
        'http://localhost:3003',
        'http://localhost:3002',
        'https://creators.tresr.com'
      ];
      
      for (const origin of allowedOrigins) {
        const response = await request(app)
          .options('/api/v2/auth/login')
          .set('Origin', origin)
          .set('Access-Control-Request-Method', 'POST')
          .expect(204);
        
        expect(response.headers['access-control-allow-origin']).toBe(origin);
        expect(response.headers['access-control-allow-credentials']).toBe('true');
      }
    });

    test('should reject requests from non-allowed origins', async () => {
      const response = await request(app)
        .options('/api/v2/auth/login')
        .set('Origin', 'https://malicious-site.com')
        .set('Access-Control-Request-Method', 'POST');
      
      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });
  });

  describe('Session Logout and Cleanup', () => {
    test('should destroy session on logout', async () => {
      const mockUserData = {
        id: 'dyn_12345',
        email: 'test@example.com',
        name: 'Test User'
      };
      
      dynamicAuth.verifyToken.mockResolvedValue(mockUserData);
      dynamicAuth.createSession.mockReturnValue({
        ...mockUserData,
        isAuthenticated: true,
        authenticatedAt: new Date().toISOString()
      });
      UserRole.findOne.mockResolvedValue({ role: 'creator' });
      
      // Login
      await agent
        .post('/api/v2/auth/login')
        .send({ token: 'valid-token' })
        .expect(200);
      
      // Verify logged in
      await agent
        .get('/api/protected')
        .expect(200);
      
      // Logout
      await agent
        .post('/api/v2/auth/logout')
        .expect(200);
      
      // Verify logged out
      await agent
        .get('/api/protected')
        .expect(401);
    });

    test('should handle session refresh', async () => {
      const mockUserData = {
        id: 'dyn_12345',
        email: 'test@example.com',
        name: 'Test User'
      };
      
      dynamicAuth.verifyToken.mockResolvedValue(mockUserData);
      dynamicAuth.createSession.mockReturnValue({
        ...mockUserData,
        isAuthenticated: true,
        authenticatedAt: new Date().toISOString()
      });
      dynamicAuth.validateSession.mockReturnValue(true);
      UserRole.findOne.mockResolvedValue({ role: 'creator' });
      
      // Login
      await agent
        .post('/api/v2/auth/login')
        .send({ token: 'valid-token' })
        .expect(200);
      
      // Refresh session
      const refreshResponse = await agent
        .post('/api/v2/auth/refresh')
        .expect(200);
      
      expect(refreshResponse.body.success).toBe(true);
      expect(refreshResponse.body.user.id).toBe('dyn_12345');
      expect(refreshResponse.body.session.refreshedAt).toBeDefined();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle database connection errors gracefully', async () => {
      const mockUserData = {
        id: 'dyn_12345',
        email: 'test@example.com',
        name: 'Test User'
      };
      
      dynamicAuth.verifyToken.mockResolvedValue(mockUserData);
      dynamicAuth.createSession.mockReturnValue({
        ...mockUserData,
        isAuthenticated: true,
        authenticatedAt: new Date().toISOString()
      });
      UserRole.findOne.mockRejectedValue(new Error('Database connection failed'));
      
      // Should still succeed even if database is down
      const response = await agent
        .post('/api/v2/auth/login')
        .send({ token: 'valid-token' })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.user.id).toBe('dyn_12345');
    });

    test('should handle malformed session data', async () => {
      // Manually create corrupted session
      const corruptedApp = express();
      corruptedApp.use(express.json());
      corruptedApp.use(session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false
      }));
      
      corruptedApp.get('/test', (req, res) => {
        req.session.creator = { /* incomplete data */ };
        res.json({ ok: true });
      });
      
      corruptedApp.get('/protected', requireAuth, (req, res) => {
        res.json({ user: req.session.creator });
      });
      
      const corruptedAgent = request.agent(corruptedApp);
      
      // Set corrupted session
      await corruptedAgent.get('/test').expect(200);
      
      // Try to access protected route
      await corruptedAgent
        .get('/protected')
        .expect(401);
    });
  });
});