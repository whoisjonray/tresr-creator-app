/**
 * Shared coordinate utilities for consistent bounding box handling
 * Based on ChatGPT's solution for coordinate mismatch issue
 */

// Standard canvas size used across the application
export const STANDARD_CANVAS_SIZE = 600;

/**
 * Convert absolute coordinates to relative (0-1 range)
 * @param {Object} coords - Absolute coordinates {x, y, width, height}
 * @param {number} canvasSize - Canvas size (defaults to standard)
 * @returns {Object} Relative coordinates
 */
export const toRelativeCoordinates = (coords, canvasSize = STANDARD_CANVAS_SIZE) => {
  return {
    x: coords.x / canvasSize,
    y: coords.y / canvasSize,
    width: coords.width / canvasSize,
    height: coords.height / canvasSize
  };
};

/**
 * Convert relative coordinates (0-1 range) to absolute
 * @param {Object} relativeCoords - Relative coordinates {x, y, width, height}
 * @param {number} canvasSize - Canvas size (defaults to standard)
 * @returns {Object} Absolute coordinates
 */
export const toAbsoluteCoordinates = (relativeCoords, canvasSize = STANDARD_CANVAS_SIZE) => {
  return {
    x: relativeCoords.x * canvasSize,
    y: relativeCoords.y * canvasSize,
    width: relativeCoords.width * canvasSize,
    height: relativeCoords.height * canvasSize
  };
};

/**
 * Scale coordinates from one canvas size to another
 * @param {Object} coords - Source coordinates {x, y, width, height}
 * @param {number} fromSize - Source canvas size
 * @param {number} toSize - Target canvas size
 * @returns {Object} Scaled coordinates
 */
export const scaleCoordinates = (coords, fromSize, toSize) => {
  const scale = toSize / fromSize;
  return {
    x: coords.x * scale,
    y: coords.y * scale,
    width: coords.width * scale,
    height: coords.height * scale
  };
};

/**
 * Ensure canvas uses standard size
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @returns {void}
 */
export const enforceStandardCanvasSize = (canvas) => {
  if (canvas) {
    canvas.width = STANDARD_CANVAS_SIZE;
    canvas.height = STANDARD_CANVAS_SIZE;
  }
};

/**
 * Get mouse coordinates relative to canvas
 * @param {MouseEvent} event - Mouse event
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @returns {Object} Mouse coordinates {x, y}
 */
export const getCanvasMouseCoords = (event, canvas) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY
  };
};

/**
 * Validate coordinates are within canvas bounds
 * @param {Object} coords - Coordinates {x, y, width, height}
 * @param {number} canvasSize - Canvas size
 * @returns {boolean} True if valid
 */
export const validateCoordinates = (coords, canvasSize = STANDARD_CANVAS_SIZE) => {
  return (
    coords.x >= 0 &&
    coords.y >= 0 &&
    coords.x + coords.width <= canvasSize &&
    coords.y + coords.height <= canvasSize
  );
};

/**
 * Clamp coordinates to canvas bounds
 * @param {Object} coords - Coordinates {x, y, width, height}
 * @param {number} canvasSize - Canvas size
 * @returns {Object} Clamped coordinates
 */
export const clampToCanvas = (coords, canvasSize = STANDARD_CANVAS_SIZE) => {
  return {
    x: Math.max(0, Math.min(coords.x, canvasSize - coords.width)),
    y: Math.max(0, Math.min(coords.y, canvasSize - coords.height)),
    width: Math.min(coords.width, canvasSize - coords.x),
    height: Math.min(coords.height, canvasSize - coords.y)
  };
};