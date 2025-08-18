// Debug and fix the current design on the edit page

export async function debugCurrentDesign() {
  // Get design ID from URL
  const match = window.location.pathname.match(/design\/([^\/]+)/);
  if (!match) {
    console.error('❌ No design ID found in URL');
    return null;
  }
  
  const designId = match[1];
  console.log(`🔍 Debugging design: ${designId}`);
  
  try {
    const response = await fetch(`/api/debug/debug-design/${designId}`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to debug design');
    }
    
    const result = await response.json();
    
    console.log('📊 DESIGN DEBUG RESULTS:');
    console.log('=======================');
    console.log('ID:', result.analysis.id);
    console.log('Name:', result.analysis.name);
    console.log('\n🖼️ Image URLs:');
    console.log('  Thumbnail:', result.analysis.thumbnail_url || 'MISSING');
    console.log('  Front Design:', result.analysis.front_design_url || 'MISSING');
    console.log('  Back Design:', result.analysis.back_design_url || 'MISSING');
    
    if (result.analysis.design_data_parsed) {
      console.log('\n📦 Design Data:');
      console.log('  Has elements:', result.analysis.design_data_parsed.has_elements);
      console.log('  Elements count:', result.analysis.design_data_parsed.elements_count);
      if (result.analysis.design_data_parsed.first_element) {
        console.log('  First element src:', result.analysis.design_data_parsed.first_element.src || 'NO SRC');
      }
    } else {
      console.log('\n❌ No design_data or failed to parse');
    }
    
    console.log('\n📋 Raw Data Sample:');
    console.log(result.raw_data);
    
    return result;
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
    return null;
  }
}

export async function fixCurrentDesign() {
  // Get design ID from URL
  const match = window.location.pathname.match(/design\/([^\/]+)/);
  if (!match) {
    console.error('❌ No design ID found in URL');
    return null;
  }
  
  const designId = match[1];
  console.log(`🔧 Fixing design: ${designId}`);
  
  try {
    const response = await fetch(`/api/debug/fix-specific-design/${designId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fix design');
    }
    
    const result = await response.json();
    
    console.log('✅ Design fixed successfully!');
    console.log('Updates applied:', result.updates);
    
    // Reload the page after 2 seconds
    console.log('🔄 Reloading page in 2 seconds...');
    setTimeout(() => {
      window.location.reload();
    }, 2000);
    
    return result;
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
    return null;
  }
}

// Auto-run debug and fix
export async function autoDebugAndFix() {
  console.log('🚀 Starting auto debug and fix...');
  
  // Step 1: Debug current state
  console.log('\n📊 Step 1: Debugging current design...');
  const debugResult = await debugCurrentDesign();
  
  if (!debugResult) {
    console.error('❌ Could not debug design');
    return;
  }
  
  // Check if we need to fix
  const needsFix = !debugResult.analysis.front_design_url || 
                   !debugResult.analysis.design_data_parsed?.first_element?.src;
  
  if (needsFix) {
    console.log('\n🔧 Step 2: Design needs fixing, applying fix...');
    const fixResult = await fixCurrentDesign();
    
    if (fixResult && fixResult.success) {
      console.log('✅ Fix applied successfully!');
    } else {
      console.error('❌ Fix failed');
    }
  } else {
    console.log('\n✅ Design appears to have proper data');
    console.log('   Image URL:', debugResult.analysis.front_design_url);
    
    // Still might need to reload if the page isn't showing it
    if (window.location.pathname.includes('/edit')) {
      console.log('🔄 Refreshing edit page to ensure images load...');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }
}

// Make functions available globally for console testing
if (typeof window !== 'undefined') {
  window.debugDesign = {
    debug: debugCurrentDesign,
    fix: fixCurrentDesign,
    auto: autoDebugAndFix
  };
  
  console.log('💡 Debug tools loaded! Available commands:');
  console.log('   debugDesign.debug() - Check current design data');
  console.log('   debugDesign.fix()   - Fix current design with working image');
  console.log('   debugDesign.auto()  - Auto debug and fix if needed');
}

export default {
  debugCurrentDesign,
  fixCurrentDesign,
  autoDebugAndFix
};