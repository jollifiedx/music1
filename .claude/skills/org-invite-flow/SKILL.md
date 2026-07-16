---
name: org-invite-flow
description: Implement org member invitations — generate single-use expiring tokens, send invite emails, and an accept-and-link flow. Use when building team management / member invites.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Member invitations

Build the invite flow for Cadence. See `research/PRD.md` §3.1.

## Steps
1. Admin/owner invites by email with a role; create an `organization_members` row with `status='invited'`, `invited_email`, and a random `invite_token` (7-day expiry).
2. Send the invite email (skill `transactional-email`).
3. Accept endpoint: validate token + expiry, link the accepting user's `user_id`, set `status='active'`, clear the token.
4. Revoking a member sets `status='revoked'` and immediately removes access.

## Rules
- Tokens are single-use and expire in 7 days.
- Only `admin`/`owner` can invite or change roles (enforce via `rbac-middleware`).

## Definition of done
Invite → email → accept → active membership works end-to-end; expired/reused tokens are rejected.

## Reference
- Supabase auth admin: https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail
