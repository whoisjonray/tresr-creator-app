/**
 * Coffee Mug Convex Effect
 * Creates a cylindrical warp effect for mug mockups while preserving original for print
 */

class MugConvexEffect {
  constructor() {
    // Mug dimensions (standard 11oz mug)
    this.mugWidth = 300; // pixels in canvas
    this.mugHeight = 300; // pixels in canvas
    this.printAreaWidth = 3.5; // inches
    this.printAreaHeight = 3.5; // inches
    this.wrapPercentage = 0.85; // How much of circumference is covered
  }

  /**
   * Apply convex warp effect to design for display
   * Uses vertical strip rendering to create cylindrical effect
   * @param {HTMLCanvasElement} sourceCanvas - Canvas with flat design
   * @param {Object} options - Warp options
   * @returns {HTMLCanvasElement} Warped canvas for display
   */
  applyConvexWarp(sourceCanvas, options = {}) {
    const {
      curvature = 0.3, // How much to curve (0-1)
      perspective = 0.8, // Perspective compression at edges
      strips = 100 // Number of vertical strips for smoothness
    } = options;

    // Create output canvas
    const warpedCanvas = document.createElement('canvas');
    const warpedCtx = warpedCanvas.getContext('2d');
    
    // Set dimensions
    warpedCanvas.width = this.mugWidth;
    warpedCanvas.height = this.mugHeight;
    
    // Clear canvas
    warpedCtx.clearRect(0, 0, this.mugWidth, this.mugHeight);
    
    // Calculate strip width
    const stripWidth = sourceCanvas.width / strips;
    const outputStripWidth = this.mugWidth / strips;
    
    // Draw each vertical strip with appropriate warping
    for (let i = 0; i < strips; i++) {
      // Calculate position in normalized coordinates (0 to 1)
      const normalizedX = i / strips;
      
      // Calculate cylindrical offset using elliptical formula
      // This creates the convex appearance
      const offsetY = this.calculateCylindricalOffset(normalizedX, curvature);
      
      // Calculate perspective scaling for both horizontal and vertical
      const verticalScale = this.calculatePerspectiveScale(normalizedX, perspective);
      const horizontalScale = this.calculateHorizontalPerspectiveScale(normalizedX, perspective);
      
      // Source rectangle (from flat design)
      const sx = i * stripWidth;
      const sy = 0;
      const sw = stripWidth;
      const sh = sourceCanvas.height;
      
      // Destination rectangle (warped position)
      // Center the strips while applying horizontal compression
      const centerX = this.mugWidth / 2;
      const stripCenterOffset = (i - strips / 2) * outputStripWidth;
      
      const dx = centerX + (stripCenterOffset * horizontalScale);
      const dy = offsetY;
      const dw = outputStripWidth * horizontalScale;
      const dh = sh * verticalScale;
      
      // Draw the strip
      warpedCtx.drawImage(
        sourceCanvas,
        sx, sy, sw, sh,
        dx, dy, dw, dh
      );
    }
    
    return warpedCanvas;
  }

  /**
   * Calculate vertical offset for cylindrical effect
   * @param {Number} x - Normalized x position (0-1)
   * @param {Number} curvature - Curvature amount (0-1)
   * @returns {Number} Y offset in pixels
   */
  calculateCylindricalOffset(x, curvature) {
    // Convert to centered coordinates (-0.5 to 0.5)
    const centeredX = x - 0.5;
    
    // Calculate elliptical offset
    // This creates the cylindrical appearance
    const radiusA = 0.5; // Half width
    const radiusB = curvature * this.mugHeight * 0.1; // Max offset
    
    // Ellipse formula: y = b * sqrt(1 - (x/a)^2)
    const offset = radiusB * Math.sqrt(1 - Math.pow(centeredX / radiusA, 2));
    
    return offset;
  }

  /**
   * Calculate perspective scaling for edges (vertical scaling)
   * @param {Number} x - Normalized x position (0-1)
   * @param {Number} perspective - Perspective amount (0-1)
   * @returns {Number} Scale factor
   */
  calculatePerspectiveScale(x, perspective) {
    // Convert to centered coordinates (-0.5 to 0.5)
    const centeredX = Math.abs(x - 0.5) * 2; // 0 at center, 1 at edges
    
    // Calculate scale (smaller at edges for perspective)
    const minScale = perspective;
    const scale = 1 - (centeredX * (1 - minScale));
    
    return scale;
  }

  /**
   * Calculate horizontal perspective scaling for edges
   * @param {Number} x - Normalized x position (0-1)
   * @param {Number} perspective - Perspective amount (0-1)
   * @returns {Number} Scale factor for horizontal compression
   */
  calculateHorizontalPerspectiveScale(x, perspective) {
    // Convert to centered coordinates (-0.5 to 0.5)
    const centeredX = Math.abs(x - 0.5) * 2; // 0 at center, 1 at edges
    
    // Calculate horizontal compression (narrower at edges)
    const minScale = 0.7; // More aggressive horizontal scaling than vertical
    const scale = 1 - (centeredX * (1 - minScale));
    
    return Math.max(scale, 0.5); // Prevent over-compression
  }

