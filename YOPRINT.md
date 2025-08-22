# YoPrint Integration - TRESR Print Fulfillment System

## Overview
Complete print-on-demand fulfillment integration between TRESR creator app and YoPrint print shop management system. This system handles the entire workflow from design creation to physical product printing on a 16x20 inch DTG platen.

## Quick Reference
- **Canvas Size**: 600x600 pixels (design editor)
- **Print Platen**: 16x20 inches at 300 DPI (4800x6000 pixels)
- **Conversion Factor**: 16/600 = 0.0267 inches per pixel
- **YoPrint Integration**: Currently via Zapier webhook, API V2 coming soon

## System Components

### 1. Coordinate Conversion System
**Location**: `/server/utils/printCoordinateConverter.js`

Converts design positions from the 600x600px canvas to physical print coordinates:
```javascript
// Input (Canvas)
{
  x: 160,      // pixels from left
  y: 125,      // pixels from top  
  width: 280,  // design width
  height: 350  // design height
}

// Output (Print)
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
  center_point: {
    x_inches: 8.0,    // Center X on platen
    y_inches: 10.0    // Center Y on platen
  }
}
```

### 2. YoPrint Integration Service
**Location**: `/server/services/yoprintIntegration.js`

Handles order transformation and communication:
- Transforms Shopify orders to YoPrint format
- Extracts print data from order metafields
- Validates print area and placement
- Determines pretreatment requirements based on garment color
- Supports both Zapier webhook (current) and direct API (future)

### 3. Coffee Mug Special Handling
**Location**: `/client/src/utils/mugConvexEffect.js`

Creates two versions of mug designs:
- **Display Version**: Convex cylindrical warp effect using vertical strip rendering
- **Print Version**: Flat unwrapped design for sublimation printing
- **Print Area**: 3.5" x 3.5" for standard 11oz mugs
- **Wrap Coverage**: 85% of mug circumference

