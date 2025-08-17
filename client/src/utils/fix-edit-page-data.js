// Fix edit page data - populate design_data and product_config

export async function fixEditPageData() {
  console.log('🔧 Starting edit page data fix...');
  
  try {
    const response = await fetch('/api/fix/fix-edit-page-data', {
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
    
    console.log('✅ Edit page fix complete:', result);
    
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

// Test a specific design to see if it has the right data
export async function testDesignData(designId) {
  console.log(`🔍 Testing design ${designId}...`);
  
  try {
    const response = await fetch(`/api/fix/test-design/${designId}`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch design');
    }
    
    const result = await response.json();
    const design = result.design;
    
    console.log('📊 Design Test Results:');
    console.log('  Has design_data:', !!design.design_data);
    console.log('  Has elements:', !!(design.design_data?.elements));
    console.log('  Has product_config:', !!design.product_config);
    console.log('  Has front_design_url:', !!design.front_design_url);
    console.log('  Has positions:', !!design.frontPosition);
    
    return design;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return null;
  }
}

// Auto-fix and test
export async function autoFixEditPage() {
  console.log('🚀 Starting auto-fix for edit page...');
  
  // Step 1: Run the fix
  console.log('\n📥 Step 1: Fixing edit page data...');
  const fixResult = await fixEditPageData();
  
  if (!fixResult.success) {
    console.error('❌ Fix failed:', fixResult.error);
    return fixResult;
  }
  
  console.log('✅ Fix successful:', fixResult.message);
  console.log('   Stats:', fixResult.stats);
  
  // Step 2: Test a design (if we have one)
  const testId = window.location.pathname.match(/design\/([^\/]+)/)?.[1];
  if (testId) {
    console.log(`\n🔍 Step 2: Testing design ${testId}...`);
    const testResult = await testDesignData(testId);
    
    if (testResult) {
      console.log('✅ Design has required data!');
      
      // Refresh if we're on the edit page
      if (window.location.pathname.includes('/edit')) {
        console.log('🔄 Refreshing edit page in 2 seconds...');
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    }
  }
  
  return fixResult;
}

export default {
  fixEditPageData,
  testDesignData,
  autoFixEditPage
};