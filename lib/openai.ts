import OpenAI from 'openai';

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
    throw error;
  }
}

// Generate trending keywords related to a website
export async function generateTrendingKeywords(
  topic: string,
  count: number = 10
): Promise<string[]> {
  try {
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
    throw error;
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
    throw error;
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
  return getMockSeoAnalysis(filePath);
}

/**
 * Generate mock SEO analysis for demonstration purposes
 */
function getMockSeoAnalysis(filePath: string): SeoAnalysisResult {
  const fileName = filePath.split('/').pop() || 'index.html';
  
  return {
    score: Math.floor(Math.random() * 41) + 60, // Random score between 60-100
    sections: [
      {
        name: "Head Section",
        issues: [
          {
            type: "title",
            element: "<title>Current Title</title>",
            issue: "Title is too generic and missing keywords",
            suggestion: "Update page titles to include target keywords",
            severity: "high",
          },
          {
            type: "meta",
            element: '<meta name="description" content="Current description">',
            issue: "Meta description is too short and lacks call-to-action",
            suggestion: "Add meta descriptions with calls-to-action",
            severity: "medium",
          }
        ]
      },
      {
        name: "Body Section",
        issues: [
          {
            type: "h1",
            element: "<h1>Current Heading</h1>",
            issue: "H1 lacks descriptive keywords",
            suggestion: "Improve heading hierarchy and use more descriptive H1 tags",
            severity: "high",
          },
          {
            type: "img",
            element: '<img src="image.jpg">',
            issue: "Missing alt text for image",
            suggestion: "Add descriptive alt text to all images",
            severity: "medium",
          }
        ]
      }
    ],
    keywords: {
      current: ["website", "product", "service"],
      suggested: ["SEO optimization", "digital marketing", "website enhancement", "search engine ranking"]
    }
  };
} 