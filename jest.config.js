/**
 * Jest Configuration for TRESR Creator App Integration Tests
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Test files pattern
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // Coverage configuration
  collectCoverage: false,
  collectCoverageFrom: [
    'server/**/*.js',
    '!server/node_modules/**',
    '!server/scripts/**',
    '!**/coverage/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],

  // Module path mapping - removed invalid option
  // moduleNameMapping: {
  //   '^@/(.*)$': '<rootDir>/server/$1',
  //   '^@client/(.*)$': '<rootDir>/client/src/$1'
  // },

  // Transform configuration - removed babel-jest to avoid config issues
  transform: {},

  // Test timeout
  testTimeout: 30000,

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,

  // Global test variables
  globals: {
    NODE_ENV: 'test'
  },

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/client/node_modules/',
    '/server/node_modules/'
  ],

  // Mock configuration
  moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx'],

  // Error handling
  errorOnDeprecated: true,

  // Force exit after tests complete
  forceExit: true,

  // Detect open handles
  detectOpenHandles: true
};