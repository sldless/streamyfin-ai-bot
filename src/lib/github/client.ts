import { Octokit } from "@octokit/rest";

let octokit: Octokit | null = null;

function getOctokit(): Octokit {
  if (!octokit) {
    if (!process.env.GITHUB_TOKEN) {
      throw new Error("GITHUB_TOKEN is required");
    }
    octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });
  }
  return octokit;
}

export interface GitHubIssue {
  number: number;
  title: string;
  state: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  body?: string;
}

export interface GitHubPullRequest {
  number: number;
  title: string;
  state: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  body?: string;
  merged_at?: string;
}

export interface GitHubContributor {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  contributions: number;
}

export async function listIssues(
  owner: string,
  repo: string,
  state: "open" | "closed" | "all" = "open"
): Promise<GitHubIssue[]> {
  const client = getOctokit();

  try {
    const { data } = await client.issues.listForRepo({
      owner,
      repo,
      state,
      per_page: 100,
    });

    return data.map((issue) => ({
      number: issue.number,
      title: issue.title,
      state: issue.state,
      html_url: issue.html_url,
      created_at: issue.created_at,
      updated_at: issue.updated_at,
      body: issue.body || undefined,
    }));
  } catch (error) {
    console.error("Error listing issues:", error);
    return [];
  }
}

export async function getIssue(
  owner: string,
  repo: string,
  issueNumber: number
): Promise<GitHubIssue | null> {
  const client = getOctokit();

  try {
    const { data } = await client.issues.get({
      owner,
      repo,
      issue_number: issueNumber,
    });

    return {
      number: data.number,
      title: data.title,
      state: data.state,
      html_url: data.html_url,
      created_at: data.created_at,
      updated_at: data.updated_at,
      body: data.body || undefined,
    };
  } catch (error) {
    console.error("Error getting issue:", error);
    return null;
  }
}

export async function listPullRequests(
  owner: string,
  repo: string,
  state: "open" | "closed" | "all" = "open"
): Promise<GitHubPullRequest[]> {
  const client = getOctokit();

  try {
    const { data } = await client.pulls.list({
      owner,
      repo,
      state,
      per_page: 100,
    });

    return data.map((pr) => ({
      number: pr.number,
      title: pr.title,
      state: pr.state,
      html_url: pr.html_url,
      created_at: pr.created_at,
      updated_at: pr.updated_at,
      body: pr.body || undefined,
      merged_at: pr.merged_at || undefined,
    }));
  } catch (error) {
    console.error("Error listing pull requests:", error);
    return [];
  }
}

export async function getPullRequest(
  owner: string,
  repo: string,
  prNumber: number
): Promise<GitHubPullRequest | null> {
  const client = getOctokit();

  try {
    const { data } = await client.pulls.get({
      owner,
      repo,
      pull_number: prNumber,
    });

    return {
      number: data.number,
      title: data.title,
      state: data.state,
      html_url: data.html_url,
      created_at: data.created_at,
      updated_at: data.updated_at,
      body: data.body || undefined,
      merged_at: data.merged_at || undefined,
    };
  } catch (error) {
    console.error("Error getting pull request:", error);
    return null;
  }
}

export async function listContributors(
  owner: string,
  repo: string
): Promise<GitHubContributor[]> {
  const client = getOctokit();

  try {
    const { data } = await client.repos.listContributors({
      owner,
      repo,
      per_page: 100,
    });

    return data.map((contributor) => ({
      login: contributor.login || "unknown",
      id: contributor.id || 0,
      avatar_url: contributor.avatar_url || "",
      html_url: contributor.html_url || "",
      contributions: contributor.contributions || 0,
    }));
  } catch (error) {
    console.error("Error listing contributors:", error);
    return [];
  }
}

export async function getUserInfo(
  owner: string,
  repo: string,
  username: string
): Promise<{
  found: boolean;
  contributor?: GitHubContributor;
  issues: GitHubIssue[];
  pullRequests: GitHubPullRequest[];
  isOwner: boolean;
}> {
  const client = getOctokit();

  // Clean username: remove spaces, convert to lowercase
  const cleanUsername = username.replace(/\s+/g, "").toLowerCase();
  const isOwner = cleanUsername === owner.toLowerCase();

  try {
    // First, check if user is in contributors list
    const contributors = await listContributors(owner, repo);
    const contributor = contributors.find(
      (c) => c.login.toLowerCase() === cleanUsername
    );

    if (!contributor) {
      return { found: false, issues: [], pullRequests: [], isOwner };
    }

    // User found in contributors, get their issues and PRs
    const issuesResponse = await client.issues.listForRepo({
      owner,
      repo,
      creator: cleanUsername,
      state: "all",
      per_page: 100,
    });

    const prsResponse = await client.pulls.list({
      owner,
      repo,
      state: "all",
      per_page: 100,
    });

    const issues = issuesResponse.data
      .filter((item) => !item.pull_request)
      .map((item) => ({
        number: item.number,
        title: item.title,
        state: item.state,
        html_url: item.html_url,
        created_at: item.created_at,
        updated_at: item.updated_at,
        body: item.body || undefined,
      }));

    const pullRequests = prsResponse.data
      .filter((pr) => pr.user?.login.toLowerCase() === cleanUsername)
      .map((pr) => ({
        number: pr.number,
        title: pr.title,
        state: pr.state,
        html_url: pr.html_url,
        created_at: pr.created_at,
        updated_at: pr.updated_at,
        body: pr.body || undefined,
        merged_at: pr.merged_at || undefined,
      }));

    return { found: true, contributor, issues, pullRequests, isOwner };
  } catch (error) {
    console.error("Error getting user info:", error);
    return { found: false, issues: [], pullRequests: [], isOwner };
  }
}
