# TRESR Print Fulfillment Integration

## Overview
Complete print fulfillment system for integrating TRESR creator app with YoPrint print shop management system. Handles coordinate conversion from 600x600px canvas to 16x20 inch DTG platen at 300 DPI.

## System Architecture

### Coordinate Conversion
- **Canvas**: 600x600 pixels (design editor)
- **Print Platen**: 16x20 inches
- **Print Resolution**: 300 DPI (4800x6000 pixels)
- **Conversion Factor**: 16/600 for inches

### Key Components

#### 1. Print Coordinate Converter (`/server/utils/printCoordinateConverter.js`)
- Converts canvas coordinates to print coordinates
- Calculates optimal print size maintaining aspect ratio
- Validates print area coverage
- Formats data for fulfillment systems

#### 2. YoPrint Integration Service (`/server/services/yoprintIntegration.js`)
- Transforms Shopify orders to YoPrint format
- Extracts print data from order metafields
- Supports both API (future) and Zapier webhook (current)
- Validates orders before sending to fulfillment

#### 3. Coffee Mug Convex Effect (`/client/src/utils/mugConvexEffect.js`)
- Creates cylindrical warp effect for mug display
- Preserves flat version for printing
- Uses vertical strip rendering for smooth curves
- Supports 3.5" x 3.5" print area for 11oz mugs

#### 4. Fulfillment Routes (`/server/routes/fulfillment.js`)
**Endpoints:**
- `POST /api/fulfillment/webhook/order-created` - Shopify order webhook
- `POST /api/fulfillment/test/coordinates` - Test coordinate conversion
- `POST /api/fulfillment/test/generate-sample` - Generate sample data
- `POST /api/fulfillment/optimal-size` - Calculate optimal print size
- `POST /api/fulfillment/manual` - Process manual fulfillment
- `GET /api/fulfillment/health` - Service health check

## Data Flow

### 1. Design Creation
```javascript
// Canvas position from design editor
{
  x: 160,      // pixels from left
  y: 125,      // pixels from top
  width: 280,  // design width in pixels
  height: 350  // design height in pixels
}
```

### 2. Coordinate Conversion
```javascript
// Converted to print coordinates
{
  inches: {
    x: 4.27,
    y: 4.17,
    width: 7.47,
    height: 11.67
  },
  pixels_300dpi: {
    x: 1280,
    y: 1250,
    width: 2240,
    height: 3500
  },
  center: {
    x_inches: 8.0,
    y_inches: 10.0
  }
}
```

### 3. Fulfillment Format
```javascript
{
  design: {
    url: "https://cloudinary.com/design.png",
    format: "PNG",
    dpi: 300
  },
  placement: {
    side: "front",
    coordinates_inches: {...},
    coordinates_pixels: {...},
    center_point: {...}
  },
  product: {
    type: "tee",
    color: "Black",
    size: "L"
  },
  instructions: {
    print_method: "DTG",
    platen_size: "16x20",
    dpi: 300
  }
}
```

## YoPrint Integration

### Current: Zapier Webhook
1. Set `YOPRINT_ZAPIER_WEBHOOK` in `.env`
2. Shopify order webhook triggers `/api/fulfillment/webhook/order-created`
3. Order transforms to YoPrint format
4. Sends to Zapier webhook
5. Zapier creates order in YoPrint

### Future: Direct API (V2)
When YoPrint releases API V2:
1. Set `YOPRINT_API_KEY` in `.env`
2. System automatically uses API instead of Zapier
3. Direct order creation in YoPrint

## Shopify Integration

### Order Metafields
Add print data to line items during checkout:
```javascript
lineItem.properties = [{
  name: 'print_data',
  value: JSON.stringify({
    design_url: 'https://...',
    design_name: 'Just Grok It',
    placement: {
      canvas_coords: {x, y, width, height},
      print_side: 'front'
    },
    product_type: 'tee',
    garment_color: 'Black'
  })
}]
```

### Webhook Setup
1. Create webhook in Shopify Admin
2. Topic: `orders/create`
3. URL: `https://creators.tresr.com/api/fulfillment/webhook/order-created`
4. Format: JSON

## Testing

### Test Script
Run `node scripts/test-fulfillment-flow.js` to test:
- Coordinate conversion
- Sample data generation
- Optimal size calculation
- Manual order processing
- Service health check

### Manual Testing
```bash
# Test coordinate conversion
curl -X POST http://localhost:3002/api/fulfillment/test/coordinates \
  -H "Content-Type: application/json" \
  -d '{"canvasCoords": {"x": 160, "y": 125, "width": 280, "height": 350}}'

# Generate sample fulfillment data
curl -X POST http://localhost:3002/api/fulfillment/test/generate-sample \
  -H "Content-Type: application/json" \
  -d '{
    "designUrl": "https://example.com/design.png",
    "productType": "tee",
    "garmentColor": "Black",
    "size": "L",
    "canvasCoords": {"x": 160, "y": 125, "width": 280, "height": 350}
  }'
```

## Coffee Mug Special Handling

### Display vs Print
- **Display**: Convex warped effect using vertical strips
- **Print**: Flat unwrapped design for sublimation
- **Print Area**: 3.5" x 3.5" standard for 11oz mugs
- **Wrap**: 85% of circumference coverage

### Usage
```javascript
import mugConvexEffect from './utils/mugConvexEffect';

// Create mockup with convex effect
const mockup = mugConvexEffect.createMugMockup(designImage, position);

// Display version (warped)
canvas.drawImage(mockup.display.canvas, 0, 0);

// Print version (flat)
sendToPrint(mockup.print.dataUrl);
```

## Environment Variables

Add to `.env`:
```env
# YoPrint Integration (choose one)
YOPRINT_ZAPIER_WEBHOOK=https://hooks.zapier.com/hooks/catch/...
YOPRINT_API_KEY=your_api_key_when_v2_releases
YOPRINT_API_URL=https://api.yoprint.com/v2
```

## Production Deployment

1. **Set environment variables** in Railway/production
2. **Configure Shopify webhooks** for order.created
3. **Add print_data** to product creation flow
4. **Test with sample orders** before going live
5. **Monitor fulfillment** through YoPrint dashboard

## Troubleshooting

### Common Issues

**Coordinates out of bounds:**
- Ensure design fits within 600x600 canvas
- Validate with `/api/fulfillment/test/coordinates`

**Missing print data:**
- Check line item properties in Shopify order
- Verify metafields are being saved during product creation

**Webhook not firing:**
- Verify webhook URL in Shopify admin
- Check webhook notifications for errors
- Ensure CORS is configured for webhook endpoint

## Next Steps

1. ✅ Coordinate conversion system
2. ✅ YoPrint integration structure  
3. ✅ Coffee mug convex effect
4. ✅ Fulfillment endpoints
5. ⏳ Configure Zapier webhook
6. ⏳ Set up Shopify webhooks
7. ⏳ Add print_data to products
8. ⏳ Production testing