import { useRef, useCallback } from 'react';

/**
 * Hook for handling both mouse and touch drag events on canvas
 * Based on ChatGPT's recommendations for mobile touch support
 */
export const useTouchDrag = (canvasRef, designImage, getCurrentPosition, updatePosition, getPrintArea, activeProduct, viewSide) => {
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const lastTouch = useRef(null);

  // Convert client coordinates to canvas coordinates
  const getCanvasCoords = useCallback((clientX, clientY) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }, [canvasRef]);

  // Check if point is within design bounds
  const isPointInDesign = useCallback((x, y) => {
    const position = getCurrentPosition();
    return x >= position.x && 
           x <= position.x + position.width && 
           y >= position.y && 
           y <= position.y + position.height;
  }, [getCurrentPosition]);

  // Handle drag start (mouse or touch)
  const handleDragStart = useCallback((clientX, clientY) => {
    if (!designImage) return;
    
    const { x, y } = getCanvasCoords(clientX, clientY);
    const position = getCurrentPosition();
    
    if (isPointInDesign(x, y)) {
      isDragging.current = true;
      dragStart.current = {
        x: x - position.x,
        y: y - position.y
      };
      
      // Update cursor
      if (canvasRef.current) {
        canvasRef.current.style.cursor = 'grabbing';
      }
    }
  }, [designImage, getCanvasCoords, getCurrentPosition, isPointInDesign, canvasRef]);

  // Handle drag move (mouse or touch)
  const handleDragMove = useCallback((clientX, clientY) => {
    if (!designImage) return;
    
    const { x, y } = getCanvasCoords(clientX, clientY);
    
    // Update cursor on hover
    if (!isDragging.current && canvasRef.current) {
      canvasRef.current.style.cursor = isPointInDesign(x, y) ? 'grab' : 'default';
    }
    
    // Handle dragging with relaxed constraints for scaled images
    if (isDragging.current) {
      const printArea = getPrintArea(activeProduct, viewSide);
      const currentPosition = getCurrentPosition();
      
      // Calculate new position
      let newX = x - dragStart.current.x;
      let newY = y - dragStart.current.y;
      
      // Allow dragging beyond boundaries when image is scaled larger
      // But ensure at least 50px of the image stays visible in the print area
      const minOverlap = 50;
      
      // Relaxed constraints - allow image to go partially outside print area
      const minX = printArea.x - currentPosition.width + minOverlap;
      const maxX = printArea.x + printArea.width - minOverlap;
      const minY = printArea.y - currentPosition.height + minOverlap;
      const maxY = printArea.y + printArea.height - minOverlap;
      
      // Apply constraints
      newX = Math.max(minX, Math.min(maxX, newX));
      newY = Math.max(minY, Math.min(maxY, newY));
      
      const newPosition = {
        ...currentPosition,
        x: newX,
        y: newY
      };
      
      updatePosition(activeProduct, newPosition);
    }
  }, [designImage, getCanvasCoords, isPointInDesign, isDragging, dragStart, getPrintArea, activeProduct, viewSide, getCurrentPosition, updatePosition, canvasRef]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    isDragging.current = false;
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'default';
    }
  }, [canvasRef]);

  // Touch event handlers
  const handleTouchStart = useCallback((e) => {
    e.preventDefault(); // Prevent scrolling while dragging
    
    const touch = e.touches[0];
    lastTouch.current = touch;
    handleDragStart(touch.clientX, touch.clientY);
  }, [handleDragStart]);

  const handleTouchMove = useCallback((e) => {
    e.preventDefault(); // Prevent scrolling while dragging
    
    const touch = e.touches[0];
    lastTouch.current = touch;
    handleDragMove(touch.clientX, touch.clientY);
  }, [handleDragMove]);

  const handleTouchEnd = useCallback((e) => {
    e.preventDefault();
    handleDragEnd();
    lastTouch.current = null;
  }, [handleDragEnd]);

  // Mouse event handlers
  const handleMouseDown = useCallback((e) => {
    handleDragStart(e.clientX, e.clientY);
  }, [handleDragStart]);

  const handleMouseMove = useCallback((e) => {
    handleDragMove(e.clientX, e.clientY);
  }, [handleDragMove]);

  const handleMouseUp = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  return {
    // Touch events
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    // Mouse events
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    // State
    isDragging: isDragging.current
  };
};