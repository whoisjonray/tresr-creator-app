// Real image generation service using HTML5 Canvas (zero-cost approach)
// Uses actual Cloudinary garment images for each color variation
import { getGarmentImage } from '../config/garmentImagesCloudinary';

class CanvasImageGenerator {
  constructor() {
    this.garmentImageCache = new Map();
    this.colorFilters = {
      // Pre-calculated CSS filter values for accurate color transformation
      'Black': 'brightness(0.2) contrast(1.2) saturate(1.0)',
      'Dark Grey': 'brightness(0.4) contrast(1.1) saturate(0.9)',
      'Light Grey': 'brightness(0.7) contrast(0.9) saturate(0.8)',
      'Natural': 'brightness(0.95) saturate(0.6) sepia(0.3) hue-rotate(20deg)',
      'White': 'brightness(1.0) contrast(0.95) saturate(0.9)',
      'Navy': 'hue-rotate(220deg) saturate(1.8) brightness(0.3) contrast(1.2)',
      'Cardinal Red': 'hue-rotate(350deg) saturate(2.0) brightness(0.6) contrast(1.1)',
      'Gold': 'hue-rotate(45deg) saturate(1.8) brightness(0.8) contrast(1.0)',
      'Alpine Green': 'hue-rotate(120deg) saturate(1.5) brightness(0.4) contrast(1.1)',
      'Royal Heather': 'hue-rotate(210deg) saturate(2.0) brightness(0.5) contrast(1.0)',
      'Pink': 'hue-rotate(320deg) saturate(1.2) brightness(0.8) contrast(0.9)',
      'Cotton Candy': 'hue-rotate(320deg) saturate(0.8) brightness(0.9) contrast(0.8)',
      'Mint': 'hue-rotate(120deg) saturate(0.7) brightness(0.9) contrast(0.9)'
    };
  }

