/**
 * CRITICAL FIX: Canvas Rendering and Image Loading
 * 
 * This file contains the complete fixes for:
 * 1. Canvas not loading design images
 * 2. Broken scale calculations
 * 3. Image loading sequence issues
 * 4. useEffect dependency problems
 */

// ==================== CANVAS IMAGE LOADING FIX ====================

/**
 * Fixed image loading with proper callbacks and scale calculation
 * @param {string} imageUrl - Image URL to load
 * @param {Function} onLoad - Callback when image loads successfully
 * @param {Function} onError - Callback when image fails to load
 * @param {Function} setScale - Scale setter function
 * @param {number} canvasWidth - Canvas width for auto-scale calculation
 * @param {number} canvasHeight - Canvas height for auto-scale calculation
 * @returns {HTMLImageElement} The image element
 */
export const loadDesignImageFixed = (imageUrl, onLoad, onError, setScale, canvasWidth = 400, canvasHeight = 400) => {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  
  img.onload = () => {
    console.log(`✅ Design image loaded: ${img.width}x${img.height}`);
    
    // Calculate proper auto-scale AFTER image loads
    if (img.width > 200 || img.height > 200) {
      const scaleX = (canvasWidth * 0.8) / img.width;
      const scaleY = (canvasHeight * 0.8) / img.height;
      const autoScale = Math.min(scaleX, scaleY) * 100;
      const clampedScale = Math.max(10, Math.min(200, autoScale));
      
      console.log(`🎯 Auto-scaling ${img.width}x${img.height} to ${clampedScale.toFixed(1)}%`);
      setScale(clampedScale);
    } else {
      setScale(100);
    }
    
    onLoad(img);
  };
  
  img.onerror = (error) => {
    console.error('❌ Failed to load design image:', imageUrl, error);
    onError(error);
  };
  
  img.src = imageUrl;
  return img;
};

// ==================== CANVAS DRAW FUNCTION FIX ====================

/**
 * Fixed canvas drawing function with proper image handling
 * @param {Object} params - Drawing parameters
 */
export const drawCanvasFix = ({
  canvasRef,
  designImageRef,
  garmentImageRef,
  designScale,
  activeProduct,
  productConfigs,
  viewSide,
  showBoundingBox,
  showCenterLines,
  isZoomed,
  zoomFactor,
  isDragging
}) => {
  if (!canvasRef.current) {
    console.warn('Canvas ref not available');
    return;
  }

  const canvas = canvasRef.current;
  const ctx = canvas.getContext('2d');

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Set default background
  ctx.fillStyle = '#f5f5f5';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Save context for zoom
  ctx.save();

  if (isZoomed) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    ctx.translate(centerX, centerY);
    ctx.scale(zoomFactor, zoomFactor);
    ctx.translate(-centerX, -centerY);
  }

  // Draw garment image if available
  if (garmentImageRef.current) {
    try {
      ctx.drawImage(garmentImageRef.current, 0, 0, canvas.width, canvas.height);
      console.log('✅ Garment image drawn successfully');
    } catch (error) {
      console.error('❌ Failed to draw garment image:', error);
    }
  }

  // Draw design image if available - THIS IS THE CRITICAL FIX
  if (designImageRef.current) {
    try {
      const config = productConfigs[activeProduct];
      if (config) {
        // Get position based on view side
        const position = viewSide === 'front' ? config.frontPosition : config.backPosition;
        
        if (position) {
          // Calculate actual design dimensions with scale
          const scale = designScale / 100;
          const designWidth = designImageRef.current.width * scale;
          const designHeight = designImageRef.current.height * scale;
          
          // Position design (x,y are top-left coordinates)
          const x = position.x;
          const y = position.y;
          
          console.log(`🎨 Drawing design at ${x},${y} with scale ${designScale}% (${designWidth}x${designHeight})`);
          
          // Draw design image
          ctx.drawImage(
            designImageRef.current,
            x, y,
            designWidth, designHeight
          );
          
          console.log('✅ Design image drawn successfully on canvas');
          
          // Draw bounding box for debugging
          if (showBoundingBox) {
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, designWidth, designHeight);
          }
        } else {
          console.warn('⚠️ No position configured for', activeProduct, viewSide);
        }
      }
    } catch (error) {
      console.error('❌ Failed to draw design image:', error);
    }
  } else {
    console.warn('⚠️ No design image loaded in designImageRef.current');
  }

  // Draw print area boundaries
  if (showBoundingBox) {
    const config = productConfigs[activeProduct];
    if (config) {
      const printArea = getPrintAreaForProduct(activeProduct, viewSide);
      if (printArea) {
        ctx.strokeStyle = '#0066cc';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(printArea.x, printArea.y, printArea.width, printArea.height);
        ctx.setLineDash([]);
      }
    }
  }

  // Draw center guides
  if (showCenterLines) {
    ctx.strokeStyle = '#999999';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    
    // Vertical center line
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    
    // Horizontal center line
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
    
    ctx.setLineDash([]);
  }

  // Restore context
  ctx.restore();
};

// ==================== PRINT AREA DEFINITIONS ====================

const getPrintAreaForProduct = (productId, side) => {
  const printAreas = {
    'tee': {
      front: { x: 120, y: 80, width: 160, height: 200 },
      back: { x: 120, y: 80, width: 160, height: 200 }
    },
    'baby-tee': {
      front: { x: 130, y: 90, width: 140, height: 180 },
      back: { x: 130, y: 90, width: 140, height: 180 }
    },
    'wmn-hoodie': {
      front: { x: 110, y: 100, width: 180, height: 220 },
      back: { x: 110, y: 100, width: 180, height: 220 }
    }
  };
  
  return printAreas[productId]?.[side] || { x: 100, y: 80, width: 200, height: 240 };
};

// ==================== USEEFFECT HOOKS FIXES ====================

/**
 * Fixed useEffect hook for design image loading
 * This replaces the broken useEffect in DesignEditor.jsx
 */
export const useDesignImageLoader = (
  designUrl,
  designImageRef,
  setDesignScale,
  drawCanvas,
  canvasWidth = 400,
  canvasHeight = 400
) => {
  React.useEffect(() => {
    console.log('🔄 Design URL changed:', designUrl ? 'present' : 'missing');
    
    if (!designUrl) {
      designImageRef.current = null;
      drawCanvas();
      return;
    }

    // Load the design image with proper error handling
    const img = loadDesignImageFixed(
      designUrl,
      (loadedImg) => {
        designImageRef.current = loadedImg;
        console.log('✅ Design image loaded and stored in ref');
        drawCanvas(); // Redraw canvas with new image
      },
      (error) => {
        console.error('❌ Design image load failed:', error);
        designImageRef.current = null;
        drawCanvas(); // Still redraw to clear old image
      },
      setDesignScale,
      canvasWidth,
      canvasHeight
    );

    // Cleanup function
    return () => {
      if (img && img.src) {
        img.src = ''; // Cancel loading if component unmounts
      }
    };
  }, [designUrl, drawCanvas]); // CRITICAL: Only depend on designUrl, not designImageRef
};

/**
 * Fixed useEffect for canvas redrawing
 * This replaces the broken drawCanvas useEffect
 */
export const useCanvasRedrawEffect = (
  drawCanvas,
  dependencies
) => {
  React.useEffect(() => {
    console.log('🎨 Canvas redraw triggered by dependency change');
    drawCanvas();
  }, dependencies);
};

// ==================== INTEGRATION HELPERS ====================

/**
 * Complete fix for the DesignEditor canvas rendering
 * Use this to replace the broken canvas logic
 */
export const integrateCanvasFixes = (DesignEditorComponent) => {
  // This would be used to patch the existing component
  // Instructions for integration:
  
  return {
    replacements: {
      // Replace the existing drawCanvas function with drawCanvasFix
      drawCanvas: drawCanvasFix,
      
      // Replace the design image loading useEffect
      designImageEffect: useDesignImageLoader,
      
      // Replace the canvas redraw useEffect
      canvasRedrawEffect: useCanvasRedrawEffect
    },
    
    instructions: [
      '1. Replace drawCanvas function with drawCanvasFix',
      '2. Update useEffect for design image loading',
      '3. Add designUrl to useEffect dependencies',
      '4. Remove designImageRef from dependencies (causes infinite loops)',
      '5. Use loadDesignImageFixed for all image loading',
      '6. Ensure proper scale calculation after image load'
    ]
  };
};

// ==================== DEBUG UTILITIES ====================

export const debugCanvasState = (canvasRef, designImageRef, garmentImageRef, designScale) => {
  console.log('🔍 Canvas Debug State:', {
    canvas: {
      available: !!canvasRef.current,
      dimensions: canvasRef.current ? `${canvasRef.current.width}x${canvasRef.current.height}` : 'N/A'
    },
    designImage: {
      loaded: !!designImageRef.current,
      dimensions: designImageRef.current ? `${designImageRef.current.width}x${designImageRef.current.height}` : 'N/A',
      src: designImageRef.current?.src || 'N/A'
    },
    garmentImage: {
      loaded: !!garmentImageRef.current,
      dimensions: garmentImageRef.current ? `${garmentImageRef.current.width}x${garmentImageRef.current.height}` : 'N/A'
    },
    scale: {
      current: designScale,
      valid: typeof designScale === 'number' && designScale >= 10 && designScale <= 500
    }
  });
};

export default {
  loadDesignImageFixed,
  drawCanvasFix,
  useDesignImageLoader,
  useCanvasRedrawEffect,
  integrateCanvasFixes,
  debugCanvasState
};