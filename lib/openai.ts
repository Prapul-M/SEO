import OpenAI from 'openai';

// Initialize OpenAI client - either with API key or use mock functions
let openai: OpenAI | null = null;
const isMockMode = !process.env.OPENAI_API_KEY;

try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  } else {
    console.warn('OPENAI_API_KEY not found in environment variables. Using mock implementation for SEO analysis.');
  }
} catch (error) {
  console.error('Failed to initialize OpenAI client:', error);
}

// Define the SEO analysis result interface
export interface SeoAnalysisResult {
  score: number;
  sections: Array<{
    name: string;
    issues: Array<{
      type: string;
      element: string;
      issue: string;
      suggestion: string;
      severity: 'low' | 'medium' | 'high';
    }>;
  }>;
  keywords: {
    current: string[];
    suggested: string[];
  };
}

// Types for SEO elements
export interface SeoElement {
  type: string;
  selector: string;
  original: string;
  optimized?: string;
  confidence?: number;
}

// Analyze SEO for a webpage
export async function analyzeSeo(
  url: string,
  htmlContent: string,
  keywords?: string[]
): Promise<SeoAnalysisResult> {
  // Extract SEO elements from HTML
  const seoElements = extractSeoElements(htmlContent);

  // Prepare the prompt for GPT-4 Turbo
  const prompt = createSeoAnalysisPrompt(url, seoElements, keywords);

  try {
    // Check if OpenAI client is available
    if (!openai) {
      console.log('OpenAI client not available. Using mock implementation.');
      // Use the file path as a placeholder
      return getMockSeoAnalysis(`page-${Date.now()}.html`, htmlContent);
    }

    // Make API call to OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are an SEO expert analyzing a webpage. Provide detailed feedback and optimization suggestions.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
    });

    // Parse the response
    const responseContent = completion.choices[0].message.content;
    if (!responseContent) {
      throw new Error("No response from OpenAI");
    }

    const result = JSON.parse(responseContent) as SeoAnalysisResult;
    return result;
  } catch (error) {
    console.error("Error analyzing SEO with OpenAI:", error);
    // Fall back to mock implementation if there's an error
    return getMockSeoAnalysis(`page-${Date.now()}.html`, htmlContent);
  }
}

// Generate trending keywords related to a website
export async function generateTrendingKeywords(
  topic: string,
  count: number = 10
): Promise<string[]> {
  try {
    // Check if OpenAI client is available
    if (!openai) {
      console.log('OpenAI client not available. Using mock implementation.');
      return ["seo", "digital marketing", "website", "optimization", "content"];
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are an SEO expert. Generate trending and relevant keywords for the given topic.",
        },
        {
          role: "user",
          content: `Generate ${count} trending and relevant keywords for: ${topic}. Format as a JSON array of strings.`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const responseContent = completion.choices[0].message.content;
    if (!responseContent) {
      throw new Error("No response from OpenAI");
    }

    const result = JSON.parse(responseContent);
    return result.keywords as string[];
  } catch (error) {
    console.error("Error generating keywords with OpenAI:", error);
    return ["seo", "digital marketing", "website", "optimization", "content"];
  }
}

// Generate SEO-optimized content
export async function generateSeoContent(
  topic: string,
  keywords: string[],
  contentType: "title" | "description" | "heading" | "paragraph",
  length: number
): Promise<string> {
  try {
    // Check if OpenAI client is available
    if (!openai) {
      console.log('OpenAI client not available. Using mock implementation.');
      return `Example ${contentType} about ${topic} with keywords: ${keywords.join(', ')}`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: "You are an SEO content writer creating optimized content.",
        },
        {
          role: "user",
          content: `Write a ${contentType} about "${topic}" that is optimized for SEO. 
          Include these keywords naturally: ${keywords.join(", ")}. 
          Keep it under ${length} characters. 
          Return ONLY the content, no explanations.`,
        },
      ],
    });

    const responseContent = completion.choices[0].message.content;
    if (!responseContent) {
      throw new Error("No response from OpenAI");
    }

    return responseContent.trim();
  } catch (error) {
    console.error("Error generating SEO content with OpenAI:", error);
    return `Example ${contentType} about ${topic} with keywords: ${keywords.join(', ')}`;
  }
}

