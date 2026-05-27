// features/scans/secrets/apiKeys/rules.ts
// Defines the detection rules for every API key provider
// AgentGuard currently supports. Each rule describes what
// a leaked key looks like and how serious it is.
//
// To add a new provider: add one object to API_KEY_RULES.
// Nothing else needs to change.
//
// PATTERN DESIGN: Every pattern uses a regex lookahead
// (?=...) to confirm the full key format exists without
// capturing the entire key value. This means the scanner
// confirms a real key is present without ever holding the
// full credential in memory — only the prefix is matched.

import type { Severity, Confidence } from "@/types/scanner"

// The shape of a single API key detection rule.
// Each provider gets exactly one rule object.
export interface ApiKeyRule {
  // Unique identifier for this rule.
  // Used in Finding.type — never change after release
  // because users may filter findings by this value.
  id: string

  // Human-readable provider name shown in GitHub comments.
  // Example: "AWS", "OpenAI", "GitHub"
  provider: string

  // Regex that matches the key prefix and confirms the
  // full key format exists via lookahead.
  // IMPORTANT: Use (?=...) lookahead for the body of the
  // key so we confirm it exists without capturing it.
  // Only the prefix should be in the actual match.
  pattern: RegExp

  // How serious this finding is.
  // Critical = immediate production risk, block merge.
  // High = serious but slightly less certain, block merge.
  severity: Severity

  // How confident we are this is a real key.
  // High = format is so specific false positives are near zero.
  // Medium = format could occasionally match non-key strings.
  confidence: Confidence

  // Whether this key type is always private.
  // True = block merge regardless of context.
  // False = warn but consider context (e.g. publishable keys).
  alwaysPrivate: boolean

  // Plain English message for the GitHub comment.
  // Written for a vibe coder who may not know what this means.
  // Must say: what was found, what the risk is, what to do.
  message: string
}

