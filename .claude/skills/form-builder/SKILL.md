---
name: form-builder
description: Build validated forms (starting with the Creative Brief) using React Hook Form + Zod with schemas shared with the backend. Use when building any data-entry form.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Validated forms

Build forms for Cadence. See `research/PRD.md` §3.3 (Creative Brief).

## Steps
1. Use React Hook Form + `@hookform/resolvers` with the shared Zod schema (`zod-schemas`) — same schema as the backend.
2. Brief fields: purpose, brand/product, mood (multi-select), genre, tempo/energy, length, vocal vs instrumental, notes; optional lyrics or "AI-write lyrics".
3. Inline validation + accessible error messages; prevent empty/contradictory submits before spending credits.
4. On submit, call the typed mutation hook.

## Rules
- Client + server share one schema — no duplicated validation.
- Keyboard-accessible, labeled fields (WCAG 2.2 AA).

## Definition of done
Typed form with inline validation, shared schema, accessible errors, wired to the mutation.

## Reference
- React Hook Form: https://react-hook-form.com/ · Zod: https://zod.dev/
