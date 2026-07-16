---
name: generation-webhook
description: Build the signature-verified, idempotent REST handler that receives the provider's completion callback, stores audio, commits credits, and marks the generation ready. Use when wiring provider callbacks. Correctness-critical.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Generation webhook handler

Receive provider completion callbacks for Cadence. See `research/PRD.md` §5.4.

## Steps
1. Expose `POST /webhooks/generation` (Hono / Netlify Background Function).
2. **Verify the provider signature** using `MUSIC_PROVIDER_WEBHOOK_SECRET` — reject unsigned/invalid.
3. **Idempotency:** dedupe via `webhook_events` (unique on provider + event id). If already processed, return 200 without side effects (skill `webhook-idempotency`).
4. Map payload via the `MusicProvider` adapter.
5. Download audio → store via `storage-assets` → insert `assets` rows.
6. **Commit credits** (skill `credit-ledger-ops`) and set `generations.status = 'ready'`.
7. Trigger realtime (Supabase Realtime) so the client updates.

## Rules
- All work must be idempotent — providers retry.
- On mapping/download failure, mark `failed` and release the credit hold.
- Never expose raw provider URLs to clients.

## Definition of done
Signed, idempotent handler that stores audio, commits credits, flips status, and notifies the client; covered by idempotency tests.

## Reference
- Suno callbacks: https://docs.sunoapi.org/suno-api/generate-music-callbacks · Netlify Background Functions: https://docs.netlify.com/build/functions/background-functions/
