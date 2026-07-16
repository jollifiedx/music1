---
name: content-moderation
description: Screen briefs/lyrics for disallowed content (hate, explicit, real-artist voice cloning, third-party trademarks) before dispatch, logging flags and blocking with a specific reason. Use as the pre-generation gate. Protects COGS and legal exposure.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Pre-dispatch moderation

Screen content before spending money on generation. See `research/PRD.md` §3.6.

## Steps
1. Run at the **enqueue step**, before any credit hold or provider call.
2. Screen brief text + lyrics for: hate/explicit content, requests to clone a real recording artist's voice, and third-party trademarks/celebrity names. Include the workspace's `banned_terms`.
3. Use an LLM classifier (Anthropic) and/or a moderation API.
4. On block: return a specific reason (e.g., `content_blocked: references a real recording artist`), charge nothing, and log a `moderation_flags` row.
5. On pass: allow the pipeline to continue.

## Rules
- Moderation is mandatory and cannot be bypassed (enforced by `auth-security-agent`).
- Fail closed — if the classifier errors, block and surface a retry, don't silently pass.

## Definition of done
Every generation path is gated by moderation; blocks are specific, logged, and cost nothing.

## Reference
- Anthropic API: https://docs.anthropic.com/en/api/overview
