---
name: onboarding-readme
description: Maintain the README/runbook so a new developer can boot Cadence locally. Use when setup steps, env, or commands change.
allowed-tools: Read, Edit, Write, Grep, Glob
---

# Contributor onboarding

Keep Cadence's local-setup guide current.

## Steps
1. Document prerequisites, install, env setup (`.env.example`), Supabase local + migrations + seed, and how to run web + api + worker.
2. Cover running tests and the preview flow.
3. Tie into `/run-skill-generator` so `/run` and `/verify` know how to launch the app.

## Rules
- Link to PRD/tech-stack rather than duplicating them.
- Never include real secret values.

## Definition of done
A new dev can go from clone to running app + green tests by following the README.

## Reference
- `research/tech-stack.md`
