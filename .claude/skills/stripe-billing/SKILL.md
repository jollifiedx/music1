---
name: stripe-billing
description: Implement org-level Stripe subscriptions (seat + monthly credit grant), top-up checkout, and signature-verified webhooks that sync subscription state and grant credits. Use for any billing or credit-purchase work.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Stripe billing & credit sync

Implement B2B billing for Cadence. See `research/PRD.md` §3.11.

## Steps
1. Model plans as Stripe products/prices (seat tier + monthly credit grant); create Checkout sessions for subscribe and credit top-ups.
2. Handle `POST /webhooks/stripe` with **signature verification** (`STRIPE_WEBHOOK_SECRET`) and idempotency (skill `webhook-idempotency`).
3. On subscription events, sync the `subscriptions` row; on grant/topup, add a `credit_ledger` grant (skill `credit-ledger-ops`).
4. Expose current plan + credit balance to the app.

## Rules
- Never change credit *pricing* without human approval.
- Server-side keys only; verify every webhook.
- Grants flow through the ledger — never mutate a balance directly.

## Definition of done
Subscribe + top-up flows work, subscription state syncs from webhooks, credits granted via ledger, all idempotent.

## Reference
- Stripe subscriptions: https://stripe.com/docs/billing/subscriptions/overview · Webhooks: https://stripe.com/docs/webhooks
