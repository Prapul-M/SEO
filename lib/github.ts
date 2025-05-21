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
      throw new Error('Not authenticated');
    }

    const octokit = new Octokit({
      auth: session.accessToken,
    });

    // Apply SEO improvements to the content
    const improvedContent = applySeoImprovements(content, path);
    
    // Update the file with improved content
    const response = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: commitMessage,
      content: Buffer.from(improvedContent).toString('base64'),
      sha,
      branch,
    });

    return response.data;
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
  // For now, this is a simplified example that makes basic improvements
  // In a real implementation, this would use more sophisticated analysis

  // Parse the HTML content
  let improvedContent = content;

  // Extract the filename from the path for title generation
  const fileName = filePath.split('/').pop()?.replace('.html', '') || 'Page';
  const pageTitle = fileName.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');

  // 1. Improve the title tag
  improvedContent = improvedContent.replace(
    /<title>(.*?)<\/title>/i,
    `<title>${pageTitle} - SEO Optimized Content for Better Rankings</title>`
  );

  // 2. Add meta description if missing
  if (!improvedContent.includes('<meta name="description"')) {
    improvedContent = improvedContent.replace(
      /<head>([\s\S]*?)<\/head>/i,
      `<head>$1
    <meta name="description" content="Discover ${pageTitle} - Optimized for search engines with comprehensive information and solutions. Click now for the best experience!">
  </head>`
    );
  } else {
    // Improve existing meta description
    improvedContent = improvedContent.replace(
      /<meta name="description" content="([^"]*)">/i,
      `<meta name="description" content="Discover ${pageTitle} - Optimized for search engines with comprehensive information and solutions. Click now for the best experience!">`
    );
  }

  // 3. Add meta keywords if missing
  if (!improvedContent.includes('<meta name="keywords"')) {
    improvedContent = improvedContent.replace(
      /<head>([\s\S]*?)<\/head>/i,
      `<head>$1
    <meta name="keywords" content="${pageTitle.toLowerCase()}, seo optimization, ${fileName.toLowerCase().replace('-', ' ')}, best practices">
  </head>`
    );
  }

  // 4. Improve H1 tags
  improvedContent = improvedContent.replace(
    /<h1>(.*?)<\/h1>/gi,
    (match, p1) => {
      // If H1 is too short, enhance it
      if (p1.trim().length < 20) {
        return `<h1>${p1} - Comprehensive Guide to Better SEO</h1>`;
      }
      return match;
    }
  );

  // 5. Add alt text to images without it
  improvedContent = improvedContent.replace(
    /<img(?!\s+alt=)[^>]*?src=["']([^"']*?)["'][^>]*?>/gi,
    (match, src) => {
      // Extract a descriptive name from the src attribute
      const imageName = src.split('/').pop()?.split('.')[0] || 'image';
      const descriptiveName = imageName.replace(/[-_]/g, ' ').replace(/\d+/g, '').trim();
      return match.replace('<img', `<img alt="Detailed ${descriptiveName} for ${pageTitle}"`);
    }
  );

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