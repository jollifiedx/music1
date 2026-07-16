---
name: zod-schemas
description: Define single-source Zod schemas shared across frontend and backend for all inputs and DTOs. Use when defining or changing any data contract.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Shared validation schemas

Define shared schemas for Cadence in `packages/shared`. See `research/PRD.md` §4.4 & §6.2.

## Steps
1. Author Zod schemas for each entity/DTO (brief spec, generation request, member invite, etc.).
2. Import the same schema on both client (forms/hooks) and server (tRPC/REST validation).
3. Apply constraints from PRD §4.4 (e.g., `length_sec` 10–300, name lengths, enum values).
4. Derive TS types from schemas (`z.infer`).

## Rules
- One schema per contract — never duplicate validation logic across client/server.
- Length-cap and trim text; validate enums.

## Definition of done
Shared schemas consumed by both ends, with PRD validation rules encoded.

## Reference
- Zod: https://zod.dev/
