---
name: public-review-page
description: Build the login-free, mobile-friendly review page where clients play, comment, and approve/request-changes via a review token. Use when building the external client approval experience.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Public review & approval page

Build the client review page for Cadence. See `research/PRD.md` §3.9.

## Steps
1. Route `/review/:token` authenticates via the review token (+ password if set), NOT a login (`review-link-tokens`).
2. Show only the scoped tracks; embed the `audio-player`.
3. Let the reviewer comment and Approve / Request-changes; post via `POST /review/:token/decision`.
4. Reflect the decision back into the agency's in-app view.

## Rules
- Frictionless: no account, works well on phones (this is where the "aha" happens).
- Expose only scoped assets; audio via signed URLs; rate-limit the public routes.

## Definition of done
Mobile-friendly, login-free review page with play + comment + approve, strictly scoped to its token.

## Reference
- `research/PRD.md` §3.9
