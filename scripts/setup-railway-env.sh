#!/bin/bash

# Setup Dynamic Mockups Environment Variables in Railway
# Run: ./scripts/setup-railway-env.sh

echo "🚂 Setting up Dynamic Mockups environment variables in Railway..."
echo ""
echo "⚠️  Make sure you're logged in to Railway CLI first:"
echo "   railway login"
echo ""
echo "Press Enter to continue or Ctrl+C to cancel..."
read

# Core Dynamic Mockups configuration
railway variables --set "DYNAMIC_MOCKUPS_ENABLED=true"
railway variables --set "DYNAMIC_MOCKUPS_API_KEY=54a29578-65a8-4dfb-a4be-0abe2c63e3aa:c98a742930e0510322c97c3f7d7619c635d0f0a5f3481cfd96c4795296f3edb3"
railway variables --set "DYNAMIC_MOCKUPS_WEBSITE_KEY="

# React app feature flags
railway variables --set "REACT_APP_USE_DYNAMIC_MOCKUPS=true"
railway variables --set "REACT_APP_DM_MODE=api"
railway variables --set "REACT_APP_ENABLE_EXPERIMENTAL_ROUTES=true"
railway variables --set "REACT_APP_ENABLE_COMPARISON_DASHBOARD=true"
railway variables --set "REACT_APP_TRACK_MOCKUP_PERFORMANCE=true"
railway variables --set "REACT_APP_ENABLE_DM_CACHE=true"
railway variables --set "REACT_APP_DM_CACHE_TTL=86400"
railway variables --set "REACT_APP_ENABLE_BULK_RENDER=true"
railway variables --set "REACT_APP_ENABLE_PRINT_FILES=true"
railway variables --set "REACT_APP_FALLBACK_TO_CANVAS=true"

echo ""
echo "✅ Environment variables set!"
echo ""
echo "🔄 Railway will redeploy automatically with the new variables."
echo "   This usually takes 2-3 minutes."
echo ""
echo "📊 You can verify the deployment at:"
echo "   https://railway.app/project/[your-project-id]"
echo ""
echo "🧪 Test the API after deployment:"
echo "   curl https://creators.tresr.com/api/v2/mockups/health"