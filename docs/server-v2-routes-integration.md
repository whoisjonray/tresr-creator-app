# Server v2 Routes Integration

## Overview
Updated the main server file (`/server/index.js`) to integrate all new v2 API routes with enhanced middleware, security, and error handling.

## Changes Made

### 1. Route Imports
- Added imports for all v2 route files:
  - `auth-v2.js` - Enhanced authentication
  - `users-v2.js` - User management with validation
  - `sanity-import-v2.js` - Batch Sanity imports
  - `shopify-v2.js` - Shopify integration

### 2. Route Mounting
- **v2 Routes**: Mounted at `/api/v2/*` with priority
- **v1 Routes**: Maintained at `/api/*` for backward compatibility
- Route precedence ensures v2 routes are matched first

### 3. Enhanced Middleware Stack

#### Security Headers (v2 routes only)
```javascript
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
X-API-Version: 2.0
```

#### Rate Limiting (v2 routes)
- **Limit**: 200 requests per 15 minutes per IP
- **Enhanced error responses** with structured format
- **Skip health checks** from rate limiting

#### Request Logging (v2 routes)
- **Request ID generation** for tracing
- **Detailed logging** with timestamps and metrics
- **Response time tracking**
- **Error response logging**

### 4. Error Handling

#### v2 Error Handler
- **Structured error responses** with error codes
- **Request tracing** with unique IDs
- **Status code mapping** for common error types
- **Development vs production** error details

#### Enhanced 404 Handler
- **Different responses** for v1 vs v2 routes
- **Available endpoints listing** for v2 routes
- **Consistent error format**

### 5. Startup Enhancements
- **Route documentation** displayed on startup
- **Health check improvements** with route listing
- **Clear distinction** between v1 and v2 capabilities

## API Endpoints Available

### v2 Routes (Enhanced)
```
POST   /api/v2/auth/login        - Enhanced authentication
GET    /api/v2/users/profile     - User profile management  
POST   /api/v2/sanity/import     - Batch Sanity imports
GET    /api/v2/shopify/products  - Shopify product sync
```

### v1 Routes (Legacy - Maintained)
```
/api/auth/*       - Authentication
/api/products/*   - Product management
/api/creators/*   - Creator management
/api/admin/*      - Admin functions
/api/designs/*    - Design operations
```

## Key Benefits

1. **Backward Compatibility**: All existing v1 routes continue to work
2. **Enhanced Security**: Additional security headers and rate limiting for v2
3. **Better Monitoring**: Comprehensive logging and request tracing
4. **Structured Errors**: Consistent error format with proper status codes
5. **Clear Versioning**: Easy to distinguish between API versions

## Dependencies Added
- `express-rate-limit@^8.0.1` - For API rate limiting

## Testing
- Syntax validation passed
- All route imports verified
- Middleware ordering optimized

## Next Steps
1. Test v2 endpoints individually
2. Verify rate limiting behavior
3. Test error handling scenarios
4. Monitor logs for request patterns