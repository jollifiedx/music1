---
name: reconciliation-poller
description: Build the scheduled worker job that finds stale queued/generating generations and reconciles them via the provider get-details endpoint within 5 minutes. Use to make the async pipeline resilient to missed webhooks. Never rely on webhooks alone.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Missed-webhook backstop

Add the reconciliation poller to Cadence's worker. See `research/PRD.md` §3.5 & §5.4.

## Steps
1. In `apps/worker`, run a cron job (e.g., every 1–2 min).
2. Query `generations WHERE status IN ('queued','generating') AND age > 5m`.
3. For each, call the provider's get-details endpoint via the `MusicProvider` adapter.
4. If complete → run the same completion path as `generation-webhook` (store audio, commit credits, mark ready). If failed → mark failed + release hold. If still pending → leave.

## Rules
- Reuse the webhook's idempotent completion logic — do not duplicate side effects.
- This runs on the always-on host (Railway/Render), never serverless.

## Definition of done
Poller resolves 100% of stranded jobs within 5 minutes, reusing idempotent completion.

## Reference
- Suno get-details: https://docs.sunoapi.org/suno-api/get-music-generation-details
