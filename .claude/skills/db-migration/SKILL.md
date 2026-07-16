---
name: db-migration
description: Author and apply a versioned SQL migration (tables, enums, constraints, indexes) via the Supabase CLI, following PRD §4 conventions. Use when adding or changing any table or index.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Author & apply a schema migration

Create a versioned migration for Cadence's Postgres schema. See `research/PRD.md` §4 for the schema and `.claude/CLAUDE.md` §2 for conventions.

## Steps
1. Create the migration: `supabase migration new <name>`.
2. Write SQL: `snake_case` names; `id uuid primary key default gen_random_uuid()`; `created_at timestamptz not null default now()`; `updated_at` trigger-maintained.
3. Every tenant table MUST carry `organization_id` with a FK and `ON DELETE CASCADE` from `organizations` downward.
4. Add enums as Postgres enum types or `CHECK` constraints per PRD §4.4.
5. Add indexes from PRD §4.3 (tenant `organization_id`, listing indexes, partial index on active generations).
6. Apply against a **non-production** branch/preview DB only; refresh generated types (see `db-types-gen`).

## Rules
- Never hand-edit a production schema — all changes go through committed migrations reviewed in PRs.
- Any new tenant table requires RLS — hand off to `auth-security-agent` (skill `rls-policy`).

## Definition of done
Migration file in `supabase/migrations/`, applies cleanly on a fresh DB, types regenerated, RLS handoff noted.

## Reference
- Supabase migrations: https://supabase.com/docs/guides/deployment/database-migrations
