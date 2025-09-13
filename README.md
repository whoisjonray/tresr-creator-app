# TRESR Creator App

TeePublic-style design editor and product management tools for TRESR creators.

## Features

- 🎨 **Design Editor**: Drag & drop design positioning on multiple products
- 🎯 **Product Configuration**: Enable/disable products, select colors
- 💾 **Save & Publish**: Draft saving and mockup generation
- 📦 **Product Management**: View, edit, and manage all products
- 🏭 **Bulk Operations**: Generate mockups for all products at once

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Express.js
- **Database**: MySQL + Redis (optional)
- **APIs**: Dynamic Mockups, Shopify Admin API
- **Deployment**: Railway

## Quick Deploy to Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template/github?template=https://github.com/whoisjonray/tresr-creator-app)

### Manual Deployment Steps

1. Fork or use this repository
2. Go to [Railway.app](https://railway.app)
3. Create new project → "Deploy from GitHub repo"
4. Select `whoisjonray/tresr-creator-app`
5. Add environment variables (see below)
6. Deploy!

### Required Environment Variables

```env
# API Keys
DYNAMIC_MOCKUPS_API_KEY=your_dynamic_mockups_key
SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_API_SECRET=your_shopify_api_secret
SHOPIFY_ACCESS_TOKEN=your_shopify_access_token
SHOPIFY_STORE_DOMAIN=becc05-b4.myshopify.com

# Auth & Security
JWT_SECRET=your_jwt_secret_here
SESSION_SECRET=your_session_secret_here
DYNAMIC_ENV_ID=b17e8631-c1b7-45d5-95cf-151eb5246423

# URLs
DYNAMIC_AUTH_URL=https://auth.tresr.com
SHOPIFY_APP_URL=https://vibes.tresr.com

# Optional (Railway provides these automatically)
DATABASE_URL=mysql://...
REDIS_URL=redis://...
```

## Local Development

```bash
# Clone the repository
git clone https://github.com/whoisjonray/tresr-creator-app.git
cd tresr-creator-app

# Install dependencies
npm install

# Start development servers
npm run dev

# Frontend: http://localhost:3003
# Backend API: http://localhost:3002
```

## Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Architecture

```
tresr-creator-app/
├── client/               # React frontend
│   ├── src/
│   │   ├── pages/       # Main app pages
│   │   ├── components/  # Reusable components
│   │   └── services/    # API services
│   └── dist/            # Production build
├── server/              # Express backend
│   ├── routes/          # API endpoints
│   ├── services/        # External services
│   └── middleware/      # Auth & error handling
└── docs/                # Documentation
```

## API Endpoints

- `GET /health` - Health check
- `POST /api/auth/login` - Dynamic.xyz login
- `GET /api/products` - List creator products
- `POST /api/products` - Create new product
- `POST /api/mockups/generate` - Generate mockups
- `GET /api/creators/stats` - Creator statistics

## Cost Savings

Replaces IMG.ly ($980/month) with Dynamic Mockups ($19/month):
- **Monthly Savings**: $961
- **Annual Savings**: $11,532

## Support

For issues or questions, contact the TRESR development team.# Force Railway redeploy after payment issue - Fri Sep 12 19:41:31 CDT 2025
