# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**TRESR Creator App**: TeePublic-style design editor and product management platform for creators. Part of the larger TRESR Shopify migration achieving $1,752/month in cost savings.

### Production URLs
- **Creator App**: https://creators.tresr.com
- **Main Store**: becc05-b4.myshopify.com  
- **Backend API**: https://vibes.tresr.com
- **Authentication**: Dynamic.xyz (Environment: b17e8631-c1b7-45d5-95cf-151eb5246423)

## 🚀 Railway Deployment (CRITICAL - FOLLOW EXACTLY)

### ✅ CORRECT Way to Deploy to Railway
```bash
# 1. Make your changes
# 2. Test locally if needed (optional)
# 3. Commit and push to GitHub
git add -A && git commit -m "fix: description of changes" && git push

# Railway auto-deploys from GitHub (2-3 min)
# Monitor at: https://railway.app/project/tresr-creator-app
```

### ⚠️ NEVER Do This
```bash
# WRONG - Don't use railway CLI directly
railway up  # NO! This bypasses GitHub integration

# WRONG - Don't deploy from local
railway deploy  # NO! Use GitHub integration
```

### Why GitHub Integration?
1. **Automatic deployments** on push to main branch
2. **Build logs** visible in Railway dashboard
3. **Rollback capability** to any previous commit
4. **Environment variables** managed in Railway UI
5. **Zero-downtime deployments** with health checks

### Local Development (Reference Only - DO NOT USE)
```bash
# These commands are for reference only - always use Railway
npm run dev              # Start both frontend (3003) and backend (3002)
npm run dev:client       # Frontend only (React + Vite)
npm run dev:server       # Backend only (Express.js)
```

### Production Build
```bash
npm run build           # Build both client and server
npm start              # Start production server
```

### Docker Services (Database)
```bash
docker-compose up -d    # Start MySQL, Redis, Adminer
docker-compose down     # Stop services
```

### Deployment Testing
```bash
# Railway (Recommended - 2-3 min builds)
git push                # Auto-deploys to Railway

# ngrok for Auth Testing
ngrok http 3002         # HTTPS tunnel for Dynamic.xyz auth
```

## Architecture Overview

### Monorepo Structure
```
tresr-creator-app/
├── client/          # React frontend (Vite)
├── server/          # Express.js backend  
├── shared/          # Shared utilities
└── docs/            # Architecture docs
```

### Technology Stack
- **Frontend**: React 18 + Vite + React Router v6
- **Backend**: Express.js + MySQL + Redis
- **Authentication**: Dynamic.xyz SDK (social + wallet login)
- **APIs**: Shopify Admin API, Dynamic Mockups API
- **Deployment**: Railway.app with Nixpacks

### Key Business Logic

**SuperProduct Architecture ✅ COMPLETE**: TeePublic-style experience where one design can be offered across multiple garment types with male/female fit categorization. Canvas compositing enables zero-cost image generation vs $980/month IMG.ly alternative.

**SuperProduct Features**:
- **Fit-Based Filtering**: Male (5 styles) vs Female (2 styles) garment options
- **Real-Time Switching**: Dynamic price updates, image changes, variant options
- **Unified Experience**: Single product page with hidden variant products for clean checkout
- **Canvas Compositing**: HTML5 Canvas + Cloudinary for infinite color combinations
- **Accessory Integration**: Related products with design relationship metadata

**Creator Workflow**:
1. Authenticate via Dynamic.xyz (social or wallet)
2. Upload design using drag & drop interface  
3. Position design on product templates
4. Select enabled products/colors
5. Generate SuperProduct with all garment variants
6. Create Shopify products with creator as vendor
7. 40% commission tracking via metafields

## Environment Configuration

### Required Variables (.env)
```env
# Core APIs
DYNAMIC_MOCKUPS_API_KEY=    # Dynamic Mockups ($19/mo vs IMG.ly $980/mo)
SHOPIFY_API_KEY=            # Shopify Admin API
SHOPIFY_ACCESS_TOKEN=       # Store access token
SHOPIFY_STORE_DOMAIN=       # becc05-b4.myshopify.com

# Authentication  
DYNAMIC_ENV_ID=             # Dynamic.xyz environment
JWT_SECRET=                 # JWT signing
SESSION_SECRET=             # Express session

# Service URLs
DYNAMIC_AUTH_URL=           # https://auth.tresr.com
SHOPIFY_APP_URL=            # https://vibes.tresr.com
```

