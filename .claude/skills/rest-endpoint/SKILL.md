---
name: rest-endpoint
description: Scaffold a REST handler for callers that don't speak tRPC — webhooks and public review endpoints — with signature or token auth and schema validation. Use for inbound webhooks and public routes.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# REST endpoint scaffold

Create a REST handler for Cadence. See `research/PRD.md` §5.1.

## Steps
1. Define the route (Hono) and its auth mode: **signature verification** (webhooks) or **review token** (public review).
2. Validate the payload with Zod before any work.
3. Keep handlers thin; delegate to services (webhook completion, review decision).
4. Return correct status codes and minimal bodies.

## Rules
- Webhooks: verify signature + idempotency (`webhook-idempotency`) — never trust the payload alone.
- Public review: authenticate by token scope only (`review-link-tokens`); never expose other org data.

## Definition of done
Validated, correctly-authenticated handler wired into the app, with tests for auth-failure paths.

## Reference
- Hono routing: https://hono.dev/docs/api/routing
