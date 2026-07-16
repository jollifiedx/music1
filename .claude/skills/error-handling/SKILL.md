---
name: error-handling
description: Establish a consistent error taxonomy and API error responses plus React error boundaries. Use when standardizing error handling or adding a new failure path.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Consistent error model

Standardize errors for Cadence. See `research/PRD.md` §5.3.

## Steps
1. Define an error taxonomy (validation, auth, insufficient_credits, content_blocked, provider_error, not_found, rate_limited).
2. Map to consistent API responses with stable codes (e.g., `402 insufficient_credits`, `422 content_blocked`) via a tRPC error formatter.
3. Add React error boundaries + friendly fallback UI; surface actionable messages.
4. Distinguish user-fixable (show message) from system errors (log + generic message).

## Rules
- Never leak stack traces or secrets to clients.
- Error shapes are part of the API contract — don't change them casually.

## Definition of done
Uniform server error responses + client boundaries, matching PRD §5.3 examples.

## Reference
- tRPC error handling: https://trpc.io/docs/server/error-handling
