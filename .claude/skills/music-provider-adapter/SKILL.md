---
name: music-provider-adapter
description: Define the provider-agnostic MusicProvider interface and implement a concrete adapter (Suno reseller now, ElevenLabs/Stable Audio later). Use for any generation-provider integration. The #1 risk-mitigation skill — never call a provider outside this abstraction.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# MusicProvider interface + adapter

Isolate the unstable generation provider behind one interface. See `.claude/CLAUDE.md` §2 and `research/tech-stack.md`.

## Interface (in packages/shared/providers)
Define `MusicProvider` with methods: `generate(brief, lyrics, opts)`, `getDetails(jobId)`, and as needed `extend`, `generateLyrics`, `separateStems`. All return typed results; requests/responses validated with Zod.

## Adapter steps
1. Implement one adapter per provider (start: Suno reseller, `docs.sunoapi.org`).
2. Map our neutral request → provider payload; map provider response/webhook → our neutral shape.
3. Provider API key read server-side from env (`MUSIC_PROVIDER_API_KEY`); base URL from env.
4. Pass our callback URL for async completion (see `generation-webhook`).

## Rules
- NEVER call a provider directly from app/client code — always through the interface.
- Keep adapters swappable: no provider-specific types leak past the interface.
- Design so a second provider can be added for fallback (see `async-job-orchestration`).

## Definition of done
Interface + working reseller adapter with typed mapping, env-based auth, and a documented path to add ElevenLabs/Stable Audio.

## Reference
- sunoapi.org: https://docs.sunoapi.org · ElevenLabs: https://elevenlabs.io/docs · Stable Audio: https://stability.ai/stable-audio
