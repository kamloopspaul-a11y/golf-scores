# START HERE — Session Handoff

> **Rewritten at the end of every working session.** Captures what's in flight so the next session doesn't start cold.

**Last updated:** April 23, 2026

---

## In flight (uncommitted, ready to push)

**Jitter fix — 2-line CSS edit in `index.html`:**
- `body { min-height: 100vh → 100dvh }` (~line 115)
- `.screen { height: 100vh; height: 100dvh → height: 100dvh }` (~line 120)

Root cause: body used static `100vh` while `.screen` used `100dvh`. When iOS Safari's URL bar expanded/collapsed, the two layers disagreed → visible shift.

**Next-session workflow:**
1. GitHub Desktop → review the diff → commit + Publish origin
2. On iPhone: delete PWA from home screen → reopen `https://kamloopspaul-a11y.github.io/golf-scores/` in Safari → Add to Home Screen (busts the old service worker cache)
3. Test for jitter. If it persists: revert the commit in GitHub Desktop, or bump SW cache version in `sw.js`.
4. **Still uncommitted from April 17:** timer heartbeat + localStorage persistence. Safe to commit alongside the jitter fix or separately.

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

## Next up

1. Wire slider switches to state — toggle handler that writes 1/0 per hole per stat
2. Add Apps Script URL to `SHEETS_URL` constant
3. Wire stats to Google Sheets `Stats` tab (separate from scorecard, columns: Round ID | Date | Player | Hole | FIR | GIR | U&D | 3+ Putts)
4. Test SW offline behaviour
5. Create app icons (`icon-192.png`, `icon-512.png`)
6. Hole 5 yardage update when new tee box is complete

## Reference

- Full redesign scope: `REDESIGN-PLAN.md`
- Canonical spec: `PROJECT.md`
- Live URL: https://kamloopspaul-a11y.github.io/golf-scores

## Notes for Claude

- **The white-stage architecture is locked.** Body green, transparent chrome, white stage. Don't propose alternatives unless explicitly asked.
- Slider switches are placeholder-only; wiring them is the next real task.
- Paul works KISS, short answers, fast iteration. No re-litigation of decisions.
- Visual consistency matters — fixed layouts, no shifting elements.
- Sandbox commits leave orphan `.git` lock files on Paul's Mac. He clears them with `rm ~/Documents/Studio/golf-scores/.git/HEAD.lock ~/Documents/Studio/golf-scores/.git/objects/maintenance.lock` before pushing via GitHub Desktop.
