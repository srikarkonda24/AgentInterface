# AgentGuard Architecture

**Status:** Pending approval  
**Last updated:** Planning phase — no application code written yet.

---

## How to use this document

- Read this file at the start of every session (per `.cursorrules`).
- **Confirmed** items are safe to reference when planning.
- **TBD** items must not be implemented until you decide — the agent must **stop and ask** first, not assume or default silently.
- Prefer the simplest option that can be swapped later; avoid vendor or pattern lock-in where possible.

---

## Product (partial)

**AgentGuard** is a production-grade TypeScript + Next.js application.

| Topic | Status |
|-------|--------|
| Core problem / “what we guard” | **Confirmed:** AI-generated code in GitHub PRs and commits — scans diffs for security vulnerabilities and blocks critical merges |
| Primary customer (solo dev vs team vs enterprise) | **TBD — needs decision before building** |
| MVP feature list (which domains ship in v1) | **Confirmed:** `github-installation`, `scans` only |
| Repo vs product naming (`AgentInterface` folder vs AgentGuard) | **TBD — needs decision before building** |

**MVP intent (confirmed):** Keep scope **minimal** — only enough to **demonstrate the core idea**. **Demo flow (confirmed):** GitHub App installed on a repo → dev pushes commit or opens PR → AgentGuard scans diff → posts comment with findings → blocks merge if critical issues found.

---

## Confirmed technical choices

| Area | Decision | Notes |
|------|----------|--------|
| Language | TypeScript (strict) | No `any`; typed inputs/outputs everywhere |
| Framework | Next.js (App Router) | Routes/pages in `/app` only |
| Database | **Supabase (Postgres)** | Access only via `/server`; parameterized queries |
| Authentication | **GitHub login only** | NextAuth (or equivalent) — providers beyond GitHub are out of scope until decided |
| Deployment | **Vercel** | Environment variables per `.env.example` |
| Architecture style | Layered monolith in one repo | No extra top-level folders without approval |

**Swappability (confirmed principle):** Adapters live in `/server` (DB, GitHub, OpenAI, auth) so implementations can change without touching UI or feature rules.

---

## Layer model (confirmed)

Only these top-level code folders are allowed:

| Folder | Responsibility |
|--------|----------------|
| `/app` | Next.js routes and pages only — thin shells, no business logic |
| `/components` | UI only — zero logic, no fetch/DB |
| `/features` | All business logic, organized by domain |
| `/server` | Database, external APIs, auth implementation only |
| `/lib` | Pure shared utilities (no I/O) |
| `/hooks` | React hooks only |
| `/types` | TypeScript types only |
| `/config` | Environment variables and constants |

### Rules (confirmed)

- UI never contains business logic.
- UI never makes direct API or database calls.
- All database and API I/O lives in `/server` only.
- All business logic lives in `/features` only.
- Features call server adapters; they do not import DB clients directly.
- Check `/lib` before adding utilities; do not duplicate logic across features.
- Prefer editing existing files over creating new ones.
- Split any file over 200 lines.

### Data flow (confirmed)

```
UI (components + hooks)
  → app (pages / route handlers / Server Actions — entry only)
    → features (permissions, rules, orchestration)
      → server (auth middleware, validation, repositories, external clients)
        → Supabase (Postgres)
        → External services (GitHub, OpenAI, etc. — when approved)
```

---

## Proposed folder layout (structural — pending your approval)

High-level shape agreed in planning; **subfolders and file names are not final** until MVP scope is decided.

```
app/           → marketing, auth, dashboard shells, api/* entry routes
components/    → ui/, layout/, domain/* (presentational only)
features/      → one folder per domain module (see below)
server/        → db/, auth/, github/, openai/, api/handlers + middleware
lib/           → validation, formatting, errors, shared constants
hooks/         → client hooks that delegate to server/feature boundaries
types/         → api, database, github, domain
config/        → env.ts, app.ts
```

---

## Domain modules (MVP subset confirmed)

These modules match the product direction implied by `.env.example`. **MVP v1 ships:** `github-installation`, `scans` only. Others are candidates for later.

