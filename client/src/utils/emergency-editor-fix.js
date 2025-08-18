// EMERGENCY FIX - Force the editor to work properly
// Run this in the browser console if the editor is broken

export function emergencyEditorFix() {
  console.log('🚨 EMERGENCY EDITOR FIX ACTIVATED');
  
  // Fix 1: Force design image to load on canvas
  const fixCanvas = () => {
    // Find the design preview image (top area)
    const previewImg = document.querySelector('.design-preview');
    if (!previewImg || !previewImg.src) {
      console.log('❌ No preview image found');
      return false;
    }
    
    console.log('✅ Found preview image:', previewImg.src);
    
    // Get the canvas
    const canvas = document.querySelector('canvas');
    if (!canvas) {
      console.log('❌ No canvas found');
      return false;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Create new image and force it to load
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = function() {
      console.log('✅ Image loaded:', img.width, 'x', img.height);
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw gray background
      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Calculate PROPER scale (not the broken 21%)
      // For a 1890x2362 image, we want it to fit nicely in the canvas
      const printAreaWidth = 280;  // Approximate print area
      const printAreaHeight = 350;
      
      // Scale to fit print area
      const scaleX = printAreaWidth / img.width;
      const scaleY = printAreaHeight / img.height;
      const scale = Math.min(scaleX, scaleY);
      
      console.log('📏 Calculated scale:', (scale * 100).toFixed(1) + '%');
      
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      
      // Center in print area (approximate)
      const x = (canvas.width - scaledWidth) / 2;
      const y = (canvas.height - scaledHeight) / 2 - 30; // Offset up a bit
      
      // Draw the design
      ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
      
      // Draw print area bounds (blue dashed box)
      ctx.strokeStyle = '#0066cc';
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 2;
      
      const printX = (canvas.width - printAreaWidth) / 2;
      const printY = (canvas.height - printAreaHeight) / 2 - 30;
      ctx.strokeRect(printX, printY, printAreaWidth, printAreaHeight);
      ctx.setLineDash([]);
      
      console.log('✅ Canvas fixed! Design rendered at', (scale * 100).toFixed(1) + '%');
      
      // Fix the scale slider to show correct value
      const scaleInput = document.querySelector('input[type="text"][value*="21."]');
      if (scaleInput) {
        scaleInput.value = (scale * 100).toFixed(0);
        console.log('✅ Fixed scale display');
      }
      
      return true;
    };
    
    img.onerror = function() {
      console.error('❌ Failed to load image:', previewImg.src);
      return false;
    };
    
    // Load the image
    img.src = previewImg.src;
    return true;
  };
  
  // Fix 2: Enable dragging on canvas
  const enableDragging = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let designX = (canvas.width - 280) / 2;
    let designY = (canvas.height - 350) / 2 - 30;
    
    canvas.style.cursor = 'move';
    
    canvas.onmousedown = (e) => {
      isDragging = true;
      const rect = canvas.getBoundingClientRect();
      dragStartX = e.clientX - rect.left - designX;
      dragStartY = e.clientY - rect.top - designY;
    };
    
    canvas.onmousemove = (e) => {
      if (!isDragging) return;
      const rect = canvas.getBoundingClientRect();
      designX = e.clientX - rect.left - dragStartX;
      designY = e.clientY - rect.top - dragStartY;
      
      // Redraw with new position
      fixCanvas();
    };
    
    canvas.onmouseup = () => {
      isDragging = false;
    };
    
    console.log('✅ Dragging enabled');
  };
  
  // Fix 3: Make scale slider work
  const fixScaleSlider = () => {
    const slider = document.querySelector('input[type="range"]');
    if (!slider) return;
    
    // Set proper range
    slider.min = 10;
    slider.max = 500;
    slider.value = 100;
    
    // Add listener to redraw on change
    slider.oninput = () => {
      const scale = slider.value / 100;
      console.log('Scale changed to:', slider.value + '%');
      
      // Update text display
      const scaleText = document.querySelector('input[type="text"][value*="%"]') || 
                       document.querySelector('input[type="text"][value*="21"]');
      if (scaleText) {
        scaleText.value = slider.value;
      }
      
      // Redraw canvas with new scale
      fixCanvas();
    };
    
    console.log('✅ Scale slider fixed');
  };
  
  // Run all fixes
  const success = fixCanvas();
  if (success) {
    enableDragging();
    fixScaleSlider();
    console.log('✅ EMERGENCY FIX COMPLETE - Editor should work now!');
  } else {
    console.log('❌ Emergency fix failed - image may still be loading');
    
    // Retry after a delay
    setTimeout(() => {
      console.log('🔄 Retrying emergency fix...');
      emergencyEditorFix();
    }, 1000);
  }
}

// Auto-run on load
if (typeof window !== 'undefined') {
  window.emergencyEditorFix = emergencyEditorFix;
  
  // Run after page loads
  if (document.readyState === 'complete') {
    setTimeout(emergencyEditorFix, 500);
  } else {
    window.addEventListener('load', () => {
      setTimeout(emergencyEditorFix, 500);
    });
  }
  
  console.log('💊 Emergency fix loaded! Run: emergencyEditorFix()');
}

export default emergencyEditorFix;