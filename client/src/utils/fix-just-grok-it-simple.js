// Simple fix for Just Grok It - directly call the backend fix endpoint
export async function fixJustGrokItSimple() {
  console.log('🎯 Fixing "Just Grok It" design (direct approach)...');
  
  try {
    // Just call the backend fix endpoint directly
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
      
      if (result.design.edit_url && result.design.id) {
        console.log('\n🚀 Opening edit page in 3 seconds...');
        setTimeout(() => {
          window.location.href = `/design/${result.design.id}/edit`;
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

// Make available globally for console testing
if (typeof window !== 'undefined') {
  window.fixJustGrokItSimple = fixJustGrokItSimple;
  
  console.log('💡 Simple Just Grok It fix loaded!');
  console.log('   Run: fixJustGrokItSimple()');
  console.log('   This will directly fix the design and open the editor.');
}

export default fixJustGrokItSimple;