// server/github/client.ts
// Initializes the GitHub App client and provides helpers for
// fetching diffs and authenticated API access per installation.

import { App } from "@octokit/app";

// Initialize the GitHub App once using environment variables.
// The private key uses \n to represent line breaks in the env file.
const app = new App({
  appId: process.env.GITHUB_APP_ID!,
  privateKey: process.env.GITHUB_PRIVATE_KEY!.replace(/\\n/g, "\n"),
  webhooks: {
    secret: process.env.GITHUB_WEBHOOK_SECRET!,
  },
});

// Returns an authenticated Octokit client scoped to a specific
// installation. Each repo that installs AgentGuard has its own
// installationId — this exchanges it for a short-lived access token.
export async function getInstallationClient(installationId: number) {
  return await app.getInstallationOctokit(installationId);
}

// Fetches the raw diff for a pull request.
// owner: the GitHub username or org (e.g. "srikarkonda24")
// repo: the repository name (e.g. "AgentInterface")
// pullNumber: the PR number
export async function getPullRequestDiff(
  installationId: number,
  owner: string,
  repo: string,
  pullNumber: number
): Promise<string> {
  const octokit = await getInstallationClient(installationId);
  const response = await octokit.request(
    "GET /repos/{owner}/{repo}/pulls/{pull_number}",
    {
      owner,
      repo,
      pull_number: pullNumber,
      headers: {
        accept: "application/vnd.github.diff",
      },
    }
  );
  return response.data as unknown as string;
}

export { app };
