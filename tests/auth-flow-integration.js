/**
 * Authentication Flow Integration Test
 * Real integration test that can be run against the actual server
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');

class AuthFlowTester {
  constructor(baseURL = 'http://localhost:3002') {
    this.baseURL = baseURL;
    this.sessionCookies = '';
    this.testResults = [];
  }

  log(message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, message, data };
    console.log(`[${timestamp}] ${message}`, data || '');
    this.testResults.push(logEntry);
  }

  async makeRequest(method, path, data = null, headers = {}) {
    try {
      const config = {
        method,
        url: `${this.baseURL}${path}`,
        headers: {
          'Content-Type': 'application/json',
          'Cookie': this.sessionCookies,
          ...headers
        },
        withCredentials: true,
        validateStatus: () => true // Don't throw on error status codes
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);

      // Update session cookies if present
      const setCookieHeaders = response.headers['set-cookie'];
      if (setCookieHeaders) {
        this.sessionCookies = setCookieHeaders.join('; ');
        this.log('Session cookies updated', this.sessionCookies);
      }

      return response;
    } catch (error) {
      this.log('Request failed', { error: error.message });
      throw error;
    }
  }

  createMockDynamicToken(userData = {}) {
    const defaultData = {
      sub: userData.id || 'dyn_test_12345',
      email: userData.email || 'test@example.com',
      name: userData.name || 'Test User',
      sessionId: 'sess_' + Math.random().toString(36).substr(2, 9),
      environmentId: 'b17e8631-c1b7-45d5-95cf-151eb5246423',
      verifiedCredentials: [
        {
          format: 'email',
          address: userData.email || 'test@example.com'
        }
      ]
    };

    const mergedData = { ...defaultData, ...userData };

    // Return JWT token
    return jwt.sign(mergedData, 'test-secret-key', { expiresIn: '24h' });
  }

  createMockJsonToken(userData = {}) {
    const defaultData = {
      sub: userData.id || 'dyn_test_12345',
      email: userData.email || 'test@example.com',
      name: userData.name || 'Test User',
      sessionId: 'sess_' + Math.random().toString(36).substr(2, 9)
    };

    return JSON.stringify({ ...defaultData, ...userData });
  }

  async testServerHealth() {
    this.log('🏥 Testing server health...');
    
    try {
      const response = await this.makeRequest('GET', '/health');
      
      if (response.status === 200) {
        this.log('✅ Server is healthy', response.data);
        return true;
      } else {
        this.log('❌ Server health check failed', { status: response.status, data: response.data });
        return false;
      }
    } catch (error) {
      this.log('❌ Server health check error', error.message);
      return false;
    }
  }

  async testSessionDebugEndpoint() {
    this.log('🔍 Testing session debug endpoint...');
    
    try {
      const response = await this.makeRequest('GET', '/api/debug-auth/session-debug');
      
      this.log('Session debug response', {
        status: response.status,
        data: response.data
      });

      return response.data;
    } catch (error) {
      this.log('❌ Session debug test failed', error.message);
      return null;
    }
  }

  async testDynamicLogin(tokenType = 'jwt') {
    this.log(`🔐 Testing Dynamic.xyz login with ${tokenType} token...`);
    
    try {
      const userData = {
        id: 'dyn_test_' + Math.random().toString(36).substr(2, 9),
        email: 'test@tresr.com',
        name: 'Test Creator'
      };

      const token = tokenType === 'jwt' 
        ? this.createMockDynamicToken(userData)
        : this.createMockJsonToken(userData);

      this.log('Generated token', { type: tokenType, length: token.length, preview: token.substring(0, 100) + '...' });

      const response = await this.makeRequest('POST', '/api/v2/auth/login', { token });

      this.log('Login response', {
        status: response.status,
        success: response.data?.success,
        user: response.data?.user,
        error: response.data?.error
      });

      if (response.status === 200 && response.data?.success) {
        this.log('✅ Login successful');
        return response.data;
      } else {
        this.log('❌ Login failed', response.data);
        return null;
      }
    } catch (error) {
      this.log('❌ Login test error', error.message);
      return null;
    }
  }

  async testSessionPersistence() {
    this.log('🔄 Testing session persistence...');
    
    try {
      // Test /me endpoint to check if session persists
      const response = await this.makeRequest('GET', '/api/v2/auth/me');

      this.log('Session persistence check', {
        status: response.status,
        success: response.data?.success,
        user: response.data?.user,
        session: response.data?.session
      });

      if (response.status === 200 && response.data?.success) {
        this.log('✅ Session persisted successfully');
        return true;
      } else {
        this.log('❌ Session persistence failed', response.data);
        return false;
      }
    } catch (error) {
      this.log('❌ Session persistence test error', error.message);
      return false;
    }
  }

  async testProtectedRoute() {
    this.log('🛡️ Testing protected route access...');
    
    try {
      const response = await this.makeRequest('GET', '/api/debug-auth/protected');

      this.log('Protected route response', {
        status: response.status,
        success: response.data?.success,
        user: response.data?.user,
        error: response.data?.error
      });

      if (response.status === 200 && response.data?.success) {
        this.log('✅ Protected route access successful');
        return true;
      } else {
        this.log('❌ Protected route access failed', response.data);
        return false;
      }
    } catch (error) {
      this.log('❌ Protected route test error', error.message);
      return false;
    }
  }

  async testSessionRefresh() {
    this.log('🔄 Testing session refresh...');
    
    try {
      const response = await this.makeRequest('POST', '/api/v2/auth/refresh');

      this.log('Session refresh response', {
        status: response.status,
        success: response.data?.success,
        user: response.data?.user,
        session: response.data?.session
      });

      if (response.status === 200 && response.data?.success) {
        this.log('✅ Session refresh successful');
        return true;
      } else {
        this.log('❌ Session refresh failed', response.data);
        return false;
      }
    } catch (error) {
      this.log('❌ Session refresh test error', error.message);
      return false;
    }
  }

  async testLogout() {
    this.log('🚪 Testing logout...');
    
    try {
      const response = await this.makeRequest('POST', '/api/v2/auth/logout');

      this.log('Logout response', {
        status: response.status,
        success: response.data?.success,
        message: response.data?.message
      });

      if (response.status === 200 && response.data?.success) {
        this.log('✅ Logout successful');
        
        // Clear session cookies
        this.sessionCookies = '';
        
        return true;
      } else {
        this.log('❌ Logout failed', response.data);
        return false;
      }
    } catch (error) {
      this.log('❌ Logout test error', error.message);
      return false;
    }
  }

  async testPostLogoutAccess() {
    this.log('🔒 Testing post-logout access...');
    
    try {
      const response = await this.makeRequest('GET', '/api/v2/auth/me');

      this.log('Post-logout access response', {
        status: response.status,
        success: response.data?.success,
        error: response.data?.error
      });

      if (response.status === 401 && !response.data?.success) {
        this.log('✅ Post-logout access correctly denied');
        return true;
      } else {
        this.log('❌ Post-logout access check failed - should be denied', response.data);
        return false;
      }
    } catch (error) {
      this.log('❌ Post-logout access test error', error.message);
      return false;
    }
  }

  async testInvalidToken() {
    this.log('🚫 Testing invalid token handling...');
    
    try {
      const response = await this.makeRequest('POST', '/api/v2/auth/login', { 
        token: 'invalid-token-12345' 
      });

      this.log('Invalid token response', {
        status: response.status,
        success: response.data?.success,
        error: response.data?.error
      });

      if (response.status === 401 && !response.data?.success) {
        this.log('✅ Invalid token correctly rejected');
        return true;
      } else {
        this.log('❌ Invalid token handling failed', response.data);
        return false;
      }
    } catch (error) {
      this.log('❌ Invalid token test error', error.message);
      return false;
    }
  }

  async testCorsHeaders() {
    this.log('🌐 Testing CORS headers...');
    
    try {
      const allowedOrigins = [
        'http://localhost:3003',
        'https://creators.tresr.com'
      ];

      for (const origin of allowedOrigins) {
        const response = await this.makeRequest('OPTIONS', '/api/v2/auth/login', null, {
          'Origin': origin,
          'Access-Control-Request-Method': 'POST'
        });

        this.log(`CORS test for origin: ${origin}`, {
          status: response.status,
          allowOrigin: response.headers['access-control-allow-origin'],
          allowCredentials: response.headers['access-control-allow-credentials']
        });
      }

      this.log('✅ CORS tests completed');
      return true;
    } catch (error) {
      this.log('❌ CORS test error', error.message);
      return false;
    }
  }

  async runFullTestSuite() {
    this.log('\n🚀 === STARTING FULL AUTHENTICATION TEST SUITE ===');
    
    const results = {
      serverHealth: false,
      sessionDebug: false,
      jwtLogin: false,
      jsonLogin: false,
      sessionPersistence: false,
      protectedRoute: false,
      sessionRefresh: false,
      logout: false,
      postLogoutAccess: false,
      invalidToken: false,
      corsHeaders: false
    };

    // Test 1: Server Health
    results.serverHealth = await this.testServerHealth();
    
    if (!results.serverHealth) {
      this.log('❌ Server is not healthy, stopping tests');
      return results;
    }

    // Test 2: Session Debug (pre-auth)
    await this.testSessionDebugEndpoint();

    // Test 3: Invalid Token
    results.invalidToken = await this.testInvalidToken();

    // Test 4: JWT Login
    const jwtLoginResult = await this.testDynamicLogin('jwt');
    results.jwtLogin = !!jwtLoginResult;

    if (results.jwtLogin) {
      // Test session-dependent features
      results.sessionPersistence = await this.testSessionPersistence();
      results.protectedRoute = await this.testProtectedRoute();
      results.sessionRefresh = await this.testSessionRefresh();
      
      // Test logout
      results.logout = await this.testLogout();
      results.postLogoutAccess = await this.testPostLogoutAccess();
    }

    // Test 5: JSON Token Login (separate session)
    const jsonLoginResult = await this.testDynamicLogin('json');
    results.jsonLogin = !!jsonLoginResult;

    if (results.jsonLogin) {
      // Quick logout to clean up
      await this.testLogout();
    }

    // Test 6: CORS Headers
    results.corsHeaders = await this.testCorsHeaders();

    // Summary
    this.log('\n📊 === TEST SUITE SUMMARY ===');
    const passedTests = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    
    this.log(`Tests passed: ${passedTests}/${totalTests}`);
    
    Object.entries(results).forEach(([test, passed]) => {
      this.log(`${passed ? '✅' : '❌'} ${test}`);
    });

    if (passedTests === totalTests) {
      this.log('🎉 All tests passed! Authentication flow is working correctly.');
    } else {
      this.log('⚠️ Some tests failed. Check the logs above for details.');
    }

    return results;
  }

  generateReport() {
    return {
      timestamp: new Date().toISOString(),
      testResults: this.testResults,
      summary: this.testResults.filter(r => r.message.includes('✅') || r.message.includes('❌'))
    };
  }
}

// CLI usage
if (require.main === module) {
  const serverURL = process.argv[2] || 'http://localhost:3002';
  const tester = new AuthFlowTester(serverURL);
  
  console.log(`Testing authentication flow against: ${serverURL}`);
  
  tester.runFullTestSuite().then(results => {
    const report = tester.generateReport();
    
    // Write report to file
    const fs = require('fs');
    const reportPath = './auth-test-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\nFull report saved to: ${reportPath}`);
    
    // Exit with appropriate code
    const allPassed = Object.values(results).every(Boolean);
    process.exit(allPassed ? 0 : 1);
  }).catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = AuthFlowTester;