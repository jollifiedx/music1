---
name: realtime-status
description: Build a client hook subscribing to Supabase Realtime for generation status changes (generating → ready), with a polling fallback. Use when the UI needs live generation updates.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Live generation status

Build the realtime status subscriber for Cadence. See `research/PRD.md` §5.4.

## Steps
1. Create `useGenerationStatus(generationId)` subscribing to `generations` row changes via Supabase Realtime.
2. Reflect transitions `queued → generating → ready | failed` in the UI within ~2s.
3. Polling fallback: if realtime drops, poll `GET /generations/:id` on an interval.
4. Integrate with TanStack Query cache so lists stay consistent.

## Rules
- Never assume the webhook fired — always have the polling fallback.
- Clean up subscriptions on unmount.

## Definition of done
Hook reflects status live with a working fallback and cache integration.

## Reference
- Supabase Realtime: https://supabase.com/docs/guides/realtime
