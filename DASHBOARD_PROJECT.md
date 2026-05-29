# PROJECT — Dashboard

*Data analytics module to supplement the Golf Score apps. Per-player stat trends, insights, improvement suggestions. Phase 2.*

## Status

Current focus: not started — research phase
Last touched: 2026-04-26
Stage: concept

## Stack & Architecture

- **Type:** PWA / web tool — TBD
- **Stack:** HTML/CSS/JS, reads Google Sheets — exact pattern TBD (Apps Script web app vs. Sheets API vs. published-to-web)
- **Hosting:** TBD
- **Key files:**
  - `GOLF_DASHBOARD_RESEARCH.md` — early research notes (pink/white/blue color scheme, opportunity-cost framing, peer-relative benchmarks, 5-7 headline metrics max)
  - `SECURITY_NOTES.md` — security considerations

## Data Source Plan (decided 2026-04-19)

- **Live source during development:** the **2024 Golf Stats** Google Sheet on Drive. 2026 rounds aren't entered yet, so the 2024 sheet is what makes the dashboard testable today.
- **Demo mode toggle:** the 2024 data stays available as a permanent showcase dataset — useful for marketing screenshots and prospects who want to see the dashboard with realistic numbers.
- **Production source:** swaps to the current-year sheet (live golf-scores app) once the dashboard is ready to ship.
- **Abstraction:** the data layer should sit behind a single fetcher function (e.g. `getScores()`) so the underlying source can swap without touching dashboard code.

## Stats the App Will Collect (via slider entry on the Golf app)

- **FIR** — Fairway in Regulation
- **GIR** — Green in Regulation
- **U/D** — Up & Downs
- **3-Putts** *(later replaced by PUTTS counter + derived Score)*

No 2024 historical data exists for these — the dashboard demo mode will need synthetic/dummy values to populate them for showcase purposes.

## Visual / UX Principles

- Visual consistency with the Golf app (same fonts, colours, spacing). Existing pink/white/blue score-vs-par color scheme aligns with golf conventions — keep it.
- Fixed layouts, no shifting elements.
- **Frame stats as opportunity cost, not raw counts.** "3-putts cost you 2.3 strokes/round" beats "you 3-putted 4 times".
- **Peer-relative benchmarks**, never tour-relative. Compare to the player's handicap band, not the PGA.
- **Curate aggressively** — 5-7 headline metrics on the primary view. Drill-down for the rest.

## Decisions Log

- **2026-04-19** — Dashboard reads 2024 Golf Stats during development. Demo-mode toggle preserves it as a marketing dataset post-launch.
- **2026-04-19** — Data layer abstracted behind `getScores()` fetcher so source can swap without touching dashboard code.
- **2026-04-26** — Set up under the new memory system. Phase 2 status confirmed; main app (Golf) takes priority.
- **2026-04-26** — Marketing decision deferred. Possible companion Installer module also under consideration.

## Open Questions

- Authentication approach (Sheets API key vs. published-to-web vs. Apps Script web app).
- Read directly from Sheets at runtime, or pull and cache?
- How to include **handicap data** — not yet decided.
- Whether to track **playing partners' scores** or only Paul's. Currently Paul-only.
- Does the Installer module belong here, as its own project, or is it an installable variant of the Golf app?
- Marketability — free tool, paid add-on, part of the SaaS bundle (see `Golf/BUSINESS.md`), or personal use?

## Next Steps

- Review `GOLF_DASHBOARD_RESEARCH.md` and lift any remaining open questions into this PROJECT.md.
- Decide on data-access pattern.
- Decide on the headline-metric shortlist (5-7 max).
