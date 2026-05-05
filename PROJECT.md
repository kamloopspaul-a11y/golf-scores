# PROJECT — Golf

*The My Golf Scores PWA — Mt. Paul, looped twice for 18 holes. Posts to a Google Sheet via Apps Script.*

## Status

**Version:** v9.31 — May 4, 2026
**Live URL:** https://kamloopspaul-a11y.github.io/golf-scores
**GitHub repo:** https://github.com/kamloopspaul-a11y/golf-scores
**Local folder:** `~/Documents/Studio/Projects/Golf`
**Service Worker:** v26 (network-first for HTML, cache-first for assets)
**Stage:** Multi-course integration / pre-release

## Core Spec

- 18 holes always (Mt. Paul looped twice)
- **Single-player app.** Decided 2026-04-29: this app is for players interested in their own performance — multi-player UI is being removed (was: up to 5 players, primary-only-posts).
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

## Data Schema (v2 — vertical, post v9.31)

**Rounds tab** (one row per hole per round — 18 rows per round):
`Round_ID | Date | Course | Tees | Hole | Par | Stroke_Index | Score | Putts | FIR | GIR | UD | X_UD | Penalties | Net_Score`

**Settings tab:** `Key | Value`
- `Home Course` — e.g. Mt. Paul
- `Handicap_Index` — seeded at 20; server recomputes after each round (future)

**Schema notes:**
- Date format: YYYY-MM-DD
- FIR / GIR / UD / X_UD / Penalties: 1 or null
- PUTTS: integer 0–9, default 2
- Stroke_Index: 1–18 difficulty rank for the hole (from courses.json)
- Net_Score: computed server-side per hole using WHS stroke allowance (strokeIndex ≤ courseHandicap)
- Legacy Scorecard + Stats tabs removed; data was cannon fodder — fresh start 2026-05-04
- Single-player-per-sheet (Player column dropped)

## Named Components

| Name | Description |
|------|-------------|
| **Header Upper** | Transparent green band: Course/Weather + Date/Duration |
| **Header Lower** | 2-row strip, identical structure on every screen. **Top row** (`min-height 86/74`) holds title-or-hole-number, bottom-anchored. **Bottom row** (`min-height 38/32`) holds the PAR \| YDS strip on Hole screens, empty on the other four. `min-height` keeps the empty row from collapsing — every masthead has identical total height, no layout shift. Title 56/46px white; hole-num 64/52px white; PAR/YDS 16px white. |
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
- Header Lower (2-row): top-row min-height 86/74 (title or hole-num, bottom-anchored); bot-row min-height 38/32 (PAR | YDS strip on Hole, empty elsewhere). Hole-num white 64/52; title 56/46; PAR/YDS 16px white.
- All mastheads: identical height across screens — no layout shift
- Nav Buttons: always same fixed position
- Progress: Nav Dots only. No thin bar.
- Leaderboard: deleted. Do not re-add.
- Visual consistency: fixed layouts, consistent font sizes, no shifting elements
- Player names: 6 character max

## Locked Decisions (do not revisit)

- **Sheets schema** — Single `Rounds` tab (vertical, one row per hole) + `Settings` tab. Migrated to v2 on 2026-05-04. No going back to horizontal layout.
- **Stats values** — 1/null for flags. Integer for PUTTS. Score derived server-side.
- **Layout** — masthead fixed / stage elastic / footer content-sized + min-height.
- **White-stage architecture** — body green, transparent chrome, white content stage.
- **SW strategy** — network-first HTML, cache-first assets.
- **Webhook stability** — Apps Script redeploys keep the same `/exec` URL.
- **Folder name** — `Golf` (was `golf-scores`). Remote repo name unchanged.
- **Title font parity** — non-hole title matches hole-num size (56/46px).
- **Header Lower 2-row structure** — top 86/74 + bot 38/32, `min-height` holds empty bot-row. Identical total height on every screen.
- **Add Players permanently removed.** Single-player app, no revisiting. Setup has one player only.
- **Setup screen** — Record Stats toggle + Start Round button. That's it. No player name input (display-only), no tee selector per-round.
- **Player Profile** — name, home tees, HI stored locally. Rarely changed. Accessible via a Settings link on Setup, not a per-round prompt.
- **Tee selection** — lives in Player Profile, not Setup. Set once, change only when needed.
- **Cheering.mp3** — Easter egg. No toggle, not documented. Stays as-is.
- **HI with <20 rounds** — WHS scaling table (best 1 of 3, best 2 of 6, etc.). Show "—" until round 3. No hardcoded default.
- **Multi-course strategy** — local-first, API fallback. Each course fetched from API once, then cached in localStorage permanently. Pre-load regional courses. Manual entry as fallback if not in API.

