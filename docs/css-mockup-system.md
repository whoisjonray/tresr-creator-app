# CSS-Based Mockup System

## Overview
Replace expensive API calls with CSS filters applied to base garment images.

## Cost Comparison
- **Dynamic Mockups API**: $500-2000+/month
- **CSS System**: ~$50/month hosting costs

## Technical Approach

### 1. Base Garment Images
Store one high-quality image per garment type:
- `classic-tee-base.png`
- `hoodie-base.png` 
- `mug-base.png`

### 2. Design Overlay
- Position design using CSS transforms
- Support drag/drop positioning
- Real-time preview updates

### 3. Color Variations via CSS Filters
```css
/* Black Shirt */
.garment-black { filter: brightness(0.3); }

/* Navy Shirt */  
.garment-navy { filter: hue-rotate(220deg) saturate(1.5) brightness(0.4); }

/* Red Shirt */
.garment-red { filter: hue-rotate(350deg) saturate(2) brightness(0.7); }
```

### 4. Color Accuracy
For precise colors, use multiple base images:
- `tshirt-light-base.png` (for bright colors)
- `tshirt-dark-base.png` (for dark colors)
- Apply targeted filters per base

## Implementation Benefits

1. **Instant Previews**: No API delays
2. **Zero Per-Generation Costs**: Unlimited mockups
3. **Offline Capable**: Works without internet
4. **Scalable**: Handles thousands of variants
5. **Customizable**: Full control over positioning/effects

## Shopify Integration

### Variant Structure
Instead of 1 product with 100+ variants, create:
- 1 Design Product (the artwork)
- Multiple Garment Products (t-shirt, hoodie, etc.)
- Link via metafields or collections

### Benefits
- Bypasses 100 variant limit
- Better SEO (separate product pages)
- Easier inventory management
- Cleaner customer experience

## Technical Implementation

### Frontend Components
```javascript
// MockupRenderer.jsx
const MockupRenderer = ({ garmentType, color, designImage, position }) => {
  return (
    <div className="mockup-container">
      <img 
        src={`/garments/${garmentType}-base.png`}
        className={`garment-base garment-${color.toLowerCase()}`}
      />
      <img 
        src={designImage}
        className="design-overlay"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${position.scale})`,
          position: 'absolute'
        }}
      />
    </div>
  );
};
```

### Color Filter Generator
```javascript
// Generate CSS filters for any hex color
const generateColorFilter = (targetHex) => {
  // Algorithm to convert hex to CSS filter values
  // Returns: "hue-rotate(45deg) saturate(1.2) brightness(0.8)"
};
```

## Admin Controls Needed

1. **Garment Template Manager**
   - Add/remove product types
   - Upload base images
   - Set positioning bounds

2. **Color System Manager**
   - Define available colors
   - Set CSS filter values
   - Preview color accuracy

3. **Design Constraints**
   - Min/max design sizes
   - Allowed positioning areas
   - Quality requirements

## Migration Strategy

### Phase 1: CSS System MVP
- Implement for 3 core products (tee, hoodie, mug)
- Create admin interface
- Test with real designs

### Phase 2: Replace Dynamic Mockups
- Switch creator tool to CSS system
- Maintain API fallback during transition
- Monitor cost savings

### Phase 3: Shopify Optimization
- Implement variant splitting strategy
- Optimize for SEO/UX
- Scale to all product types