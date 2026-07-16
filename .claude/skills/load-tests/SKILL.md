---
name: load-tests
description: Simulate concurrent generations to validate queue caps, rate limits, and COGS controls. Use before scaling or when changing the queue/rate-limit config.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Concurrency & rate-limit validation

Load-test Cadence's generation path. See `research/PRD.md` §5.5 & §6.1.

## Steps
1. Script concurrent generate requests (k6/Artillery) at target RPS/concurrency.
2. Assert per-org concurrency cap and per-user rate limits hold (`429` when exceeded).
3. Verify no credit is charged for rejected/failed requests and no double-processing occurs.
4. Record latency (p90/p95) against PRD §6.1 targets.

## Rules
- Point at a sandbox/stubbed provider — never generate real paid songs at load.

## Definition of done
Report showing limits hold, no over-charging, and latency within targets.

## Reference
- k6: https://k6.io/docs/
