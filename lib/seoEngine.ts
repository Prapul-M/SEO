import { Session } from "next-auth";
import { getFileContent, getHtmlFiles, createBranch, updateFile, createPullRequest } from "./github";
import { analyzeSeo, SeoAnalysisResult, generateTrendingKeywords } from "./openai";
import { fetchTrendingKeywords } from "./trends";

export interface ScanOptions {
  owner: string;
  repo: string;
  branch?: string;
  includePatterns?: string[];
  excludePatterns?: string[];
  useAIKeywords?: boolean;
  additionalKeywords?: string[];
}

export interface ScanResult {
  url: string;
  filePath: string;
  results: SeoAnalysisResult;
}

// Main function to scan a GitHub repository for SEO improvements
export async function scanRepository(
  session: Session, 
  options: ScanOptions
): Promise<ScanResult[]> {
  const { owner, repo, branch, includePatterns, excludePatterns, useAIKeywords, additionalKeywords } = options;
  
  // Get the default branch if not specified
  const branchName = branch || "main";
  
  try {
    // Get all HTML files in the repository
    const htmlFiles = await getHtmlFiles(session, owner, repo, "", branchName);
    
    // Filter files based on patterns if provided
    const filteredFiles = filterFiles(htmlFiles, includePatterns, excludePatterns);
    
    // Prepare keywords if needed
    let keywords: string[] = additionalKeywords || [];
    if (useAIKeywords) {
      const aiKeywords = await generateTrendingKeywords(`${owner}/${repo} website`);
      keywords = [...keywords, ...aiKeywords];
    }
    
    // For Google Trends API (if available)
    try {
      const trendingKeywords = await fetchTrendingKeywords(keywords.slice(0, 5));
      keywords = [...keywords, ...trendingKeywords];
    } catch (error) {
      console.warn("Could not fetch trending keywords from Google Trends", error);
    }
    
    // Analyze each file
    const results: ScanResult[] = [];
    for (const filePath of filteredFiles) {
      // Get file content
      const { content, sha } = await getFileContent(session, owner, repo, filePath, branchName);
      
      // Extract base URL for this file
      const baseUrl = `https://${owner}.github.io/${repo}/${filePath}`;
      
      // Analyze the content
      const analysis = await analyzeSeo(baseUrl, content, keywords);
      
      results.push({
        url: baseUrl,
        filePath,
        results: analysis,
      });
    }
    
    return results;
  } catch (error) {
    console.error("Error scanning repository:", error);
    throw error;
  }
}

// Apply suggested SEO improvements and create a pull request
export async function applySeoImprovements(
  session: Session,
  owner: string,
  repo: string,
  filePath: string,
  originalContent: string,
  improvements: SeoAnalysisResult,
  baseBranch: string = "main"
): Promise<string> {
  try {
    // Get the current SHA of the file
    const { sha } = await getFileContent(session, owner, repo, filePath, baseBranch);
    
    // Create a new branch for the PR
    const newBranch = `seo-improvements-${Date.now()}`;
    await createBranch(session, owner, repo, baseBranch, newBranch);
    
    // Apply improvements to the content
    const improvedContent = applyImprovements(originalContent, improvements);
    
    // Update the file in the new branch
    await updateFile(
      session,
      owner,
      repo,
      filePath,
      improvedContent,
      sha,
      newBranch,
      `SEO improvements for ${filePath}`
    );
    
    // Create a pull request
    const prBody = generatePrDescription(improvements);
    const prUrl = await createPullRequest(
      session,
      owner,
      repo,
      newBranch,
      baseBranch,
      `SEO improvements for ${filePath}`,
      prBody
    );
    
    return prUrl;
  } catch (error) {
    console.error("Error applying SEO improvements:", error);
    throw error;
  }
}

// Filter files based on include and exclude patterns
function filterFiles(
  files: string[],
  includePatterns?: string[],
  excludePatterns?: string[]
): string[] {
  let filteredFiles = [...files];
  
  if (includePatterns && includePatterns.length > 0) {
    filteredFiles = filteredFiles.filter(file => 
      includePatterns.some(pattern => file.includes(pattern))
    );
  }
  
  if (excludePatterns && excludePatterns.length > 0) {
    filteredFiles = filteredFiles.filter(file => 
      !excludePatterns.some(pattern => file.includes(pattern))
    );
  }
  
  return filteredFiles;
}

// Apply SEO improvements to HTML content
function applyImprovements(
  originalContent: string,
  improvements: SeoAnalysisResult
): string {
  let content = originalContent;
  
  // Update the title
  if (improvements.title.optimized) {
    content = content.replace(
      /<title>(.*?)<\/title>/i,
      `<title>${improvements.title.optimized}</title>`
    );
  }
  
  // Update the meta description
  if (improvements.description.optimized) {
    const descriptionRegex = /<meta\s+name=["']description["']\s+content=["'](.*?)["']/i;
    if (descriptionRegex.test(content)) {
      content = content.replace(
        descriptionRegex,
        `<meta name="description" content="${improvements.description.optimized}"`
      );
    } else {
      // If no meta description exists, add one after the title
      content = content.replace(
        /<\/title>/i,
        `</title>\n  <meta name="description" content="${improvements.description.optimized}">`
      );
    }
  }
  
  // Update headings if available
  if (improvements.headings && improvements.headings.length > 0) {
    for (const heading of improvements.headings) {
      if (heading.optimized && heading.selector) {
        // Simple replacement based on the original content
        // In a real app, you'd use a proper HTML parser to ensure correct replacements
        if (heading.original) {
          content = content.replace(
            new RegExp(`(<${heading.selector}[^>]*>)${escapeRegExp(heading.original)}(</${heading.selector.split(' ')[0]}>)`, 'i'),
            `$1${heading.optimized}$2`
          );
        }
      }
    }
  }
  
  // Update image alt texts if available
  if (improvements.images && improvements.images.length > 0) {
    for (const image of improvements.images) {
      if (image.optimized && image.original !== undefined) {
        content = content.replace(
          new RegExp(`alt=["']${escapeRegExp(image.original)}["']`, 'i'),
          `alt="${image.optimized}"`
        );
      }
    }
  }
  
  return content;
}

// Generate the PR description based on the improvements
function generatePrDescription(improvements: SeoAnalysisResult): string {
  return `
# SEO Improvements

This PR contains automated SEO improvements generated by the SEO AI Automation tool.

## Summary
- Overall SEO score: ${improvements.score}/100
- Keywords: ${improvements.keywords.join(", ")}

## Changes Made
${improvements.title.optimized ? `- **Title**: Updated to "${improvements.title.optimized}"` : ''}
${improvements.description.optimized ? `- **Meta Description**: Updated to "${improvements.description.optimized}"` : ''}
${improvements.headings && improvements.headings.length > 0 ? 
  `- **Headings**: Updated ${improvements.headings.length} headings for better SEO` : ''}
${improvements.images && improvements.images.length > 0 ? 
  `- **Images**: Improved alt text for ${improvements.images.length} images` : ''}

## Suggestions for Further Improvement
${improvements.suggestions.map(suggestion => `- ${suggestion}`).join("\n")}

---
Generated by SEO AI Automation
`;
}

// Utility function to escape special characters in regex
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
} 