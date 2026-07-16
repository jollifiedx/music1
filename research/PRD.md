# Product Requirements Document — "Cadence"

**Working product name:** Cadence (AI branded-music platform for agencies & SMBs)
**Date:** 2026-07-15
**Version:** 1.0 (MVP definition)
**Companion docs:** [viability-analysis.md](./viability-analysis.md) · [tech-stack.md](./tech-stack.md)
**Status:** Approved for MVP build

---

## Reading guide (for a developer new to this project)

This document defines an MVP for a **B2B, multi-tenant web application** that lets marketing agencies and small businesses create custom, on-brand songs and jingles using AI music generation. If you read only three things, read: §1 (what/why/who), §3 (features + priorities), and §4 (schema). The single most important architectural constraint is that **music generation is asynchronous** (20–60s, delivered by webhook) — see §5.4 and the [tech stack doc §0](./tech-stack.md). The generation provider must be treated as a **swappable adapter**, per the viability analysis.

### Assumptions locked for this PRD
- **Vertical:** Branded music/jingles for SMBs & agencies (chosen 2026-07-15).
- **Tenancy model:** `Organization` (agency or SMB) → `Workspaces` (one per client, or one for a solo SMB) → `Projects` (campaigns) → `Songs`.
- **Client:** Web-first responsive app (React). Native mobile is out of scope for MVP.
- **Billing:** Stripe only (B2B, seat + credit model). No mobile IAP / RevenueCat in MVP — that was a consumer-app concern that no longer applies.
- **Generation provider:** Abstracted behind a `MusicProvider` interface; MVP uses a third-party Suno reseller with a legitimate provider (ElevenLabs Music / Stable Audio) as the planned migration target.

---

## 1. Executive Summary

### What we're building
**Cadence is a multi-tenant web platform that lets marketing agencies and small businesses produce custom, on-brand songs and jingles in minutes instead of weeks.** A user writes a short creative brief (purpose, brand tone, genre, mood, optional lyrics), Cadence assists with lyric writing, generates full studio-quality tracks via AI, and provides a review-and-approval workflow so the agency and its client can iterate, approve, and download commercial-ready audio — all organized by client workspace and metered against a shared credit pool.

### Primary value proposition
> **"Custom brand music in minutes, not a $3,000 studio invoice and a three-week turnaround."**
Cadence collapses the traditional jingle/ad-music production pipeline (brief → composer → studio → revisions → licensing) into a single self-serve workflow, with the organizational structure agencies actually need: separate client workspaces, brand consistency, team roles, client review links, and per-client usage reporting.

### Target user persona (psychographic)

**Primary: "Maya, the Agency Creative Lead"** — runs content/creative at a 5–30 person digital marketing agency.
- **Motivations:** Ship more creative per retainer without growing headcount; look innovative to clients; protect margin. She's measured on client retention and output volume.
- **Fears:** Delivering something that sounds cheap/generic and embarrasses the agency; legal exposure over music rights; getting locked into a tool her team won't adopt; a client hearing "AI slop."
- **Goals:** Turn a client brief into 3–4 usable, on-brand audio options *today*; keep every client's assets cleanly separated; get client sign-off without endless email threads.
- **Behavior:** Juggles 6–12 clients simultaneously. Lives in a browser with 20 tabs. Will abandon any tool that takes more than one session to produce something usable.

**Secondary: "Devin, the SMB Owner/Marketer"** — owns a gym, café, or e-commerce brand; does his own marketing.
- **Motivations:** A memorable audio hook for Reels/TikTok/radio spots without hiring anyone.
- **Fears:** Wasting money; sounding amateur; copyright trouble.
- **Goals:** One good jingle he can use everywhere, fast, cheap, and legally safe to use commercially.

---

## 2. User Avatar Deep Dive

