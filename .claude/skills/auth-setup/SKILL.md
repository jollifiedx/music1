---
name: auth-setup
description: Wire Supabase Auth flows (email/password, magic link, Google/Apple OAuth), issue/verify JWTs, and provision profiles on signup. Use when setting up authentication or adding an auth provider.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Supabase Auth flows

Set up authentication for Cadence. See `research/PRD.md` §5.1 and §2.

## Steps
1. Enable providers: email/password, magic link, Google, Apple. (Apple sign-in is required by App Store rules if any social login is offered — include it.)
2. Configure redirect URLs per environment.
3. On first login, provision a `profiles` row (1:1 with `auth.users`).
4. Server verifies the Supabase JWT on every request; derive `user_id` and resolve org membership.

## Rules
- Never expose the service-role key to the client — anon key client-side, service-role server-side only.
- Auth issues the JWT that drives RLS; pair with `rbac-middleware` for role checks.

## Definition of done
Working sign-up/sign-in for all providers, profile bootstrap, server-side JWT verification.

## Reference
- Supabase Auth: https://supabase.com/docs/guides/auth
