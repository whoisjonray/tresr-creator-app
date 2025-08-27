#!/usr/bin/env node

// List all Dynamic Mockups templates and collections
// Run: node scripts/list-dynamic-mockups-templates.js

// Load from TRESR Shopify root .env file
require('dotenv').config({ path: '/Users/user/Documents/Cursor Clients/TRESR Shopify/.env' });
const axios = require('axios');

const API_KEY = process.env.DYNAMIC_MOCKUPS_API_KEY;
const API_BASE = 'https://app.dynamicmockups.com/api/v1';

console.log('🔍 Fetching Dynamic Mockups Templates and Collections...\n');

// Check if API key is configured
if (!API_KEY) {
  console.error('❌ DYNAMIC_MOCKUPS_API_KEY not found in .env file');
  process.exit(1);
}

// Create axios client
const client = axios.create({
  baseURL: API_BASE,
  headers: {
    'x-api-key': API_KEY,
    'Accept': 'application/json'
  },
  timeout: 30000
});

async function listEverything() {
  try {
    console.log('=' .repeat(60));
    console.log('📚 COLLECTIONS');
    console.log('=' .repeat(60));
    
    // Get all collections
    const collectionsResponse = await client.get('/collections');
    console.log('Raw collections response:', JSON.stringify(collectionsResponse.data, null, 2).substring(0, 500));
    
    // Handle different response formats
    const collections = Array.isArray(collectionsResponse.data) 
      ? collectionsResponse.data 
      : (collectionsResponse.data?.data || collectionsResponse.data?.collections || []);
    
    if (!Array.isArray(collections) || collections.length === 0) {
      console.log('No collections found.\n');
    } else {
      console.log(`Found ${collections.length} collection(s):\n`);
      collections.forEach((collection, index) => {
        console.log(`${index + 1}. ${collection.name}`);
        console.log(`   UUID: ${collection.uuid}`);
        console.log(`   Mockups: ${collection.mockup_count || 0}`);
        console.log(`   Created: ${collection.created_at}`);
        console.log('');
      });
    }
    
    console.log('=' .repeat(60));
    console.log('🎨 MOCKUP TEMPLATES');
    console.log('=' .repeat(60));
    
    // Get all mockups
    const mockupsResponse = await client.get('/mockups');
    console.log('Raw mockups response:', JSON.stringify(mockupsResponse.data, null, 2).substring(0, 500));
    
    // Handle different response formats
    const mockups = Array.isArray(mockupsResponse.data) 
      ? mockupsResponse.data 
      : (mockupsResponse.data?.data || mockupsResponse.data?.mockups || []);
    
    if (mockups.length === 0) {
      console.log('No mockup templates found.\n');
    } else {
      console.log(`Found ${mockups.length} mockup template(s):\n`);
      
      // Group by collection if possible
      const uncategorized = [];
      const byCollection = {};
      
      mockups.forEach(mockup => {
        const collectionName = mockup.collection?.name || 'Uncategorized';
        if (!byCollection[collectionName]) {
          byCollection[collectionName] = [];
        }
        byCollection[collectionName].push(mockup);
      });
      
      // Display mockups grouped by collection
      Object.keys(byCollection).forEach(collectionName => {
        console.log(`\n📁 ${collectionName}`);
        console.log('-'.repeat(40));
        
        byCollection[collectionName].forEach((mockup, index) => {
          console.log(`\n${index + 1}. ${mockup.name}`);
          console.log(`   UUID: ${mockup.uuid}`);
          console.log(`   Thumbnail: ${mockup.thumbnail || 'N/A'}`);
          
          // Show smart objects if available
          if (mockup.smart_objects && mockup.smart_objects.length > 0) {
            console.log(`   Smart Objects (${mockup.smart_objects.length}):`);
            mockup.smart_objects.forEach(so => {
              console.log(`     - ${so.name || so.uuid} (${so.type || 'unknown'})`);
            });
          }
          
          // Show collections if part of any
          if (mockup.collections && mockup.collections.length > 0) {
            console.log(`   Collections: ${mockup.collections.map(c => c.name).join(', ')}`);
          }
        });
      });
    }
    
    // Get detailed info for the first mockup if available
    if (mockups.length > 0) {
      console.log('\n' + '=' .repeat(60));
      console.log('🔍 DETAILED VIEW (First Template)');
      console.log('=' .repeat(60));
      
      try {
        const firstMockup = mockups[0];
        const detailResponse = await client.get(`/mockup/${firstMockup.uuid}`);
        const details = detailResponse.data;
        
        console.log(`\nTemplate: ${details.name}`);
        console.log(`UUID: ${details.uuid}`);
        
        if (details.smart_objects && details.smart_objects.length > 0) {
          console.log('\nSmart Objects:');
          details.smart_objects.forEach((so, index) => {
            console.log(`\n  ${index + 1}. ${so.name || 'Unnamed'}`);
            console.log(`     UUID: ${so.uuid}`);
            console.log(`     Type: ${so.type || 'unknown'}`);
            if (so.width && so.height) {
              console.log(`     Dimensions: ${so.width}x${so.height}`);
            }
            if (so.position) {
              console.log(`     Position: x=${so.position.x}, y=${so.position.y}`);
            }
          });
        }
        
        if (details.text_layers && details.text_layers.length > 0) {
          console.log('\nText Layers:');
          details.text_layers.forEach((tl, index) => {
            console.log(`  ${index + 1}. ${tl.name || 'Unnamed'}`);
            console.log(`     UUID: ${tl.uuid}`);
            console.log(`     Default: "${tl.default_text || ''}"`);
          });
        }
      } catch (error) {
        console.log('Could not fetch detailed view:', error.message);
      }
    }
    
    // Generate mapping suggestions for TRESR products
    console.log('\n' + '=' .repeat(60));
    console.log('🗺️ SUGGESTED PRODUCT MAPPINGS');
    console.log('=' .repeat(60));
    
    if (mockups.length > 0) {
      console.log('\nBased on template names, here are suggested mappings:\n');
      console.log('```javascript');
      console.log('// Update in server/services/dynamicMockups.js');
      console.log('const productMockupMap = {');
      
      // Try to intelligently match templates to products
      const productTypes = {
        'tee': ['t-shirt', 'tshirt', 'tee', 'regular'],
        'boxy': ['oversized', 'boxy', 'drop', 'relaxed'],
        'next-crop': ['crop', 'cropped', 'women'],
        'baby-tee': ['baby', 'fitted', 'slim'],
        'wmn-hoodie': ['women', 'female', 'hoodie', 'ladies'],
        'med-hood': ['hoodie', 'hooded', 'hood'],
        'mediu': ['sweatshirt', 'crew', 'crewneck'],
        'polo': ['polo'],
        'mug': ['mug', 'cup'],
        'patch-c': ['hat', 'cap', 'curved'],
        'patch-flat': ['hat', 'cap', 'flat', 'snapback']
      };
      
      Object.keys(productTypes).forEach(productId => {
        const keywords = productTypes[productId];
        const matchedMockup = mockups.find(m => {
          const nameLower = m.name.toLowerCase();
          return keywords.some(keyword => nameLower.includes(keyword));
        });
        
        if (matchedMockup) {
          console.log(`  '${productId}': '${matchedMockup.uuid}', // ${matchedMockup.name}`);
        } else {
          console.log(`  '${productId}': '', // No match found`);
        }
      });
      
      console.log('};');
      console.log('```');
    } else {
      console.log('\nNo templates available yet. Please create templates in Dynamic Mockups dashboard.');
    }
    
    // Show summary
    console.log('\n' + '=' .repeat(60));
    console.log('📊 SUMMARY');
    console.log('=' .repeat(60));
    console.log(`Total Collections: ${collections.length}`);
    console.log(`Total Templates: ${mockups.length}`);
    
    if (mockups.length > 0) {
      const smartObjectCounts = mockups.map(m => m.smart_objects?.length || 0);
      const avgSmartObjects = smartObjectCounts.reduce((a, b) => a + b, 0) / mockups.length;
      console.log(`Average Smart Objects per Template: ${avgSmartObjects.toFixed(1)}`);
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Run the listing
listEverything().catch(console.error);