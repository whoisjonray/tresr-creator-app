// Fix designs with Cloudinary raw design images (no Sanity dependency)

export async function fixWithCloudinaryMappings() {
  console.log('🚀 Starting Cloudinary raw design image fix...');
  console.log('This will replace mockup images with RAW DESIGN images');
  
  try {
    const response = await fetch('/api/fix/fix-with-cloudinary-mappings', {
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
    
    console.log('✅ CLOUDINARY FIX COMPLETE!');
    console.log(result.message);
    console.log('Stats:', result.stats);
    
    if (result.updates && result.updates.length > 0) {
      console.log('\n📸 Example updates:');
      result.updates.forEach(update => {
        console.log(`  ${update.name}:`);
        console.log(`    Front: ${update.frontImage}`);
      });
    }
    
    if (result.note) {
      console.log('\n📝 Note:', result.note);
    }
    
    // If we're on the edit page, reload to see the new images
    if (window.location.pathname.includes('/edit')) {
      console.log('\n🔄 Reloading page in 2 seconds to show raw design images...');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Cloudinary fix failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Make available globally for console testing
if (typeof window !== 'undefined') {
  window.fixCloudinary = fixWithCloudinaryMappings;
  
  console.log('💡 Cloudinary fix loaded! Run this command:');
  console.log('   fixCloudinary() - Replaces mockup images with RAW DESIGN images');
  console.log('');
  console.log('This uses the actual design PNG files, not the t-shirt mockups!');
}

export default fixWithCloudinaryMappings;