### 4. Fulfillment API Endpoints
**Base URL**: `/api/fulfillment`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/webhook/order-created` | POST | Receives Shopify order webhooks |
| `/test/coordinates` | POST | Test coordinate conversion |
| `/test/generate-sample` | POST | Generate sample fulfillment data |
| `/optimal-size` | POST | Calculate optimal print size |
| `/manual` | POST | Process manual fulfillment orders |
| `/health` | GET | Check service status |

## Data Flow Architecture

### Step 1: Design Creation in Editor
User positions design on garment in the canvas editor:
```javascript
// Design positioning data
{
  designUrl: "https://res.cloudinary.com/dqslerzk9/image/upload/design.png",
  canvasPosition: {
    x: 160,
    y: 125,
    width: 280,
    height: 350
  },
  productType: "tee",
  garmentColor: "Black"
}
```

### Step 2: Product Creation with Print Data
When creating Shopify product, embed print data in metafields:
```javascript
// Add to product metafields
product.metafields = [{
  namespace: "tresr",
  key: "print_data",
  value: JSON.stringify({
    design_url: designUrl,
    design_name: "Just Grok It",
    creator: "Creator Name",
    placement: {
      canvas_coords: canvasPosition,
      print_side: "front"
    }
  }),
  type: "json"
}];
```

### Step 3: Order Processing
When order is placed, Shopify webhook triggers fulfillment:
```javascript
// Shopify order webhook payload
{
  id: "5547293868349",
  order_number: "1234",
  line_items: [{
    sku: "TRESR-TEE-BLACK-L",
    quantity: 1,
    properties: [{
      name: "print_data",
      value: "{...print data JSON...}"
    }]
  }]
}
```

### Step 4: YoPrint Format
Order transforms to YoPrint-compatible format:
```javascript
{
  order_id: "SHOP-1234",
  order_number: "1234",
  created_at: "2025-01-22T10:00:00Z",
  customer: {
    name: "John Doe",
    email: "john@example.com",
    phone: "555-0123"
  },
  shipping_address: {
    address1: "123 Main St",
    city: "Austin",
    state: "TX",
    zip: "78701"
  },
  items: [{
    sku: "TRESR-TEE-BLACK-L",
    product_name: "Just Grok It T-Shirt",
    quantity: 1,
    print_specs: {
      design_url: "https://res.cloudinary.com/...",
      garment: {
        type: "tee",
        color: "Black",
        size: "L"
      },
      placement: {
        side: "front",
        position_inches: {
          x: "4.27",
          y: "4.17",
          width: "7.47",
          height: "11.67"
        },
        position_pixels_300dpi: {
          x: 1280,
          y: 1250,
          width: 2240,
          height: 3500
        },
        center_point: {
          x_inches: "8.00",
          y_inches: "10.00"
        }
      },
      instructions: {
        print_method: "DTG",
        platen_size: "16x20",
        dpi: 300,
        pretreatment: true,  // Auto-determined by color
        color_profile: "CMYK"
      }
    }
  }]
}
```

## Integration Methods

### Current: Zapier Webhook Integration
Since YoPrint doesn't have a public API yet, we use Zapier:

1. **Configure Zapier Zap**:
   - Trigger: Webhooks by Zapier (Catch Hook)
   - Action: YoPrint (Create Order)
   - Map fields from our JSON to YoPrint fields

2. **Add Webhook URL to .env**:
   ```env
   YOPRINT_ZAPIER_WEBHOOK=https://hooks.zapier.com/hooks/catch/123456/abcdef/
   ```

3. **Test Integration**:
   ```bash
   # Send test order to Zapier
   curl -X POST http://localhost:3002/api/fulfillment/manual \
     -H "Content-Type: application/json" \
     -d '{
       "orderId": "TEST-001",
       "items": [{
         "sku": "TEST-SKU",
         "productName": "Test Product",
         "quantity": 1,
         "designUrl": "https://example.com/design.png",
         "canvasCoords": {"x": 160, "y": 125, "width": 280, "height": 350},
         "productType": "tee",
         "garmentColor": "Black",
         "size": "L"
       }]
     }'
   ```

### Future: Direct API Integration (V2)
When YoPrint releases their API V2:

1. **Update .env**:
   ```env
   YOPRINT_API_KEY=your_api_key_here
   YOPRINT_API_URL=https://api.yoprint.com/v2
   ```

2. **System Auto-Switches**: Code automatically uses API when key is present

## Shopify Setup

### 1. Create Webhook
In Shopify Admin → Settings → Notifications → Webhooks:
- **Event**: Order creation
- **Format**: JSON
- **URL**: `https://creators.tresr.com/api/fulfillment/webhook/order-created`

### 2. Add Print Data to Products
During product creation, include print data:
```javascript
// In product creation flow
const productData = {
  title: "Design Name - T-Shirt",
  vendor: "Creator Name",
  metafields: [{
    namespace: "tresr",
    key: "print_data",
    value: JSON.stringify({
      design_url: cloudinaryUrl,
      placement: canvasCoords,
      print_side: "front"
    }),
    type: "json"
  }]
};
```

### 3. Line Item Properties
Alternative: Add print data during checkout:
```javascript
// Add to cart with properties
cart.add({
  id: variantId,
  quantity: 1,
  properties: {
    print_data: JSON.stringify(printData)
  }
});
```

## Testing Tools

### Test Script
**Location**: `/scripts/test-fulfillment-flow.js`

Run complete fulfillment test:
```bash
node scripts/test-fulfillment-flow.js
```

Tests:
- ✅ Coordinate conversion accuracy
- ✅ Fulfillment data formatting
- ✅ Optimal size calculation
- ✅ Manual order processing
- ✅ Service health status

### Manual Testing Endpoints

**Test Coordinate Conversion**:
```bash
curl -X POST http://localhost:3002/api/fulfillment/test/coordinates \
  -H "Content-Type: application/json" \
  -d '{"canvasCoords": {"x": 160, "y": 125, "width": 280, "height": 350}}'
```

