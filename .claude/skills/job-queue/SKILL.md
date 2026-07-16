---
name: job-queue
description: Set up the Upstash-backed job queue for generation jobs plus per-user/per-org rate limits and concurrency caps. Use when wiring async job dispatch or rate limiting. Protects against runaway COGS.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Queue + rate limiting

Set up the async job queue for Cadence. See `research/PRD.md` §5.4–5.5.

## Steps
1. Define the generation job payload shape (Zod).
2. Use Upstash QStash (or Redis) to `enqueue()` jobs; the worker consumes them.
3. Rate limits (`@upstash/ratelimit`): global per-user (~100 req/min), and a **per-org concurrency cap** (e.g., 5 in-flight generations) + burst limit on the generate endpoint.
4. Return `429` with `Retry-After` when limited.

## Rules
- The concurrency cap is a cost-control — enforce it before dispatch.
- Keep enqueue fast; never block the request on generation.

## Definition of done
Enqueue + consume works; rate/concurrency limits enforced and tested under load (`load-tests`).

## Reference
- Upstash QStash: https://upstash.com/docs/qstash · Ratelimit: https://upstash.com/docs/redis/sdks/ratelimit-ts/overview
