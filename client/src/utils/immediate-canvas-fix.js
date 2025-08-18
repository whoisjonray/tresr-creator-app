// IMMEDIATE FIX for canvas not showing design
// This patches the broken canvas rendering in DesignEditor.jsx

export function immediateCanvasFix() {
  console.log('🚨 APPLYING IMMEDIATE CANVAS FIX...');
  
  // Force reload the design image when canvas is blank
  const checkAndFixCanvas = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Check if canvas is blank
    const imageData = ctx.getImageData(0, 0, 1, 1);
    const isBlank = imageData.data.every(pixel => pixel === 0 || pixel === 255);
    
    if (isBlank) {
      console.log('❌ Canvas is blank, forcing reload...');
      
      // Find the design image in the preview
      const previewImage = document.querySelector('.design-preview');
      if (previewImage && previewImage.src) {
        console.log('✅ Found preview image:', previewImage.src);
        
        // Create new image and draw it
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          // Clear and redraw
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Draw garment template first
          const garmentImg = document.querySelector('.mockup-preview img');
          if (garmentImg) {
            ctx.drawImage(garmentImg, 0, 0, canvas.width, canvas.height);
          }
          
          // Calculate proper scale (FIT to canvas, not 21%)
          const maxWidth = canvas.width * 0.4; // 40% of canvas
          const maxHeight = canvas.height * 0.5; // 50% of canvas
          
          const scale = Math.min(
            maxWidth / img.width,
            maxHeight / img.height
          );
          
          const scaledWidth = img.width * scale;
          const scaledHeight = img.height * scale;
          
          // Center the design
          const x = (canvas.width - scaledWidth) / 2;
          const y = (canvas.height - scaledHeight) / 2;
          
          // Draw the design
          ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
          
          console.log('✅ Canvas fixed! Design rendered at', Math.round(scale * 100) + '%');
        };
        img.src = previewImage.src;
      }
    }
  };
  
  // Check immediately
  setTimeout(checkAndFixCanvas, 100);
  
  // Check again after potential async loads
  setTimeout(checkAndFixCanvas, 500);
  setTimeout(checkAndFixCanvas, 1000);
  setTimeout(checkAndFixCanvas, 2000);
}

// Auto-run when imported
if (typeof window !== 'undefined') {
  window.immediateCanvasFix = immediateCanvasFix;
  
  // Run on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', immediateCanvasFix);
  } else {
    immediateCanvasFix();
  }
  
  console.log('💡 Canvas fix loaded! If canvas is blank, run: immediateCanvasFix()');
}

export default immediateCanvasFix;