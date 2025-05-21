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
 * Analyze HTML content for SEO improvements (mock implementation)
 */
export async function analyzeSeoWithAI(
  htmlContent: string,
  filePath: string
): Promise<SeoAnalysisResult> {
  console.log(`Analyzing SEO for ${filePath} (mock implementation)`);
  
  // For demo purposes, we're using a mock implementation
  return getMockSeoAnalysis(filePath, htmlContent);
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