### Who exactly is this for?
Agencies (creative/content/social) and marketing-active SMBs who need **short-form branded audio** — jingles, ad beds, social-video music, podcast intros, in-store loops. Not for professional musicians producing albums (that's the crowded Suno/Udio consumer space we deliberately avoid — see viability analysis).

### Their current painful workflow (what we're replacing)
1. Client asks for "some music for the campaign."
2. Agency either (a) hires a freelance composer ($500–$5,000, 1–3 weeks, revision friction), (b) buys a stock-music license (generic, non-exclusive, everyone's heard it), or (c) risks using unlicensed music (legal exposure).
3. Revisions happen over email/Slack with audio attachments — no version history, no structured approval.
4. Files scattered across Drive folders; no per-client organization; rights documentation is ad hoc.
5. Repeat for every client, every campaign.

**Total pain:** slow, expensive, legally murky, disorganized, and doesn't scale with the agency's client count.

### What success looks like for them
- Brief → 3–4 on-brand track options in **under 10 minutes**.
- Client approves via a **single shareable link** — no logins, no email threads.
- Every asset auto-organized under the right client workspace with clear commercial-use documentation.
- Predictable monthly cost that's a fraction of freelance/studio spend.

### What would make them tell a colleague?
- **"I made a genuinely good jingle for a client in one sitting."** (The output quality clears the "not embarrassing" bar.)
- **"The client approved it from a link in five minutes."** (The approval workflow removes their #1 daily friction.)
- **"Everything's organized per client and I know it's safe to use commercially."** (Trust + organization.)
The virality trigger is **time-to-first-usable-asset** combined with **the client-approval moment** — both are emotional wins worth sharing.

---

## 3. Feature Specification

Priority key: **P0** = MVP-critical (cannot launch without) · **P1** = important (fast-follow) · **P2** = nice-to-have (v2 candidate).

### 3.1 Organizations, Teams & Multi-Tenancy — **P0**
**User story:** *As an agency owner, I want to create an organization and invite my team, so that we can collaborate with each person having appropriate access.*
- **Acceptance criteria:**
  - User can create an Organization on signup; becomes `owner`.
  - Owner/admin can invite members by email with a role (`owner`, `admin`, `member`, `viewer`).
  - Invitations expire after 7 days; accepting links the user to the org.
  - Every data object (workspace, project, song) is scoped to exactly one organization; no cross-org data is ever visible (enforced by RLS — see §4, §6).
  - Removing a member immediately revokes access.
- **Technical notes:** Supabase Auth + `organization_members` join table + Postgres RLS keyed on `organization_id`. See §4.

### 3.2 Client Workspaces — **P0**
**User story:** *As an agency creative, I want a separate workspace per client, so that each client's brand, assets, and history stay cleanly isolated.*
- **Acceptance criteria:**
  - Users can create/rename/archive workspaces within their org.
  - A workspace holds its own projects, brand settings, and library.
  - Library and reporting can be filtered to a single workspace.
  - An SMB org can operate with a single default workspace (the model must not force the agency structure on them).
- **Technical notes:** `workspaces` table with `organization_id` FK. MVP scopes access at org level; per-workspace member restrictions are **P1**.

### 3.3 Creative Brief Builder — **P0**
**User story:** *As a marketer, I want to describe what I need through a guided brief, so that I get a relevant track without knowing music terminology.*
- **Acceptance criteria:**
  - Structured form: purpose (jingle / ad bed / social / intro / in-store), brand/product name, desired mood (multi-select), genre, tempo/energy, length target, vocal vs instrumental, and free-text notes.
  - Optional: paste existing lyrics OR request AI-written lyrics.
  - Brief is saved and reusable; each generation records the brief snapshot used.
  - Validation prevents empty/contradictory briefs before spending credits.
- **Technical notes:** `briefs` table; brief JSON is snapshotted onto each `generation` for reproducibility.

### 3.4 Lyric Assist — **P0**
**User story:** *As a non-writer, I want the app to draft and let me edit lyrics, so that I'm not staring at a blank page.*
- **Acceptance criteria:**
  - Generate lyrics from the brief; user can edit inline, regenerate sections, or write from scratch.
  - Lyric versions are stored; the version used for a generation is recorded.
  - Instrumental mode skips lyrics entirely.
- **Technical notes:** Uses the provider's lyrics endpoint and/or an LLM. Store as `lyrics` rows linked to a song.

### 3.5 Song Generation (async) — **P0**
**User story:** *As a user, I want to generate full tracks from my brief, so that I get finished audio options to choose from.*
- **Acceptance criteria:**
  - "Generate" enqueues a job and returns immediately with a pending state; UI never blocks.
  - Each generation produces the provider's default number of variations; user sees them as selectable versions.
  - Generation status transitions: `queued → generating → ready | failed`; failures are retryable and do **not** silently consume credits (credits are committed on success, held on queue).
  - A reconciliation poller resolves any generation the webhook missed within 5 minutes.
  - Credits are checked/held **before** dispatch; insufficient credits blocks with a clear message.
- **Technical notes:** Queue (Upstash) → worker (Railway/Render) → `MusicProvider` adapter → provider webhook → store audio (Supabase Storage/R2) → update `generations` → Supabase Realtime notifies client. Idempotency via `webhook_events`. See §5.4.

### 3.6 Content Moderation Checkpoint — **P0**
**User story:** *As the platform, I want to screen briefs/lyrics before generating, so that we block abuse and don't waste money on disallowed content.*
- **Acceptance criteria:**
  - Lyrics/prompts are screened (hate, explicit, real-artist voice cloning, third-party trademarks/celebrity names) **before** dispatch.
  - Blocked content returns a specific reason; nothing is charged.
  - Flags are logged for review.
- **Technical notes:** Moderation runs at the enqueue step; store outcomes in `moderation_flags`. Non-optional — protects both COGS and legal exposure.

### 3.7 Playback, Versions & Download — **P0**
**User story:** *As a user, I want to play, compare, and download generated tracks, so that I can pick and deliver the best one.*
- **Acceptance criteria:**
  - In-browser player with play/pause/seek; compare variations side by side.
  - Download MP3 (P0) and WAV (P1) for `ready` tracks.
  - Downloads are permission-checked and logged.
- **Technical notes:** Signed URLs from storage; never expose raw provider URLs to the client.

### 3.8 Project Library & Organization — **P0**
**User story:** *As an agency creative, I want all tracks organized by workspace and project, so that I can find any client's assets instantly.*
- **Acceptance criteria:**
  - Hierarchy: Workspace → Project → Songs → Versions.
  - Rename, move, archive, and tag songs; filter by status and workspace.
- **Technical notes:** Standard relational nav; pagination on library queries.

### 3.9 Client Review & Approval Links — **P1**
**User story:** *As an agency, I want to send my client a link to review and approve a track without an account, so that sign-off is fast.*
- **Acceptance criteria:**
  - Generate a shareable, tokenized, optionally password/expiry-protected link to one or more tracks.
  - External reviewer can play, comment, and Approve/Request-changes without logging in.
  - Agency sees approval status and comments in-app.
- **Technical notes:** `review_links` (opaque token, scope, expiry) + `comments`. Public read path bypasses normal auth but is strictly scoped to the linked tracks.

### 3.10 Brand Kits — **P1**
**User story:** *As an agency, I want to save a client's brand preferences, so that every track for that client is consistent without re-entering settings.*
- **Acceptance criteria:** Per-workspace brand kit (default genre/mood/energy, do/don't notes, banned terms) auto-applied to new briefs. **Technical notes:** `brand_kits` table linked to workspace.

### 3.11 Billing, Credits & Usage Metering — **P0**
**User story:** *As an org owner, I want to subscribe and manage a credit pool, so that my team can generate within a predictable budget.*
- **Acceptance criteria:**
  - Stripe subscription at org level (seat tier + monthly credit allotment); credit top-up purchases.
  - Every generation debits the org credit ledger; balance visible in real time.
  - Hard stop when credits are exhausted (with upsell); usage never silently exceeds the plan.
  - Invoices/receipts accessible; Stripe webhooks reconcile subscription state.
- **Technical notes:** `subscriptions`, `credit_ledger` (append-only), Stripe webhooks → REST handler. Because COGS is the real cost driver (viability analysis §), metering is a first-class feature, not an afterthought.

### 3.12 Usage & Reporting Dashboard — **P1**
**User story:** *As an org owner, I want per-workspace usage reporting, so that I can bill clients or manage budget.* Acceptance: credits used by workspace/project/date range, exportable CSV. **P2:** per-client cost allocation.

### 3.13 Stems / Vocal Separation — **P1**
**User story:** *As a producer, I want separated vocal/instrumental stems, so that I can remix or fit the track to video.* Uses provider's stem/separation endpoint.

### 3.14 Cover Art Generation — **P2**
Auto-generate cover art for a track (image model). Nice-to-have for social delivery.

### 3.15 Music Video Generation — **P2**
Provider supports video; deferred to v2.

### 3.16 Provider Fallback (multi-provider) — **P1**
**User story:** *As the platform, I want to fail over to an alternate generation provider, so that an outage on one reseller doesn't take us down.* Implemented via the `MusicProvider` interface with health checks and routing.

### 3.17 Public API for Customers — **P2**
Expose Cadence's own API so larger agencies can integrate. v2.

---

## 4. Database Schema

**Engine:** Supabase PostgreSQL. **Multi-tenancy strategy:** *shared database, shared schema, row-level isolation* — every tenant-owned row carries `organization_id`, and **Row Level Security (RLS) policies enforce isolation** (see §6). This is the standard, cost-effective multi-tenant model for this scale; schema-per-tenant is unnecessary and operationally heavy for an MVP.

**Conventions:** all tables use `id uuid primary key default gen_random_uuid()`, `created_at timestamptz not null default now()`, `updated_at timestamptz` (trigger-maintained). All monetary/credit values are integers (credits) or minor currency units. Soft-delete via `archived_at timestamptz null` where noted.

### 4.1 Core entities & relationships

```
auth.users (Supabase) 1─1 profiles
organizations 1─* organization_members *─1 profiles
organizations 1─* workspaces 1─* projects 1─* songs 1─* generations
workspaces 1─* brand_kits
songs 1─* lyrics
generations 1─* assets            (audio, stems, cover art)
organizations 1─* credit_ledger
organizations 1─1 subscriptions
songs/generations 1─* review_links 1─* comments
organizations 1─* moderation_flags
(idempotency) webhook_events
organizations 1─* audit_log
```

### 4.2 Table definitions

**`profiles`** (1:1 with `auth.users`)
| Field | Type | Notes |
|---|---|---|
| id | uuid PK = auth.users.id | |
| email | text | unique, not null |
| full_name | text | |
| avatar_url | text | |
| created_at | timestamptz | |

**`organizations`** — the tenant root
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | text | not null, 2–100 chars |
| slug | text | unique, url-safe |
| type | text | enum: `agency` \| `smb` |
| plan | text | enum: `free`,`starter`,`pro`,`scale` |
| stripe_customer_id | text | nullable, unique |
| created_by | uuid → profiles.id | |
| archived_at | timestamptz | nullable |

**`organization_members`** — user↔org with role
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| organization_id | uuid → organizations.id | not null, ON DELETE CASCADE |
| user_id | uuid → profiles.id | not null |
| role | text | enum: `owner`,`admin`,`member`,`viewer` |
| invited_email | text | for pending invites |
| status | text | enum: `active`,`invited`,`revoked` |
| invite_token | uuid | nullable; expires 7 days |
| | | **UNIQUE(organization_id, user_id)** |

**`workspaces`** — one per client (or default for SMB)
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| organization_id | uuid → organizations.id | not null, indexed |
| name | text | not null |
| client_name | text | the end client this represents |
| archived_at | timestamptz | nullable |

**`brand_kits`** — reusable brand defaults (P1)
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| organization_id | uuid | denormalized for RLS |
| workspace_id | uuid → workspaces.id | not null |
| default_genre | text | |
| default_mood | text[] | |
| energy | int | 1–5 |
| banned_terms | text[] | feeds moderation |
| notes | text | do/don't guidance |

**`projects`** — a campaign
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| organization_id | uuid | denormalized for RLS |
| workspace_id | uuid → workspaces.id | not null, indexed |
| name | text | not null |
| status | text | enum: `active`,`archived` |
| created_by | uuid → profiles.id | |

**`briefs`** — the structured request
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| organization_id | uuid | RLS |
| project_id | uuid → projects.id | not null |
| purpose | text | enum: `jingle`,`ad_bed`,`social`,`intro`,`in_store` |
| spec | jsonb | mood[], genre, tempo, length_sec, vocal bool, notes |
| created_by | uuid | |

**`songs`** — a logical song within a project
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| organization_id | uuid | RLS |
| project_id | uuid → projects.id | not null, indexed |
| brief_id | uuid → briefs.id | nullable |
| title | text | |
| status | text | enum: `draft`,`generating`,`ready`,`approved`,`archived` |
| tags | text[] | |
| created_by | uuid | |

**`lyrics`** — versioned lyrics for a song
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| organization_id | uuid | RLS |
| song_id | uuid → songs.id | not null |
| version | int | increments per song |
| content | text | |
| source | text | enum: `ai`,`user`,`hybrid` |

**`generations`** — one provider job (the money-sensitive table)
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| organization_id | uuid | RLS, indexed |
| song_id | uuid → songs.id | not null, indexed |
| brief_snapshot | jsonb | reproducibility |
| lyrics_snapshot | text | |
| provider | text | e.g. `suno_reseller_x`,`elevenlabs` |
| provider_job_id | text | indexed; for reconciliation |
| status | text | enum: `queued`,`generating`,`ready`,`failed` |
| credits_cost | int | committed on success |
| error | text | nullable |
| requested_by | uuid | |
| completed_at | timestamptz | |
| | | **INDEX(provider, provider_job_id)** |

**`assets`** — files produced by a generation
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| organization_id | uuid | RLS |
| generation_id | uuid → generations.id | not null |
| kind | text | enum: `audio_mp3`,`audio_wav`,`stem`,`cover_art` |
| storage_path | text | Supabase Storage / R2 key |
| duration_sec | numeric | |
| bytes | bigint | |

**`credit_ledger`** — append-only credit accounting
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| organization_id | uuid → organizations.id | not null, indexed |
| delta | int | + purchase/grant, − consumption |
| reason | text | enum: `subscription_grant`,`topup`,`generation`,`refund`,`adjustment` |
| generation_id | uuid | nullable, links consumption |
| balance_after | int | running balance (maintained in txn) |
| created_at | timestamptz | |

**`subscriptions`** — org billing state (mirrors Stripe)
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| organization_id | uuid | unique |
| stripe_subscription_id | text | unique |
| plan | text | |
| seats | int | |
| monthly_credit_grant | int | |
| status | text | enum: `active`,`past_due`,`canceled`,`trialing` |
| current_period_end | timestamptz | |

**`review_links`** (P1) — external client approval
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| organization_id | uuid | RLS |
| token | text | unique, unguessable |
| scope | jsonb | song/generation ids exposed |
| password_hash | text | nullable |
| expires_at | timestamptz | nullable |
| status | text | enum: `active`,`revoked` |

**`comments`** (P1) — feedback on a track
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| organization_id | uuid | RLS |
| song_id | uuid → songs.id | |
| review_link_id | uuid | nullable (external commenter) |
| author_id | uuid | nullable |
| author_name | text | for external |
| body | text | |
| decision | text | enum: `approve`,`request_changes`,`none` |

**`moderation_flags`**, **`webhook_events`** (idempotency: `provider`, `event_id` unique), **`audit_log`** (org_id, actor, action, target, metadata jsonb) — standard supporting tables, all carry `organization_id` except `webhook_events`.

### 4.3 Indexing strategy (common queries)
- **Tenant scoping (every query):** index `organization_id` on all tenant tables; most RLS-filtered queries start here.
- **Library listing:** `INDEX(project_id, created_at DESC)` on `songs`; `INDEX(workspace_id)` on `projects`.
- **Generation status polling & reconciliation:** `INDEX(status)` on `generations` (partial: `WHERE status IN ('queued','generating')`), plus `INDEX(provider, provider_job_id)`.
- **Credit balance:** `INDEX(organization_id, created_at DESC)` on `credit_ledger`.
- **Membership checks (hot path for RLS):** `INDEX(user_id)` and `UNIQUE(organization_id, user_id)` on `organization_members`.
- **Review links:** `UNIQUE(token)`.

### 4.4 Data validation rules
- `organizations.name`: 2–100 chars; `slug` matches `^[a-z0-9-]+$`.
- `organization_members.role` and all `status`/enum fields enforced via Postgres `CHECK` constraints or enum types.
- `briefs.spec.length_sec`: 10–300.
- `generations.credits_cost` ≥ 0; a generation cannot move to `ready` without a corresponding negative `credit_ledger` row (enforced in the completion transaction).
- `credit_ledger` is **append-only** (no UPDATE/DELETE grant); balance derived transactionally.
- Foreign keys `ON DELETE CASCADE` from `organizations` downward so tenant deletion is clean.
- All user-writable text fields length-capped and trimmed server-side.

---

## 5. API Specification

**Style:** Internal app traffic uses **tRPC** (type-safe, per [tech-stack.md](./tech-stack.md)); documented below as logical REST resources for clarity. **Inbound webhooks and public/external endpoints are plain REST.** Base URL: `https://api.cadence.app/v1`.

### 5.1 Auth model
- All app endpoints require a **Supabase-issued JWT** (`Authorization: Bearer <jwt>`). The server derives `user_id` and resolves org membership + role per request; RLS enforces tenant isolation at the DB layer as defense-in-depth.
- **Roles:** `viewer` (read), `member` (create/generate), `admin` (manage workspaces/members), `owner` (billing + delete org).
- **Public review endpoints** authenticate via the `review_links.token` (+ optional password), not a JWT.
- **Webhook endpoints** authenticate via provider/Stripe **signature verification**, not JWT.

### 5.2 Endpoint catalog

| Method & path | Purpose | Min role | Notes |
|---|---|---|---|
| `POST /auth/callback` | Supabase auth session exchange | public | |
| `POST /orgs` | Create organization | authenticated | creator becomes owner |
| `GET /orgs/:id` | Org details | viewer | |
| `POST /orgs/:id/members` | Invite member | admin | sends invite email |
| `PATCH /orgs/:id/members/:mid` | Change role / revoke | admin | |
| `POST /invites/accept` | Accept invite | authenticated | token in body |
| `GET/POST /workspaces` | List/create workspaces | member/admin | org-scoped |
| `PATCH /workspaces/:id` | Rename/archive | admin | |
| `GET/POST /projects` | List/create projects | member | workspace-scoped |
| `POST /briefs` | Create/save brief | member | |
| `POST /lyrics/generate` | AI-draft lyrics | member | moderated; async or sync |
| `POST /songs` | Create song shell | member | |
| `POST /songs/:id/generate` | **Enqueue generation** | member | credit check + moderation; returns `generationId`, status `queued` |
| `GET /generations/:id` | Poll generation status | viewer | backup to realtime |
| `GET /songs/:id` | Song + versions + assets | viewer | |
| `GET /assets/:id/download` | Signed download URL | viewer | permission-checked, logged |
| `GET /projects/:id/library` | Paginated library | viewer | filter/sort |
| `POST /review-links` | Create share/approval link | member | P1 |
| `GET /review/:token` | Public review view | public (token) | P1 |
| `POST /review/:token/decision` | External approve/comment | public (token) | P1 |
| `GET /billing/subscription` | Current plan + credits | admin | |
| `POST /billing/checkout` | Start Stripe checkout/top-up | owner | |
| `GET /billing/usage` | Usage/credit reporting | admin | CSV export P1 |
| `POST /webhooks/generation` | **Provider callback** | signature | idempotent via `webhook_events` |
| `POST /webhooks/stripe` | Stripe events | signature | subscription/credit sync |

### 5.3 Representative request/response

**`POST /songs/:id/generate`**
```jsonc
// Request
{ "briefId": "uuid", "lyricsVersion": 3, "variations": 2, "model": "v5" }
// 202 Accepted
{ "generationId": "uuid", "status": "queued", "creditsHeld": 20, "creditBalance": 480 }
// 402 if insufficient credits
{ "error": "insufficient_credits", "required": 20, "balance": 5 }
// 422 if moderation blocks
{ "error": "content_blocked", "reason": "references a real recording artist" }
```

**`GET /generations/:id`**
```jsonc
{ "id": "uuid", "status": "ready",
  "assets": [{ "id": "uuid", "kind": "audio_mp3", "durationSec": 62 }],
  "creditsCost": 20, "completedAt": "2026-07-15T18:22:04Z" }
```

### 5.4 Async generation flow (the critical path)
1. `POST /songs/:id/generate` → validate role → **moderate** brief/lyrics → **check + hold credits** → enqueue (Upstash) → return `202` with `generationId`.
2. Worker (always-on Railway/Render) pops job → calls `MusicProvider.generate()` with our callback URL → sets `generating`.
3. Provider → `POST /webhooks/generation` → **verify signature** → dedupe via `webhook_events` → download audio → store to Supabase Storage/R2 → write `assets` → **commit credit debit** → set `ready`.
4. Supabase Realtime pushes the status change to the client; `GET /generations/:id` is the polling fallback.
5. **Reconciliation poller** (cron in worker) scans `generations WHERE status IN ('queued','generating') AND age > 5m`, queries the provider's get-details endpoint, and resolves stragglers. Never rely on webhooks alone.

### 5.5 Rate limiting
- **Global per-user:** 100 req/min (matches modest provider limits; see viability analysis).
- **Generation endpoint:** per-org concurrency cap (e.g., 5 in-flight) + burst limit, enforced in the queue — protects against runaway spend and provider throttling.
- **Public review endpoints:** per-IP + per-token limits to prevent enumeration/scraping.
- **Webhooks:** no rate limit but strict signature verification + idempotency.
- Implemented with Upstash rate-limit primitives; return `429` with `Retry-After`.

---

## 6. Non-Functional Requirements

### 6.1 Performance
- App API p95 latency **< 300 ms** (excludes generation, which is inherently async).
- Generation end-to-end (enqueue → `ready`) target **< 90 s** p90; UI shows progress and never blocks.
- Library/list endpoints paginated (default 25, max 100); no unbounded queries.
- Realtime status update to client **< 2 s** after webhook processing.
- Availability target **99.5%** for the app; graceful degradation if a generation provider is down (queue + fail over, per §3.16).

### 6.2 Security
- **Tenant isolation via RLS on every tenant table** — the non-negotiable core control; every policy keyed to `organization_id` and verified `organization_members` membership. Penetration-test cross-tenant access before launch.
- Provider/Stripe API keys server-side only; never shipped to the client. Secrets in platform secret managers, not code.
- All webhook handlers verify signatures and are idempotent.
- Signed, expiring URLs for all audio/asset access; no public bucket listing.
- Passwords/tokens hashed (review-link passwords, invite tokens random & single-purpose).
- PII minimized; encryption in transit (TLS) and at rest (Supabase default). GDPR/CCPA: support org data export + deletion.
- Follow OWASP Top 10; input validation server-side; rate limiting (§5.5) against abuse.
- Content moderation (§3.6) as a safety + legal control. Clear ToS: no voice-cloning real artists, no third-party trademarks; honest disclosure that fully-AI output has limited copyright protection (viability analysis §2).

### 6.3 Accessibility
- **WCAG 2.2 AA** target: keyboard-navigable, visible focus, sufficient contrast, ARIA on the audio player and interactive controls, captions/text alternatives where audio conveys status.
- Player controls operable without a mouse; status changes announced to screen readers (aria-live).

### 6.4 Responsive web (no native mobile in MVP)
- Fully responsive from **360 px → desktop**; primary use is desktop/laptop (agency workflow), but review links must work well on phones (clients open them on mobile).
- Touch-friendly targets ≥ 44 px; audio playback verified on iOS Safari + Android Chrome.

---

## 7. Out of Scope (MVP)

**Explicitly NOT building for MVP:**
- Native iOS/Android apps (web-responsive only).
- Music **video** generation (§3.15) and **cover art** (§3.14) — P2.
- Public/customer-facing **API** (§3.17).
- White-label / embeddable player for end-client sites.
- Distribution integrations (Spotify/Apple/DSP delivery, ad-platform export).
- Advanced DAW-style editing, multitrack mixing, manual stem editing.
- In-app real-time collaborative editing (comments/approval only in MVP).
- Marketplace/templates, referral program, affiliate system.
- SSO/SAML, SCIM provisioning (enterprise identity).
- Per-workspace granular member permissions (org-level roles only in MVP; granular is P1).
- Non-English lyric generation quality guarantees.

**v2 considerations:** licensed/first-party generation provider migration (reduce the supply-chain risk from the viability analysis), public API, video + cover art, DSP distribution, SSO/SAML, white-label, per-client cost allocation & invoicing, template library.

---

## 8. Success Metrics

### 8.1 North-star & guardrail
- **North star:** **# of approved tracks per active org per month** (captures real value delivered, not vanity generations).
- **Guardrail:** **gross margin per org** — generations are COGS (viability analysis §); metering must keep revenue > API spend.

### 8.2 Funnel & activation
- **Activation:** % of new orgs that produce their **first `ready` track within 24h** of signup. Target **> 60%**.
- **Aha moment:** first track **approved via a review link** — track time-to-first-approval.

### 8.3 Quality & reliability
- **Generation success rate** (`ready` / attempted) **> 95%**.
- **Re-roll ratio** (generations per approved track) — watch as the leading COGS driver; target **< 4**.
- Webhook reconciliation catches **100%** of stranded jobs within 5 min.

### 8.4 Business
- **Free → paid conversion** of orgs; **Net Revenue Retention (NRR)** for paying orgs; **credit utilization** vs plan.

### 8.5 Targets

| Metric | Launch week | Month 1 | Month 3 |
|---|---|---|---|
| Orgs signed up | 25 | 150 | 600 |
| Activated orgs (first track <24h) | 55% | 60% | 65% |
| Paying orgs | 3 | 20 | 90 |
| Approved tracks / active org / mo | 2 | 3 | 5 |
| Generation success rate | ≥ 92% | ≥ 95% | ≥ 96% |
| Re-roll ratio (↓ better) | ≤ 5 | ≤ 4 | ≤ 3.5 |
| Gross margin per paying org | ≥ 40% | ≥ 55% | ≥ 65% |
| Logo/monthly churn (↓) | — | ≤ 8% | ≤ 5% |

*Targets are planning hypotheses for a new B2B product, to be recalibrated after real launch data. All provider-cost and market details reflect research on 2026-07-15 — reverify against the linked docs before committing engineering resources.*

---

## Appendix A — Traceability to prior analysis
- **Provider risk → `MusicProvider` adapter (§3.16, §5.4)** directly mitigates the viability analysis's #1 risk (unstable reseller).
- **Metering/credits as P0 (§3.11) + margin guardrail (§8)** answer the COGS-dominates-hosting finding.
- **Moderation checkpoint (§3.6)** addresses the legal/rights exposure and wasted-COGS risks.
- **Multi-tenant RLS (§4, §6.2)** implements the tech-stack security model.
- **Web-first + Stripe-only** reflects the B2B pivot away from the consumer/mobile-IAP framing.
