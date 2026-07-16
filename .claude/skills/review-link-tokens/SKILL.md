---
name: review-link-tokens
description: Mint unguessable, optionally password/expiry-protected tokens that grant scoped read plus comment/approve access to specific tracks without login. Use when building shareable client review/approval links. Security-sensitive.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Tokenized public access

Implement review-link tokens for Cadence. See `research/PRD.md` §3.9 & §5.1.

## Steps
1. Create a `review_links` row with a cryptographically random `token`, a `scope` (the exact song/generation ids exposed), optional `password_hash` (argon2/bcrypt), and optional `expires_at`.
2. Public route authenticates via the token (+ password if set) — NOT a JWT — and exposes only the scoped assets.
3. Allow play + comment + approve/request-changes without an account.
4. Support revoke (`status='revoked'`).

## Rules
- Tokens must be unguessable (≥128 bits of entropy) and strictly scoped — never expose other org data.
- Rate-limit + guard against enumeration (skill `rate-limiting` / per-IP + per-token limits).
- Serve audio via signed URLs only.

## Definition of done
Scoped, expiring, optionally password-protected links that never leak beyond their scope; revoke works; covered by tests.

## Reference
- OWASP crypto storage: https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html
