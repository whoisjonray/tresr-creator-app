#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
require('dotenv').config();

// Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || '';
const MODEL = 'gpt-4-turbo-preview';

if (!OPENAI_API_KEY) {
  console.error('❌ OpenAI API key not found. Please add OPENAI_API_KEY to your .env file');
  process.exit(1);
}

// Prepare the comprehensive prompt
const systemPrompt = `You are an expert in mobile web development, touch interactions, canvas manipulation, and responsive design. 
You're helping fix critical mobile UX issues in a React-based design editor with canvas functionality.`;

const userPrompt = `Please help fix these critical mobile issues in our design editor:

## Issues to Fix

### 1. Text Overflow/Readability on Mobile
- Title fields and other text inputs are cut off
- Dropdown menus have text that's unreadable
- Need to ensure all fields are properly sized for mobile

### 2. Add/Remove Button Positioning
- The add/remove button jumps to the left instead of staying centered
- Should maintain consistent position regardless of state

### 3. Scale Slider Not Working on Mobile
- The scale slider (for resizing uploaded artwork) doesn't work on touch devices
- Need proper touch event handling

### 4. Canvas Dragging Issues
- Cannot drag uploaded artwork around on the canvas using touch
- When artwork is scaled larger than bounding box, it should still be draggable
- Need to allow dragging even when image exceeds bounding box boundaries

### 5. Editor Layout Padding
- The editor-layout runs over the right edge on mobile
- Missing right padding that exists on left side
- Not properly centered

## Current Implementation Details

### Canvas Setup
- Using HTML5 Canvas with 600x600 internal dimensions
- Display size responsive based on viewport
- Touch events need to work for dragging

### Dragging Logic
Currently restricts dragging to keep image within bounding box:
\`\`\`javascript
// Current constraint logic
const maxX = printAreaX + printAreaWidth - width;
const maxY = printAreaY + printAreaHeight - height;
x = Math.max(printAreaX, Math.min(x, maxX));
y = Math.max(printAreaY, Math.min(y, maxY));
\`\`\`

### Scale Control
Using HTML range input:
\`\`\`html
<input type="range" min="10" max="200" value={scale} />
\`\`\`

## Requirements

1. **Touch Support**: All interactions must work with touch events
2. **Overflow Handling**: When scaled larger than bounding box, image should be draggable to position any part within the box
3. **Smooth Performance**: Touch interactions should be smooth and responsive
4. **Cross-Device**: Should work on iOS Safari, Android Chrome
5. **Viewport Safety**: Respect safe areas and prevent horizontal scroll

## Questions to Answer

1. What's the best approach for handling touch events on canvas for dragging?
2. How should we handle dragging when image is larger than bounding box?
3. What's the proper way to make range sliders work on mobile?
4. How to ensure text fields and dropdowns are properly sized for mobile?
5. Best practices for preventing layout overflow on mobile?

Please provide:
1. **Specific code solutions** for each issue
2. **Touch event handling** best practices
3. **CSS fixes** for layout and overflow issues
4. **Testing approach** to verify fixes work across devices`;

// Function to call OpenAI API
async function callChatGPT(messages) {
  const data = JSON.stringify({
    model: MODEL,
    messages: messages,
    temperature: 0.7,
    max_tokens: 4000
  });

  const options = {
    hostname: 'api.openai.com',
    port: 443,
    path: '/v1/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Length': Buffer.byteLength(data)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(responseData);
          if (response.error) {
            reject(new Error(response.error.message));
          } else {
            resolve(response);
          }
        } catch (error) {
          console.error('Failed to parse response:', responseData);
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Main execution
async function main() {
  console.log('🤖 Connecting to ChatGPT for mobile UX solutions...\n');
  console.log('🔧 Using model:', MODEL);
  console.log('\n' + '='.repeat(80) + '\n');

  try {
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    console.log('💭 ChatGPT is analyzing the mobile UX issues...\n');
    const response = await callChatGPT(messages);
    
    if (response.choices && response.choices[0]) {
      const analysis = response.choices[0].message.content;
      
      // Save the analysis
      const outputPath = path.join(__dirname, '..', 'CHATGPT-MOBILE-SOLUTIONS.md');
      const fullOutput = `# ChatGPT Mobile UX Solutions

Date: ${new Date().toISOString()}
Model: ${MODEL}

## Summary
Comprehensive solutions for mobile touch interactions, layout issues, and responsive design problems.

---

${analysis}`;
      
      fs.writeFileSync(outputPath, fullOutput);
      
      console.log('✅ Analysis complete!\n');
      console.log('='.repeat(80));
      console.log('\n' + analysis + '\n');
      console.log('='.repeat(80));
      console.log('\n📁 Full analysis saved to:', outputPath);
    }
  } catch (error) {
    console.error('❌ Error calling ChatGPT:', error.message);
    if (error.message.includes('quota')) {
      console.log('\n💡 Tip: Check your OpenAI account for API quota/billing');
    } else if (error.message.includes('Invalid')) {
      console.log('\n💡 Tip: Check if your API key is valid and has the right permissions');
    }
    process.exit(1);
  }
}

// Run the analysis
main();