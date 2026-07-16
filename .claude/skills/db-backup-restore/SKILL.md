---
name: db-backup-restore
description: Configure automated backups plus PITR and a documented, tested restore runbook. Use when setting up data durability or a recovery drill.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Backup & recovery

Set up backup and restore for Cadence's database. See `research/PRD.md` §4 backup strategy.

## Steps
1. Confirm Supabase automatic daily backups; enable Point-in-Time Recovery on paid tier.
2. Add a scheduled `pg_dump` to object storage (weekly) as a secondary copy.
3. Write a restore runbook and **test it** against a scratch project — restore is not "done" until a drill succeeds.
4. For audio assets, enable bucket versioning/lifecycle and store the provider's original URL so lost copies can be re-fetched within retention.

## Rules
- Never run restore against production without human approval.

## Definition of done
Backup schedule live, restore runbook written, and one successful restore drill recorded.

## Reference
- Supabase backups: https://supabase.com/docs/guides/platform/backups
