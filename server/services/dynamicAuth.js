const axios = require('axios');
const jwt = require('jsonwebtoken');

/**
 * Enhanced Dynamic.xyz Authentication Service
 * Handles JWT validation, user management, and session creation
 */
class DynamicAuthService {
  constructor() {
    this.apiKey = process.env.DYNAMIC_API_KEY;
    this.environmentId = process.env.DYNAMIC_ENV_ID || process.env.DYNAMIC_CLIENT_ID;
    this.apiUrl = 'https://app.dynamic.xyz/api/v0';
  }

  /**
   * Verify a Dynamic.xyz JWT token
   * @param {string} token - JWT token from Dynamic.xyz
   * @returns {Object} Decoded user data
   */
  async verifyToken(token) {
    try {
      // Try to decode as JWT first
      let decoded;
      
      try {
        decoded = jwt.decode(token);
        if (!decoded) {
          throw new Error('Invalid JWT');
        }
      } catch (jwtError) {
        // If JWT decode fails, try parsing as JSON (custom token format)
        try {
          decoded = JSON.parse(token);
        } catch (jsonError) {
          throw new Error('Invalid token format - not JWT or JSON');
        }
      }

      // Validate required fields
      const userId = decoded.sub || decoded.userId;
      if (!userId) {
        throw new Error('Missing user ID in token');
      }

      // Extract user data
      const userData = {
        id: userId,
        email: decoded.email || decoded.verifiedCredentials?.find(c => c.format === 'email')?.address,
        name: decoded.alias || decoded.firstName || decoded.lastName || 
              decoded.username || decoded.email?.split('@')[0] || 'Creator',
        walletAddress: decoded.verifiedCredentials?.find(c => c.format === 'blockchain')?.address,
        verifiedCredentials: decoded.verifiedCredentials || [],
        environmentId: decoded.environmentId || this.environmentId,
        sessionId: decoded.sessionId,
        metadata: {
          provider: decoded.provider,
          lastVerified: decoded.lastVerifiedAt || new Date().toISOString()
        }
      };

      // Optionally verify with Dynamic.xyz API (if API key is available)
      if (this.apiKey && decoded.sub) {
        try {
          await this.verifyWithDynamicAPI(decoded.sub);
        } catch (apiError) {
          console.warn('Dynamic API verification failed, using local decode:', apiError.message);
        }
      }

      return userData;
    } catch (error) {
      console.error('Token verification error:', error);
      throw error;
    }
  }

  /**
   * Verify user with Dynamic.xyz API
   * @param {string} userId - Dynamic user ID
   */
  async verifyWithDynamicAPI(userId) {
    try {
      const response = await axios.get(
        `${this.apiUrl}/environments/${this.environmentId}/users/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Dynamic API verification error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get user by Dynamic ID
   * @param {string} dynamicId - Dynamic user ID
   */
  async getUser(dynamicId) {
    try {
      const response = await axios.get(
        `${this.apiUrl}/environments/${this.environmentId}/users/${dynamicId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const user = response.data.user;
      return {
        id: user.id,
        email: user.email,
        name: user.alias || user.username || user.email?.split('@')[0],
        walletAddress: user.walletPublicKey,
        metadata: user.metadata || {}
      };
    } catch (error) {
      console.error('Failed to get user from Dynamic:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * List all users in the environment
   * @param {Object} options - Query options
   */
  async listUsers(options = {}) {
    try {
      const params = new URLSearchParams();
      if (options.limit) params.append('limit', options.limit);
      if (options.offset) params.append('offset', options.offset);
      if (options.email) params.append('email', options.email);

      const response = await axios.get(
        `${this.apiUrl}/environments/${this.environmentId}/users?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.alias || user.username || user.email?.split('@')[0],
        walletAddress: user.walletPublicKey,
        createdAt: user.createdAt
      }));
    } catch (error) {
      console.error('Failed to list users from Dynamic:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Create or update user session
   * @param {Object} userData - User data from token
   * @param {Object} session - Express session object
   */
  createSession(userData, session) {
    session.creator = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      walletAddress: userData.walletAddress,
      isCreator: true,
      isAuthenticated: true,
      authenticatedAt: new Date().toISOString()
    };

    // Log session creation for audit
    console.log('🔐 Session created for user:', {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      sessionId: session.id
    });

    return session.creator;
  }

  /**
   * Validate an existing session
   * @param {Object} session - Express session object
   */
  validateSession(session) {
    if (!session.creator || !session.creator.id) {
      return false;
    }

    // Check session age (optional - expire after 24 hours)
    const sessionAge = Date.now() - new Date(session.creator.authenticatedAt).getTime();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    if (sessionAge > maxAge) {
      console.log('Session expired for user:', session.creator.id);
      return false;
    }

    return true;
  }

  /**
   * Get OAuth redirect URL
   * @param {string} redirectUri - Callback URL after authentication
   */
  getOAuthUrl(redirectUri) {
    const params = new URLSearchParams({
      environmentId: this.environmentId,
      redirectUri: redirectUri,
      response_type: 'token'
    });

    return `https://app.dynamic.xyz/oauth/authorize?${params}`;
  }

  /**
   * Exchange OAuth code for token (if using code flow)
   * @param {string} code - OAuth authorization code
   * @param {string} redirectUri - Callback URL
   */
  async exchangeCodeForToken(code, redirectUri) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/oauth/token`,
        {
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: redirectUri,
          client_id: this.environmentId
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Failed to exchange code for token:', error.response?.data || error.message);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new DynamicAuthService();