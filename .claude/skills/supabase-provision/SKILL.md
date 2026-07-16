---
name: supabase-provision
description: Create and configure a Supabase project, storage buckets, auth providers, and environments (uses Supabase MCP). Use when standing up or configuring a Supabase environment.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Provision Supabase project

Provision Supabase for Cadence. See `research/tech-stack.md` §4.

## Steps
1. Create/configure the project (dev/staging first) via Supabase MCP or CLI.
2. Enable auth providers (email, magic link, Google, Apple) with redirect URLs.
3. Create a **private** audio bucket + any others; set lifecycle/versioning.
4. Link the local CLI (`supabase link`) so migrations target this project.
5. Record connection details as env var names in `.claude/CLAUDE.md` §6 (values in secret manager).

## Rules
- Provision non-production freely; production requires human approval.
- Never commit keys — env vars only.

## Definition of done
Configured project with auth + private buckets, CLI linked, env names documented.

## Reference
- Supabase MCP: https://supabase.com/docs/guides/getting-started/mcp