// Extract SEO elements from HTML
function extractSeoElements(html: string): Record<string, SeoElement> {
  // This is a simplified extraction - in a real app, you'd use a more robust HTML parser
  const titleMatch = html.match(/<title>(.*?)<\/title>/i);
  const descriptionMatch = html.match(
    /<meta\s+name=["']description["']\s+content=["'](.*?)["']/i
  );

  const elements: Record<string, SeoElement> = {
    title: {
      type: "title",
      selector: "title",
      original: titleMatch ? titleMatch[1] : "",
    },
    description: {
      type: "meta-description",
      selector: 'meta[name="description"]',
      original: descriptionMatch ? descriptionMatch[1] : "",
    },
  };

  return elements;
}

// Create a prompt for SEO analysis
function createSeoAnalysisPrompt(
  url: string,
  elements: Record<string, SeoElement>,
  keywords?: string[]
): string {
  return `
  Analyze the SEO of this webpage: ${url}
  
  Current SEO elements:
  - Title: "${elements.title.original}"
  - Meta Description: "${elements.description.original}"
  
  ${
    keywords && keywords.length > 0
      ? `Target keywords: ${keywords.join(", ")}`
      : "Generate appropriate keywords for this content."
  }
  
  Provide a comprehensive analysis including:
  1. Optimized versions of the title and meta description
  2. Keyword suggestions
  3. Overall SEO score (0-100)
  4. Specific improvement suggestions
  
  Return your analysis as a JSON object with the following structure:
  {
    "url": "the url",
    "title": {
      "type": "title",
      "selector": "title",
      "original": "original title",
      "optimized": "optimized title",
      "confidence": 85
    },
    "description": {
      "type": "meta-description",
      "selector": "meta[name=description]",
      "original": "original description",
      "optimized": "optimized description",
      "confidence": 85
    },
    "keywords": ["keyword1", "keyword2"],
    "suggestions": ["suggestion1", "suggestion2"],
    "score": 75
  }
  `;
}

/**
 * Analyze HTML content for SEO improvements
 */
export async function analyzeSeoWithAI(
  htmlContent: string,
  filePath: string
): Promise<SeoAnalysisResult> {
  if (!process.env.OPENAI_API_KEY) {
    console.log(`Analyzing SEO for ${filePath} (mock implementation)`);
    // For demo purposes, we're using a mock implementation when no API key is provided
    return getMockSeoAnalysis(filePath, htmlContent);
  }
  
  console.log(`Analyzing SEO for ${filePath} with OpenAI API`);
  
  try {
    // Extract a URL from the file path for the prompt
    const url = `https://example.com/${filePath}`;
    
    // Extract basic SEO elements from HTML
    const elements = extractSeoElements(htmlContent);
    
    // Create a suitable prompt for the analysis
    const prompt = createSeoAnalysisPrompt(url, elements);
    
    // Make the API call to OpenAI
    const completion = await openai!.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: "You are an SEO expert analyzing HTML content. Provide detailed feedback on SEO issues and optimization suggestions. Format your response as JSON."
        },
        {
          role: "user",
          content: `Analyze this HTML file ${filePath}:\n\n${htmlContent.substring(0, 10000)}\n\nProvide a comprehensive SEO analysis with specific issues and improvement suggestions. Return your analysis as a JSON object with fields for score, sections with issues, and keywords.`
        }
      ],
      temperature: 0.5,
      response_format: { type: "json_object" }
    });
    
    const responseContent = completion.choices[0].message.content;
    if (!responseContent) {
      throw new Error("No response from OpenAI");
    }
    
    // Try to parse the response as JSON
    try {
      const parsedResult = JSON.parse(responseContent);
      console.log("OpenAI response format:", Object.keys(parsedResult));
      
      // Calculate a score - handle different formats
      let score = 70; // Default score
      if (typeof parsedResult.score === 'number') {
        score = parsedResult.score;
      } else if (typeof parsedResult.score === 'string') {
        // Handle string scores like "Low", "Medium", "High"
        if (parsedResult.score.toLowerCase() === 'low') {
          score = 40;
        } else if (parsedResult.score.toLowerCase() === 'medium') {
          score = 60;
        } else if (parsedResult.score.toLowerCase() === 'high') {
          score = 80;
        } else {
          // Try to parse a number from the string
          const parsedScore = parseInt(parsedResult.score);
          if (!isNaN(parsedScore) && parsedScore >= 0 && parsedScore <= 100) {
            score = parsedScore;
          }
        }
      }
      
      // Handle different section formats
      let sections = [];
      
      // Case 1: Standard format with "sections" array
      if (Array.isArray(parsedResult.sections)) {
        sections = parsedResult.sections.map((section: any) => {
          // Handle different issue formats
          let issues = [];
          if (Array.isArray(section.issues)) {
            issues = section.issues.map((issue: any) => {
              if (typeof issue === 'string') {
                // Convert string issues to objects
                return {
                  type: section.name || section.section || 'general',
                  element: issue.includes('<') && issue.includes('>') ? issue : '<element>',
                  issue: issue,
                  suggestion: Array.isArray(section.suggestions) ? section.suggestions[0] : 'Improve this element',
                  severity: 'medium' as "low" | "medium" | "high"
                };
              } else {
                // Handle object issues
                return {
                  type: issue.type || section.name || section.section || 'general',
                  element: issue.element || '<element>',
                  issue: issue.issue || issue.description || issue.details || issue,
                  suggestion: issue.suggestion || issue.recommendations || issue.fix || 'Improve this element',
                  severity: (issue.severity || 'medium') as "low" | "medium" | "high"
                };
              }
            });
          } else if (typeof section.issues === 'object' && !Array.isArray(section.issues)) {
            // Handle case where issues is an object with keys
            issues = Object.entries(section.issues).map(([key, value]) => ({
              type: key,
              element: '<element>',
              issue: value as string,
              suggestion: Array.isArray(section.suggestions) ? section.suggestions[0] : 'Improve this element',
              severity: 'medium' as "low" | "medium" | "high"
            }));
          }
          
          return {
            name: section.name || section.section || 'General',
            issues
          };
        });
      }
      // Case 2: Format with section.issues and section.suggestions arrays
      else if (parsedResult.section && Array.isArray(parsedResult.section.issues) && Array.isArray(parsedResult.section.suggestions)) {
        const issues = parsedResult.section.issues.map((issue: any, index: number) => ({
          type: 'general',
          element: '<element>',
          issue: issue,
          suggestion: parsedResult.section.suggestions[index] || 'Improve this element',
          severity: 'medium' as "low" | "medium" | "high"
        }));
        
        sections = [{
          name: 'SEO Issues',
          issues
        }];
      }
      // Case 3: Format with top-level issues and suggestions arrays
      else if (Array.isArray(parsedResult.issues) && Array.isArray(parsedResult.suggestions)) {
        const issues = parsedResult.issues.map((issue: any, index: number) => ({
          type: 'general',
          element: '<element>',
          issue: issue,
          suggestion: parsedResult.suggestions[index] || 'Improve this element',
          severity: 'medium' as "low" | "medium" | "high"
        }));
        
        sections = [{
          name: 'SEO Issues',
          issues
        }];
      }
      // Case 4: Format with sections object where each key is a section name
      else if (parsedResult.sections && typeof parsedResult.sections === 'object' && !Array.isArray(parsedResult.sections)) {
        sections = Object.entries(parsedResult.sections).map(([sectionName, sectionData]) => {
          const sectionObj = sectionData as any;
          let issues = [];
          
          if (Array.isArray(sectionObj.issues)) {
            issues = sectionObj.issues.map((issue: any, index: number) => {
              if (typeof issue === 'string') {
                return {
                  type: sectionName.toLowerCase(),
                  element: '<element>',
                  issue: issue,
                  suggestion: Array.isArray(sectionObj.suggestions) ? sectionObj.suggestions[index] : 'Improve this element',
                  severity: 'medium' as "low" | "medium" | "high"
                };
              } else {
                return {
                  type: issue.type || sectionName.toLowerCase(),
                  element: issue.element || '<element>',
                  issue: issue.issue || issue.description || issue.details || issue,
                  suggestion: issue.suggestion || issue.recommendations || issue.fix || 'Improve this element',
                  severity: (issue.severity || 'medium') as "low" | "medium" | "high"
                };
              }
            });
          }
          
          return {
            name: sectionName,
            issues
          };
        });
      }
      
      // If we couldn't extract sections, try to extract standalone issues
      if (sections.length === 0) {
        sections = extractSectionsFromGenericResponse(parsedResult);
      }
      
      // Ensure we have at least one section with issues
      if (sections.length === 0 || sections.every((s: any) => s.issues.length === 0)) {
        sections = [{
          name: 'SEO Analysis',
          issues: [{
            type: 'general',
            element: '<html>...</html>',
            issue: 'AI analysis detected SEO improvements needed',
            suggestion: parsedResult.suggestions ? 
              (Array.isArray(parsedResult.suggestions) ? parsedResult.suggestions[0] : parsedResult.suggestions) 
              : 'Review the content and implement SEO best practices',
            severity: 'medium' as "low" | "medium" | "high"
          }]
        }];
      }
      
      // Handle keywords in different formats
      let keywords: {
        current: string[];
        suggested: string[];
      } = {
        current: [],
        suggested: []
      };
      
      if (parsedResult.keywords) {
        if (Array.isArray(parsedResult.keywords)) {
          // Simple array of keywords
          keywords.suggested = parsedResult.keywords;
        } else if (typeof parsedResult.keywords === 'object') {
          // Object with current and suggested
          keywords.current = parsedResult.keywords.current || parsedResult.keywords.existing || [];
          keywords.suggested = parsedResult.keywords.suggested || parsedResult.keywords.recommended || [];
        }
      } else if (parsedResult.suggestedKeywords) {
        // Direct suggestedKeywords array
        keywords.suggested = parsedResult.suggestedKeywords;
        if (parsedResult.currentKeywords) {
          keywords.current = parsedResult.currentKeywords;
        }
      }
      
      // Ensure arrays even if they were provided as strings
      if (typeof keywords.current === 'string') {
        keywords.current = (keywords.current as unknown as string).split(/,\s*/);
      }
      if (typeof keywords.suggested === 'string') {
        keywords.suggested = (keywords.suggested as unknown as string).split(/,\s*/);
      }
      
      // Ensure they're always arrays
      if (!Array.isArray(keywords.current)) keywords.current = [];
      if (!Array.isArray(keywords.suggested)) keywords.suggested = [];
      
      console.log(`SEO Analysis for ${filePath}: Score=${score}, Sections=${sections.length}, Issues=${sections.reduce((sum: number, s: any) => sum + s.issues.length, 0)}`);
      
      return {
        score,
        sections,
        keywords
      };
    } catch (parseError) {
      console.error("Failed to parse OpenAI response as JSON:", parseError);
      return getMockSeoAnalysis(filePath, htmlContent);
    }
  } catch (error) {
    console.error("Error in OpenAI SEO analysis:", error);
    // Fall back to mock implementation if there's an error
    return getMockSeoAnalysis(filePath, htmlContent);
  }
}

