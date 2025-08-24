/**
 * Canvas Aspect Ratio Debugging Utility
 * Use this to test and validate 1:1 aspect ratio on all devices
 */

export function debugCanvasAspectRatio() {
  const canvas = document.querySelector('.product-canvas');
  const container = document.querySelector('.canvas-container');
  
  if (!canvas || !container) {
    console.warn('Canvas or container not found');
    return;
  }
  
  // Enable debug mode
  canvas.setAttribute('data-debug', 'true');
  container.setAttribute('data-debug', 'true');
  
  // Get computed dimensions
  const canvasRect = canvas.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  
  // Set debug attributes
  container.setAttribute('data-width', Math.round(containerRect.width));
  container.setAttribute('data-height', Math.round(containerRect.height));
  
  const aspectRatio = canvasRect.width / canvasRect.height;
  const isSquare = Math.abs(aspectRatio - 1) < 0.01; // Allow 1% tolerance
  
  console.group('🎨 Canvas Aspect Ratio Debug');
  console.log('Canvas Dimensions:', {
    width: Math.round(canvasRect.width),
    height: Math.round(canvasRect.height),
    aspectRatio: aspectRatio.toFixed(3),
    isSquare: isSquare ? '✅' : '❌'
  });
  
  console.log('Container Dimensions:', {
    width: Math.round(containerRect.width),
    height: Math.round(containerRect.height),
    aspectRatio: (containerRect.width / containerRect.height).toFixed(3)
  });
  
  console.log('CSS Custom Properties:', {
    canvasSize: getComputedStyle(container).getPropertyValue('--canvas-size').trim(),
    canvasInnerSize: getComputedStyle(canvas).getPropertyValue('width').trim(),
  });
  
  console.log('Viewport Info:', {
    width: window.innerWidth,
    height: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio
  });
  
  // Test all breakpoints
  const breakpoints = [
    { name: 'Desktop', min: 1025, max: Infinity },
    { name: 'Tablet', min: 769, max: 1024 },
    { name: 'Mobile', min: 481, max: 768 },
    { name: 'Mobile Small', min: 0, max: 480 }
  ];
  
  const currentBreakpoint = breakpoints.find(bp => 
    window.innerWidth >= bp.min && window.innerWidth <= bp.max
  );
  
  console.log('Current Breakpoint:', currentBreakpoint?.name || 'Unknown');
  
  if (!isSquare) {
    console.warn('⚠️ Canvas is NOT square!', {
      expected: '1:1',
      actual: `${aspectRatio.toFixed(3)}:1`,
      difference: `${((aspectRatio - 1) * 100).toFixed(1)}%`
    });
  } else {
    console.log('✅ Canvas aspect ratio is perfect!');
  }
  
  console.groupEnd();
  
  return {
    isSquare,
    aspectRatio,
    canvasDimensions: {
      width: Math.round(canvasRect.width),
      height: Math.round(canvasRect.height)
    },
    containerDimensions: {
      width: Math.round(containerRect.width),
      height: Math.round(containerRect.height)
    },
    breakpoint: currentBreakpoint?.name
  };
}

export function testAllBreakpoints() {
  const breakpoints = [480, 768, 1024, 1200];
  
  console.group('🔍 Testing All Breakpoints');
  
  breakpoints.forEach(width => {
    // Temporarily resize viewport (for testing only)
    console.log(`Testing at ${width}px...`);
    
    // Calculate expected dimensions
    let expectedSize;
    if (width <= 480) {
      expectedSize = Math.min(320, width - 20);
    } else if (width <= 768) {
      expectedSize = Math.min(350, width - 40);
    } else if (width <= 1024) {
      expectedSize = Math.min(500, width - 60);
    } else {
      expectedSize = Math.min(600, width - 80);
    }
    
    console.log(`Expected canvas size: ${expectedSize}x${expectedSize}`);
  });
  
  console.groupEnd();
}

export function disableDebugMode() {
  const canvas = document.querySelector('.product-canvas');
  const container = document.querySelector('.canvas-container');
  
  if (canvas) canvas.removeAttribute('data-debug');
  if (container) {
    container.removeAttribute('data-debug');
    container.removeAttribute('data-width');
    container.removeAttribute('data-height');
  }
  
  console.log('Debug mode disabled');
}

// Auto-run debug on window resize
let debugTimeout;
export function enableAutoDebug() {
  window.addEventListener('resize', () => {
    clearTimeout(debugTimeout);
    debugTimeout = setTimeout(debugCanvasAspectRatio, 100);
  });
  
  console.log('Auto-debug enabled - canvas will be checked on resize');
}

// Export for global access in development
if (typeof window !== 'undefined') {
  window.canvasDebug = {
    debug: debugCanvasAspectRatio,
    testBreakpoints: testAllBreakpoints,
    disable: disableDebugMode,
    enableAuto: enableAutoDebug
  };
}