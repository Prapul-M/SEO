import { Octokit } from "@octokit/rest";
import { Session } from "next-auth";

// Extend the Session type to include the properties we need
interface ExtendedSession extends Session {
  accessToken?: string;
  token?: {
    accessToken?: string;
  };
}

// Initialize Octokit client
let octokit: Octokit | null = null;

// Get authenticated Octokit client
export async function getOctokit(session: ExtendedSession): Promise<Octokit> {
  // If we have a cached client with a valid token, use it
  if (octokit) return octokit;

  // Get the token from session
  // First check for token in the right format after our JWT updates
  const accessToken = session.accessToken || 
                     session.token?.accessToken || 
                     process.env.GITHUB_TOKEN;
                     
  if (!accessToken) {
    console.error("No GitHub token found in session or env variables:", session);
    throw new Error("GitHub token not found in session");
  }

  // Create a new client
  octokit = new Octokit({
    auth: accessToken,
  });

  return octokit;
}

// Type for GitHub repository
export interface GithubRepo {
  owner: string;
  repo: string;
  defaultBranch: string;
}

// Get user's repositories
export async function getUserRepositories(
  session: ExtendedSession
): Promise<GithubRepo[]> {
  const client = await getOctokit(session);

  try {
    const { data: repos } = await client.repos.listForAuthenticatedUser({
      visibility: "all",
      sort: "updated",
      per_page: 100,
    });

    return repos.map((repo) => ({
      owner: repo.owner.login,
      repo: repo.name,
      defaultBranch: repo.default_branch,
    }));
  } catch (error) {
    console.error("Error fetching user repositories:", error);
    throw error;
  }
}

// Get file content from a repository
export async function getFileContent(
  session: any,
  owner: string,
  repo: string,
  path: string,
  branch: string = 'main'
): Promise<any> {
  try {
    if (!session?.accessToken) {
      throw new Error('Not authenticated');
    }

    const octokit = new Octokit({
      auth: session.accessToken,
    });

    const response = await octokit.repos.getContent({
      owner,
      repo,
      path,
      ref: branch,
    });

    // Check if the response data is an array (directory) or a single file
    if (Array.isArray(response.data)) {
      throw new Error('Path is a directory, not a file');
    }

    // Check if response data has the right structure
    // Make sure it is a file type response with content
    if (
      'type' in response.data && 
      response.data.type === 'file' && 
      'content' in response.data
    ) {
      // GitHub API returns content as base64
      const content = Buffer.from(response.data.content, 'base64').toString();
      return {
        content,
        sha: response.data.sha, // Need this for updating the file later
      };
    } else {
      throw new Error('Invalid file response from GitHub API');
    }
  } catch (error) {
    console.error('Error getting file content:', error);
    throw error;
  }
}

// Create a new branch for SEO improvements
export async function createBranch(
  session: any,
  owner: string,
  repo: string,
  baseBranch: string,
  newBranchName: string
): Promise<void> {
  try {
    if (!session?.accessToken) {
      throw new Error('Not authenticated');
    }

    const octokit = new Octokit({
      auth: session.accessToken,
    });

    // Get the SHA of the latest commit on the base branch
    const { data: refData } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${baseBranch}`,
    });

    // Create a new branch using the SHA of the base branch
    await octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${newBranchName}`,
      sha: refData.object.sha,
    });
  } catch (error) {
    console.error('Error creating branch:', error);
    throw error;
  }
}

// Update a file with SEO improvements
export async function updateFile(
  session: any,
  owner: string,
  repo: string,
  path: string,
  content: string,
  sha: string,
  branch: string,
  commitMessage: string
): Promise<any> {
  try {
    if (!session?.accessToken) {
      console.error('No access token provided');
      throw new Error('Not authenticated');
    }

    const octokit = new Octokit({
      auth: session.accessToken,
    });

    // Apply SEO improvements to the content
    console.log(`Applying SEO improvements to ${path}`);
    const improvedContent = applySeoImprovements(content, path);
    
    // Log differences for debugging
    if (improvedContent === content) {
      console.log(`No changes made to ${path}`);
    } else {
      console.log(`Changes made to ${path}`);
    }
    
    // Update the file with improved content
    try {
      const response = await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message: commitMessage,
        content: Buffer.from(improvedContent).toString('base64'),
        sha,
        branch,
      });
      
      console.log(`Successfully updated ${path} in branch ${branch}`);
      return response.data;
    } catch (apiError: any) {
      console.error(`GitHub API error updating ${path}:`, apiError.message);
      
      // Provide more specific error information
      if (apiError.status === 409) {
        throw new Error(`Conflict while updating ${path}. The file may have been modified elsewhere.`);
      } else if (apiError.status === 422) {
        throw new Error(`Validation failed for ${path}. There might be no changes or the branch might not exist.`);
      } else {
        throw new Error(`Failed to update ${path}: ${apiError.message}`);
      }
    }
  } catch (error) {
    console.error('Error updating file:', error);
    throw error;
  }
}

