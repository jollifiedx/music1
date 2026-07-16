# Skills Inventory — Building Cadence

**Date:** 2026-07-15
**Source:** derived from [PRD.md](./PRD.md), [tech-stack.md](./tech-stack.md), [CLAUDE.md](../.claude/CLAUDE.md)
**Skills format reference:** [Claude Code Skills docs](https://code.claude.com/docs/en/skills) · [Agent Skills standard](https://agentskills.io/)

## How to read this document

Each entry describes a **build-time skill** — a reusable `.claude/skills/<name>/SKILL.md` procedure (frontmatter + instructions, optionally bundling scripts/templates) that an agent invokes while building Cadence. Per the skills docs: only a skill's `name`+`description` stay in context until invoked (progressive disclosure), so this inventory doubles as the descriptions we'd write. Fields per skill: **Description · Input · Output · Dependencies · Docs · Complexity · Example invocation**.

**Complexity key:** Simple (well-trodden, low risk) · Moderate (integration or care required) · Complex (correctness-critical, multi-system, or money/security-sensitive).

> **Already covered by bundled skills — do NOT rebuild:** `/code-review` (diff review), `/security-review` (pending-change security audit), `/run` & `/verify` (launch app + confirm changes), `/debug`. Use these instead of authoring `code-review` / `security-audit` / `run-app` skills. See [commands reference](https://code.claude.com/docs/en/commands). `/run-skill-generator` should be run once to teach `/run` how to launch Cadence (needs Supabase + env + worker).

---

## Category 1 — Database Operations

### 1.1 `db-migration` — Author & apply a schema migration
- **Description:** Create a versioned SQL migration (new/altered tables, enums, constraints, indexes) via the Supabase CLI, following the schema conventions in PRD §4. Use when adding or changing any table.
- **Input:** Target entity + fields/relations (from PRD §4); migration name.
- **Output:** A reviewed `.sql` file in `supabase/migrations/`, applied to a branch/preview DB, with generated TS types refreshed.
- **Dependencies:** _Libs:_ Supabase CLI, (optional) Drizzle Kit. _APIs:_ Supabase. _Skills:_ → `rls-policy` (every tenant table), → `db-types-gen`.
- **Docs:** [Supabase migrations](https://supabase.com/docs/guides/deployment/database-migrations) · [Drizzle Kit](https://orm.drizzle.team/docs/kit-overview)
- **Complexity:** Moderate.
- **Example:** `/db-migration add generations table per PRD §4`

### 1.2 `rls-policy` — Write & verify Row Level Security policies
- **Description:** Author default-deny RLS policies keyed to `organization_id` + verified `organization_members` membership for a tenant table. Use immediately after creating any tenant-scoped table. **Correctness-critical: a gap = cross-tenant data leak.**
- **Input:** Table name, tenant column, allowed roles per operation.
- **Output:** `CREATE POLICY` statements in a migration + a note of which roles get select/insert/update/delete.
- **Dependencies:** _APIs:_ Supabase/Postgres. _Skills:_ ← `db-migration`; → `rls-isolation-test`.
- **Docs:** [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- **Complexity:** Complex.
- **Example:** `/rls-policy songs table, members can CRUD own-org rows`

### 1.3 `db-data-access` — Typed repository / query layer
- **Description:** Generate typed data-access functions (list/get/create/update, pagination) for an entity, respecting RLS and the indexing strategy (PRD §4.3). Use when the API needs to read/write a table.
- **Input:** Entity, required queries/filters, pagination needs.
- **Output:** Typed repository module in `packages/shared` or `apps/api`; parameterized queries only.
- **Dependencies:** _Libs:_ Drizzle ORM or `@supabase/supabase-js`, Zod. _Skills:_ ← `db-migration`.
- **Docs:** [Drizzle ORM](https://orm.drizzle.team/) · [supabase-js](https://supabase.com/docs/reference/javascript)
- **Complexity:** Moderate.
- **Example:** `/db-data-access library listing for projects, paginated 25`

### 1.4 `credit-ledger-ops` — Append-only credit accounting
- **Description:** Implement the transactional credit hold → commit/refund flow against the append-only `credit_ledger` (PRD §3.11, §4.2). Use for any generation charge or top-up. **Money-sensitive: enforce balance in a single DB transaction; no UPDATE/DELETE on ledger.**
- **Input:** Org id, delta, reason, linked generation id.
- **Output:** Ledger insert + derived `balance_after`, inside a transaction; insufficient-credit rejection path.
- **Dependencies:** _Libs:_ Drizzle/pg (transactions). _Skills:_ ← `db-data-access`; used by `async-job-orchestration`, `stripe-billing`.
- **Docs:** [Postgres transactions](https://www.postgresql.org/docs/current/tutorial-transactions.html)
- **Complexity:** Complex.
- **Example:** `/credit-ledger-ops hold 20 credits for generation X`

### 1.5 `db-seed` — Seed dev/test fixtures
- **Description:** Create deterministic seed data (orgs, workspaces, members, sample songs) for local dev and tests.
- **Input:** Fixture spec / scenario.
- **Output:** Seed script + reproducible dataset.
- **Dependencies:** _Libs:_ Supabase CLI seed, faker. _Skills:_ ← `db-migration`.
- **Docs:** [Supabase seeding](https://supabase.com/docs/guides/local-development/seeding-your-database)
- **Complexity:** Simple.
- **Example:** `/db-seed 2 agencies with 3 client workspaces each`

### 1.6 `db-backup-restore` — Backup & recovery procedure
- **Description:** Configure automated backups + PITR and a documented restore drill (PRD §4 backup strategy).
- **Input:** Retention target, environment.
- **Output:** Backup schedule + a tested restore runbook.
- **Dependencies:** _APIs:_ Supabase, object storage. _Libs:_ `pg_dump`.
- **Docs:** [Supabase backups](https://supabase.com/docs/guides/platform/backups)
- **Complexity:** Moderate.
- **Example:** `/db-backup-restore weekly pg_dump to R2 + verify restore`

---

## Category 2 — Authentication & Authorization

### 2.1 `auth-setup` — Supabase Auth flows
- **Description:** Wire email/password, magic link, and Google/Apple OAuth; issue/verify JWTs; provision `profiles` on signup (PRD §2, §5.1). Apple sign-in required if other social logins offered.
- **Input:** Enabled providers, redirect URLs.
- **Output:** Auth client + server verification + profile bootstrap.
- **Dependencies:** _Libs:_ `@supabase/supabase-js`, `@supabase/ssr`. _APIs:_ Supabase Auth, Google/Apple OAuth. _Skills:_ → `rbac-middleware`.
- **Docs:** [Supabase Auth](https://supabase.com/docs/guides/auth)
- **Complexity:** Moderate.
- **Example:** `/auth-setup email + Google OAuth`

### 2.2 `rbac-middleware` — Role-based access enforcement
- **Description:** Middleware/procedure guards that resolve org membership and enforce `owner/admin/member/viewer` per endpoint (PRD §5.1–5.2). Defense-in-depth above RLS.
- **Input:** Endpoint, minimum role.
- **Output:** Reusable `requireRole()` guard integrated into tRPC/REST.
- **Dependencies:** _Libs:_ tRPC middleware, Zod. _Skills:_ ← `auth-setup`, `db-data-access`.
- **Docs:** [tRPC middleware](https://trpc.io/docs/server/middlewares)
- **Complexity:** Moderate.
- **Example:** `/rbac-middleware require admin for workspace mutations`

### 2.3 `org-invite-flow` — Member invitations
- **Description:** Generate/expire single-use invite tokens, send invite emails, accept-and-link flow (PRD §3.1).
- **Input:** Org id, invitee email, role.
- **Output:** Invite record (7-day expiry), email, accept endpoint.
- **Dependencies:** _Libs:_ email provider SDK (e.g., Resend). _APIs:_ Supabase, email. _Skills:_ ← `rbac-middleware`.
- **Docs:** [Resend](https://resend.com/docs) · [Supabase Auth admin](https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail)
- **Complexity:** Moderate.
- **Example:** `/org-invite-flow invite member as editor`

### 2.4 `review-link-tokens` — Tokenized public access
- **Description:** Mint unguessable, optionally password/expiry-protected tokens that grant scoped read + comment/approve access to specific tracks **without login** (PRD §3.9, §5.1). Security-sensitive: strictly scope to linked assets; rate-limit.
- **Input:** Song/generation ids, expiry, optional password.
- **Output:** `review_links` row + public route auth path.
- **Dependencies:** _Libs:_ crypto, bcrypt/argon2. _Skills:_ → `rate-limiting`.
- **Docs:** [OWASP secure tokens](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- **Complexity:** Complex.
- **Example:** `/review-link-tokens create 7-day link for song X`

---

## Category 3 — External API Integration

### 3.1 `music-provider-adapter` — Implement `MusicProvider` + a reseller adapter
- **Description:** Define the provider-agnostic `MusicProvider` interface (generate, extend, lyrics, stems, get-details) and one concrete adapter (Suno reseller now; ElevenLabs/Stable Audio later). **The #1 risk-mitigation skill — never call a provider outside this abstraction.**
- **Input:** Provider API contract; interface methods needed.
- **Output:** `packages/shared/providers/*` interface + adapter with typed request/response mapping + auth.
- **Dependencies:** _Libs:_ fetch/undici, Zod. _APIs:_ Suno reseller (`docs.sunoapi.org`), later ElevenLabs Music / Stable Audio. _Skills:_ → `generation-webhook`, `reconciliation-poller`.
- **Docs:** [sunoapi.org docs](https://docs.sunoapi.org) · [ElevenLabs](https://elevenlabs.io/docs) · [Stable Audio](https://stability.ai/stable-audio)
- **Complexity:** Complex.
- **Example:** `/music-provider-adapter implement suno reseller adapter`

### 3.2 `generation-webhook` — Signature-verified idempotent callback handler
- **Description:** REST endpoint that receives the provider's completion callback, verifies signature, dedupes via `webhook_events`, stores audio, commits credits, sets `generations.status=ready` (PRD §5.4). Correctness-critical.
- **Input:** Provider webhook payload + signing secret.
- **Output:** Idempotent handler; on success writes `assets`, debits credits, triggers realtime.
- **Dependencies:** _Libs:_ Hono, crypto. _Skills:_ ← `music-provider-adapter`, → `storage-assets`, `credit-ledger-ops`, `realtime-status`.
- **Docs:** [Suno callbacks](https://docs.sunoapi.org/suno-api/generate-music-callbacks) · [Netlify Background Functions](https://docs.netlify.com/build/functions/background-functions/)
- **Complexity:** Complex.
- **Example:** `/generation-webhook handle provider callback + store audio`

### 3.3 `reconciliation-poller` — Missed-webhook backstop
- **Description:** Scheduled worker job that finds stale `queued/generating` generations and reconciles them via the provider's get-details endpoint within 5 min (PRD §3.5, §5.4). Never rely on webhooks alone.
- **Input:** Staleness threshold.
- **Output:** Cron job in `apps/worker` that resolves stragglers.
- **Dependencies:** _Libs:_ cron scheduler. _Skills:_ ← `music-provider-adapter`, `generation-webhook`.
- **Docs:** [Suno get-details](https://docs.sunoapi.org/suno-api/get-music-generation-details)
- **Complexity:** Moderate.
- **Example:** `/reconciliation-poller resolve generations stuck >5m`

### 3.4 `stripe-billing` — Subscriptions, checkout & credit sync
- **Description:** Org-level Stripe subscriptions (seat + monthly credit grant), top-up checkout, and signature-verified webhooks that sync subscription state and grant credits (PRD §3.11).
- **Input:** Plan/price config, org.
- **Output:** Checkout flow + `subscriptions` sync + credit grants via ledger.
- **Dependencies:** _Libs:_ `stripe`. _APIs:_ Stripe. _Skills:_ ← `credit-ledger-ops`, `webhook-idempotency`.
- **Docs:** [Stripe subscriptions](https://stripe.com/docs/billing/subscriptions/overview) · [Stripe webhooks](https://stripe.com/docs/webhooks)
- **Complexity:** Complex.
- **Example:** `/stripe-billing wire Pro plan + credit top-ups`

### 3.5 `job-queue` — Enqueue/consume + rate limiting
- **Description:** Upstash-backed queue for generation jobs plus per-user/per-org rate limits and concurrency caps (PRD §5.5). Protects against runaway COGS.
- **Input:** Job payload shape, limit config.
- **Output:** `enqueue()` + worker consumer + rate-limit guards.
- **Dependencies:** _Libs:_ `@upstash/qstash`, `@upstash/ratelimit`, `@upstash/redis`. _APIs:_ Upstash. _Skills:_ used by `async-job-orchestration`.
- **Docs:** [Upstash QStash](https://upstash.com/docs/qstash) · [Ratelimit](https://upstash.com/docs/redis/sdks/ratelimit-ts/overview)
- **Complexity:** Moderate.
- **Example:** `/job-queue enqueue generation with 5/org concurrency cap`

### 3.6 `storage-assets` — Upload + signed URL delivery
- **Description:** Store generated audio/cover art in Supabase Storage (→ R2 at scale) and serve via signed, expiring URLs (PRD §3.7, §6.2). Never expose raw provider URLs.
- **Input:** Asset bytes/URL, kind, org scope.
- **Output:** `assets` row + signed download URL generator.
- **Dependencies:** _Libs:_ supabase-js storage, `@aws-sdk/client-s3` (R2). _APIs:_ Supabase Storage / Cloudflare R2. _Skills:_ ← `generation-webhook`.
- **Docs:** [Supabase Storage](https://supabase.com/docs/guides/storage) · [Cloudflare R2](https://developers.cloudflare.com/r2/)
- **Complexity:** Moderate.
- **Example:** `/storage-assets store mp3 + return signed URL`

### 3.7 `lyric-assist` — LLM lyric generation & editing
- **Description:** Generate/regenerate/edit lyrics from a brief, versioned in `lyrics` (PRD §3.4). Instrumental mode skips.
- **Input:** Brief spec, edit target/section.
- **Output:** Lyric text + stored version.
- **Dependencies:** _Libs:_ `@anthropic-ai/sdk` (or provider lyrics endpoint). _APIs:_ Anthropic API. _Skills:_ → `content-moderation`.
- **Docs:** [Anthropic API](https://docs.anthropic.com/en/api/overview) · [claude-api skill](https://code.claude.com/docs/en/commands)
- **Complexity:** Moderate.
- **Example:** `/lyric-assist draft upbeat gym jingle lyrics`

### 3.8 `content-moderation` — Pre-dispatch screening
- **Description:** Screen briefs/lyrics for hate/explicit content, real-artist voice cloning, and third-party trademarks **before** dispatch; log flags; block with a specific reason (PRD §3.6). Protects COGS + legal.
- **Input:** Brief/lyrics text, workspace banned terms.
- **Output:** Allow/deny + reason + `moderation_flags` row.
- **Dependencies:** _Libs:_ Anthropic/OpenAI moderation or LLM classifier. _APIs:_ moderation API. _Skills:_ ← `lyric-assist`; gates `async-job-orchestration`.
- **Docs:** [Anthropic API](https://docs.anthropic.com/en/api/overview)
- **Complexity:** Moderate.
- **Example:** `/content-moderation screen brief before generate`

### 3.9 `transactional-email` — Outbound email
- **Description:** Send invites, approval notifications, receipts via a transactional email provider.
- **Input:** Template, recipient, data.
- **Output:** Sent email + delivery handling.
- **Dependencies:** _Libs:_ Resend/Postmark SDK. _APIs:_ email provider. _Skills:_ used by `org-invite-flow`.
- **Docs:** [Resend](https://resend.com/docs) · [Postmark](https://postmarkapp.com/developer)
- **Complexity:** Simple.
- **Example:** `/transactional-email send approval notification`

---

## Category 4 — Backend / API Scaffolding

### 4.1 `trpc-router` — Scaffold a type-safe router
- **Description:** Create a tRPC router + procedures for a resource with Zod input/output and role guards (PRD §5). Primary app traffic pattern.
- **Input:** Resource, procedures, roles.
- **Output:** Router module wired into the app router with end-to-end types.
- **Dependencies:** _Libs:_ tRPC, Zod, Hono. _Skills:_ ← `rbac-middleware`, `db-data-access`.
- **Docs:** [tRPC](https://trpc.io/docs) · [Hono](https://hono.dev/)
- **Complexity:** Moderate.
- **Example:** `/trpc-router create projects router (list/create/archive)`

### 4.2 `rest-endpoint` — Scaffold a REST handler
- **Description:** Create signature-verified REST handlers for callers that don't speak tRPC (webhooks, public review) (PRD §5.1).
- **Input:** Route, auth mode (signature/token), payload schema.
- **Output:** Validated handler.
- **Dependencies:** _Libs:_ Hono, Zod. _Skills:_ ← `webhook-idempotency` / `review-link-tokens`.
- **Docs:** [Hono routing](https://hono.dev/docs/api/routing)
- **Complexity:** Simple.
- **Example:** `/rest-endpoint public review decision handler`

### 4.3 `async-job-orchestration` — Wire the generation pipeline
- **Description:** Compose the full async flow: validate role → moderate → hold credits → enqueue → worker → provider → webhook → store → realtime → poller backstop (PRD §5.4). The backbone skill.
- **Input:** Generation request contract.
- **Output:** End-to-end wired pipeline across api/worker.
- **Dependencies:** _Skills:_ ← `job-queue`, `content-moderation`, `credit-ledger-ops`, `music-provider-adapter`, `generation-webhook`, `reconciliation-poller`, `realtime-status`.
- **Docs:** [tech-stack.md §0](./tech-stack.md)
- **Complexity:** Complex.
- **Example:** `/async-job-orchestration wire POST /songs/:id/generate`

---

## Category 5 — Frontend Component Generation

### 5.1 `react-component` — Scaffold a UI component
- **Description:** Build an accessible, responsive React component matching the design system (PRD §6.3–6.4).
- **Input:** Component spec, props, states.
- **Output:** `PascalCase.tsx` + styles + stories/tests.
- **Dependencies:** _Libs:_ React, Tailwind/shadcn-ui. _Skills:_ → `tanstack-query-hooks`.
- **Docs:** [React](https://react.dev/) · [shadcn/ui](https://ui.shadcn.com/)
- **Complexity:** Simple.
- **Example:** `/react-component workspace switcher`

### 5.2 `audio-player` — Accessible playback/compare UI
- **Description:** Player with play/pause/seek and side-by-side variation compare; keyboard-operable, aria-live status (PRD §3.7, §6.3). Verify on iOS Safari + Android Chrome.
- **Input:** Track/asset URLs, variations.
- **Output:** Reusable player component.
- **Dependencies:** _Libs:_ Web Audio/`<audio>`, (optional) wavesurfer.js. _Skills:_ ← `storage-assets`.
- **Docs:** [MDN Web Audio](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) · [wavesurfer.js](https://wavesurfer.xyz/)
- **Complexity:** Moderate.
- **Example:** `/audio-player compare 2 variations`

### 5.3 `form-builder` — Validated forms (Brief Builder)
- **Description:** Build the structured Creative Brief form and other forms with React Hook Form + Zod, shared schemas with the backend (PRD §3.3).
- **Input:** Field spec + validation rules.
- **Output:** Form component with typed submit + inline errors.
- **Dependencies:** _Libs:_ React Hook Form, Zod, `@hookform/resolvers`. _Skills:_ ← `zod-schemas`.
- **Docs:** [React Hook Form](https://react-hook-form.com/) · [Zod](https://zod.dev/)
- **Complexity:** Moderate.
- **Example:** `/form-builder brief builder form`

### 5.4 `realtime-status` — Live generation status subscriber
- **Description:** Client hook subscribing to Supabase Realtime for `generations` status flips (`generating → ready`), with polling fallback (PRD §5.4).
- **Input:** Generation id(s).
- **Output:** `useGenerationStatus()` hook.
- **Dependencies:** _Libs:_ supabase-js Realtime, TanStack Query. _Skills:_ ← `tanstack-query-hooks`.
- **Docs:** [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- **Complexity:** Moderate.
- **Example:** `/realtime-status subscribe to song generation`

### 5.5 `tanstack-query-hooks` — Typed data hooks
- **Description:** Generate typed query/mutation hooks (caching, retries, status polling) over tRPC endpoints (PRD state approach).
- **Input:** Endpoint, cache keys.
- **Output:** Typed hooks.
- **Dependencies:** _Libs:_ TanStack Query, `@trpc/react-query`. _Skills:_ ← `trpc-router`.
- **Docs:** [TanStack Query](https://tanstack.com/query/latest) · [tRPC + React Query](https://trpc.io/docs/client/react)
- **Complexity:** Simple.
- **Example:** `/tanstack-query-hooks library queries`

### 5.6 `data-table` — Paginated library views
- **Description:** Sortable/filterable paginated tables for the workspace→project→song library (PRD §3.8).
- **Input:** Columns, filters, page size.
- **Output:** Reusable table component.
- **Dependencies:** _Libs:_ TanStack Table. _Skills:_ ← `tanstack-query-hooks`.
- **Docs:** [TanStack Table](https://tanstack.com/table/latest)
- **Complexity:** Simple.
- **Example:** `/data-table song library, filter by status`

### 5.7 `public-review-page` — External approval UI
- **Description:** Login-free, mobile-friendly review page for clients to play, comment, and approve/request-changes via a review token (PRD §3.9).
- **Input:** Review token scope.
- **Output:** Public route + approval UI.
- **Dependencies:** _Skills:_ ← `review-link-tokens`, `audio-player`.
- **Docs:** [PRD §3.9](./PRD.md)
- **Complexity:** Moderate.
- **Example:** `/public-review-page build /review/:token`

---

## Category 6 — Testing & Validation

### 6.1 `zod-schemas` — Shared validation schemas
- **Description:** Single-source Zod schemas shared across frontend/backend for all inputs (PRD §4.4, §6.2).
- **Input:** Entity/DTO spec.
- **Output:** Schemas in `packages/shared`.
- **Dependencies:** _Libs:_ Zod.
- **Docs:** [Zod](https://zod.dev/)
- **Complexity:** Simple.
- **Example:** `/zod-schemas brief + generation request`

### 6.2 `unit-tests` — Unit test generation
- **Description:** Vitest unit tests for pure logic (credit math, adapters mapping, guards).
- **Input:** Module under test.
- **Output:** `*.test.ts` with meaningful cases + edge cases.
- **Dependencies:** _Libs:_ Vitest.
- **Docs:** [Vitest](https://vitest.dev/)
- **Complexity:** Simple.
- **Example:** `/unit-tests credit-ledger hold/commit`

### 6.3 `integration-tests` — API integration tests
- **Description:** Test tRPC/REST endpoints against a test DB incl. role enforcement and webhook idempotency.
- **Input:** Endpoint + scenarios.
- **Output:** Integration suite with seeded fixtures.
- **Dependencies:** _Libs:_ Vitest, supertest/tRPC test caller, Supabase local. _Skills:_ ← `db-seed`.
- **Docs:** [Supabase local dev](https://supabase.com/docs/guides/local-development)
- **Complexity:** Moderate.
- **Example:** `/integration-tests generate endpoint happy + 402 paths`

### 6.4 `rls-isolation-tests` — Cross-tenant leak tests
- **Description:** Prove that a user in org A can never read/write org B data, for every tenant table (PRD §6.2). **Ship-blocking security test.**
- **Input:** Tables + roles.
- **Output:** Test suite asserting default-deny + scoped access.
- **Dependencies:** _Libs:_ Vitest, supabase-js with distinct JWTs. _Skills:_ ← `rls-policy`, `db-seed`.
- **Docs:** [Supabase RLS testing](https://supabase.com/docs/guides/database/postgres/row-level-security#testing-policies)
- **Complexity:** Complex.
- **Example:** `/rls-isolation-tests verify org A cannot see org B songs`

### 6.5 `e2e-tests` — Browser end-to-end
- **Description:** Playwright flows for the critical paths: brief → generate → ready → approve via review link; incl. mobile viewport.
- **Input:** User journey.
- **Output:** Playwright specs.
- **Dependencies:** _Libs:_ Playwright.
- **Docs:** [Playwright](https://playwright.dev/)
- **Complexity:** Moderate.
- **Example:** `/e2e-tests brief-to-approval flow`

### 6.6 `load-tests` — Concurrency & rate-limit validation
- **Description:** Simulate concurrent generations to validate queue caps, rate limits, and COGS controls hold (PRD §5.5, §6.1).
- **Input:** Target RPS/concurrency.
- **Output:** k6 script + report.
- **Dependencies:** _Libs:_ k6/Artillery.
- **Docs:** [k6](https://k6.io/docs/)
- **Complexity:** Moderate.
- **Example:** `/load-tests 50 concurrent generations`

### 6.7 `a11y-audit` — Accessibility validation
- **Description:** Automated + manual WCAG 2.2 AA checks, especially the audio player and forms (PRD §6.3).
- **Input:** Pages/components.
- **Output:** axe report + fixes list.
- **Dependencies:** _Libs:_ axe-core, `@axe-core/playwright`.
- **Docs:** [WCAG 2.2](https://www.w3.org/TR/WCAG22/) · [axe-core](https://github.com/dequelabs/axe-core)
- **Complexity:** Moderate.
- **Example:** `/a11y-audit player + brief form`

---

## Category 7 — Deployment & Infrastructure

### 7.1 `supabase-provision` — Provision project & config
- **Description:** Create/configure Supabase project, buckets, auth providers, environments (uses Supabase MCP).
- **Input:** Env, providers, bucket config.
- **Output:** Configured project + linked local CLI.
- **Dependencies:** _APIs:_ Supabase (+ MCP). _Docs:_ [Supabase MCP](https://supabase.com/docs/guides/getting-started/mcp)
- **Complexity:** Moderate.
- **Example:** `/supabase-provision staging project + audio bucket`

### 7.2 `netlify-deploy` — Web + functions deploy
- **Description:** Configure and deploy the web app + webhook/serverless functions on Netlify incl. deploy previews (uses Netlify MCP).
- **Input:** Build config, env vars.
- **Output:** Deployed site + preview pipeline.
- **Dependencies:** _APIs:_ Netlify (+ MCP). _Docs:_ [Netlify](https://docs.netlify.com/) · [Netlify MCP](https://docs.netlify.com/build/build-with-ai/agent-setup-guides/set-up-claude-code-for-netlify/)
- **Complexity:** Moderate.
- **Example:** `/netlify-deploy web app + webhook function`

### 7.3 `worker-deploy` — Always-on worker host
- **Description:** Deploy the queue worker + poller as a long-lived Railway/Render service (the piece Netlify/Vercel can't run).
- **Input:** Service config, env, scaling.
- **Output:** Running worker service + health check.
- **Dependencies:** _APIs:_ Railway/Render. _Docs:_ [Railway](https://docs.railway.com/) · [Render workers](https://render.com/docs/background-workers)
- **Complexity:** Moderate.
- **Example:** `/worker-deploy generation worker on Railway`

### 7.4 `ci-cd-pipeline` — GitHub Actions
- **Description:** PR pipeline: lint/typecheck/test, run migrations on preview branch, deploy web + worker on merge (PRD §4 CI/CD).
- **Input:** Jobs, environments, secrets.
- **Output:** `.github/workflows/*` pipeline.
- **Dependencies:** _APIs:_ GitHub Actions (+ MCP). _Docs:_ [GitHub Actions](https://docs.github.com/actions)
- **Complexity:** Moderate.
- **Example:** `/ci-cd-pipeline test + deploy on main`

### 7.5 `env-secrets` — Environment & secrets management
- **Description:** Define and wire required env vars (names in [CLAUDE.md §6](../.claude/CLAUDE.md)) across environments; keep secrets server-side.
- **Input:** Service list.
- **Output:** `.env.example` + platform secret config.
- **Dependencies:** _Docs:_ [Netlify env](https://docs.netlify.com/environment-variables/overview/)
- **Complexity:** Simple.
- **Example:** `/env-secrets scaffold .env.example`

---

## Category 8 — Documentation Generation

### 8.1 `api-docs` — API reference generation
- **Description:** Generate API reference from tRPC/Zod (and OpenAPI for public REST) so integrators/teammates can consume endpoints (PRD §5).
- **Input:** Routers/schemas.
- **Output:** Rendered API docs.
- **Dependencies:** _Libs:_ `trpc-openapi`/`trpc-to-openapi`, Scalar/Redoc.
- **Docs:** [trpc-to-openapi](https://github.com/mcampa/trpc-to-openapi)
- **Complexity:** Simple.
- **Example:** `/api-docs generate reference from routers`

### 8.2 `adr` — Architecture Decision Records
- **Description:** Capture significant decisions (provider abstraction, tenancy model) as ADRs so rationale persists.
- **Input:** Decision + context + alternatives.
- **Output:** `docs/adr/NNN-*.md`.
- **Docs:** [ADR](https://adr.github.io/)
- **Complexity:** Simple.
- **Example:** `/adr record MusicProvider abstraction`

### 8.3 `changelog` — Release notes
- **Description:** Generate changelog entries from merged PRs/commits.
- **Input:** Commit/PR range.
- **Output:** `CHANGELOG.md` entries.
- **Docs:** [Keep a Changelog](https://keepachangelog.com/)
- **Complexity:** Simple.
- **Example:** `/changelog since v0.1.0`

### 8.4 `onboarding-readme` — Contributor onboarding
- **Description:** Maintain README/runbook so a new dev can boot Cadence locally (ties into `/run-skill-generator`).
- **Input:** Setup steps, env, commands.
- **Output:** README + local dev guide.
- **Complexity:** Simple.
- **Example:** `/onboarding-readme local setup guide`

---

## Category 9 — Error Handling, Logging & Observability

### 9.1 `structured-logging` — App-wide logging
- **Description:** Structured, tenant-tagged (never secret-leaking) logging across api/worker with request/job correlation ids.
- **Input:** Log points, redaction rules.
- **Output:** Logger module + conventions.
- **Dependencies:** _Libs:_ pino.
- **Docs:** [pino](https://getpino.io/)
- **Complexity:** Simple.
- **Example:** `/structured-logging add pino with job ids`

### 9.2 `error-handling` — Consistent error model
- **Description:** Standard error taxonomy + consistent API error responses (PRD §5.3) and React error boundaries.
- **Input:** Error cases.
- **Output:** Shared error types + boundary components + handler middleware.
- **Dependencies:** _Libs:_ tRPC error formatter, React error boundaries.
- **Docs:** [tRPC error handling](https://trpc.io/docs/server/error-handling)
- **Complexity:** Moderate.
- **Example:** `/error-handling standard API error shape`

### 9.3 `webhook-idempotency` — Dedupe & replay safety
- **Description:** Idempotency-key handling via `webhook_events` so provider/Stripe retries never double-charge or double-store. Money-sensitive.
- **Input:** Event id source.
- **Output:** Reusable idempotency guard.
- **Dependencies:** _Skills:_ used by `generation-webhook`, `stripe-billing`.
- **Docs:** [Stripe idempotency](https://stripe.com/docs/api/idempotent_requests)
- **Complexity:** Moderate.
- **Example:** `/webhook-idempotency guard stripe events`

### 9.4 `observability` — Monitoring & alerting
- **Description:** Error tracking + key metrics/alerts (generation success rate, queue depth, credit anomalies) tied to PRD §8 metrics.
- **Input:** Metrics/thresholds.
- **Output:** Sentry + dashboards/alerts.
- **Dependencies:** _Libs:_ Sentry SDK. _APIs:_ Sentry. _Docs:_ [Sentry](https://docs.sentry.io/)
- **Complexity:** Moderate.
- **Example:** `/observability alert on generation success <95%`

### 9.5 `usage-reporting` — Metering dashboards & export (P1)
- **Description:** Per-workspace credit/usage reporting + CSV export (PRD §3.12).
- **Input:** Date range, workspace.
- **Output:** Report views + export.
- **Dependencies:** _Skills:_ ← `credit-ledger-ops`, `data-table`.
- **Docs:** [PRD §3.12](./PRD.md)
- **Complexity:** Moderate.
- **Example:** `/usage-reporting monthly credits by workspace`

### 9.6 `audit-log` — Tenant audit trail
- **Description:** Append audit entries (actor, action, target) for sensitive operations (member changes, billing, deletions) (PRD §4.2).
- **Input:** Action event.
- **Output:** `audit_log` writer + query.
- **Complexity:** Simple.
- **Example:** `/audit-log record role change`

---

## Summary & sequencing

**Count:** ~40 build-time skills across 9 categories (+ 4 bundled skills reused, not built).

**Correctness/security-critical (get these right first — Complex):** `rls-policy`, `rls-isolation-tests`, `credit-ledger-ops`, `music-provider-adapter`, `generation-webhook`, `async-job-orchestration`, `stripe-billing`, `review-link-tokens`.

**Suggested build order (maps to PRD P0):**
1. **Foundation:** `supabase-provision` → `db-migration` → `rls-policy` → `rls-isolation-tests` → `zod-schemas` → `auth-setup` → `rbac-middleware`.
2. **Generation core:** `music-provider-adapter` → `job-queue` → `content-moderation` → `credit-ledger-ops` → `generation-webhook` → `storage-assets` → `reconciliation-poller` → `async-job-orchestration` → `realtime-status`.
3. **App surface:** `trpc-router` → `tanstack-query-hooks` → `react-component`/`form-builder`/`audio-player`/`data-table` → `lyric-assist`.
4. **Commerce & trust:** `stripe-billing` → `webhook-idempotency` → `org-invite-flow`.
5. **P1:** `review-link-tokens` → `public-review-page` → `brand-kits` (via form/db skills) → `usage-reporting`.
6. **Cross-cutting throughout:** `structured-logging`, `error-handling`, `observability`, `audit-log`, testing skills, `ci-cd-pipeline`, deploy skills, docs skills.

**Notes on what we deliberately did NOT list as new skills:** code review, security review, and app-launch verification are handled by the **bundled** `/code-review`, `/security-review`, `/run`, `/verify`. Video generation and cover art (PRD P2) are deferred, so no skills yet. If any of the Complex skills prove reusable enough, package them as `.claude/skills/` folders (with bundled scripts where a deterministic step exists) so future sessions inherit them.

*Grounded in the PRD/tech-stack as of 2026-07-15. Library choices (e.g., Resend, pino, k6, shadcn/ui) are sensible defaults, not yet ratified — confirm during setup.*
