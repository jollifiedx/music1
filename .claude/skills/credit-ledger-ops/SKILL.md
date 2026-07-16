---
name: credit-ledger-ops
description: Implement the transactional credit hold to commit/refund flow against the append-only credit_ledger. Use for any generation charge or top-up. Money-sensitive — enforce balance in a single DB transaction; no UPDATE/DELETE on the ledger.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Append-only credit accounting

Implement credit operations for Cadence. See `research/PRD.md` §3.11 & §4.2.

## Model
`credit_ledger` is append-only: each row has `delta` (+grant/topup, −consumption), `reason`, optional `generation_id`, and `balance_after`. Balance is derived transactionally, never stored mutably.

## Operations
1. **Check + hold** (before dispatch): in one transaction, read current balance; if `balance < cost`, reject with `insufficient_credits`; otherwise record a hold.
2. **Commit** (on generation success): finalize the debit (insert consumption row, `balance_after` computed in the txn).
3. **Refund / release** (on failure): reverse the hold with a `refund` row. Failed generations must NOT consume credits.

## Rules
- All balance changes happen inside a single serializable/row-locked transaction to avoid races.
- Never UPDATE or DELETE ledger rows. Never let usage exceed the hold.
- Grants come from `stripe-billing` (subscription grant / topup).

## Definition of done
Hold/commit/refund functions, race-safe, with unit tests (via `unit-tests`) covering insufficient-balance and concurrent debits.

## Reference
- Postgres transactions: https://www.postgresql.org/docs/current/tutorial-transactions.html
