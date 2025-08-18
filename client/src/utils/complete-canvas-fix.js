// COMPLETE CANVAS FIX - Single source of truth for canvas rendering
// This replaces all the broken fixes with one working solution

export class CanvasManager {
  constructor(canvas, productTemplates) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.productTemplates = productTemplates;
    
    // State
    this.garmentImage = null;
    this.designImage = null;
    this.scale = 100; // 100 = actual size
    this.position = { x: 0, y: 0 };
    this.activeProduct = 'tee';
    this.activeColor = 'Black';
    
    // Cache images
    this.imageCache = new Map();
  }
  
  // Load and cache garment image
  async loadGarmentImage(productId, color) {
    const cacheKey = `${productId}_${color}`;
    
    if (this.imageCache.has(cacheKey)) {
      this.garmentImage = this.imageCache.get(cacheKey);
      return this.garmentImage;
    }
    
    // Get garment URL from Cloudinary
    const garmentUrl = this.getGarmentUrl(productId, color);
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        this.imageCache.set(cacheKey, img);
        this.garmentImage = img;
        resolve(img);
      };
      
      img.onerror = () => {
        console.error('Failed to load garment:', garmentUrl);
        reject(new Error('Failed to load garment'));
      };
      
      img.src = garmentUrl;
    });
  }
  
  // Load design image
  async loadDesignImage(url) {
    if (!url) return null;
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        this.designImage = img;
        
        // Auto-calculate initial scale to fit print area
        const printArea = this.getPrintArea();
        const scaleX = printArea.width / img.width;
        const scaleY = printArea.height / img.height;
        this.scale = Math.min(scaleX, scaleY) * 100; // Convert to percentage
        
        console.log('Design loaded:', img.width, 'x', img.height, 'Scale:', this.scale + '%');
        resolve(img);
      };
      
      img.onerror = () => {
        console.error('Failed to load design:', url);
        reject(new Error('Failed to load design'));
      };
      
      img.src = url;
    });
  }
  
  // Get print area for current product
  getPrintArea() {
    // These are the ACTUAL print areas based on the canvas size (600x600)
    const printAreas = {
      'tee': { x: 160, y: 120, width: 280, height: 350 },
      'hoodie': { x: 160, y: 140, width: 280, height: 320 },
      'baby-tee': { x: 180, y: 100, width: 240, height: 300 },
      'boxy': { x: 150, y: 120, width: 300, height: 350 }
    };
    
    return printAreas[this.activeProduct] || printAreas['tee'];
  }
  
  // Get garment image URL
  getGarmentUrl(productId, color) {
    // Import the actual working URLs from garmentImagesCloudinary
    const GARMENT_URLS = {
      'tee': {
        'Black': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752270681/garments/tee/front/black.png',
        'White': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752270687/garments/tee/front/white.png',
        'Navy': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752270682/garments/tee/front/navy.png',
        'Natural': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752270685/garments/tee/front/natural.png',
        'Dark Grey': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752270684/garments/tee/front/heather-grey.png',
        'Cardinal Red': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752270681/garments/tee/front/black.png' // Use black as fallback
      },
      'boxy': {
        'Black': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752270733/garments/boxy/front/black.png',
        'Natural': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752270732/garments/boxy/front/bone.png'
      },
      'next-crop': {
        'Black': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752270729/garments/next-crop/front/black.png',
        'White': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752270736/garments/next-crop/front/white.png',
        'Gold': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752270731/garments/next-crop/front/gold.png',
        'Pink': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752270733/garments/next-crop/front/desert-pink.png',
        'Navy': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752270732/garments/next-crop/front/midnight-navy.png'
      },
      'baby-tee': {
        'Black': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752270738/garments/baby-tee/front/black.png',
        'White': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752270740/garments/baby-tee/front/white.png'
      },
      'wmn-hoodie': {
        'Black': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752270708/garments/wmn-hoodie/front/black.png',
        'Black Camo': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752270710/garments/wmn-hoodie/front/black-camo.png',
        'Pink': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752270711/garments/wmn-hoodie/front/pink.png',
        'Natural': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752270712/garments/wmn-hoodie/front/bone.png',
        'Cotton Candy': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752270713/garments/wmn-hoodie/front/cotton-candy.png',
        'White': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752270726/garments/wmn-hoodie/back/white.jpg',
        'Light Grey': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752270724/garments/wmn-hoodie/back/gray-heather.jpg',
        'Mint': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752270725/garments/wmn-hoodie/back/sage.jpg'
      },
      'med-hood': {
        'Black': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752270742/garments/med-hood/front/black.png',
        'White': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752270749/garments/med-hood/front/white.png',
        'Gold': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752270745/garments/med-hood/front/antique-gold.png',
        'Light Grey': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752270746/garments/med-hood/front/gray-heather.png',
        'Cardinal Red': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752270744/garments/med-hood/front/cardinal-red.png',
        'Alpine Green': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752270747/garments/med-hood/front/sage.png',
        'Navy': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752270742/garments/med-hood/front/black.png', // Use black as fallback
        'Mint': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752270747/garments/med-hood/front/sage.png'
      },
      'mediu': {
        'Black': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752270754/garments/mediu/front/black.png',
        'White': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752270761/garments/mediu/front/white.png',
        'Navy': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752270760/garments/mediu/front/classic-navy.png',
        'Light Grey': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752270756/garments/mediu/front/gray.png'
      },
      'sweat': {
        'Black': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752270762/garments/sweat/front/black.png'
      },
      'patch-c': {
        'Black': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752270703/garments/patch-c/front/black.png',
        'Navy': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752270705/garments/patch-c/front/gray.png'
      },
      'patch-flat': {
        'Black': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752270703/garments/patch-c/front/black.png',
        'Navy': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752270705/garments/patch-c/front/gray.png'
      },
      'polo': {
        'Black': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752270764/garments/polo/front/black.png',
        'White': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752270765/garments/polo/front/white.png',
        'Navy': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752270764/garments/polo/front/black.png',
        'Light Grey': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752270765/garments/polo/front/white.png'
      }
    };
    
    // Get URL for product and color, with fallbacks
    const productUrls = GARMENT_URLS[productId] || GARMENT_URLS['tee'];
    const url = productUrls[color] || productUrls['Black'] || productUrls[Object.keys(productUrls)[0]];
    
    // If still no URL, use a default tee black
    return url || 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752270681/garments/tee/front/black.png';
  }
  
  // Main render function
  render() {
    if (!this.canvas) return;
    
    const ctx = this.ctx;
    const canvas = this.canvas;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw garment if loaded
    if (this.garmentImage) {
      ctx.drawImage(this.garmentImage, 0, 0, canvas.width, canvas.height);
    }
    
    // Draw print area guides
    const printArea = this.getPrintArea();
    ctx.strokeStyle = '#0066cc';
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 2;
    ctx.strokeRect(printArea.x, printArea.y, printArea.width, printArea.height);
    ctx.setLineDash([]);
    
    // Draw design if loaded
    if (this.designImage) {
      const scale = this.scale / 100; // Convert percentage to decimal
      const width = this.designImage.width * scale;
      const height = this.designImage.height * scale;
      
      // Center in print area by default
      const x = printArea.x + (printArea.width - width) / 2 + this.position.x;
      const y = printArea.y + (printArea.height - height) / 2 + this.position.y;
      
      // Save context for clipping
      ctx.save();
      
      // Clip to print area
      ctx.beginPath();
      ctx.rect(printArea.x, printArea.y, printArea.width, printArea.height);
      ctx.clip();
      
      // Draw design
      ctx.drawImage(this.designImage, x, y, width, height);
      
      // Restore context
      ctx.restore();
    }
  }
  
  // Update scale
  setScale(newScale) {
    this.scale = Math.max(10, Math.min(500, newScale)); // Clamp 10-500%
    this.render();
  }
  
  // Update position
  setPosition(x, y) {
    this.position = { x, y };
    this.render();
  }
  
  // Switch product
  async switchProduct(productId, color) {
    this.activeProduct = productId;
    this.activeColor = color;
    await this.loadGarmentImage(productId, color);
    this.render();
  }
  
  // Full refresh
  async refresh(designUrl, productId, color) {
    try {
      // Load both images
      await Promise.all([
        this.loadGarmentImage(productId || this.activeProduct, color || this.activeColor),
        designUrl ? this.loadDesignImage(designUrl) : Promise.resolve()
      ]);
      
      // Render
      this.render();
      
      return true;
    } catch (error) {
      console.error('Canvas refresh failed:', error);
      return false;
    }
  }
}

