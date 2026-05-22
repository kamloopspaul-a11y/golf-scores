# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**My Golf Scores** — a single-player PWA for tracking golf rounds. Live at https://kamloopspaul-a11y.github.io/golf-scores. GitHub repo: https://github.com/kamloopspaul-a11y/golf-scores.

The app records hole-by-hole scores and stats (FIR, GIR, PEN, UD, X-UD, PUTTS), posts completed rounds to Google Sheets via an Apps Script webhook, and sends email performance reports using the Golf Performance Index (GPI) metric.

## Development Workflow

There is no build step. All files are static HTML/CSS/JS — edit and open directly in a browser or push to GitHub Pages.

**Service Worker cache:** Every change to `shared.css`, `shared.js`, `sw.js`, or any precached asset **requires a `CACHE_NAME` bump** in `sw.js` (e.g. `golf-scores-v64` → `golf-scores-v65`). Failing to bump the cache means returning users will be served stale files. The current cache version is noted in the `sw.js` header comment.

**Deploy:** Push to `main` branch → GitHub Pages auto-deploys from the `kamloopspaul-a11y/golf-scores` repo. The `/exec` Apps Script webhook URL is stable across redeploys.

## File Structure

| File | Purpose |
|------|---------|
| `index.html` | Main app — all scoring screens, course selector, Add Scores panel |
| `courses.html` | Course management — Add Course form, saved course list |
| `settings.html` | Player profile, stat toggles, email report settings |
| `onboarding.html` | First-run setup — player name, Google Sheets URL |
| `shared.css` | Single source of truth for all shared styles — linked first on every page |
| `shared.js` | Shared utilities: `NAV_LINKS`, `showPanel()`, `renderFooterNav()`, `renderMasthead()` |
| `sw.js` | Service Worker — network-first HTML, cache-first assets |
| `courses.json` | Seed data for 12 Kamloops-area courses (loaded once into `localStorage.courseCache`) |
| `apps-script.gs` | Google Apps Script webhook — receives round data, writes Sheets, sends GPI email reports |

## Architecture

### Screen / State Flow (`index.html`)

All five app screens live in a single HTML file as `<div class="screen" id="screen-*">` elements. Only one has `.active` at a time — `showScreen(name)` toggles visibility. Screens: `setup` → `hole` → `midround` (after hole 9) → `card` (after hole 18) → `success`.

Global `state` object holds everything for the current round: `players[]`, `scores[][]`, `stats[]`, `holeList[]`, `currentHole`, `date`, `historicalMode`, `roundStartTime`, `pccSelected`.

### localStorage Keys

| Key | Contents |
|-----|----------|
| `profile` | Player name, home tees, HI, `recordStats`, email, report frequency |
| `courseCache` | All courses (12 seeded from `courses.json` + user-added) keyed by ID |
| `activeCourse` | Normalised course data for the current/last round (`activeCourseData`) |
| `pendingRounds` | Queue of failed-to-post rounds; shown as a banner on Setup screen |
| `roundStartTime` | Persisted so duration survives page reload |

### Course Data

`courses.json` seeds `localStorage.courseCache` once on app boot via `seedCourseCache()`. User-added courses also live in `courseCache` (not synced to any server — JSON export is the only backup).

`activeCourseData` is a normalised object built by `buildActiveCourseData(course, teeBox, gender)`. It drives `startRound()`, `courseHandicap()`, and `submitRound()`. Falls back to the hardcoded `COURSE` constant (Mt. Paul) if nothing is selected.

### Google Sheets Schema (v2 — vertical)

**Rounds tab** (fact table — 18 rows per round): `Round_ID | Hole | Par | Stroke_Index | Score | Putts | FIR | GIR | UD | X_UD | Penalties | Net_Score`

**Round_Meta tab** (dimension — 1 row per round): `Round_ID | Date | Course | Tees | Round_Type | PCC_Selected | Pending | Pairing_ID`

**Diagnostics tab** (1 row per round, computed server-side): GPI cost components + `BallStrikingGap`, `ShortGameEff`, `PuttsPerGIR`, etc.

