// Simple in-memory cache middleware
const cache = new Map();

const cacheResponse = (ttl = 60) => {
  return (req, res, next) => {
    const key = req.originalUrl || req.url;
    const cached = cache.get(key);
    
    if (cached && Date.now() < cached.expiry) {
      return res.json(cached.data);
    }
    
    const originalJson = res.json;
    res.json = function(data) {
      cache.set(key, {
        data,
        expiry: Date.now() + (ttl * 1000)
      });
      return originalJson.call(this, data);
    };
    
    next();
  };
};

const clearCache = () => {
  cache.clear();
};

module.exports = {
  cacheResponse,
  clearCache
};