---
name: ci-cd-pipeline
description: Set up the GitHub Actions pipeline — lint/typecheck/test, run migrations on a preview branch, deploy web + worker on merge. Use when creating or changing CI/CD.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# CI/CD pipeline

Build Cadence's pipeline. See `research/PRD.md` §4 CI/CD.

## Steps
1. On PR: install, lint, typecheck, run unit + integration + **rls-isolation** tests; apply migrations to a preview branch DB.
2. On merge to `main`: deploy web to Netlify and worker to Railway/Render.
3. Store secrets in GitHub Actions secrets; never in the repo.
4. Gate deploys on green tests.

## Rules
- `rls-isolation-tests` failing blocks merge.
- Production deploy steps require human approval (manual gate or environment protection).

## Definition of done
`.github/workflows/*` running test-on-PR and deploy-on-merge with a production approval gate.

## Reference
- GitHub Actions: https://docs.github.com/actions
