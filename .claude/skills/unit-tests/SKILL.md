---
name: unit-tests
description: Write Vitest unit tests for pure logic — credit math, adapter mapping, role guards, schema validation. Use after implementing any non-trivial pure function.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Unit test generation

Write unit tests for Cadence logic.

## Steps
1. Target pure logic: credit hold/commit/refund, provider request/response mapping, role comparisons, Zod refinements.
2. Cover happy path + edge cases (insufficient credits, concurrent debit, malformed provider payload, boundary lengths).
3. Use Vitest; keep tests fast and deterministic (no network).

## Rules
- Test behavior, not implementation detail.
- Never weaken an assertion to pass — fix the code.

## Definition of done
Meaningful unit tests with edge cases, green and deterministic.

## Reference
- Vitest: https://vitest.dev/