## Open / Pending Items

### Hot list — post-publish iPhone feedback (2026-04-29 evening)

- [x] **Player name on Setup screen → non-editable display.** The single input field becomes display-only on Setup. Editable name moves into onboarding (first run / install) and Settings tab. Match Setup's player-name styling to how it appears on other screens. Default value still "Paul" until the install step is built.
- [x] **Drop the "!" from "Posted!"** — title becomes plain "Posted" (or whatever the title-swap design lands on; this nudge probably gets folded into the planned "Save Round → Round Saved" yellow title swap).
- [x] **Hero cell width 55% → 40%.** Grid columns become 20% / 20% / 20% / 40% (was 15/15/15/55). The 55% hero was clipping the right edge of the stage on iPhone. Small cells get more breathing room as a side effect.
- [x] **Match Hero (Actual Score) font size to the page title.** Page title is 56/46px (default/small-screen); hero `.ss-val` is currently 56px with no small-screen rule. Add a small-screen variant so the hero scales the same way the title does, and verify visual parity on iPhone.

### Considerations (open)

- **Record Stats toggle on Setup screen** — Yes/No before round starts. If No, footer stats grid hidden (casual mode). If Yes, footer sliders live. Persisted as default in Player Profile. Replaces the old "Track Stats Too?" framing — decision: build it.

- **Player Profile screen** — name (editable here, display-only on Setup), home tees (Blue/Red per course), Handicap Index. Stored in localStorage. Accessible via a small "Settings" link on Setup. This is where tee selection lives between rounds.

- **Multi-course support** — localStorage for 12–20 courses (~60KB total, well within limits). Course data schema matches GolfCourseAPI.com response (hole-by-hole par/yardage/handicap per tee set, CR/SR, GPS coords, male/female tee separation). Include Export/Import to JSON file as backup against accidental Safari cache wipe.

- **GolfCourseAPI.com integration** — free tier, ~30K courses, 300 session limit then paid. Pattern: search local cache first → API fallback → manual entry if not found. Each course fetched once and cached. 300 free calls goes far with local-first caching. API key embedded in PWA (acceptable for free tier). Confirm Canadian/Kamloops coverage by testing search before committing.

- **Tee recommendation** — warn player if selected tees don't match HI (e.g., "You sure you want Black tees? You're a 12 handicap."). CH formula already in place.

- **Track Stats Too? toggle on Setup screen.** Now that Player Entry is gone, Setup is sparse — just a name and a Start Round button. Worth giving Setup a real job: a Yes/No toggle for stats tracking. If No, the hole-screen footer (FIR/GIR/PEN/UD/X-UD/PUTTS sliders) stays empty for casual players who just want to track score. If Yes, the footer is live. Default TBD. Open question: where does the toggle state live (per-round in `state` only, or persisted in Settings as a default-on/default-off preference)? This also resolves the "what's the Setup button on Hole 1 actually for" question — it'd be a meaningful pre-round preference picker instead of a stub.

- [x] **Stats summary on Save Round screen** — SHIPPED v9.23. 4-col × 2-row grid, col 4 hero spans both rows. Columns 15% / 15% / 15% / 55%. Row 1: FIR · GIR · PEN. Row 2: UD · X-UD · PUTTS. Hero (rowspan 2): Actual Score (gross) at 56px with fine-print sub-line `HI: 20 | Net Score: 70`. Net = Gross − round(HI × SR/113 + (CR − Par)) using `COURSE.ratings`. HI + tee set are hardcoded for now (TODO: Settings lookup once onboarding is wired).
- [ ] **Title swap on Save Round screen** — replace `<h2>Posted!</h2>` with title-bar swap: "Save Round" → **"Round Saved"** (yellow `var(--yellow)`) on success, failure copy in white. Pairs with the failure-screen 'i' overlay below.
- [x] **Offline-queue / outbox for unposted rounds** — replace the misleading "Saved locally" label. On post failure, write the full payload to `localStorage.pendingRounds[]` (queue, not overwrite — losing a round is worse than the extra code). On app boot, if the queue is non-empty show a banner on Setup: "Unposted round from <date> — [Repost] [Discard]". Successful repost shifts the queue. iOS Safari has no Background Sync support, so manual repost is the realistic path. KISS v1: queue + boot-banner + repost button. ~30–60 min.
- [x] **Failure screen — 'i' info overlay pattern** — SHIPPED v9.27m. ⓘ button top-right of `header-lower` (absolute, failure state only). Overlay fills `header-lower` (pale green bg, inset 0). Message: NO INTERNET SERVICE / ROUND SAVED / POSTING YOUR SCORE. Outside-click dismissal. Dev: Simulate Failure button on Home screen for testing.
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