### Smart Environment Detection
Code automatically detects environment (ngrok, localhost, production) with no manual URL changes needed. CORS configuration supports all development modes.

## Frontend Architecture

### Component Hierarchy
```
src/
├── pages/
│   ├── Dashboard.jsx        # Creator stats & quick actions
│   ├── DesignEditor.jsx     # Core TeePublic-style editor
│   ├── ProductManager.jsx   # Product CRUD operations
│   ├── AdminPanel.jsx       # Admin functions
│   ├── SuperProductTest.jsx # Complete SuperProduct test environment
│   └── Login.jsx           # Dynamic.xyz authentication
├── components/
│   ├── DesignCanvas.jsx     # Drag & drop design positioning
│   ├── MockupPreview.jsx    # Real-time product previews
│   ├── SuperProductOptions.jsx # TeePublic-style fit/style/color selection
│   ├── ColorSwatchGrid.jsx  # Color selection interface
│   └── Navigation.jsx       # Main navigation
├── config/
│   └── testSuperProductConfig.js # Complete garment configuration
└── services/
    ├── api.js              # Axios client with env detection
    └── mockupService.js    # Dynamic Mockups integration
```

### State Management
- **Authentication**: React Context (useAuth hook)
- **Dynamic.xyz**: DynamicContextProvider for wallet/social auth
- **API State**: Direct axios calls with error handling
- **UI State**: Local useState for component interactions

## Backend Architecture

### API Structure
```
server/
├── routes/
│   ├── auth.js             # JWT verification & session management
│   ├── products.js         # Shopify product CRUD
│   ├── mockups.js          # Dynamic Mockups integration
│   └── creators.js         # Creator stats & management
├── services/
│   ├── shopify.js          # Shopify Admin API client
│   ├── dynamicMockups.js   # Mockup generation service
│   └── auth.js             # Dynamic.xyz JWT verification
└── middleware/
    ├── auth.js             # Session validation
    └── cors.js             # Multi-origin CORS support
```

### Database Schema
Uses Shopify as primary data source with MySQL for:
- Creator sessions (express-session store)
- Design drafts and configurations  
- Product template mappings

### Key Data Models
```javascript
// Creator (from Dynamic.xyz JWT)
creator: {
  id: string,
  email: string, 
  name: string,
  walletAddress?: string,
  isCreator: boolean
}

// Product Template
template: {
  id: string,
  templateId: string,    // Dynamic Mockups template ID
  name: string,
  price: number,
  colors: string[],
  sizes: string[]
}
```

## Development Workflow

### Testing Strategy
1. **Primary**: Railway deployment (creators.tresr.com) - fastest iteration
2. **Auth Testing**: ngrok tunnel for Dynamic.xyz HTTPS requirements
3. **Docker**: Available but slower builds (3-5 min vs Railway 2-3 min)

### CORS & Environment Handling
- Automatic API URL detection based on hostname
- No manual configuration needed when switching environments
- Supports localhost, ngrok tunnels, and production

### Authentication Flow ✅ COMPLETE
1. Dynamic.xyz handles social/wallet authentication (Google, Discord, Telegram, Email)
2. Custom JSON token created when JWT not available (newer SDK compatibility)
3. Backend accepts both JWT and JSON token formats
4. Express session created with creator data (id, email, walletAddress, name)
5. AuthGuard component protects all routes
6. Navigation component provides logout across all pages
7. Smart redirect handling prevents authentication loops

## Cost Optimization Achievement

**IMG.ly Replacement**: Switched from IMG.ly ($980/month) to Dynamic Mockups ($19/month)
- **Monthly Savings**: $961
- **Annual Savings**: $11,532
- **Functionality**: Maintained full mockup generation capability

## Critical Development Notes

- **Railway > Docker**: Faster builds and iteration cycle
- **Environment Detection**: Code automatically adapts to dev/staging/production
- **Creator Permissions**: All operations filtered by Shopify vendor field
- **Session-Based Auth**: Uses express-session for creator state management
- **Graceful Fallbacks**: Mock data and placeholder images when APIs unavailable

## Testing Checklist

