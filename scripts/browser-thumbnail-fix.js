// Browser script to fix thumbnails for memelord
// Run this in the browser console at https://creators.tresr.com after logging in

async function fixAllThumbnails() {
  console.log('🔧 Starting thumbnail fix for all designs...');
  
  // Define the correct thumbnail URLs for known products
  const thumbnailMappings = {
    // Just Grok It
    'd590ec69-8d9f-4bb4-81db-ebc948058677': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1740958396/products/k2r2aa8vmghuyr3he0p2eo5e/j4oapq7bcs2y75v9nrmn.png',
    
    // Add more mappings here as needed
    // Format: 'design-id': 'cloudinary-url'
  };
  
  // Get all designs from the API
  try {
    const response = await fetch('/api/designs', {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch designs');
    }
    
    const data = await response.json();
    const designs = data.designs || [];
    
    console.log(`Found ${designs.length} designs to check`);
    
    let updated = 0;
    let failed = 0;
    
    // Update each design that needs a thumbnail
    for (const design of designs) {
      if (!design.thumbnailUrl || design.thumbnailUrl === '') {
        console.log(`Fixing ${design.name}...`);
        
        // Check if we have a mapping for this design
        const mappedUrl = thumbnailMappings[design.id];
        
        if (mappedUrl) {
          // We have a known URL, use it
          const updateResponse = await fetch(`/api/designs/${design.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
              thumbnailUrl: mappedUrl,
              frontDesignUrl: mappedUrl
            })
          });
          
          if (updateResponse.ok) {
            console.log(`✅ Updated ${design.name} with known thumbnail`);
            updated++;
          } else {
            console.log(`❌ Failed to update ${design.name}`);
            failed++;
          }
        } else {
          // Try to import from Sanity
          console.log(`⚠️ No known thumbnail for ${design.name}, needs Sanity import`);
        }
      }
    }
    
    console.log('\n=================');
    console.log(`✅ Fix complete!`);
    console.log(`Updated: ${updated} designs`);
    console.log(`Failed: ${failed} designs`);
    console.log(`Already had thumbnails: ${designs.length - updated - failed}`);
    console.log('=================');
    
    // Refresh the page to see the changes
    if (updated > 0) {
      console.log('Refreshing page in 3 seconds...');
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Instructions
console.log(`
==================================================
THUMBNAIL FIX SCRIPT LOADED
==================================================

To fix thumbnails, make sure you are:
1. Logged in as memelord (whoisjonray@gmail.com)
2. On https://creators.tresr.com

Then run:
  fixAllThumbnails()

This will update all designs with missing thumbnails.
==================================================
`);

// Auto-run if on the products page
if (window.location.pathname === '/products') {
  console.log('On products page, starting fix automatically...');
  fixAllThumbnails();
}