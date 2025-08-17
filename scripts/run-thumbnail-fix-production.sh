#!/bin/bash

echo "🔧 Running Thumbnail Fix in Production"
echo "======================================="
echo ""
echo "This will fix ALL memelord designs with correct thumbnail URLs"
echo "Waiting for deployment to complete..."
echo ""

# Wait for deployment
sleep 120

echo "Checking if app is online..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://creators.tresr.com/health)

if [ "$STATUS" != "200" ]; then
  echo "❌ App is not responding (status: $STATUS)"
  echo "Please check Railway deployment"
  exit 1
fi

echo "✅ App is online!"
echo ""
echo "Now running the thumbnail fix..."
echo ""

# You need to get a valid auth token first
# This is just an example - replace with actual token
AUTH_TOKEN="YOUR_AUTH_TOKEN_HERE"

# Run the fix
curl -X POST https://creators.tresr.com/api/fix/fix-all-memelord-thumbnails \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Cookie: tresr.session=YOUR_SESSION_COOKIE" \
  | jq '.'

echo ""
echo "Fix complete! Check the response above."
echo ""
echo "Now checking thumbnail status..."
echo ""

curl -X GET https://creators.tresr.com/api/fix/check-thumbnail-status \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Cookie: tresr.session=YOUR_SESSION_COOKIE" \
  | jq '.'

echo ""
echo "✅ All done! Check https://creators.tresr.com/products to verify thumbnails are showing"