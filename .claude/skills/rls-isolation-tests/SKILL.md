---
name: rls-isolation-tests
description: Prove that a user in org A can never read or write org B data, for every tenant table. Use after any RLS policy change or new tenant table. Ship-blocking security test.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Cross-tenant isolation tests

Verify tenant isolation for Cadence. See `research/PRD.md` §6.2.

## Steps
1. Seed ≥2 orgs (`db-seed`) with distinct users/roles.
2. Using org A's JWT, attempt to SELECT/INSERT/UPDATE/DELETE org B rows on **every** tenant table — assert all denied.
3. Assert default-deny (no policy → no access) and that allowed operations work within the caller's own org per role.
4. Include the public review path: a token exposes only its scoped assets.

## Rules
- This suite is **ship-blocking** — a failure blocks merge.
- Run against real RLS with real JWTs, not a mocked client.

## Definition of done
Every tenant table proven isolated across orgs and roles; suite green and wired into CI.

## Reference
- Supabase RLS testing: https://supabase.com/docs/guides/database/postgres/row-level-security#testing-policies