// Create a pull request with the SEO improvements
export async function createPullRequest(
  session: any,
  owner: string,
  repo: string,
  head: string,
  base: string,
  title: string,
  body: string
): Promise<string> {
  try {
    if (!session?.accessToken) {
      throw new Error('Not authenticated');
    }

    const octokit = new Octokit({
      auth: session.accessToken,
    });

    const { data } = await octokit.pulls.create({
      owner,
      repo,
      head,
      base,
      title,
      body,
    });

    return data.html_url;
  } catch (error) {
    console.error('Error creating pull request:', error);
    throw error;
  }
}

// Helper function to apply SEO improvements to HTML content
function applySeoImprovements(content: string, filePath: string): string {
  console.log(`Starting SEO improvements for ${filePath}`);
  
  // Parse the HTML content
  let improvedContent = content;
  let changes = 0;

  // Extract the filename from the path for title generation
  const fileName = filePath.split('/').pop()?.replace('.html', '') || 'Page';
  const pageTitle = fileName.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
  
  // Generate keywords based on the filename and path
  const keywords = [
    fileName.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim(), 
    ...filePath.split('/').map(part => part.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim()),
    'seo optimization',
    'search engine visibility',
    'website improvement'
  ].filter(Boolean);

  // 1. Improve the title tag
  const titleRegex = /<title>(.*?)<\/title>/i;
  const titleMatch = improvedContent.match(titleRegex);
  if (titleMatch) {
    const newTitle = `<title>${pageTitle} - SEO Optimized Content for Better Rankings</title>`;
    improvedContent = improvedContent.replace(titleRegex, newTitle);
    console.log(`Updated title: ${titleMatch[1]} -> ${pageTitle} - SEO Optimized Content for Better Rankings`);
    changes++;
  } else {
    // Add title tag if missing
    improvedContent = improvedContent.replace(
      /<head>([\s\S]*?)/i,
      `<head>$1\n  <title>${pageTitle} - SEO Optimized Content for Better Rankings</title>`
    );
    console.log(`Added missing title tag: ${pageTitle} - SEO Optimized Content for Better Rankings`);
    changes++;
  }

  // 2. Add or improve meta description
  const metaDescRegex = /<meta\s+name=["']description["']\s+content=["'](.*?)["']/i;
  const metaDescMatch = improvedContent.match(metaDescRegex);
  const newDesc = `Discover ${pageTitle} - Optimized for search engines with comprehensive information and solutions. Learn about ${keywords.slice(0, 3).join(', ')} and more.`;
  
  if (metaDescMatch) {
    improvedContent = improvedContent.replace(metaDescRegex, `<meta name="description" content="${newDesc}">`);
    console.log(`Updated meta description: ${metaDescMatch[1]} -> ${newDesc}`);
    changes++;
  } else {
    // Add meta description if missing
    improvedContent = improvedContent.replace(
      /<head>([\s\S]*?)<\/head>/i,
      `<head>$1\n  <meta name="description" content="${newDesc}">\n</head>`
    );
    console.log(`Added missing meta description: ${newDesc}`);
    changes++;
  }

  // 3. Add meta keywords if missing
  const metaKeywordsRegex = /<meta\s+name=["']keywords["']\s+content=["'](.*?)["']/i;
  const keywordsString = keywords.slice(0, 8).join(', ');
  
  if (!improvedContent.match(metaKeywordsRegex)) {
    improvedContent = improvedContent.replace(
      /<head>([\s\S]*?)<\/head>/i,
      `<head>$1\n  <meta name="keywords" content="${keywordsString}">\n</head>`
    );
    console.log(`Added meta keywords: ${keywordsString}`);
    changes++;
  }

  // 4. Add cannonical link if missing
  if (!improvedContent.includes('<link rel="canonical"')) {
    improvedContent = improvedContent.replace(
      /<head>([\s\S]*?)<\/head>/i,
      `<head>$1\n  <link rel="canonical" href="https://example.com/${filePath}">\n</head>`
    );
    console.log(`Added canonical link`);
    changes++;
  }

  // 5. Improve H1 tags or add if missing
  const h1Regex = /<h1[^>]*>(.*?)<\/h1>/gi;
  let h1Match;
  const h1Matches = [];
  
  // Collect all H1 matches
  while ((h1Match = h1Regex.exec(improvedContent)) !== null) {
    h1Matches.push(h1Match);
  }
  
  if (h1Matches.length > 0) {
    // Improve existing H1 tags
    h1Matches.forEach((match) => {
      const originalH1 = match[1];
      if (originalH1.trim().length < 20) {
        const newH1 = `${originalH1} - Comprehensive Guide to Better SEO`;
        improvedContent = improvedContent.replace(
          `<h1>${originalH1}</h1>`,
          `<h1>${newH1}</h1>`
        );
        console.log(`Updated H1: ${originalH1} -> ${newH1}`);
        changes++;
      }
    });
  } else {
    // Add H1 tag if missing, right after body tag
    improvedContent = improvedContent.replace(
      /<body[^>]*>([\s\S]*?)/i,
      `<body>\n  <h1>${pageTitle} - Complete Guide</h1>$1`
    );
    console.log(`Added missing H1: ${pageTitle} - Complete Guide`);
    changes++;
  }

  // 6. Add alt text to images without it
  const imgRegex = /<img(?!\s+alt=)[^>]*?src=["']([^"']*?)["'][^>]*?>/gi;
  let imgMatch;
  const imgMatches = [];
  
  // Collect all img matches that don't have alt attribute
  while ((imgMatch = imgRegex.exec(improvedContent)) !== null) {
    imgMatches.push(imgMatch);
  }
  
  imgMatches.forEach((match) => {
    const originalImg = match[0];
    const imgSrc = match[1];
    const imageName = imgSrc.split('/').pop()?.split('.')[0] || 'image';
    const descriptiveName = imageName.replace(/[-_]/g, ' ').replace(/\d+/g, '').trim() || pageTitle;
    
    const newImg = originalImg.replace('<img', `<img alt="Detailed ${descriptiveName} for ${pageTitle}"`);
    improvedContent = improvedContent.replace(originalImg, newImg);
    console.log(`Added alt text to image: ${imgSrc}`);
    changes++;
  });

  // 7. Improve meta viewport if missing
  if (!improvedContent.includes('<meta name="viewport"')) {
    improvedContent = improvedContent.replace(
      /<head>([\s\S]*?)<\/head>/i,
      `<head>$1\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n</head>`
    );
    console.log(`Added meta viewport tag`);
    changes++;
  }
  
  console.log(`Made ${changes} SEO improvements to ${filePath}`);
  return improvedContent;
}

// Get all HTML files in a repository
export async function getHtmlFiles(
  session: ExtendedSession,
  owner: string,
  repo: string,
  path: string = "",
  branch?: string
): Promise<string[]> {
  const client = await getOctokit(session);
  const htmlFiles: string[] = [];

  async function traverseDir(currentPath: string) {
    try {
      const { data } = await client.repos.getContent({
        owner,
        repo,
        path: currentPath,
        ref: branch,
      });

      // If it's a directory, traverse it recursively
      if (Array.isArray(data)) {
        for (const item of data) {
          if (item.type === "dir") {
            await traverseDir(item.path);
          } else if (
            item.type === "file" &&
            (item.name.endsWith(".html") || item.name.endsWith(".htm"))
          ) {
            htmlFiles.push(item.path);
          }
        }
      }
    } catch (error) {
      console.error(`Error traversing directory ${currentPath}:`, error);
    }
  }

  await traverseDir(path);
  return htmlFiles;
} 