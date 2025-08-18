/**
 * Scale Slider Fix - Test Suite
 * Tests for the critical scale slider functionality
 */

import scaleUtils from '../client/src/utils/fix-scale-slider.js';

describe('Scale Slider Fix - Core Utilities', () => {
  
  describe('calculateFitToCanvasScale', () => {
    test('should scale large image to fit canvas', () => {
      // Test case: 1890x2362 image on 400x400 canvas
      const scale = scaleUtils.calculateFitToCanvasScale(1890, 2362, 400, 400);
      expect(scale).toBeCloseTo(13.5, 1); // ~13.5% to fit in 80% of canvas
    });

    test('should scale wide image correctly', () => {
      const scale = scaleUtils.calculateFitToCanvasScale(1200, 300, 400, 400);
      expect(scale).toBeCloseTo(26.7, 1); // Width constrains, not height
    });

    test('should scale tall image correctly', () => {
      const scale = scaleUtils.calculateFitToCanvasScale(300, 1200, 400, 400);
      expect(scale).toBeCloseTo(26.7, 1); // Height constrains, not width
    });

    test('should clamp minimum scale to 10%', () => {
      const scale = scaleUtils.calculateFitToCanvasScale(10000, 10000, 400, 400);
      expect(scale).toBe(10);
    });

    test('should clamp maximum scale to 200%', () => {
      const scale = scaleUtils.calculateFitToCanvasScale(50, 50, 400, 400);
      expect(scale).toBe(200);
    });
  });

  describe('calculateScaledDimensions', () => {
    test('should calculate correct dimensions at 100%', () => {
      const dims = scaleUtils.calculateScaledDimensions(1890, 2362, 100);
      expect(dims).toEqual({ width: 1890, height: 2362 });
    });

    test('should calculate correct dimensions at 50%', () => {
      const dims = scaleUtils.calculateScaledDimensions(1890, 2362, 50);
      expect(dims).toEqual({ width: 945, height: 1181 });
    });

    test('should calculate correct dimensions at 200%', () => {
      const dims = scaleUtils.calculateScaledDimensions(100, 100, 200);
      expect(dims).toEqual({ width: 200, height: 200 });
    });

    test('should round to integers', () => {
      const dims = scaleUtils.calculateScaledDimensions(333, 333, 33.33);
      expect(dims.width).toBe(111);
      expect(dims.height).toBe(111);
      expect(Number.isInteger(dims.width)).toBe(true);
      expect(Number.isInteger(dims.height)).toBe(true);
    });
  });

  describe('isValidScale', () => {
    test('should accept valid scales', () => {
      expect(scaleUtils.isValidScale(50)).toBe(true);
      expect(scaleUtils.isValidScale(100)).toBe(true);
      expect(scaleUtils.isValidScale(200)).toBe(true);
      expect(scaleUtils.isValidScale(10)).toBe(true);
      expect(scaleUtils.isValidScale(500)).toBe(true);
    });

    test('should reject invalid scales', () => {
      expect(scaleUtils.isValidScale(5)).toBe(false);    // Too small
      expect(scaleUtils.isValidScale(600)).toBe(false);  // Too large
      expect(scaleUtils.isValidScale(NaN)).toBe(false);  // NaN
      expect(scaleUtils.isValidScale('100')).toBe(false); // String
      expect(scaleUtils.isValidScale(null)).toBe(false);  // Null
    });
  });

  describe('getScaledPosition', () => {
    const basePosition = { x: 100, y: 50, width: 200, height: 300 };
    const originalSize = { width: 1000, height: 1500 };

    test('should maintain position but scale dimensions at 50%', () => {
      const result = scaleUtils.getScaledPosition(basePosition, 50, originalSize);
      expect(result).toEqual({
        x: 100,
        y: 50,
        width: 500,
        height: 750
      });
    });

    test('should maintain position but scale dimensions at 200%', () => {
      const result = scaleUtils.getScaledPosition(basePosition, 200, originalSize);
      expect(result).toEqual({
        x: 100,
        y: 50,
        width: 2000,
        height: 3000
      });
    });

    test('should handle missing parameters gracefully', () => {
      const result = scaleUtils.getScaledPosition(null, 100, null);
      expect(result).toEqual({ x: 200, y: 80, width: 150, height: 150 });
    });
  });

  describe('calculateVisibleRegion', () => {
    const bounds = { x: 0, y: 0, width: 400, height: 400 };

    test('should return full region when design is inside bounds', () => {
      const position = { x: 50, y: 50, width: 100, height: 100 };
      const result = scaleUtils.calculateVisibleRegion(position, bounds);
      
      expect(result).toEqual({
        x: 50,
        y: 50,
        width: 100,
        height: 100,
        sourceX: 0,
        sourceY: 0,
        sourceWidth: 100,
        sourceHeight: 100
      });
    });

    test('should clip design that extends beyond right edge', () => {
      const position = { x: 350, y: 50, width: 100, height: 100 };
      const result = scaleUtils.calculateVisibleRegion(position, bounds);
      
      expect(result).toEqual({
        x: 350,
        y: 50,
        width: 50,
        height: 100,
        sourceX: 0,
        sourceY: 0,
        sourceWidth: 50,
        sourceHeight: 100
      });
    });

    test('should clip design that extends beyond left edge', () => {
      const position = { x: -50, y: 50, width: 100, height: 100 };
      const result = scaleUtils.calculateVisibleRegion(position, bounds);
      
      expect(result).toEqual({
        x: 0,
        y: 50,
        width: 50,
        height: 100,
        sourceX: 50,
        sourceY: 0,
        sourceWidth: 50,
        sourceHeight: 100
      });
    });

    test('should return null when no intersection', () => {
      const position = { x: 500, y: 500, width: 100, height: 100 };
      const result = scaleUtils.calculateVisibleRegion(position, bounds);
      expect(result).toBeNull();
    });
  });

  describe('calculateDragConstraints', () => {
    const position = { width: 200, height: 150 };
    const printArea = { x: 50, y: 50, width: 300, height: 300 };

    test('should allow dragging beyond canvas with buffer', () => {
      const constraints = scaleUtils.calculateDragConstraints(position, printArea);
      
      expect(constraints).toEqual({
        minX: -300, // -200 (width) - 100 (buffer)
        maxX: 500,  // 400 (canvas) + 100 (buffer)
        minY: -250, // -150 (height) - 100 (buffer)
        maxY: 500   // 400 (canvas) + 100 (buffer)
      });
    });
  });

  describe('constrainPosition', () => {
    const constraints = { minX: -100, maxX: 500, minY: -50, maxY: 450 };

    test('should allow position within constraints', () => {
      const result = scaleUtils.constrainPosition(200, 300, constraints);
      expect(result).toEqual({ x: 200, y: 300 });
    });

    test('should constrain position beyond max bounds', () => {
      const result = scaleUtils.constrainPosition(600, 500, constraints);
      expect(result).toEqual({ x: 500, y: 450 });
    });

    test('should constrain position beyond min bounds', () => {
      const result = scaleUtils.constrainPosition(-200, -100, constraints);
      expect(result).toEqual({ x: -100, y: -50 });
    });
  });
});

