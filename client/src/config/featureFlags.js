// Feature flags for experimental Dynamic Mockups integration
// This allows us to toggle between canvas-based and Dynamic Mockups workflows

// Get feature flags from environment or localStorage (for runtime toggling)
const getFeatureFlag = (key, defaultValue = false) => {
  // Check localStorage first for runtime overrides
  const localOverride = localStorage.getItem(`feature_${key}`);
  if (localOverride !== null) {
    return localOverride === 'true';
  }
  
  // Fall back to environment variables
  return process.env[`REACT_APP_${key}`] === 'true' || defaultValue;
};

export const FEATURES = {
  // Main toggle for Dynamic Mockups
  USE_DYNAMIC_MOCKUPS: getFeatureFlag('USE_DYNAMIC_MOCKUPS', false),
  
  // Dynamic Mockups mode: 'disabled' | 'api' | 'embed' | 'hybrid'
  DYNAMIC_MOCKUPS_MODE: process.env.REACT_APP_DM_MODE || 'disabled',
  
  // Enable experimental routes
  ENABLE_EXPERIMENTAL_ROUTES: getFeatureFlag('ENABLE_EXPERIMENTAL_ROUTES', true),
  
  // Enable comparison dashboard
  ENABLE_COMPARISON_DASHBOARD: getFeatureFlag('ENABLE_COMPARISON_DASHBOARD', true),
  
  // Enable for specific creators (beta testing)
  BETA_CREATOR_IDS: (process.env.REACT_APP_BETA_CREATORS || '').split(',').filter(Boolean),
  
  // Performance monitoring
  TRACK_MOCKUP_PERFORMANCE: getFeatureFlag('TRACK_MOCKUP_PERFORMANCE', true),
  
  // Caching settings
  ENABLE_DM_CACHE: getFeatureFlag('ENABLE_DM_CACHE', true),
  DM_CACHE_TTL: parseInt(process.env.REACT_APP_DM_CACHE_TTL || '86400'), // 24 hours default
  
  // Bulk rendering
  ENABLE_BULK_RENDER: getFeatureFlag('ENABLE_BULK_RENDER', true),
  
  // Print files
  ENABLE_PRINT_FILES: getFeatureFlag('ENABLE_PRINT_FILES', true),
  
  // Fallback behavior
  FALLBACK_TO_CANVAS: getFeatureFlag('FALLBACK_TO_CANVAS', true),
  
  // A/B testing
  AB_TEST_ENABLED: getFeatureFlag('AB_TEST_ENABLED', false),
  AB_TEST_PERCENTAGE: parseInt(process.env.REACT_APP_AB_TEST_PERCENTAGE || '10'), // 10% default
};

// Helper function to check if current user is in beta
export const isUserInBeta = (userId) => {
  if (!userId) return false;
  
  // Check if user is in beta list
  if (FEATURES.BETA_CREATOR_IDS.includes(userId)) {
    return true;
  }
  
  // Check if A/B testing is enabled and user is in test group
  if (FEATURES.AB_TEST_ENABLED) {
    // Simple hash-based A/B testing
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return (hash % 100) < FEATURES.AB_TEST_PERCENTAGE;
  }
  
  return false;
};

// Helper function to determine which mockup service to use
export const getMockupServiceMode = (userId) => {
  // If Dynamic Mockups is disabled globally, always use canvas
  if (!FEATURES.USE_DYNAMIC_MOCKUPS) {
    return 'canvas';
  }
  
  // Check if user is in beta or A/B test group
  if (isUserInBeta(userId)) {
    return FEATURES.DYNAMIC_MOCKUPS_MODE;
  }
  
  // Default to canvas for non-beta users
  return 'canvas';
};

// Runtime feature flag toggling (useful for testing)
export const setFeatureFlag = (key, value) => {
  localStorage.setItem(`feature_${key}`, value.toString());
  
  // Reload features
  window.location.reload();
};

// Clear all feature flag overrides
export const clearFeatureFlags = () => {
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('feature_')) {
      localStorage.removeItem(key);
    }
  });
  
  window.location.reload();
};

// Export feature flag admin panel data
export const getFeatureFlagStatus = () => {
  const status = {};
  Object.keys(FEATURES).forEach(key => {
    const localOverride = localStorage.getItem(`feature_${key}`);
    status[key] = {
      value: FEATURES[key],
      source: localOverride !== null ? 'localStorage' : 'environment',
      overridden: localOverride !== null
    };
  });
  return status;
};

// Performance tracking helpers
export const trackMockupPerformance = (operation, duration, metadata = {}) => {
  if (!FEATURES.TRACK_MOCKUP_PERFORMANCE) return;
  
  const performanceData = {
    operation,
    duration,
    timestamp: Date.now(),
    mode: FEATURES.DYNAMIC_MOCKUPS_MODE,
    ...metadata
  };
  
  // Store in localStorage for analysis
  const existingData = JSON.parse(localStorage.getItem('mockup_performance') || '[]');
  existingData.push(performanceData);
  
  // Keep only last 100 entries
  if (existingData.length > 100) {
    existingData.shift();
  }
  
  localStorage.setItem('mockup_performance', JSON.stringify(existingData));
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Mockup Performance:', performanceData);
  }
};

export default FEATURES;