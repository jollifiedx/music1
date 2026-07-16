---
name: structured-logging
description: Set up structured, tenant-tagged logging across api and worker with request/job correlation ids and secret redaction. Use when adding logging or debugging production behavior.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Structured logging

Add logging to Cadence. See `research/PRD.md` §6.2.

## Steps
1. Use pino for JSON logs in api + worker.
2. Attach correlation ids: request id (api) and job id / generation id (worker) so a generation can be traced end-to-end.
3. Tag logs with `organization_id` for tenant-scoped debugging.
4. Redact secrets and PII at the logger level.

## Rules
- Never log secrets, tokens, or full lyrics/PII.
- Structured (JSON) logs only — no ad-hoc console noise in production.

## Definition of done
Correlated, tenant-tagged, redacted structured logs across api + worker.

## Reference
- pino: https://getpino.io/
