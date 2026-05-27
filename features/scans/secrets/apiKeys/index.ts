// features/scans/secrets/apiKeys/index.ts
// Runs API key detection rules against extracted lines
// and returns a list of security findings.
// This is the core detection engine — it applies each rule,
// filters false positives, and adjusts severity based on
// where the key was found.
//
// SECURITY: Never log line content. Lines may contain real
// credentials. Only log metadata like line numbers and filenames.

import type { Finding, Severity, ExtractedLine } from "@/types/scanner"
import { API_KEY_RULES } from "./rules"

// ─────────────────────────────────────────────
// PLACEHOLDER DETECTION
// Checks whether a matched value looks like a
// fake/example key rather than a real credential.
// ─────────────────────────────────────────────

// Strings that strongly suggest a value is a placeholder
// and not a real credential. AI tools and documentation
// commonly produce these patterns.
const PLACEHOLDER_SIGNALS = [
  "xxxx",
  "1234",
  "abcd",
  "test",
  "fake",
  "mock",
  "demo",
  "sample",
  "example",
  "placeholder",
  "your-key",
  "your_key",
  "yourkey",
  "insert",
  "replace",
  "goes-here",
  "goes_here",
  "put-here",
  "put_here",
  "<",
  ">",
]

// Checks whether the surrounding line looks like a
// placeholder or example rather than a real key.
// We check the full line not just the matched prefix
// because the placeholder signals appear after the prefix.
// Input: line — the full line content containing the match
// Output: true if this looks like a placeholder, false if real
function looksLikePlaceholder(line: string): boolean {
  const lower = line.toLowerCase()
  return PLACEHOLDER_SIGNALS.some((signal) => lower.includes(signal))
}

// Checks whether this line is correctly reading a key
// from an environment variable rather than hardcoding it.
// If the key appears after process.env or import.meta.env
// the developer is doing the right thing — skip it.
// Input: line — the full line content
// Output: true if the key is being read from env correctly
function isEnvironmentVariableReference(line: string): boolean {
  return (
    line.includes("process.env") ||
    line.includes("import.meta.env") ||
    line.includes("process.env[")
  )
}

// Checks whether a key appears as a fallback value after
// an environment variable. This is a dangerous pattern that
// AI tools commonly generate:
//   const key = process.env.OPENAI_KEY || "sk-real-key-here"
// The developer may think using process.env makes it safe,
// but the fallback hardcodes the real key as a backup.
// Input: line — the full line content
// Output: true if this looks like a dangerous env fallback
function isDangerousEnvFallback(line: string): boolean {
  return (
    (line.includes("process.env") || line.includes("import.meta.env")) &&
    (line.includes("||") || line.includes("??"))
  )
}

// ─────────────────────────────────────────────
// SEVERITY ADJUSTMENT
// Adjusts finding severity based on where the
// key was found and how confident we are.
// ─────────────────────────────────────────────

// The order of severities from most to least serious.
const SEVERITY_ORDER: Severity[] = ["critical", "high", "medium", "low"]

// Downgrades a severity by one level.
// Critical → high, high → medium, medium → low, low → low.
// Used for findings in test files and documentation where
// fake credentials are expected and intentional.
// Input: severity — current severity level
// Output: severity one level lower, or "low" if already lowest
function downgradeSeverity(severity: Severity): Severity {
  const index = SEVERITY_ORDER.indexOf(severity)
  const nextIndex = Math.min(index + 1, SEVERITY_ORDER.length - 1)
  return SEVERITY_ORDER[nextIndex]
}

// Calculates the final severity for a finding based on
// the rule's base severity and where the file was found.
// env_file always becomes critical — committing a .env file
// is always a serious mistake regardless of what is inside.
// reduced files get downgraded one level.
// full files keep the rule's original severity.
// Input: baseSeverity — severity from the rule definition
//        fileClassification — how we classified the file
// Output: final adjusted severity for the finding
function adjustSeverity(
  baseSeverity: Severity,
  fileClassification: string
): Severity {
  if (fileClassification === "env_file") return "critical"
  if (fileClassification === "reduced") return downgradeSeverity(baseSeverity)
  return baseSeverity
}

// ─────────────────────────────────────────────
// MAIN SCANNER
// ─────────────────────────────────────────────

// Scans a single extracted line against all API key rules
// and returns any findings. Returns empty array if no
// rules match or all matches are filtered as false positives.
// Input: line — a single ExtractedLine from the preprocessor
// Output: Finding[] — zero or more findings for this line
function scanLine(line: ExtractedLine): Finding[] {
  const findings: Finding[] = []

  // If this line correctly reads from an environment variable
  // and does NOT have a dangerous fallback, skip it entirely.
  // The developer is doing the right thing.
  if (
    isEnvironmentVariableReference(line.content) &&
    !isDangerousEnvFallback(line.content)
  ) {
    return findings
  }

  for (const rule of API_KEY_RULES) {
    const match = rule.pattern.exec(line.content)
    if (match === null) continue

    // The matched string is only the prefix (e.g. "AKIA")
    // because we used lookahead for the rest of the key.
    // Safe to store because it cannot reconstruct the full key.
    const matchedPrefix = match[0]

    // If the full line looks like a placeholder skip it.
    // We check the full line because placeholder text usually
    // appears after the prefix in the actual key value.
    if (looksLikePlaceholder(line.content)) continue

    // Downgrade confidence for comment lines — developers
    // often paste example keys in comments to show format.
    const confidence = line.isComment ? "low" : rule.confidence

    // Adjust severity based on file classification.
    const severity = adjustSeverity(
      rule.severity,
      line.fileClassification
    )

    // Add a note to the message if this is a dangerous
    // env fallback pattern — the developer may think
    // they are safe because they use process.env.
    const message = isDangerousEnvFallback(line.content)
      ? `${rule.message} NOTE: Using a hardcoded key as a fallback ` +
        `(process.env.KEY || "hardcoded") is not safe — the hardcoded ` +
        `value will be used if the environment variable is missing.`
      : rule.message

    findings.push({
      type: rule.id,
      provider: rule.provider,
      severity,
      confidence,
      message,
      // Store only the prefix as the preview — never the full key.
      // The prefix is enough to show what was found without
      // exposing the actual credential in PR comments or logs.
      preview: `${matchedPrefix}...`,
      lineNumber: line.lineNumber,
      filename: line.filename,
      fileClassification: line.fileClassification,
    })
  }

  return findings
}

// Scans all extracted lines against all API key rules
// and returns the combined findings array.
// This is the only exported function — the only entry
// point into this file from outside.
// Input: lines — ExtractedLine[] from preprocessDiff()
// Output: Finding[] — all API key findings, unsorted
export function scanApiKeys(lines: ExtractedLine[]): Finding[] {
  const findings: Finding[] = []

  for (const line of lines) {
    const lineFindings = scanLine(line)
    findings.push(...lineFindings)
  }

  return findings
}
