#!/usr/bin/env node
import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';
import { Octokit } from '@octokit/rest';
import { analyzeSeo, SeoAnalysisResult } from '../lib/openai';

// Load environment variables
config();

// Check that OpenAI API key is set
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ Error: OPENAI_API_KEY environment variable is not set');
  process.exit(1);
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log(`
Usage: npx ts-node seoScan.ts <command> [options]

Commands:
  file <filepath>            - Analyze a local HTML file
  url <url>                  - Analyze a public URL (note: URL must be accessible)
  repo <owner/repo> [path]   - Analyze a specific GitHub repository
  help                       - Show this help message

Options:
  --keywords <keyword1,keyword2>  - Provide specific keywords to target
  --output <filepath>             - Save results to a JSON file
  --verbose                       - Show detailed output

Examples:
  npx ts-node seoScan.ts file ./public/index.html
  npx ts-node seoScan.ts url https://example.com
  npx ts-node seoScan.ts repo username/my-website --keywords seo,automation,ai
  `);
  process.exit(0);
}

// Main function
async function main() {
  const command = args[0];
  const target = args[1];
  
  // Parse options
  const keywordsIndex = args.indexOf('--keywords');
  const keywords = keywordsIndex > -1 && args[keywordsIndex + 1] 
    ? args[keywordsIndex + 1].split(',') 
    : undefined;
  
  const outputIndex = args.indexOf('--output');
  const outputFile = outputIndex > -1 ? args[outputIndex + 1] : undefined;
  
  const verbose = args.includes('--verbose');

  // Process based on command
  try {
    let result: SeoAnalysisResult | null = null;
    
    if (command === 'file') {
      // Analyze local file
      if (!target) {
        console.error('❌ Error: No file path provided');
        process.exit(1);
      }
      
      const filePath = path.resolve(process.cwd(), target);
      if (!fs.existsSync(filePath)) {
        console.error(`❌ Error: File not found: ${filePath}`);
        process.exit(1);
      }
      
      console.log(`📊 Analyzing file: ${filePath}`);
      const content = fs.readFileSync(filePath, 'utf8');
      
      result = await analyzeSeo(filePath, content, keywords);
    } 
    else if (command === 'url') {
      // Analyze URL
      if (!target) {
        console.error('❌ Error: No URL provided');
        process.exit(1);
      }
      
      console.log(`📊 Analyzing URL: ${target}`);
      
      // Fetch the URL content
      const response = await fetch(target);
      if (!response.ok) {
        console.error(`❌ Error: Failed to fetch URL (${response.status}): ${target}`);
        process.exit(1);
      }
      
      const content = await response.text();
      result = await analyzeSeo(target, content, keywords);
    } 
    else if (command === 'repo') {
      // Analyze GitHub repository
      if (!target) {
        console.error('❌ Error: No repository provided. Format should be owner/repo');
        process.exit(1);
      }
      
      const [owner, repo] = target.split('/');
      if (!owner || !repo) {
        console.error('❌ Error: Invalid repository format. Format should be owner/repo');
        process.exit(1);
      }
      
      const path = args[2] && !args[2].startsWith('--') ? args[2] : '';
      
      console.log(`📊 Analyzing GitHub repository: ${owner}/${repo} path: ${path || 'root'}`);
      
      // Check for GitHub token
      if (!process.env.GITHUB_TOKEN) {
        console.error('❌ Error: GITHUB_TOKEN environment variable is not set');
        process.exit(1);
      }
      
      const octokit = new Octokit({
        auth: process.env.GITHUB_TOKEN,
      });
      
      // Get repository content
      try {
        const { data } = await octokit.repos.getContent({
          owner,
          repo,
          path,
        });
        
        if (Array.isArray(data)) {
          // It's a directory
          const htmlFiles = data.filter(file => 
            file.type === 'file' && (file.name.endsWith('.html') || file.name.endsWith('.htm'))
          );
          
          if (htmlFiles.length === 0) {
            console.error('❌ Error: No HTML files found in this path');
            process.exit(1);
          }
          
          console.log(`Found ${htmlFiles.length} HTML files`);
          
          // Analyze the first HTML file (could be expanded to analyze all)
          const file = htmlFiles[0];
          console.log(`Analyzing ${file.name}...`);
          
          const contentResponse = await octokit.repos.getContent({
            owner,
            repo,
            path: file.path,
          });
          
          // @ts-ignore - The type is complex
          const content = Buffer.from(contentResponse.data.content, 'base64').toString();
          result = await analyzeSeo(file.path, content, keywords);
        } else if (data.type === 'file') {
          // It's a single file
          // @ts-ignore - The type is complex
          const content = Buffer.from(data.content, 'base64').toString();
          result = await analyzeSeo(data.path, content, keywords);
        }
      } catch (error) {
        console.error(`❌ Error accessing repository content: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
      }
    } 
    else {
      console.error(`❌ Error: Unknown command: ${command}`);
      process.exit(1);
    }
    
    // Output results
    if (result) {
      console.log('\n✅ SEO Analysis Complete');
      console.log(`SEO Score: ${result.score}/100`);
      
      console.log('\n🔍 Issues by Section:');
      result.sections.forEach(section => {
        console.log(`\n${section.name}:`);
        section.issues.forEach(issue => {
          console.log(`- ${issue.type}: ${issue.suggestion} (${issue.severity} severity)`);
        });
      });
      
      console.log('\n🔑 Keywords:');
      console.log('Current:', result.keywords.current.join(', '));
      console.log('Suggested:', result.keywords.suggested.join(', '));
      
      // Save to file if requested
      if (outputFile) {
        fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
        console.log(`\n💾 Results saved to ${outputFile}`);
      }
    }
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error('❌ Unhandled error:', error instanceof Error ? error.message : String(error));
  process.exit(1);
}); 