## Design Threads (open — not yet committed to Plan)

### Save Round screen as a receipt (not a coach)
*Conversation 2026-04-29. Synthesis landed v9.23.*

**Premise.** The Save Round screen's job is to confirm the round was logged and present the day's numbers cleanly — like a grocery receipt, not a coach's report. Diagnosis ("you putt poorly") and trends ("you're improving on approach play") belong on the Dashboard where the data has context.

**Synthesis (built v9.23).** Hero cell shows **Actual Score (gross)** at 56px — the universal language every golfer reads instantly — with a fine-print sub-line below: `HI: 20 | Net Score: 70`. The dominant number is the receipt; the small line gives just enough analytical context for the curious player without dominating. The HCP/TYP/Δ strip we discussed (with red/green color coding for delta vs. average) is deferred to the Dashboard — that's where trend context belongs.

**The handicap math + ratings + 2024 baseline (HI 20) are now live in the PWA** (COURSE.ratings extends with mensBlue/mensRed/ladiesBlue/ladiesRed). HI + tee set are still hardcoded; Settings-tab lookup arrives with onboarding.

### Dashboard purpose — progress, not diagnosis
*Reflection 2026-04-29.*

**Paul's framing:** *"I know which aspects of my game need work. My process is to work from the greens back to the tee box. What I don't know is my handicap, my rate of improvement, or if I'm improving at all. I need Course Management and Consistency."*

**Job to be done by the Dashboard:**
- *Am I improving?* — handicap/score trend over time
- *How consistent am I?* — variance/spread of recent rounds
- *Where can I improve Course Management?* — patterns in the stats (e.g., higher Score on certain holes, recurring penalty holes)
- *NOT* "what's wrong with my game" — players already feel that after the round

This reframes the Phase 2 work in `~/Documents/Studio/Dashboard/PROJECT.md`. The dashboard is a progress tracker first, an analytical tool second — not a weakness-finder.

### Handicap-based Net score on Save Round screen
*Conversation 2026-04-29.*

**Premise.** The Save Round hero cell could show a Net score (Gross − Course Handicap) instead of a raw stat. Net translates the round into a number relative to the player's own ability — constructive without being diagnostic. Diagnosis (where strokes were lost, weakness trends) belongs to the Dashboard, not the post-round screen.

**Math (locked).** Course Handicap (CH) = HI × (SR / 113) + (CR − Par). WHS formula. **HI** = Handicap Index, the portable ability rating; **CH** = Course Handicap, that ability translated into stroke allowance on a specific course (course-difficulty adjusted). No 0.96 multiplier (retired post-2020). Differential = (Score − CR) × 113 / SR. Handicap Index = average of best 8 of last 20 differentials.

**Mt. Paul ratings (locked).** 18-hole loop, Par 64.

| Tee set | CR | SR |
|---|---|---|
| Mens Blue | 59.0 | 86 |
| Mens Red | 57.9 | 72 |
| Ladies Blue | 62.2 | 95 |
| Ladies Red | 58.6 | 88 |

**Paul's 2024 baseline (Mens Blue, 62 rounds).**
- All 62 rounds: HI ≈ **20** (best 8 differentials averaged 19.55) → Course Handicap on Mt. Paul Blue = **10**.
- Most recent 20 (Aug 20 – Oct 4 2024): HI ≈ **27** → CH = 16. Late-season form drop pulls this number up; not representative of season form.
- Recommendation: seed Settings with HI 20 as starting point, let server recompute as 2026 rounds arrive.

