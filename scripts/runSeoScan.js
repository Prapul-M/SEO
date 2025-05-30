// This script is run by the GitHub Action to perform daily SEO scans
// For all connected repositories of all users who have enabled automatic scanning
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');
const { Octokit } = require('@octokit/rest');
const { Configuration, OpenAIApi } = require('openai');
const { Resend } = require('resend');

// Initialize clients
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const openai = new OpenAIApi(
  new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  })
);

const resend = new Resend(process.env.RESEND_API_KEY);

async function main() {
  console.log('🚀 Starting daily SEO scan...');

  try {
    // 1. Get all users with auto-scan enabled
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, github_token')
      .eq('auto_scan_enabled', true);

    if (usersError) {
      throw new Error(`Error fetching users: ${usersError.message}`);
    }

    console.log(`Found ${users.length} users with auto-scan enabled`);

    // 2. For each user, get their connected repositories
    for (const user of users) {
      if (!user.github_token) {
        console.log(`User ${user.id} has no GitHub token, skipping`);
        continue;
      }

      // Create GitHub client with user's token
      const octokit = new Octokit({
        auth: user.github_token,
      });

      // 3. Get user's repositories
      const { data: repos, error: reposError } = await supabase
        .from('repositories')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (reposError) {
        console.error(`Error fetching repositories for user ${user.id}: ${reposError.message}`);
        continue;
      }

      console.log(`Processing ${repos.length} repositories for user ${user.id}`);

      // 4. For each repository, perform SEO scan
      for (const repo of repos) {
        try {
          console.log(`Scanning repository: ${repo.owner}/${repo.name}`);

          // 5. Get HTML files from repository
          const htmlFiles = await getHtmlFiles(octokit, repo.owner, repo.name, repo.default_branch);
          console.log(`Found ${htmlFiles.length} HTML files`);

          if (htmlFiles.length === 0) {
            continue;
          }

          // 6. For each HTML file, analyze SEO
          for (const file of htmlFiles.slice(0, 5)) { // Limit to 5 files per repo to avoid API rate limits
            try {
              // 7. Get file content
              const content = await getFileContent(octokit, repo.owner, repo.name, file, repo.default_branch);
              
              // 8. Analyze SEO with OpenAI
              const seoAnalysis = await analyzeSeo(file, content);
              
              // 9. Save results to database
              const { data: result, error: resultError } = await supabase
                .from('seo_results')
                .insert({
                  user_id: user.id,
                  repository_id: repo.id,
                  file_path: file,
                  analysis: seoAnalysis,
                  created_at: new Date().toISOString(),
                });
              
              if (resultError) {
                console.error(`Error saving SEO results: ${resultError.message}`);
                continue;
              }
              
              // 10. Send email notification if score below threshold
              if (seoAnalysis.score < 70) {
                await sendNotificationEmail(user.email, repo, file, seoAnalysis);
              }
              
              console.log(`✅ Analyzed ${file} - SEO Score: ${seoAnalysis.score}`);
            } catch (fileError) {
              console.error(`Error processing file ${file}: ${fileError.message}`);
            }
          }
        } catch (repoError) {
          console.error(`Error processing repository ${repo.owner}/${repo.name}: ${repoError.message}`);
        }
      }
    }

    console.log('✅ Daily SEO scan completed successfully');
  } catch (error) {
    console.error('❌ Error performing daily SEO scan:', error);
    process.exit(1);
  }
}

// Helper functions
async function getHtmlFiles(octokit, owner, repo, branch) {
  const htmlFiles = [];
  
  async function traverseDir(path = '') {
    try {
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path,
        ref: branch,
      });
      
      if (Array.isArray(data)) {
        for (const item of data) {
          if (item.type === 'dir') {
            await traverseDir(item.path);
          } else if (item.type === 'file' && (item.name.endsWith('.html') || item.name.endsWith('.htm'))) {
            htmlFiles.push(item.path);
          }
        }
      }
    } catch (error) {
      console.error(`Error traversing directory ${path}:`, error);
    }
  }
  
  await traverseDir();
  return htmlFiles;
}

async function getFileContent(octokit, owner, repo, path, branch) {
  const { data } = await octokit.repos.getContent({
    owner,
    repo,
    path,
    ref: branch,
  });
  
  return Buffer.from(data.content, 'base64').toString();
}

async function analyzeSeo(url, content) {
  const prompt = `
    Analyze the SEO of this HTML content for the URL: ${url}
    
    Content: ${content.substring(0, 8000)}${content.length > 8000 ? '... (truncated)' : ''}
    
    Provide a comprehensive SEO analysis including:
    1. Optimized versions of the title and meta description
    2. Keyword suggestions
    3. Overall SEO score (0-100)
    4. Specific improvement suggestions
    
    Return your analysis as a JSON object with the following structure:
    {
      "url": "the url",
      "title": {
        "selector": "title",
        "original": "original title",
        "optimized": "optimized title",
        "confidence": 85
      },
      "description": {
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
  
  const completion = await openai.createChatCompletion({
    model: "gpt-4-turbo",
    messages: [
      {
        role: "system",
        content: "You are an SEO expert analyzing a webpage. Provide detailed feedback and optimization suggestions."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    response_format: { type: "json_object" }
  });
  
  return JSON.parse(completion.data.choices[0].message.content);
}

async function sendNotificationEmail(email, repo, file, analysis) {
  try {
    await resend.emails.send({
      from: 'SEO AI <noreply@seo-ai.example.com>',
      to: email,
      subject: `SEO Improvement Opportunity: ${file}`,
      html: `
        <h1>SEO Improvements Detected</h1>
        <p>We've analyzed <strong>${file}</strong> in your repository <strong>${repo.owner}/${repo.name}</strong> and found some SEO improvements.</p>
        <p>Current SEO Score: <strong>${analysis.score}/100</strong></p>
        <h2>Suggestions:</h2>
        <ul>
          ${analysis.suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
        </ul>
        <p><a href="https://seo-automation-app.vercel.app/dashboard">View Details in Dashboard</a></p>
      `,
    });
    
    console.log(`📧 Sent notification email to ${email}`);
  } catch (error) {
    console.error(`Error sending email: ${error.message}`);
  }
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 