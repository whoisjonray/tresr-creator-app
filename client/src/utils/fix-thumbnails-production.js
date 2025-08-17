// Production thumbnail fix utility
// This uses the existing working import endpoint to update thumbnails

export async function fixProductionThumbnails() {
  console.log('🔧 Starting production thumbnail fix...');
  
  try {
    // Use the existing import endpoint that's already working
    const response = await fetch('/api/sanity/person/import-my-designs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Import failed');
    }
    
    const result = await response.json();
    
    console.log('✅ Import complete:', result);
    
    // Return the result for UI feedback
    return {
      success: true,
      message: result.message,
      stats: result.stats
    };
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Helper to verify thumbnails after import
export async function verifyThumbnails() {
  console.log('🔍 Verifying thumbnails...');
  
  try {
    const response = await fetch('/api/designs', {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch designs');
    }
    
    const data = await response.json();
    const designs = data.designs || [];
    
    let withThumbnails = 0;
    let withoutThumbnails = 0;
    let missingData = [];
    
    for (const design of designs) {
      if (design.thumbnailUrl && design.thumbnailUrl !== '') {
        withThumbnails++;
      } else {
        withoutThumbnails++;
        missingData.push({
          id: design.id,
          name: design.name
        });
      }
    }
    
    console.log(`📊 Verification Results:`);
    console.log(`   ✅ With thumbnails: ${withThumbnails}`);
    console.log(`   ❌ Without thumbnails: ${withoutThumbnails}`);
    
    if (missingData.length > 0) {
      console.log('Missing thumbnails for:', missingData);
    }
    
    return {
      total: designs.length,
      withThumbnails,
      withoutThumbnails,
      missingData
    };
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    return null;
  }
}

// Auto-fix function that can be called from console or UI
export async function autoFixAndVerify() {
  console.log('🚀 Starting auto-fix and verify process...');
  
  // Step 1: Run the import to fix thumbnails
  console.log('\n📥 Step 1: Running import to update thumbnails...');
  const fixResult = await fixProductionThumbnails();
  
  if (!fixResult.success) {
    console.error('❌ Fix failed:', fixResult.error);
    return fixResult;
  }
  
  console.log('✅ Import successful:', fixResult.message);
  console.log('   Stats:', fixResult.stats);
  
  // Step 2: Wait a moment for database to update
  console.log('\n⏳ Step 2: Waiting for database update...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Step 3: Verify the results
  console.log('\n🔍 Step 3: Verifying thumbnails...');
  const verifyResult = await verifyThumbnails();
  
  if (verifyResult) {
    console.log('\n=====================================');
    console.log('📊 FINAL RESULTS:');
    console.log(`Total designs: ${verifyResult.total}`);
    console.log(`✅ With thumbnails: ${verifyResult.withThumbnails}`);
    console.log(`❌ Without thumbnails: ${verifyResult.withoutThumbnails}`);
    console.log('=====================================\n');
    
    // Refresh the page if thumbnails were updated
    if (verifyResult.withThumbnails > 0) {
      console.log('🔄 Refreshing page in 3 seconds to show updated thumbnails...');
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    }
  }
  
  return {
    fix: fixResult,
    verify: verifyResult
  };
}

// Export for use in React components
export default {
  fixProductionThumbnails,
  verifyThumbnails,
  autoFixAndVerify
};