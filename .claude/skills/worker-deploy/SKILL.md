---
name: worker-deploy
description: Deploy the always-on queue worker and reconciliation poller as a long-lived Railway/Render service. Use when deploying or scaling the background worker. This is the piece Netlify/Vercel cannot run.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Always-on worker deploy

Deploy Cadence's worker. See `research/tech-stack.md` §4.

## Steps
1. Package `apps/worker` (queue consumer + reconciliation poller) as a long-lived service on Railway or Render.
2. Set env vars/secrets in the platform secret manager.
3. Add a health check; configure restart + basic autoscaling.
4. Ensure the worker consumes the Upstash queue and runs the poller cron.

## Rules
- The worker MUST be always-on — never deploy it to serverless/edge.
- Production deploys require human approval.

## Definition of done
Worker running with health check, consuming the queue and running the poller, secrets managed.

## Reference
- Railway: https://docs.railway.com/ · Render workers: https://render.com/docs/background-workers