**Implementation sketch (not committed).**
- Add `Handicap` and `TeeSet` rows to the Settings tab. TeeSet is a single 4-option pick per course that encodes tee + gender (no separate gender field). Multi-course support: ratings table is keyed by course, so each new course Paul adds (Kamloops GC, etc.) extends the table without schema changes.
- Server-side `recomputeHandicap()` runs at end of each successful post. Reads last 20 rounds from Scorecard tab, averages best 8 differentials, writes the result to Settings.
- Server returns the updated HI in the post-response payload. PWA caches it in `localStorage.handicap` so Net can render on the Save Round screen even when offline.
- Offline path: round queues in `pendingRounds[]` (the outbox). Next online post triggers the server recompute as a side effect; PWA syncs from the response. No client-side counting required — the Sheet is the source of truth.
- Decimal HI for math, integer for display.
- Display format on the hero: bare Net number (e.g., `70`), with subtitle `Net · HCP 20 · Mens Blue` so the math is transparent.

**Decided 2026-04-29.** No manual-override mode. The PWA's HI is unambiguously a personal/practical number — never claims to be an official Golf Canada / WHS handicap (those are paper-attested anyway, Sheets isn't an approved source). Players with official handicaps keep them for tournaments and use ours for personal tracking; the two answer different questions and don't need to conflict.

**Open questions.**
- *Onboarding for a brand-new player with zero rounds?* Soft prompt for an estimate at first run, or hide Net until round 20 and surprise them with a computed value? Either works; needs UX judgment.
- *Display format:* bare Net number vs. net-to-par. Conversational golf-talk uses net-to-par; scorecards show bare numbers.

**Why not Plan yet.** Target-audience needs around manual override and onboarding flow are not yet settled. Defer wiring until after the visible Stats Summary on Save Round screen ships, and after a beta tester has played with it.

## Distribution & Onboarding

**Problem:** Google Sheets onboarding is heavy for non-technical golfers (Google account, Apps Script deploy, OAuth warning, URL paste).

**Storage options considered:** localStorage (single device); pre-deployed Apps Script URL (OAuth warning remains); Airtable/Notion (join code); Supabase/Firebase (smoother UX, more backend work).

**Current plan:** Small rollout to golf friends first. Paul assists setup personally. Pre-deployed Sheets URL + plain-English instructions is the pragmatic path. Gather feedback before broader release.

**Note:** One friend uses Numbers (Apple) for posting stats — possible alt to explore.

## Phase 2 — Analytics Dashboard

See `~/Documents/Studio/Dashboard/PROJECT.md`. Per-player stat trends (FIR, GIR, UD, X-UD, PEN, 3-Putts, scoring trends), insights, improvement suggestions. Depends on captured data.

## Business / Marketability

See `BUSINESS.md` for the full white-label-SaaS / golf-academy thread.

## Market Considerations

*Fixes and decisions required before any open-market release.*

### API & Data Strategy
- **300 API sessions** on the free GolfCourseAPI.com tier are shared across all users of the same embedded key. A handful of real users will exhaust this quickly. Options: paid tier, per-user key, or abandon the API entirely.
- **courses.json seed file is Kamloops-specific.** On an open market, this regional pre-load makes no sense. For a generic release, users search their own local courses — no seed file.
- **Kamloops fork option:** cleave this project as a standalone "Kamloops Courses" app with all local courses hardcoded, no API, no seed file complexity. Simple and honest about its scope.

### Course Data Accuracy
- **Kamloops GC tee data** from the API is incomplete/inaccurate: Burgundy renamed to Red (done), but male tee count needs verification against a physical scorecard. Female tee count also unverified.
- **All seeded courses** should be verified against physical scorecards before publishing. API data is user-contributed and may have errors.

### Architecture Decisions for Open Market
- Remove regional seed file; replace with user-driven search
- Player Profile needs proper onboarding (name, home tees, HI) — currently stubbed
- Privacy policy required before broader OAuth distribution
- Consider whether Google Sheets backend scales (one Sheet per user = setup friction)

### Strategic Fork Decision (open)
Once all Kamloops-area courses are entered, decide:
- **Option A:** Kamloops Courses App — regional, hardcoded, no API, simple
- **Option B:** Generic Golf Tracker — user searches any course, paid API tier, broader market
- These are different products. Option A ships sooner. Option B needs a backend rethink.

