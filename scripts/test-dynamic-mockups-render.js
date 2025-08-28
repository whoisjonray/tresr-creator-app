#!/usr/bin/env node

// Test Dynamic Mockups Render API
// This tests if we can successfully render a mockup with a design

require('dotenv').config({ path: '/Users/user/Documents/Cursor Clients/TRESR Shopify/.env' });
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const API_KEY = process.env.DYNAMIC_MOCKUPS_API_KEY;
const API_BASE = 'https://app.dynamicmockups.com/api/v1';

// Test design image URL - use a simple placeholder that's publicly accessible
const TEST_DESIGN_URL = 'https://via.placeholder.com/500/667eea/ffffff?text=TRESR+TEST';

console.log('🧪 Testing Dynamic Mockups Render API...\n');

if (!API_KEY) {
  console.error('❌ DYNAMIC_MOCKUPS_API_KEY not found in .env file');
  process.exit(1);
}

// Create axios client
const client = axios.create({
  baseURL: API_BASE,
  headers: {
    'x-api-key': API_KEY,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  },
  timeout: 30000
});

async function testRenderAPI() {
  try {
    // Step 1: Get available mockups
    console.log('📚 Step 1: Fetching available mockups...');
    const mockupsResponse = await client.get('/mockups');
    
    // Handle nested response structure
    const mockups = mockupsResponse.data.data || mockupsResponse.data || [];
    
    if (!mockups || mockups.length === 0) {
      console.log('⚠️ No mockups found. Please add mockups to your Dynamic Mockups account.');
      console.log('   Visit: https://app.dynamicmockups.com/mockups');
      return;
    }
    
    console.log(`✅ Found ${mockups.length} mockups`);
    
    // Use the first mockup for testing
    const testMockup = mockups[0];
    console.log(`\n📍 Using mockup: ${testMockup.name}`);
    console.log(`   UUID: ${testMockup.uuid}`);
    
    // Step 2: Get mockup details to find smart objects
    console.log('\n🔍 Step 2: Getting mockup details...');
    const mockupDetails = await client.get(`/mockup/${testMockup.uuid}`);
    
    // Handle nested response
    const mockupData = mockupDetails.data.data || mockupDetails.data;
    const smartObjects = mockupData.smart_objects || [];
    
    if (!smartObjects || smartObjects.length === 0) {
      console.log('⚠️ No smart objects found in this mockup');
      return;
    }
    
    const smartObject = smartObjects[0];
    console.log(`✅ Found smart object: ${smartObject.uuid}`);
    console.log(`   Name: ${smartObject.name || 'Design Area'}`);
    
    // Step 3: Render the mockup
    console.log('\n🎨 Step 3: Rendering mockup with test design...');
    
    const renderRequest = {
      mockup_uuid: testMockup.uuid,
      smart_objects: [{
        uuid: smartObject.uuid,
        asset: {
          url: TEST_DESIGN_URL,
          fit: 'contain' // or 'stretch', 'cover'
        }
      }],
      export_label: `test-render-${Date.now()}`,
      export_options: {
        image_format: 'png',
        image_size: 1000
      }
    };
    
    console.log('📤 Sending render request:');
    console.log(JSON.stringify(renderRequest, null, 2));
    const renderResponse = await client.post('/renders', renderRequest);
    
    if (renderResponse.data && renderResponse.data.export_path) {
      console.log('✅ Mockup rendered successfully!');
      console.log(`   Preview URL: ${renderResponse.data.export_path}`);
      console.log(`   Label: ${renderResponse.data.export_label || 'N/A'}`);
      
      console.log('\n🎉 SUCCESS! Dynamic Mockups Render API is working!');
      console.log('\n📋 Next Steps:');
      console.log('1. Upload your mockup templates to Dynamic Mockups');
      console.log('2. Map TRESR products to mockup UUIDs in dynamicMockups.js');
      console.log('3. Test the integration at https://creators.tresr.com/design/new');
      
    } else {
      console.log('⚠️ Render succeeded but no URL returned');
      console.log('Response:', JSON.stringify(renderResponse.data, null, 2));
    }
    
  } catch (error) {
    console.error('\n❌ Render Test Failed:');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 401) {
        console.log('\n⚠️ Authentication failed. Check your API key.');
      } else if (error.response.status === 422) {
        console.log('\n⚠️ Invalid request format. Check the request structure.');
      } else if (error.response.status === 404) {
        console.log('\n⚠️ Mockup or smart object not found.');
      }
    } else {
      console.error('Error:', error.message);
    }
    
    process.exit(1);
  }
}

// Run the test
testRenderAPI().catch(console.error);