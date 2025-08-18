// Fix designs with correct images from Sanity

export async function fixWithSanityImages() {
  console.log('🚀 Starting Sanity image fix...');
  console.log('This will fetch the CORRECT raw design images from Sanity');
  console.log('Not the mockup images, but the actual design PNG files');
  
  try {
    // First test the Sanity connection
    console.log('\n🔍 Testing Sanity connection...');
    const testResponse = await fetch('/api/fix/test-sanity-connection', {
      credentials: 'include'
    });
    
    if (testResponse.ok) {
      const testResult = await testResponse.json();
      console.log('✅ Sanity connection:', testResult.message);
      if (testResult.sampleDesign) {
        console.log('📊 Sample design data:', testResult.sampleDesign);
      }
    } else {
      console.warn('⚠️ Sanity connection test failed, continuing anyway...');
    }
    
    // Now run the actual fix
    console.log('\n🔧 Fetching correct images from Sanity...');
    const response = await fetch('/api/fix/fix-with-sanity-images', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Fix failed');
    }
    
    const result = await response.json();
    
    console.log('✅ SANITY IMAGE FIX COMPLETE!');
    console.log(result.message);
    console.log('Stats:', result.stats);
    
    if (result.updates && result.updates.length > 0) {
      console.log('\n📸 Example updates:');
      result.updates.forEach(update => {
        console.log(`  ${update.name}:`);
        console.log(`    Front: ${update.frontImage}`);
        console.log(`    Back: ${update.backImage}`);
      });
    }
    
    // If we're on the edit page, reload to see the new images
    if (window.location.pathname.includes('/edit')) {
      console.log('\n🔄 Reloading page in 3 seconds to show new images...');
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Sanity image fix failed:', error);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Make sure SANITY_API_TOKEN is set in Railway environment');
    console.log('2. The token needs read access to the production dataset');
    console.log('3. Check Railway logs for more details');
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Make available globally for console testing
if (typeof window !== 'undefined') {
  window.fixSanityImages = fixWithSanityImages;
  
  console.log('💡 Sanity image fix loaded! Run this command:');
  console.log('   fixSanityImages() - Fetches correct raw design images from Sanity');
  console.log('');
  console.log('This will replace the "Just Grok It" mockup with the actual design images');
}

export default fixWithSanityImages;