import { NextApiRequest, NextApiResponse } from 'next';
import { analyzeSeoWithAI } from '../../lib/openai';

// Sample HTML content for testing
const sampleHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Test Page for SEO Analysis</title>
  <meta name="description" content="A test page to check if OpenAI integration is working">
</head>
<body>
  <h1>SEO Test Page</h1>
  <p>This is a sample page to test our OpenAI integration for SEO analysis.</p>
  <img src="test.jpg" alt="Test image with alt">
  <img src="missing-alt.jpg">
</body>
</html>
`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Testing OpenAI integration...');
  console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
  console.log('OPENAI_API_KEY length:', process.env.OPENAI_API_KEY?.length);
  
  try {
    const result = await analyzeSeoWithAI(sampleHtml, 'test-page.html');
    return res.status(200).json({
      success: true,
      message: 'Analysis complete',
      apiKeyExists: !!process.env.OPENAI_API_KEY,
      result
    });
  } catch (error) {
    console.error('Error testing OpenAI integration:', error);
    return res.status(500).json({
      success: false,
      message: 'Error analyzing SEO',
      error: error instanceof Error ? error.message : String(error)
    });
  }
} 