---
name: storage-assets
description: Store generated audio/cover art in Supabase Storage (or R2 at scale) and serve via signed, expiring URLs. Use when persisting or delivering generated assets. Never expose raw provider URLs.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Asset storage + signed delivery

Handle generated assets for Cadence. See `research/PRD.md` §3.7 & §6.2.

## Steps
1. On completion, download the provider audio and upload to a private bucket (Supabase Storage; migrate hot audio to Cloudflare R2 for zero-egress at scale).
2. Insert an `assets` row (`kind`, `storage_path`, `duration_sec`, `bytes`, `organization_id`).
3. Serve downloads/playback via **signed, expiring URLs** generated server-side and permission-checked.

## Rules
- Buckets are private — no public listing.
- Never hand the client a raw provider URL; always a signed URL to our stored copy.
- Store the provider's original URL in `generations` for re-fetch within retention.

## Definition of done
Assets stored privately, signed-URL delivery works, R2 migration path documented.

## Reference
- Supabase Storage: https://supabase.com/docs/guides/storage · Cloudflare R2: https://developers.cloudflare.com/r2/
