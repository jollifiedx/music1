---
name: usage-reporting
description: Build per-workspace credit/usage reporting with CSV export. Use when implementing the usage dashboard (PRD §3.12, P1).
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Usage reporting & export

Build usage reporting for Cadence. See `research/PRD.md` §3.12.

## Steps
1. Aggregate `credit_ledger` consumption by workspace/project/date range.
2. Render report views (reuse `data-table`) and a CSV export.
3. Restrict to `admin`/`owner` roles.

## Rules
- Read from the ledger (source of truth); never recompute balances ad hoc.
- Tenant-scoped via RLS.

## Definition of done
Per-workspace usage report + CSV export, role-restricted and tenant-isolated.

## Reference
- `research/PRD.md` §3.12
