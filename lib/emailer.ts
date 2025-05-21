import { Resend } from 'resend';
import { SeoAnalysisResult } from './openai';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

// Send email notification about SEO changes
export async function sendSeoNotification(
  userEmail: string,
  websiteUrl: string,
  filePath: string,
  results: SeoAnalysisResult,
  prUrl?: string
): Promise<boolean> {
  try {
    const emailOptions: EmailOptions = {
      to: userEmail,
      subject: `SEO Improvements for ${websiteUrl}`,
      html: generateEmailHtml(websiteUrl, filePath, results, prUrl),
    };
    
    await resend.emails.send({
      from: 'SEO Automation <noreply@example.com>',
      ...emailOptions,
    });
    
    return true;
  } catch (error) {
    console.error('Error sending email notification:', error);
    return false;
  }
}

// Generate HTML content for the email
function generateEmailHtml(
  websiteUrl: string,
  filePath: string,
  results: SeoAnalysisResult,
  prUrl?: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>SEO Improvements</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #4F46E5;
            color: white;
            padding: 20px;
            border-radius: 8px 8px 0 0;
            text-align: center;
          }
          .content {
            padding: 20px;
            border: 1px solid #e1e1e1;
            border-top: none;
            border-radius: 0 0 8px 8px;
          }
          .score {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 20px;
          }
          .improvement {
            margin-bottom: 15px;
            padding-bottom: 15px;
            border-bottom: 1px solid #f0f0f0;
          }
          .label {
            font-weight: bold;
            margin-bottom: 5px;
          }
          .original {
            color: #666;
            background-color: #f9f9f9;
            padding: 8px;
            border-radius: 4px;
            margin-bottom: 5px;
          }
          .optimized {
            color: #4F46E5;
            background-color: #EEF2FF;
            padding: 8px;
            border-radius: 4px;
          }
          .keywords {
            margin-top: 20px;
          }
          .keyword {
            display: inline-block;
            margin-right: 8px;
            margin-bottom: 8px;
            padding: 5px 10px;
            background-color: #f0f0f0;
            border-radius: 15px;
            font-size: 12px;
          }
          .cta {
            margin-top: 30px;
            text-align: center;
          }
          .button {
            display: inline-block;
            padding: 10px 20px;
            background-color: #4F46E5;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>SEO Improvements</h1>
          <p>${websiteUrl}</p>
        </div>
        <div class="content">
          <p>We've analyzed your website and found some potential SEO improvements.</p>
          
          <div class="score">
            SEO Score: ${results.score}/100
          </div>
          
          ${results.title.optimized ? `
          <div class="improvement">
            <div class="label">Title Tag</div>
            <div class="original">Current: ${results.title.original}</div>
            <div class="optimized">Suggested: ${results.title.optimized}</div>
          </div>
          ` : ''}
          
          ${results.description.optimized ? `
          <div class="improvement">
            <div class="label">Meta Description</div>
            <div class="original">Current: ${results.description.original}</div>
            <div class="optimized">Suggested: ${results.description.optimized}</div>
          </div>
          ` : ''}
          
          <div class="keywords">
            <div class="label">Suggested Keywords</div>
            ${results.keywords.map(keyword => `<span class="keyword">${keyword}</span>`).join('')}
          </div>
          
          ${prUrl ? `
          <div class="cta">
            <p>We've created a pull request with these changes:</p>
            <a href="${prUrl}" class="button">View Pull Request</a>
          </div>
          ` : `
          <div class="cta">
            <p>View more details and apply these changes in your dashboard:</p>
            <a href="https://seo-automation-app.vercel.app/dashboard" class="button">Open Dashboard</a>
          </div>
          `}
          
          <p style="margin-top: 30px; font-size: 12px; color: #666; text-align: center;">
            You received this email because you enabled notifications for SEO improvements.
            <a href="https://seo-automation-app.vercel.app/settings" style="color: #666;">Manage email preferences</a>
          </p>
        </div>
      </body>
    </html>
  `;
} 