---
name: tanstack-query-hooks
description: Generate typed TanStack Query hooks (caching, retries, status polling) over tRPC endpoints. Use when the frontend needs to read or mutate server data.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Typed data hooks

Build query/mutation hooks for Cadence. See `research/PRD.md` state approach and `research/tech-stack.md`.

## Steps
1. Use `@trpc/react-query` to expose typed hooks per procedure.
2. Set sensible cache keys, stale times, and retry policy.
3. For long-running work (generation), integrate with `realtime-status` rather than aggressive polling.
4. Handle loading/error states so components can render them.

## Rules
- Server state lives in TanStack Query, not Zustand.
- Keep cache keys consistent so mutations invalidate the right queries.

## Definition of done
Typed hooks with caching + invalidation used by the UI components.

## Reference
- TanStack Query: https://tanstack.com/query/latest · tRPC + React Query: https://trpc.io/docs/client/react