  /**
   * Create display mockup with convex effect
   * @param {HTMLImageElement} designImage - Design image
   * @param {Object} position - Position data {x, y, width, height}
   * @returns {Object} Display and print data
   */
  createMugMockup(designImage, position) {
    // Create flat canvas with design
    const flatCanvas = document.createElement('canvas');
    const flatCtx = flatCanvas.getContext('2d');
    
    flatCanvas.width = this.mugWidth;
    flatCanvas.height = this.mugHeight;
    
    // Draw design on flat canvas
    flatCtx.drawImage(
      designImage,
      position.x,
      position.y,
      position.width,
      position.height
    );
    
    // Create warped version for display
    const warpedCanvas = this.applyConvexWarp(flatCanvas, {
      curvature: 0.3,
      perspective: 0.85,
      strips: 150 // Higher number for smoother curve
    });
    
    // Return both versions
    return {
      display: {
        canvas: warpedCanvas,
        dataUrl: warpedCanvas.toDataURL('image/png')
      },
      print: {
        canvas: flatCanvas,
        dataUrl: flatCanvas.toDataURL('image/png'),
        specifications: this.getPrintSpecifications(position)
      }
    };
  }

  /**
   * Get print specifications for production
   * @param {Object} position - Design position
   * @returns {Object} Print specifications
   */
  getPrintSpecifications(position) {
    return {
      product_type: 'mug',
      print_method: 'sublimation',
      print_area: {
        width_inches: this.printAreaWidth,
        height_inches: this.printAreaHeight,
        wrap_percentage: this.wrapPercentage
      },
      design_placement: {
        x_inches: (position.x / this.mugWidth) * this.printAreaWidth,
        y_inches: (position.y / this.mugHeight) * this.printAreaHeight,
        width_inches: (position.width / this.mugWidth) * this.printAreaWidth,
        height_inches: (position.height / this.mugHeight) * this.printAreaHeight
      },
      instructions: {
        alignment: 'center',
        bleed: 0.125, // 1/8 inch bleed for wrap
        color_profile: 'sRGB', // For sublimation
        substrate: 'ceramic',
        coating: 'polymer'
      }
    };
  }

  /**
   * Preview animation - slowly rotate mug to show wrap effect
   * @param {HTMLCanvasElement} canvas - Canvas to animate on
   * @param {HTMLImageElement} designImage - Design to show
   * @param {Object} position - Design position
   */
  animateRotation(canvas, designImage, position) {
    const ctx = canvas.getContext('2d');
    let rotation = 0;
    
    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Calculate warp based on rotation
      const warpAmount = Math.sin(rotation) * 0.5 + 0.5; // 0 to 1
      
      // Create warped version
      const flatCanvas = document.createElement('canvas');
      const flatCtx = flatCanvas.getContext('2d');
      flatCanvas.width = this.mugWidth;
      flatCanvas.height = this.mugHeight;
      
      // Position design based on rotation
      const offsetX = Math.sin(rotation) * 50; // Horizontal movement
      flatCtx.drawImage(
        designImage,
        position.x + offsetX,
        position.y,
        position.width,
        position.height
      );
      
      // Apply warp
      const warped = this.applyConvexWarp(flatCanvas, {
        curvature: warpAmount * 0.4,
        perspective: 0.8 + (warpAmount * 0.1),
        strips: 100
      });
      
      // Draw on main canvas
      ctx.drawImage(warped, 0, 0);
      
      // Update rotation
      rotation += 0.02;
      
      // Continue animation
      requestAnimationFrame(animate);
    };
    
    animate();
  }

  /**
   * Validate design placement for mug printing
   * @param {Object} position - Design position
   * @returns {Object} Validation result
   */
  validatePlacement(position) {
    const printSpecs = this.getPrintSpecifications(position);
    const errors = [];
    const warnings = [];
    
    // Check if design fits within print area
    if (printSpecs.design_placement.width_inches > this.printAreaWidth) {
      errors.push('Design width exceeds print area');
    }
    
    if (printSpecs.design_placement.height_inches > this.printAreaHeight) {
      errors.push('Design height exceeds print area');
    }
    
    // Check for optimal placement
    const coveragePercent = (printSpecs.design_placement.width_inches * 
                            printSpecs.design_placement.height_inches) / 
                           (this.printAreaWidth * this.printAreaHeight) * 100;
    
    if (coveragePercent < 30) {
      warnings.push(`Design only covers ${coveragePercent.toFixed(1)}% of print area`);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      coverage: coveragePercent
    };
  }
}

export default new MugConvexEffect();