// Global instance
let canvasManager = null;

// Initialize and fix the canvas
export async function completeCanvasFix() {
  console.log('🎯 COMPLETE CANVAS FIX - Starting...');
  
  // Find canvas
  const canvas = document.querySelector('canvas');
  if (!canvas) {
    console.error('No canvas found');
    return false;
  }
  
  // Find design image URL
  const previewImg = document.querySelector('.design-preview');
  const designUrl = previewImg?.src;
  
  if (!designUrl) {
    console.error('No design image found');
    return false;
  }
  
  // Get product templates (simplified)
  const templates = [
    { id: 'tee', name: 'T-Shirt' },
    { id: 'hoodie', name: 'Hoodie' },
    { id: 'baby-tee', name: 'Baby Tee' },
    { id: 'boxy', name: 'Boxy Tee' }
  ];
  
  // Create or update manager
  if (!canvasManager) {
    canvasManager = new CanvasManager(canvas, templates);
    window.canvasManager = canvasManager; // Make available globally
  }
  
  // Get current product (default to tee)
  const activeProduct = document.querySelector('.product-item.active')?.dataset?.productId || 'tee';
  const activeColor = document.querySelector('.color-swatch.active')?.dataset?.color || 'Black';
  
  // Refresh with current state
  const success = await canvasManager.refresh(designUrl, activeProduct, activeColor);
  
  if (success) {
    console.log('✅ Canvas fixed successfully!');
    
    // Hook up scale slider
    const slider = document.querySelector('input[type="range"]');
    if (slider) {
      slider.min = 10;
      slider.max = 500;
      slider.value = Math.round(canvasManager.scale);
      
      slider.oninput = () => {
        canvasManager.setScale(parseInt(slider.value));
        const textInput = document.querySelector('input[type="text"][value*="%"]') ||
                         document.querySelector('input[type="text"][value*="21"]');
        if (textInput) {
          textInput.value = slider.value;
        }
      };
    }
    
    // Fix scale display
    const scaleText = document.querySelector('input[type="text"][value*="21"]');
    if (scaleText) {
      scaleText.value = Math.round(canvasManager.scale);
    }
    
    // Enable dragging
    let isDragging = false;
    let dragStart = { x: 0, y: 0 };
    let originalPosition = { x: 0, y: 0 };
    
    canvas.style.cursor = 'move';
    
    canvas.onmousedown = (e) => {
      isDragging = true;
      const rect = canvas.getBoundingClientRect();
      dragStart = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
      originalPosition = { ...canvasManager.position };
    };
    
    canvas.onmousemove = (e) => {
      if (!isDragging) return;
      const rect = canvas.getBoundingClientRect();
      const dx = (e.clientX - rect.left) - dragStart.x;
      const dy = (e.clientY - rect.top) - dragStart.y;
      
      canvasManager.setPosition(
        originalPosition.x + dx,
        originalPosition.y + dy
      );
    };
    
    canvas.onmouseup = () => {
      isDragging = false;
    };
    
    // Hook up product switching
    document.querySelectorAll('.product-item').forEach(item => {
      item.onclick = () => {
        const productId = item.dataset?.productId || 'tee';
        canvasManager.switchProduct(productId, canvasManager.activeColor);
      };
    });
    
    // Hook up color switching
    document.querySelectorAll('.color-swatch').forEach(swatch => {
      swatch.onclick = () => {
        const color = swatch.dataset?.color || 'Black';
        canvasManager.switchProduct(canvasManager.activeProduct, color);
      };
    });
    
  } else {
    console.error('❌ Canvas fix failed');
  }
  
  return success;
}

// Auto-run when imported
if (typeof window !== 'undefined') {
  window.completeCanvasFix = completeCanvasFix;
  
  // Try to fix on load
  if (document.readyState === 'complete') {
    setTimeout(completeCanvasFix, 1000);
  } else {
    window.addEventListener('load', () => {
      setTimeout(completeCanvasFix, 1000);
    });
  }
  
  console.log('💊 Complete canvas fix loaded. Run: completeCanvasFix()');
}

export default completeCanvasFix;