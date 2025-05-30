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
  
  // Apply improvements from each section
  for (const section of improvements.sections) {
    for (const issue of section.issues) {
      switch (issue.type) {
        case 'title':
          content = content.replace(
            /<title>(.*?)<\/title>/i,
            `<title>${issue.suggestion}</title>`
          );
          break;
        case 'meta-description':
          const descriptionRegex = /<meta\s+name=["']description["']\s+content=["'](.*?)["']/i;
          if (descriptionRegex.test(content)) {
            content = content.replace(
              descriptionRegex,
              `<meta name="description" content="${issue.suggestion}"`
            );
          } else {
            content = content.replace(
              /<\/title>/i,
              `</title>\n  <meta name="description" content="${issue.suggestion}">`
            );
          }
          break;
        case 'heading':
          // Extract heading level from the element (e.g., h1, h2, etc.)
          const headingMatch = issue.element.match(/<(h[1-6])[^>]*>/i);
          if (headingMatch && headingMatch[1]) {
            const headingTag = headingMatch[1];
            content = content.replace(
              new RegExp(`(<${headingTag}[^>]*>)(.*?)(</${headingTag}>)`, 'i'),
              `$1${issue.suggestion}$3`
            );
          }
          break;
      }
    }
  }
  
  return content;
}

// Generate PR description from improvements
function generatePrDescription(improvements: SeoAnalysisResult): string {
  const sections = improvements.sections.map(section => {
    const issues = section.issues.map(issue => 
      `- **${issue.type}**: ${issue.suggestion} (${issue.severity} severity)`
    ).join('\n');
    
    return `### ${section.name}\n${issues}`;
  }).join('\n\n');
  
  const keywords = `### Keywords\n- Current: ${improvements.keywords.current.join(', ')}\n- Suggested: ${improvements.keywords.suggested.join(', ')}`;
  
  return `# SEO Improvements

## Overall Score: ${improvements.score}/100

${sections}

${keywords}

These changes should help improve your website's SEO score and search engine rankings.`;
}

// Utility function to escape special characters in regex
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
} 