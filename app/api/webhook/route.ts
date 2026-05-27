export const runtime = "nodejs"

// app/api/webhook/route.ts
// Receives all incoming GitHub webhook events for AgentGuard.
// This is the only entry point for GitHub to talk to our server.

import { NextRequest, NextResponse } from "next/server";
import { getPullRequestDiff } from "@/server/github/client";
import { postScanComment } from "@/server/github/comments";
import { scanDiff } from "@/features/scans";

// GitHub sends a POST request every time a subscribed event happens.
// We must respond with 200 quickly or GitHub will retry the delivery.
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-hub-signature-256") ?? "";
    const eventType = request.headers.get("x-github-event") ?? "";

    // Verify the request actually came from GitHub using our webhook secret.
    // If this fails, someone is trying to send fake events to our server.
    const verified = await verifyWebhookSignature(body, signature);
    if (!verified) {
      console.error("Webhook signature verification failed");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = JSON.parse(body);

    // Log the event for debugging during development.
    console.log(`Received GitHub event: ${eventType}`, {
      action: payload.action,
      repo: payload.repository?.full_name,
    });

    // Route based on event type — we only care about push and pull_request.
    if (
      eventType === "pull_request" &&
      (payload.action === "opened" || payload.action === "synchronize")
    ) {
      const owner = payload.repository.owner.login as string
      const repo = payload.repository.name as string
      const prNumber = payload.number as number
      const installationId = payload.installation?.id as number

      // Log that we received the PR event — metadata only, no content.
      console.log("PR scan starting", { owner, repo, prNumber })

      try {
        // Fetch the raw diff for this PR from GitHub.
        // SECURITY: diff may contain real credentials — never log it.
        const diff = await getPullRequestDiff(
          installationId,
          owner,
          repo,
          prNumber
        )

        // Run the full scanner pipeline against the diff.
        const result = scanDiff(diff)

        console.log("Scan ran — finding count:", result.findings.length)
        // Log scan results — metadata only, never log diff content
        // or full finding messages which may reference sensitive values.
        console.log("Scan complete", {
          owner,
          repo,
          prNumber,
          linesScanned: result.linesScanned,
          filesScanned: result.filesScanned,
          findingCount: result.findings.length,
          shouldBlock: result.shouldBlock,
          // Map findings to safe metadata only — preview is safe
          // because it is only the first 8 chars of the match.
          findings: result.findings.map((f) => ({
            type: f.type,
            provider: f.provider,
            severity: f.severity,
            filename: f.filename,
            lineNumber: f.lineNumber,
            preview: f.preview,
          })),
        })

        await postScanComment({
          installationId,
          owner,
          repo,
          prNumber,
          result,
        })
      } catch (scanError) {
        // If the scan fails for any reason — GitHub API error,
        // unexpected diff format, anything — we log the error
        // but still return 200 to GitHub. We never want GitHub
        // to retry the webhook because our scanner had a problem.
        // The developer's PR is unaffected by a scan failure.
        console.error("Scan failed:", scanError)
        console.error("Scan failed details:", {
          owner,
          repo,
          prNumber,
          error: scanError instanceof Error
            ? scanError.message
            : String(scanError),
        })
      }
    }

    if (eventType === "push" && !payload.ref?.includes("refs/tags/")) {
      console.log(`Push event to ${payload.ref} in ${payload.repository?.full_name}`);
      // TODO: trigger scan — next step
    }

    // Always return 200 so GitHub knows we received the event.
    return NextResponse.json({ ok: true }, { status: 200 });

  } catch (error) {
    // Log internally but never expose error details to the caller.
    console.error("Webhook handler error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// Verifies the HMAC-SHA256 signature GitHub sends with every webhook.
// GitHub signs the raw body with our webhook secret so we can prove
// the request is legitimate and not from an attacker.
async function verifyWebhookSignature(
  body: string,
  signature: string
): Promise<boolean> {
  try {
    const secret = process.env.GITHUB_WEBHOOK_SECRET!;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(body)
    );
    const expectedSignature =
      "sha256=" +
      Array.from(new Uint8Array(signatureBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

    return signature === expectedSignature;
  } catch {
    return false;
  }
}
