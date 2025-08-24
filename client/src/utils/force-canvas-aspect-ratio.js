// Force canvas 1:1 aspect ratio on mobile devices
export function forceCanvasAspectRatio() {
  const canvas = document.querySelector('.product-canvas');
  if (!canvas) return;

  // Check if mobile
  if (window.innerWidth > 768) return;

  // Calculate the size - should be square
  const maxSize = Math.min(400, window.innerWidth - 40);
  const size = Math.min(maxSize, canvas.parentElement.offsetWidth - 30);

  // Force exact square dimensions
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;
  canvas.width = size;
  canvas.height = size;

  console.log(`🎯 Forced canvas to ${size}x${size} (1:1 ratio)`);

  // Also fix the container
  const container = canvas.closest('.canvas-container');
  if (container) {
    container.style.width = `${size + 30}px`;
    container.style.height = `${size + 30}px`;
  }
}

// Set up ResizeObserver to maintain aspect ratio
export function setupCanvasResizeObserver() {
  const canvas = document.querySelector('.product-canvas');
  if (!canvas) return;

  const resizeObserver = new ResizeObserver(entries => {
    for (const entry of entries) {
      if (window.innerWidth > 768) return;
      
      const { width, height } = entry.contentRect;
      if (Math.abs(width - height) > 2) {
        // Not square, force it
        forceCanvasAspectRatio();
      }
    }
  });

  resizeObserver.observe(canvas);
  
  // Initial enforcement
  forceCanvasAspectRatio();
  
  return resizeObserver;
}

// Run on load and resize
if (typeof window !== 'undefined') {
  window.addEventListener('resize', forceCanvasAspectRatio);
  window.addEventListener('orientationchange', forceCanvasAspectRatio);
  
  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      forceCanvasAspectRatio();
      setupCanvasResizeObserver();
    });
  } else {
    forceCanvasAspectRatio();
    setupCanvasResizeObserver();
  }
}