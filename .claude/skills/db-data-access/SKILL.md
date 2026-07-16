---
name: db-data-access
description: Generate a typed repository/query layer (list/get/create/update, pagination) for an entity, respecting RLS and the PRD §4.3 indexing strategy. Use when the API needs to read or write a table.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Typed data-access layer

Build typed data-access functions for a Cadence entity. See `research/PRD.md` §4.

## Steps
1. Define the entity's Zod schema (share with `zod-schemas`).
2. Implement `list` (paginated, default 25 / max 100), `get`, `create`, `update`, `archive` as needed.
3. Use Drizzle ORM or `@supabase/supabase-js`; parameterized queries only — never string-concat SQL.
4. Rely on RLS for tenant scoping; still pass the caller's context so the session's JWT drives policies.
5. Use the indexes from PRD §4.3 in query shapes (filter/sort on indexed columns).

## Rules
- No unbounded queries — always paginate list endpoints.
- Return typed results; map DB `snake_case` to TS `camelCase` at the boundary.

## Definition of done
Repository module with typed CRUD, pagination, and no raw string SQL.

## Reference
- Drizzle ORM: https://orm.drizzle.team/ · supabase-js: https://supabase.com/docs/reference/javascript
