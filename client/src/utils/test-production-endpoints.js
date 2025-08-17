// Test utility to debug production issues

export async function testEndpoints() {
  console.log('🧪 Testing production endpoints...\n');
  
  const tests = [
    {
      name: 'Test Endpoint (Simple)',
      url: '/api/test/test-thumbnail-endpoint',
      method: 'POST'
    },
    {
      name: 'Check Models Available',
      url: '/api/test/test-models-available',
      method: 'GET'
    },
    {
      name: 'Simple Thumbnail Fix',
      url: '/api/fix/simple-thumbnail-fix',
      method: 'POST'
    }
  ];
  
  for (const test of tests) {
    console.log(`\n📍 Testing: ${test.name}`);
    console.log(`   URL: ${test.url}`);
    console.log(`   Method: ${test.method}`);
    
    try {
      const response = await fetch(test.url, {
        method: test.method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Success:`, data);
      } else {
        const text = await response.text();
        console.log(`   ❌ Error Response:`, text.substring(0, 200));
      }
    } catch (error) {
      console.log(`   ❌ Network Error:`, error.message);
    }
  }
  
  console.log('\n=====================================');
  console.log('Testing complete. Check results above.');
  console.log('=====================================\n');
}

// Make it available in browser console
if (typeof window !== 'undefined') {
  window.testEndpoints = testEndpoints;
}

export default testEndpoints;