---
name: audit-log
description: Append audit entries (actor, action, target) for sensitive operations like member/role changes, billing, and deletions. Use when implementing sensitive mutations.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Tenant audit trail

Record sensitive actions for Cadence. See `research/PRD.md` §4.2.

## Steps
1. On sensitive operations (role change, member remove, billing change, workspace/project delete, credit adjustment), insert an `audit_log` row: `organization_id`, actor, action, target, metadata (jsonb), timestamp.
2. Provide a scoped query for admins/owners to review their org's trail.

## Rules
- Audit entries are append-only.
- Tenant-scoped via RLS; never expose cross-org history.
- No secrets in metadata.

## Definition of done
Sensitive operations write audit entries; admins can review their org's trail.

## Reference
- `research/PRD.md` §4.2
