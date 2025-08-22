/**
 * Fulfillment Routes
 * Handles order processing and sending to YoPrint
 */

const express = require('express');
const router = express.Router();
const yoprintIntegration = require('../services/yoprintIntegration');
const printCoordinateConverter = require('../utils/printCoordinateConverter');

/**
 * Webhook endpoint for Shopify order creation
 * POST /api/fulfillment/webhook/order-created
 */
router.post('/webhook/order-created', async (req, res) => {
  try {
    // Verify webhook (implement HMAC verification for production)
    const shopifyOrder = req.body;
    
    console.log('Received order webhook:', shopifyOrder.order_number);
    
    // Transform order for YoPrint
    const yoPrintOrder = await yoprintIntegration.transformOrder(shopifyOrder);
    
    // Validate order
    const validation = yoprintIntegration.validateOrder(yoPrintOrder);
    if (!validation.isValid) {
      console.error('Order validation failed:', validation.errors);
      return res.status(400).json({
        success: false,
        errors: validation.errors
      });
    }
    
    // Log warnings if any
    if (validation.warnings.length > 0) {
      console.warn('Order warnings:', validation.warnings);
    }
    
    // Send to YoPrint (try API first, fallback to Zapier)
    let result;
    if (process.env.YOPRINT_API_KEY) {
      result = await yoprintIntegration.sendToYoPrintAPI(yoPrintOrder);
    } else if (process.env.YOPRINT_ZAPIER_WEBHOOK) {
      result = await yoprintIntegration.sendToZapier(yoPrintOrder);
    } else {
      throw new Error('No YoPrint integration configured');
    }
    
    console.log('Order sent to fulfillment:', result);
    
    res.json({
      success: true,
      message: 'Order processed for fulfillment',
      order_number: shopifyOrder.order_number,
      fulfillment_result: result
    });
    
  } catch (error) {
    console.error('Fulfillment webhook error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Test endpoint to validate print coordinates
 * POST /api/fulfillment/test/coordinates
 */
router.post('/test/coordinates', (req, res) => {
  try {
    const { canvasCoords } = req.body;
    
    if (!canvasCoords) {
      return res.status(400).json({
        success: false,
        error: 'Canvas coordinates required'
      });
    }
    
    // Convert coordinates
    const printCoords = printCoordinateConverter.canvasToPrint(canvasCoords);
    
    // Validate print area
    const validation = printCoordinateConverter.validatePrintArea(canvasCoords);
    
    res.json({
      success: true,
      canvas_coordinates: canvasCoords,
      print_coordinates: printCoords,
      validation: validation
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Generate sample fulfillment data for testing
 * POST /api/fulfillment/test/generate-sample
 */
router.post('/test/generate-sample', (req, res) => {
  try {
    const {
      designUrl = 'https://example.com/design.png',
      productType = 'tee',
      garmentColor = 'Black',
      size = 'L',
      canvasCoords = { x: 160, y: 125, width: 280, height: 350 }
    } = req.body;
    
    // Format for fulfillment
    const fulfillmentData = printCoordinateConverter.formatForFulfillment(
      canvasCoords,
      designUrl,
      {
        type: productType,
        color: garmentColor,
        size: size,
        printSide: 'front'
      }
    );
    
    res.json({
      success: true,
      sample_data: fulfillmentData,
      yoprint_format: {
        order_id: 'TEST-001',
        items: [{
          sku: `${productType}-${garmentColor}-${size}`,
          quantity: 1,
          print_specs: fulfillmentData
        }]
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get optimal print size for a design
 * POST /api/fulfillment/optimal-size
 */
router.post('/optimal-size', (req, res) => {
  try {
    const { designWidth, designHeight, maxCoverage = 0.8 } = req.body;
    
    if (!designWidth || !designHeight) {
      return res.status(400).json({
        success: false,
        error: 'Design dimensions required'
      });
    }
    
    const optimalSize = printCoordinateConverter.getOptimalPrintSize(
      { width: designWidth, height: designHeight },
      maxCoverage
    );
    
    res.json({
      success: true,
      original_dimensions: {
        width: designWidth,
        height: designHeight
      },
      optimal_placement: optimalSize,
      platen_info: {
        size: '16x20 inches',
        dpi: 300,
        pixels: '4800x6000'
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Process manual fulfillment request
 * POST /api/fulfillment/manual
 */
router.post('/manual', async (req, res) => {
  try {
    const { orderId, items } = req.body;
    
    if (!orderId || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Order ID and items required'
      });
    }
    
    // Create YoPrint order format
    const yoPrintOrder = {
      order_id: orderId,
      order_number: `MANUAL-${orderId}`,
      created_at: new Date().toISOString(),
      items: items.map(item => {
        const printCoords = printCoordinateConverter.canvasToPrint(item.canvasCoords);
        
        return {
          sku: item.sku,
          product_name: item.productName,
          quantity: item.quantity,
          print_specs: {
            design_url: item.designUrl,
            garment: {
              type: item.productType,
              color: item.garmentColor,
              size: item.size
            },
            placement: {
              side: item.printSide || 'front',
              position_inches: printCoords.inches,
              position_pixels_300dpi: printCoords.pixels_300dpi,
              center_point: printCoords.center
            },
            instructions: {
              print_method: 'DTG',
              platen_size: '16x20',
              dpi: 300
            }
          }
        };
      })
    };
    
    // Send to fulfillment
    let result;
    if (process.env.YOPRINT_ZAPIER_WEBHOOK) {
      result = await yoprintIntegration.sendToZapier(yoPrintOrder);
    } else {
      // For testing, just return the formatted data
      result = {
        success: true,
        message: 'Test mode - order formatted but not sent',
        formatted_order: yoPrintOrder
      };
    }
    
    res.json({
      success: true,
      result: result
    });
    
  } catch (error) {
    console.error('Manual fulfillment error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Health check endpoint
 * GET /api/fulfillment/health
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'Fulfillment service operational',
    integrations: {
      yoprint_api: !!process.env.YOPRINT_API_KEY,
      zapier_webhook: !!process.env.YOPRINT_ZAPIER_WEBHOOK
    },
    platen: {
      size: '16x20 inches',
      dpi: 300,
      pixels: '4800x6000'
    }
  });
});

module.exports = router;