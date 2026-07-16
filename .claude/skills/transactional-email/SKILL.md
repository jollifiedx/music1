---
name: transactional-email
description: Send transactional email (invites, approval notifications, receipts) via a transactional email provider. Use when an action needs to notify a user by email.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Transactional email

Send outbound email for Cadence.

## Steps
1. Integrate a transactional provider (Resend or Postmark) with a server-side API key.
2. Build typed templates: member invite, track-approval notification, billing receipt.
3. Expose a `sendEmail(template, to, data)` helper with delivery/error handling and retries.

## Rules
- Server-side only; never expose the email API key.
- No secrets or signed URLs with long TTLs embedded in emails beyond what's needed.

## Definition of done
Reliable `sendEmail` helper with the core templates, used by `org-invite-flow` and approval flows.

## Reference
- Resend: https://resend.com/docs · Postmark: https://postmarkapp.com/developer
