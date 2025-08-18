/**
 * CRITICAL FIX: Scale Slider Implementation
 * 
 * This fixes the broken scale slider where:
 * 1. Images load too large initially
 * 2. Scale percentages are inverted
 * 3. Scale isn't properly applied to rendering
 * 4. Auto-scale calculation is wrong
 */

// ==================== SCALE CALCULATION UTILITIES ====================

/**
 * Calculate proper initial scale for an image to fit in canvas
 * @param {number} imageWidth - Original image width
 * @param {number} imageHeight - Original image height  
 * @param {number} canvasWidth - Canvas/container width (400px)
 * @param {number} canvasHeight - Canvas/container height (400px)
 * @param {number} maxFitPercent - Maximum percentage to fit (default 80%)
 * @returns {number} Scale percentage (e.g., 35 = 35%)
 */
export const calculateFitToCanvasScale = (imageWidth, imageHeight, canvasWidth = 400, canvasHeight = 400, maxFitPercent = 80) => {
  // Calculate scale needed to fit image in canvas
  const scaleX = (canvasWidth * (maxFitPercent / 100)) / imageWidth;
  const scaleY = (canvasHeight * (maxFitPercent / 100)) / imageHeight;
  
  // Use the smaller scale to ensure image fits completely
  const fitScale = Math.min(scaleX, scaleY);
  
  // Convert to percentage (100% = actual size)
  const scalePercent = fitScale * 100;
  
  // Clamp between reasonable bounds
  return Math.max(10, Math.min(200, scalePercent));
};

/**
 * Calculate display dimensions from original size and scale
 * @param {number} originalWidth - Original image width
 * @param {number} originalHeight - Original image height
 * @param {number} scalePercent - Scale percentage (100 = actual size)
 * @returns {Object} {width, height} display dimensions
 */
export const calculateScaledDimensions = (originalWidth, originalHeight, scalePercent) => {
  const scale = scalePercent / 100; // Convert percentage to decimal
  return {
    width: Math.round(originalWidth * scale),
    height: Math.round(originalHeight * scale)
  };
};

/**
 * Check if scale percentage is valid
 * @param {number} scale - Scale percentage
 * @returns {boolean} True if valid
 */
export const isValidScale = (scale) => {
  return typeof scale === 'number' && scale >= 10 && scale <= 500 && !isNaN(scale);
};

// ==================== POSITION CALCULATION WITH SCALE ====================

/**
 * Get position with properly applied scale
 * @param {Object} basePosition - Base position {x, y, width, height}
 * @param {number} scalePercent - Current scale percentage
 * @param {Object} originalImageSize - Original image dimensions {width, height}
 * @returns {Object} Position with scaled dimensions
 */
export const getScaledPosition = (basePosition, scalePercent, originalImageSize) => {
  if (!basePosition || !originalImageSize) {
    return { x: 200, y: 80, width: 150, height: 150 };
  }

  // Calculate scaled dimensions based on original image size
  const scaledDimensions = calculateScaledDimensions(
    originalImageSize.width, 
    originalImageSize.height, 
    scalePercent
  );

  return {
    x: basePosition.x,
    y: basePosition.y,
    width: scaledDimensions.width,
    height: scaledDimensions.height
  };
};

// ==================== CANVAS CLIPPING UTILITIES ====================

/**
 * Calculate visible portion of design within canvas bounds
 * @param {Object} position - Design position {x, y, width, height}
 * @param {Object} bounds - Canvas bounds {x, y, width, height}
 * @returns {Object|null} Clipped region or null if no intersection
 */
export const calculateVisibleRegion = (position, bounds) => {
  const left = Math.max(position.x, bounds.x);
  const top = Math.max(position.y, bounds.y);
  const right = Math.min(position.x + position.width, bounds.x + bounds.width);
  const bottom = Math.min(position.y + position.height, bounds.y + bounds.height);

  if (left >= right || top >= bottom) {
    return null; // No intersection
  }

  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
    sourceX: left - position.x,  // Offset in source image
    sourceY: top - position.y,   // Offset in source image
    sourceWidth: right - left,
    sourceHeight: bottom - top
  };
};

