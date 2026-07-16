<!--
MAINTAINER NOTES (stripped from Claude's context — for humans only):
- Keep this file under ~200 lines. It loads in full every session; longer = worse adherence.
- Do NOT duplicate the PRD/tech-stack tables here. Link to them. Update those docs, not this one, for deep detail.
- The ONLY section that should change frequently is "3. Current State". Keep it honest and current.
- Env vars: list NAMES only, never values.
-->

# CLAUDE.md — Cadence

## 1. Project Identity
- **Cadence** — a multi-tenant B2B web app for creating custom, on-brand songs & jingles with AI, for marketing agencies and SMBs.
- **Mission:** turn a creative brief into commercial-ready branded audio in minutes, organized per client, with a review/approval workflow.
- **Success criteria:** new org produces its first `ready` track within 24h; generation success rate >95%; positive gross margin per paying org (generation is COGS — meter it).
- **Full context lives in the research docs — read them before non-trivial work:**
  - [PRD](../research/PRD.md) — features, schema, API, metrics (source of truth for *what to build*)
  - [Tech stack](../research/tech-stack.md) — stack choices + rationale
  - [Viability analysis](../research/viability-analysis.md) — why this vertical, key risks

## 2. Technical Context

### Stack (summary — full detail in [tech-stack.md](../research/tech-stack.md))
- **Frontend:** React, **web-first responsive** (B2B dashboard). TypeScript. State: **TanStack Query** (server state) + **Zustand** (UI state). No native mobile in MVP.
- **Backend:** **Node.js + TypeScript**, Hono. **tRPC** for app traffic; **plain REST** for inbound webhooks + public review endpoints.
- **Auth:** Supabase Auth (JWT); roles `owner/admin/member/viewer`.
- **Database:** Supabase **PostgreSQL**. Audio in Supabase Storage → **Cloudflare R2** at scale. **Upstash Redis/QStash** = queue + rate limiting.
- **Hosting:** Netlify (web + webhook functions), **Railway/Render (always-on worker)**, Supabase, Upstash.
- **Billing:** **Stripe only** (seat + credit model). No mobile IAP/RevenueCat.

### Key architectural decisions (the rationale matters — don't undo these casually)
1. **Generation is asynchronous.** Never block a request on it. Flow: tRPC enqueue → Upstash → always-on worker → `MusicProvider` → provider webhook → store audio → update DB → Supabase Realtime notifies client. A reconciliation poller resolves missed webhooks within 5 min. *Netlify/Vercel/Edge functions cannot run the durable worker — that needs Railway/Render.*
2. **`MusicProvider` swappable adapter.** The generation provider is an unstable third-party Suno reseller (see viability analysis). Isolate it behind one interface with per-provider adapters so it can be swapped/failed-over. **Never call the provider directly from the client.**
3. **Multi-tenancy = shared schema + Row Level Security.** Every tenant row carries `organization_id`; RLS policies enforce isolation. Model: Org → Workspace → Project → Song → Generation.
4. **Credit metering is first-class.** COGS (per-song API cost) dwarfs hosting. Check + hold credits *before* dispatch; commit debit on success. Never let usage silently exceed plan.
5. **Moderation before dispatch.** Screen briefs/lyrics before spending money (blocks abuse + legal exposure). No exceptions.

### Coding standards & conventions
- **TypeScript strict** everywhere; share types across frontend/backend (that's why the stack is all-TS).
- **DB naming:** `snake_case` tables/columns. **TS naming:** `camelCase`. Tables plural (`generations`), FKs `*_id`.
- **Migrations:** SQL migrations via **Supabase CLI**, committed to `supabase/migrations/`, reviewed in PRs. **Never hand-edit production schema.**
- **RLS on every tenant table**, default-deny, keyed to `organization_id` + verified membership. Missing RLS = data leak.
- **Secrets are server-side only.** Never ship provider/Stripe/service-role keys to the client. Serve assets via **signed, expiring URLs** — never raw provider URLs.
- **Webhooks** must verify signatures and be idempotent (dedupe via `webhook_events`).
- Validate all user input server-side; length-cap + trim text fields.

## 3. Current State
<!-- KEEP THIS SECTION CURRENT. This is the part that goes stale fastest. -->
- **Phase:** Pre-build / greenfield. Only the research docs (`research/`) and this file exist. **No application code yet.**
- **In progress:** none — next up is the DB schema + RLS migrations (PRD §4) and the `MusicProvider` interface + first reseller adapter.
- **Known risks / debt (design-time):**
  - Generation provider is an unofficial reseller — planned migration to a legitimate provider (ElevenLabs Music / Stable Audio). Design provider-swappable from commit #1.
  - Fully-AI output has limited copyright protection — ToS must disclose this; no real-artist voice cloning.

## 4. Agent Instructions

### How to approach this codebase
- It's greenfield B2B **web-first**. Follow the [PRD](../research/PRD.md) for scope and the [tech-stack](../research/tech-stack.md) for choices. Match the decisions in §2 rather than introducing alternatives.
- Prefer editing existing files over creating new ones; keep the async/adapter/RLS patterns intact.
- Respect P0/P1/P2 priorities in the PRD — build P0 first; don't gold-plate.

### Ask before doing
- Adding a **new third-party service or major dependency** not already in the stack.
- Changing the **tenancy model, RLS approach, billing/credit logic, or the async generation flow**.
- **Schema migrations that alter or drop existing tables/columns.**
- Picking a niche/feature interpretation not covered by the PRD.

### Never do without explicit approval
- **Commit or push to git** (branch first if asked to commit; never push to a default branch unprompted).
- **Expose secrets to the client** or call the generation provider from client code.
- **Weaken, disable, or bypass RLS**, moderation, or credit checks.
- **Destructive DB/infra ops** (drop/truncate, deleting buckets, resetting migrations).
- Change public API contracts or the credit-pricing model.

## 5. File Structure Map
<!-- Forward-looking intent until code exists; once built, this becomes derivable — trim then. -->
- `research/` — PRD, tech-stack, viability analysis. Product/architecture source of truth.
- `.claude/` — this file + future `rules/` (path-scoped rules) and `settings.json`.
- **Planned layout (TS monorepo):**
  - `apps/web/` — React web client (dashboard + public review pages).
  - `apps/api/` — Node/Hono backend: tRPC routers + REST webhook/review handlers.
  - `apps/worker/` — always-on queue worker + reconciliation poller (Railway/Render).
  - `packages/shared/` — shared TS types, Zod schemas, `MusicProvider` interface + adapters.
  - `supabase/migrations/` — SQL migrations (RLS policies live here).
- **Naming:** kebab-case dirs/files; React components `PascalCase.tsx`; one adapter per file in `packages/shared/providers/`.

## 6. External Dependencies
<!-- Env var NAMES only. Real values go in platform secret managers / .env (gitignored), never here. -->
| Service | Purpose | Docs |
|---|---|---|
| Supabase | Postgres, Auth, Storage, Realtime | https://supabase.com/docs |
| Music provider (Suno reseller → later ElevenLabs/Stable Audio) | Song generation (async, webhook) | https://docs.sunoapi.org |
| Upstash | Queue (QStash) + rate limiting/cache | https://upstash.com/docs |
| Stripe | B2B billing (subscriptions + credits) | https://stripe.com/docs |
| Cloudflare R2 | Cheap audio storage/egress at scale | https://developers.cloudflare.com/r2/ |
| Netlify | Web hosting + webhook functions | https://docs.netlify.com |
| Railway / Render | Always-on worker host | https://docs.railway.com · https://render.com/docs |
| Anthropic API | Lyric assist + moderation (LLM) | https://docs.anthropic.com |

**Env var names (values live in secret managers, never in git):**
`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`,
`MUSIC_PROVIDER_BASE_URL`, `MUSIC_PROVIDER_API_KEY`, `MUSIC_PROVIDER_WEBHOOK_SECRET`,
`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `QSTASH_TOKEN`,
`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PUBLISHABLE_KEY`,
`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`,
`ANTHROPIC_API_KEY`, `APP_URL`, `API_URL`.

## 7. User Avatar Reminder
- **Maya, Agency Creative Lead** (primary): juggles 6–12 clients; wants 3–4 on-brand tracks *today*; fears sounding cheap or hitting legal trouble; abandons tools that take >1 session to produce something usable.
- **Devin, SMB owner** (secondary): wants one good jingle, fast, cheap, commercially safe.
- **UX principles for this audience:**
  1. **Time-to-first-usable-asset is everything** — optimize the brief → track path ruthlessly.
  2. **One-session value.** Never require multiple sittings to get an output.
  3. **The client-approval moment is the aha** — make review links frictionless (no login, works on mobile).
  4. **Per-client organization + commercial-safety trust** — keep workspaces cleanly separated; be clear about usage rights.
