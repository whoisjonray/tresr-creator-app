// Load all fix utilities into the global scope for console access

import { fixWithCloudinaryMappings } from './fix-cloudinary-mappings';
import { fixWithSanityImages } from './fix-sanity-images';
import { runFinalFix } from './final-fix';
import { autoDebugAndFix } from './debug-current-design';
import { autoFixEditPage } from './fix-edit-page-data';

// Make all fix functions globally available
if (typeof window !== 'undefined') {
  window.fixCloudinary = fixWithCloudinaryMappings;
  window.fixSanityImages = fixWithSanityImages;
  window.runFinalFix = runFinalFix;
  window.debugDesign = {
    auto: autoDebugAndFix
  };
  window.fixEditPage = autoFixEditPage;
  
  // Also create a single fix-all function
  window.fixAll = async () => {
    console.log('🚀 Running comprehensive fix...');
    const result = await fixWithCloudinaryMappings();
    console.log('✅ Fix complete!');
    return result;
  };
  
  console.log('🔧 Fix utilities loaded! Available commands:');
  console.log('   fixCloudinary() - Fix with raw design images');
  console.log('   fixAll()        - Run comprehensive fix');
  console.log('   fixEditPage()   - Fix edit page data');
  console.log('   debugDesign.auto() - Debug current design');
}

export {
  fixWithCloudinaryMappings as fixCloudinary,
  fixWithSanityImages as fixSanityImages,
  runFinalFix,
  autoDebugAndFix,
  autoFixEditPage
};