  // Generate real composite image of design on garment
  async generateProductImage(designImageSrc, garmentTemplate, color, position, scale = 1.0) {
    try {
      console.log('🎨 REAL IMAGE GENERATION STARTED:', { 
        garmentTemplate, 
        color, 
        position, 
        scale,
        designSrc: designImageSrc ? 'present' : 'missing'
      });
      
      // Create high-resolution canvas matching Shopify's recommended size
      const canvas = document.createElement('canvas');
      canvas.width = 2000; // Shopify recommended product image size
      canvas.height = 2000; // Square format for consistency
      const ctx = canvas.getContext('2d');

      // Load actual garment image from Cloudinary
      console.log(`🔍 Loading garment: ${garmentTemplate} in ${color}...`);
      const garmentImage = await this.loadGarmentImage(garmentTemplate, color, 'front');
      
      // Draw garment as background
      console.log('🖼️ Drawing garment background on canvas...');
      ctx.drawImage(garmentImage, 0, 0, canvas.width, canvas.height);

      // Load and composite design image
      if (designImageSrc) {
        console.log('🎨 Loading design image...');
        const designImage = await this.loadImage(designImageSrc);
        
        // Calculate design placement on high-res canvas
        const scaledPosition = this.scalePositionToCanvas(position, canvas.width, canvas.height);
        // Scale design appropriately for 2000x2000 canvas (was 0.4 for 800px, now 1.0 for 2000px)
        const designWidth = designImage.width * scale * 1.0; 
        const designHeight = designImage.height * scale * 1.0;
        
        // Center the design at the specified position
        const x = scaledPosition.x - (designWidth / 2);
        const y = scaledPosition.y - (designHeight / 2);
        
        console.log(`📐 Design placement:`, {
          originalSize: { width: designImage.width, height: designImage.height },
          scaledSize: { width: designWidth, height: designHeight },
          position: { x, y },
          scale
        });
        
        // Draw design on garment
        ctx.drawImage(designImage, x, y, designWidth, designHeight);
      }

      // Convert to high-quality JPEG for optimal file size (PNG for transparency if needed)
      // Using JPEG as recommended by Shopify for photographs
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92); // High quality JPEG
      const imageSizeKB = Math.round(dataUrl.length * 0.75 / 1024); // Rough estimate
      
      console.log(`✅ REAL PRODUCT IMAGE GENERATED SUCCESSFULLY:`, {
        garmentTemplate,
        color,
        size: `${canvas.width}x${canvas.height}`,
        format: 'JPEG',
        quality: '92%',
        imageSizeKB: `${imageSizeKB}KB`,
        shopifyReady: true
      });
      
      return {
        url: dataUrl,
        templateId: garmentTemplate,
        color: color,
        width: canvas.width,
        height: canvas.height,
        generatedAt: Date.now(),
        real: true, // Flag to indicate this is a real image, not placeholder
        imageSizeKB: imageSizeKB
      };

    } catch (error) {
      console.error('❌ REAL IMAGE GENERATION FAILED:', error);
      
      // Return fallback SVG as last resort
      return this.generateFallbackImage(garmentTemplate, color);
    }
  }

  // Load actual garment image from Cloudinary for specific color
  async loadGarmentImage(templateId, color, side = 'front') {
    const cacheKey = `${templateId}-${color}-${side}`;
    
    if (this.garmentImageCache.has(cacheKey)) {
      console.log(`🎯 Using cached garment image: ${templateId} in ${color} (${side})`);
      return this.garmentImageCache.get(cacheKey);
    }

    try {
      // Map templateId to garment type for Cloudinary lookup
      const garmentType = this.mapTemplateToGarmentType(templateId);
      
      // Map display color name to Cloudinary slug
      const cloudinaryColor = this.mapColorToCloudinarySlug(color);
      
      // Get actual Cloudinary image URL for this garment type, color, and side
      const imageUrl = getGarmentImage(garmentType, cloudinaryColor, side);
      
      console.log(`🎨 Loading real garment image: ${garmentType} in ${color} -> ${cloudinaryColor} (${side})`, imageUrl);
      
      if (imageUrl) {
        // Load the actual garment image from Cloudinary
        const garmentImage = await this.loadImage(imageUrl);
        this.garmentImageCache.set(cacheKey, garmentImage);
        console.log(`✅ Loaded real garment image successfully: ${garmentType} in ${color}`);
        return garmentImage;
      } else {
        console.warn(`⚠️ No Cloudinary image found for ${garmentType} in ${color}, using procedural fallback`);
        // Fallback to procedural garment if no Cloudinary image
        const garmentImage = await this.createProceduralGarment(templateId, color);
        this.garmentImageCache.set(cacheKey, garmentImage);
        return garmentImage;
      }

    } catch (error) {
      console.error(`❌ Failed to load garment image for ${templateId} in ${color}:`, error);
      // Return procedural fallback on error
      return this.createProceduralGarment(templateId, color);
    }
  }

  // Map template ID to garment type for Cloudinary lookup
  mapTemplateToGarmentType(templateId) {
    const templateMap = {
      'tshirt_front': 'tee',
      'tshirt_back': 'tee',
      'tshirt_boxy_front': 'boxy',
      'hoodie_front': 'wmn-hoodie',
      'hoodie_back': 'wmn-hoodie',
      'crewneck_front': 'mediu',
      'croptop_front': 'next-crop',
      'hat_front': 'patch-c',
      'hat_flat': 'patch-flat',
      'canvas_square': 'art-sqsm', // Default to small, could be sqm or lg
      'polo_front': 'polo',
      'trading_card': 'nft'
    };
    
    return templateMap[templateId] || 'tee'; // Default to tee if not found
  }

  // Map display color names to Cloudinary slug names
  mapColorToCloudinarySlug(colorName) {
    const colorMap = {
      'Black': 'black',
      'White': 'white',
      'Navy': 'navy',
      'Light Grey': 'heather-grey',
      'Dark Grey': 'dark-heather-gray',
      'Natural': 'natural',
      'Cardinal Red': 'red',
      'Gold': 'gold',
      'Alpine Green': 'alpine-green',
      'Royal Heather': 'blue',
      'Pink': 'pink',
      'Cotton Candy': 'cotton-candy',
      'Mint': 'sage', // Cloudinary uses 'sage' for mint-like color
      'Army Heather': 'army-heather'
    };
    
    return colorMap[colorName] || colorName.toLowerCase().replace(/\s+/g, '-');
  }

  // Apply CSS filter to image using canvas
  async applyColorFilter(image, filterString) {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');

    // Apply filter and draw image
    ctx.filter = filterString;
    ctx.drawImage(image, 0, 0);
    ctx.filter = 'none'; // Reset filter

    // Convert back to image
    return new Promise((resolve) => {
      const transformedImage = new Image();
      transformedImage.onload = () => resolve(transformedImage);
      transformedImage.src = canvas.toDataURL();
    });
  }

  // Get garment image URL based on template
  getGarmentImageUrl(templateId) {
    // Map template IDs to actual garment image URLs
    const garmentImageMap = {
      'tshirt_front': '/images/garments/tshirt-front-white.png',
      'tshirt_back': '/images/garments/tshirt-back-white.png',
      'tshirt_boxy_front': '/images/garments/boxy-tee-front-white.png',
      'hoodie_front': '/images/garments/hoodie-front-white.png',
      'hoodie_back': '/images/garments/hoodie-back-white.png',
      'crewneck_front': '/images/garments/crewneck-front-white.png',
      'croptop_front': '/images/garments/croptop-front-white.png',
      'hat_front': '/images/garments/hat-front-white.png',
      'hat_flat': '/images/garments/hat-flat-white.png',
      'canvas_square': '/images/garments/canvas-square-white.png',
      'polo_front': '/images/garments/polo-front-white.png',
      'trading_card': '/images/garments/trading-card-white.png'
    };

    return garmentImageMap[templateId] || '/images/garments/default-product.png';
  }

  // Create procedural garment shape based on template
  async createProceduralGarment(templateId, color) {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');

    // Get color hex value
    const colorHex = this.getColorHex(color);
    
    // Set garment color
    ctx.fillStyle = colorHex;
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    
    // Create garment shape based on template
    switch (templateId) {
      case 'tshirt_front':
      case 'tshirt_boxy_front':
      case 'tshirt_back':
        this.drawTShirtShape(ctx);
        break;
      case 'hoodie_front':
      case 'hoodie_back':
        this.drawHoodieShape(ctx);
        break;
      case 'crewneck_front':
        this.drawCrewneckShape(ctx);
        break;
      case 'croptop_front':
        this.drawCropTopShape(ctx);
        break;
      case 'hat_front':
      case 'hat_flat':
        this.drawHatShape(ctx);
        break;
      case 'canvas_square':
        this.drawCanvasShape(ctx);
        break;
      case 'polo_front':
        this.drawPoloShape(ctx);
        break;
      case 'trading_card':
        this.drawTradingCardShape(ctx);
        break;
      default:
        this.drawTShirtShape(ctx); // Default to t-shirt
    }
    
    // Convert to image
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.src = canvas.toDataURL();
    });
  }

  // Draw t-shirt silhouette
  drawTShirtShape(ctx) {
    ctx.beginPath();
    ctx.moveTo(120, 100); // Left shoulder
    ctx.lineTo(80, 120);  // Left sleeve
    ctx.lineTo(80, 160);  // Left sleeve end
    ctx.lineTo(120, 180); // Left side
    ctx.lineTo(120, 350); // Left bottom
    ctx.lineTo(280, 350); // Right bottom
    ctx.lineTo(280, 180); // Right side
    ctx.lineTo(320, 160); // Right sleeve end
    ctx.lineTo(320, 120); // Right sleeve
    ctx.lineTo(280, 100); // Right shoulder
    ctx.lineTo(250, 80);  // Right neck
    ctx.lineTo(150, 80);  // Left neck
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Draw hoodie silhouette
  drawHoodieShape(ctx) {
    ctx.beginPath();
    ctx.moveTo(100, 90); // Left hood
    ctx.lineTo(80, 130);  // Left sleeve
    ctx.lineTo(80, 170);  // Left sleeve end
    ctx.lineTo(110, 190); // Left side
    ctx.lineTo(110, 360); // Left bottom
    ctx.lineTo(290, 360); // Right bottom
    ctx.lineTo(290, 190); // Right side
    ctx.lineTo(320, 170); // Right sleeve end
    ctx.lineTo(320, 130); // Right sleeve
    ctx.lineTo(300, 90);  // Right hood
    ctx.lineTo(270, 70);  // Right hood top
    ctx.lineTo(130, 70);  // Left hood top
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Draw crewneck silhouette
  drawCrewneckShape(ctx) {
    ctx.beginPath();
    ctx.moveTo(110, 110); // Left shoulder
    ctx.lineTo(70, 130);  // Left sleeve
    ctx.lineTo(70, 180);  // Left sleeve end
    ctx.lineTo(110, 200); // Left side
    ctx.lineTo(110, 350); // Left bottom
    ctx.lineTo(290, 350); // Right bottom
    ctx.lineTo(290, 200); // Right side
    ctx.lineTo(330, 180); // Right sleeve end
    ctx.lineTo(330, 130); // Right sleeve
    ctx.lineTo(290, 110); // Right shoulder
    ctx.lineTo(260, 90);  // Right neck
    ctx.lineTo(140, 90);  // Left neck
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Draw crop top silhouette
  drawCropTopShape(ctx) {
    ctx.beginPath();
    ctx.moveTo(120, 120); // Left shoulder
    ctx.lineTo(90, 140);  // Left sleeve
    ctx.lineTo(90, 170);  // Left sleeve end
    ctx.lineTo(120, 190); // Left side
    ctx.lineTo(120, 280); // Left bottom (shorter)
    ctx.lineTo(280, 280); // Right bottom
    ctx.lineTo(280, 190); // Right side
    ctx.lineTo(310, 170); // Right sleeve end
    ctx.lineTo(310, 140); // Right sleeve
    ctx.lineTo(280, 120); // Right shoulder
    ctx.lineTo(250, 100); // Right neck
    ctx.lineTo(150, 100); // Left neck
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Draw hat silhouette
  drawHatShape(ctx) {
    ctx.beginPath();
    // Bill
    ctx.ellipse(200, 200, 120, 80, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    
    // Crown
    ctx.beginPath();
    ctx.ellipse(200, 160, 80, 60, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
  }

  // Draw canvas shape
  drawCanvasShape(ctx) {
    ctx.beginPath();
    ctx.rect(50, 50, 300, 300);
    ctx.fill();
    ctx.stroke();
    
    // Add frame effect
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 10;
    ctx.strokeRect(45, 45, 310, 310);
  }

  // Draw polo silhouette
  drawPoloShape(ctx) {
    ctx.beginPath();
    ctx.moveTo(120, 100); // Left shoulder
    ctx.lineTo(90, 120);  // Left sleeve
    ctx.lineTo(90, 160);  // Left sleeve end
    ctx.lineTo(120, 180); // Left side
    ctx.lineTo(120, 350); // Left bottom
    ctx.lineTo(280, 350); // Right bottom
    ctx.lineTo(280, 180); // Right side
    ctx.lineTo(310, 160); // Right sleeve end
    ctx.lineTo(310, 120); // Right sleeve
    ctx.lineTo(280, 100); // Right shoulder
    ctx.lineTo(230, 80);  // Right collar
    ctx.lineTo(200, 120); // Collar point
    ctx.lineTo(170, 80);  // Left collar
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Draw trading card shape
  drawTradingCardShape(ctx) {
    ctx.beginPath();
    ctx.roundRect(80, 60, 240, 320, 10);
    ctx.fill();
    ctx.stroke();
    
    // Add border effect
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 4;
    ctx.strokeRect(85, 65, 230, 310);
  }

  // Create solid color garment fallback
  createSolidColorGarment(color) {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');

    // Get color hex value
    const colorHex = this.getColorHex(color);
    
    // Create simple garment silhouette
    ctx.fillStyle = colorHex;
    ctx.fillRect(50, 50, 300, 300);
    
    // Convert to image
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.src = canvas.toDataURL();
    });
  }

  // Get hex color for garment colors
  getColorHex(colorName) {
    const colorMap = {
      'Black': '#000000',
      'Dark Grey': '#4A4A4A',
      'Light Grey': '#9CA3AF',
      'Natural': '#FEF3C7',
      'White': '#FAFAFA',
      'Navy': '#080F20',
      'Cardinal Red': '#EC5039',
      'Gold': '#F6CB46',
      'Alpine Green': '#165B33',
      'Royal Heather': '#4169E1',
      'Pink': '#F82F57',
      'Cotton Candy': '#FFB6C1',
      'Mint': '#98FF98'
    };
    
    return colorMap[colorName] || '#CCCCCC';
  }

  // Utility: Load image with promise
  loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous'; // Enable CORS for canvas manipulation
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });
  }

  // Scale position from 400x400 canvas to actual canvas size
  scalePositionToCanvas(position, canvasWidth, canvasHeight) {
    return {
      x: (position.x / 400) * canvasWidth,
      y: (position.y / 400) * canvasHeight
    };
  }

  // Generate fallback SVG image
  generateFallbackImage(templateId, color) {
    const colorHex = this.getColorHex(color);
    const productName = (templateId || 'product').replace(/_/g, ' ');
    
    const svg = `
      <svg width="2000" height="2000" xmlns="http://www.w3.org/2000/svg">
        <rect width="2000" height="2000" fill="${colorHex}"/>
        <text x="50%" y="50%" text-anchor="middle" fill="${color === 'White' || color === 'Natural' ? '#333' : '#fff'}" 
              font-family="Arial" font-size="64" dy=".3em">
          ${productName}
        </text>
      </svg>
    `;
    
    const base64 = btoa(svg);
    return {
      url: `data:image/svg+xml;base64,${base64}`,
      templateId: templateId,
      color: color,
      fallback: true
    };
  }

  // Generate multiple variants for all colors
  async generateAllVariants(designImageSrc, garmentTemplate, colors, position, scale = 1.0) {
    console.log('🎨 Generating variants for all colors:', colors);
    
    const variants = [];
    
    for (const color of colors) {
      try {
        const variant = await this.generateProductImage(
          designImageSrc, 
          garmentTemplate, 
          color, 
          position, 
          scale
        );
        variants.push(variant);
      } catch (error) {
        console.error(`Failed to generate variant for ${color}:`, error);
        // Add fallback for failed variant
        variants.push(this.generateFallbackImage(garmentTemplate, color));
      }
    }
    
    return variants;
  }

  // Clear cache to free memory
  clearCache() {
    this.garmentImageCache.clear();
  }
}

// Export singleton instance
export default new CanvasImageGenerator();