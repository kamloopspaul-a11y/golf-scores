# START HERE — Session Handoff

> **Rewritten at the end of every working session.** Captures what's in flight so the next session doesn't start cold.

**Last updated:** April 23, 2026 (end of session 4)

---

## ✅ Jitter fix — shipped

Committed and published via GitHub Desktop this session. Paul confirmed the jitter is fixed. Two-line CSS change: `body { min-height: 100dvh }` + `.screen { height: 100dvh }` (previously `100vh` — the unit mismatch was the culprit).

## Schema locked — Google Sheets integration (next session's target)

Decisions from April 23 conversation:

**Two tabs per user sheet:**
- `Scorecard` — one row per round. Columns: `Round ID | Date | Player | Course | H1...H18 | Front | Back | Total | Notes`.
- `Stats` — one row per hole per round. Columns: `Round ID | Date | Player | Hole | FIR | GIR | U&D | 3+ Putts`. Values stored as `1 / 0` (not Y/N) for formula-friendliness. Null row if stats not tracked for that round.

**Design calls:**
- All 18 per-hole scores stored on Scorecard tab (not just totals) — preserves future analytics.
- Date format `YYYY-MM-DD` in the sheet; display-friendly formatting (e.g. "Apr 23, 2026") applied in the UI layer via lookup/formatter. No duplicate human-readable date column.
- **One tab per year is rejected.** Use a `Year` column (derived from Date) instead — single query surface, easier for future dashboard.
- Stat labels can be lengthened later without schema migration — just header text.
- Home Course stored once in a `Settings` tab (or similar), not repeated per round.

**Webhook principle:** Apps Script is trivially redeployable (paste → deploy → same URL). Keep the webhook thin; lock the schema now, iterate the handler freely.

## Out of scope for next session (don't design for these yet)

- AI-assisted dashboard / natural-language queries
- Freemium → Pro unlock
- "Buy me a coffee" nag
- Book-a-lesson CTAs
- Municipal course sponsorship flow

Ship the free MVP first, get 5 users, then decide what earns a nag.

## Next session — focused tasks (pick ONE)

Paul's preference going forward: **task-specific sessions, one subject at a time.**

Candidates, in recommended order:
1. Wire the 4 slider switches to state (writes 1/0 per hole per stat into `state.stats`)
2. Draft the Apps Script webhook + template Sheet structure (Scorecard + Stats + Settings tabs, with the schema above)
3. Template-copy distribution flow for new users (OAuth → copy template → store Sheet ID locally)

---

## What shipped previous session (v9.4 → v9.7)

### v9.4 — iOS safe-area
- Added `viewport-fit=cover` to viewport meta
- Masthead padding/height include `env(safe-area-inset-top)`
- Footer padding/min-height include `env(safe-area-inset-bottom)`

### v9.5 — Green body + white stage architecture (Paul's idea, big simplification)
- **Body background: green.** Extends edge-to-edge automatically. Notch, home indicator, rubber-band scroll all just show green. No more `env()` calc gymnastics on backgrounds.
- **Masthead and footer: transparent.** Body green bleeds through.
- **White "stage"** = content containers (`.setup-body`, `.score-section`, etc.) + `.hole-actions`. One continuous white block from chips/counter through nav buttons.
- Body `max-width: 470px` removed → `width: 100%` so green fills full viewport.
- Stage `margin-top: 12px` reveals YARDS text in hole header (which was being clipped by the stage edge).

### v9.6 — Slider switches + 20px shrink
- iOS-style toggle switches added to right column of footer grid (FIR / GIR / U&D / 3+ Putts)
- All toggles **unscripted** — they animate visually but don't yet write state anywhere
- Switches: 53px wide × 26px tall, yellow `#f5c842` when on, white knob
- Footer min-height 200→180, padding-bottom 150→130 (shaves ~20px)

### v9.7 — Trim 40px off bottom
- Content flex-basis 340→300 to bring "3+ Putts" row back into view on iPhone 15 Pro Max

---

## Locked architecture (do not revisit unless explicitly asked)

```
.screen { display: flex; flex-direction: column; height: 100dvh; overflow: hidden; }

body { background: var(--green); width: 100%; }

.masthead { background: transparent; height: calc(240px + env(safe-area-inset-top)); flex-shrink: 0; }

.setup-body, .score-section, .midround-wrap, .scorecard-wrap, .success-body {
  flex: 0 0 300px;
  background: #fff;
  margin-top: 12px;
}
.hole-actions { background: #fff; flex-shrink: 0; }

.footer {
  background: transparent;
  min-height: calc(180px + env(safe-area-inset-bottom));
  padding: 20px 20px calc(130px + env(safe-area-inset-bottom));
  flex: 1 0 auto;
  display: flex; flex-direction: column; justify-content: flex-end;
}
```

Footer grid is 2-column (`1fr 1fr`) — yellow label left, slider right.

---

## Open issues to verify

1. **Service worker cache might be hiding v9.7 on Paul's iPhone.** When he tested today, it looked unchanged from v9.6 — almost certainly because iOS PWA cached the old SW. Fix path: delete PWA from home screen, re-add from Safari. If that doesn't work, bump cache version in `sw.js`.
2. **Slight vertical scroll/movement still possible** on certain iPhone heights — content basis 300 was the trim, but if it persists after fresh cache, may need another small reduction.
3. **iOS keyboard accessory bar** on Player Entry — the ^ ∨ Done bar plus AutoFill suggestions. Imposed by Safari, can't suppress without custom keyboard. Paul accepted this for now. Could try `autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false"` later to at least kill the AutoFill row.

## Backlog (lower-priority, keep on file)

- Test SW offline behaviour
- Create app icons (`icon-192.png`, `icon-512.png`)
- Hole 5 yardage update when new tee box is complete
- Privacy policy page (needed before OAuth distribution)
- Beta test with Dave

## Reference

- Full redesign scope: `REDESIGN-PLAN.md`
- Canonical spec: `PROJECT.md`
- Live URL: https://kamloopspaul-a11y.github.io/golf-scores

## Notes for Claude

- **The white-stage architecture is locked.** Body green, transparent chrome, white stage. Don't propose alternatives unless explicitly asked.
- **The Sheets schema (above) is locked.** Don't re-open per-hole column questions, date format, year-column vs year-tab, or 1/0 vs Y/N.
- Slider switches are placeholder-only; wiring them is the next real task.
- Paul works KISS, short answers, fast iteration. No re-litigation of decisions.
- **Task-specific sessions.** Paul prefers one subject per session going forward. Don't sprawl.
- Lead with a **TL;DR** on any answer longer than a few sentences.
- Visual consistency matters — fixed layouts, no shifting elements.
- Sandbox commits leave orphan `.git` lock files on Paul's Mac. Fix: quit GitHub Desktop first, then `rm -f ~/Documents/Studio/Golf/.git/*.lock ~/Documents/Studio/Golf/.git/objects/*.lock ~/Documents/Studio/Golf/.git/refs/heads/*.lock`, then reopen GitHub Desktop.
