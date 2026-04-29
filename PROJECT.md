# PROJECT — Golf

*The My Golf Scores PWA — Mt. Paul, looped twice for 18 holes. Posts to a Google Sheet via Apps Script.*

## Status

**Version:** v9.21.1 — April 25, 2026
**Live URL:** https://kamloopspaul-a11y.github.io/golf-scores
**GitHub repo:** https://github.com/kamloopspaul-a11y/golf-scores
**Local folder:** `~/Documents/Studio/Golf`
**Service Worker:** v25 (network-first for HTML, cache-first for assets)
**Stage:** GUI polish / pre-release

## Core Spec

- 18 holes always (Mt. Paul looped twice)
- Up to 5 players; only the primary player posts to Google Sheets
- Player names: 6-character max
- Green theme: `#377f09`
- Weather: live temp °C + wind km/h via Open-Meteo API (Kamloops coords)
- Course: stored as `COURSE` constant in `index.html` (hole-by-hole par/yardage)
- Data flow: local during play → Google Sheets only on explicit Post Score
- Service Worker: network-first for HTML, cache-first for assets, full offline play
- Apps Script `/exec` URL embedded at `index.html` line 652

## Scoring Rules

- Hole-in-One: score = 1, regardless of par (plays `cheering.mp3`)
- Eagle: −2 or better
- Birdie: −1
- Par: 0
- Bogey: exactly +1
- Double bogey or worse: +2 or more

## Scorecard Cell Legend

| Score | Display |
|-------|---------|
| Hole-in-One (1) | Bold number |
| Eagle (−2 or better) | Double circle |
| Birdie (−1) | Circle |
| Par | Plain |
| Bogey (+1) | Square box |
| Double bogey+ | Plain number |

## Scorecard Column Structure

- **Front 9 Score:** Hole | 1–9 | OUT
- **Final Score:** Hole | 10–18 | OUT | IN | TOT
- `table-layout: fixed` — name col 52px, data cols 28px each
- Scrolls horizontally on mobile

## Data Schema (locked, post v9.10)

**Scorecard tab:** `Round ID | Date | Year | Course | Tees | H1…H18 | Front | Back | Total | Notes`

**Stats tab:** `Round ID | Date | Hole | FIR | GIR | PEN | UD | X-UD | PUTTS | Score`

**Settings tab:** `Key | Value`

- Date format: YYYY-MM-DD
- Year column derived from Date
- FIR / GIR / PEN / UD / X-UD: 1 or null (not 0)
- PUTTS: integer 0–9, default 2
- Score: server-derived = strokes − putts
- Single-player-per-sheet (Player column dropped)

## Named Components

| Name | Description |
|------|-------------|
| **Header Upper** | Transparent green band: Course/Weather + Date/Duration |
| **Header Lower** | Bottom row, min-height 86 (default) / 74 (small-screen). Hole screen: hole-num on top + "PAR 4" below (centered column) on the left, "275 YDS" inline on the right. Non-hole screens: title (My Golf Scores / Front 9 Score / Final Score / Save Round) at 56/46px, bottom-anchored. |
| **Counter** | Three circles: − \| jewel score \| + |
| **Nav Dots** | 18 dots — sole progress indicator |
| **Nav Buttons** | Back + Next, fixed position bottom of stage on all screens |
| **Player Chips** | Player name tabs above Counter (hidden for solo play) |
| **Footer** | Transparent green band. Hole screen: 6-row stats grid (FIR/GIR/PEN/UD/X-UD/PUTTS). Other screens: empty placeholder at the same height for visual parity. |
| **Stage** | White block in the middle. `flex: 1 1 auto` — absorbs viewport variation. |

## Layout Architecture (locked, post v9.13)

- `.screen` is a flex column, `height: 100dvh`, `overflow: hidden`
- Masthead: fixed height (small-screen 150px + safe-area-top)
- Stage: elastic (`flex: 1 1 auto`)
- Footer: content-sized (`flex: 0 0 auto`), `min-height: calc(220px + safe-area-bottom)`
- All screens visually identical except for stage content. No layout shift between screens.

## Screens

| Screen ID | Title | Notes |
|-----------|-------|-------|
| `setup` | My Golf Scores | Add/remove players, Start Round |
| `hole` | Hole [N] | Counter, Nav Dots, Nav Buttons, 6-row stats footer |
| `midround` | Front 9 Score | After Hole 9; scorecard table only |
| `card` | Final Score | After Hole 18; back 9 table + summary |
| `success` | Save Round | Confirmation after posting |

## Component Guidelines (Paul's design rules)

