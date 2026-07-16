---
name: data-table
description: Build sortable, filterable, paginated table views for the workspace → project → song library. Use when displaying lists of records.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Paginated library views

Build library tables for Cadence. See `research/PRD.md` §3.8.

## Steps
1. Use TanStack Table with server-side pagination (default 25, max 100).
2. Support sort + filter (by status, workspace) mapped to indexed columns (PRD §4.3).
3. Row actions: rename, move, archive, tag; open a song's versions.
4. Fetch via typed hooks (`tanstack-query-hooks`).

## Rules
- Never fetch unbounded lists — always paginate.
- Accessible table semantics (headers, keyboard nav).

## Definition of done
Paginated, filterable, accessible library table wired to the API.

## Reference
- TanStack Table: https://tanstack.com/table/latest