/**
 * Generate mock SEO analysis for demonstration purposes
 */
function getMockSeoAnalysis(filePath: string, htmlContent: string): SeoAnalysisResult {
  const fileName = filePath.split('/').pop() || 'index.html';
  
  // Simple HTML parsing to extract title, headings, etc.
  const titleMatch = htmlContent.match(/<title>(.*?)<\/title>/i);
  const h1Match = htmlContent.match(/<h1[^>]*>(.*?)<\/h1>/i);
  const metaDescMatch = htmlContent.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i);
  const imgTags = htmlContent.match(/<img[^>]*>/gi) || [];
  const imgWithoutAlt = imgTags.filter(img => !img.includes('alt='));
  
  // Extract words for basic keyword analysis
  const textContent = htmlContent
    .replace(/<[^>]*>/g, ' ') // Remove HTML tags
    .replace(/\s+/g, ' ')     // Normalize whitespace
    .toLowerCase();
  const words = textContent.split(/\s+/);
  const wordFreq: Record<string, number> = {};
  words.forEach(word => {
    if (word.length > 3) { // Only count words longer than 3 chars
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });
  
  // Get top keywords based on frequency
  const sortedWords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
  
  // Generate issues based on actual HTML content
  const issues = [];
  
  if (!titleMatch || titleMatch[1].length < 10) {
    issues.push({
      section: "Head Section",
      type: "title",
      element: titleMatch ? `<title>${titleMatch[1]}</title>` : "<title>Missing</title>",
      issue: "Title is too short or missing",
      suggestion: "Add a descriptive title with 50-60 characters including keywords",
      severity: "high" as const
    });
  }
  
  if (!metaDescMatch) {
    issues.push({
      section: "Head Section",
      type: "meta",
      element: "<meta>",
      issue: "Missing meta description",
      suggestion: "Add a compelling meta description with 150-160 characters",
      severity: "high" as const
    });
  }
  
  if (!h1Match) {
    issues.push({
      section: "Body Section",
      type: "h1",
      element: "<h1>Missing</h1>",
      issue: "Missing H1 heading",
      suggestion: "Add a descriptive H1 heading that includes your primary keyword",
      severity: "high" as const
    });
  }
  
  if (imgWithoutAlt.length > 0) {
    issues.push({
      section: "Body Section",
      type: "img",
      element: imgWithoutAlt[0],
      issue: `${imgWithoutAlt.length} image(s) missing alt text`,
      suggestion: "Add descriptive alt text to all images for better accessibility and SEO",
      severity: "medium" as const
    });
  }
  
  // Organize issues by section
  const sectionMap: Record<string, Array<any>> = {};
  issues.forEach(issue => {
    if (!sectionMap[issue.section]) {
      sectionMap[issue.section] = [];
    }
    sectionMap[issue.section].push({
      type: issue.type,
      element: issue.element,
      issue: issue.issue,
      suggestion: issue.suggestion,
      severity: issue.severity
    });
  });
  
  const sections = Object.entries(sectionMap).map(([name, issues]) => ({
    name,
    issues
  }));
  
  // If no issues were found, add some sample ones
  if (sections.length === 0) {
    sections.push({
      name: "Head Section",
      issues: [
        {
          type: "title",
          element: "<title>Current Title</title>",
          issue: "Title could be more descriptive",
          suggestion: "Update page titles to include target keywords",
          severity: "medium" as const
        }
      ]
    });
    
    sections.push({
      name: "Body Section",
      issues: [
        {
          type: "content",
          element: "<p>...</p>",
          issue: "Content may be too thin for SEO",
          suggestion: "Expand your content to cover the topic more comprehensively",
          severity: "medium" as const
        }
      ]
    });
  }
  
  // Calculate a score based on the number and severity of issues
  const baseScore = 85;
  const highSeverityCount = issues.filter(i => i.severity === "high").length;
  const mediumSeverityCount = issues.filter(i => i.severity === "medium").length;
  const scoreDeduction = (highSeverityCount * 10) + (mediumSeverityCount * 5);
  const finalScore = Math.max(50, Math.min(100, baseScore - scoreDeduction));
  
  return {
    score: finalScore,
    sections,
    keywords: {
      current: sortedWords,
      suggested: [
        "seo optimization", 
        "search engine", 
        fileName.replace('.html', '').toLowerCase(), 
        "website optimization", 
        "digital marketing"
      ]
    }
  };
}

// Helper function to extract sections from generic response formats
function extractSectionsFromGenericResponse(parsedResult: any): Array<{
  name: string;
  issues: Array<{
    type: string;
    element: string;
    issue: string;
    suggestion: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}> {
  const sections = [];
  
  // Try to find issues in various parts of the response
  if (parsedResult.title || parsedResult.metaDescription || parsedResult.headings) {
    const issues = [];
    
    // Title issues
    if (parsedResult.title) {
      issues.push({
        type: 'title',
        element: `<title>${typeof parsedResult.title === 'string' ? parsedResult.title : 'Current Title'}</title>`,
        issue: 'Title may need optimization',
        suggestion: 'Update the title to be more descriptive and include keywords',
        severity: 'medium' as const
      });
    }
    
    // Meta description issues
    if (parsedResult.metaDescription === '' || parsedResult.metaDescription === false) {
      issues.push({
        type: 'meta',
        element: '<meta name="description" content="">',
        issue: 'Missing meta description',
        suggestion: 'Add a descriptive meta description with keywords',
        severity: 'high' as const
      });
    }
    
    if (issues.length > 0) {
      sections.push({
        name: 'Head Section',
        issues
      });
    }
  }
  
  return sections;
} 