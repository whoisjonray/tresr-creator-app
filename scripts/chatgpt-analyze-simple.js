#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

if (!OPENAI_API_KEY) {
  console.error('❌ OpenAI API key not found');
  process.exit(1);
}

// Simple fetch implementation using curl
const { execSync } = require('child_process');

// Read the issue document
const issueDocPath = path.join(__dirname, '..', 'CANVAS-ISSUES-FOR-CHATGPT5.md');
const issueDocument = fs.readFileSync(issueDocPath, 'utf8');

// Create a shorter, focused prompt
const prompt = `As an expert in responsive web design, analyze this canvas rendering issue:

The canvas element (400x400px) displays correctly but its container (canvas-section) shows as 440x918px instead of 440x440px on desktop, and disappears completely on mobile.

Key symptoms:
- Desktop: Canvas is square but container is rectangular (440x918px)
- Mobile: Canvas completely invisible, container has 0 height
- 20+ CSS attempts failed to fix this

Question: What's the ROOT CAUSE and how do we fix it architecturally (not just CSS tweaks)?

Provide:
1. Root cause diagnosis
2. Specific code solution
3. Why it will work

Context: This is a React app with HTML5 Canvas for print-on-demand design positioning.`;

// Create the curl command
const curlCommand = `curl -s https://api.openai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${OPENAI_API_KEY}" \
  -d '{
    "model": "gpt-4-turbo-preview",
    "messages": [
      {
        "role": "system",
        "content": "You are an expert in responsive web design and debugging complex UI issues."
      },
      {
        "role": "user",
        "content": ${JSON.stringify(prompt)}
      }
    ],
    "temperature": 0.7,
    "max_tokens": 2000
  }'`;

console.log('🤖 Asking ChatGPT for canvas solution...\n');

try {
  const response = execSync(curlCommand, { encoding: 'utf8', maxBuffer: 1024 * 1024 * 10 });
  const data = JSON.parse(response);
  
  if (data.error) {
    console.error('❌ Error:', data.error.message);
    process.exit(1);
  }
  
  if (data.choices && data.choices[0]) {
    const solution = data.choices[0].message.content;
    
    // Save the solution
    const outputPath = path.join(__dirname, '..', 'CHATGPT5-CANVAS-SOLUTION.md');
    const fullOutput = `# ChatGPT Canvas Solution\n\nDate: ${new Date().toISOString()}\n\n---\n\n${solution}`;
    
    fs.writeFileSync(outputPath, fullOutput);
    
    console.log('='.repeat(80));
    console.log(solution);
    console.log('='.repeat(80));
    console.log('\n✅ Solution saved to:', outputPath);
  }
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}