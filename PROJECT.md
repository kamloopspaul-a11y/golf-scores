# My Golf Scores — Project Overview

---

## STOP — READ `START-HERE.md` (or latest `SESSION_*.md`) FIRST

Active session handoff lives in the most recent `SESSION_YYYY-MM-DD.md` file
in this folder. It supersedes the spec below for any in-flight task.

---

> **Purpose:** Canonical spec for the My Golf Scores app. Upload at the start of any new Claude session to restore context. Historical decisions live in the `index.html` changelog.

---

## Current Build Status

**Version:** v9.15 — April 25, 2026
**Live URL:** https://kamloopspaul-a11y.github.io/golf-scores
**GitHub repo:** https://github.com/kamloopspaul-a11y/golf-scores
**Local folder:** `~/Documents/Studio/Golf`
**Platform:** PWA, hosted on GitHub Pages
**Service Worker:** v18 (network-first for HTML, cache-first for assets)

---

## Core Spec

- 18 holes always (Mt. Paul looped twice)
- Up to 5 players; only primary player posts to Google Sheets
- Player names: 6-character max
- Green theme: `#377f09`
- Weather: live temp °C + wind km/h via Open-Meteo API (Kamloops coords)
- Course: stored as `COURSE` constant in `index.html` (hole-by-hole par/yardage)
- Data flow: local during play → Google Sheets only on explicit "Post Score"
- Service Worker: network-first for HTML, cache-first for assets, full offline play
- Apps Script URL: live, embedded in `index.html`

---

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

- **Front 9 Score:** Hole \| 1–9 \| OUT
- **Final Score:** Hole \| 10–18 \| OUT \| IN \| TOT
- `table-layout: fixed` — name col 52px, data cols 28px each
- Scrolls horizontally on mobile

---

## Named Components

| Name | Description |
|------|-------------|
| **Header Upper** | Transparent green band: Course/Weather row + Date/Duration row |
| **Header Lower** | Title (non-hole screens) OR Hole number + Par/Yards (hole screen). Title font matches hole-num: 56px default / 46px small-screen. |
| **Counter** | Three circles: − \| jewel score \| + |
| **Nav Dots** | 18 dots — sole progress indicator |
| **Nav Buttons** | Back + Next (fixed position bottom of stage, all screens) |
| **Player Chips** | Player name tabs above Counter (hidden for solo play) |
| **Footer** | Transparent green band. Hole screen wires the 6-row stats grid (FIR / GIR / PEN / UD / X-UD / PUTTS). All other screens have an empty placeholder footer at the same height for visual parity. |
| **Stage** | White block in the middle. `flex: 1 1 auto` — absorbs viewport variation so masthead and footer stay content-sized. |

## Layout Architecture (locked, post v9.13)

- `.screen` is a flex column, `height: 100dvh`, `overflow: hidden`
- Masthead: fixed height (small-screen: 150px + safe-area-top)
- Stage: elastic (`flex: 1 1 auto`) — absorbs all viewport variation
- Footer: content-sized (`flex: 0 0 auto`), `min-height: 220px + safe-area-bottom` so non-hole footers match the hole footer
- All screens visually identical except for stage content. No layout shift between screens.

---

## Screens

| Screen ID | Title | Notes |
|-----------|-------|-------|
| `setup` | My Golf Scores | Add/remove players, Start Round |
| `hole` | Hole [N] | Counter, Nav Dots, Nav Buttons, 6-row stats footer |
| `midround` | Front 9 Score | After Hole 9; scorecard table only |
| `card` | Final Score | After Hole 18; back 9 table + summary |
| `success` | Round Saved | Confirmation after posting |

## Component Guidelines (Paul's design rules)

- Header Upper: Course (yellow, left) + Weather (right) / Date (left) + Duration (right)
- Header Lower: title at 56/46px matches hole-num size; bottom-anchored
- All mastheads: identical height across screens — no layout shift
- Nav Buttons: always same fixed position
- Progress: Nav Dots only. No thin bar.
- Leaderboard: deleted. Do not re-add.
- Visual consistency: fixed layouts, consistent font sizes, no shifting elements
- Player names: 6 character max

---

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

---

## Open / Pending Items

- [ ] Touch-target review: `.putts-btn` (26×26) and `.switch` (53×26) below Apple's 44×44 minimum
- [ ] Stats summary on the Posted! screen (front/back/total, FIR/GIR/UD hit counts, avg Score)
- [ ] Tee selector (Mt. Paul Blue + Red) — Settings-tab one-time pick
- [ ] Import 2024 historical CSV (62 rounds, ready at `~/Documents/Studio/2024-migration.csv`)
- [ ] Settings tab `Home Course` = "Mt. Paul" (currently seeded as "Kamloops G&CC")
- [ ] Hole 5 Red tee yardage update when new tee box completes (May 2026)
- [ ] Create app icons (`icon-192.png`, `icon-512.png`)
- [ ] Test SW offline behaviour
- [ ] Privacy policy page (needed before OAuth distribution)
- [ ] Beta test with Dave
- [ ] Remove Discard Round button before final release

---

## Distribution & Onboarding

**Problem:** Google Sheets onboarding is heavy for non-technical golfers — Google account, Apps Script deploy, OAuth warning, URL copy/paste.

**Storage options considered:**
- localStorage — zero setup, single device only
- Pre-deployed shared Apps Script URL — fewer steps; OAuth warning remains
- Airtable / Notion — simple join code
- Supabase / Firebase — smoothest UX, more backend work

**Current plan:** Small rollout to golf friends first. Paul assists setup personally. Pre-deployed Sheets URL + plain-English instructions is the pragmatic path. Gather feedback before broader release.

**Note:** One friend uses Numbers (Apple) for posting stats — possible alt to explore.

---

## Phase 2 — Analytics Dashboard (not started)

- Per-player stat trends (FIR, GIR, U&D, 3-Putts, scoring trends)
- Insights + improvement suggestions
- Depends on: enough captured data to be useful

---

## Business / Marketability (deferred)

- Golf pro subscription model — branding + lead generation, annual subscription
- AI-assisted marketing copy, emails, landing pages, social, support
- Validation: get a few real golfers using it consistently
- No deadline

---

## Technical Notes

- Single-file app: HTML, CSS, JS in `index.html`
- No frameworks, no build step, no dependencies
- Local storage during play; posts to Sheets only on submit
- `COURSE` constant structured for future multi-course / GPS support
- Webhook `/exec` URL is stable across Apps Script redeploys

---

## User Profile — Paul

| | |
|---|---|
| Name | Paul |
| Age | 67 |
| Location | Kamloops, BC, Canada |
| Status | Retired |
| Background | Web design, graphic design, CD-ROM programming, video production |

### How Paul Works

- KISS — simplicity over elaboration (Apple / Jonathan Ive)
- Build fast, iterate — don't over-explain
- Short answers unless more is asked for
- Visual + sequential thinker — layout and order matter
- Decisions carry forward — no re-litigation
- Visual consistency is critical
- Cold-start friction is painful — always load PROJECT.md + index.html + latest SESSION at session start

---

## Session Start Checklist (for Claude)

1. Read `CLAUDE.md` — tools available, operating principles
2. Read latest `SESSION_YYYY-MM-DD.md` — current in-flight work
3. Read `PROJECT.md` (this file) — canonical spec
4. Read `index.html` changelog (top of file) — latest version
5. Confirm version number matches across all sources
6. Ask Paul what we're working on

If `index.html` and any other doc disagree, **`index.html` is authoritative**.