- [x] Dynamic.xyz auth flow works (social + wallet) ✅ COMPLETE
- [x] Multi-environment URL detection working ✅ COMPLETE  
- [x] Navigation and logout functional across all environments ✅ COMPLETE
- [x] Session persistence and CORS handling ✅ COMPLETE
- [x] AuthGuard protecting all routes ✅ COMPLETE
- [x] SuperProduct architecture with male/female garments ✅ COMPLETE
- [x] Fit-based style filtering with real Cloudinary images ✅ COMPLETE
- [x] Dynamic price updates and variant switching ✅ COMPLETE
- [x] Shopify product creation with metafields ✅ COMPLETE
- [x] Bounding box sync between admin and design editor ✅ COMPLETE
- [x] Mobile responsive design editor with touch support ✅ COMPLETE
- [x] Canvas rendering on design/new page ✅ COMPLETE
- [ ] Design upload and positioning functional
- [ ] Canvas compositing for design overlay
- [ ] Creator stats and dashboard data loading

## SuperProduct Testing

### Test Environment: `/test/superproduct`
**Live URL**: https://creators.tresr.com/test/superproduct

### Test Data Created
- **Main SuperProduct**: test-design-complete-collection (ID: 9901220888861)
- **Male Garments**: 5 styles (boxy, polo, mediu, tee, med-hood) - 24 color combinations
- **Female Garments**: 2 styles (next-crop, wmn-hoodie) - 13 color combinations  
- **Accessories**: 2 products (patch-c, patch-flat) with design relation metadata

### Testing Scenarios
1. **Fit Selection**: Male → 5 styles, Female → 2 styles
2. **Style Switching**: Dynamic price updates ($22-$45 range)
3. **Color Switching**: Real Cloudinary images load
4. **Accessory Display**: Related products show below SuperProduct
5. **Cart Integration**: Correct Shopify product IDs mapped

## Recent Optimizations (January 2025)

### 🎯 Bounding Box Synchronization
**Problem**: Print areas were misaligned between admin BoundingBoxEditor and design/new canvas
**Solution**: 
- Standardized 600x600 canvas size across both editors
- Created `sync-bounding-boxes.js` script to sync coordinates
- Implemented PrintAreasContext for centralized print area management
- All garments now use consistent coordinate system

### 📱 Mobile Responsiveness (design/new)
**Problem**: Canvas overflow and poor touch experience on mobile devices
**Solution**:
- Implemented mobile-first CSS with proper aspect ratios
- Added touch gesture support (drag, pinch zoom, rotate)
- Fixed canvas sizing to prevent horizontal scroll
- Created collapsible tool panels for mobile UI
- Added fixed action bar for save/preview actions

### 🎨 Canvas Rendering Fix
**Problem**: Canvas not rendering properly when switching products
**Solution**:
- Implemented `forceCanvasRender()` utility
- Fixed product switching with `fixCanvasProductSwitching()`
- Added proper canvas cleanup between product changes
- Ensured design position/scale persist across products

### 🧪 Playwright Visual Validation
**Testing Setup**:
```bash
# Connect to existing Chrome session (preserves auth)
open -a "Google Chrome" --args --remote-debugging-port=9222
node scripts/playwright-upload-and-validate.js
```
- Tests mobile viewports (iPhone SE, 12, 13 Pro, 14 Pro Max)
- Validates touch target sizes (44px minimum)
- Checks for horizontal overflow
- Generates visual reports with screenshots

## Key Authentication Solutions

### JWT vs JSON Token Handling
- **Problem**: Dynamic.xyz SDK doesn't always provide JWT tokens
- **Solution**: Created hybrid backend that accepts both JWT and custom JSON tokens
- **Implementation**: Frontend creates JSON token from user data when JWT unavailable

### Session Persistence Issues
- **Problem**: Express sessions not persisting in production (secure cookie requirements)
- **Solution**: Temporarily disabled secure cookies, added sameSite: 'lax' for cross-origin
- **Production**: Will need Redis session store for proper session scaling

### Redirect Loop Prevention
- **Problem**: Login success caused infinite redirects between /login and /dashboard
- **Solution**: Removed manual redirects, let React navigation handle auth state changes
- **Key**: AuthGuard + useEffect navigation handles flow naturally

### Environment-Aware Development
- **Problem**: Different API URLs for localhost, ngrok, and production
- **Solution**: Smart hostname detection in both frontend services and CORS config
- **Benefit**: No manual URL changes when switching between development modes