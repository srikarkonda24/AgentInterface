// features/scans/preProcessor.ts
// Takes a raw git diff string from GitHub and returns a flat array
// of lines worth scanning, with metadata attached to each line.
// This file knows nothing about security rules — it only prepares
// data for the scanners that come after it.
//
// SECURITY: This file receives raw diff content which may contain
// real credentials. Never log the diff parameter or any line content.
// Only log metadata (filename, line counts, file classification).

import type { FileClassification, ExtractedLine } from "@/types/scanner"

// ─────────────────────────────────────────────
// TYPES — internal to this file only
// These are not exported because nothing outside
// this file needs to work with these intermediate shapes.
// ─────────────────────────────────────────────

// Represents one file that was changed in the diff,
// before we decide how to treat it.
interface ParsedFile {
  filename: string
  // Whether this file was renamed from another path.
  // Renamed files need special handling to avoid false
  // positives — the content didn't change, just the path.
  isRename: boolean
  // The raw added lines from this file in the diff.
  // These are the + lines with the leading + stripped.
  addedLines: Array<{
    content: string
    lineNumber: number
  }>
}

// ─────────────────────────────────────────────
// FILE CLASSIFICATION
// Decides how to treat each file before scanning.
// ─────────────────────────────────────────────

// Files that should never be scanned.
// These are generated files where a pattern match
// would never represent a real security issue.
const SKIP_PATTERNS: RegExp[] = [
  /package-lock\.json$/,
  /yarn\.lock$/,
  /pnpm-lock\.yaml$/,
  /\.lock$/,
  /\.min\.js$/,
  /^\.next\//,
  /^dist\//,
  /^node_modules\//,
]

// Files where findings should be downgraded one severity level.
// Test files often contain fake credentials intentionally.
// Documentation files often show example keys.
const REDUCED_PATTERNS: RegExp[] = [
  /\.test\.(ts|tsx|js|jsx)$/,
  /\.spec\.(ts|tsx|js|jsx)$/,
  /__tests__\//,
  /\.md$/,
  /\.txt$/,
  /\.example$/,
  /\.sample$/,
  /\.template$/,
]

// .env files that are safe to commit — they contain
// placeholder values only, not real credentials.
const SAFE_ENV_PATTERNS: RegExp[] = [
  /\.env\.example$/,
  /\.env\.sample$/,
  /\.env\.template$/,
]

// Classifies a single file based on its path.
// Returns how the scanner should treat this file.
// Input: filename — the full file path from the diff
// Output: FileClassification — skip, reduced, env_file, or full
function classifyFile(filename: string): FileClassification {
  // Safe .env files come first — they match env patterns
  // but should NOT be treated as env_file (critical).
  // Order matters: check safe env before env_file.
  if (SAFE_ENV_PATTERNS.some((p) => p.test(filename))) {
    return "reduced"
  }

  // Any .env file being committed is always critical
  // regardless of what's inside it. .env files should
  // never appear in a git diff.
  if (/\.env(\.|$)/.test(filename)) {
    return "env_file"
  }

  // Generated and lock files are never worth scanning.
  if (SKIP_PATTERNS.some((p) => p.test(filename))) {
    return "skip"
  }

  // Test and documentation files get lower severity
  // because fake credentials are expected there.
  if (REDUCED_PATTERNS.some((p) => p.test(filename))) {
    return "reduced"
  }

  return "full"
}

// ─────────────────────────────────────────────
// DIFF PARSING
// Turns the raw diff string into structured data.
// ─────────────────────────────────────────────

// Parses a raw git diff string into an array of files
// with their added lines. Only captures + lines —
// removed lines are never scanned because removing
// a key is the correct action, not a problem.
// Input: diff — raw git diff string from GitHub API
// Output: ParsedFile[] — structured files with added lines
function parseDiff(diff: string): ParsedFile[] {
  const files: ParsedFile[] = []
  let currentFile: ParsedFile | null = null
  let lineNumber = 0

  for (const line of diff.split("\n")) {
    // New file section starts with "diff --git"
    if (line.startsWith("diff --git")) {
      currentFile = {
        filename: "",
        isRename: false,
        addedLines: [],
      }
      files.push(currentFile)
      lineNumber = 0
      continue
    }

    if (currentFile === null) continue

    // Extract filename from the +++ header line.
    // Format: "+++ b/path/to/file.ts"
    // We strip the "b/" prefix that git adds.
    if (line.startsWith("+++ b/")) {
      currentFile.filename = line.slice(6)
      continue
    }

    // Detect renamed files to avoid false positives.
    // When a file is renamed, all its content appears
    // as added lines even though nothing actually changed.
    if (line.startsWith("rename from") || line.startsWith("rename to")) {
      currentFile.isRename = true
      continue
    }

    // Track approximate line numbers from hunk headers.
    // Format: "@@ -old,count +new,start @@"
    if (line.startsWith("@@")) {
      const match = /\+(\d+)/.exec(line)
      lineNumber = match ? parseInt(match[1], 10) - 1 : 0
      continue
    }

    // Only capture added lines — lines starting with +
    // Skip the +++ header lines (already handled above)
    if (line.startsWith("+") && !line.startsWith("+++")) {
      lineNumber++
      currentFile.addedLines.push({
        // Remove the leading + character
        content: line.slice(1),
        lineNumber,
      })
      continue
    }

    // Context lines (no prefix) still advance the line counter
    if (!line.startsWith("-") && !line.startsWith("\\")) {
      lineNumber++
    }
  }

  return files
}

// ─────────────────────────────────────────────
// LINE EXTRACTION
// Flattens structured files into scannable lines.
// ─────────────────────────────────────────────

// Detects whether a line of code is a comment.
// Comment lines get lower confidence findings because
// developers often write example keys in comments.
// Input: content — a single line of code
// Output: true if this line is a comment
function isCommentLine(content: string): boolean {
  const trimmed = content.trim()
  return (
    trimmed.startsWith("//") ||
    trimmed.startsWith("#") ||
    trimmed.startsWith("*") ||
    trimmed.startsWith("/*")
  )
}

// Takes the structured parsed files and produces a flat
// array of lines ready for the scanner. Skips files that
// should not be scanned. Skips renamed files to avoid
// false positives on content that didn't actually change.
// Input: files — ParsedFile[] from parseDiff
// Output: ExtractedLine[] — flat array ready for scanning
function extractLines(files: ParsedFile[]): ExtractedLine[] {
  const lines: ExtractedLine[] = []

  for (const file of files) {
    const classification = classifyFile(file.filename)

    // Skip generated files entirely — no findings possible
    if (classification === "skip") continue

    // Skip renamed files — the content didn't change,
    // only the path did. Scanning would produce false
    // positives on every key that was already there.
    if (file.isRename) continue

    for (const line of file.addedLines) {
      lines.push({
        content: line.content,
        lineNumber: line.lineNumber,
        filename: file.filename,
        fileClassification: classification,
        isComment: isCommentLine(line.content),
      })
    }
  }

  return lines
}

// ─────────────────────────────────────────────
// PUBLIC API
// This is the only function the rest of the scanner
// ever calls from this file.
// ─────────────────────────────────────────────

// Takes a raw git diff string and returns a flat array
// of lines ready for the scanner to process.
// This is the single entry point for this file.
// Input: diff — raw git diff string from GitHub API
// Output: ExtractedLine[] — lines ready for scanning,
//         with filename, line number, and classification
//         attached to each one
export function preprocessDiff(diff: string): ExtractedLine[] {
  const parsed = parseDiff(diff)
  return extractLines(parsed)
}
