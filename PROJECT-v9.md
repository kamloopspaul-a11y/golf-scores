# My Golf Scores — Project Overview

> **Purpose of this file:** Canonical reference for the My Golf Scores app. Upload at the start of any new Claude session to restore context instantly.

---

## Current Build Status

**Version:** v9 — April 16, 2026
**Live URL:** https://kamloopspaul-a11y.github.io/golf-scores
**GitHub repo:** https://github.com/kamloopspaul-a11y/golf-scores
**Platform:** PWA (Progressive Web App) — hosted on GitHub Pages

---

## Files in Repo

| File | Purpose |
|------|---------|
| `index.html` | The entire app — HTML, CSS, JS in one file |
| `sw.js` | Service Worker — enables offline play |
| `manifest.json` | PWA manifest — improves home screen installation |
| `cheering.mp3` | Hole-in-One audio — plays when score reaches 1 |
| `icon-192.png` | App icon (192×192) — pending creation |
| `icon-512.png` | App icon (512×512) — pending creation |

---

## Decisions Made (Cumulative)

- Platform: PWA (not React Native — avoids App Store approval)
- Always 18 holes (loop Mt. Paul twice)
- Up to 5 players; only primary player's scores post to Google Sheets
- Player names: 6 character maximum
- Weather: live temp °C + wind km/h via Open-Meteo API (Kamloops coords)
- Green theme: `#377f09`
- Score display: plain jewel/wet-glass effect — no rings on score entry screen
- +/− buttons: large circles, light gray, with border
- Scorecard scoring indicators: Birdie = circle, Eagle = double circle, Bogey (+1 only) = square, Double bogey+ = plain number, HIO = bold
- Scoring rules: score of 1 = HIO regardless of par; Eagle = −2 or better; Bogey = exactly +1 over par
- Hole-in-One: plays `cheering.mp3` — fun feature, not a requirement
- Front 9 Score Card shown after Hole 9 — no leaderboard, scorecard table only
- Back button on Hole 10+ returns to Front 9 Score Card (midroundSeen flag)
- Final Round Score shows Back 9 table only (Front 9 already reviewed mid-round)
- Leaderboard removed from both scorecard screens
- Duration: shows in Upper Header as `00:00` (HH:MM), starts on Start Round
- Progress indicator: Nav Dots only — thin progress bar removed
- All Nav Buttons fixed position at bottom of every screen including Home
- "Post Score" posts primary player to Google Sheets
- "Discard Round" button retained — remove before final release, won't affect layout
- Back button on Final Round Score returns to last hole played
- "Built with Claude AI" footer on all screens
- Service Worker: full offline caching of all assets
- `touch-action: manipulation` on all buttons — prevents double-tap zoom on iOS
- Course name displayed as "Course: Mt. Paul" — label is static, name is a variable
- Apps Script URL: paste into `SHEETS_URL` constant to enable live posting

---

## Named Components

| Name | Description |
|------|-------------|
| **Header Upper** | Green area: Course/Weather row + Date/Duration row |
| **Header Lower** | Title or Hole number + Par/Yards |
| **Counter** | Three circles: − \| jewel score \| + |
| **Nav Dots** | 18 dots showing round progress — sole progress indicator |
| **Nav Buttons** | Back + Next (fixed position bottom, all screens) |
| **Player Chips** | Player name tabs above Counter (hidden for solo play) |
| **Footer** | "Built with Claude AI" — all screens |

---

## Screens

| Screen ID | Title | Notes |
|-----------|-------|-------|
| `setup` | My Golf Scores | Add/remove players, Start Round |
| `hole` | Hole [N] | Counter, Nav Dots, Nav Buttons |
| `midround` | Front 9 Score | Shown after Hole 9; scorecard table only |
| `card` | Final Round Score | Shown after Hole 18; back 9 table only |
| `success` | Round Saved | Confirmation after posting |

---

## Scorecard Cell Legend

