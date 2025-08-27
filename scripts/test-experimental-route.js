const { chromium } = require('playwright');

(async () => {
  console.log('🔌 Connecting to existing Chrome session on port 9222...');
  
  try {
    // Connect to existing Chrome instance
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
    console.log('✅ Connected to Chrome');
    
    // Get existing context and page
    const contexts = browser.contexts();
    if (contexts.length === 0) {
      console.log('❌ No contexts found. Make sure you have a Chrome window open.');
      await browser.close();
      return;
    }
    
    const context = contexts[0];
    const pages = context.pages();
    
    let page;
    if (pages.length > 0) {
      page = pages[0];
      console.log('📄 Using existing page');
    } else {
      page = await context.newPage();
      console.log('📄 Created new page');
    }
    
    // Navigate to experimental route
    console.log('🚀 Navigating to experimental Dynamic Mockups editor...');
    await page.goto('https://creators.tresr.com/experimental/design/new', {
      waitUntil: 'networkidle'
    });
    
    // Wait for the page to load
    await page.waitForTimeout(2000);
    
    // Check if we're on the login page (redirected)
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      console.log('❌ Redirected to login. You need to be authenticated first.');
      console.log('   Please login at https://creators.tresr.com first');
    } else if (currentUrl.includes('/experimental/design/new')) {
      console.log('✅ Successfully loaded experimental Dynamic Mockups editor!');
      
      // Check if the editor loaded
      const editorTitle = await page.textContent('h1').catch(() => null);
      if (editorTitle) {
        console.log(`   Page title: ${editorTitle}`);
      }
      
      // Check for Dynamic Mockups elements
      const hasDMBadge = await page.locator('.badge-dm').count() > 0;
      if (hasDMBadge) {
        console.log('   ✅ Dynamic Mockups badge found');
      }
      
      const hasExperimentalBadge = await page.locator('.badge-experimental').count() > 0;
      if (hasExperimentalBadge) {
        console.log('   ✅ Experimental badge found');
      }
    } else {
      console.log(`📍 Current URL: ${currentUrl}`);
    }
    
    console.log('\n✨ Test complete! Check your browser window.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nMake sure Chrome is running with debugging enabled:');
    console.log('  open -a "Google Chrome" --args --remote-debugging-port=9222');
  }
})();