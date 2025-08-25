#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
require('dotenv').config();

// Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || '';
const MODEL = 'gpt-4-turbo-preview'; // or 'gpt-4' or 'gpt-3.5-turbo'

if (!OPENAI_API_KEY) {
  console.error('❌ OpenAI API key not found. Please add OPENAI_API_KEY to your .env file');
  console.log('\nTo add it, run:');
  console.log('echo "OPENAI_API_KEY=your-key-here" >> .env');
  process.exit(1);
}

// Read the issue document
const issueDocPath = path.join(__dirname, '..', 'CANVAS-ISSUES-FOR-CHATGPT5.md');
if (!fs.existsSync(issueDocPath)) {
  console.error('❌ Issue document not found at:', issueDocPath);
  process.exit(1);
}

const issueDocument = fs.readFileSync(issueDocPath, 'utf8');

// Prepare the prompt
const systemPrompt = `You are ChatGPT-5, an expert in web development, responsive design, and debugging complex UI issues. 
You've been brought in to analyze a persistent canvas rendering issue that Claude and a human developer have been unable to solve after 20+ attempts.
Your task is to provide a fresh perspective and identify the root cause of why a canvas element won't display properly as a 1:1 square across devices.
Focus on architectural solutions rather than more CSS tweaks.`;

const userPrompt = `Please analyze this comprehensive issue report and provide:
1. Your diagnosis of the ROOT CAUSE (not symptoms)
2. A specific architectural solution (with code)
3. Why previous attempts failed
4. Implementation steps that will definitely work

Here's the full issue report:

${issueDocument}`;

// Function to call OpenAI API
async function callChatGPT(messages) {
  // Clean the messages to ensure proper JSON encoding
  const cleanMessages = messages.map(msg => ({
    role: msg.role,
    content: msg.content.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t')
  }));
  
  const data = JSON.stringify({
    model: MODEL,
    messages: cleanMessages,
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
      'Content-Length': data.length
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
  console.log('🤖 Connecting to ChatGPT-5 for canvas issue analysis...\n');
  console.log('📄 Analyzing document:', issueDocPath);
  console.log('🔧 Using model:', MODEL);
  console.log('\n' + '='.repeat(80) + '\n');

  try {
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    console.log('💭 ChatGPT is analyzing the canvas issues...\n');
    const response = await callChatGPT(messages);
    
    if (response.choices && response.choices[0]) {
      const analysis = response.choices[0].message.content;
      
      // Save the analysis
      const outputPath = path.join(__dirname, '..', 'CHATGPT5-CANVAS-SOLUTION.md');
      const fullOutput = `# ChatGPT-5 Canvas Issue Analysis\n\nDate: ${new Date().toISOString()}\nModel: ${MODEL}\n\n---\n\n${analysis}`;
      
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
    }
    process.exit(1);
  }
}

// Run the analysis
main();