import { Resend } from 'resend';

// Initialize Resend client with API key or use a mock implementation
let resendClient: Resend | null = null;
const isMockMode = !process.env.RESEND_API_KEY;

try {
  if (process.env.RESEND_API_KEY) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  } else {
    console.warn('RESEND_API_KEY not found in environment variables. Email sending will be mocked.');
  }
} catch (error) {
  console.error('Failed to initialize Resend client:', error);
}

// Interface for SEO report data
interface SeoReportData {
  projectName: string;
  url: string;
  overallScore: number;
  totalIssues: number;
  pagesAnalyzed: number;
  detailedAnalysis: Array<{
    filePath: string;
    score: number;
    sections: Array<{
      name: string;
      issues: Array<{
        type: string;
        element: string;
        issue: string;
        suggestion: string;
        severity: string;
      }>;
    }>;
    keywords: {
      current: string[];
      suggested: string[];
    };
  }>;
}

// Send an SEO report email
export async function sendSeoReport(
  to: string,
  data: SeoReportData
): Promise<boolean> {
  try {
    // If we're in mock mode or client failed to initialize, log the email and return success
    if (isMockMode || !resendClient) {
      console.log(`[MOCK EMAIL] Would send SEO report to ${to} for project ${data.projectName}`);
      console.log(`[MOCK EMAIL] SEO Score: ${data.overallScore}, Issues: ${data.totalIssues}`);
      return true;
    }

    // Create a color indicator for the SEO score
    const scoreColor = data.overallScore >= 80 
      ? '#4ade80' // green for good score
      : data.overallScore >= 60 
        ? '#facc15' // yellow for moderate score
        : '#f87171'; // red for poor score

    // Format the detailed analysis as HTML
    const pagesHtml = data.detailedAnalysis.map(page => `
      <div style="margin-bottom: 20px; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
        <div style="padding: 12px; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between;">
          <strong>${page.filePath}</strong>
          <span style="color: ${
            page.score >= 80 ? '#15803d' : page.score >= 60 ? '#a16207' : '#b91c1c'
          };">Score: ${page.score}</span>
        </div>
        <div style="padding: 12px;">
          <p><strong>Top Issues:</strong></p>
          <ul style="margin-top: 8px; padding-left: 20px;">
            ${page.sections.flatMap((section: { name: string; issues: Array<{ type: string; issue: string; suggestion: string }> }) => 
              section.issues.map((issue: { type: string; issue: string; suggestion: string }) => 
                `<li style="margin-bottom: 8px;">
                  <span style="display: inline-block; background-color: #e0f2fe; color: #0369a1; border-radius: 4px; padding: 2px 6px; font-size: 12px; margin-right: 6px;">${issue.type}</span>
                  <span style="color: #dc2626;">${issue.issue}</span>
                  <div style="margin-top: 4px; margin-left: 10px; color: #166534;">
                    Suggestion: ${issue.suggestion}
                  </div>
                </li>`
              ).join('')
            ).join('')}
          </ul>
        </div>
      </div>
    `).join('');

    // Send the email
    const { data: response, error } = await resendClient.emails.send({
      from: 'SEO Automation <seo-automation@example.com>',
      to: [to],
      subject: `SEO Analysis Report for ${data.projectName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #374151; margin-bottom: 10px;">SEO Analysis Report</h1>
            <p style="color: #6b7280; font-size: 16px; margin-top: 0;">${data.projectName}</p>
            <p style="color: #6b7280; font-size: 14px;">
              <a href="${data.url}" style="color: #3b82f6; text-decoration: none;">${data.url}</a>
            </p>
          </div>

          <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <div style="font-size: 14px; color: #374151;">
                <strong>Overall SEO Score</strong>
              </div>
              <div style="font-size: 24px; font-weight: bold; color: ${scoreColor};">
                ${data.overallScore}
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; text-align: center;">
              <div style="flex: 1; padding: 10px;">
                <div style="font-weight: bold; font-size: 20px; color: #374151;">${data.pagesAnalyzed}</div>
                <div style="font-size: 14px; color: #6b7280;">Pages Analyzed</div>
              </div>
              <div style="flex: 1; padding: 10px;">
                <div style="font-weight: bold; font-size: 20px; color: #374151;">${data.totalIssues}</div>
                <div style="font-size: 14px; color: #6b7280;">Issues Found</div>
              </div>
              <div style="flex: 1; padding: 10px;">
                <div style="font-weight: bold; font-size: 20px; color: #166534;">+${Math.min(30, 100 - data.overallScore)}%</div>
                <div style="font-size: 14px; color: #6b7280;">Potential Improvement</div>
              </div>
            </div>
          </div>

          <div style="margin-bottom: 30px;">
            <h2 style="color: #374151; font-size: 18px; margin-bottom: 15px;">Detailed Analysis</h2>
            ${pagesHtml}
          </div>

          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 14px; color: #6b7280;">
            <p>This report was generated automatically by the SEO Automation App.</p>
            <p>To apply these improvements, visit your dashboard and click "Apply Changes".</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending SEO report email:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to send SEO report email:', error);
    return false;
  }
} 