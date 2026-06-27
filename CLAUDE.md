# CLAUDE.md

> ⚠️ **Studio root must be mounted before starting work.**
>
> If `~/Documents/Studio` is not already mounted in this session, call `request_cowork_directory` with that path now. Root contains `CLAUDE.md` (session protocol), `TODO_LIST.md` (cadence cues including the Golf resume prompt), and `.claude-config` (credentials). Without root you are missing cadence checks, API keys, and cross-project context.
>
> Once root is confirmed mounted, read `Projects/Golf/PROJECT.md` to restore Golf session context.

---

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

### Strokes Gained Cost Model

`apps-script.gs → buildDiagnostics_()` is the sole source of truth for this — not `GPI_RULES.md` or `GPI-MetricsGuide.md` (discontinued as references, 2026-06-24; left in place but no longer authoritative). Four cost components: `BSCost` (ball striking), `SGCost` (short game, HI-scaled multiplier), `PuttCost` (putts vs HI-bracket benchmark), `PenCost` (penalties 1:1). Email reports auto-send every N rounds (configurable; default 5).

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


## Global Enforcement Rules — Spring Green Architecture (2026-06-01)

These rules govern all future development. They exist because the shared zone framework took significant effort to establish and must not be eroded by per-page exceptions.

### 1. Global files are the single source of truth

| File | Controls |
|------|---------|
| `shared.css` | All colours, spacing, typography, layout zones, skin tokens |
| `shared.js` | Footer nav rendering, active state, page meta, version |

No style property that affects a shared zone (masthead, stage, page title, footer, nav bar) may be set in a local `<style>` block or inline `style=""` attribute. If a rule needs to exist, it goes in `shared.css`. If it applies everywhere, it goes in the base zones or the skin block. If it is truly screen-specific, scope it with an ID selector (`#screen-hole`) in `shared.css` — never in the local file.

### 2. Non-hole screen zone structure is fixed and identical

Every non-hole screen (Home, Settings, Courses, Add Scores, Save Round, Scorecard) must have exactly these zones in order:

1. **Masthead** — green strip, breadcrumb left / weather right, single row only (no lower masthead — replaced by `.hole-title` (hole screen) and `.page-title` (all other screens) in stage-scrolls)
2. **Page Title** — `<div class="page-title">` as the **first child of `.stage-scrolls`** on every screen. Title scrolls with content. Never placed in the masthead.
3. **Stage** — `.stage-scrolls`, background `--skin-bg`, scrollable content
4. **Nav Bar** — `.nav-bar` if a primary action button is needed (optional)
5. **Footer** — `.footer[data-nav]`, background `--skin-bg`, rendered by `renderFooterNav()`

The sole exception is `#screen-hole`, which places the hole number + par/yds as a `.hole-title` div inside `stage-scrolls` (not the masthead). `#screen-stats` has been merged into `#screen-hole` and no longer exists.

### 3. Page titles are mandatory on all screens

Every screen must have a page title as the first child of `.stage-scrolls`:
- All screens except hole: `<div class="page-title">Label</div>` — plain-language name, style defined once in `shared.css`, never overridden locally.
- Hole screen: `<div class="hole-title">` with `.hole-num` left / `.hole-meta` right — same position rule, different element.

Dynamic titles (e.g. Add Course ↔ Edit Course, Save Round ↔ error state) use an `id` on the `.page-title` element and are updated via `getElementById` — never via class-based querySelector.

### 4. No inline styles

`style=""` attributes are banned except for two cases:
- `display: none` / `display: block` toggled by JavaScript at runtime
- Truly one-off numeric values with no class equivalent (e.g. a specific `width` on a generated element)

If a style appears more than once inline, it becomes a class in `shared.css`.

### 5. Local `<style>` block hygiene

Each page's local `<style>` block is permitted only for:
- Elements that are genuinely unique to that page (e.g. `.bench-table` in settings, score grid in add-scores)
- JavaScript-driven state classes (e.g. `.open`, `.active`, `.hidden`)

Any rule in a local block that targets a shared zone class (`.masthead`, `.stage-scrolls`, `.footer`, `.section-header`, `.setting-row`, `.btn-3d`) must be reviewed and moved to `shared.css` or deleted.

### 6. Version bump on every push, no exceptions

Every `git push` requires:
- `APP_VERSION` incremented in `shared.js`
- `CACHE_NAME` incremented in `sw.js`

No push without a version bump. This is a front-end development verification requirement.

### 7. Skin block is self-contained

The `/* SKIN: Spring Green */` block in `shared.css` is the only place skin-specific overrides live. Changing the skin means replacing that block only. No skin values (colours, radii, font-weight overrides) may leak into base zones or local files.

## STANDING RULE — Development Context

**This is NOT a PWA. It is a web app in development hosted on GitHub Pages.**

Do not give troubleshooting advice based on PWA/home screen install assumptions. No home screen icons, no standalone mode, no app installation advice during development. Treat it as a standard browser-based web app until explicitly told otherwise.
