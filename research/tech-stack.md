# Tech Stack Recommendation: AI Music Generation App

**Date:** 2026-07-15
**Companion doc:** [viability-analysis.md](./viability-analysis.md)
**Scope:** Recommended stack for the *reframed* product (a focused vertical — e.g. personalized/occasion songs or creator music — not a raw Suno wrapper), built as an MVP that can grow to ~10k users on a lean budget.

---

## 0. The one architectural fact that shapes everything

**Music generation is asynchronous and slow.** A song takes ~20–60s and is delivered via a **webhook callback**, not a synchronous HTTP response (see the provider's [callback docs](https://docs.sunoapi.org/suno-api/generate-music-callbacks)). Every stack decision below follows from this:

- You **cannot** just "call the API and await the result" in a request handler — you'd hit serverless timeouts and leave users staring at a spinner.
- You need: a **job queue**, a **publicly reachable webhook endpoint**, an **always-on worker** (or durable functions) to reconcile jobs, **object storage** for the returned audio, and a **realtime/polling channel** to tell the client "your song is ready."
- Your **mobile app can never call the generation provider directly** — API keys must live server-side, and only a server can receive webhooks. This makes a real backend mandatory (not optional BaaS-only).

Keep this in mind; it's the #1 thing that trips up teams who assume "it's just a wrapper."

---

## 1. Frontend Recommendation

### Framework: **Expo (React Native) + Expo Router** — one codebase for iOS, Android, and Web

| Option | Verdict |
|---|---|
| **Expo (React Native) — RECOMMENDED** | Matches your React Native preference; ships iOS + Android + Web from one TypeScript codebase. Managed native builds via EAS. Best fit for a consumer music app that *needs* to be on phones (audio, sharing, notifications). |
| Next.js only (React web) | Great DX but web-only. A music app that lives on the App/Play stores loses too much by being web-only. |
| React Native (bare) | More control, far more setup/maintenance. Unnecessary at MVP. |

**Recommendation:** **Expo** as the primary app, optionally a small marketing/landing site later — built with **Astro** or **Next.js** and hosted on **Netlify** (which has an official MCP server; see §5). Expo gives you native audio, push notifications, and store distribution — all of which this product needs.

- Expo: <https://docs.expo.dev/>
- Expo Router (file-based navigation): <https://docs.expo.dev/router/introduction/>
- React Native: <https://reactnative.dev/docs/getting-started>

### Key libraries for our specific features

| Need | Library | Docs |
|---|---|---|
| **Audio playback** (core feature) | `expo-audio` (the modern replacement for `expo-av`) | <https://docs.expo.dev/versions/latest/sdk/audio/> |
| Background/lock-screen audio controls | `react-native-track-player` (if you need a full player UX) | <https://rntp.dev/> |
| **Server state / data fetching** | TanStack Query | <https://tanstack.com/query/latest> |
| **Client/UI state** | Zustand (lightweight) | <https://zustand.docs.pmnd.rs/> |
| Type-safe API client | tRPC client | <https://trpc.io/docs/client/react> |
| Auth SDK | `@supabase/supabase-js` | <https://supabase.com/docs/reference/javascript/introduction> |
| Payments (mobile) | RevenueCat (wraps App Store / Play IAP) | <https://www.revenuecat.com/docs/> |
| Forms + validation | React Hook Form + Zod | <https://react-hook-form.com/> · <https://zod.dev/> |
| Realtime "song is ready" | Supabase Realtime | <https://supabase.com/docs/guides/realtime> |

### State management approach

**Two-layer, deliberately minimal:**

1. **Server state → TanStack Query.** Songs, generation status, user library, credits. Handles caching, retries, and polling for job status out of the box. This is 80% of your "state."
2. **Client state → Zustand.** Small, ephemeral UI state (the song-creation wizard, playback UI, form drafts). No Redux — it's overkill here.

Do **not** reach for Redux/MobX; the app is I/O-bound around an API, and Query + Zustand covers it with far less boilerplate.

---

## 2. Backend Recommendation

### Runtime & framework: **Node.js (TypeScript)** + **Hono** (or Fastify)

**Node over Python** — deliberate:

- You are **not doing ML** (that's the provider's job). Python's ML advantage is irrelevant here.
- Node gives you **one language across the whole stack** (Expo + backend both TypeScript), **shared types**, and first-class SDKs for every dependency: Supabase, Stripe, RevenueCat, the generation providers, Upstash.
- **tRPC** (below) requires a TS backend to deliver end-to-end type safety to your TS frontend — a large DX win for a small team.

Pick Python *only if* you later add your own audio DSP/ML pipeline. For this product, Node is the clear choice.

- Node.js: <https://nodejs.org/en/docs>
- Hono (fast, portable, works on Node + edge): <https://hono.dev/>
- Fastify (mature Node alternative): <https://fastify.dev/>

### API architecture: **tRPC for the app, REST for webhooks**

- **tRPC** for all client↔server calls (create song, list library, billing). Both ends are TypeScript, so you get end-to-end type safety with zero schema duplication and no codegen. Ideal for a solo/small team moving fast. — <https://trpc.io/docs>
- **Plain REST endpoints** for **inbound webhooks** from the generation provider and from Stripe/RevenueCat — these callers don't speak tRPC. Keep them as thin, signature-verified POST handlers.
- **Skip GraphQL.** It adds schema/resolver overhead with no payoff at this scale and team size.

### Asynchronous job pipeline (the heart of the backend)

```
Client → tRPC "createSong" → enqueue job (Upstash) → return jobId immediately
Worker → calls generation provider with callback URL
Provider → POST webhook → REST handler → store audio in Storage, update DB row
DB update → Supabase Realtime → client flips "generating" → "ready"
```

- **Queue / rate-limiting:** Upstash Redis / QStash (serverless, HTTP-based, pairs well with serverless). — <https://upstash.com/docs>
- Always run a **reconciliation poller** as a backstop for missed webhooks (query provider's [get-details endpoint](https://docs.sunoapi.org/suno-api/get-music-generation-details)). Webhooks *will* occasionally fail; never rely on them alone.

### Authentication: **Supabase Auth**

- Email/password, magic links, and OAuth (Google/Apple — **Apple sign-in is required** by App Store rules if you offer other social logins). — <https://supabase.com/docs/guides/auth>
- Issues JWTs your backend verifies; drives **Row Level Security** in Postgres so users only see their own songs.
- One vendor for auth + DB + storage + realtime = less integration surface. Big win for a small team.

---

## 3. Database Recommendation

### Primary: **Supabase (managed PostgreSQL)** — RECOMMENDED

Chosen over Firebase and MongoDB Atlas because:

- **Relational fits the data** (users → songs → generations → credits → transactions with clear relations). Firestore's document model makes these joins/aggregations painful.
- **Bundles what you'd otherwise wire up separately:** Postgres + Auth + **Storage** (for audio files) + **Realtime** (for "song ready") + Edge Functions — one dashboard, one SDK.
- **Best-in-class MCP support** — it's an official Claude connector (see §5).
- Standard SQL + `pgvector` available if you later add semantic search/recommendations.

Docs: <https://supabase.com/docs> · Database: <https://supabase.com/docs/guides/database/overview>

**Firebase** is a reasonable alternative *if* you were mostly realtime + simple docs, but its query/relational limits and vendor lock-in count against it here. **MongoDB Atlas** is fine but then you're still bolting on separate auth, storage, and realtime — more moving parts, no benefit for this relational workload.

### Schema approach

- **SQL migrations in version control** via the Supabase CLI (`supabase migration new`). Never click-edit production schema. — <https://supabase.com/docs/guides/deployment/database-migrations>
- **Row Level Security (RLS) on every table**, keyed to `auth.uid()`. Non-negotiable, since the mobile client talks to Supabase directly. — <https://supabase.com/docs/guides/database/postgres/row-level-security>
- Optional typed query layer: **Drizzle ORM** (TS-native, great migrations) or **Prisma**. — <https://orm.drizzle.team/> · <https://www.prisma.io/docs>

Rough core tables: `profiles`, `songs`, `generations` (one row per provider job, with `status`, `provider`, `job_id`, `cost`), `credits_ledger`, `subscriptions`, `payments`.

### Secondary data stores

| Store | Purpose | Needed when |
|---|---|---|
| **Supabase Storage** (or Cloudflare R2) | Store generated audio (MP3/WAV) + cover art | Day 1. Start with Supabase Storage; **migrate hot audio to Cloudflare R2 for zero egress fees** once bandwidth grows — audio egress is your sneakiest cost. R2: <https://developers.cloudflare.com/r2/> |
| **Upstash Redis / QStash** | Job queue, rate limiting, idempotency keys | Day 1 (drives the async pipeline) — <https://upstash.com/docs/redis> |
| **Search (Postgres FTS)** | Search a user's own library | Only when libraries get large. Postgres full-text search first; a dedicated engine (Typesense/Meilisearch) only if it ever becomes a real feature. |

### Backup & migration strategy

- **Backups:** Supabase runs automatic daily backups (Pro plan adds Point-in-Time Recovery). Additionally schedule your own `pg_dump` to object storage weekly. — <https://supabase.com/docs/guides/platform/backups>
- **Schema migrations:** CLI migrations reviewed in PRs, applied in CI (see §4). Test against a branch/preview DB before prod.
- **Audio durability:** enable versioning/lifecycle rules on the storage bucket; store the provider's original URL in `generations` so you can re-fetch within the provider's retention window if a copy is lost.

---

## 4. Infrastructure & Hosting

### Deployment platforms

| Component | Platform | Why |
|---|---|---|
| **Backend API + async worker** | **Railway** (or Render) | You need an **always-on process** for the queue worker + reliable webhook endpoint + reconciliation poller. Railway's usage-based model is cheap at MVP and scales cleanly. Render is an equally good pick (Hobby $0 + compute; background workers first-class). |
| **Web / marketing site** (Astro or Next.js, optional) | **Netlify** (free tier) | Your platform of choice; great DX, free tier covers a marketing site, and it has an **official MCP server**. Can also host the **webhook receiver** via Background Functions (see note below). |
| **Database + Auth + Storage + Realtime** | **Supabase** | Managed; free tier covers MVP. |
| **Mobile app builds & submission** | **EAS (Expo Application Services)** | Cloud native builds + OTA updates + store submission. |
| **Queue / cache** | **Upstash** | Serverless, pay-per-use, free tier covers MVP. |
| **Audio egress at scale** | **Cloudflare R2** | Zero egress fees when bandwidth grows. |

- Railway: <https://docs.railway.com/> · Render: <https://render.com/docs> · Netlify: <https://docs.netlify.com/> · EAS: <https://docs.expo.dev/eas/> · Upstash: <https://upstash.com/docs>

> **Important — what Netlify does and does *not* replace.** Netlify (like Vercel) is a frontend + serverless-functions platform; **it has no always-on process.** So Netlify hosts the **web/marketing site** and can host **light serverless API endpoints + the inbound webhook receiver** — Netlify **Background Functions run up to 15 minutes** (Pro plan; sync functions time out at 10s, 26s on Pro), which is plenty to receive a callback, write to storage, and update the DB. But the **durable queue worker + reconciliation poller still need a long-lived process on Railway/Render** — that is the one job neither Netlify nor Vercel can do. Netlify Functions: <https://docs.netlify.com/build/functions/overview/> · Background Functions: <https://docs.netlify.com/build/functions/background-functions/>
>
> **Why not "just Supabase Edge Functions for everything?"** Same reason: they're great for the webhook receiver and light tasks, but a durable worker + poller wants a long-lived process. You can put the webhook handler on **either** Netlify Background Functions **or** Supabase Edge Functions — pick one; keep the worker on Railway/Render. — Edge Functions: <https://supabase.com/docs/guides/functions>

### CI/CD

- **GitHub + GitHub Actions.** Lint/typecheck/test on PR; run Supabase migrations against a preview branch; deploy backend to Railway and web to Netlify on merge to `main`. Netlify also auto-builds **deploy previews** per PR out of the box. — <https://docs.github.com/actions> · <https://docs.netlify.com/deploy/deploy-previews/>
- **EAS Build / EAS Update** for mobile: OTA JS updates without a store review for most changes; store submissions for native changes. — <https://docs.expo.dev/eas-update/introduction/>
- GitHub, Netlify, Railway, and Supabase all have MCP servers (§5), so much of this is drivable from Claude Code.

### Estimated monthly costs

**Hosting/infra only.** ⚠️ Your dominant variable cost is **generation-API COGS**, which is *usage*, not hosting — called out separately because it dwarfs hosting and is the real budget risk.

| Line item | MVP (<100 users) | ~1k users | ~10k users |
|---|---|---|---|
| Supabase | $0 (Free) | $25 (Pro) | $25 + usage (~$50–100) |
| Railway/Render backend + worker | $0–5 | ~$10–20 | ~$30–60 |
| Upstash (queue/cache) | $0 (Free) | $0–10 | ~$10–30 |
| Netlify (web/marketing) | $0 (Free) | $0–19 | $19 (Pro) |
| Storage/egress (Supabase → R2) | $0–2 | ~$5–15 | ~$20–50 (R2 keeps egress ~$0) |
| EAS (builds) | $0 (Free) or $19 (Production) | $19 | $19–99 |
| **Hosting subtotal** | **~$0–15/mo ✅ under $50** | **~$70–115/mo** | **~$150–350/mo** |
| **Generation API COGS** (the real cost) | a few $ (testing) | **$$$ usage-driven** | **$$$$ usage-driven** |

**COGS reality check** (from the [viability analysis](./viability-analysis.md)): ~$0.014–$0.111 per song, and users re-roll several times per keeper. 10k users generating even 10 songs/mo at 5 re-rolls ≈ 500k generations ≈ **$7k–$55k/mo** in API cost. **Metering, quotas, and paid tiers are not optional** — they're survival. Hosting stays under $50 at MVP; the business math is entirely about controlling generation spend and pricing above it.

**Mobile billing caveat:** In-app purchases on iOS/Android take a **15–30% platform cut**. Use **RevenueCat** to manage this. Web (Stripe) avoids the cut but you generally can't route mobile users to web checkout for digital goods. Factor the cut into pricing. — Stripe: <https://stripe.com/docs> · RevenueCat: <https://www.revenuecat.com/docs/>

---

## 5. MCP Server Availability

You asked to prioritize components with MCP servers for Claude Code. This stack is deliberately chosen so that **most of it is drivable from Claude Code via MCP**:

| Component | MCP server | What it enables in our workflow | Link |
|---|---|---|---|
| **Supabase** | ✅ **Official Claude connector** | Create/inspect tables, write & run migrations, query data, fetch project config, generate types — straight from Claude Code. Biggest DX win. | <https://supabase.com/docs/guides/getting-started/mcp> |
| **Netlify** | ✅ **Official** | Create sites, deploy, read build/runtime logs, manage env vars & deploy previews for the web app + functions — from Claude Code. | <https://docs.netlify.com/build/build-with-ai/agent-setup-guides/set-up-claude-code-for-netlify/> |
| **GitHub** | ✅ Official | Manage repos, PRs, issues, Actions runs — drive CI/CD and code review. | <https://github.com/github/github-mcp-server> |
| **Stripe** | ✅ Official | Create products/prices, inspect payments & subscriptions, test billing flows. | <https://docs.stripe.com/mcp> |
| **Upstash** | ✅ Official | Create/manage Redis + QStash resources, inspect the queue. | <https://upstash.com/docs/redis/integrations/mcp> |
| **Railway / Render** | ⚠️ Community / partial | Deployment & log access varies; verify current status before relying on it. | <https://docs.railway.com/> |
| **Cloudflare** | ✅ Official (multiple) | Manage R2 buckets, Workers, DNS if you use Cloudflare. | <https://developers.cloudflare.com/agents/model-context-protocol/> |

**What this enables:** Claude Code can scaffold the schema and migrations (Supabase MCP), wire up billing products (Stripe MCP), manage the queue (Upstash MCP), and drive deploys and PRs (Netlify + GitHub MCP) — a tight, mostly-conversational loop for a small team. **Verify each server's current auth model and scopes before granting access; MCP servers change fast and should be given least-privilege tokens (prefer read-only or a non-prod project where possible).**

---

## 6. Integration Map

### How the pieces connect

```
┌──────────────────────────────────────────────────────────────┐
│  Expo app (iOS / Android / Web)  — TanStack Query + Zustand   │
│   • Supabase Auth (JWT)   • expo-audio playback   • RevenueCat │
└───────────────┬───────────────────────────┬──────────────────┘
        tRPC    │                            │ direct (RLS-guarded)
                ▼                            ▼
┌───────────────────────────┐      ┌──────────────────────────┐
│  Node/Hono backend         │      │  Supabase                │
│  (Railway/Render)          │◄────►│  Postgres + Auth +       │
│   • tRPC routers           │ SQL  │  Storage + Realtime      │
│   • REST webhook handlers  │      └──────────────────────────┘
│   • queue worker + poller  │
└───┬───────────────┬────────┘
    │ enqueue       │ generate (server-side key)
    ▼               ▼
┌─────────┐   ┌─────────────────────────┐
│ Upstash │   │ Music generation provider│
│ Redis/  │   │ (reseller now; migrate to│
│ QStash  │   │ legit/licensed provider) │
└─────────┘   └───────────┬──────────────┘
                          │ webhook callback
                          ▼  → backend REST handler → store audio (Storage/R2)
                          │  → update generations row → Realtime → client
Billing: Stripe (web) + RevenueCat (mobile IAP) → webhooks → backend → credits_ledger
```

### Potential integration pain points (ranked)

1. **🔴 The generation provider itself** (from the viability analysis). It's an unofficial, unstable reseller. **Isolate it behind a `MusicProvider` interface** with one adapter per provider so you can swap resellers — or move to a legitimate/licensed provider (ElevenLabs Music, Stable Audio) — without touching the rest of the app. This is your single biggest risk; design for provider-swappability from commit #1.
2. **🔴 Async webhooks + mobile.** Phones can't receive webhooks and go to sleep. The backend must own job state; the client learns via **Supabase Realtime or polling**. Always run the **reconciliation poller** so a dropped webhook doesn't strand a paid job forever.
3. **🟠 Audio storage egress cost.** Serving MP3/WAV at scale racks up egress. Start on Supabase Storage; **plan the migration to Cloudflare R2 (zero egress) early** so it's not a fire drill later.
4. **🟠 Mobile IAP economics.** Apple/Google take 15–30% and require you to use their IAP for digital goods. **RevenueCat** normalizes this, but bake the cut into pricing and reconcile IAP receipts → your `credits_ledger` carefully (double-entitlement bugs = lost money).
5. **🟠 RLS correctness.** Because the mobile app hits Supabase directly, a missing/incorrect RLS policy = a data leak. Write policies with tests; default-deny.
6. **🟡 Serverless timeouts & cold starts.** Never do generation inside a request handler. Keep the worker warm (always-on Railway/Render service), not a cold-starting function.
7. **🟡 Type/version drift across tRPC, Supabase-generated types, and Zod.** Generate DB types in CI and treat a type mismatch as a failing build to keep the end-to-end type safety honest.
8. **🟡 Content moderation hook.** You need a moderation checkpoint on user lyrics/prompts *before* spending money on generation (blocks abuse and cuts wasted COGS). Wire it into the enqueue step.

---

## Summary — Recommended Stack at a Glance

| Layer | Choice | One-line justification |
|---|---|---|
| **Frontend** | Expo (React Native) + Expo Router, TS | One codebase → iOS/Android/Web; native audio + stores |
| **State** | TanStack Query + Zustand | Server-state-heavy app; minimal boilerplate |
| **Backend** | Node.js + Hono, TypeScript | Shared types, best SDK support, no ML need |
| **API** | tRPC (app) + REST (webhooks) | End-to-end type safety; REST only where callers require it |
| **Auth** | Supabase Auth (JWT + RLS) | Bundled with DB/storage; Apple/Google/email |
| **Database** | Supabase Postgres | Relational fit + Storage + Realtime + **official MCP** |
| **Queue/Cache** | Upstash Redis / QStash | Serverless async pipeline; MCP |
| **Audio storage** | Supabase Storage → Cloudflare R2 | Start simple; R2 kills egress cost at scale |
| **Hosting** | Railway/Render (backend+worker), Netlify (web + webhook fn), EAS (mobile) | Always-on worker for async jobs; free/cheap at MVP |
| **Billing** | Stripe (web) + RevenueCat (mobile IAP) | Handle the 15–30% store cut cleanly |
| **CI/CD** | GitHub Actions + EAS + Netlify/Railway deploys | MCP-drivable, standard |

**MVP hosting stays comfortably under your $50/month target (~$0–15).** The real financial risk is **generation-API COGS**, not hosting — meter it, quota it, and price above it. And architect the generation provider as a **swappable adapter**, because per the viability analysis, that dependency is the least stable part of the whole system.

*All pricing and MCP-availability details reflect research on 2026-07-15 and move fast — reverify against the linked official docs before committing.*
