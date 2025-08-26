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

// Read the bounding box issue document
const issueDocPath = path.join(__dirname, '..', 'BOUNDING-BOX-MISMATCH-ISSUE.md');
if (!fs.existsSync(issueDocPath)) {
  console.error('❌ Issue document not found at:', issueDocPath);
  process.exit(1);
}

const issueDocument = fs.readFileSync(issueDocPath, 'utf8');

// Read relevant code files
const designEditorPath = path.join(__dirname, '..', 'client', 'src', 'pages', 'DesignEditor.jsx');
const boundingBoxEditorPath = path.join(__dirname, '..', 'client', 'src', 'pages', 'BoundingBoxEditor.jsx');

let designEditorCode = '';
let boundingBoxCode = '';

if (fs.existsSync(designEditorPath)) {
  designEditorCode = fs.readFileSync(designEditorPath, 'utf8');
}

if (fs.existsSync(boundingBoxEditorPath)) {
  boundingBoxCode = fs.readFileSync(boundingBoxEditorPath, 'utf8');
}

// Prepare the prompt
const systemPrompt = `You are an expert in canvas rendering, coordinate systems, and JavaScript/React development. 
You're analyzing a coordinate mismatch issue between two pages that should be using the same bounding box coordinates.
Focus on identifying why coordinates set in one page don't match when used in another page.`;

const userPrompt = `Please analyze this bounding box coordinate mismatch issue and provide:

1. **Root Cause Analysis**: What's causing the coordinate mismatch?
2. **Specific Fix**: Exact code changes needed to fix the issue
3. **Verification Steps**: How to test that the fix works
4. **Prevention**: How to prevent this issue in the future

Here's the issue documentation:

${issueDocument}

${designEditorCode ? `\n\nRelevant code from DesignEditor.jsx (first 500 lines):\n\`\`\`javascript\n${designEditorCode.substring(0, 2000)}\n\`\`\`\n` : ''}

${boundingBoxCode ? `\n\nRelevant code from BoundingBoxEditor.jsx (first 500 lines):\n\`\`\`javascript\n${boundingBoxCode.substring(0, 2000)}\n\`\`\`\n` : ''}

Please provide a detailed analysis and solution for fixing the coordinate mismatch between the admin page (/test/bounding-box) and the design editor (/design/new).`;

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
  console.log('🤖 Connecting to ChatGPT for bounding box issue analysis...\n');
  console.log('📄 Analyzing document:', issueDocPath);
  console.log('🔧 Using model:', MODEL);
  console.log('\n' + '='.repeat(80) + '\n');

  try {
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    console.log('💭 ChatGPT is analyzing the bounding box coordinate mismatch...\n');
    const response = await callChatGPT(messages);
    
    if (response.choices && response.choices[0]) {
      const analysis = response.choices[0].message.content;
      
      // Save the analysis
      const outputPath = path.join(__dirname, '..', 'CHATGPT-BOUNDING-BOX-SOLUTION.md');
      const fullOutput = `# ChatGPT Bounding Box Coordinate Mismatch Analysis

Date: ${new Date().toISOString()}
Model: ${MODEL}

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