describe('Integration Helpers', () => {
  describe('handleImageLoadAutoScale', () => {
    let mockSetDesignScale;

    beforeEach(() => {
      mockSetDesignScale = jest.fn();
    });

    test('should auto-scale large images', () => {
      const mockImg = { width: 1890, height: 2362 };
      scaleUtils.handleImageLoadAutoScale(mockImg, mockSetDesignScale);
      
      expect(mockSetDesignScale).toHaveBeenCalledWith(expect.any(Number));
      const scaleValue = mockSetDesignScale.mock.calls[0][0];
      expect(scaleValue).toBeLessThan(100); // Should be scaled down
      expect(scaleValue).toBeGreaterThan(10); // But not too small
    });

    test('should keep small images at 100%', () => {
      const mockImg = { width: 150, height: 150 };
      scaleUtils.handleImageLoadAutoScale(mockImg, mockSetDesignScale);
      
      expect(mockSetDesignScale).toHaveBeenCalledWith(100);
    });
  });

  describe('getCurrentPositionWithScale', () => {
    const productConfigs = {
      'tee': {
        frontPosition: { x: 100, y: 50, width: 200, height: 200 },
        backPosition: { x: 150, y: 100, width: 180, height: 180 }
      }
    };
    const originalImageSize = { width: 1000, height: 1000 };

    test('should return scaled front position', () => {
      const result = scaleUtils.getCurrentPositionWithScale(
        productConfigs, 'tee', 'front', 50, originalImageSize
      );
      
      expect(result).toEqual({
        x: 100,
        y: 50,
        width: 500, // 1000 * 0.5
        height: 500 // 1000 * 0.5
      });
    });

    test('should return scaled back position', () => {
      const result = scaleUtils.getCurrentPositionWithScale(
        productConfigs, 'tee', 'back', 200, originalImageSize
      );
      
      expect(result).toEqual({
        x: 150,
        y: 100,
        width: 2000, // 1000 * 2.0
        height: 2000 // 1000 * 2.0
      });
    });

    test('should handle missing config gracefully', () => {
      const result = scaleUtils.getCurrentPositionWithScale(
        {}, 'missing', 'front', 100, originalImageSize
      );
      
      expect(result).toEqual({ x: 200, y: 80, width: 150, height: 150 });
    });
  });
});