**Settings tab**: `Key | Value` — `Home Course` and `Handicap_Index`.

### GPI (Golf Performance Index)

Defined in `GPI_RULES.md`. Four cost components: `BSCost` (ball striking), `SGCost` (short game, HI-scaled multiplier), `PuttCost` (putts vs HI-bracket benchmark), `PenCost` (penalties 1:1). Computed server-side in `apps-script.gs → buildDiagnostics_()`. Email reports auto-send every N rounds (configurable; default 5).

### Shared Components (`shared.js` + `shared.css`)

`renderFooterNav(el)` writes the 4-button grid into any element with `[data-nav]`. `NAV_LINKS` is the single source of truth for nav labels/targets. `showPanel(name)` handles universal cross-page navigation; pages override with `window._handlePanel` for local intercepts. Pages set `data-page-id` on `<body>` so `applyPageMeta()` can auto-populate the title and breadcrumb.

## Layout Architecture (locked — do not change)

`.screen` is a flex column, `height: 100dvh`, `overflow: hidden`. Three zones:
- **Masthead** (fixed): `calc(208px + safe-area-inset-top)`. Two sub-rows: `.header-lower-top` min-height 86/74px (title or hole number, bottom-anchored); `.header-lower-bot` min-height 38/32px (PAR | YDS on hole screens, empty otherwise). Every screen has **identical masthead height** — no layout shift.
- **Stage** (elastic): `flex: 1 1 auto` — absorbs viewport variation. White block.
- **Footer** (content-sized): `flex: 0 0 auto`, `min-height: calc(220px + safe-area-bottom)`. Hole screens: 6-row stats grid. Other screens: nav grid.

Desktop constraint: `max-width: 320px` on `body`.

## Design Rules (Paul's preferences)

- **Visual consistency above all** — fixed layouts, no shifting elements between screens.
- Brand green: `#377f09` (`--green`). Yellow accent: `#f5c842` (`--yellow`).
- Font: DM Sans. Type scale in `shared.css :root` — use CSS vars (`--fs-display`, `--fs-hole`, etc.), not raw px values.
- Nav Dots (`buildDots()`) are the only progress indicator — no progress bar.
- Footer stats grid is on hole screens only — placeholder empty footer on all others for height parity.
- **No leaderboard** — removed permanently.
- Player names: 6-character max.
- `table-layout: fixed` on scorecard tables — name col 52px, data cols 28px.

## Locked Decisions

These are settled — do not reopen without explicit instruction:
- **Single-player only.** No multi-player UI.
- **Sheets schema v2** — vertical (one row per hole). No horizontal layout.
- **SW strategy** — network-first HTML, cache-first assets.
- **Course data** — `localStorage` only, no third-party API. Manual entry from scorecards.
- **Tee selection** — lives in Player Profile (`settings.html`), not per-round setup.
- **Setup screen** — Record Stats toggle + START ROUND. No player name input (display-only).
- **HI display** — "—" until 20 rounds completed. No provisional handicap before that.
- **Add Scores screen** — repurposes hole screens for historical round entry; stats footer hidden in `historicalMode`.
- **Header Lower 2-row structure** — top 86/74 + bot 38/32, `min-height` holds the empty bottom row open.
- **Cheering.mp3** — Easter egg on Hole-in-One. No toggle, not documented.

## Apps Script Notes

`apps-script.gs` is deployed as a Google Apps Script Web App (`/exec` URL, execute as Me, Anyone can access). The URL is stored in `localStorage` key `profile.sheetsUrl` (set during onboarding). To update the script: paste new code → Deploy → Manage deployments → edit → New version. The `/exec` URL does not change on redeploy.

Email reports fire automatically when `totalRounds % n === 0` for any window in `ROUND_WINDOWS = [5, 10, 20]`. To trigger manually, run `sendReport()` in the Apps Script editor.

## STANDING RULE — Development Context

**This is NOT a PWA. It is a web app in development hosted on GitHub Pages.**

Do not give troubleshooting advice based on PWA/home screen install assumptions. No home screen icons, no standalone mode, no app installation advice during development. Treat it as a standard browser-based web app until explicitly told otherwise.
