---
name: env-secrets
description: Define and wire required environment variables across environments, keeping secrets server-side. Use when adding a service or setting up a new environment.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Environment & secrets management

Manage env/secrets for Cadence. Names are listed in `.claude/CLAUDE.md` §6.

## Steps
1. Maintain `.env.example` with all required **names** (no values): Supabase, music provider, Upstash/QStash, Stripe, R2, Anthropic, app/api URLs.
2. Put real values in each platform's secret manager (Netlify, Railway/Render, GitHub Actions) — never in git.
3. Keep server-only secrets (service-role, provider, Stripe) out of any client bundle; only public keys (Supabase anon, Stripe publishable) reach the client.

## Rules
- Never commit a real secret. Never expose a server key client-side.

## Definition of done
`.env.example` complete, secrets configured per environment, no secrets in git or client bundles.

## Reference
- Netlify env: https://docs.netlify.com/environment-variables/overview/
