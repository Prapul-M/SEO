import { NextApiRequest, NextApiResponse } from 'next';
import { analyzeSeoWithAI } from '../../lib/openai';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Testing full SEO scan flow...');
  console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
  
  // Simple HTML with common SEO issues for testing
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Short Title</title>
  <!-- Missing meta description -->
</head>
<body>
  <!-- Missing H1 heading -->
  <p>This is a sample page with minimal content.</p>
  <img src="/logo.png"> <!-- Missing alt text -->
  <a href="https://example.com">Click here</a> <!-- Non-descriptive link text -->
</body>
</html>
  `;
  
  try {
    console.time('analyzeSeoWithAI');
    const result = await analyzeSeoWithAI(htmlContent, 'index.html');
    console.timeEnd('analyzeSeoWithAI');
    
    console.log('Analysis mode:', process.env.OPENAI_API_KEY ? 'REAL AI' : 'MOCK DATA');
    
    return res.status(200).json({
      success: true,
      message: 'Scan complete',
      usingRealApi: !!process.env.OPENAI_API_KEY,
      analysisTime: 'See server logs',
      result
    });
  } catch (error) {
    console.error('Error performing test scan:', error);
    return res.status(500).json({
      success: false,
      message: 'Error during scan',
      error: error instanceof Error ? error.message : String(error)
    });
  }
} 