/**
 * Canvas Responsiveness Test Script
 * Tests canvas dimensions and aspect ratio across different viewport sizes
 * 
 * Usage: node test-canvas-responsiveness.js
 */

const { chromium } = require('playwright');
const path = require('path');

// Test configuration
const TEST_URL = 'https://creators.tresr.com/design/new';
const SCREENSHOTS_DIR = path.join(__dirname, '../test-screenshots');

// Viewport configurations - Testing exact sizes that were problematic
const VIEWPORTS = [
  {
    name: 'Desktop-Large',
    width: 1920,
    height: 1080,
    expectedCanvasSize: 400,
    description: 'Desktop 1920x1080 - Canvas should be exactly 400x400px'
  },
  {
    name: 'Desktop-Medium',
    width: 1440,
    height: 900,
    expectedCanvasSize: 400,
    description: 'Desktop 1440x900 - Canvas should be exactly 400x400px'
  },
  {
    name: 'Tablet-Landscape',
    width: 1024,
    height: 768,
    expectedCanvasSize: 350,
    description: 'Tablet Landscape - Canvas should be 350x350px'
  },
  {
    name: 'Tablet-Portrait',
    width: 768,
    height: 1024,
    expectedCanvasSize: 350,
    description: 'Tablet Portrait - Canvas should scale to ~350px'
  },
  {
    name: 'Mobile-iPhone12',
    width: 390,
    height: 844,
    expectedCanvasSize: null, // Should be ~351px (90% of 390)
    description: 'iPhone 12/13 - Canvas should be visible and square ~351px'
  },
  {
    name: 'Mobile-iPhoneSE',
    width: 375,
    height: 667,
    expectedCanvasSize: null, // Should be ~337px (90% of 375)
    description: 'iPhone SE - Canvas should be visible and square ~337px'
  },
  {
    name: 'Mobile-Small',
    width: 320,
    height: 568,
    expectedCanvasSize: null, // Should be ~288px (90% of 320)
    description: 'Small Mobile - Canvas minimum 200px, should be ~288px'
  }
];

