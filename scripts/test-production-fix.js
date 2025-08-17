#!/usr/bin/env node

// Test script to verify the direct database fix endpoint is working in production

const https = require('https');

console.log('🔧 Testing production thumbnail fix endpoint...\n');

// Test if the endpoint exists
const testEndpoint = () => {
  const options = {
    hostname: 'creators.tresr.com',
    path: '/api/test/test-endpoint',
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`✅ Test endpoint status: ${res.statusCode}`);
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            console.log('Response:', json);
            resolve(true);
          } catch (e) {
            console.log('Raw response:', data);
            resolve(true);
          }
        } else {
          console.log('❌ Endpoint not ready yet');
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Connection error:', error.message);
      resolve(false);
    });
    
    req.end();
  });
};

// Test models availability
const testModels = () => {
  const options = {
    hostname: 'creators.tresr.com',
    path: '/api/test/test-models-available',
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`\n📊 Models check status: ${res.statusCode}`);
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            console.log('Models available:', json.modelsAvailable);
            if (json.modelNames) {
              console.log('Model names:', json.modelNames);
            }
          } catch (e) {
            console.log('Raw response:', data);
          }
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Connection error:', error.message);
    });
    
    req.end();
  });
};

// Main test
const runTest = async () => {
  console.log('🌐 Testing https://creators.tresr.com\n');
  
  const isReady = await testEndpoint();
  
  if (isReady) {
    await testModels();
    console.log('\n✅ Deployment appears to be ready!');
    console.log('🚀 You can now test the FIX THUMBNAILS button at:');
    console.log('   https://creators.tresr.com/products\n');
  } else {
    console.log('\n⏳ Deployment not ready yet. Railway typically takes 2-3 minutes.');
    console.log('   Try again in a minute.\n');
  }
};

runTest();