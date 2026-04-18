# Golf-Scores — Redesign Plan

**Read this first.** Captures the UI redesign agreed on April 18, 2026 as the starting point for the next build session.

## Goal

Reclaim the bottom of the screen as a consistent green footer across all screens, add four per-hole improvement stats without disrupting the scoring flow, and solve the Player Entry keyboard-overlap problem cleanly.

## Layout changes — all screens

- **Green footer** on every screen, matching the masthead color. Visual grammar: masthead at top, footer at bottom, scoring/nav in the middle.
- **Nav buttons slide up** to sit just under the progress bar (the position they occupy on Hole screens becomes the standard everywhere).
- Footer uses a **two-column layout, `float:left` | `float:right`**, mirroring the header pattern.

## Layout changes — Player Entry specifically

- **Limit to 4 players max.**
- Remove "Built by Claude" to free vertical space.
- Tighten spacing between Capture Name fields (above and below).
- Result: when the iOS keyboard slides in (slightly transparent at the top), it hides the footer but leaves the Start Round nav buttons visible above the waterline. No layout shift, nav stays accessible.

## Footer contents — the four stats

Labeled top to bottom:

1. **FIR** — Fairway in Regulation
2. **GIR** — Green in Regulation
3. **U&D** — Up & Down
4. **3+ Putts** — reframed as binary (did you 3-putt this hole, yes/no)

All four use the **same slider switch control** (iOS/GitHub/macOS System Settings style) for visual consistency. Binary only.

### Default behavior

- **Dimmed (off) by default.**
- Dimmed = silent opt-out. A player who never touches them has no stat data for the round. A player who toggles them as they play has a full per-hole record.
- Players aren't prompted, aren't onboarded — the footer is simply there. Those who want the analytics turn them on.

## Google Sheets integration

- **Separate tab** called `Stats` (keeps scorecard tab clean, makes per-round aggregates easy).
- Column headings match the labels above: `Hole | FIR | GIR | U&D | 3+ Putts` (plus Round ID / Date / Player to join back to the scorecard tab).
- Values written as **1 / 0** (not Y/N) to play well with `SUM` and `AVG` formulas for percentages later.
- **Data hygiene:** if every cell for a given round is `0`, treat the round as "stats not tracked" — do this in a Sheets formula at read-time, not in JS state tracking. KISS.

## Why these decisions

- Dimmed-default = zero cognitive load for casual players, opt-in behavior for the semi-serious ones who care.
- 1/0 over Y/N = formula-friendly for future analytics work.
- Separate Sheets tab = clean separation of scoring data vs. improvement data.
- All-slider layout = visual consistency; "3+ Putts" binary reframing makes the four items match.
- Keyboard overlay on Player Entry = fixed layout, no shifting elements — matches Paul's visual-consistency principle.

## Before touching this redesign

1. **Commit and push the pending timer fixes** in `index.html` from the April 17 session (heartbeat + persistence). Don't stack new changes on top of uncommitted work.
2. Open the current `index.html`, locate the Player Entry screen markup and the Hole screen footer zone, confirm where the masthead color token is defined so it can be reused.

## Context carried forward

- App is live at https://kamloopspaul-a11y.github.io/golf-scores/ (public repo, GitHub Pages)
- Strategy: free PWA → Pro unlock → municipal course sponsorship as the real revenue lever
- Market: ~12-15M semi-serious recreational North American golfers; ~7-8K sponsorable courses
- Stats (FIR/GIR/U&D/3+P) don't feed handicap — they're improvement analytics, that's fine, that's the point
- Full monetization + market discussion archived at `~/Documents/Idea Lab/sessions/2026-04-18-golf-scores-monetization.md`
