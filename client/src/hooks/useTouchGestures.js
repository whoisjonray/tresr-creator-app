import { useRef, useEffect } from 'react';

export function useTouchGestures(elementRef, {
  onPinch,
  onRotate,
  onDrag,
  onDoubleTap
}) {
  const touchesRef = useRef([]);
  const lastScaleRef = useRef(1);
  const lastRotationRef = useRef(0);
  const lastPositionRef = useRef({ x: 0, y: 0 });
  const doubleTapTimer = useRef(null);
  const lastTapTime = useRef(0);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Prevent default touch behaviors
    const preventDefault = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // Handle touch start
    const handleTouchStart = (e) => {
      preventDefault(e);
      touchesRef.current = Array.from(e.touches);

      // Check for double tap
      const now = Date.now();
      const timeDiff = now - lastTapTime.current;
      
      if (timeDiff < 300 && e.touches.length === 1) {
        // Double tap detected
        if (onDoubleTap) {
          const touch = e.touches[0];
          const rect = element.getBoundingClientRect();
          onDoubleTap({
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top
          });
        }
        lastTapTime.current = 0;
      } else {
        lastTapTime.current = now;
      }

      // Initialize drag position
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        lastPositionRef.current = {
          x: touch.clientX,
          y: touch.clientY
        };
      }
    };

    // Handle touch move
    const handleTouchMove = (e) => {
      preventDefault(e);
      const touches = Array.from(e.touches);

      if (touches.length === 1 && onDrag) {
        // Single finger drag
        const touch = touches[0];
        const deltaX = touch.clientX - lastPositionRef.current.x;
        const deltaY = touch.clientY - lastPositionRef.current.y;

        onDrag({
          deltaX,
          deltaY,
          x: touch.clientX,
          y: touch.clientY
        });

        lastPositionRef.current = {
          x: touch.clientX,
          y: touch.clientY
        };
      } else if (touches.length === 2) {
        // Two finger pinch/rotate
        const [touch1, touch2] = touches;
        const prevTouches = touchesRef.current;

        if (prevTouches.length === 2) {
          // Calculate pinch scale
          const prevDistance = getDistance(prevTouches[0], prevTouches[1]);
          const currentDistance = getDistance(touch1, touch2);
          const scale = currentDistance / prevDistance;

          if (onPinch && Math.abs(scale - 1) > 0.01) {
            onPinch({
              scale: scale * lastScaleRef.current,
              delta: scale - 1,
              center: getCenter(touch1, touch2)
            });
            lastScaleRef.current *= scale;
          }

          // Calculate rotation
          const prevAngle = getAngle(prevTouches[0], prevTouches[1]);
          const currentAngle = getAngle(touch1, touch2);
          const rotation = currentAngle - prevAngle;

          if (onRotate && Math.abs(rotation) > 1) {
            onRotate({
              rotation: lastRotationRef.current + rotation,
              delta: rotation,
              center: getCenter(touch1, touch2)
            });
            lastRotationRef.current += rotation;
          }
        }

        touchesRef.current = touches;
      }
    };

    // Handle touch end
    const handleTouchEnd = (e) => {
      preventDefault(e);
      
      if (e.touches.length === 0) {
        // Reset when all fingers lifted
        touchesRef.current = [];
        lastScaleRef.current = 1;
        lastRotationRef.current = 0;
      } else {
        touchesRef.current = Array.from(e.touches);
      }
    };

    // Helper functions
    const getDistance = (touch1, touch2) => {
      const dx = touch2.clientX - touch1.clientX;
      const dy = touch2.clientY - touch1.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const getAngle = (touch1, touch2) => {
      const dx = touch2.clientX - touch1.clientX;
      const dy = touch2.clientY - touch1.clientY;
      return Math.atan2(dy, dx) * 180 / Math.PI;
    };

    const getCenter = (touch1, touch2) => {
      return {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2
      };
    };

    // Add event listeners
    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });
    element.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    // Cleanup
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [onPinch, onRotate, onDrag, onDoubleTap]);

  return {
    reset: () => {
      lastScaleRef.current = 1;
      lastRotationRef.current = 0;
      lastPositionRef.current = { x: 0, y: 0 };
      touchesRef.current = [];
    }
  };
}