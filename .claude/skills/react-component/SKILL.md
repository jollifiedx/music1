---
name: react-component
description: Scaffold an accessible, responsive React component matching the design system. Use when building any UI component for the web app.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# React component scaffold

Build a UI component for Cadence's web-first app. See `research/PRD.md` §6.3–6.4 and UX principles in `.claude/CLAUDE.md` §7.

## Steps
1. Create `PascalCase.tsx` with typed props and explicit loading/empty/error states.
2. Style with Tailwind / shadcn-ui; responsive from 360px up.
3. Accessibility: keyboard-operable, visible focus, ARIA where needed, sufficient contrast (WCAG 2.2 AA).
4. Consume server data via TanStack Query hooks (`tanstack-query-hooks`); UI state via Zustand.

## Rules
- Never call the provider or hold secrets client-side; fetch assets via signed URLs.
- Keep components focused; extract shared UI.

## Definition of done
Typed, responsive, accessible component with all states handled and a self-check passing (`a11y-audit`).

## Reference
- React: https://react.dev/ · shadcn/ui: https://ui.shadcn.com/
