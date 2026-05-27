// server/github/comments.ts
// Posts and updates AgentGuard scan result comments on GitHub PRs.
// Uses a hidden HTML marker to find and update existing comments
// rather than creating new ones on every scan — keeps PR history clean.
//
// SECURITY: This file receives ScanResult objects which contain
// finding metadata only — never raw diff content or full key values.
// Never log the full message field from findings.

import type { ScanResult, Finding, Severity } from "@/types/scanner"
import { getInstallationClient } from "@/server/github/client"

// This marker is embedded in every AgentGuard comment as a hidden
// HTML comment. GitHub renders it invisibly but we can search for
// it to find and update our existing comment instead of creating
// a new one every time a scan runs.
const COMMENT_MARKER = "<!-- agentguard-scan-result -->"

// Parameters required to post or update a scan comment.
interface PostScanCommentParams {
  installationId: number
  owner: string
  repo: string
  prNumber: number
  result: ScanResult
}

// ─────────────────────────────────────────────
// COMMENT FORMATTING
// Turns a ScanResult into a readable GitHub
// markdown comment.
// ─────────────────────────────────────────────

// Returns the severity emoji for a finding.
// Used to make the comment scannable at a glance.
function severityEmoji(severity: Severity): string {
  switch (severity) {
    case "critical": return "🔴"
    case "high":     return "🟠"
    case "medium":   return "🟡"
    case "low":      return "🔵"
  }
}

// Returns the severity label with proper capitalization.
function severityLabel(severity: Severity): string {
  return severity.charAt(0).toUpperCase() + severity.slice(1)
}

// Formats a single finding as a markdown section.
// Uses the finding's message which is already written
// in plain English for vibe coders.
// Input: finding — a single Finding from the ScanResult
// Output: markdown string for this finding
function formatFinding(finding: Finding): string {
  const emoji = severityEmoji(finding.severity)
  const label = severityLabel(finding.severity)
  const location = finding.lineNumber
    ? `\`${finding.filename}\` line ${finding.lineNumber}`
    : `\`${finding.filename}\``

  return [
    `### ${emoji} ${label} — ${finding.provider} ${finding.type.replace(/-/g, " ")}`,
    `**File:** ${location} • **Confidence:** ${finding.confidence}`,
    ``,
    finding.message,
    ``,
    `---`,
  ].join("\n")
}

// Builds the full comment body for a scan with findings.
// Groups findings by severity so critical issues appear first.
// Input: result — the full ScanResult
// Output: complete markdown string for the GitHub comment
function buildFindingsComment(result: ScanResult): string {
  const count = result.findings.length
  const criticalCount = result.findings.filter(
    (f) => f.severity === "critical"
  ).length
  const highCount = result.findings.filter(
    (f) => f.severity === "high"
  ).length

  // Build the summary line based on what was found.
  const blockingCount = criticalCount + highCount
  const summaryLine = blockingCount > 0
    ? `**${blockingCount} issue${blockingCount > 1 ? "s" : ""} found — merge blocked**`
    : `**${count} issue${count > 1 ? "s" : ""} found — review recommended**`

  const findingSections = result.findings
    .map(formatFinding)
    .join("\n")

  const footer = [
    `*AgentGuard scanned ${result.linesScanned} line${result.linesScanned !== 1 ? "s" : ""} ` +
    `across ${result.filesScanned} file${result.filesScanned !== 1 ? "s" : ""}*`,
    `*[Report false positive](https://agentguard.dev) • Powered by AgentGuard*`,
  ].join("\n")

  return [
    COMMENT_MARKER,
    `## 🚨 AgentGuard Security Scan`,
    ``,
    summaryLine,
    ``,
    `---`,
    ``,
    findingSections,
    footer,
  ].join("\n")
}

// Builds the clean pass comment when no issues are found.
// Kept short — developers don't need to read much when
// everything is fine.
// Input: result — the ScanResult with zero findings
// Output: markdown string for the clean comment
function buildCleanComment(result: ScanResult): string {
  return [
    COMMENT_MARKER,
    `## ✅ AgentGuard Security Scan`,
    ``,
    `No security issues found. ` +
    `${result.linesScanned} line${result.linesScanned !== 1 ? "s" : ""} scanned ` +
    `across ${result.filesScanned} file${result.filesScanned !== 1 ? "s" : ""}.`,
  ].join("\n")
}

// ─────────────────────────────────────────────
// GITHUB API
// Find existing comment and update or create.
// ─────────────────────────────────────────────

// Searches existing PR comments for a previous AgentGuard
// comment by looking for our hidden marker string.
// Returns the comment ID if found, null if this is the first scan.
// Input: octokit — authenticated GitHub client
//        owner, repo, prNumber — PR location
// Output: existing comment ID or null
async function findExistingComment(
  octokit: Awaited<ReturnType<typeof getInstallationClient>>,
  owner: string,
  repo: string,
  prNumber: number
): Promise<number | null> {
  try {
    const response = await octokit.request(
      "GET /repos/{owner}/{repo}/issues/{issue_number}/comments",
      {
        owner,
        repo,
        issue_number: prNumber,
        per_page: 100,
      }
    )
    const comments = response.data as Array<{ id: number; body?: string }>
    const existing = comments.find((c) => c.body?.includes(COMMENT_MARKER))
    return existing?.id ?? null
  } catch {
    return null
  }
}

// ─────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────

// Posts or updates an AgentGuard scan result comment on a PR.
// If a previous AgentGuard comment exists it is updated in place
// so PR history stays clean. If not, a new comment is created.
//
// Never throws — if the comment fails to post we log the error
// but do not fail the webhook. A missed comment is better than
// a webhook failure that causes GitHub to retry.
//
// Input: params — installationId, owner, repo, prNumber, result
// Output: void
export async function postScanComment(
  params: PostScanCommentParams
): Promise<void> {
  const { installationId, owner, repo, prNumber, result } = params

  const body = result.findings.length > 0
    ? buildFindingsComment(result)
    : buildCleanComment(result)

  try {
    const octokit = await getInstallationClient(installationId)
    const existingId = await findExistingComment(
      octokit,
      owner,
      repo,
      prNumber
    )

    if (existingId !== null) {
      await octokit.request(
        "PATCH /repos/{owner}/{repo}/issues/comments/{comment_id}",
        {
          owner,
          repo,
          comment_id: existingId,
          body,
        }
      )
      console.log("AgentGuard comment updated", { owner, repo, prNumber })
    } else {
      await octokit.request(
        "POST /repos/{owner}/{repo}/issues/{issue_number}/comments",
        {
          owner,
          repo,
          issue_number: prNumber,
          body,
        }
      )
      console.log("AgentGuard comment created", { owner, repo, prNumber })
    }
  } catch (error) {
    // Log the error but never throw — a failed comment should
    // never cause the webhook to return an error to GitHub.
    console.error("Failed to post AgentGuard comment", {
      owner,
      repo,
      prNumber,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
