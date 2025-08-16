/**
 * Jest Test Setup Configuration
 * Runs before each test file
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-secret-key';
process.env.DYNAMIC_ENVIRONMENT_ID = 'test-env-id';
process.env.SANITY_PROJECT_ID = 'a9vtdosx';
process.env.SANITY_DATASET = 'production';
process.env.SHOPIFY_SHOP = 'tresr.myshopify.com';
process.env.CLOUDINARY_CLOUD_NAME = 'tresr';

// Increase timeout for integration tests
jest.setTimeout(30000);

// Global test utilities
global.console = {
  ...console,
  // Suppress console.log during tests unless VERBOSE_TESTS is set
  log: process.env.VERBOSE_TESTS ? console.log : jest.fn(),
  debug: process.env.VERBOSE_TESTS ? console.debug : jest.fn(),
  info: process.env.VERBOSE_TESTS ? console.info : jest.fn(),
  warn: console.warn,
  error: console.error,
};

// Clean up after each test
afterEach(() => {
  // Clear all mocks
  jest.clearAllMocks();
});

// Global test cleanup
afterAll(() => {
  // Any final cleanup
});