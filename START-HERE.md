# START HERE — Session Handoff

> **Rewritten at the end of every working session.** Captures what's in flight so the next session doesn't start cold.

**Last updated:** April 18, 2026 (session 2)

---

## What shipped this session (v9.3)

- Player Entry tightened (input padding, row gap)
- Green footer template added across all 5 screens
- "Built with Claude AI" removed from footers
- MAX_PLAYERS reduced from 5 to 4
- Solo-play chip now always shown
- Blank-name fallback → "Paul"
- Scorecard row padding 11px → 7px
- Discard Round, success icon, success message commented out
- Null-guarded submitRound against missing #success-msg
- Silenced Service Worker console logs
- **Layout architecture locked:**
  - `.screen` uses `height: 100dvh` (dynamic viewport, strict) with `100vh` fallback + `overflow: hidden`
  - Masthead, nav buttons, footer all `flex-shrink: 0` — chrome never squeezes
  - Content containers share `flex: 0 0 340px; min-height: 0; overflow-y: auto`
  - Footer: `flex: 1 0 auto; min-height: 291px` — absorbs slack on tall phones
  - `@media (max-height: 750px)` branch scales masthead, content, footer, score buttons, jewel, hole number for iPhone SE / mini

## Next up

1. **Verify iPhone layout** — Paul tests on iPhone 15 Pro Max before we touch anything else
2. Add Stat Slider Switches to footer (FIR, GIR, U&D, 3+ Putts) — all dimmed by default, iOS-style
3. Wire stats to Google Sheets Stats tab (1/0 values, separate from scorecard)
4. Add Apps Script URL to `SHEETS_URL` constant

## Reference

- Full redesign scope: `REDESIGN-PLAN.md`
- Canonical spec: `PROJECT.md`
- Live URL: https://kamloopspaul-a11y.github.io/golf-scores

## Notes for Claude

- Do not revisit the locked layout architecture unless explicitly requested
- The slider switches go INSIDE the green footer — footer already sized for this
- Visual consistency matters — no shifting elements, fixed layouts
- Paul works KISS, short answers, iterates fast
