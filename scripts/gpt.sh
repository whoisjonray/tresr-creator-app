#!/bin/bash

# Simple ChatGPT CLI for quick queries
# Usage: ./gpt.sh "your question here"

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Check for API key
if [ -z "$OPENAI_API_KEY" ]; then
  echo "❌ Error: OPENAI_API_KEY not found in .env file"
  echo "Add it with: echo 'OPENAI_API_KEY=your-key-here' >> .env"
  exit 1
fi

# Check for query
if [ -z "$1" ]; then
  echo "Usage: ./gpt.sh \"your question here\""
  exit 1
fi

# Set the model (can be changed to gpt-4, gpt-3.5-turbo, etc.)
MODEL="gpt-4-turbo-preview"

# Make the API call
echo "🤖 Asking ChatGPT..."
echo ""

curl -s https://api.openai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{
    "model": "'$MODEL'",
    "messages": [{"role": "user", "content": "'"$1"'"}],
    "temperature": 0.7
  }' | python3 -c "
import sys, json
data = json.load(sys.stdin)
if 'error' in data:
    print('❌ Error:', data['error']['message'])
elif 'choices' in data:
    print(data['choices'][0]['message']['content'])
else:
    print('❌ Unexpected response format')
"