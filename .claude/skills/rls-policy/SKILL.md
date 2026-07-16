---
name: rls-policy
description: Write and verify default-deny Row Level Security policies for a tenant table, keyed to organization_id and verified org membership. Use immediately after creating any tenant-scoped table. Correctness-critical — a gap is a cross-tenant data leak.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Write & verify RLS policies

Author RLS for a tenant table in Cadence. See `research/PRD.md` §6.2 and `.claude/CLAUDE.md` §2/§4.

## Steps
1. `ALTER TABLE <t> ENABLE ROW LEVEL SECURITY;` (default-deny — no policy means no access).
2. Add a helper predicate: the row's `organization_id` must be in the caller's active memberships (`organization_members` where `user_id = auth.uid()` and `status = 'active'`).
3. Write explicit policies per operation (SELECT / INSERT / UPDATE / DELETE), gating writes by role (`owner`/`admin`/`member`/`viewer`) as required by PRD §5.
4. State, in a comment, exactly which roles get which operation.
5. Put policies in a migration (co-owned with `db-migration`).

## Rules
- Default-deny always; never use `USING (true)`.
- Every policy must reference `organization_id` + membership — never trust a client-supplied org id.
- A table is NOT done until `rls-isolation-tests` proves org A cannot touch org B.

## Definition of done
Policies committed in a migration, per-role operation matrix documented, paired isolation test requested from `testing-agent`.

## Reference
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
