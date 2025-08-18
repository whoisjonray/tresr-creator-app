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
    // Map to actual Cloudinary URLs
    const colorMap = {
      'Black': 'black',
      'White': 'white',
      'Navy': 'navy',
      'Natural': 'natural'
    };
    
    const mappedColor = colorMap[color] || 'black';
    const baseUrl = 'https://res.cloudinary.com/dqslerzk9/image/upload/v1735351972/tresr-garments';
    
    // Build URL based on product
    const productMap = {
      'tee': `unisex_tee_${mappedColor}`,
      'hoodie': `unisex_hoodie_${mappedColor}`,
      'baby-tee': `baby_tee_${mappedColor}`,
      'boxy': `boxy_tee_${mappedColor}`
    };
    
    const filename = productMap[productId] || productMap['tee'];
    return `${baseUrl}/${filename}.png`;
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