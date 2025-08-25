const { chromium } = require('playwright');

async function debugCanvasIssue() {
  console.log('\n🔍 Debugging canvas issue on design/new...\n');
  
  let browser;
  try {
    browser = await chromium.connectOverCDP('http://localhost:9222');
    console.log('✅ Connected to existing Chrome session');
    
    const context = browser.contexts()[0];
    const page = await context.newPage();
    
    console.log('📐 Loading Design Editor page...');
    await page.goto('https://creators.tresr.com/design/new', { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });
    
    console.log('⏳ Waiting for page to stabilize...');
    await page.waitForTimeout(5000);
    
    // Debug: Check what canvas elements exist
    console.log('\n🔍 Searching for canvas elements...');
    
    // Try different selectors
    const selectors = [
      'canvas',
      'canvas.product-canvas',
      '.product-canvas',
      '#productCanvas',
      '[data-testid="product-canvas"]',
      '.canvas-container canvas',
      '.canvas-section canvas'
    ];
    
    for (const selector of selectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`  ✅ Found ${count} element(s) with selector: "${selector}"`);
        const element = await page.locator(selector).first();
        const box = await element.boundingBox();
        if (box) {
          console.log(`     Dimensions: ${box.width}x${box.height}`);
          console.log(`     Position: x=${box.x}, y=${box.y}`);
          const isSquare = Math.abs(box.width - box.height) < 2;
          console.log(`     Is square: ${isSquare ? '✅ YES' : '❌ NO'}`);
        }
        const isVisible = await element.isVisible();
        console.log(`     Visible: ${isVisible ? '✅ YES' : '❌ NO'}`);
      } else {
        console.log(`  ❌ No elements found with selector: "${selector}"`);
      }
    }
    
    // Check if there are any error messages
    console.log('\n🔍 Checking for error messages...');
    const errorTexts = [
      'error',
      'Error',
      'failed',
      'Failed',
      'unable',
      'Unable'
    ];
    
    for (const errorText of errorTexts) {
      const errorElements = await page.locator(`text=/${errorText}/i`).count();
      if (errorElements > 0) {
        console.log(`  ⚠️ Found ${errorElements} elements containing "${errorText}"`);
      }
    }
    
    // Check page structure
    console.log('\n🔍 Checking page structure...');
    const hasCanvasSection = await page.locator('.canvas-section').count() > 0;
    console.log(`  Canvas section exists: ${hasCanvasSection ? '✅ YES' : '❌ NO'}`);
    
    const hasCanvasContainer = await page.locator('.canvas-container').count() > 0;
    console.log(`  Canvas container exists: ${hasCanvasContainer ? '✅ YES' : '❌ NO'}`);
    
    const hasUploadSection = await page.locator('.upload-section').count() > 0;
    console.log(`  Upload section exists: ${hasUploadSection ? '✅ YES' : '❌ NO'}`);
    
    // Take screenshot for visual inspection
    await page.screenshot({ 
      path: 'design-new-debug.png',
      fullPage: false 
    });
    console.log('\n📸 Screenshot saved: design-new-debug.png');
    
    // Check console errors
    console.log('\n🔍 Checking browser console for errors...');
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`  ❌ Console error: ${msg.text()}`);
      }
    });
    
    // Try to trigger canvas rendering
    console.log('\n🔍 Attempting to trigger canvas render...');
    
    // Try clicking on product selector if it exists
    const productSelector = await page.locator('.product-item, .product-selector').first();
    if (await productSelector.count() > 0) {
      console.log('  Clicking product selector...');
      await productSelector.click();
      await page.waitForTimeout(2000);
      
      // Check again for canvas
      const canvasAfterClick = await page.locator('canvas').count();
      console.log(`  Canvas count after product selection: ${canvasAfterClick}`);
    }
    
    console.log('\n✅ Debug complete!\n');
    
  } catch (error) {
    console.error('❌ Error during debugging:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

debugCanvasIssue().catch(console.error);