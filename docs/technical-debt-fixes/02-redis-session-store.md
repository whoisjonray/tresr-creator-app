# Redis Session Store Implementation Plan

## Overview
Replace in-memory session store with Redis for production-ready session management.

## Priority: HIGH
- **Implementation Time**: 2 days
- **Impact**: Session persistence across server restarts, horizontal scaling support
- **Dependencies**: Redis already in docker-compose.yml

## Current State Analysis

```javascript
// Current implementation in server/index.js
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // TODO: Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    sameSite: 'lax'
  }
}));
```

## Implementation Steps

### 1. Install Redis Session Store

```bash
cd server
npm install connect-redis redis
```

### 2. Create Redis Client Configuration

```javascript
// server/config/redis.js
const redis = require('redis');

let redisClient;

async function initializeRedis() {
  if (process.env.REDIS_URL) {
    // Production (Railway provides REDIS_URL)
    redisClient = redis.createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('Redis reconnection failed after 10 attempts');
            return new Error('Redis reconnection failed');
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });
  } else {
    // Development (local Docker)
    redisClient = redis.createClient({
      host: 'localhost',
      port: 6379,
      password: process.env.REDIS_PASSWORD
    });
  }

  redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  redisClient.on('connect', () => {
    console.log('✅ Redis connected successfully');
  });

  redisClient.on('disconnect', () => {
    console.warn('⚠️ Redis disconnected');
  });

  await redisClient.connect();
  return redisClient;
}

module.exports = { initializeRedis, getRedisClient: () => redisClient };
```

### 3. Update Session Configuration

```javascript
// server/index.js
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const { initializeRedis, getRedisClient } = require('./config/redis');

async function setupServer() {
  // Initialize Redis first
  try {
    await initializeRedis();
    console.log('✅ Redis initialized for sessions');
  } catch (error) {
    console.error('❌ Redis initialization failed:', error);
    console.log('⚠️ Falling back to memory store for sessions');
  }

  // Session configuration
  const sessionConfig = {
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax'
    }
  };

  // Use Redis store if available
  const redisClient = getRedisClient();
  if (redisClient) {
    sessionConfig.store = new RedisStore({
      client: redisClient,
      prefix: 'tresr:sess:',
      ttl: 60 * 60 * 24 * 7 // 7 days in seconds
    });
  }

  app.use(session(sessionConfig));
}
```

### 4. Add Session Management Utilities

```javascript
// server/utils/sessionManager.js
const { getRedisClient } = require('../config/redis');

class SessionManager {
  static async getAllSessions() {
    const client = getRedisClient();
    if (!client) return [];
    
    const keys = await client.keys('tresr:sess:*');
    const sessions = [];
    
    for (const key of keys) {
      const data = await client.get(key);
      if (data) {
        sessions.push({
          id: key.replace('tresr:sess:', ''),
          data: JSON.parse(data)
        });
      }
    }
    
    return sessions;
  }

  static async clearUserSessions(userId) {
    const sessions = await this.getAllSessions();
    const client = getRedisClient();
    
    for (const session of sessions) {
      if (session.data.creator?.id === userId) {
        await client.del(`tresr:sess:${session.id}`);
      }
    }
  }

  static async getSessionCount() {
    const client = getRedisClient();
    if (!client) return 0;
    
    const keys = await client.keys('tresr:sess:*');
    return keys.length;
  }

  static async clearAllSessions() {
    const client = getRedisClient();
    if (!client) return;
    
    const keys = await client.keys('tresr:sess:*');
    if (keys.length > 0) {
      await client.del(...keys);
    }
  }
}

module.exports = SessionManager;
```

### 5. Add Admin Endpoints for Session Management

```javascript
// server/routes/admin.js
const SessionManager = require('../utils/sessionManager');

// Get active session count
router.get('/sessions/count', requireAdmin, async (req, res) => {
  try {
    const count = await SessionManager.getSessionCount();
    res.json({ count, timestamp: new Date() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get session count' });
  }
});

// Clear specific user's sessions (force logout)
router.delete('/sessions/user/:userId', requireAdmin, async (req, res) => {
  try {
    await SessionManager.clearUserSessions(req.params.userId);
    res.json({ message: 'User sessions cleared' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear user sessions' });
  }
});
```

### 6. Health Check Endpoint

```javascript
// server/routes/health.js
const { getRedisClient } = require('../config/redis');

router.get('/health', async (req, res) => {
  const redisClient = getRedisClient();
  
  const health = {
    status: 'ok',
    timestamp: new Date(),
    services: {
      redis: 'disconnected',
      database: 'unknown'
    }
  };

  // Check Redis
  if (redisClient) {
    try {
      await redisClient.ping();
      health.services.redis = 'connected';
    } catch (error) {
      health.services.redis = 'error';
      health.status = 'degraded';
    }
  }

  res.json(health);
});
```

### 7. Docker Compose Update

```yaml
# docker-compose.yml
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    environment:
      - REDIS_PASSWORD=${REDIS_PASSWORD}
    command: redis-server --requirepass ${REDIS_PASSWORD} --maxmemory 256mb --maxmemory-policy allkeys-lru
    restart: unless-stopped

volumes:
  redis_data:
```

### 8. Environment Variables

```env
# .env
REDIS_PASSWORD=your_secure_redis_password
# REDIS_URL is auto-provided by Railway in production
```

## Migration Strategy

### Phase 1: Development Testing
1. Test with Docker Redis locally
2. Verify session persistence across restarts
3. Test fallback to memory store

### Phase 2: Production Rollout
1. Ensure Redis addon is enabled in Railway
2. Deploy with feature flag
3. Monitor Redis memory usage
4. Gradually migrate sessions

### Phase 3: Cleanup
1. Remove memory store fallback code
2. Make Redis required for production
3. Add session analytics

## Monitoring & Alerts

### Key Metrics
- Redis memory usage
- Session count
- Connection failures
- Session creation rate

### Alert Conditions
- Redis memory > 80%
- Connection failures > 5/minute
- Session count > 10,000

## Performance Considerations

1. **Session Size**: Keep session data minimal
2. **TTL Strategy**: 7 days default, adjust based on usage
3. **Memory Limits**: Set Redis maxmemory with LRU eviction
4. **Connection Pooling**: Reuse Redis connections

## Security Enhancements

1. **Session Rotation**: Regenerate session ID on login
2. **IP Binding**: Optional session-to-IP binding
3. **Activity Tracking**: Log session creation/destruction

## Testing Checklist

- [ ] Sessions persist across server restart
- [ ] Multiple sessions per user work correctly
- [ ] Session expiry works as expected
- [ ] Redis connection failure doesn't crash app
- [ ] Admin can force logout users
- [ ] Health check accurately reports Redis status

## Rollback Plan

If Redis fails in production:
1. Set environment variable `DISABLE_REDIS=true`
2. Restart application
3. Falls back to memory store
4. Fix Redis issue
5. Re-enable Redis sessions