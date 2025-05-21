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

// Get content of a file
export async function getFileContent(
  session: ExtendedSession,
  owner: string,
  repo: string,
  path: string,
  ref?: string
): Promise<{ content: string; sha: string }> {
  const client = await getOctokit(session);

  try {
    const response = await client.repos.getContent({
      owner,
      repo,
      path,
      ref,
    });

    // @ts-ignore - The response data type is complex
    const content = Buffer.from(response.data.content, "base64").toString();
    // @ts-ignore
    const sha = response.data.sha;

    return { content, sha };
  } catch (error) {
    console.error(`Error fetching file content for ${path}:`, error);
    throw error;
  }
}

// Create a new branch
export async function createBranch(
  session: ExtendedSession,
  owner: string,
  repo: string,
  baseBranch: string,
  newBranch: string
): Promise<void> {
  const client = await getOctokit(session);

  try {
    // Get the SHA of the latest commit on the base branch
    const { data: refData } = await client.git.getRef({
      owner,
      repo,
      ref: `heads/${baseBranch}`,
    });

    // Create the new branch
    await client.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${newBranch}`,
      sha: refData.object.sha,
    });
  } catch (error) {
    console.error(`Error creating branch ${newBranch}:`, error);
    throw error;
  }
}

// Update a file in a repository
export async function updateFile(
  session: ExtendedSession,
  owner: string,
  repo: string,
  path: string,
  content: string,
  sha: string,
  branch: string,
  message: string
): Promise<void> {
  const client = await getOctokit(session);

  try {
    await client.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message,
      content: Buffer.from(content).toString("base64"),
      sha,
      branch,
    });
  } catch (error) {
    console.error(`Error updating file ${path}:`, error);
    throw error;
  }
}

// Create a pull request
export async function createPullRequest(
  session: ExtendedSession,
  owner: string,
  repo: string,
  head: string,
  base: string,
  title: string,
  body: string
): Promise<string> {
  const client = await getOctokit(session);

  try {
    const { data } = await client.pulls.create({
      owner,
      repo,
      head,
      base,
      title,
      body,
    });

    return data.html_url;
  } catch (error) {
    console.error("Error creating pull request:", error);
    throw error;
  }
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