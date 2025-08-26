# Bounding Box Coordinate Mismatch Issue

## Problem Statement

The bounding box coordinates configured at https://creators.tresr.com/test/bounding-box are not properly mirroring/matching when used at https://creators.tresr.com/design/new. This means the print areas defined in the admin tool don't align with the actual design placement in the editor.

## URLs
- **Admin/Config Page**: https://creators.tresr.com/test/bounding-box
- **Design Editor Page**: https://creators.tresr.com/design/new

## Expected Behavior

When coordinates are set in the bounding box admin tool, they should:
1. Define the exact print area for each garment
2. Be used identically in the design editor
3. Ensure designs are positioned correctly for printing
4. Maintain consistency across all product types

## Current Issues

1. **Coordinate System Mismatch**: The coordinates saved in /test/bounding-box don't match the actual positioning in /design/new
2. **Scale/Size Differences**: Possible canvas size differences between the two pages
3. **Origin Point Issues**: The (0,0) point may be different between pages
4. **Transformation Problems**: Coordinates might be getting transformed or scaled differently

## Technical Context

### Canvas Configuration
Both pages should use:
- Canvas internal size: 600x600px
- Display size may vary based on viewport
- Coordinate system: Top-left origin (0,0)

### Data Flow
1. Admin sets coordinates at /test/bounding-box
2. Coordinates are saved (localStorage or database)
3. Design editor at /design/new should read these coordinates
4. Canvas should render design within exact bounding box

## Possible Root Causes

### 1. Canvas Size Mismatch
```javascript
// Admin page might use:
canvas.width = 500;
canvas.height = 500;

// Design editor might use:
canvas.width = 600;
canvas.height = 600;
```

### 2. Scaling Issues
```javascript
// If canvases are different sizes, coordinates need scaling:
const scaleRatio = editorCanvas.width / adminCanvas.width;
const scaledX = adminX * scaleRatio;
const scaledY = adminY * scaleRatio;
```

### 3. Context Transform Differences
```javascript
// One page might apply transforms:
ctx.scale(2, 2);
ctx.translate(50, 50);
// While the other doesn't
```

### 4. Storage/Retrieval Issues
- Coordinates might be saved in one format but read in another
- Unit conversion issues (pixels vs percentages)
- Rounding errors during save/load

### 5. Print Area Data Structure
```javascript
// Might be stored differently:
printAreas = {
  'tee': { x: 200, y: 150, width: 200, height: 250 }
}

// vs relative coordinates:
printAreas = {
  'tee': { x: 0.33, y: 0.25, width: 0.33, height: 0.42 }
}
```

## Questions for Investigation

1. **Canvas Sizes**: What are the exact canvas dimensions on each page?
2. **Coordinate Systems**: Are both using the same origin point and direction?
3. **Storage Format**: How are coordinates stored and retrieved?
4. **Scaling Logic**: Is there any scaling/transformation applied?
5. **Print Area Source**: Where does each page get its print area data?

## Debugging Steps

### 1. Check Canvas Sizes
```javascript
// On both pages, log:
console.log('Canvas size:', canvas.width, 'x', canvas.height);
console.log('Display size:', canvas.offsetWidth, 'x', canvas.offsetHeight);
```

### 2. Log Coordinates
```javascript
// When saving in admin:
console.log('Saving coordinates:', printArea);

// When loading in editor:
console.log('Loading coordinates:', printArea);
```

### 3. Test Simple Case
```javascript
// Set a known coordinate in admin:
{ x: 100, y: 100, width: 200, height: 200 }

// Check what appears in editor
```

## Potential Solutions

### Solution 1: Normalize Coordinates
Always use relative coordinates (0-1 range) and scale based on canvas size:
```javascript
// Save as relative:
const relativeX = x / canvas.width;
const relativeY = y / canvas.height;

// Load and scale:
const actualX = relativeX * canvas.width;
const actualY = relativeY * canvas.height;
```

### Solution 2: Enforce Same Canvas Size
Make both pages use identical canvas dimensions:
```javascript
const STANDARD_CANVAS_SIZE = 600;
canvas.width = STANDARD_CANVAS_SIZE;
canvas.height = STANDARD_CANVAS_SIZE;
```

### Solution 3: Create Shared Module
```javascript
// shared/printAreaManager.js
export const getPrintArea = (productId) => {
  // Centralized logic for getting print areas
};

export const savePrintArea = (productId, coordinates) => {
  // Centralized logic for saving print areas
};
```

### Solution 4: Add Coordinate Translation Layer
```javascript
const translateCoordinates = (coords, fromCanvas, toCanvas) => {
  const scaleX = toCanvas.width / fromCanvas.width;
  const scaleY = toCanvas.height / fromCanvas.height;
  
  return {
    x: coords.x * scaleX,
    y: coords.y * scaleY,
    width: coords.width * scaleX,
    height: coords.height * scaleY
  };
};
```

## Required Information

To properly diagnose and fix this issue, we need:

1. **Exact canvas dimensions** on both pages
2. **Sample coordinate data** from admin tool
3. **How coordinates are stored** (localStorage, API, etc.)
4. **Any transformation/scaling code** applied to coordinates
5. **The data structure** used for print areas

## Expected Fix

The fix should ensure:
1. Coordinates set in admin match exactly in editor
2. Design placement is consistent across all products
3. Print areas are accurately defined for production
4. No manual adjustment needed after setting coordinates

## Testing Checklist

- [ ] Set coordinates in admin for a product
- [ ] Load same product in design editor
- [ ] Verify bounding box appears in exact same position
- [ ] Test with different canvas sizes/viewports
- [ ] Ensure design stays within defined print area
- [ ] Test all product types (tee, hoodie, etc.)