---
name: audio-player
description: Build an accessible audio player with play/pause/seek and side-by-side variation compare. Use when building playback UI. Keyboard-operable with aria-live status; verify on iOS Safari + Android Chrome.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Accessible audio player

Build the player for Cadence. See `research/PRD.md` §3.7 & §6.3.

## Steps
1. Play/pause/seek over the HTML `<audio>` / Web Audio API; optional waveform via wavesurfer.js.
2. Support comparing generated variations side by side (select/switch without reload).
3. Load audio from backend **signed URLs** only.
4. Accessibility: full keyboard control, visible focus, `aria-live` announcing status ("generating", "ready", "playing").

## Rules
- Verify playback on iOS Safari and Android Chrome (autoplay/interaction quirks).
- No raw provider URLs.

## Definition of done
Reusable player with compare, keyboard + screen-reader support, verified on mobile browsers.

## Reference
- MDN Web Audio: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API · wavesurfer.js: https://wavesurfer.xyz/
