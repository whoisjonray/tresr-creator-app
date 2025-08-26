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
const systemPrompt = `You are an expert in canvas rendering, coordinate systems, JavaScript/React, and debugging complex UI issues. 
You're analyzing a coordinate mismatch issue that's more complex than just scaling - the coordinates are stored identically in both places but render differently.`;

const userPrompt = `CRITICAL UPDATE: The issue is more complex than canvas sizing. Please analyze this deeper problem:

## The Problem
The bounding box coordinates are IDENTICAL in the code:
- BoundingBoxEditor.jsx: wmn-hoodie: { width: 240, height: 320, x: 180, y: 140 }
- PrintAreasContext.jsx: wmn-hoodie: { width: 240, height: 320, x: 180, y: 140 }
- Both use 600x600 internal canvas size

YET they render in completely different positions on the canvas!

## Evidence from Screenshots

### In /test/bounding-box (Admin Page):
- The bounding box appears centered on the women's hoodie
- Properly positioned over the chest area
- Looks correct for print placement

### In /design/new (Design Editor):
- The SAME coordinates place the box much lower
- Almost at the bottom of the hoodie
- Completely wrong for print placement

## What We've Already Tried
1. Fixed canvas sizing to 600x600 (both pages now use same size)
2. Removed scaling calculations 
3. Coordinates are stored identically
4. Mouse coordinate calculations updated

## Potential Issues to Investigate

1. **Garment Image Positioning**: Are the garment images positioned differently on the canvas between pages?

2. **Canvas Transform/Translation**: Is there a ctx.translate() or ctx.transform() being applied differently?

3. **Image Loading Order**: Is the garment image being drawn at different sizes or positions?

4. **Coordinate Origin Issues**: Is one page treating coordinates relative to the garment image vs the canvas?

5. **Hidden State/Context**: Is there some state mutation or context modification happening?

6. **Browser Caching**: Could old coordinate data be cached somewhere?

## Key Code Sections

### DesignEditor Canvas Drawing:
\`\`\`javascript
// Draw garment at full canvas size
ctx.drawImage(garmentImage.current, 0, 0, canvas.width, canvas.height);

// Draw print area (no scaling now)
const adjustedPrintAreaX = printAreaX;
const adjustedPrintAreaY = printAreaY;
\`\`\`

### BoundingBoxEditor Canvas Drawing:
\`\`\`javascript
// Need to check how garment is drawn here
// And how coordinates are applied
\`\`\`

## Questions

1. Why would identical coordinates render differently if canvas sizes are the same?
2. What transformation or offset could cause this vertical shift?
3. Is there a race condition or timing issue?
4. Could the garment images themselves be different sizes/positions?

Please provide:
1. **Root Cause**: What's actually causing the position difference
2. **Debugging Steps**: How to identify the exact issue
3. **Solution**: Specific code to fix this
4. **Prevention**: How to ensure consistency going forward`;

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
  console.log('🤖 Connecting to ChatGPT for deeper bounding box analysis...\n');
  console.log('🔧 Using model:', MODEL);
  console.log('\n' + '='.repeat(80) + '\n');

  try {
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    console.log('💭 ChatGPT is analyzing the deeper coordinate mismatch issue...\n');
    const response = await callChatGPT(messages);
    
    if (response.choices && response.choices[0]) {
      const analysis = response.choices[0].message.content;
      
      // Save the analysis
      const outputPath = path.join(__dirname, '..', 'CHATGPT-DEEPER-ANALYSIS.md');
      const fullOutput = `# ChatGPT Deeper Bounding Box Analysis

Date: ${new Date().toISOString()}
Model: ${MODEL}

## Key Finding
The coordinates are identical in code but render differently, suggesting the issue is NOT coordinate storage or scaling.

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