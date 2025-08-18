// Fix for canvas issues when switching products and using alignment tools

export function fixCanvasProductSwitching() {
  console.log('🔧 Fixing canvas product switching issues...');
  
  // Get the current active product
  const activeProductElement = document.querySelector('.product-item.active');
  if (!activeProductElement) {
    console.warn('No active product found');
    return;
  }
  
  const activeProductId = activeProductElement.dataset.productId || 
                          activeProductElement.textContent.toLowerCase().replace(/\s+/g, '-');
  
  console.log('Active product:', activeProductId);
  
  // Ensure the canvas uses the correct garment image
  const canvas = document.querySelector('canvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  
  // Get the correct garment image based on active product
  const garmentImg = document.querySelector('.mockup-preview img');
  const designImg = document.querySelector('.design-preview');
  
  if (!garmentImg || !designImg) {
    console.error('Missing images');
    return;
  }
  
  // Make sure we're using the right garment URL
  const correctGarmentUrl = getCorrectGarmentUrl(activeProductId);
  if (correctGarmentUrl && garmentImg.src !== correctGarmentUrl) {
    console.log('Updating garment image to:', correctGarmentUrl);
    garmentImg.src = correctGarmentUrl;
  }
  
  // Re-render the canvas with correct garment
  renderCanvasWithProduct(ctx, canvas, garmentImg, designImg, activeProductId);
}

function getCorrectGarmentUrl(productId) {
  // Map of product IDs to their Cloudinary URLs
  const GARMENT_URLS = {
    'tee': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752270681/garments/tee/front/black.png',
    'medium-weight-t-shirt': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752270681/garments/tee/front/black.png',
    'boxy': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752270681/garments/boxy/front/black.png',
    'oversized-drop-shoulder': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752270681/garments/boxy/front/black.png',
    'next-crop': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752270680/garments/next-crop/front/black.png',
    'next-level-crop-top': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752270680/garments/next-crop/front/black.png',
    'wmn-hoodie': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752270687/garments/wmn-hoodie/front/black.png',
    'womens-independent-hoodie': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752270687/garments/wmn-hoodie/front/black.png',
    'med-hood': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752270680/garments/med-hood/front/black.png',
    'medium-weight-hoodie': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752270680/garments/med-hood/front/black.png',
    'mediu': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752270680/garments/mediu/front/black.png',
    'medium-weight-sweatshirt': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752270680/garments/mediu/front/black.png',
    'polo': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752270681/garments/polo/front/black.png',
    'standard-polo': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752270681/garments/polo/front/black.png'
  };
  
  // Try direct match first
  if (GARMENT_URLS[productId]) {
    return GARMENT_URLS[productId];
  }
  
  // Try lowercase with dashes
  const normalized = productId.toLowerCase().replace(/\s+/g, '-');
  return GARMENT_URLS[normalized] || GARMENT_URLS['tee']; // Default to tee
}

function renderCanvasWithProduct(ctx, canvas, garmentImg, designImg, productId) {
  // Get the correct print area for this product
  const printArea = getCorrectPrintArea(productId);
  
  // Clear and redraw
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#f8f9fa';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw garment
  const garment = new Image();
  garment.crossOrigin = 'anonymous';
  garment.onload = () => {
    ctx.drawImage(garment, 0, 0, canvas.width, canvas.height);
    
    // Draw design with correct print area
    if (designImg && designImg.src) {
      const design = new Image();
      design.crossOrigin = 'anonymous';
      design.onload = () => {
        // Use the saved position if available
        const savedPosition = getSavedPosition(productId);
        const scale = savedPosition?.scale || calculateFitScale(design, printArea);
        
        const designWidth = design.width * scale;
        const designHeight = design.height * scale;
        const designX = savedPosition?.x || (printArea.x + (printArea.width - designWidth) / 2);
        const designY = savedPosition?.y || (printArea.y + (printArea.height - designHeight) / 2);
        
        // Draw print area bounds
        ctx.strokeStyle = '#0066cc';
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 2;
        ctx.strokeRect(printArea.x, printArea.y, printArea.width, printArea.height);
        ctx.setLineDash([]);
        
        // Clip to print area
        ctx.save();
        ctx.beginPath();
        ctx.rect(printArea.x, printArea.y, printArea.width, printArea.height);
        ctx.clip();
        
        // Draw design
        ctx.drawImage(design, designX, designY, designWidth, designHeight);
        ctx.restore();
      };
      design.src = designImg.src;
    }
  };
  garment.src = garmentImg.src;
}

function getCorrectPrintArea(productId) {
  // These should match what was set in /test/bounding-box
  const PRINT_AREAS = {
    'tee': { width: 280, height: 350, x: 160, y: 125 },
    'medium-weight-t-shirt': { width: 280, height: 350, x: 160, y: 125 },
    'boxy': { width: 300, height: 350, x: 150, y: 125 },
    'oversized-drop-shoulder': { width: 300, height: 350, x: 150, y: 125 },
    'next-crop': { width: 250, height: 250, x: 175, y: 175 },
    'next-level-crop-top': { width: 250, height: 250, x: 175, y: 175 },
    'wmn-hoodie': { width: 280, height: 340, x: 160, y: 80 },
    'womens-independent-hoodie': { width: 280, height: 340, x: 160, y: 80 },
    'med-hood': { width: 280, height: 340, x: 160, y: 130 },
    'medium-weight-hoodie': { width: 280, height: 340, x: 160, y: 130 },
    'mediu': { width: 280, height: 350, x: 160, y: 125 },
    'medium-weight-sweatshirt': { width: 280, height: 350, x: 160, y: 125 },
    'polo': { width: 200, height: 250, x: 200, y: 100 },
    'standard-polo': { width: 200, height: 250, x: 200, y: 100 }
  };
  
  const normalized = productId.toLowerCase().replace(/\s+/g, '-');
  return PRINT_AREAS[normalized] || PRINT_AREAS['tee'];
}

function calculateFitScale(image, printArea) {
  const scaleX = printArea.width / image.width;
  const scaleY = printArea.height / image.height;
  return Math.min(scaleX, scaleY);
}

function getSavedPosition(productId) {
  // Try to get saved position from somewhere (localStorage, state, etc.)
  try {
    const saved = localStorage.getItem(`design_position_${productId}`);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

// Fix alignment buttons to use correct print areas
export function fixAlignmentButtons() {
  const alignTopBtn = document.querySelector('.tool-btn.align-top');
  const alignCenterBtn = document.querySelector('.tool-btn.align-center');
  
  if (alignTopBtn) {
    alignTopBtn.onclick = () => {
      const activeProductElement = document.querySelector('.product-item.active');
      const productId = activeProductElement?.dataset.productId || 'tee';
      const printArea = getCorrectPrintArea(productId);
      
      // Move design to top of print area
      const designImg = document.querySelector('.design-preview');
      if (designImg) {
        const design = new Image();
        design.onload = () => {
          const scale = calculateFitScale(design, printArea);
          const designWidth = design.width * scale;
          const designX = printArea.x + (printArea.width - designWidth) / 2;
          const designY = printArea.y; // Top of print area
          
          // Save position
          localStorage.setItem(`design_position_${productId}`, JSON.stringify({
            x: designX,
            y: designY,
            scale: scale
          }));
          
          // Re-render
          fixCanvasProductSwitching();
        };
        design.src = designImg.src;
      }
    };
  }
  
  if (alignCenterBtn) {
    alignCenterBtn.onclick = () => {
      const activeProductElement = document.querySelector('.product-item.active');
      const productId = activeProductElement?.dataset.productId || 'tee';
      const printArea = getCorrectPrintArea(productId);
      
      // Center design in print area
      const designImg = document.querySelector('.design-preview');
      if (designImg) {
        const design = new Image();
        design.onload = () => {
          const scale = calculateFitScale(design, printArea);
          const designWidth = design.width * scale;
          const designHeight = design.height * scale;
          const designX = printArea.x + (printArea.width - designWidth) / 2;
          const designY = printArea.y + (printArea.height - designHeight) / 2;
          
          // Save position
          localStorage.setItem(`design_position_${productId}`, JSON.stringify({
            x: designX,
            y: designY,
            scale: scale
          }));
          
          // Re-render
          fixCanvasProductSwitching();
        };
        design.src = designImg.src;
      }
    };
  }
}

// Auto-fix when product changes
export function watchProductChanges() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        const target = mutation.target;
        if (target.classList.contains('product-item') && target.classList.contains('active')) {
          console.log('Product changed, fixing canvas...');
          setTimeout(() => {
            fixCanvasProductSwitching();
            fixAlignmentButtons();
          }, 100);
        }
      }
    });
  });
  
  // Watch all product items for class changes
  document.querySelectorAll('.product-item').forEach(item => {
    observer.observe(item, { attributes: true });
  });
}

// Initialize fixes
if (typeof window !== 'undefined') {
  window.fixCanvasProductSwitching = fixCanvasProductSwitching;
  window.fixAlignmentButtons = fixAlignmentButtons;
  window.watchProductChanges = watchProductChanges;
  
  // Auto-initialize when DOM is ready
  if (document.readyState === 'complete') {
    setTimeout(() => {
      watchProductChanges();
      fixAlignmentButtons();
    }, 1000);
  } else {
    window.addEventListener('load', () => {
      setTimeout(() => {
        watchProductChanges();
        fixAlignmentButtons();
      }, 1000);
    });
  }
}

export default fixCanvasProductSwitching;