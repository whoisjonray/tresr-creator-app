# Multi-Color Garment Images System

## Current Architecture

The Product Template Manager currently supports a single set of images (front/back/thumbnail) per product template. This is suitable for simple products but doesn't handle color variations.

## How Multi-Color Support Would Work

### Option 1: Color-Specific Images (Recommended)
Store images per color variant in the template structure:

```javascript
template: {
  id: 'tee',
  name: 'T-Shirt',
  // Default images (fallback)
  frontImage: 'default-front.png',
  backImage: 'default-back.png',
  
  // Color-specific images
  colorImages: {
    'Black': {
      front: 'tee-black-front.png',
      back: 'tee-black-back.png',
      thumbnail: 'tee-black-thumb.png'
    },
    'White': {
      front: 'tee-white-front.png',
      back: 'tee-white-back.png',
      thumbnail: 'tee-white-thumb.png'
    },
    'Navy': {
      front: 'tee-navy-front.png',
      back: 'tee-navy-back.png',
      thumbnail: 'tee-navy-thumb.png'
    }
  }
}
```

### Option 2: Use Existing Cloudinary Structure
The system already has garment images in Cloudinary following this pattern:
- `{garmentType}_{color}_{side}.png`
- Example: `tee_white_front.png`, `tee_black_back.png`

These are accessible via:
```javascript
import { getGarmentImage } from '../config/garmentImagesCloudinary';

const imageUrl = getGarmentImage('tee', 'white', 'front');
```

### Option 3: Dynamic Color Tinting
Use a white base garment and apply CSS filters or Canvas manipulation to tint the color dynamically. This works well for solid colors but not for patterns or complex textures.

## Implementation Steps for Multi-Color Support

### 1. Update Template Structure
```javascript
// In defaultProductTemplates.js
{
  id: 'tee',
  name: 'T-Shirt',
  colors: ['Black', 'White', 'Navy'],
  
  // Default images
  frontImage: null,
  backImage: null,
  
  // Color-specific images
  colorImages: {
    'Black': { front: null, back: null },
    'White': { front: null, back: null },
    'Navy': { front: null, back: null }
  }
}
```

### 2. Update UI to Handle Color Selection
```jsx
// In ProductTemplateManager.jsx
const [selectedUploadColor, setSelectedUploadColor] = useState('default');

// Show color selector when uploading
<select value={selectedUploadColor} onChange={e => setSelectedUploadColor(e.target.value)}>
  <option value="default">Default (All Colors)</option>
  {formData.colors.map(color => (
    <option key={color} value={color}>{color}</option>
  ))}
</select>

// Upload button for selected color
<button onClick={() => handleImageUpload(file, 'front', selectedUploadColor)}>
  Upload Front for {selectedUploadColor}
</button>
```

### 3. Update Backend Upload Handler
The backend already supports color-specific uploads:
```javascript
// In settings.js - already implemented
const publicId = color 
  ? `${templateId}-${imageType}-${color.toLowerCase().replace(/\s+/g, '-')}`
  : `${templateId}-${imageType}`;
```

### 4. Update Canvas Rendering
When rendering, check for color-specific image first, then fall back to default:
```javascript
const getImageForColor = (template, color, side) => {
  // Check color-specific first
  if (template.colorImages?.[color]?.[side]) {
    return template.colorImages[color][side];
  }
  
  // Fall back to default
  return template[`${side}Image`];
  
  // Or use Cloudinary helper
  return getGarmentImage(template.id, color.toLowerCase(), side);
};
```

## Quick Solution Using Existing System

Since the Cloudinary images already exist with the correct naming pattern, the quickest solution is:

1. **Don't store images in templates** - Leave them null
2. **Use the existing Cloudinary helper** - It already handles the color/side logic
3. **Only store custom uploads** - When users upload custom garments

```javascript
// In your Canvas or design editor
const garmentImage = customTemplate.frontImage || getGarmentImage(garmentType, color, 'front');
```

This way you get multi-color support immediately without needing to upload all variations.

## Current Cloudinary Garment Images

The system already has these images uploaded:
- All standard garments (tee, boxy, polo, etc.)
- Multiple colors per garment
- Front and back views
- Accessible via: `https://res.cloudinary.com/dqslerzk9/image/upload/garments/{type}_{color}_{side}.png`

## Recommendation

For immediate use:
1. Use the existing Cloudinary garment images via `getGarmentImage()`
2. Only use the Product Template Manager for truly custom products (like NFT cards)
3. Store only the custom uploaded images in the template

For full implementation:
1. Add color selector to upload UI
2. Store images in `colorImages` structure
3. Update rendering logic to check color-specific first
4. Fall back to default images or Cloudinary helpers