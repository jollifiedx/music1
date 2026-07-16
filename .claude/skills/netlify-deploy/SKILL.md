---
name: netlify-deploy
description: Configure and deploy the web app plus webhook/serverless functions to Netlify, including deploy previews (uses Netlify MCP). Use for web deploys and function config.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Netlify web + functions deploy

Deploy Cadence's web layer. See `research/tech-stack.md` §4.

## Steps
1. Configure build + `netlify.toml`; set env vars per environment (Netlify env, not git).
2. Deploy the web app and the **webhook receiver** as a Netlify Background Function (up to 15 min) if used for provider callbacks.
3. Enable deploy previews per PR.

## Rules
- Netlify runs the web + webhook functions ONLY — the durable queue worker + poller run on Railway/Render (`worker-deploy`), never here.
- Production deploys require human approval.

## Definition of done
Web app + webhook function deploy with preview pipeline; worker correctly kept off Netlify.

## Reference
- Netlify: https://docs.netlify.com/ · Netlify MCP: https://docs.netlify.com/build/build-with-ai/agent-setup-guides/set-up-claude-code-for-netlify/
