// Focused fix for Just Grok It - get ONE design working completely

export async function fixJustGrokIt() {
  console.log('🎯 Fixing "Just Grok It" design...');
  console.log('This will set up ONE design with:');
  console.log('  ✅ Correct mockup for thumbnail');
  console.log('  ✅ Raw design for edit canvas');
  console.log('  ✅ Product configurations');
  console.log('  ✅ Everything needed for SuperProduct');
  
  try {
    const response = await fetch('/api/fix/fix-just-grok-it', {
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
    
    console.log('✅ SUCCESS!');
    console.log(result.message);
    
    if (result.design) {
      console.log('\n📍 Design Details:');
      console.log('  ID:', result.design.id);
      console.log('  Name:', result.design.name);
      console.log('  Edit URL:', result.design.edit_url);
      console.log('  Thumbnail:', result.design.thumbnail);
      
      console.log('\n🎯 Next Steps:');
      result.next_steps.forEach(step => console.log('  ' + step));
      
      if (result.design.edit_url) {
        console.log('\n🚀 Opening edit page in 3 seconds...');
        setTimeout(() => {
          window.location.href = result.design.edit_url;
        }, 3000);
      }
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export async function testJustGrokIt() {
  console.log('🔍 Testing "Just Grok It" status...');
  
  try {
    const response = await fetch('/api/fix/test-just-grok-it', {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Test failed');
    }
    
    const result = await response.json();
    
    console.log(result.ready ? '✅' : '❌', result.status);
    
    if (result.design) {
      console.log('\n📊 Design Status:');
      console.log('  ID:', result.design.id);
      console.log('  Name:', result.design.name);
      console.log('  Has design_data:', result.design.has_design_data ? '✅' : '❌');
      console.log('  Has front URL:', result.design.has_front_url ? '✅' : '❌');
      console.log('  Has product config:', result.design.has_product_config ? '✅' : '❌');
      
      if (result.ready) {
        console.log('\n🎯 Ready to edit at:', result.design.edit_url);
      } else {
        console.log('\n⚠️ Run fixJustGrokIt() first to prepare the design');
      }
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Make available globally for console testing
if (typeof window !== 'undefined') {
  window.fixJustGrokIt = fixJustGrokIt;
  window.testJustGrokIt = testJustGrokIt;
  
  console.log('💡 Just Grok It tools loaded! Commands:');
  console.log('   testJustGrokIt() - Check if design is ready');
  console.log('   fixJustGrokIt()  - Fix and prepare for complete workflow');
  console.log('');
  console.log('This will get ONE design working end-to-end as proof of concept.');
}

export default {
  fixJustGrokIt,
  testJustGrokIt
};