- Header Upper: Course (yellow, left) + Weather (right) / Date (left) + Duration (right)
- Header Lower: bottom-row min-height 86/74; hole-num white 64/52; title 56/46; PAR/YDS 16px white
- All mastheads: identical height across screens — no layout shift
- Nav Buttons: always same fixed position
- Progress: Nav Dots only. No thin bar.
- Leaderboard: deleted. Do not re-add.
- Visual consistency: fixed layouts, consistent font sizes, no shifting elements
- Player names: 6 character max

## Locked Decisions (do not revisit)

- **Sheets schema** — Scorecard / Stats / Settings tabs as defined above. Date YYYY-MM-DD. Year derived from Date. Single-player-per-sheet.
- **Stats values** — 1/null for flags. Integer for PUTTS. Score derived server-side.
- **Layout** — masthead fixed / stage elastic / footer content-sized + min-height.
- **White-stage architecture** — body green, transparent chrome, white content stage.
- **SW strategy** — network-first HTML, cache-first assets.
- **Webhook stability** — Apps Script redeploys keep the same `/exec` URL.
- **Folder name** — `Golf` (was `golf-scores`). Remote repo name unchanged.
- **Title font parity** — non-hole title matches hole-num size (56/46px).

## Open / Pending Items

- [ ] **Stats summary on Save Round screen** — front/back/total, FIR/GIR/UD hit counts, avg Score. Fixed-height summary inside `.success-body` (`flex: 0 0 300px`, won't shift layout). ~30 min.
- [ ] **Tee selector** — Mt. Paul Blue + Red, one-time pick stored in Settings tab. Restructure `COURSE.holes` to `{par, blue, red}`. Future courses may add white/gold/black.
- [ ] **Touch-target review** — `.putts-btn` (26×26) and `.switch` (53×26) below Apple's 44×44 minimum.
- [ ] **Settings `Home Course` value** — currently seeded `Kamloops G&CC`, should be `Mt. Paul`.
- [ ] **Hole 5 Red tee yardage update** when new tee box completes (May 2026). Captured Red yardages: `237, 120, 148, 265, 94, 320, 115, 230, 250` (front 9; back 9 = front 9 repeated, total 3,558).
- [ ] **Remove Discard Round button** before final release. Layout already accounts for its removal.
- [ ] **Wire or remove placeholder sliders** on non-hole screens (setup, midround, card, success).
- [ ] **Create app icons** — `icon-192.png`, `icon-512.png`.
- [ ] **Test SW offline behaviour**.
- [ ] **Privacy policy page** — needed before broader OAuth distribution.
- [ ] **Beta test with Dave**.

## Distribution & Onboarding

**Problem:** Google Sheets onboarding is heavy for non-technical golfers (Google account, Apps Script deploy, OAuth warning, URL paste).

**Storage options considered:** localStorage (single device); pre-deployed Apps Script URL (OAuth warning remains); Airtable/Notion (join code); Supabase/Firebase (smoother UX, more backend work).

**Current plan:** Small rollout to golf friends first. Paul assists setup personally. Pre-deployed Sheets URL + plain-English instructions is the pragmatic path. Gather feedback before broader release.

**Note:** One friend uses Numbers (Apple) for posting stats — possible alt to explore.

## Phase 2 — Analytics Dashboard

See `~/Documents/Studio/Dashboard/PROJECT.md`. Per-player stat trends (FIR, GIR, U&D, 3-Putts, scoring trends), insights, improvement suggestions. Depends on captured data.

## Business / Marketability

See `BUSINESS.md` for the full white-label-SaaS / golf-academy thread.

## Technical Notes

- Single-file app: HTML, CSS, JS in `index.html`
- No frameworks, no build step, no dependencies
- Local storage during play; posts to Sheets only on submit
- `COURSE` constant structured for future multi-course / GPS support
- Webhook `/exec` URL stable across Apps Script redeploys

## Notes for Claude (Golf-specific)

- **Authoritative source:** if `index.html` and any other doc disagree, `index.html` wins.
- **Cache-bust pattern for testing:** append `?v=N` to the live URL, bump N each test. Pre-launch, switch to filename-based cache-busting (`index-v912.html`) to silence iOS tracking-protection banners (`?v=N` looks like a tracking parameter).
- **iOS Safari cache stickiness:** SW is now network-first for HTML (since v9.12 / SW v13+). Deploys reach iPhones on next page load. Don't recommend "clear website data" anymore.
- **Stats tab header changes** only take effect when Stats is empty. To migrate the header, delete the Stats tab and post a fresh round so it gets recreated.
- **Live URL fetch:** sandbox is firewalled from `kamloopspaul-a11y.github.io` and `raw.githubusercontent.com`. Use Chrome MCP (Paul's browser) or ask Paul for screenshots when verifying live deploys.
- **Don't re-litigate:** Sheets schema, date format, year-column, 1/null flags, single-player-per-sheet, leaderboard removal, layout architecture.
