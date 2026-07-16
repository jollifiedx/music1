---
name: adr
description: Capture significant architecture decisions as ADRs (context, decision, alternatives, consequences). Use when a notable technical decision is made or changed.
allowed-tools: Read, Edit, Write, Grep, Glob
---

# Architecture Decision Records

Record decisions for Cadence in `docs/adr/`.

## Steps
1. Create `docs/adr/NNN-title.md` with: Context, Decision, Alternatives considered, Consequences, Status.
2. Write one ADR per significant decision (e.g., MusicProvider abstraction, shared-schema+RLS tenancy, async pipeline, provider migration).
3. Link back to the relevant PRD/tech-stack sections.

## Rules
- ADRs are append-only history — supersede rather than rewrite; mark old ones "Superseded by NNN".
- Keep each ADR focused on one decision.

## Definition of done
A dated ADR capturing the decision and its rationale, linked from `research/` where relevant.

## Reference
- ADR: https://adr.github.io/