// ==================== INTEGRATION HELPERS ====================

/**
 * Fix for the handleScaleChange function
 * @param {Event} e - Input change event
 * @param {Function} setDesignScale - Scale setter function
 * @param {number} min - Minimum scale (default 10)
 * @param {number} max - Maximum scale (default 500)
 */
export const handleScaleChangeFix = (e, setDesignScale, min = 10, max = 500) => {
  const scale = parseInt(e.target.value);
  
  if (isValidScale(scale) && scale >= min && scale <= max) {
    setDesignScale(scale);
  } else {
    console.warn('Invalid scale value:', scale);
  }
};

/**
 * Fix for the auto-scale calculation when image loads
 * @param {HTMLImageElement} img - Loaded image element
 * @param {Function} setDesignScale - Scale setter function
 * @param {number} canvasWidth - Canvas width (default 400)
 * @param {number} canvasHeight - Canvas height (default 400)
 */
export const handleImageLoadAutoScale = (img, setDesignScale, canvasWidth = 400, canvasHeight = 400) => {
  // Only auto-scale if image is larger than a reasonable size
  if (img.width > 200 || img.height > 200) {
    const autoScale = calculateFitToCanvasScale(img.width, img.height, canvasWidth, canvasHeight);
    setDesignScale(autoScale);
    console.log(`🎯 Auto-scaling ${img.width}x${img.height} image to ${autoScale.toFixed(1)}%`);
  } else {
    // Small images can stay at 100%
    setDesignScale(100);
    console.log('🎯 Keeping small image at 100% scale');
  }
};

/**
 * Enhanced getCurrentPosition with scale support
 * @param {Object} productConfigs - Product configuration object
 * @param {string} activeProduct - Current active product ID
 * @param {string} viewSide - Current view side ('front' or 'back')
 * @param {number} designScale - Current scale percentage
 * @param {Object} originalImageSize - Original image dimensions
 * @returns {Object} Position with properly scaled dimensions
 */
export const getCurrentPositionWithScale = (productConfigs, activeProduct, viewSide, designScale, originalImageSize) => {
  const config = productConfigs[activeProduct];
  if (!config) return { x: 200, y: 80, width: 150, height: 150 };
  
  const basePosition = viewSide === 'front' ? config.frontPosition : config.backPosition;
  
  if (!originalImageSize) {
    return basePosition;
  }
  
  return getScaledPosition(basePosition, designScale, originalImageSize);
};

// ==================== DRAG CONSTRAINTS WITH SCALE ====================

/**
 * Calculate drag constraints allowing design to move outside print area
 * @param {Object} position - Current design position
 * @param {Object} printArea - Print area bounds
 * @param {number} canvasWidth - Canvas width
 * @param {number} canvasHeight - Canvas height
 * @returns {Object} Drag constraints {minX, maxX, minY, maxY}
 */
export const calculateDragConstraints = (position, printArea, canvasWidth = 400, canvasHeight = 400) => {
  // Allow dragging beyond print area but within reasonable canvas bounds
  const buffer = 100; // Allow 100px outside canvas
  
  return {
    minX: -position.width - buffer,
    maxX: canvasWidth + buffer,
    minY: -position.height - buffer,
    maxY: canvasHeight + buffer
  };
};

/**
 * Constrain position within drag bounds
 * @param {number} x - Proposed X position
 * @param {number} y - Proposed Y position
 * @param {Object} constraints - Drag constraints
 * @returns {Object} Constrained position {x, y}
 */
export const constrainPosition = (x, y, constraints) => {
  return {
    x: Math.max(constraints.minX, Math.min(constraints.maxX, x)),
    y: Math.max(constraints.minY, Math.min(constraints.maxY, y))
  };
};

// ==================== EXPORT ALL UTILITIES ====================

export default {
  calculateFitToCanvasScale,
  calculateScaledDimensions,
  isValidScale,
  getScaledPosition,
  calculateVisibleRegion,
  handleScaleChangeFix,
  handleImageLoadAutoScale,
  getCurrentPositionWithScale,
  calculateDragConstraints,
  constrainPosition
};