| Score | Display |
|-------|---------|
| Hole-in-One (score = 1) | Bold number |
| Eagle (−2 or better) | Double circle |
| Birdie (−1) | Circle |
| Par | Plain |
| Bogey (+1) | Square box |
| Double bogey+ | Plain number |

---

## Scorecard Column Structure

**Front 9 Score:** Hole \| 1–9 \| OUT
**Final Round Score:** Hole \| 10–18 \| OUT \| IN \| TOT
- OUT = front 9 subtotal, IN = back 9 subtotal, TOT = full round
- `table-layout: fixed` — name col 52px, data cols 28px each
- Scrolls horizontally on mobile

---

## Course Data: Mt. Paul Golf Course

9-hole course, looped twice for 18. Back nine mirrors front nine.
**Blue Tees | Par 32 | 1,986 yards**

| Hole | Par | Yards |
|------|-----|-------|
| 1 | 4 | 275 |
| 2 | 3 | 137 |
| 3 | 3 | 179 |
| 4 | 4 | 300 |
| 5 | 3 | 95 ⚠️ temporary — new tee box under construction |
| 6 | 4 | 345 |
| 7 | 3 | 135 |
| 8 | 4 | 251 |
| 9 | 4 | 270 |
| **Total** | **32** | **1,986** |

---

## Future Enhancements

- **GPS course detection** — use `navigator.geolocation` to auto-select course from a hardcoded list of known courses by proximity (no API needed). Foundation already in place via COURSE variable.
- **Setup Installer** — separate `setup.html` wizard to walk new users through Google Sheets + Apps Script setup. Paste URL in, download ready-to-use `index.html`. Marketable as a distribution tool.
- **App icons** — `icon-192.png` and `icon-512.png` needed for proper PWA installation. Pending creation.
- **Multi-course support** — COURSE variable already structured for this.
- **Hole-in-One audio toggle** — on/off setting for cheering sound.
- **Remove Discard Round button** before final release — layout already accounts for its removal.
- **GitHub Desktop** — set up mirrored local repo for one-click push instead of manual upload.

---

## Open / Pending Items

- [ ] Add Apps Script URL to `SHEETS_URL` constant for live posting
- [ ] Create app icons (192×192 and 512×512 PNG)
- [ ] Test Service Worker offline behaviour
- [ ] Remove Discard Round button before final release
- [ ] Hole 5 yardage update when new tee box is complete
- [ ] Set up GitHub Desktop for easier deployment

---

## Component Guidelines (Paul's Definitions)

- **Header Upper:** Course (yellow, left) | Weather (right) / Date (left) | Duration 00:00 (right)
- **Header Lower:** Title on Home/Scorecard screens; Hole number + Par/Yards on Hole screen
- **All mastheads:** Fixed height 186px, identical across all screens — no layout shift
- **Nav Buttons:** Always at the same fixed position — single or double, never shifts
- **Progress:** Nav Dots only. No thin bar.
- **Leaderboard:** Deleted. Do not re-add.
- **Player names:** 6 character max

---

## Technical Notes

- Single file app — all HTML, CSS, JS in `index.html`
- No frameworks, no build process, no dependencies
- Local storage used during play (no internet required mid-round)
- Data posted to Google Sheets only on explicit "Post Score"
- Service Worker caches all assets on first load — fully offline thereafter
- `SHEETS_URL` constant — replace placeholder with Apps Script URL to enable posting
- Course data stored in `COURSE` constant — structured for future multi-course GPS support

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
- Build fast, iterate — don't over-explain; just build and refine
- Short answers unless more is asked for
- Visual and sequential thinker — layout and order matter
- Decisions carry forward — no re-litigation
- Cold-start friction is painful — always load PROJECT.md + index.html at session start
- Visual consistency is critical: fixed header heights, no layout shift, consistent font sizes

### Session Start Checklist (for Claude)
1. Read PROJECT.md
2. Read uploaded index.html
3. Confirm version number
4. Ask what we're working on today
