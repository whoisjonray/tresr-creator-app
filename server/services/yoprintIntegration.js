/**
 * YoPrint Integration Service
 * Handles order data transformation and communication with YoPrint system
 */

const axios = require('axios');
const printCoordinateConverter = require('../utils/printCoordinateConverter');

class YoPrintIntegration {
  constructor() {
    // YoPrint API configuration (will be updated when V2 releases)
    this.apiUrl = process.env.YOPRINT_API_URL || 'https://api.yoprint.com/v2';
    this.apiKey = process.env.YOPRINT_API_KEY;
    
    // Zapier webhook for interim solution
    this.zapierWebhookUrl = process.env.YOPRINT_ZAPIER_WEBHOOK;
  }

  /**
   * Transform Shopify order to YoPrint format
   * @param {Object} shopifyOrder - Shopify order data
   * @returns {Object} YoPrint formatted order
   */
  async transformOrder(shopifyOrder) {
    const yoPrintOrder = {
      order_id: shopifyOrder.id,
      order_number: shopifyOrder.order_number,
      created_at: shopifyOrder.created_at,
      customer: {
        name: shopifyOrder.customer?.first_name + ' ' + shopifyOrder.customer?.last_name,
        email: shopifyOrder.customer?.email,
        phone: shopifyOrder.customer?.phone
      },
      shipping_address: this.formatAddress(shopifyOrder.shipping_address),
      items: []
    };

    // Process each line item
    for (const item of shopifyOrder.line_items) {
      const printData = await this.extractPrintData(item);
      if (printData) {
        yoPrintOrder.items.push(this.formatLineItem(item, printData));
      }
    }

    return yoPrintOrder;
  }

  /**
   * Extract print data from line item metafields or properties
   * @param {Object} lineItem - Shopify line item
   * @returns {Object} Print data
   */
  async extractPrintData(lineItem) {
    // Check for print data in different locations
    let printData = null;

    // Option 1: Line item properties (custom properties added during checkout)
    if (lineItem.properties) {
      const designData = lineItem.properties.find(p => p.name === 'print_data');
      if (designData) {
        printData = JSON.parse(designData.value);
      }
    }

    // Option 2: Product metafields (stored on the product)
    if (!printData && lineItem.product_id) {
      // This would require fetching the product metafields
      // Implement based on your Shopify setup
    }

    // Option 3: Variant metafields
    if (!printData && lineItem.variant_id) {
      // Fetch variant metafields if needed
    }

    return printData;
  }

  /**
   * Format line item for YoPrint
   * @param {Object} lineItem - Shopify line item
   * @param {Object} printData - Extracted print data
   * @returns {Object} Formatted item
   */
  formatLineItem(lineItem, printData) {
    // Convert canvas coordinates to print coordinates
    const printCoords = printCoordinateConverter.canvasToPrint(printData.placement.canvas_coords);
    
    return {
      sku: lineItem.sku,
      product_name: lineItem.name,
      variant_title: lineItem.variant_title,
      quantity: lineItem.quantity,
      price: lineItem.price,
      
      // Print specifications
      print_specs: {
        design_url: printData.design_url,
        design_name: printData.design_name || 'Custom Design',
        
        // Garment information
        garment: {
          type: printData.product_type,
          color: printData.garment_color,
          size: lineItem.variant_title, // Usually contains size
          brand: lineItem.vendor
        },
        
        // Print placement
        placement: {
          side: printData.print_side || 'front',
          
          // Coordinates in inches (what print shops typically use)
          position_inches: {
            x: printCoords.inches.x.toFixed(2),
            y: printCoords.inches.y.toFixed(2),
            width: printCoords.inches.width.toFixed(2),
            height: printCoords.inches.height.toFixed(2)
          },
          
          // Coordinates in pixels at 300 DPI (for digital systems)
          position_pixels_300dpi: printCoords.pixels_300dpi,
          
          // Center point (some systems prefer this)
          center_point: {
            x_inches: printCoords.center.x_inches.toFixed(2),
            y_inches: printCoords.center.y_inches.toFixed(2)
          }
        },
        
        // Print instructions
        instructions: {
          print_method: 'DTG',
          platen_size: '16x20',
          dpi: 300,
          color_profile: 'CMYK',
          pretreatment: this.requiresPretreatment(printData.garment_color),
          special_instructions: printData.special_instructions || ''
        }
      }
    };
  }