| Module | Purpose |
|--------|---------|
| `auth` | GitHub sign-in, sessions, server-side permission checks |
| `organizations` | Workspaces that own members and resources |
| `repositories` | Connected GitHub repos under an organization |
| `github-installation` | GitHub App install and installation lifecycle |
| `policies` | Rules for allowed / blocked agent or automation behavior |
| `scans` | Evaluate activity against policies |
| `agent-analysis` | Optional AI-assisted classification or summaries |
| `alerts` | Notify when policies fail or risk is detected |
| `audit-log` | Record sensitive changes (policies, installs, settings) |

---

## Integrations

### Supabase (confirmed)

- Postgres via Supabase project URL (`DATABASE_URL` in `.env.example`).
- Schema, RLS strategy, and migration workflow: **TBD — needs decision before building**.

### GitHub (partial)

| Topic | Status |
|-------|--------|
| User login via GitHub (OAuth) | **Confirmed** |
| GitHub App (`GITHUB_APP_ID`, private key, webhook secret) | **Confirmed** — in MVP (webhooks) |
| App permissions (read vs write, checks, comments) | **Confirmed:** Contents (read); Pull requests (read/write); Checks (read/write); Commit statuses (read/write) |
| Webhook events to subscribe to | **Confirmed:** `push`, `pull_request` |
| Real-time (webhook) vs scheduled scans | **Confirmed:** Webhook-based (real-time; not cron) |

### OpenAI (partial)

| Topic | Status |
|-------|--------|
| Use in MVP at all | **Confirmed:** Deferred — not in MVP |
| What gets sent to the model (redaction, size limits) | **TBD — needs decision before building** |
| Required vs optional feature flag | **TBD — needs decision before building** |

---

## Security posture (confirmed principles)

Applies to all features once built. Per-feature threat notes are required **before** each feature is implemented.

- No secrets in code or git; use environment variables only.
- Validate and sanitize all input server-side; never trust the client.
- Auth checks only on the server; every API route verifies authentication first.
- No internal errors or stack traces exposed to clients; log internally, return safe messages.
- Parameterized queries only; no raw SQL string concatenation.
- Rate limit all public API endpoints.
- Never log passwords, tokens, or personal data.
- Document per feature: data touched, who may access, bad-actor scenarios.

**Known risk areas (watchlist):** GitHub App key leakage, webhook spoofing, multi-tenant IDOR, OpenAI data leakage, over-broad GitHub permissions, agent false negatives/positives.

---

## Environment variables

See `.env.example`. Production values live in Vercel project settings, not in the repo.

---

## Work process (confirmed)

1. **PLAN** first — no code until design is approved.  
2. **WAIT** for approval.  
3. **IMPLEMENT** only approved scope.  
4. **STOP** after each step.  
5. If a decision is **TBD**, **stop and ask** — do not assume or silently default.

---

## Decisions log

### Confirmed

- Supabase (Postgres) for database  
- GitHub-only authentication  
- Vercel for deployment  
- Minimal MVP to demonstrate core idea  
- Layered folder architecture per `.cursorrules`  
- Swappable server adapters; no silent assumptions on TBD items  
- What AgentGuard guards: AI-generated code in GitHub PRs and commits — scans diffs for security vulnerabilities and blocks critical merges  
- MVP demo flow: GitHub App on repo → push or PR → scan diff → comment with findings → block merge on critical issues  
- MVP domain modules in v1: `github-installation`, `scans` only  
- GitHub App + webhooks in MVP  
- GitHub App permissions: Contents (read); Pull requests (read/write); Checks (read/write); Commit statuses (read/write)  
- Webhook events: `push`, `pull_request`  
- Scan trigger: webhook-based (real-time; not cron)  
- OpenAI deferred — not in MVP  

### TBD — needs decision before building

- Supabase schema and RLS approach  
- Alert channels (email, in-app, Slack, etc.)  
- Billing / multi-tenant model  
- Testing stack and CI details  
- Naming alignment (repo folder vs product)  

---

## Next step after approval

1. You approve or edit this document.  
2. You answer or narrow **one** TBD item (suggested first: **what the MVP demo must show end-to-end**).  
3. Agent updates this file and proposes implementation step 1 — then waits again.

**No code until this architecture is approved.**