**Generate Sample Data**:
```bash
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

**Check Service Health**:
```bash
curl http://localhost:3002/api/fulfillment/health
```

## Print Specifications

### DTG (Direct-to-Garment) Settings
- **Platen Size**: 16x20 inches
- **Resolution**: 300 DPI
- **Color Mode**: CMYK
- **File Format**: PNG (for transparency)
- **Pretreatment**: Required for dark garments (black, navy, dark grey)

### Garment-Specific Settings

**T-Shirts & Hoodies**:
- Print Method: DTG
- Max Print Area: 12.8" x 16" (80% of platen)
- Centered placement recommended

**Coffee Mugs**:
- Print Method: Sublimation
- Print Area: 3.5" x 3.5"
- Wrap: 85% circumference
- Substrate: Ceramic with polymer coating
- Color Profile: sRGB

## Validation Rules

### Print Area Validation
- Design must fit within platen boundaries
- Warning if coverage > 90% of platen
- Error if design extends beyond platen

### Coordinate Validation
```javascript
// Valid placement
{
  x: 0-600,      // Must be within canvas
  y: 0-600,      // Must be within canvas
  width: 1-600,  // Must have positive width
  height: 1-600  // Must have positive height
}
```

### Order Validation
- Order must have ID
- Items must have design URL
- Items must have print coordinates
- Garment info (type, color, size) required

## Troubleshooting

### Common Issues & Solutions

**Issue**: Coordinates out of bounds
- **Solution**: Ensure design fits within 600x600 canvas
- **Test**: Use `/api/fulfillment/test/coordinates` endpoint

**Issue**: Missing print data in order
- **Solution**: Check product metafields or line item properties
- **Verify**: Print data is saved during product creation

**Issue**: Webhook not triggering
- **Solution**: Verify webhook URL in Shopify admin
- **Check**: Webhook notification logs for errors

**Issue**: Pretreatment not specified
- **Solution**: System auto-detects based on garment color
- **Dark colors**: Automatically set pretreatment: true

**Issue**: Design too large for platen
- **Solution**: Use optimal size calculation endpoint
- **API**: POST `/api/fulfillment/optimal-size`

## Production Checklist

- [ ] Configure `YOPRINT_ZAPIER_WEBHOOK` in production .env
- [ ] Set up Shopify order.created webhook
- [ ] Add print_data to product creation flow
- [ ] Test with sample order
- [ ] Verify coordinate conversion accuracy
- [ ] Confirm Zapier zap is active
- [ ] Monitor first real orders
- [ ] Document any custom requirements

## Cost Analysis

### Current Costs
- **YoPrint**: Subscription cost (varies by plan)
- **Zapier**: Free tier (100 tasks/month) or paid plan
- **Cloudinary**: Image hosting (free tier available)

### Future Savings
- **Direct API**: Eliminates Zapier costs
- **Batch Processing**: Reduce API calls
- **Caching**: Store converted coordinates

## Support & Resources

### YoPrint
- Website: https://www.yoprint.com/
- Support: Contact through their platform
- API V2: Coming soon (check for updates)

### Our System
- Test Script: `/scripts/test-fulfillment-flow.js`
- Documentation: `/docs/print-fulfillment-integration.md`
- Health Check: `GET /api/fulfillment/health`

## Next Steps

1. **Immediate** (To make it work):
   - Set up Zapier zap for YoPrint
   - Add webhook URL to .env
   - Configure Shopify webhook

2. **Short-term** (Optimization):
   - Add print_data to all products
   - Implement batch order processing
   - Add order status tracking

3. **Long-term** (When API available):
   - Integrate YoPrint API V2
   - Add real-time order status
   - Implement automatic reprints

---

*Last Updated: January 22, 2025*
*System Version: 1.0.0*
*Ready for: Zapier Integration*
*Pending: YoPrint API V2*