describe('Real-World Scenarios', () => {
  test('CRITICAL: "JUST Grok IT" large image scenario', () => {
    // Simulate the actual problem case
    const imageSize = { width: 1890, height: 2362 };
    const canvasSize = { width: 400, height: 400 };
    
    // Calculate initial auto-scale
    const autoScale = scaleUtils.calculateFitToCanvasScale(
      imageSize.width, 
      imageSize.height, 
      canvasSize.width, 
      canvasSize.height
    );
    
    // Should be around 13-14% to fit in canvas
    expect(autoScale).toBeGreaterThan(10);
    expect(autoScale).toBeLessThan(20);
    
    // At 100% scale, should be actual size
    const scaledAt100 = scaleUtils.calculateScaledDimensions(
      imageSize.width, 
      imageSize.height, 
      100
    );
    expect(scaledAt100).toEqual({ width: 1890, height: 2362 });
    
    // At 200% scale, should be double
    const scaledAt200 = scaleUtils.calculateScaledDimensions(
      imageSize.width, 
      imageSize.height, 
      200
    );
    expect(scaledAt200).toEqual({ width: 3780, height: 4724 });
  });

  test('Small image should not be auto-scaled', () => {
    const imageSize = { width: 100, height: 100 };
    let scaleSet = null;
    
    const mockSetScale = (scale) => { scaleSet = scale; };
    
    scaleUtils.handleImageLoadAutoScale(
      imageSize, 
      mockSetScale
    );
    
    expect(scaleSet).toBe(100);
  });

  test('Canvas clipping prevents overdraw', () => {
    // Large design positioned partially outside canvas
    const largeDesign = { x: -100, y: -50, width: 600, height: 500 };
    const printArea = { x: 0, y: 0, width: 400, height: 400 };
    
    const visible = scaleUtils.calculateVisibleRegion(largeDesign, printArea);
    
    expect(visible).not.toBeNull();
    expect(visible.width).toBeLessThan(largeDesign.width);
    expect(visible.height).toBeLessThan(largeDesign.height);
    expect(visible.sourceX).toBeGreaterThan(0); // Should offset into source image
    expect(visible.sourceY).toBeGreaterThan(0);
  });
});

// Mock console to suppress test output
beforeAll(() => {
  global.console = {
    ...console,
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  };
});