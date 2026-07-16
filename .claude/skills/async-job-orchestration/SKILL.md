---
name: async-job-orchestration
description: Wire the full async generation pipeline — validate, moderate, hold credits, enqueue, worker, provider, webhook, store, realtime, poller backstop. Use when building or changing the generation flow. The backbone skill.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Async generation pipeline

Compose the end-to-end generation flow for Cadence. See `research/PRD.md` §5.4 and `research/tech-stack.md` §0.

## The flow (POST /songs/:id/generate)
1. Validate role (`rbac-middleware`).
2. **Moderate** brief/lyrics (`content-moderation`).
3. **Hold credits** (`credit-ledger-ops`) — reject `402` if insufficient.
4. **Enqueue** (`job-queue`) — return `202` with `generationId`, status `queued`. Never block the request.
5. Worker calls the provider via `music-provider-adapter` with our callback URL; set `generating`.
6. Provider webhook (`generation-webhook`) stores audio, commits credits, sets `ready`.
7. Client learns via Supabase Realtime (`realtime-status`); polling fallback on `GET /generations/:id`.
8. `reconciliation-poller` resolves stragglers within 5 min.

## Rules
- Order is fixed: moderation and credit hold happen **before** dispatch.
- Every side effect is idempotent; never rely on webhooks alone.
- All provider access via the interface only.

## Definition of done
The pipeline works end-to-end across api + worker, is idempotent, and enforces moderation + credit controls before spending.

## Reference
- `research/tech-stack.md` §0 (async model)
