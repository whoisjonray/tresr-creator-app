import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for responsive canvas sizing
 * Based on ChatGPT's recommendation for JavaScript-driven dimensions
 * Replaces CSS-based responsive design that was causing issues
 */
export const useResponsiveCanvas = () => {
  // State for canvas display dimensions
  const [displayDimensions, setDisplayDimensions] = useState({ width: 400, height: 400 });
  
  // Internal canvas dimensions (for drawing quality)
  const INTERNAL_WIDTH = 600;
  const INTERNAL_HEIGHT = 600;
  
  // Calculate responsive dimensions
  const calculateDimensions = useCallback(() => {
    // Get viewport dimensions
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    
    // Desktop: max 400x400
    // Tablet: max 350x350
    // Mobile: 90% of viewport width, max 350px
    let maxSize = 400;
    
    if (vw <= 768) {
      // Mobile
      maxSize = Math.min(vw * 0.9, 350);
    } else if (vw <= 1024) {
      // Tablet
      maxSize = 350;
    }
    
    // Account for UI elements (header, tools, etc)
    // Reserve space for other UI elements
    const availableHeight = vh - 200; // Reserve 200px for header/tools
    
    // Use the smaller of width or height constraints
    const size = Math.min(maxSize, availableHeight, vw - 40); // 40px for padding
    
    // Always maintain square aspect ratio
    setDisplayDimensions({
      width: Math.floor(size),
      height: Math.floor(size)
    });
  }, []);
  
  // Setup resize listener
  useEffect(() => {
    // Calculate initial dimensions
    calculateDimensions();
    
    // Debounced resize handler
    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(calculateDimensions, 100);
    };
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Also listen for orientation changes on mobile
    window.addEventListener('orientationchange', handleResize);
    
    // Cleanup
    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [calculateDimensions]);
  
  // Calculate scale factor for canvas context
  const scale = displayDimensions.width / INTERNAL_WIDTH;
  
  return {
    displayDimensions,
    internalDimensions: {
      width: INTERNAL_WIDTH,
      height: INTERNAL_HEIGHT
    },
    scale,
    // Container dimensions (with padding)
    containerDimensions: {
      width: displayDimensions.width + 40,
      height: displayDimensions.height + 40
    }
  };
};