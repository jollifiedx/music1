---
name: api-docs
description: Generate API reference from tRPC/Zod (and OpenAPI for public REST) so teammates and integrators can consume endpoints. Use after adding or changing endpoints.
allowed-tools: Read, Edit, Write, Grep, Glob
---

# API reference generation

Document Cadence's API. See `research/PRD.md` §5.

## Steps
1. Derive reference from tRPC routers + Zod schemas; for public REST, emit OpenAPI (`trpc-to-openapi`).
2. Render with Scalar/Redoc or commit the OpenAPI spec.
3. Document auth per endpoint (JWT / signature / review token) and rate limits.

## Rules
- Generate from source of truth (schemas/routers) — don't hand-maintain drifting docs.
- Never include secret values or internal-only endpoints in public docs.

## Definition of done
Up-to-date reference covering endpoints, auth, and rate limits, generated from code.

## Reference
- trpc-to-openapi: https://github.com/mcampa/trpc-to-openapi
