---
name: observability
description: Set up error tracking and key metrics/alerts (generation success rate, queue depth, credit anomalies) tied to the PRD metrics. Use when adding monitoring or alerting.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Monitoring & alerting

Add observability to Cadence. See `research/PRD.md` §8.

## Steps
1. Integrate Sentry for error tracking in web/api/worker (source maps, releases).
2. Emit metrics: generation success rate, generation latency, queue depth, re-roll ratio, credit balance anomalies.
3. Alerts: generation success rate < 95%, queue depth growing, unusual credit consumption per org.
4. Dashboard the PRD §8 north-star + guardrail metrics.

## Rules
- No secrets/PII in error payloads (scrub).
- Alert thresholds trace back to PRD §8 targets.

## Definition of done
Error tracking live + metric dashboards + alerts on the key PRD thresholds.

## Reference
- Sentry: https://docs.sentry.io/
