const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function verifyCanvasIsSquare() {
  console.log('\n🔍 Starting canvas square verification...\n');
  
  let browser;
  try {
    // Connect to existing Chrome session to preserve auth
    browser = await chromium.connectOverCDP('http://localhost:9222');
    console.log('✅ Connected to existing Chrome session');
    
    const context = browser.contexts()[0];
    if (!context) {
      throw new Error('No browser context found. Make sure Chrome is running with --remote-debugging-port=9222');
    }
    
    const page = await context.newPage();
    
    // Test 1: Design Editor Page
    console.log('\n📐 Testing Design Editor (/design/new)...');
    await page.goto('https://creators.tresr.com/design/new', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    await page.waitForTimeout(3000); // Wait for canvas to render
    
    // Get canvas dimensions
    const designCanvas = await page.locator('canvas.product-canvas, .product-canvas').first();
    const designCanvasExists = await designCanvas.count() > 0;
    
    if (designCanvasExists) {
      const designBox = await designCanvas.boundingBox();
      if (designBox) {
        const isSquare = Math.abs(designBox.width - designBox.height) < 2; // Allow 2px tolerance
        console.log(`  Canvas dimensions: ${designBox.width}x${designBox.height}`);
        console.log(`  Aspect ratio: ${(designBox.width / designBox.height).toFixed(3)}`);
        console.log(`  Is square: ${isSquare ? '✅ YES' : '❌ NO'}`);
        
        // Take screenshot
        await page.screenshot({ 
          path: path.join(__dirname, 'design-new-canvas-test.png'),
          fullPage: false 
        });
        console.log('  Screenshot saved: design-new-canvas-test.png');
      } else {
        console.log('  ❌ Canvas found but couldn\'t get dimensions');
      }
    } else {
      console.log('  ❌ No canvas element found');
    }
    
    // Test 2: Bounding Box Editor
    console.log('\n📐 Testing Bounding Box Editor (/test/bounding-box)...');
    await page.goto('https://creators.tresr.com/test/bounding-box', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    await page.waitForTimeout(3000); // Wait for canvas to render
    
    // Get canvas dimensions
    const boundingCanvas = await page.locator('canvas.bounding-box-canvas, canvas').first();
    const boundingCanvasExists = await boundingCanvas.count() > 0;
    
    if (boundingCanvasExists) {
      const boundingBox = await boundingCanvas.boundingBox();
      if (boundingBox) {
        const isSquare = Math.abs(boundingBox.width - boundingBox.height) < 2; // Allow 2px tolerance
        console.log(`  Canvas dimensions: ${boundingBox.width}x${boundingBox.height}`);
        console.log(`  Aspect ratio: ${(boundingBox.width / boundingBox.height).toFixed(3)}`);
        console.log(`  Is square: ${isSquare ? '✅ YES' : '❌ NO'}`);
        
        // Check if canvas is visible
        const isVisible = await boundingCanvas.isVisible();
        console.log(`  Canvas visible: ${isVisible ? '✅ YES' : '❌ NO'}`);
        
        // Take screenshot
        await page.screenshot({ 
          path: path.join(__dirname, 'bounding-box-canvas-test.png'),
          fullPage: false 
        });
        console.log('  Screenshot saved: bounding-box-canvas-test.png');
      } else {
        console.log('  ❌ Canvas found but couldn\'t get dimensions');
      }
    } else {
      console.log('  ❌ No canvas element found');
    }
    
    // Test 3: Mobile view
    console.log('\n📱 Testing mobile view...');
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
    await page.goto('https://creators.tresr.com/design/new', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    await page.waitForTimeout(3000);
    
    const mobileCanvas = await page.locator('canvas.product-canvas, .product-canvas').first();
    const mobileCanvasExists = await mobileCanvas.count() > 0;
    
    if (mobileCanvasExists) {
      const mobileBox = await mobileCanvas.boundingBox();
      if (mobileBox) {
        const isSquare = Math.abs(mobileBox.width - mobileBox.height) < 2;
        console.log(`  Mobile canvas dimensions: ${mobileBox.width}x${mobileBox.height}`);
        console.log(`  Aspect ratio: ${(mobileBox.width / mobileBox.height).toFixed(3)}`);
        console.log(`  Is square: ${isSquare ? '✅ YES' : '❌ NO'}`);
        
        await page.screenshot({ 
          path: path.join(__dirname, 'mobile-canvas-test.png'),
          fullPage: false 
        });
        console.log('  Screenshot saved: mobile-canvas-test.png');
      }
    } else {
      console.log('  ❌ No canvas element found on mobile');
    }
    
    console.log('\n✅ Canvas verification complete!\n');
    
  } catch (error) {
    console.error('❌ Error during verification:', error.message);
    console.error('\nMake sure:');
    console.error('1. Chrome is running with: open -a "Google Chrome" --args --remote-debugging-port=9222');
    console.error('2. You are logged in to https://creators.tresr.com');
    console.error('3. Railway deployment has completed');
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the verification
verifyCanvasIsSquare().catch(console.error);