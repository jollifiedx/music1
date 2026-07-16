---
name: lyric-assist
description: Generate, regenerate, and edit lyrics from a brief, versioned in the lyrics table. Use when building the lyric-writing feature. Instrumental mode skips lyrics.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Lyric generation & editing

Implement lyric assist for Cadence. See `research/PRD.md` §3.4.

## Steps
1. Generate lyrics from the brief (via the Anthropic API or the provider's lyrics endpoint).
2. Support inline edit, section regeneration, and write-from-scratch.
3. Store each version as a `lyrics` row (`version`, `content`, `source` = ai/user/hybrid).
4. Record which lyric version a generation used.
5. Instrumental briefs skip this entirely.

## Rules
- Run generated/edited lyrics through `content-moderation` before they can be dispatched to generation.
- Use the latest Claude model for quality (see `.claude/CLAUDE.md`).

## Definition of done
Generate/edit/version lyrics with moderation gating; instrumental mode bypasses cleanly.

## Reference
- Anthropic API: https://docs.anthropic.com/en/api/overview
