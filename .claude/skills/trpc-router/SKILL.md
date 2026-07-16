---
name: trpc-router
description: Scaffold a type-safe tRPC router and procedures for a resource, with Zod input/output and role guards. Use when adding backend endpoints for the app (the primary app-traffic pattern).
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# tRPC router scaffold

Create a tRPC router for a Cadence resource. See `research/PRD.md` §5.

## Steps
1. Define procedures (query/mutation) with Zod input + output schemas (share via `zod-schemas`).
2. Apply role guards with `rbac-middleware` (`requireRole`).
3. Delegate data access to the repository layer (`db-data-access`).
4. Register the router in the app router; ensure end-to-end types flow to the client.

## Rules
- App traffic uses tRPC; webhooks/public endpoints use REST (`rest-endpoint`).
- No business logic in the router — call repositories/services.
- Every mutation validates input and checks role.

## Definition of done
Typed router wired into the app router, role-guarded, with client types available.

## Reference
- tRPC: https://trpc.io/docs · Hono: https://hono.dev/