  /**
   * Send order to YoPrint via API (when V2 is available)
   * @param {Object} yoPrintOrder - Formatted order
   * @returns {Object} API response
   */
  async sendToYoPrintAPI(yoPrintOrder) {
    if (!this.apiKey) {
      throw new Error('YoPrint API key not configured');
    }

    try {
      const response = await axios.post(
        `${this.apiUrl}/orders`,
        yoPrintOrder,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        yoprint_order_id: response.data.id,
        status: response.data.status
      };
    } catch (error) {
      console.error('YoPrint API error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Send order to YoPrint via Zapier webhook (interim solution)
   * @param {Object} yoPrintOrder - Formatted order
   * @returns {Object} Webhook response
   */
  async sendToZapier(yoPrintOrder) {
    if (!this.zapierWebhookUrl) {
      throw new Error('Zapier webhook URL not configured');
    }

    try {
      const response = await axios.post(this.zapierWebhookUrl, yoPrintOrder);
      
      return {
        success: true,
        message: 'Order sent to YoPrint via Zapier',
        zapier_response: response.data
      };
    } catch (error) {
      console.error('Zapier webhook error:', error.message);
      throw error;
    }
  }

  /**
   * Format address for YoPrint
   * @param {Object} address - Shopify address
   * @returns {Object} Formatted address
   */
  formatAddress(address) {
    if (!address) return null;
    
    return {
      name: address.name,
      company: address.company,
      address1: address.address1,
      address2: address.address2,
      city: address.city,
      state: address.province_code,
      zip: address.zip,
      country: address.country_code,
      phone: address.phone
    };
  }

  /**
   * Determine if garment color requires pretreatment for DTG
   * @param {String} color - Garment color
   * @returns {Boolean} Requires pretreatment
   */
  requiresPretreatment(color) {
    const darkColors = ['black', 'navy', 'dark grey', 'charcoal', 'dark heather'];
    return darkColors.some(dark => color.toLowerCase().includes(dark));
  }

  /**
   * Generate print preview URL with coordinates overlay
   * @param {Object} printData - Print data with coordinates
   * @returns {String} Preview URL
   */
  generatePreviewUrl(printData) {
    // This could generate a preview showing the design placement on the garment
    // Useful for quality control before sending to production
    const coords = printCoordinateConverter.canvasToPrint(printData.placement.canvas_coords);
    
    // You could use Cloudinary transformations or another service
    // to generate a preview with coordinate overlay
    return `${printData.design_url}?overlay=coords&x=${coords.inches.x}&y=${coords.inches.y}`;
  }

  /**
   * Validate order before sending to fulfillment
   * @param {Object} order - YoPrint formatted order
   * @returns {Object} Validation result
   */
  validateOrder(order) {
    const errors = [];
    const warnings = [];

    // Check required fields
    if (!order.order_id) errors.push('Missing order ID');
    if (!order.items || order.items.length === 0) errors.push('No items in order');

    // Validate each item
    order.items.forEach((item, index) => {
      if (!item.print_specs?.design_url) {
        errors.push(`Item ${index + 1}: Missing design URL`);
      }
      
      if (!item.print_specs?.placement?.position_inches) {
        errors.push(`Item ${index + 1}: Missing print coordinates`);
      }

      // Validate print area
      if (item.print_specs?.placement?.canvas_coords) {
        const validation = printCoordinateConverter.validatePrintArea(
          item.print_specs.placement.canvas_coords
        );
        
        if (!validation.isValid) {
          errors.push(`Item ${index + 1}: ${validation.errors.join(', ')}`);
        }
        
        if (validation.coverage.percentage > 90) {
          warnings.push(`Item ${index + 1}: Design uses ${validation.coverage.percentage.toFixed(1)}% of print area`);
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

module.exports = new YoPrintIntegration();