---

## Session Resume Notes

**Last worked:** May 4, 2026

### What was completed this session
- Schema migration to v2 vertical (one row per hole): `Rounds` tab replaces Scorecard + Stats
- `apps-script.gs` rewritten: new `doPost` sends 18 rows per round, computes Net_Score per hole
- `index.html` v9.31: `submitRound()` now sends per-hole array payload with strokeIndex, courseRating, slopeRating
- `courses.json`: stroke_index added to all Mt. Paul holes; all course names simplified (Bighorn, Chinook Cove, Eaglepoint, etc.); `index: null` placeholder on other courses
- Google Sheet: blow out old data — paste new `apps-script.gs`, run `setup()`, redeploy as new version

### Files changed (v9.31)
- `index.html`
- `apps-script.gs`
- `courses.json`

### Resume here next session
1. **Redeploy Apps Script** — paste `apps-script.gs` into Sheet → run `setup()` → Deploy new version → confirm URL unchanged
2. **Test a round post** — verify 18 rows appear in Rounds tab with correct Net_Score
3. Remaining: Record Stats toggle, Player Profile screen, touch-target review, app icons
4. Dave's data import — wait for CSV/XLS sample, then write transform script
5. Dev buttons (Jump to Post Screen, Simulate Failure) — delete before release

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
- **Schema v2 (vertical):** Scorecard and Stats tabs are gone. Single `Rounds` tab. Apps Script `setup()` must be re-run once on the Sheet after pasting new code.
- **Live URL fetch:** sandbox is firewalled from `kamloopspaul-a11y.github.io` and `raw.githubusercontent.com`. Use Chrome MCP (Paul's browser) or ask Paul for screenshots when verifying live deploys.
- **Don't re-litigate:** Sheets schema (now v2 vertical — decided 2026-05-04), 1/null flags, single-player-per-sheet, leaderboard removal, layout architecture.

## End-of-Session Housekeeping (standing rule)

Before closing any Golf session, update the **Active Project Resume** entry in `~/Documents/Studio/TODO_LIST.md`:

1. **Resume at** — one line describing exactly where to pick up next session.
2. **Version** — current `index.html` version + sw.js version.
3. **Detail** — point to the most recent `Golf/SESSION-YYYY-MM-DD.md`.

This is the last step of every session. It costs two minutes and means the next session starts in the right place without hunting through notes.

---

## Footer Nav & Contextual Content System

**Decided 2026-05-04.**

### Concept
Replace the placeholder stats sliders in the Home screen footer with a utility nav zone. Extend this footer pattern to all non-Hole screens (Front 9, Back 9, Save Round). Hole screens keep their stats-only footer — no nav links mid-round.

### Footer Nav Links (cached resources only)
Links must point to cached or locally-computed content only. No live internet required. Candidates:
- **Pro Tips library** — small JSON, cache once, serve forever
- **Penalty Rules** — quick-reference, highly cacheable
- **R&A Quick Reference** — not the full rulebook (too large), but a curated 15–20 rules for casual play
- **Game Formats** — rules of play for Match Play, Best Ball, Wolf, and other common formats; cacheable reference, useful mid-round
- **Diagnostics / Analytics** — jump to Dashboard (local data, pre-computed)

### Contextual Message Area (Stage — Home screen)
Player name at top. Below it: a dynamic message slot fed by cached or localStorage content. One pattern, multiple content types:
- Pending round notices ("You have an unposted round from May 3 — Repost | Discard")
- Randomly surfaced analytics ("Good job — you've been hitting more GIR this month")
- Pro tip of the day
- Seasonal or motivational messages

### Why cached-only matters
PWA is offline-first. Tapping a footer link mid-session risks navigating away from an active round. Cached-only resources load instantly with no network dependency and no risk of losing round state. Once the offline queue is built (round state persisted to localStorage), navigation away from non-Hole screens becomes safe regardless.

### Build order
1. Offline queue first — makes localStorage the safety net for round state
2. Footer nav framework — Home screen first, then extend to non-Hole screens
3. Content population — Pro Tips JSON, Penalty Rules, analytics snippets

### Relationship to offline queue
The contextual message area and the offline queue are the same slot on the Home screen Stage. The queue notice is just one content type. Build them together.
