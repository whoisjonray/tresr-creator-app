# TRESR Creator App

A dedicated Shopify app for TRESR creators to manage their designs and products.

## 🚀 Demo Access

The app is now running locally:

### **Frontend (React App)**
- **URL**: http://localhost:3003
- **Login Page**: http://localhost:3003/login
- **Dashboard**: http://localhost:3003/dashboard (requires login)

### **Backend API**
- **URL**: http://localhost:3002
- **Health Check**: http://localhost:3002/health

## 🔐 Authentication

The app uses Dynamic.xyz for authentication. To login:

1. Go to http://localhost:3003/login
2. Click "Login with Dynamic"
3. You'll be redirected to Dynamic.xyz
4. After authentication, you'll be redirected back to the dashboard

**Note**: You need to be marked as a "creator" in the system to access the dashboard.

## 📱 Features Implemented

### ✅ Working Now
- Dynamic.xyz authentication integration
- Creator dashboard with stats
- Basic navigation structure
- Session management
- API endpoints for products, mockups, and creator data

### 🚧 Coming Soon
- TeePublic-style design editor
- Product management interface
- Dynamic Mockups API integration
- Real-time mockup generation
- Batch product creation

## 🛠️ Development

To stop the servers: Press `Ctrl+C` in the terminal

To restart:
```bash
cd /Users/user/Documents/TRESR Shopify/tresr-creator-app
npm run dev
```

## 💰 Cost Savings

This app replaces IMG.ly ($980/month) with Dynamic Mockups ($19/month), saving **$961/month** or **$11,532/year**!

## 🏗️ Architecture

- **Frontend**: React + Vite (Port 3000)
- **Backend**: Express.js (Port 3002)
- **Authentication**: Dynamic.xyz OAuth
- **APIs**: Shopify Admin API + Dynamic Mockups API
- **Session Storage**: In-memory (Redis ready)

## 📝 Environment Variables

The app reads from `/Users/user/Documents/TRESR Shopify/.env`:
- `DYNAMIC_MOCKUPS_API_KEY` - Already configured
- `SHOPIFY_API_ACCESS_TOKEN` - Needs to be added
- `SHOPIFY_STORE_DOMAIN` - Set to becc05-b4.myshopify.com

## 🚀 Next Steps

1. Complete the design editor by porting the demo
2. Integrate Dynamic Mockups API
3. Add product creation workflow
4. Deploy to production (Railway/Vercel)