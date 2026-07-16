---
name: rbac-middleware
description: Build middleware/procedure guards that resolve org membership and enforce owner/admin/member/viewer roles per endpoint. Use when adding role-based access checks to tRPC/REST endpoints.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Role-based access enforcement

Implement RBAC guards for Cadence as defense-in-depth above RLS. See `research/PRD.md` §5.1–5.2.

## Steps
1. Build a `requireRole(minRole)` tRPC middleware that: verifies the JWT, resolves the caller's `organization_members` row for the target org, and rejects if role < required.
2. Role order: `viewer` < `member` < `admin` < `owner`.
3. Apply per-procedure: reads = viewer; create/generate = member; manage workspaces/members = admin; billing/delete-org = owner.
4. Return `403` with a clear reason on failure.

## Rules
- RBAC is defense-in-depth — it does NOT replace RLS. Both must be present.
- Never trust a client-supplied role or org id; always resolve server-side.

## Definition of done
Reusable role guard wired into routers, with tests covering each role boundary.

## Reference
- tRPC middleware: https://trpc.io/docs/server/middlewares