// All supported API key rules.
// Order does not affect correctness but group by provider
// for readability. Add new providers at the end.
export const API_KEY_RULES: ApiKeyRule[] = [
  // ── AWS ──────────────────────────────────────────────
  {
    id: "aws-access-key-id",
    provider: "AWS",
    // AWS Access Key IDs always start with AKIA followed
    // by exactly 16 uppercase letters or digits.
    // This format is unique enough that false positives
    // are essentially impossible.
    pattern: /AKIA(?=[A-Z0-9]{16})/,
    severity: "critical",
    confidence: "high",
    alwaysPrivate: true,
    message:
      "AWS Access Key ID found in your code. This gives anyone " +
      "who sees it full access to your AWS account and could result " +
      "in massive cloud bills or data loss. Revoke this key immediately " +
      "at aws.amazon.com/security-credentials, then store it in your " +
      ".env.local file instead of directly in code.",
  },

  // ── GitHub ───────────────────────────────────────────
  {
    id: "github-pat",
    provider: "GitHub",
    // GitHub Personal Access Tokens start with ghp_
    // followed by exactly 36 alphanumeric characters.
    // GitHub designed this format to be machine-detectable.
    pattern: /ghp_(?=[A-Za-z0-9]{36})/,
    severity: "critical",
    confidence: "high",
    alwaysPrivate: true,
    message:
      "GitHub Personal Access Token found in your code. Anyone with " +
      "this token can access your GitHub repositories, read private code, " +
      "and make changes on your behalf. Revoke it immediately at " +
      "github.com/settings/tokens, then use an environment variable instead.",
  },
  {
    id: "github-oauth-token",
    provider: "GitHub",
    // GitHub OAuth tokens use the gho_ prefix.
    pattern: /gho_(?=[A-Za-z0-9]{36})/,
    severity: "critical",
    confidence: "high",
    alwaysPrivate: true,
    message:
      "GitHub OAuth Token found in your code. This token grants access " +
      "to GitHub on behalf of a user. Revoke it at github.com/settings/tokens " +
      "and store it in an environment variable instead.",
  },

  // ── OpenAI ───────────────────────────────────────────
  {
    id: "openai-api-key",
    provider: "OpenAI",
    // OpenAI API keys start with sk- followed by
    // at least 32 alphanumeric characters.
    // The sk- prefix is shared with some other services
    // so we require more characters to reduce false positives.
    pattern: /sk-(?=[A-Za-z0-9]{32,})/,
    severity: "critical",
    confidence: "high",
    alwaysPrivate: true,
    message:
      "OpenAI API key found in your code. Anyone with this key can use " +
      "your OpenAI account and run up charges on your behalf. Revoke it " +
      "at platform.openai.com/api-keys and store it in your .env.local file.",
  },

  // ── Anthropic ────────────────────────────────────────
  {
    id: "anthropic-api-key",
    provider: "Anthropic",
    // Anthropic API keys start with sk-ant- which is
    // specific enough that the prefix alone is high confidence.
    pattern: /sk-ant-(?=[A-Za-z0-9\-]{20,})/,
    severity: "critical",
    confidence: "high",
    alwaysPrivate: true,
    message:
      "Anthropic API key found in your code. Anyone with this key can " +
      "use your Anthropic account and incur charges. Revoke it at " +
      "console.anthropic.com and store it in your .env.local file instead.",
  },

  // ── Stripe ───────────────────────────────────────────
  {
    id: "stripe-secret-key",
    provider: "Stripe",
    // Stripe secret keys start with sk_live_ — this is
    // always private and never safe to commit.
    pattern: /sk_live_(?=[A-Za-z0-9]{24,})/,
    severity: "critical",
    confidence: "high",
    alwaysPrivate: true,
    message:
      "Stripe Secret Key found in your code. This gives full access to " +
      "your Stripe account including the ability to process payments and " +
      "issue refunds. Revoke it at dashboard.stripe.com/apikeys and store " +
      "it in your .env.local file immediately.",
  },
  {
    id: "stripe-publishable-key",
    provider: "Stripe",
    // Stripe publishable keys start with pk_live_ and are
    // intentionally public — they are designed to be used
    // in frontend code. We warn rather than block because
    // a vibe coder may not realize this is safe, but we
    // do not block because it is not a security issue.
    pattern: /pk_live_(?=[A-Za-z0-9]{24,})/,
    severity: "low",
    confidence: "high",
    alwaysPrivate: false,
    message:
      "Stripe Publishable Key found in your code. Unlike the secret key, " +
      "this key is safe to use in frontend code — it is designed to be public. " +
      "No action required, but consider using an environment variable anyway " +
      "for cleaner code.",
  },

  // ── SendGrid ─────────────────────────────────────────
  {
    id: "sendgrid-api-key",
    provider: "SendGrid",
    // SendGrid API keys always start with SG. followed by
    // a specific base64url-encoded structure. The SG. prefix
    // is unique and the length requirement filters noise.
    pattern: /SG\.(?=[A-Za-z0-9\-_]{20,})/,
    severity: "critical",
    confidence: "high",
    alwaysPrivate: true,
    message:
      "SendGrid API key found in your code. Anyone with this key can send " +
      "emails from your account and access your contact lists. Revoke it at " +
      "app.sendgrid.com/settings/api_keys and store it in an environment variable.",
  },

  // ── Slack ────────────────────────────────────────────
  {
    id: "slack-bot-token",
    provider: "Slack",
    // Slack bot tokens always start with xoxb- followed
    // by a numeric workspace ID and token body.
    pattern: /xoxb-(?=[0-9]{10,}-[0-9]{10,}-[A-Za-z0-9]{20,})/,
    severity: "critical",
    confidence: "high",
    alwaysPrivate: true,
    message:
      "Slack Bot Token found in your code. Anyone with this token can read " +
      "messages and post to your Slack workspace. Revoke it at api.slack.com/apps " +
      "and store it in an environment variable instead.",
  },

  // ── Hugging Face ─────────────────────────────────────
  {
    id: "huggingface-token",
    provider: "Hugging Face",
    // Hugging Face tokens start with hf_ followed by
    // alphanumeric characters. Minimum length filters noise.
    pattern: /hf_(?=[A-Za-z0-9]{20,})/,
    severity: "critical",
    confidence: "high",
    alwaysPrivate: true,
    message:
      "Hugging Face token found in your code. This token provides access to " +
      "your Hugging Face account and models, and may incur charges. Revoke it " +
      "at huggingface.co/settings/tokens and use an environment variable instead.",
  },

  // ── Google ───────────────────────────────────────────
  {
    id: "google-api-key",
    provider: "Google",
    // Google API keys start with AIza followed by 35 chars.
    // Confidence is high for format but medium overall because
    // some Google keys (Maps, Firebase) are intentionally public.
    // We warn rather than block and explain the distinction.
    pattern: /AIza(?=[A-Za-z0-9\-_]{35})/,
    severity: "high",
    confidence: "medium",
    alwaysPrivate: false,
    message:
      "Google API key found in your code. If this is a Maps JavaScript or " +
      "Firebase web config key it may be safe to use publicly, but it should " +
      "still be restricted by HTTP referrer at console.cloud.google.com. " +
      "If this is a Cloud, Translate, or other server-side key, revoke it " +
      "immediately and move it to an environment variable.",
  },
]
