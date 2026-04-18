# My Golf Scores — Project Overview
<!-- commit test: April 17, 2026 -->

---

## 🚨🚨🚨 STOP — READ `START-HERE.md` FIRST 🚨🚨🚨

**Before anything else in a new session, open `START-HERE.md` in this folder.**
It is rewritten at the end of every working session and contains the current in-flight work. It supersedes the spec below for any active task. **Do not begin work until you have read it.**

---

> **Purpose:** Canonical spec for the My Golf Scores app. Upload at the start of any new Claude session to restore context. Historical decisions live in the `index.html` changelog. Future ideas live in `IDEAS.md`.

---

## Current Build Status

**Version:** v9.2 — April 17, 2026
**Live URL:** https://kamloopspaul-a11y.github.io/golf-scores
**GitHub repo:** https://github.com/kamloopspaul-a11y/golf-scores
**Platform:** PWA, hosted on GitHub Pages

---

## Core Spec

- 18 holes always (Mt. Paul looped twice)
- Up to 5 players; only primary player posts to Google Sheets
- Player names: 6-character max
- Green theme: `#377f09`
- Weather: live temp °C + wind km/h via Open-Meteo API (Kamloops coords)
- Course: stored as `COURSE` constant in `index.html` (hole-by-hole par/yardage there)
- Data flow: local during play → Google Sheets only on explicit "Post Score"
- Service Worker: full offline caching (sw.js)
- Apps Script URL: set `SHEETS_URL` constant in `index.html` to enable posting

---

## Scoring Rules

- Hole-in-One: score = 1, regardless of par (plays `cheering.mp3`)
- Eagle: −2 or better
- Birdie: −1
- Par: 0
- Bogey: exactly +1
- Double bogey or worse: +2 or more

---

## Scorecard Cell Legend

| Score | Display |
|-------|---------|
| Hole-in-One (1) | Bold number |
| Eagle (−2 or better) | Double circle |
| Birdie (−1) | Circle |
| Par | Plain |
| Bogey (+1) | Square box |
| Double bogey+ | Plain number |

---

## Scorecard Column Structure

- **Front 9 Score:** Hole \| 1–9 \| OUT
- **Final Round Score:** Hole \| 10–18 \| OUT \| IN \| TOT
- `table-layout: fixed` — name col 52px, data cols 28px each
- Scrolls horizontally on mobile

---

## Named Components

| Name | Description |
|------|-------------|
| **Header Upper** | Green area: Course/Weather row + Date/Duration row |
| **Header Lower** | Title OR Hole number + Par/Yards |
| **Counter** | Three circles: − \| jewel score \| + |
| **Nav Dots** | 18 dots — sole progress indicator |
| **Nav Buttons** | Back + Next (fixed position bottom, all screens) |
| **Player Chips** | Player name tabs above Counter (hidden for solo play) |
| **Footer** | "Built with Claude AI" — all screens |

---

## Screens

| Screen ID | Title | Notes |
|-----------|-------|-------|
| `setup` | My Golf Scores | Add/remove players, Start Round |
| `hole` | Hole [N] | Counter, Nav Dots, Nav Buttons |
| `midround` | Front 9 Score | After Hole 9; scorecard table only |
| `card` | Final Round Score | After Hole 18; back 9 table only |
| `success` | Round Saved | Confirmation after posting |

---

## Component Guidelines (Paul's Definitions)

- **Header Upper:** Course (yellow, left) + Weather (right) / Date (left) + Duration 00:00 (right)
- **Header Lower:** Title on Home/Scorecard; Hole + Par/Yards on Hole screen
- **All mastheads:** Fixed height, identical across screens — no layout shift
- **Nav Buttons:** Always same fixed position — single or double, never shifts
- **Progress:** Nav Dots only. No thin bar.
- **Leaderboard:** Deleted. Do not re-add.
- **Visual consistency:** fixed layouts, consistent font sizes, no shifting elements
- **Player names:** 6 character max

---

## Open / Pending Items

- [ ] Add Apps Script URL to `SHEETS_URL` constant for live posting
- [ ] Create app icons (`icon-192.png`, `icon-512.png`)
- [ ] Test Service Worker offline behaviour
- [ ] Remove Discard Round button before final release
- [ ] Hole 5 yardage update when new tee box is complete
- [ ] Set up GitHub Desktop for easier deployment

---

## Technical Notes

- Single-file app: HTML, CSS, JS in `index.html`
- No frameworks, no build process, no dependencies
- Local storage during play; posts to Sheets only on submit
- `COURSE` constant structured for future multi-course / GPS support

---

## User Profile — Paul

| | |
|---|---|
| **Name** | Paul |
| **Age** | 67 |
| **Location** | Kamloops, BC, Canada |
| **Status** | Retired |
| **Background** | Web design, graphic design, CD-ROM programming, video production (late 1990s) |

### How Paul Works

- KISS — simplicity over elaboration (Apple / Jonathan Ive)
- Build fast, iterate — don't over-explain
- Short answers unless more is asked for
- Visual and sequential thinker — layout and order matter
- Decisions carry forward — no re-litigation
- Visual consistency is critical
- Cold-start friction is painful — always load PROJECT.md + index.html at session start

---

## Session Start Checklist (for Claude)

1. **Read `START-HERE.md` FIRST** — active session handoff, rewritten each session
2. Read `PROJECT.md` (this file)
3. Read uploaded `index.html`
4. Confirm version number matches
5. Ask what we're working on today
6. Only read `IDEAS.md` if Paul wants to discuss future work
