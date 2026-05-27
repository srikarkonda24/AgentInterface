// features/scans/index.ts
// The single public entry point for the AgentGuard scanner.
// The webhook handler calls scanDiff() and gets back a ScanResult.
// Nothing outside features/scans/ should import from any deeper
// file in this folder — only from this file.
//
// This file orchestrates the pipeline:
//   1. Pre-process the raw diff into scannable lines
//   2. Run each scanner against those lines
//   3. Deduplicate and sort findings by severity
//   4. Return a structured ScanResult
//
// SECURITY: Never log the diff parameter. It may contain
// real credentials. Only log metadata like finding counts.

import type { Finding, ScanResult, Severity } from "@/types/scanner"
import { preprocessDiff } from "./preProcessor"
import { scanApiKeys } from "./secrets/apiKeys/index"

// ─────────────────────────────────────────────
// SEVERITY RANKING
// Sorts and deduplicates findings before returning.
// Lives here for now — moves to shared/severityRanker.ts
// when a second scanner category is added.
// ─────────────────────────────────────────────

// The order findings are sorted in the GitHub comment.
// Critical appears first so developers see the most
// serious issues immediately without scrolling.
const SEVERITY_ORDER: Severity[] = ["critical", "high", "medium", "low"]

// Sorts findings from most to least severe.
// Within the same severity, sorts by line number so
// findings appear in the order they occur in the file.
// Input: findings — unsorted array of findings
// Output: new sorted array, original array is not mutated
function sortFindings(findings: Finding[]): Finding[] {
  return [...findings].sort((a, b) => {
    const severityDiff =
      SEVERITY_ORDER.indexOf(a.severity) -
      SEVERITY_ORDER.indexOf(b.severity)

    if (severityDiff !== 0) return severityDiff

    // Same severity — sort by line number
    const aLine = a.lineNumber ?? 0
    const bLine = b.lineNumber ?? 0
    return aLine - bLine
  })
}

// Removes duplicate findings where the same provider
// matched on the same line in the same file.
// This can happen when a line matches multiple patterns
// from the same provider — we only want one finding per
// unique location to avoid spamming the developer.
// Input: findings — array that may contain duplicates
// Output: new array with duplicates removed
function deduplicateFindings(findings: Finding[]): Finding[] {
  const seen = new Set<string>()
  return findings.filter((finding) => {
    // Key combines provider, filename, and line number.
    // Two findings at the same location from the same
    // provider are considered duplicates.
    const key = `${finding.provider}:${finding.filename}:${finding.lineNumber}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// ─────────────────────────────────────────────
// SHOULD BLOCK CALCULATION
// ─────────────────────────────────────────────

// Returns true if any finding is serious enough to
// block the merge. We block on critical and high findings.
// Medium and low post a warning but allow merge.
// Conservative by design — a false positive that blocks
// a merge is annoying. A missed critical that ships is
// catastrophic.
// Input: findings — the final deduplicated findings array
// Output: true if the merge should be blocked
function calculateShouldBlock(findings: Finding[]): boolean {
  return findings.some(
    (f) => f.severity === "critical" || f.severity === "high"
  )
}

// ─────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────

// Runs the full scanner pipeline against a raw git diff
// and returns a structured result the webhook handler can act on.
//
// This is the ONLY function the webhook handler should call.
// All scanner complexity is hidden behind this single function.
//
// Input: diff — raw git diff string from the GitHub API
// Output: ScanResult — findings, counts, and shouldBlock flag
export function scanDiff(diff: string): ScanResult {
  // Step 1: Pre-process the raw diff into scannable lines.
  // Classifies files, extracts only added lines,
  // and attaches metadata to each line.
  const lines = preprocessDiff(diff)

  // Step 2: Run all scanners against the extracted lines.
  // Add new scanner calls here as new categories are built.
  const rawFindings: Finding[] = [
    ...scanApiKeys(lines),
    // scanDangerousFunctions(lines),  — Phase 2
    // scanInjections(lines),          — Phase 2
  ]

  // Step 3: Deduplicate and sort findings.
  const deduped = deduplicateFindings(rawFindings)
  const sorted = sortFindings(deduped)

  // Step 4: Assemble scan metadata for the GitHub comment.
  // Count unique filenames from extracted lines to get
  // the number of files that were actually scanned.
  const scannedFilenames = new Set(lines.map((l) => l.filename))

  // filesSkipped is 0 for now — the pre-processor handles
  // skipping internally and does not currently return a count.
  // This is honest: we know what we scanned, we just do not
  // yet track what we skipped. Improves when preProcessor
  // returns metadata alongside the extracted lines.
  const filesSkipped = 0

  return {
    findings: sorted,
    linesScanned: lines.length,
    filesScanned: scannedFilenames.size,
    filesSkipped,
    shouldBlock: calculateShouldBlock(sorted),
  }
}
