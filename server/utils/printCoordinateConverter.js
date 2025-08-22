/**
 * Print Coordinate Converter
 * Converts canvas coordinates to physical print coordinates for 16x20 inch DTG platen
 * 
 * Canvas: 600x600 pixels (design editor canvas)
 * Print Platen: 16x20 inches
 * Standard Print DPI: 300
 * Print Pixels: 4800x6000 pixels at 300 DPI
 */

class PrintCoordinateConverter {
  constructor() {
    // Canvas dimensions
    this.canvasWidth = 600;
    this.canvasHeight = 600;
    
    // Physical platen dimensions in inches
    this.platenWidthInches = 16;
    this.platenHeightInches = 20;
    
    // Standard print DPI
    this.printDPI = 300;
    
    // Print dimensions in pixels at 300 DPI
    this.printWidthPixels = this.platenWidthInches * this.printDPI; // 4800
    this.printHeightPixels = this.platenHeightInches * this.printDPI; // 6000
  }

  /**
   * Convert canvas coordinates to print coordinates
   * @param {Object} canvasCoords - Canvas coordinates {x, y, width, height} in pixels
   * @returns {Object} Print coordinates in multiple formats
   */
  canvasToPrint(canvasCoords) {
    // Calculate scale factors
    const scaleX = this.platenWidthInches / this.canvasWidth;
    const scaleY = this.platenHeightInches / this.canvasHeight;
    
    // Convert to inches
    const inchCoords = {
      x: canvasCoords.x * scaleX,
      y: canvasCoords.y * scaleY,
      width: canvasCoords.width * scaleX,
      height: canvasCoords.height * scaleY
    };
    
    // Convert to pixels at 300 DPI
    const pixelCoords300DPI = {
      x: Math.round(inchCoords.x * this.printDPI),
      y: Math.round(inchCoords.y * this.printDPI),
      width: Math.round(inchCoords.width * this.printDPI),
      height: Math.round(inchCoords.height * this.printDPI)
    };
    
    // Calculate center point (useful for some print systems)
    const centerPoint = {
      x_inches: inchCoords.x + (inchCoords.width / 2),
      y_inches: inchCoords.y + (inchCoords.height / 2),
      x_pixels: pixelCoords300DPI.x + Math.round(pixelCoords300DPI.width / 2),
      y_pixels: pixelCoords300DPI.y + Math.round(pixelCoords300DPI.height / 2)
    };
    
    return {
      canvas: canvasCoords,
      inches: inchCoords,
      pixels_300dpi: pixelCoords300DPI,
      center: centerPoint,
      platen: {
        width: this.platenWidthInches,
        height: this.platenHeightInches,
        dpi: this.printDPI
      }
    };
  }

  /**
   * Convert print coordinates back to canvas coordinates
   * @param {Object} printCoords - Print coordinates in inches {x, y, width, height}
   * @returns {Object} Canvas coordinates in pixels
   */
  printToCanvas(printCoords) {
    // Calculate scale factors (inverse of canvasToPrint)
    const scaleX = this.canvasWidth / this.platenWidthInches;
    const scaleY = this.canvasHeight / this.platenHeightInches;
    
    return {
      x: Math.round(printCoords.x * scaleX),
      y: Math.round(printCoords.y * scaleY),
      width: Math.round(printCoords.width * scaleX),
      height: Math.round(printCoords.height * scaleY)
    };
  }

  /**
   * Get optimal print dimensions for a design while maintaining aspect ratio
   * @param {Object} designDimensions - Original design {width, height} in pixels
   * @param {Number} maxPrintAreaPercentage - Maximum percentage of print area to use (0-1)
   * @returns {Object} Optimal print dimensions
   */
  getOptimalPrintSize(designDimensions, maxPrintAreaPercentage = 0.8) {
    const aspectRatio = designDimensions.width / designDimensions.height;
    
    // Calculate maximum print area in inches
    const maxWidth = this.platenWidthInches * maxPrintAreaPercentage;
    const maxHeight = this.platenHeightInches * maxPrintAreaPercentage;
    
    let printWidth, printHeight;
    
    if (aspectRatio > (maxWidth / maxHeight)) {
      // Design is wider - constrain by width
      printWidth = maxWidth;
      printHeight = printWidth / aspectRatio;
    } else {
      // Design is taller - constrain by height
      printHeight = maxHeight;
      printWidth = printHeight * aspectRatio;
    }
    
    // Center the design on the platen
    const x = (this.platenWidthInches - printWidth) / 2;
    const y = (this.platenHeightInches - printHeight) / 2;
    
    return {
      inches: {
        x,
        y,
        width: printWidth,
        height: printHeight
      },
      pixels_300dpi: {
        x: Math.round(x * this.printDPI),
        y: Math.round(y * this.printDPI),
        width: Math.round(printWidth * this.printDPI),
        height: Math.round(printHeight * this.printDPI)
      }
    };
  }

  /**
   * Format coordinates for YoPrint/fulfillment system
   * @param {Object} canvasCoords - Canvas coordinates
   * @param {String} designUrl - URL to high-resolution design file
   * @param {Object} productInfo - Product information
   * @returns {Object} Formatted data for fulfillment
   */
  formatForFulfillment(canvasCoords, designUrl, productInfo) {
    const printCoords = this.canvasToPrint(canvasCoords);
    
    return {
      design: {
        url: designUrl,
        format: 'PNG', // Recommended for transparency
        dpi: 300
      },
      placement: {
        side: productInfo.printSide || 'front',
        coordinates_inches: printCoords.inches,
        coordinates_pixels: printCoords.pixels_300dpi,
        center_point: printCoords.center
      },
      product: {
        type: productInfo.type,
        color: productInfo.color,
        size: productInfo.size
      },
      platen: {
        size: `${this.platenWidthInches}x${this.platenHeightInches}`,
        dpi: this.printDPI
      },
      instructions: {
        alignment: 'center',
        scaling: 'maintain_aspect_ratio',
        color_mode: 'CMYK' // For DTG printing
      }
    };
  }

  /**
   * Validate if coordinates fit within print area
   * @param {Object} canvasCoords - Canvas coordinates
   * @returns {Object} Validation result
   */
  validatePrintArea(canvasCoords) {
    const printCoords = this.canvasToPrint(canvasCoords);
    
    const isValid = 
      printCoords.inches.x >= 0 &&
      printCoords.inches.y >= 0 &&
      (printCoords.inches.x + printCoords.inches.width) <= this.platenWidthInches &&
      (printCoords.inches.y + printCoords.inches.height) <= this.platenHeightInches;
    
    return {
      isValid,
      warnings: [],
      errors: isValid ? [] : ['Design extends beyond print area'],
      coverage: {
        percentage: (printCoords.inches.width * printCoords.inches.height) / 
                   (this.platenWidthInches * this.platenHeightInches) * 100,
        width_used: printCoords.inches.width,
        height_used: printCoords.inches.height
      }
    };
  }
}

module.exports = new PrintCoordinateConverter();