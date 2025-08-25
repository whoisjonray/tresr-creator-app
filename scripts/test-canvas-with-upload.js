const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// Create a simple test PNG image
function createTestImage(filename) {
  // 1x1 transparent PNG as base64
  const base64Data = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  const buffer = Buffer.from(base64Data, 'base64');
  fs.writeFileSync(filename, buffer);
  console.log(`✅ Created test image: ${filename}`);
  return filename;
}

async function testCanvasWithUpload() {
  console.log('\n🔍 Testing canvas with image upload...\n');
  
  let browser;
  const testImagePath = path.join(__dirname, 'test-design.png');
  
  try {
    // Create test image
    createTestImage(testImagePath);
    
    // Connect to existing Chrome session
    browser = await chromium.connectOverCDP('http://localhost:9222');
    console.log('✅ Connected to existing Chrome session');
    
    const context = browser.contexts()[0];
    const page = await context.newPage();
    
    // Navigate to design editor
    console.log('📐 Loading Design Editor page...');
    await page.goto('https://creators.tresr.com/design/new', { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });
    
    console.log('⏳ Waiting for page to load...');
    await page.waitForTimeout(3000);
    
    // Upload the test image
    console.log('📤 Uploading test image...');
    
    // Find the file input (it might be hidden)
    const fileInput = await page.locator('input[type="file"]').first();
    if (await fileInput.count() > 0) {
      await fileInput.setInputFiles(testImagePath);
      console.log('  ✅ Image uploaded via file input');
    } else {
      // Try clicking the upload area
      const uploadArea = await page.locator('.upload-section, .upload-zone, [data-testid="upload-area"]').first();
      if (await uploadArea.count() > 0) {
        console.log('  Clicking upload area...');
        await uploadArea.click();
        await page.waitForTimeout(1000);
        
        // Try again to find file input
        const fileInputAfterClick = await page.locator('input[type="file"]').first();
        if (await fileInputAfterClick.count() > 0) {
          await fileInputAfterClick.setInputFiles(testImagePath);
          console.log('  ✅ Image uploaded after clicking upload area');
        }
      }
    }
    
    // Wait for canvas to appear
    console.log('⏳ Waiting for canvas to appear...');
    await page.waitForTimeout(5000);
    
    // Check for canvas now
    console.log('\n🔍 Checking for canvas after upload...');
    
    const canvasSelectors = [
      'canvas',
      'canvas.product-canvas',
      '.product-canvas',
      '.canvas-container canvas'
    ];
    
    let canvasFound = false;
    for (const selector of canvasSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`  ✅ Found canvas with selector: "${selector}"`);
        const canvas = await page.locator(selector).first();
        const box = await canvas.boundingBox();
        if (box) {
          const isSquare = Math.abs(box.width - box.height) < 2;
          console.log(`  Canvas dimensions: ${box.width}x${box.height}`);
          console.log(`  Aspect ratio: ${(box.width / box.height).toFixed(3)}`);
          console.log(`  Is square: ${isSquare ? '✅ YES' : '❌ NO'}`);
          canvasFound = true;
          
          // Take screenshot
          await page.screenshot({ 
            path: path.join(__dirname, 'canvas-after-upload.png'),
            fullPage: false 
          });
          console.log('  Screenshot saved: canvas-after-upload.png');
        }
        break;
      }
    }
    
    if (!canvasFound) {
      console.log('  ❌ No canvas found even after upload');
      
      // Check what sections exist now
      console.log('\n🔍 Checking page structure after upload...');
      const hasConfigureProducts = await page.locator('.configure-products, .product-config').count() > 0;
      console.log(`  Configure Products section: ${hasConfigureProducts ? '✅ YES' : '❌ NO'}`);
      
      const hasCanvasSection = await page.locator('.canvas-section').count() > 0;
      console.log(`  Canvas section: ${hasCanvasSection ? '✅ YES' : '❌ NO'}`);
      
      // Take debug screenshot
      await page.screenshot({ 
        path: path.join(__dirname, 'page-after-upload.png'),
        fullPage: true 
      });
      console.log('  Full page screenshot saved: page-after-upload.png');
    }
    
    // Test mobile view with uploaded design
    console.log('\n📱 Testing mobile view with uploaded design...');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(2000);
    
    const mobileCanvas = await page.locator('canvas').first();
    if (await mobileCanvas.count() > 0) {
      const mobileBox = await mobileCanvas.boundingBox();
      if (mobileBox) {
        const isSquare = Math.abs(mobileBox.width - mobileBox.height) < 2;
        console.log(`  Mobile canvas dimensions: ${mobileBox.width}x${mobileBox.height}`);
        console.log(`  Is square: ${isSquare ? '✅ YES' : '❌ NO'}`);
      }
    } else {
      console.log('  ❌ No canvas found on mobile');
    }
    
    console.log('\n✅ Test complete!\n');
    
  } catch (error) {
    console.error('❌ Error during test:', error.message);
  } finally {
    // Clean up test image
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
      console.log('🧹 Cleaned up test image');
    }
    
    if (browser) {
      await browser.close();
    }
  }
}

testCanvasWithUpload().catch(console.error);