---
name: e2e-tests
description: Write Playwright end-to-end tests for critical flows — brief → generate → ready → approve via review link — including mobile viewport. Use to validate whole user journeys.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Browser end-to-end tests

Write e2e flows for Cadence. See `research/PRD.md` §3 & §8.

## Steps
1. Cover the core journey: sign in → create workspace/project → fill brief → generate → wait for ready (mock or sandbox provider) → open review link → approve.
2. Run at desktop and mobile viewports (review link must work on phones).
3. Assert realtime status transitions and that downloads use signed URLs.

## Rules
- Stub the generation provider deterministically so tests aren't flaky or costly.
- Keep the critical path green as a release gate; pairs with `/verify`.

## Definition of done
Playwright suite covering the brief-to-approval path on desktop + mobile.

## Reference
- Playwright: https://playwright.dev/
