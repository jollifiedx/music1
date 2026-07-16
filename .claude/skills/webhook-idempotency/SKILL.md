---
name: webhook-idempotency
description: Implement idempotency-key handling via webhook_events so provider/Stripe retries never double-charge or double-store. Use in every webhook handler. Money-sensitive.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Webhook idempotency

Make webhooks safe against retries for Cadence.

## Steps
1. Extract a stable event id from the provider/Stripe payload.
2. Insert into `webhook_events` (unique on `provider` + `event_id`) inside the processing transaction.
3. If the insert conflicts (already seen), short-circuit and return 200 without re-running side effects.
4. Only perform side effects (store audio, commit credits, grant credits) on first receipt.

## Rules
- Idempotency check and side effects share one transaction to avoid partial double-processing.
- Applies to both `generation-webhook` and `stripe-billing` webhooks.

## Definition of done
Duplicate events are provably no-ops; covered by an idempotency test.

## Reference
- Stripe idempotency: https://stripe.com/docs/api/idempotent_requests