class CanvasResponsivenessTest {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.results = [];
  }

  async setup() {
    console.log('🚀 Starting Canvas Responsiveness Test');
    console.log('=' .repeat(50));
    
    this.browser = await chromium.launch({ 
      headless: false, // Set to true for CI/CD
      slowMo: 500 // Slow down for visual debugging
    });
    
    this.context = await this.browser.newContext({
      ignoreHTTPSErrors: true,
      timeout: 30000
    });
    
    this.page = await this.context.newPage();
    
    // Create screenshots directory
    try {
      const fs = require('fs');
      if (!fs.existsSync(SCREENSHOTS_DIR)) {
        fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
      }
    } catch (error) {
      console.warn('⚠️  Could not create screenshots directory:', error.message);
    }
  }

  async navigateToDesignPage() {
    console.log(`🌐 Navigating to ${TEST_URL}`);
    
    try {
      await this.page.goto(TEST_URL, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      // Wait for page to fully load and check for authentication redirect
      await this.page.waitForTimeout(2000);
      
      // Check if we're on login page
      const currentUrl = this.page.url();
      if (currentUrl.includes('/login')) {
        console.log('⚠️  Redirected to login page - authentication required');
        console.log('   Please login manually and run the test again');
        return false;
      }
      
      // Try multiple selectors for the canvas
      const canvasSelectors = [
        'canvas.product-canvas',
        'canvas#product-canvas',
        'div.canvas-section canvas',
        'canvas'
      ];
      
      let canvasFound = false;
      for (const selector of canvasSelectors) {
        try {
          await this.page.waitForSelector(selector, { timeout: 5000 });
          console.log(`✅ Found canvas with selector: ${selector}`);
          canvasFound = true;
          break;
        } catch {
          // Try next selector
        }
      }
      
      if (!canvasFound) {
        // Check if there's any canvas-like element
        const hasCanvasSection = await this.page.locator('div.canvas-section').count() > 0;
        if (hasCanvasSection) {
          console.log('⚠️  Found canvas-section but no canvas element inside');
        }
        console.log('❌ No canvas element found on page');
        return false;
      }
      
      console.log('✅ Successfully navigated to design page');
      return true;
    } catch (error) {
      console.error('❌ Failed to navigate to design page:', error.message);
      return false;
    }
  }

  async testViewport(viewport) {
    console.log(`\n📱 Testing ${viewport.name} (${viewport.width}x${viewport.height})`);
    console.log('-'.repeat(40));
    
    const testResult = {
      viewport: viewport.name,
      dimensions: `${viewport.width}x${viewport.height}`,
      passed: false,
      issues: [],
      measurements: {}
    };

    try {
      // Set viewport size
      await this.page.setViewportSize({ 
        width: viewport.width, 
        height: viewport.height 
      });
      
      // Wait for responsive adjustments
      await this.page.waitForTimeout(1000);
      
      // Find canvas element
      const canvasElement = await this.page.locator('canvas').first();
      const canvasExists = await canvasElement.count() > 0;
      
      if (!canvasExists) {
        testResult.issues.push('Canvas element not found');
        console.log('❌ Canvas element not found');
        return testResult;
      }
      
      // Get canvas measurements
      const canvasBox = await canvasElement.boundingBox();
      const canvasContainer = await this.page.locator('canvas').first().locator('..').boundingBox();
      
      if (!canvasBox) {
        testResult.issues.push('Canvas not visible');
        console.log('❌ Canvas not visible');
        return testResult;
      }
      
      testResult.measurements = {
        canvasWidth: Math.round(canvasBox.width),
        canvasHeight: Math.round(canvasBox.height),
        containerWidth: canvasContainer ? Math.round(canvasContainer.width) : null,
        containerHeight: canvasContainer ? Math.round(canvasContainer.height) : null
      };
      
      console.log(`📐 Canvas dimensions: ${testResult.measurements.canvasWidth}x${testResult.measurements.canvasHeight}px`);
      if (canvasContainer) {
        console.log(`📦 Container dimensions: ${testResult.measurements.containerWidth}x${testResult.measurements.containerHeight}px`);
      }
      
      // Test 1: Canvas visibility
      const isVisible = await canvasElement.isVisible();
      if (!isVisible) {
        testResult.issues.push('Canvas is not visible');
        console.log('❌ Canvas is not visible');
      } else {
        console.log('✅ Canvas is visible');
      }
      
      // Test 2: 1:1 Aspect ratio
      const aspectRatio = testResult.measurements.canvasWidth / testResult.measurements.canvasHeight;
      const aspectRatioValid = Math.abs(aspectRatio - 1) < 0.1; // Allow 10% tolerance
      
      if (!aspectRatioValid) {
        testResult.issues.push(`Invalid aspect ratio: ${aspectRatio.toFixed(2)} (should be ~1.0)`);
        console.log(`❌ Invalid aspect ratio: ${aspectRatio.toFixed(2)} (should be ~1.0)`);
      } else {
        console.log(`✅ Valid 1:1 aspect ratio: ${aspectRatio.toFixed(2)}`);
      }
      
      // Test 3: Size expectations for desktop
      if (viewport.name === 'Desktop' && viewport.expectedCanvasSize) {
        const sizeValid = Math.abs(testResult.measurements.canvasWidth - viewport.expectedCanvasSize) < 20; // 20px tolerance
        
        if (!sizeValid) {
          testResult.issues.push(`Canvas size ${testResult.measurements.canvasWidth}px does not match expected ${viewport.expectedCanvasSize}px`);
          console.log(`❌ Canvas size ${testResult.measurements.canvasWidth}px does not match expected ${viewport.expectedCanvasSize}px`);
        } else {
          console.log(`✅ Canvas size matches expected ${viewport.expectedCanvasSize}px`);
        }
      }
      
      // Test 4: Minimum size for mobile/tablet
      if (viewport.name !== 'Desktop') {
        const minSize = viewport.name === 'Mobile' ? 200 : 300;
        const sizeAdequate = testResult.measurements.canvasWidth >= minSize;
        
        if (!sizeAdequate) {
          testResult.issues.push(`Canvas too small: ${testResult.measurements.canvasWidth}px (minimum: ${minSize}px)`);
          console.log(`❌ Canvas too small: ${testResult.measurements.canvasWidth}px (minimum: ${minSize}px)`);
        } else {
          console.log(`✅ Canvas size adequate: ${testResult.measurements.canvasWidth}px (minimum: ${minSize}px)`);
        }
      }
      
      // Test 5: Canvas fits in viewport
      const fitsInViewport = (canvasBox.x + canvasBox.width <= viewport.width) && 
                            (canvasBox.y + canvasBox.height <= viewport.height);
      
      if (!fitsInViewport) {
        testResult.issues.push('Canvas extends beyond viewport boundaries');
        console.log('❌ Canvas extends beyond viewport boundaries');
      } else {
        console.log('✅ Canvas fits within viewport');
      }
      
      // Take screenshot
      const screenshotPath = path.join(SCREENSHOTS_DIR, `canvas-${viewport.name.toLowerCase()}-${viewport.width}x${viewport.height}.png`);
      try {
        await this.page.screenshot({ 
          path: screenshotPath,
          fullPage: false 
        });
        console.log(`📸 Screenshot saved: ${screenshotPath}`);
      } catch (error) {
        console.warn(`⚠️  Could not save screenshot: ${error.message}`);
      }
      
      // Mark as passed if no issues
      testResult.passed = testResult.issues.length === 0;
      
      if (testResult.passed) {
        console.log(`🎉 ${viewport.name} test PASSED`);
      } else {
        console.log(`❌ ${viewport.name} test FAILED:`);
        testResult.issues.forEach(issue => console.log(`   - ${issue}`));
      }
      
    } catch (error) {
      testResult.issues.push(`Test error: ${error.message}`);
      console.log(`❌ Test error: ${error.message}`);
    }
    
    return testResult;
  }

  async runAllTests() {
    // Navigate to the design page once
    const navigationSuccess = await this.navigateToDesignPage();
    if (!navigationSuccess) {
      console.log('❌ Cannot proceed with tests - navigation failed');
      return;
    }
    
    // Test each viewport
    for (const viewport of VIEWPORTS) {
      const result = await this.testViewport(viewport);
      this.results.push(result);
    }
    
    // Generate summary report
    this.generateSummaryReport();
  }

  generateSummaryReport() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 CANVAS RESPONSIVENESS TEST SUMMARY');
    console.log('='.repeat(50));
    
    const passedTests = this.results.filter(r => r.passed).length;
    const totalTests = this.results.length;
    
    console.log(`\n🎯 Overall Result: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('🎉 ALL TESTS PASSED - Canvas is responsive across all viewport sizes!');
    } else {
      console.log('⚠️  SOME TESTS FAILED - Canvas responsiveness needs attention');
    }
    
    console.log('\n📋 Detailed Results:');
    console.log('-'.repeat(50));
    
    this.results.forEach(result => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${result.viewport} (${result.dimensions})`);
      
      if (result.measurements.canvasWidth) {
        console.log(`   Canvas: ${result.measurements.canvasWidth}x${result.measurements.canvasHeight}px`);
      }
      
      if (result.issues.length > 0) {
        result.issues.forEach(issue => console.log(`   ❌ ${issue}`));
      }
      console.log('');
    });
    
    console.log('📁 Screenshots saved to:', SCREENSHOTS_DIR);
    console.log('\n' + '='.repeat(50));
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      console.log('🧹 Browser closed');
    }
  }
}

// Main execution
async function runCanvasResponsivenessTest() {
  const test = new CanvasResponsivenessTest();
  
  try {
    await test.setup();
    await test.runAllTests();
  } catch (error) {
    console.error('💥 Test suite failed:', error);
  } finally {
    await test.cleanup();
  }
}

// Check if running directly
if (require.main === module) {
  runCanvasResponsivenessTest().catch(console.error);
}

module.exports = { CanvasResponsivenessTest };