---
name: changelog
description: Generate changelog entries from merged PRs/commits. Use when preparing a release or summarizing what shipped.
allowed-tools: Read, Edit, Write, Grep, Glob
---

# Release notes / changelog

Maintain `CHANGELOG.md` for Cadence.

## Steps
1. Collect merged PRs/commits since the last release.
2. Group into Added / Changed / Fixed / Security following Keep a Changelog.
3. Write user-facing entries (what changed, not internal detail); note breaking changes prominently.

## Rules
- No secrets or internal-only detail.
- Keep entries concise and user-oriented.

## Definition of done
A clear changelog section for the release range.

## Reference
- Keep a Changelog: https://keepachangelog.com/
