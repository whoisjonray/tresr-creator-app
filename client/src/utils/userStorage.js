// User-specific localStorage wrapper
// This ensures each authenticated user has their own isolated storage

class UserStorage {
  constructor() {
    this.prefix = 'tresr_creator_';
  }

  // Get the current user's unique key prefix
  getUserKey() {
    // Try to get user info from various sources
    const sessionCreator = window.__TRESR_SESSION_CREATOR__;
    const authContext = window.__TRESR_AUTH_CONTEXT__;
    
    // Use email or ID as unique identifier
    const userId = sessionCreator?.id || 
                   sessionCreator?.email || 
                   authContext?.creator?.id || 
                   authContext?.creator?.email ||
                   'anonymous';
    
    // Create a safe key by removing special characters
    const safeUserId = userId.replace(/[^a-zA-Z0-9]/g, '_');
    return `${this.prefix}${safeUserId}_`;
  }

  // Get item from user-specific storage
  getItem(key) {
    const userKey = this.getUserKey();
    const fullKey = `${userKey}${key}`;
    
    try {
      const value = localStorage.getItem(fullKey);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Error reading ${fullKey} from localStorage:`, error);
      return null;
    }
  }

  // Set item in user-specific storage
  setItem(key, value) {
    const userKey = this.getUserKey();
    const fullKey = `${userKey}${key}`;
    
    try {
      localStorage.setItem(fullKey, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing ${fullKey} to localStorage:`, error);
      return false;
    }
  }

  // Remove item from user-specific storage
  removeItem(key) {
    const userKey = this.getUserKey();
    const fullKey = `${userKey}${key}`;
    
    try {
      localStorage.removeItem(fullKey);
      return true;
    } catch (error) {
      console.error(`Error removing ${fullKey} from localStorage:`, error);
      return false;
    }
  }

  // Clear all items for the current user
  clearUserData() {
    const userKey = this.getUserKey();
    const keysToRemove = [];
    
    // Find all keys belonging to the current user
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(userKey)) {
        keysToRemove.push(key);
      }
    }
    
    // Remove all user-specific keys
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log(`Cleared ${keysToRemove.length} items for user ${this.getUserKey()}`);
  }

  // Get all keys for the current user
  getUserKeys() {
    const userKey = this.getUserKey();
    const userKeys = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(userKey)) {
        userKeys.push(key.replace(userKey, ''));
      }
    }
    
    return userKeys;
  }

  // Debug: Show storage info
  debugStorage() {
    const userKey = this.getUserKey();
    console.log('🔐 User Storage Debug:');
    console.log(`  User Key: ${userKey}`);
    console.log(`  User Keys: ${this.getUserKeys().join(', ')}`);
    
    // Show all localStorage keys grouped by user
    const allKeys = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        const userMatch = key.match(new RegExp(`^${this.prefix}([^_]+)_`));
        if (userMatch) {
          const user = userMatch[1];
          if (!allKeys[user]) allKeys[user] = [];
          allKeys[user].push(key);
        }
      }
    }
    
    console.log('  All Users in Storage:', Object.keys(allKeys));
    Object.entries(allKeys).forEach(([user, keys]) => {
      console.log(`    ${user}: ${keys.length} items`);
    });
  }
}

// Export singleton instance
export default new UserStorage();

// Also export methods for backward compatibility
export const userStorage = {
  getProducts: () => new UserStorage().getItem('generatedProducts') || [],
  setProducts: (products) => new UserStorage().setItem('generatedProducts', products),
  
  getDesigns: () => new UserStorage().getItem('designs') || [],
  setDesigns: (designs) => new UserStorage().setItem('designs', designs),
  
  getDrafts: () => new UserStorage().getItem('designDrafts') || {},
  setDrafts: (drafts) => new UserStorage().setItem('designDrafts', drafts),
  
  clear: () => new UserStorage().clearUserData(),
  debug: () => new UserStorage().debugStorage()
};