#!/bin/bash

# Fix Production Creator Mappings - Complete Solution
# This script diagnoses and fixes the issue where creators.tresr.com returns 0 designs

echo "🚀 TRESR Creator App - Production Database Fix"
echo "=============================================="
echo ""
echo "This script will:"
echo "1. Diagnose the current production database state"
echo "2. Populate missing creator mappings"
echo "3. Verify the fix"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Must be run from the tresr-creator-app root directory"
    exit 1
fi

# Check if production environment file exists
if [ ! -f ".env.production" ]; then
    echo "❌ Error: .env.production file not found"
    echo "Please ensure production environment variables are configured"
    exit 1
fi

echo "📊 Step 1: Diagnosing production database..."
echo "============================================="
node scripts/diagnose-production-database.js

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Diagnosis failed. Please check the error above."
    echo "Common issues:"
    echo "  - Missing database credentials in .env.production"
    echo "  - Network connectivity to production database"
    echo "  - Database permissions"
    exit 1
fi

echo ""
echo "🔧 Step 2: Populating creator mappings..."
echo "========================================="
node scripts/populate-production-creator-mappings.js

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Population failed. Please check the error above."
    exit 1
fi

echo ""
echo "✅ Step 3: Running final verification..."
echo "========================================"
node scripts/diagnose-production-database.js

echo ""
echo "🎉 Production fix completed!"
echo "=========================="
echo ""
echo "Next steps:"
echo "1. Test login at https://creators.tresr.com with whoisjonray@gmail.com"
echo "2. Verify that designs are now loading (should be > 0)"
echo "3. If still showing 0 designs, the issue might be:"
echo "   - Missing designs in the database (need to import from Sanity)"
echo "   - Authentication/session issues"
echo "   - Application server configuration"
echo ""
echo "For additional debugging, check:"
echo "  - Application logs at https://creators.tresr.com"
echo "  - Browser developer console for client-side errors"
echo "  - Network tab for failed API requests"