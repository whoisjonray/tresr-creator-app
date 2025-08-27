#!/usr/bin/env node

// Test Dynamic Mockups API Connection
// Run: node scripts/test-dynamic-mockups-api.js

// Load from TRESR Shopify root .env file
require('dotenv').config({ path: '/Users/user/Documents/Cursor Clients/TRESR Shopify/.env' });
const axios = require('axios');

const API_KEY = process.env.DYNAMIC_MOCKUPS_API_KEY;
const API_BASE = 'https://app.dynamicmockups.com/api/v1';

console.log('🧪 Testing Dynamic Mockups API Connection...\n');

// Check if API key is configured
if (!API_KEY) {
  console.error('❌ DYNAMIC_MOCKUPS_API_KEY not found in .env file');
  console.log('Please add: DYNAMIC_MOCKUPS_API_KEY=your-api-key');
  process.exit(1);
}

console.log('✅ API Key found:', API_KEY.substring(0, 20) + '...\n');

// Create axios client
const client = axios.create({
  baseURL: API_BASE,
  headers: {
    'x-api-key': API_KEY,
    'Accept': 'application/json'
  },
  timeout: 10000
});

async function testAPI() {
  const results = {
    collections: false,
    mockups: false,
    totalCollections: 0,
    totalMockups: 0,
    sampleCollection: null,
    sampleMockup: null
  };

  try {
    // Test 1: Get Collections
    console.log('📚 Test 1: Fetching collections...');
    try {
      const collectionsResponse = await client.get('/collections');
      results.collections = true;
      results.totalCollections = collectionsResponse.data.length || 0;
      results.sampleCollection = collectionsResponse.data[0] || null;
      
      console.log(`✅ Collections API working! Found ${results.totalCollections} collections`);
      if (results.sampleCollection) {
        console.log(`   Sample: ${results.sampleCollection.name} (UUID: ${results.sampleCollection.uuid})`);
      }
    } catch (error) {
      console.error('❌ Collections API failed:', error.response?.data?.message || error.message);
    }

    console.log('');

    // Test 2: Get Mockups
    console.log('🎭 Test 2: Fetching mockups...');
    try {
      const mockupsResponse = await client.get('/mockups');
      results.mockups = true;
      results.totalMockups = mockupsResponse.data.length || 0;
      results.sampleMockup = mockupsResponse.data[0] || null;
      
      console.log(`✅ Mockups API working! Found ${results.totalMockups} mockups`);
      if (results.sampleMockup) {
        console.log(`   Sample: ${results.sampleMockup.name}`);
        console.log(`   UUID: ${results.sampleMockup.uuid}`);
        if (results.sampleMockup.smart_objects?.length) {
          console.log(`   Smart Objects: ${results.sampleMockup.smart_objects.length}`);
        }
      }
    } catch (error) {
      console.error('❌ Mockups API failed:', error.response?.data?.message || error.message);
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(50));
    
    // Summary
    const allPassed = results.collections && results.mockups;
    
    if (allPassed) {
      console.log('✅ All tests passed! Dynamic Mockups API is working.');
      console.log(`\n📈 Stats:`);
      console.log(`   - Collections: ${results.totalCollections}`);
      console.log(`   - Mockups: ${results.totalMockups}`);
      console.log('\n🎉 You can now use Dynamic Mockups in your app!');
      console.log('   Navigate to: http://localhost:3003/experimental/design/new');
    } else {
      console.log('⚠️ Some tests failed. Please check your API key and permissions.');
    }

    // Test 3: Get specific mockup details (if we have a sample)
    if (results.sampleMockup) {
      console.log('\n' + '='.repeat(50));
      console.log('🔍 Test 3: Getting mockup details...');
      try {
        const detailResponse = await client.get(`/mockup/${results.sampleMockup.uuid}`);
        console.log('✅ Mockup details API working!');
        const mockup = detailResponse.data;
        console.log(`   Name: ${mockup.name}`);
        console.log(`   Smart Objects: ${mockup.smart_objects?.map(so => so.name || so.uuid).join(', ')}`);
      } catch (error) {
        console.error('❌ Mockup details API failed:', error.response?.data?.message || error.message);
      }
    }

    // Show next steps
    console.log('\n' + '='.repeat(50));
    console.log('📝 NEXT STEPS');
    console.log('='.repeat(50));
    console.log('1. Map your product IDs to Dynamic Mockups UUIDs');
    console.log('   Edit: server/services/dynamicMockups.js -> mapProductToMockup()');
    console.log('\n2. Create a TRESR collection in Dynamic Mockups dashboard');
    console.log('   Visit: https://app.dynamicmockups.com/collections');
    console.log('\n3. Test the integration:');
    console.log('   npm run dev');
    console.log('   Visit: http://localhost:3003/experimental/design/new');

  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
    if (error.response?.status === 401) {
      console.error('   Authentication failed. Please check your API key.');
    }
  }
}

// Run the test
testAPI().catch(console.error);