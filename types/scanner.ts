// types/scanner.ts
// Defines the public contract for scanner findings.
// This is the single source of truth for what a scanner
// finding looks like across the entire application.
// The webhook handler, comment poster, and dashboard
// all depend on these types — never change field names
// without updating every consumer.

// ─────────────────────────────────────────────
// SECURITY NOTE
// These types describe findings about potentially
// sensitive code. The Finding type intentionally
// does NOT include a field for the full matched
// string — only a truncated preview. This prevents
// real credentials from being stored, logged, or
// sent anywhere outside the scanner.
// ─────────────────────────────────────────────

// How serious a finding is.
// Critical and high block the merge automatically.
// Medium and low post a warning but allow merge.
export type Severity = "critical" | "high" | "medium" | "low"

// How confident we are that this is a real issue
// and not a false positive.
// High = near certain (AWS key format is exact)
// Medium = likely but could be a coincidence
// Low = possible but needs human judgment
export type Confidence = "high" | "medium" | "low"

// How we classified the file this finding came from.
// This affects severity — a critical finding in a
// test file is downgraded to high because test files
// often contain fake credentials intentionally.
export type FileClassification =
  | "full"      // normal file, full severity applies
  | "reduced"   // test/doc file, severity downgraded one level
  | "env_file"  // .env file committed — always critical
  | "skip"      // generated/lock file — never scanned

// A single line extracted from a git diff, ready for scanning.
// Produced by features/scans/preProcessor.ts and consumed
// by every scanner in features/scans/secrets/ and beyond.
// Lives here because multiple scanner files depend on this
// shape — it is a shared contract, not a preProcessor internal.
export interface ExtractedLine {
  // The actual line content with the leading + removed.
  // NEVER log this value — it may contain real credentials.
  content: string

  // Approximate line number in the diff.
  lineNumber: number

  // Which file this line came from.
  filename: string

  // How we classified this file.
  fileClassification: FileClassification

  // Whether this line is inside a comment.
  // Comment lines get lower confidence findings.
  isComment: boolean
}

// A single security finding produced by the scanner.
// This is what gets turned into a GitHub PR comment.
export interface Finding {
  // What kind of issue this is.
  // Used to group findings in the GitHub comment.
  // Example: "exposed-api-key"
  type: string

  // Which provider or technology this finding relates to.
  // Example: "AWS", "OpenAI", "GitHub"
  // Empty string if not provider-specific.
  provider: string

  // How serious this finding is.
  // Critical and high will block the merge.
  severity: Severity

  // How confident we are this is a real issue.
  // Shown in the GitHub comment so developers can
  // judge whether to investigate further.
  confidence: Confidence

  // Plain English explanation shown in the GitHub comment.
  // Written for a developer who may not know what this means.
  // Must include what the risk is and what to do about it.
  message: string

  // The first 8 characters of the matched string followed
  // by "..." — enough to identify what was found without
  // storing or displaying the actual credential.
  // Example: "AKIAIOSF..."
  // NEVER store the full matched value here.
  preview: string

  // Approximate line number in the diff where this was found.
  // Null if the line number could not be determined.
  // Used to point the developer to the exact location.
  lineNumber: number | null

  // The filename where this finding was found.
  // Shown in the GitHub comment so the developer
  // knows exactly which file to look at.
  filename: string

  // How we classified the file this finding came from.
  // Stored on the finding so the comment poster can
  // explain why a finding is lower severity than expected.
  fileClassification: FileClassification
}

// The result of running the full scanner against a diff.
// Returned by features/scans/index.ts and consumed
// by the webhook handler.
export interface ScanResult {
  // All findings sorted by severity, critical first.
  // Empty array means the scan ran successfully
  // and found nothing — not that it failed.
  findings: Finding[]

  // Total number of lines that were scanned.
  // Used for transparency in the GitHub comment —
  // "AgentGuard scanned 142 lines across 6 files"
  linesScanned: number

  // Total number of files that were scanned.
  filesScanned: number

  // Number of files that were skipped entirely
  // because they were generated files, lock files, etc.
  filesSkipped: number

  // Whether any critical or high findings were found.
  // Convenience field — the webhook handler uses this
  // to decide whether to block the merge without having
  // to loop through findings itself.
  shouldBlock: boolean
}
