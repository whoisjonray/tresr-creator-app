// FORCE CANVAS RENDER - Direct manipulation to make it work NOW
export function forceCanvasRender() {
  console.log('🔨 FORCING CANVAS TO RENDER...');
  
  // Find the canvas
  const canvas = document.querySelector('canvas');
  if (!canvas) {
    console.error('No canvas found');
    return false;
  }
  
  const ctx = canvas.getContext('2d');
  
  // Get the t-shirt that IS loading
  const garmentImg = document.querySelector('.mockup-preview img');
  const designImg = document.querySelector('.design-preview');
  
  if (!garmentImg || !designImg) {
    console.error('Missing images');
    return false;
  }
  
  // Create proper images
  const garment = new Image();
  garment.crossOrigin = 'anonymous';
  const design = new Image();
  design.crossOrigin = 'anonymous';
  
  // When both load, render them
  let garmentLoaded = false;
  let designLoaded = false;
  
  const renderCanvas = () => {
    if (!garmentLoaded || !designLoaded) return;
    
    console.log('✅ Both images loaded, rendering...');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw garment
    ctx.drawImage(garment, 0, 0, canvas.width, canvas.height);
    
    // Calculate CORRECT scale for design
    // For 1890x2362 image on 280x350 print area
    const printWidth = 280;
    const printHeight = 350;
    const scale = Math.min(printWidth / design.width, printHeight / design.height);
    
    const designWidth = design.width * scale;
    const designHeight = design.height * scale;
    
    // Center in print area
    const printX = (canvas.width - printWidth) / 2;
    const printY = (canvas.height - printHeight) / 2 - 30;
    const designX = printX + (printWidth - designWidth) / 2;
    const designY = printY + (printHeight - designHeight) / 2;
    
    // Draw print area bounds
    ctx.strokeStyle = '#0066cc';
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 2;
    ctx.strokeRect(printX, printY, printWidth, printHeight);
    ctx.setLineDash([]);
    
    // Clip to print area
    ctx.save();
    ctx.beginPath();
    ctx.rect(printX, printY, printWidth, printHeight);
    ctx.clip();
    
    // Draw design
    ctx.drawImage(design, designX, designY, designWidth, designHeight);
    
    ctx.restore();
    
    // Fix the scale display
    const scaleInput = document.querySelector('input[type="text"][value*="21"]') ||
                      document.querySelector('input[type="text"][value*="%"]');
    if (scaleInput) {
      const displayScale = Math.round(scale * 100);
      scaleInput.value = displayScale;
      console.log('✅ Fixed scale display to:', displayScale + '%');
    }
    
    // Fix the slider
    const slider = document.querySelector('input[type="range"]');
    if (slider) {
      slider.min = 10;
      slider.max = 500;
      slider.value = Math.round(scale * 100);
      
      // Make slider work
      slider.oninput = () => {
        const newScale = slider.value / 100;
        
        // Redraw with new scale
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(garment, 0, 0, canvas.width, canvas.height);
        
        const scaledWidth = design.width * newScale;
        const scaledHeight = design.height * newScale;
        const scaledX = printX + (printWidth - scaledWidth) / 2;
        const scaledY = printY + (printHeight - scaledHeight) / 2;
        
        ctx.strokeStyle = '#0066cc';
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 2;
        ctx.strokeRect(printX, printY, printWidth, printHeight);
        ctx.setLineDash([]);
        
        ctx.save();
        ctx.beginPath();
        ctx.rect(printX, printY, printWidth, printHeight);
        ctx.clip();
        ctx.drawImage(design, scaledX, scaledY, scaledWidth, scaledHeight);
        ctx.restore();
        
        // Update display
        if (scaleInput) {
          scaleInput.value = slider.value;
        }
      };
    }
    
    console.log('✅ CANVAS RENDERING COMPLETE!');
  };
  
  garment.onload = () => {
    garmentLoaded = true;
    console.log('✅ Garment loaded');
    renderCanvas();
  };
  
  design.onload = () => {
    designLoaded = true;
    console.log('✅ Design loaded:', design.width + 'x' + design.height);
    renderCanvas();
  };
  
  // Start loading
  garment.src = garmentImg.src;
  design.src = designImg.src;
  
  return true;
}

// Auto-run when page is ready
if (typeof window !== 'undefined') {
  window.forceCanvasRender = forceCanvasRender;
  
  // Try multiple times to ensure it works
  const tryRender = () => {
    const canvas = document.querySelector('canvas');
    const designImg = document.querySelector('.design-preview');
    
    if (canvas && designImg && designImg.src) {
      console.log('🎯 Attempting force render...');
      forceCanvasRender();
    } else {
      console.log('⏳ Waiting for elements...');
      setTimeout(tryRender, 500);
    }
  };
  
  if (document.readyState === 'complete') {
    setTimeout(tryRender, 1000);
  } else {
    window.addEventListener('load', () => {
      setTimeout(tryRender, 1000);
    });
  }
  
  console.log('💪 Force canvas render loaded! Run: forceCanvasRender()');
}

export default forceCanvasRender;