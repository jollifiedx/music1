---
name: a11y-audit
description: Run automated plus manual WCAG 2.2 AA checks, especially on the audio player and forms. Use before shipping UI and as a component self-check.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Accessibility audit

Validate accessibility for Cadence. See `research/PRD.md` §6.3.

## Steps
1. Run axe-core (`@axe-core/playwright`) across key pages/components.
2. Manually verify: keyboard-only operation, visible focus, contrast, and screen-reader announcements (aria-live on the player status).
3. Confirm touch targets ≥44px and mobile review page usability.

## Rules
- Target WCAG 2.2 AA. Audio-conveyed status must have a text/ARIA alternative.

## Definition of done
axe report clean (or documented exceptions) and manual checks passed on player + forms.

## Reference
- WCAG 2.2: https://www.w3.org/TR/WCAG22/ · axe-core: https://github.com/dequelabs/axe-core
