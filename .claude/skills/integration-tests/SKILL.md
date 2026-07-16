---
name: integration-tests
description: Test tRPC/REST endpoints against a test DB, including role enforcement and webhook idempotency. Use after adding or changing an endpoint.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# API integration tests

Test Cadence endpoints against a seeded local DB. See `research/PRD.md` §5.

## Steps
1. Spin up Supabase local + seed data (`db-seed`).
2. Exercise each endpoint: happy path, role-denied (`403`), insufficient credits (`402`), moderation block (`422`).
3. For webhooks: send the same event twice and assert idempotency (no double-charge/double-store).
4. Use the tRPC test caller / HTTP client with distinct user JWTs.

## Rules
- Include auth-failure and money-path cases, not just happy paths.
- Reset DB state between tests.

## Definition of done
Integration suite covering success + auth + credit + idempotency paths, green against local DB.

## Reference
- Supabase local dev: https://supabase.com/docs/guides/local-development
