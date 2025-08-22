/**
 * Test Fulfillment Flow
 * Simulates the complete workflow from design positioning to print fulfillment
 */

const axios = require('axios');

const API_URL = 'http://localhost:3002';

// Sample design data (simulating what would come from the design editor)
const designData = {
  designUrl: 'https://res.cloudinary.com/dqslerzk9/image/upload/v1755883303/designs/just-grok-it.png',
  designName: 'Just Grok It',
  creator: 'Test Creator',
  canvasPosition: {
    x: 160,
    y: 125,
    width: 280,
    height: 350
  }
};

// Sample order data (simulating a Shopify order)
const orderData = {
  orderId: 'SHOP-12345',
  customerName: 'John Doe',
  customerEmail: 'john@example.com',
  items: [
    {
      sku: 'TRESR-TEE-BLACK-L',
      productName: 'Just Grok It T-Shirt',
      productType: 'tee',
      garmentColor: 'Black',
      size: 'L',
      quantity: 1,
      designUrl: designData.designUrl,
      canvasCoords: designData.canvasPosition,
      printSide: 'front'
    },
    {
      sku: 'TRESR-HOODIE-NAVY-XL',
      productName: 'Just Grok It Hoodie',
      productType: 'hoodie',
      garmentColor: 'Navy',
      size: 'XL',
      quantity: 1,
      designUrl: designData.designUrl,
      canvasCoords: designData.canvasPosition,
      printSide: 'front'
    }
  ]
};

async function testFulfillmentFlow() {
  console.log('🎯 Testing TRESR Fulfillment Flow\n');
  console.log('=====================================\n');

  try {
    // Step 1: Test coordinate conversion
    console.log('📐 Step 1: Testing Coordinate Conversion');
    console.log('Canvas coordinates:', designData.canvasPosition);
    
    const coordResponse = await axios.post(`${API_URL}/api/fulfillment/test/coordinates`, {
      canvasCoords: designData.canvasPosition
    });
    
    const printCoords = coordResponse.data.print_coordinates;
    console.log('✅ Converted to print coordinates:');
    console.log(`   - Inches: ${printCoords.inches.width.toFixed(2)}" x ${printCoords.inches.height.toFixed(2)}"`);
    console.log(`   - Pixels (300 DPI): ${printCoords.pixels_300dpi.width} x ${printCoords.pixels_300dpi.height}`);
    console.log(`   - Coverage: ${coordResponse.data.validation.coverage.percentage.toFixed(1)}% of platen\n`);

    // Step 2: Generate sample fulfillment data
    console.log('📋 Step 2: Generating Fulfillment Data');
    
    const sampleResponse = await axios.post(`${API_URL}/api/fulfillment/test/generate-sample`, {
      designUrl: designData.designUrl,
      productType: 'tee',
      garmentColor: 'Black',
      size: 'L',
      canvasCoords: designData.canvasPosition
    });
    
    console.log('✅ Sample fulfillment data generated');
    console.log('   YoPrint format ready for transmission\n');

    // Step 3: Test optimal print size calculation
    console.log('📏 Step 3: Calculating Optimal Print Size');
    
    const optimalResponse = await axios.post(`${API_URL}/api/fulfillment/optimal-size`, {
      designWidth: designData.canvasPosition.width,
      designHeight: designData.canvasPosition.height,
      maxCoverage: 0.8
    });
    
    console.log('✅ Optimal placement calculated:');
    console.log(`   - Recommended size: ${optimalResponse.data.optimal_placement.inches.width.toFixed(2)}" x ${optimalResponse.data.optimal_placement.inches.height.toFixed(2)}"`);
    console.log(`   - Centered at: (${optimalResponse.data.optimal_placement.inches.x.toFixed(2)}", ${optimalResponse.data.optimal_placement.inches.y.toFixed(2)}")\n`);

    // Step 4: Process manual fulfillment order
    console.log('📦 Step 4: Processing Manual Fulfillment Order');
    console.log(`   Order ID: ${orderData.orderId}`);
    console.log(`   Items: ${orderData.items.length} products`);
    
    const manualResponse = await axios.post(`${API_URL}/api/fulfillment/manual`, orderData);
    
    console.log('✅ Order processed for fulfillment');
    console.log('   Status:', manualResponse.data.result.message);
    
    // Display formatted order
    if (manualResponse.data.result.formatted_order) {
      const order = manualResponse.data.result.formatted_order;
      console.log('\n📄 Formatted Order for YoPrint:');
      console.log('   ================================');
      order.items.forEach((item, index) => {
        console.log(`\n   Item ${index + 1}: ${item.product_name}`);
        console.log(`   - SKU: ${item.sku}`);
        console.log(`   - Quantity: ${item.quantity}`);
        console.log(`   - Print Method: ${item.print_specs.instructions.print_method}`);
        console.log(`   - Position: ${item.print_specs.placement.position_inches.x.toFixed(2)}", ${item.print_specs.placement.position_inches.y.toFixed(2)}"`);
        console.log(`   - Size: ${item.print_specs.placement.position_inches.width.toFixed(2)}" x ${item.print_specs.placement.position_inches.height.toFixed(2)}"`);
      });
    }

    // Step 5: Check health status
    console.log('\n🏥 Step 5: Checking Fulfillment Service Health');
    
    const healthResponse = await axios.get(`${API_URL}/api/fulfillment/health`);
    
    console.log('✅ Service Status:', healthResponse.data.status);
    console.log('   Platen:', healthResponse.data.platen.size, `@ ${healthResponse.data.platen.dpi} DPI`);
    console.log('   YoPrint API:', healthResponse.data.integrations.yoprint_api ? 'Connected' : 'Not configured');
    console.log('   Zapier Webhook:', healthResponse.data.integrations.zapier_webhook ? 'Connected' : 'Not configured');

    console.log('\n=====================================');
    console.log('✨ Fulfillment Flow Test Complete!\n');
    
    console.log('📝 Summary:');
    console.log('   - Canvas to print coordinate conversion: ✅');
    console.log('   - Fulfillment data formatting: ✅');
    console.log('   - Optimal size calculation: ✅');
    console.log('   - Manual order processing: ✅');
    console.log('   - Service health check: ✅');
    
    console.log('\n🚀 Next Steps:');
    console.log('   1. Configure YOPRINT_ZAPIER_WEBHOOK in .env');
    console.log('   2. Set up Shopify webhook for order.created');
    console.log('   3. Add print_data to product metafields');
    console.log('   4. Test with real Shopify orders');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run the test
testFulfillmentFlow().catch(console.error);