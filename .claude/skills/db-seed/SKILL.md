---
name: db-seed
description: Create deterministic seed data (orgs, workspaces, members, sample songs) for local dev and tests. Use when setting up fixtures for development or test suites.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Seed dev/test fixtures

Generate reproducible seed data for Cadence. See `research/PRD.md` §4 for the entity model.

## Steps
1. Build fixtures top-down: organizations → members → workspaces → projects → briefs → songs → generations.
2. Cover multi-tenant scenarios (≥2 orgs) so RLS-isolation tests have cross-tenant data.
3. Use fixed IDs/seeds for determinism; faker for realistic text.
4. Wire into Supabase CLI seeding or a `pnpm seed` script.

## Rules
- Seeds are for dev/test only — never run against production.
- Keep at least one org with each role represented.

## Definition of done
A deterministic seed script producing a known dataset usable by `integration-tests` and `rls-isolation-tests`.

## Reference
- Supabase seeding: https://supabase.com/docs/guides/local-development/seeding-your-database
