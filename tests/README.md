# TRESR Creator App - Test Suite

## Overview

Comprehensive integration test suite covering all major functionality of the TRESR Creator App including authentication, Sanity import, commission calculation, Shopify integration, and database operations.

## Test Coverage

### 1. Authentication Flow (Dynamic.xyz)
- ✅ Login with valid token
- ✅ Invalid token rejection
- ✅ Missing token validation
- ✅ User data retrieval
- ✅ Session refresh
- ✅ Logout functionality
- ✅ Creator statistics

### 2. Sanity Import Process (Design Migration)
- ✅ Person data fetching
- ✅ Design fetching by creator
- ✅ Design transformation
- ✅ Bounding box coordinate conversion
- ✅ Migration statistics
- ✅ Creator matching

### 3. Commission Calculation (40% Rate)
- ✅ NFKEY level-based rates (10%, 20%, 30%, 40%)
- ✅ Sale commission calculation
- ✅ Wallet NFKEY balance checking
- ✅ Known creator wallet mappings
- ✅ Commission rate structure validation

### 4. Shopify Product Creation
- ✅ Product structure validation
- ✅ Product variants handling
- ✅ Product images structure
- ✅ Error response handling

### 5. User Profile Management
- ✅ Profile updates
- ✅ Role assignment
- ✅ Session state persistence

### 6. Database Operations
- ✅ Session storage and retrieval
- ✅ User role operations
- ✅ Error handling
- ✅ Data consistency
- ✅ Creator statistics aggregation
- ✅ Concurrent operations

### 7. Integration Workflows
- ✅ Complete creator onboarding flow
- ✅ Design import to product creation
- ✅ Error recovery scenarios
- ✅ Data flow integrity
- ✅ High-volume operations

### 8. Security and Validation
- ✅ Malicious input rejection
- ✅ Wallet address validation
- ✅ Output data sanitization
- ✅ Session security
- ✅ Token format validation

## Running Tests

### Install Dependencies
```bash
npm install
```

### Run All Tests
```bash
npm test
```

### Run Specific Test Suites
```bash
# Authentication tests only
npm test -- --testNamePattern="Authentication Flow"

# Commission calculation tests
npm test -- --testNamePattern="Commission Calculation"

# Sanity import tests
npm test -- --testNamePattern="Sanity Import"

# Integration workflow tests
npm test -- --testNamePattern="Integration Workflows"
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Integration Tests Only
```bash
npm run test:integration
```

## Test Configuration

### Environment Variables
The test suite automatically sets up the following test environment variables:
- `NODE_ENV=test`
- `SESSION_SECRET=test-secret-key`
- `DYNAMIC_ENVIRONMENT_ID=test-env-id`
- `SANITY_PROJECT_ID=a9vtdosx`
- `SANITY_DATASET=production`
- `SHOPIFY_SHOP=tresr.myshopify.com`
- `CLOUDINARY_CLOUD_NAME=tresr`

### Mock Services
All external services are mocked:
- Dynamic.xyz authentication service
- Sanity CMS API
- Shopify GraphQL API
- Cloudinary image service
- Avalanche blockchain (NFKEY contract)
- Database models (Sequelize)

### Test Data
Consistent mock data is provided for:
- Dynamic.xyz users (creator, admin, memelord)
- Sanity designs and persons
- Shopify products and variants
- Commission and NFKEY data
- Cloudinary responses
- Blockchain responses

## Key Features Tested

### Authentication Security
- Token validation and sanitization
- Session management and expiration
- Role-based access control
- Cross-site scripting (XSS) prevention
- Session fixation protection

### Data Migration
- Sanity to database transformation
- Image migration to Cloudinary
- Coordinate system conversion
- Batch processing capabilities
- Error recovery and retry logic

### Commission System
- NFKEY level detection (1-150)
- Tiered commission rates (10%-40%)
- Blockchain wallet verification
- Known creator wallet mappings
- Edge case handling

### Product Management
- Design to product transformation
- Variant creation and management
- Image processing and optimization
- SKU generation and validation
- Inventory management

### Performance and Reliability
- Concurrent request handling
- Database connection management
- Memory leak prevention
- Error boundary testing
- Graceful degradation

## Test Files

- `integration.test.js` - Main test suite with all scenarios
- `mock-data.js` - Centralized mock data and utilities
- `setup.js` - Jest setup and configuration
- `README.md` - This documentation

## Mock Data Structure

### Dynamic User
```javascript
{
  id: 'dyn_user_12345',
  email: 'test.creator@tresr.com',
  name: 'Test Creator',
  walletAddress: '0x742d35Cc6632C0532e6B0332D2cA7568Ec8b0352',
  verifiedCredentials: [...]
}
```

### Sanity Design
```javascript
{
  _id: 'design-test-001',
  title: 'Test Design - Cool NFT Art',
  images: [...],
  overlayTopLeft: { x: 100, y: 100 },
  overlayBottomRight: { x: 300, y: 300 }
}
```

### Commission Data
```javascript
{
  saleAmount: 100.00,
  nfkeyLevel: 145,
  commissionRate: 0.40,
  commissionAmount: 40.00
}
```

## Performance Benchmarks

Expected test execution times:
- Authentication Flow: ~200ms
- Sanity Import: ~50ms
- Commission Calculation: ~30ms
- Integration Workflows: ~100ms
- Security Tests: ~80ms
- Total Suite: <1 second

## Contributing

When adding new tests:
1. Add mock data to `mock-data.js`
2. Follow existing test structure and naming
3. Include both positive and negative test cases
4. Test edge cases and error conditions
5. Maintain test isolation and cleanup
6. Update this README with new coverage

## Troubleshooting

### Common Issues

**Tests failing with module resolution errors:**
- Ensure all dependencies are installed
- Check Jest configuration in `jest.config.js`

**Mock services not working:**
- Verify mocks are imported before actual modules
- Check mock function implementations

**Database errors in tests:**
- Ensure database models are properly mocked
- Check for missing mock function definitions

**Session persistence issues:**
- Verify express-session configuration
- Check cookie settings for test environment

### Debug Mode

To run tests with verbose logging:
```bash
VERBOSE_TESTS=true npm test
```

This will enable console.log, console.debug, and console.info output during tests.