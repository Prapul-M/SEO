#!/bin/bash

# Check if OPENAI_API_KEY is set
if [ -z "$OPENAI_API_KEY" ]; then
  echo "❌ Error: OPENAI_API_KEY environment variable is not set"
  echo "Please set it by running: export OPENAI_API_KEY=your_api_key"
  exit 1
fi

# Run the SEO scan on the sample HTML file
echo "🔍 Running SEO scan on sample HTML file..."
npx ts-node scripts/seoScan.ts file ./public/sample.html --output ./scan_results.json

# Check if the scan was successful
if [ $? -eq 0 ]; then
  echo "✅ Scan completed successfully! Results saved to scan_results.json"
  echo "📊 Summary of results:"
  cat ./scan_results.json | grep -E "score|title|description" | head -10
else
  echo "❌ Scan failed. Please check the error messages above."
fi 