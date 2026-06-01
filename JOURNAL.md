# JOURNAL — Golf

*Append-only session log. Newest entries at the top.*

---

## 2026-06-01 — Session 17 continued — Skin refinements + Global Rules

### Skin fixes shipped this session (v10.57–v10.61)
- Bottom safe area green bleed: body→white (v10.57, reverted), then .screen{bg:skin-bg} (correct fix)
- Masthead top safe area: .masthead{bg:skin-primary} explicit — body stays green
- Footer zone: bg→skin-bg; nav buttons bg→skin-bg (blend with footer, not white)
- Footer icons: 22px→25px (Apple HIG tab bar spec)
- Nav grouping: justify-content→center, gap tightened
- Home screen: page-title→"Home Course", player chip removed, "START ROUND"→"START"
- Hole screen header-lower: bg→skin-bg to match stage

### Pending (not yet pushed)
- v10.62 / SW v135: header-upper margin-bottom:0 fix for Settings offset

### Global Enforcement Rules written
- 7 rules added to CLAUDE.md governing all future development
- Core principle: shared.css and shared.js are the single source of truth; no shared-zone styles in local files

### Queued for next session
- Push v10.62 / SW v135 and verify Settings offset resolved
- Audit settings.html + courses.html local style blocks against enforcement rules
- Remove player chip from Hole screens
- Add page-title to Courses screen
- Divider/rule line audit (one at a time, Paul to decide)
- Dashboard metric list + chart-type mapping (no code until agreed)

---

## 2026-06-01 — Session 17 — Spring Green skin implementation

**Version:** v10.56 / SW v129

### Files changed
- `shared.css` — Spring Green skin block appended (~116 lines). Skin tokens, system font, stage bg (#f5f4f0), section headers, page-title/page-subtitle classes, masthead breadcrumb (white 13px 700), header-lower hidden globally (utility screens), hole/stats header-lower re-enabled with white bg + green text + negative margin bleed, footer (white, border-top, green icons, fnav-label, bold active), setup-course-card updates.
- `shared.js` — `renderFooterNav()` updated to include `.fnav-label` spans. `markActiveFooterBtn()` added — marks active nav button on DOMContentLoaded based on `data-page-id` or pathname. `APP_VERSION` bumped v10.55 → v10.56.
- `settings.html` — Google Fonts link removed. `<div class="page-title">Settings</div>` added as first element in stage-scrolls. Comment version bumped v1.9 → v1.10.
- `index.html` — Google Fonts link removed. `<div class="page-title">Home</div>` added to `#screen-setup` stage-scrolls.
- `sw.js` — Cache name bumped golf-scores-v128 → v129. Google Fonts URL removed from ASSETS array.

### Engineering:debug audit results
- One bug found and fixed: duplicate `page-title` div injected into `#screen-stats` by overly broad string replacement — removed.
- All other findings were acceptable (DM Sans fallback graceful, courses/onboarding unaffected, active footer marking logic verified).
- Verdict: clean revision.

### Spring Green skin implementation notes
- header-lower on utility screens suppressed via `display: none` in skin block — breadcrumb provides orientation context
- Hole/stats screens keep header-lower with white background and green text (hole number + par/yds)
- Full-bleed achieved via `margin: 0 -20px` on header-lower cancelling masthead's 20px horizontal padding
- Footer now white with border-top; all icons green (#377f09); labels added below icons; active = bold label
- Stage-scrolls background changed from white to #f5f4f0 (Spring Green skin-bg) across all screens

### Next session
- Push to GitHub
- Visual QA on device (or screenshot)
- Dashboard metric list + chart-type mapping (still top priority)
- Apps Script: wire GPI + previous HI into post response for trend arrows
- settings.html STROKES GAINED second paragraph still needs writing

---


## 2026-05-27 — Sheet cleanup + TotalStrokesGained rename + Apps Script deploy

**Session type:** Data cleanup + rename + deployment. No UI code changes.

### What was done

**Google Sheets — all dummy data removed**
- All three data tabs (Rounds, Diagnostics, Round_Meta) cleared of test/dummy records.
- Dummy records identified by epoch dates (1899-12-31, 1900-01-01) and cross-referencing Paul's no-golf days (Mon/Thu/Sat).
- May 18 Mt. Paul entry (score 63) confirmed as bad test data (Paul's actual scorecard: 47+39=86) — deleted.
- Eaglepoint and Valley Golf Centre entries removed (Eaglepoint last played fall 2025; Valley GC tournament May 30, no scores to enter yet).
- All three tabs now header-only and ready for real data entry.
- Paul has April 2026 scorecards to enter — not just from May 10 onward.

**Column S rename: TotalStrokesLost → TotalStrokesGained**
- Diagnostics tab column S header updated in-sheet.
- `apps-script.gs` updated — all 4 instances replaced (comment line 47, `diagnosticsHeader_()` array line 74, comment line 693, `avg()` call line 920, email template line 953).
- Rename done with `replace_all: true` in Edit tool — confirmed zero instances of old name remain.

**Apps Script deployed**
- Full updated script written to clipboard via `write_clipboard`.
- Paul pasted into Apps Script editor (Cmd+A → Cmd+V → Cmd+S) and deployed new version via Deploy → Manage deployments → New version.
- `/exec` URL unchanged — no changes needed in `index.html`.

### Open items
- Paul's April 2026 scorecards ready to enter via Add Scores in the Golf PWA.
- Dashboard deep dive deferred to next session (per 2026-05-27 planning entry above).


## 2026-05-22 — Stage Area shift fixed; footer overrides removed (v10.8 / SW v85)

**Session approach — new standing rule:**
Diagnose and discuss first, agree on a plan, then implement. No code written until the problem is understood and the fix is agreed upon. This rule was established this session after a premature fix was written and had to be rolled back.

**Problem diagnosed:**
The Stage Area was inconsistent in height and position across screens — most visibly when advancing from Enter Score (`#screen-hole`) to Enter Stats (`#screen-stats`), and on the Courses screen. The 5-zone template (locked 2026-05-12, PROJECT.md) was never fully migrated in `index.html`.

**Root causes identified (via discussion, not assumption):**
1. `margin-top: 12px` had been copy-pasted onto all local content area classes from a one-off Add Scores fix (2026-05-13). Not part of the zone spec — green body shows through transparent masthead/footer as the frame, not a gap.
2. Local content classes (`.setup-body`, `.score-section`, etc.) used `flex: 1 0 auto` (flex-shrink: 0) while `.stage-scrolls` used `flex: 1 1 auto` — inconsistent elastic behaviour.
3. `courses.html` had a local `.stage-scrolls` override adding `margin-top: 12px`.
4. `index.html` had a legacy local `.footer` override with `min-height: calc(220px + safe-area)` — leftover from the old stats-in-footer design. A per-screen reset rule patched most screens but `#screen-course` was missing from the list.
5. `courses.html` had a local `.footer` override with non-standard padding, making its footer a different height than Settings and Scores.

**What was changed:**

`shared.css` (SW v83):
- Zone 2 updated — `.stage-score` added (`flex: 0 0 auto`); `.stage-scrolls` unchanged. Both zones documented as flush with no gaps.

`index.html` (SW v83, v84, v85):
- All local content classes: `flex: 1 0 auto` → `flex: 1 1 auto`; `margin-top: 12px` removed
- `.as-body`: `margin-top: 12px` removed
- Legacy 220px local `.footer` override removed entirely
- Per-screen footer reset block removed (was only needed to counteract the 220px override)

`courses.html` (SW v84, v85):
- `.stage-scrolls` local override: `margin-top: 12px` removed
- Local `.footer` override removed entirely

`shared.js`:
- `APP_VERSION` bumped v10.7 → v10.8

`sw.js`:
- Bumped v82 → v83 → v84 → v85

**Result:**
Stage Area is now consistent in height and position across all screens. Footer height is governed solely by shared.css on all pages. Settings, Courses, and Scores all look identical in zone proportions.

**Next session:**
Masthead tightening — review upper and lower masthead zones for height, spacing, and visual balance.

---

## 2026-05-14 — Apps Script refactor: Post / Diagnose / Rebuild separated (apps-script.gs)

**Did:**
- Refactored Diagnostics logic — three concerns now cleanly separated:
  - `appendDiagnosticsRow_(ss, roundId, hi)` — new function, appends ONE row per completed 18-hole record. Called by `doPost` only when a record is complete (full 18 or paired widow). Never called for pending 9-hole rounds.
  - `buildDiagnostics_(ss)` — full rebuild, manual utility only. Now reads `hi` from Settings internally (was incorrectly relying on outer `doPost` scope — silent bug when called from `rebuildDiagnostics()`).
  - `rebuildDiagnostics()` — unchanged, manual Script Editor call only. Run after deploy or HI change.
- `doPost` flow now: Post 18 → append one Diagnostics row → count → report trigger. Post 9 + widow → pair → append one row → count → report. Post 9 + no widow → Diagnostics untouched.
- `setup()` updated to migrate Rounds header — adds missing column labels without touching data.
- Rounds sheet cols 16–18 (Pending, Pairing_ID, Round_Type) added via Claude in Chrome.
- Deployed as new version. Execution successful.

**Files changed:** `apps-script.gs`

---

## 2026-05-14 — 9-hole widow/pairing feature shipped (v9.63 / SW v42) — reconstructed from code

**Note:** Journal entries for v9.40–v9.62 were not written during the sessions that built them. This entry is reconstructed from code inspection.

**Stats screen (screen-stats) — 2-step per-hole flow:**
- New screen between score entry and next hole: hole number + score badge in masthead; FIR/GIR/PEN/UD/X-UD toggles + PUTTS counter in stage
- `showStatsScreen()`, `statsBack()`, `statsNext()` → `advanceHole()`
- Skipped entirely in `historicalMode`

**Add Scores screen (screen-add-scores) — historical round entry:**
- Date picker, course selector (defaults to Mt. Paul), tee selector, 9/18 toggle for 9-hole courses
- `initAddScoresScreen()`, `asOnCourseChange()`, `startHistoricalRound()`
- Sets `state.historicalMode = true` — stats screen hidden, date overridden from picker

**9-hole widow/pairing — client:**
- Continue ↔ Post Now toggle on Front 9 scorecard; toggles NEXT button between `continueToBack9` and `postFront9`
- `postFront9()` — trims state to 9 holes, stamps `pairingId` (UUID), sets `pendingRound = true`, calls `submitRound()`
- Rain-out safety confirmed: incomplete Back 9 discarded client-side on Back → POST, never reaches server

**9-hole widow/pairing — Apps Script:**
- Rounds schema: added Pending (col 16), Pairing_ID (col 17), Round_Type (col 18 — Home/Local/Away)
- Widow logic in `doPost`: find oldest pending row → pair (renumber holes 10–18, reassign Round_ID, clear Pending both halves) or store as new widow
- Diagnostics only written on completed 18-hole records (direct or paired)

**Verified:** Solo 9-hole round posted end-to-end successfully (2026-05-14).

**Files changed:** `index.html`, `shared.js`, `sw.js`, `apps-script.gs`

---

## 2026-05-13 — v9.58: button and display polish

**Did:**
- START ROUND → all-caps
- Player name on Setup: green pill removed, plain bold text

**Files changed:** `index.html`

---


## 2026-05-12 — UI polish + phone formatter (courses v1.3, index v9.39)

**Did:**
- courses.html phone field: `type="tel"` → `type="text"` (regular iOS keyboard); `formatPhone()` auto-dashes 10/11-digit numbers on blur and on Save
- ADD COURSE button: replaced custom `lib-add-btn` with full-width `btn-3d` (proper 3D shading)
- screen-basics nav: App (grey) → BACK (green) + Hole Data → NEXT; both green, all-caps; BACK goes to library via `goToLibrary()`
- screen-holes nav: Back → BACK, Save Course → SAVE COURSE; both green
- Breadcrumb: dynamic — "Courses: Add" / "Courses: Edit" set via `setEditMode()`; edit mode title shows course name
- Removed redundant Saved Courses section from screen-basics (library screen handles it)
- index.html: Start Round → START ROUND
- index.html: Player name display — removed green pill, now plain bold text on white stage
- Committed and pushed: v9.39 / courses v1.3

**Files changed:** `courses.html`, `index.html`

**Next session:** Add Scores screen — repurpose hole screens for historical round entry (date picker + course selector + tees entry step)

---

## 2026-05-12 — index.html migrated to shared.js (Step 4+5 complete)

**Did:**
- Bumped to v9.38
- Added `<script src="shared.js"></script>` in head
- Removed inline `showPanel()` — shared.js provides it now
- Added `window._handlePanel` override: intercepts `add-scores` to call `initAddScoresScreen()` + `showScreen()`; returns false for all others (shared.js handles)
- CSS: `.hu-course` → `.hu-breadcrumb` (canonical name)
- CSS: `.fnav-btn` color `rgba(255,255,255,0.75)` → `var(--yellow)` (matches courses.html)
- HTML: all 6 non-hole screen footers (setup, add-scores, midround, card, success, course-select) replaced hardcoded `footer-grid + footer-nav-grid` blocks with `<div class="footer" data-nav></div>`
- Hole screen footer: left intact — stat sliders (FIR/GIR/PEN/UD/X-UD/PUTTS) still functional, migrates when stat screen is built (Step 6)
- All `hu-course` class attributes renamed to `hu-breadcrumb` across all 7 screen mastheads

**Files changed:** `index.html`

**Template migration complete.** shared.js is the single source of truth for footer nav across all pages.

**Next build queue item:** Add Scores screen (repurposes hole screens for historical round entry)

---

## 2026-05-12 — courses.html migrated to 5-zone template (Step 2)

**Did:**
- Bumped to v1.2
- Added `<script src="shared.js"></script>` in head
- CSS class renames to canonical set: `hu-left` → `hu-breadcrumb`, `hu-right` → `hu-weather`, `hu-dur` → `hu-duration`, `hl-title` → `header-lower-title`, `.stage` → `.stage-scrolls`
- Footer CSS: white background → transparent (green body shows through)
- Added `.footer-nav-grid` and `.fnav-btn` (yellow) CSS
- All 3 screen footer divs: added `data-nav` attribute — shared.js auto-renders nav on DOMContentLoaded
- Removed advisory text from holes screen footer ("Par required · Yardage & SI optional")
- HTML class attributes updated throughout to match canonical names
- No JS logic changes — all existing functions intact

**Files changed:** `courses.html`

**Next:** Migrate `index.html` — one screen at a time, hole screen last

---

## 2026-05-12 — shared.js built (Step 1 of template migration)

**Did:**
- Created `shared.js` — v1.0, Golf PWA shared utilities
- `NAV_LINKS` — single source of truth for all 8 footer nav links (Settings, Add Scores, Pro Tips, Penalty Rules, Quick Rules, Game Formats, My Stats, Courses)
- `showPanel(name)` — universal handler; checks `window._handlePanel` override first, then handles cross-page navigation (courses.html, index.html), then stub alerts for unbuilt panels
- `renderFooterNav(el)` — writes 4×2 grid into any element; used via `[data-nav]` attribute auto-init or called directly
- `renderMasthead(el, opts)` — writes canonical 5-zone masthead HTML (breadcrumb, weather, date, duration, title, subtitle) with optional IDs for live JS updates
- Auto-init on DOMContentLoaded: finds all `[data-nav]` elements and renders nav into them
- Added `/shared.js` to SW cache ASSETS list; bumped SW to v34
- CSS contract documented in shared.js header comment block

**Files changed:** `shared.js` (new), `sw.js`

**Next:** Migrate `courses.html` to 5-zone template (Step 2) — add `<script src="shared.js"></script>`, wire `[data-nav]` footer, replace masthead HTML with `renderMasthead()` call, update CSS class names to canonical set

---

## 2026-05-09 — Onboarding screen + session init improvements

**Did:**
- Built `onboarding.html` — two-step wizard (masthead only, white stage). Step 1: first name (6 char max) + report email (kamloopspaul@live.ca). Step 2: Apps Script URL + home tees (Blue/Red) + optional HI. Writes `localStorage.profile` on completion, redirects to `index.html`.
- Wired first-run detection into `index.html` — redirects to `onboarding.html` if `profile.setupComplete` is missing.
- Replaced all hardcoded values in `index.html`: player name "Paul" (4 locations), `SHEETS_URL`, `HI = 20`, `teeKey = "mensBlue"` — all now read from `PROFILE` constant.
- Bumped SW to v30 — `onboarding.html` added to cache list.
- Discussed and resolved architecture: personal tool only, no multi-user, no Stripe, no OAuth complexity. Planned `settings.html` and `contact.html` as future additions.
- Session init protocol fixed — CLAUDE.md, TODO_LIST.md, .claude-config now load correctly at session start. Init test ("Banana Pie") completed and removed from .claude-config.
- CLAUDE.md updated: GitHub Desktop noted as fallback to Terminal for pushes.

**Decided:**
- App is a personal tool — no open-market release planned. Kamloops fork option shelved.
- `onboarding.html` is first-run only; `settings.html` (future) handles ongoing preferences.
- `contact.html` (future) — subject/body form posting through Apps Script to hide gmail address from scrapers.
- No print option — physical scorecards fill that role.
- Prompt injection mitigations planned for all new free-text fields: sanitize on input, validate URL prefix, strip formula-injection characters before Sheets write.

**Files changed:** `onboarding.html` (new), `index.html`, `sw.js`, `JOURNAL.md`, `PROJECT.md`, `TODO_LIST.md`, `CLAUDE.md`

**Next session:** Test onboarding.html on live app, then pick a footer nav panel — Settings or Add Scores.

---

## 2026-05-04 — v9.28–v9.30: Title cleanup, 320px width, offline queue

**Did:**
- **Title cleanup (v9.28):** Renamed all screen titles for clarity and width — "My Golf Scores" → "Score Card" (Home + `<title>`), "Front 9 Score" → "Front 9", "Final Score" → "Back 9", "Round Saved" masthead → "Save Round" (consistent across success + failure paths), "Select Course" → "Score Card". Body max-width 430px → 320px.
- **Offline queue shipped (v9.29):** On post failure, full round payload now written to `localStorage.pendingRounds[]` with `savedAt` timestamp. On `showScreen('setup')`, `checkPendingQueue()` runs automatically. Dev: Simulate Failure button updated to also write a fake round to the queue for testing.
- **Queue UX refined (v9.30):** Yellow banner in Stage area shows count-based message — "You have N round(s) that need posting." Button label switches: **Post** (1 round) or **Post All** (2+ rounds). Post All loops queue sequentially, posts oldest first, updates progress live ("Posting 2 of 3…"), stops and reports on first failure. **Ignore** dismisses yellow banner and replaces with a quiet pale strip: "Post when internet is available." Discard removed from banner — too destructive for a casual tap.
- **Footer nav + contextual content system designed and logged in PROJECT.md.** Offline queue, footer nav links (Pro Tips, Penalty Rules, R&A Quick Reference, Game Formats, Diagnostics), and Home Stage message area established as a unified content slot pattern.

**Decided:**
- "Discard" renamed "Ignore" — less alarming at the first tee, data is never lost on tap.
- Post All is conditional: only shown when queue has 2+ rounds. Single round shows "Post".
- Footer links must be cached-only resources — no live internet required, safe for mid-round reference.
- Hole screens keep stats-only footer — no nav links mid-round to prevent accidental navigation away from active round.
- Quiet reminder strip replaces yellow banner after Ignore — low urgency, right tone for standing on the first tee.

**Next:**
- Delete dev buttons before any public sharing
- Record Stats toggle on Setup
- Player Profile screen (name, home tees, HI)
- Post Screen exit flow — Done → Home
- App icons — icon-192.png, icon-512.png
- Footer nav framework build

---

## 2026-05-04 — Housekeeping: Golf moved into Projects/

**Did:**
- Reviewed all path/repo references before moving the folder.
- Moved `Studio/Golf/` → `Studio/Projects/Golf/` via Terminal `mv`.
- Updated `CLAUDE.md` (cd path + folder structure diagram).
- Updated `TODO_LIST.md` (3 Golf path references).
- Updated `PROJECT.md` local folder path.
- GitHub repo, GitHub Pages URL, and all app code unaffected.

---

## 2026-05-03 — v9.27m: Failure state ⓘ info button shipped

**Did:**
- Removed placeholder guard from `submitRound()` (dead code from early dev).
- Success path: masthead title swaps "Save Round" → "Round Saved"; h2 shows "Posted".
- Failure path: masthead swaps to "Round Saved"; h2 shows "No Internet service. Try again later." (smaller, unbolded, `.success-title-error` class). Both paths reset cleanly on re-trigger.
- **Shipped ⓘ info button on failure state (v9.27m):** `position: relative` on `.header-lower` globally. `.masthead-info-btn` — 24px circle, white bg, green border, hidden by default, shown on failure. `.masthead-info-overlay` fills `header-lower` via `inset: 0`, pale green bg. Overlay message: NO INTERNET SERVICE / ROUND SAVED / POSTING YOUR SCORE. Outside-click dismissal via `toggleMastheadInfo()`. ✕ close button reuses `.stats-help-close` style.
- Dev button added to Home screen: "⚙ Dev: Simulate Failure" — triggers failure UI directly. DEL before release.
- Pushed to GitHub Pages ✅

**Decided:**
- Failure title: "Saved locally" → "No Internet service. Try again later." — honest, plain language.
- ⓘ button lives in the masthead (header-lower), absolute top-right, failure state only.

**Next:**
- Offline queue — `pendingRounds[]` in localStorage (design agreed, code not written).
- Post Screen exit flow — Done → Home (discuss options before coding).
- Record Stats toggle, Player Profile screen, touch-target review, app icons.
- Delete dev buttons before release.

---

## 2026-05-02 — v9.27: BC courses added, GolfCourseAPI removed, UI polish

**Did:**
- Added 3 BC courses to `courses.json`: Bighorn, Meadow Creek (9-hole loop), Pineridge.
- `courses.json` sorted A–Z, IDs renumbered 1–12.
- **Removed GolfCourseAPI entirely** — app is now fully local-data-only. No API key needed, no 300-session limit concern.
- Success screen: stats "i" info overlay added (HI, Net Score, FIR, GIR, PEN, UD, X-UD, PUTTS). i + ✕ buttons: 24px circle, white bg, green border, bold green text.
- Hero cell wider: grid ratio 1fr/1fr/1fr/3fr.
- App max-width 430px on desktop, full-width on phones.
- Masthead height: 248px main / 170px small-screen — fixes PAR/YDS clipping.
- Browser layout fixes: `flex: 1 0 auto` on all stage elements, hole screen overflow rules.
- Discard Round button removed from Home screen ✅
- Dev shortcut added: "⚙ Dev: Jump to Post Screen" with fake data. DEL before release.

**Decided:**
- GolfCourseAPI dropped — local courses.json is the data source. Simpler, no external dependency.

**Learned:**
- Removing the API simplifies the whole architecture. 12 BC courses hardcoded covers Paul's real use case.

**Next:**
- Failure state ⓘ button (shipped next session, v9.27m).
- Offline queue design (agreed, not yet built).

---

## 2026-05-01 — Multi-course architecture design + GolfCourseAPI.com research

**Did:**
- Reviewed full project status at v9.24 post-ship.
- Researched GolfCourseAPI.com: free tier, ~30K courses, 300 session limit. API schema reviewed — hole-level data per tee set, CR/SR, GPS coords, male/female tee separation.
- Designed local cache schema (`localStorage.courseCache`): keyed by course ID, fetch once, cache permanently. Export/Import JSON as backup against Safari cache wipe.
- GPS gap workaround decided: build search-by-name first (Option B), GPS auto-detect later.
- 27/36-hole variations: `TeeBox.number_of_holes` detects multi-loop courses; app slices correct 18 holes.
- Agreed build sequence: API key → cache layer → Course Select screen → combination picker → wire CR/SR into Net Score math → GPS later.

**Decided:**
- Local-first, API fallback, manual entry as last resort. GPS deferred.

**Learned:**
- 300 free API sessions is not a real constraint with local-first caching. (Note: API subsequently removed entirely in May 2 session — fully local approach is cleaner.)

**Next:**
- Add BC courses to courses.json, remove API dependency (shipped May 2).

---


## 2026-04-30 — v9.24: iPhone polish + Setup redesign + multi-course architecture

**Did:**
- **Shipped v9.24** — all 4 iPhone hot-list items from the April 29 evening feedback:
  - Hero grid 15/15/15/55 → 20/20/20/40 (fixes right-edge clip on iPhone)
  - Hero `.ss-val` small-screen rule: 56px → 46px (matches 46px title scaling)
  - "Posted!" → "Posted" (drop exclamation mark)
  - Player name input → display-only span on Setup; `readPlayerName()` updated to read `.textContent`; `newRound()` reset updated; CSS `.player-name-display` added (green pill, pointer-events none)
- **Disabled Stage Manager** via Control Center (was parking non-active windows in a left sidebar, making split-window layouts impossible). Paul confirmed it was annoying him for a while.
- **Terminal orientation** — Paul getting comfortable with Terminal ahead of Claude Code. Covered: `pwd`, `ls`, `cd`, `git status/add/commit/push`, `-m` flag (keeps commit on one line, avoids vim), `open .` shortcut.
- **Setup screen redesign decided** — after working through every candidate toggle (Add Players, Record Stats, Select Tees, Diagnostics, Hole-in-One sound), landed on a clean two-element Setup: **Record Stats toggle + Start Round button**. Everything else moves elsewhere.
- **Add Players permanently retired** — reasoned through the complexity of per-player tee assignments, mixed gender groups, separate Sheets records, and concluded it reintroduces all the friction the single-player decision was meant to avoid.
- **Player Profile concept defined** — name (editable here, display-only on Setup), home tees, HI. Stored in localStorage. Accessible via a "Settings" link on Setup. Tee selection lives here, not as a per-round prompt.
- **Cheering.mp3** — stays as-is, Easter egg, not documented, no toggle.
- **HI with <20 rounds** — WHS scaling table approach: best 1 of 3, best 2 of 6, etc. Show "—" until round 3. No hardcoded seed.
- **Multi-course architecture designed:**
  - localStorage for 12–20 courses (~60KB, well within 5–10MB iOS Safari limit)
  - Export/Import to JSON file as backup against accidental cache wipe
  - Local-first, API fallback pattern: check cache → call API → manual entry
  - Each course fetched from API once, then cached permanently
- **Researched GolfCourseAPI.com** — free tier, ~30K courses, 300 session limit. API schema reviewed (openapi.yml downloaded to Golf folder). Fits our COURSE model well: hole-by-hole par/yardage/handicap per tee set, CR/SR, GPS coords, male/female tee separation. 300 calls goes far with local-first caching. Canadian coverage unconfirmed — needs API key test.
- **Tee recommendation feature** — warn if player's HI doesn't match selected tees. CH formula already live.
- **Commercial angle** — GPS auto-detect course, course DB APIs (GolfAPI.io at 42K courses, Golf Intelligence for verified data). Free tier sufficient for personal/beta use. Paid tier consideration deferred until traction.

**Decided (new locked):**
- Add Players permanently removed. No revisiting.
- Setup = Record Stats toggle + Start Round. Clean and focused.
- Player Profile replaces editable name on Setup. Tee selection lives there.
- Cheering.mp3 is an Easter egg. No toggle.
- Multi-course: local-first, GolfCourseAPI.com as fallback, manual entry as last resort.
- HI <20 rounds: WHS scaling, "—" until round 3.

**Learned:**
- Stage Manager (com.apple.WindowManager) was confirmed active and dismissed via Control Center click. Terminal granted at "click" tier — typing/keypresses blocked, so Escape key couldn't be sent; used title bar click to dismiss Control Center instead.
- GolfCourseAPI.com openapi.yml confirms hole-level data (par, yardage, handicap/stroke-index) per tee set, which is exactly what our COURSE model needs. The male/female tee separation is a bonus that handles mixed groups cleanly.
- localStorage course data is ~2–3KB per course. 20 courses = ~60KB. Storage is not a concern. The real risk is accidental Safari "Clear Website Data" wipe — Export/Import JSON is the mitigation.
- 300 free API sessions sounds tight but with local-first caching, most players would consume <10 calls in their lifetime (one per new course discovered).

**Next:**
- Record Stats toggle on Setup (build it, persist in Player Profile)
- Player Profile screen (name, tees, HI — localStorage)
- GolfCourseAPI.com: register for API key, test Kamloops/Mt. Paul search to confirm Canadian coverage
- Remaining open items: title swap "Save Round" → "Round Saved" (yellow), offline queue / outbox, failure screen 'i' overlay, tee selector, touch-target review, remove Discard Round button, app icons

---

## 2026-04-29 (evening) — v9.23 ship: single-player + Save Round refactor + Mt. Paul ratings live

**Did:**
- **Removed multi-player UI entirely** (decided yesterday, executed today). Setup screen has a single editable name input pre-filled "Paul". Net −68 lines of code in `index.html`. `state.players` stays as a single-element array so all downstream scoring/posting/summary code is untouched.
- **Refactored Save Round summary** per Paul's spec. Grid is now 4 cols × 2 rows with col 4 hero spanning both rows. Widths 15/15/15/55. Hero shows **Actual Score (gross)** at 56px with fine-print sub-line `HI: 20 | Net Score: 70` below. Stats cells: FIR/GIR/PEN row 1, UD/X-UD/PUTTS row 2. Replaces the old Front/Back/Total + 4-stat dual-row layout.
- **Mt. Paul ratings now live in `COURSE.ratings`** (mensBlue/mensRed/ladiesBlue/ladiesRed, each `{cr, sr}`). Added `COURSE.par = 64`. Multi-course architecture ready — Kamloops GC and others extend the table without schema changes.
- **Net Score wired inline.** New `courseHandicap(hi, teeKey)` helper applies the WHS formula. `renderSuccessSummary()` computes Net = Gross − round(CH). HI 20 and `mensBlue` are hardcoded for now (TODO: read from Settings tab once onboarding is wired).
- **PROJECT.md updates:** v9.22 → v9.23, multiple Open Items closed (Player Entry removal, Front|Back|Total row removal, stats-summary built), "Save Round as receipt" design thread updated to capture the synthesis (gross hero + analytical fine print, not no-hero).
- Two commits today (`83c5e35` from this morning's design pass + `88517fe` for v9.23 implementation), both published.
- **Captured post-publish iPhone feedback** as a "Hot list" subsection at the top of Open Items: non-editable Setup name (with name capture moving to install/onboarding), drop "!" from "Posted!", hero width 55% → 40% (was clipping the stage right edge on iPhone), match hero font to page title sizing.
- **New Consideration captured:** "Track Stats Too?" toggle on Setup screen. Gives Setup a real job now that Player Entry is gone, and resolves the "what's the Setup button on Hole 1 actually for" question. If No → hole-screen footer stays empty (casual mode). If Yes → footer sliders are live.

**Learned:**
- 55% hero clipped the stage edge on iPhone. Designing at desktop widths in claude.ai-themed mockups underestimates the proportional weight on a 390px viewport. Next time, mock at iPhone width specifically.
- Hero font 56px vs page title 46px (small-screen) is a mismatch — the hero is bigger than the title on small screens. Either both should follow the same media-query scaling, or the hero needs an explicit small-screen rule. Worth adding to the "small-screen" CSS group.
- `node --check` on the inline JS (extracted from `<script>`) is a fast confidence check between edits — caught one syntax issue early in the refactor.
- Iterative-thinker move in real-time: "no hero" (yesterday's reframe) → "Actual Score hero with HI/Net fine print" (today's synthesis). The receipt framing didn't get abandoned, just refined to include a small analytical sidebar inside the receipt.

**Next:**
- Hot list (UI polish): non-editable name + name moves to install, drop "!" from Posted, hero 55→40%, hero font scaling.
- Make the Track Stats Too? decision and either build it or park it explicitly.
- Pending from prior sessions: title swap on success ("Save Round" → "Round Saved" yellow), failure-screen 'i' info overlay (still TBD wording), offline-queue / outbox build.
- Tee selector + Settings tab `Handicap` / `TeeSet` rows (unblocks the Net Score from its hardcoded HI 20 / mensBlue).
- Quick wins still pending: Settings `Home Course` value, remove Discard Round button, cleanup strays (`.test_write`, `manifest-v1.json`, `sw-v1.js`), app icons.

---

## 2026-04-29 — Stats summary design pass + handicap math + strategic reframe

**Did:**
- Picked up from yesterday's HANDOFF. Locked the stats-summary grid widths: **15/15/15/55** with Avg Score as the col-4 hero (Option A). Built styled mockups using the app's actual `--green-pale` / `--green` palette so the design isn't just a claude.ai-themed sketch.
- **UD label cleanup.** Standardized to `UD` / `X-UD` per the schema. Live changes: `U/D` → `UD` in the success-summary cell label (`index.html` line 781), and `U&D, 3-Putts` → `UD, X-UD, PEN, 3-Putts` in PROJECT.md's Phase 2 paragraph. Left the historical changelog/journal entries and the `apps-script.gs` migration code alone — those reference old labels for legitimate reasons.
- **Handicap math pass (real numbers, not theory).** Pulled the 2024 Golf Stats sheet via Drive MCP (62 rounds at Mt. Paul Mens Blue) and computed two HI estimates from the WHS formula: **HI ≈ 27** from the most recent 20 rounds (Aug 20 – Oct 4, late-season form drop) vs. **HI ≈ 20** from best 8 of all 62. Recommended HI 20 as the seed value. Course Handicap on Mt. Paul Blue from HI 20 = **10 strokes**.
- **Locked the math + ratings in PROJECT.md.** Course Handicap (CH) = HI × (SR/113) + (CR − Par), no 0.96 multiplier (retired post-2020 under WHS). Acronyms HI/CH spelled out inline so the doc is self-explanatory next session. Mt. Paul ratings table (Mens Blue/Red, Ladies Blue/Red) embedded; Paul will provide Kamloops GC and other courses as we go.
- **Server-side recompute design.** Apps Script reads last 20 rounds from Scorecard tab, averages best-8 differentials, writes to Settings. Returns updated HI in post-response payload. PWA caches in `localStorage.handicap` so Net renders even offline. No client-side counting needed — Sheet is the source of truth. Integrates cleanly with the offline-outbox pattern from yesterday.
- **Manual-mode dropped.** Decided the PWA's HI is unambiguously a personal/practical number — never claims to be an official Golf Canada / WHS handicap (those are paper-attested anyway, Sheets isn't an approved source). One auto behavior, no override mode.
- **Long teach-back on Net / Slope / Course Rating.** Paul wanted the mechanics in plain language. Walked through gross vs net, what Slope actually measures (relative-difficulty gap between scratch and bogey), what Course Rating measures (scratch's expected score), and how both feed into CH at two points (computing HI from a round, and converting HI back to a course-specific stroke allowance).
- **Hero-cell strip design.** HCP 20 · TYP +6 · Δ. Paul liked it, picked red-for-bad / dark-green-for-good color scheme (avoids the "minus = good" confusion). For players with <20 rounds, show "N/A (Less than 20 Rounds entered)".
- **Strategic reframe.** After designing the whole Net-Score-as-hero scheme, Paul stepped back: most casual golfers don't think in net terms. Diagnosis they already feel after a round. What they don't know is whether they're improving. **Save Round = receipt; Dashboard = progress tracker.** Net Score moves to the Dashboard. Save Round hero options now: bare Total, score-to-par, or no hero (3×3 equal grid).
- **Two new Open Items.** *Remove Player Entry on Setup screen* (single-player focus) and *Remove Front|Back|Total row from Save Round summary* (redundant with the Final Score screen the player just left).
- **Core Spec updated:** single-player app. Multi-player history preserved in the spec text but new direction unambiguous.
- **Bonus quick fix:** Hole 18 button "View Card" → "Next" (committed yesterday in `f6623af`, pushed today).

**Learned:**
- Paul's real 2024 baseline: HI ≈20 (capable Paul), HI ≈27 (late-season Paul). Big gap — form trailed off in the last 6 weeks of the season.
- WHS post-2020 dropped the 0.96 multiplier. Formula is just `mean(best 8 of last 20 differentials)`. Many older sources still mention 0.96.
- Mt. Paul is short *and* relatively forgiving (low CR, low SR) → CH shrinks for everyone. A 20-handicap gets 10 strokes here vs ~23 on a tougher regulation course. The math correctly punishes/rewards course difficulty.
- Iterative-thinker move: hero-cell design went Net → drop Net → "receipt" framing in one conversation. Decisions carry forward without re-litigation; we don't lose the handicap research, it just powers Dashboard now.
- Paul's process for self-diagnosis: greens back to tee. Putting improved (lags closer, fewer 3-putts), approach play needs work (UD vs lay-up for higher GIR), driving recovered after slice correction. He knows his weaknesses. What he doesn't know is rate of improvement, current handicap, or whether he's improving at all. **That's the Dashboard's actual job-to-be-done.**

**Next:**
- Pick the Save Round hero: bare Total, score-to-par, or no hero (3×3 equal grid). Likely no hero — fits "receipt" framing best.
- Confirm grid layout after removing Front|Back|Total row.
- Failure-screen copy + 'i' overlay wording (still pending from yesterday).
- Offline-queue / outbox build (still pending from yesterday).
- Player Entry removal — touches Setup screen markup, player-list management code, "Add Player" button.
- Update `Studio/Dashboard/PROJECT.md` with the progress-not-diagnosis reframe (next time Dashboard is the active project).

---

## 2026-04-28 — v9.22: 2-row lower header + design pass on offline / failure screen

**Did:**
- **v9.22 shipped + pushed.** Restructured the Header Lower into a 2-row strip used by every screen — top row 86/74px holds title-or-hole-number; bottom row 38/32px holds the PAR | YDS strip on Hole screens, empty on the other four. `min-height` on the empty bottom row holds it open instead of the old `<img>` shim or padding-math kludge. Removed superseded `.hole-top-row` / `.hole-left` / `.hole-right` rules. SW bumped to v26. Visual confirmed by Paul on iPhone post-push: titles are fixed in place across all screens.
- **Hole 18 button**: "View Card" → "Next" (one-line change to the ternary in `nextHole()`).
- Built `_header-preview.html` — standalone side-by-side mockup of all four header states with dashed alignment guides. Untracked scratch file. Skipped Chrome MCP verification (extension wasn't connected this session).
- Memory consolidation: updated PROJECT.md (status, Header Lower component, Component Guidelines, Locked Decisions, refined Stats Summary spec, added two new open items). Wrote live HANDOFF for next session. Retired stale `Studio/SESSION_HANDOFF.md` (April 17, superseded by `Claude/HANDOFF.md` architecture).

**Decided (uncoded — for next session):**
- **Stats summary grid**: 4 cols × 3 rows, col 4 spans all 3 rows. 15% / 15% / 15% / 55% (Avg Score as the hero number). Front/Back/Total · FIR/GIR/PEN · UD/X-UD/PUTTS. Replaces the `<h2>Posted!</h2>` — title swap instead.
- **Title color**: success → "Round Saved" in yellow; failure → white copy. Color carries the meaning so no extra status text needed.
- **Offline-queue is a queue, not overwrite.** `localStorage.pendingRounds[]` array. Boot-banner on Setup if non-empty. KISS v1, no SW Background Sync (iOS Safari doesn't support it).
- **Failure screen 'i' overlay**: small circular info icon opens a layered message. First-time users get the explanation, returning users dismiss. Wording TBD next session.
- Honest current-state diagnosis: today's "Saved locally" label is a lie — nothing is actually persisted on post failure. Round data lives only in `state` until JS process dies. Outbox pattern fixes this properly.

**Learned:**
- `min-height` on a row is the modern CSS-native equivalent of the old transparent-pixel shim. One line, no markup hack.
- iOS Safari + PWA: tabs background and may be evicted under memory pressure. Any unposted round in memory is at risk. The fix is durable storage, not better UX copy.
- Service Worker Background Sync API would auto-retry posts when network returns, but iOS Safari doesn't support it. Manual repost button is the realistic path for this audience.
- Author identity in the sandboxed git: defaults to `modest-eloquent-volta@claude.(none)`; need to either set `user.name`/`user.email` per-repo or amend with `--reset-author` to match Paul's existing commits (`kamloopspaul-a11y <kamloopspaul@gmail.com>`).

**Next:**
- Pick the implementation order: stats-summary + title swap first (cosmetic, low risk), then the offline-queue + 'i' overlay (functional, more design).
- Confirm column widths (15×3+55 vs 20×3+40) before building the grid.
- Define exact failure-screen copy + 'i' overlay wording.
- Quick wins still pending: Settings `Home Course` → "Mt. Paul", remove Discard Round button, clean up `.test_write` / `manifest-v1.json` / `sw-v1.js` strays.

---

## 2026-04-26 — Memory architecture stand-up + Golf consolidation

**Did:**
- Stood up the new Tier 2 memory architecture across `Studio/`. Globals live in `Studio/Claude/` (INSTRUCTIONS, CLAUDE-ENV, HANDOFF, README, templates); per-project memory lives in each project folder as PROJECT.md + JOURNAL.md.
- Added `HANDOFF.md` to the architecture as a transient global file — overwritten when the session is running long, cleared on resume. Read first at session start.
- Scaffolded PROJECT.md + JOURNAL.md in Dashboard, Health, Trading. Renamed `Trading/PROJECT_DIRECTIVE.md` → `Trading/PROJECT.md` for consistency. Health's existing PROJECT.md left untouched.
- Migrated Golf onto the new system. Consolidated 7 redundant memory files (CLAUDE.md, START-HERE.md, PROJECT-v9.md, REDESIGN-PLAN.md, three SESSION_* files) into PROJECT.md + this JOURNAL.md. Net: Golf goes from 11 .md files to 4.
- Promoted the dashboard data-source decisions (2024 sheet as live source during dev, demo-mode toggle, `getScores()` abstraction) from old session notes into `Studio/Dashboard/PROJECT.md`.
- Promoted project-agnostic sandbox workarounds (EPERM fallback to bash, `.git/*.lock` recovery, `allow_cowork_file_delete` for rm errors, github.io firewall) into global `Studio/Claude/CLAUDE-ENV.md`.
- Established the trigger phrase `"organize memories"` → invokes the `consolidate-memory` skill for housekeeping.
- Set the standing session-start workflow: Paul connects `Studio/` and names the active project; Claude reads INSTRUCTIONS → CLAUDE-ENV → HANDOFF → PROJECT → JOURNAL.

**Learned:**
- Memory housekeeping is most effective at session boundaries — easier to spot what's stale once the work is done.
- The "next session" lists in START-HERE and PROJECT.md had drifted out of sync by one day; reconciling caught a couple of items already shipped.
- A global HANDOFF.md works better than per-project handoffs because Paul connects Studio at session start and the handoff itself names the active project.

**Next:**
- Pick a polish task: stats summary on Posted! screen, tee selector (Blue + Red), touch-target review (`.putts-btn`, `.switch`).
- Quick wins: change Settings `Home Course` to "Mt. Paul", remove Discard Round button, create app icons.
- Tangential cleanups noticed in Golf/: stray `.test_write` file; `manifest-v1.json` + `sw-v1.js` look superseded by `sw.js`.

---

## 2026-04-25 — iPhone PUTTS bug + elastic-stage layout refactor (v9.12 → v9.21.1)

**Did:**
- Diagnosed and fixed an iPhone-only rendering bug where the PUTTS row was missing because `.screen` had `overflow: hidden` and the footer's intrinsic height pushed PUTTS into clipped territory.
- Refactored layout architecture: masthead fixed, stage elastic (`flex: 1 1 auto`), footer content-sized with `min-height: calc(220px + safe-area-bottom)`. Visual parity restored across all 5 screens.
- Hardened cross-device font fallback chain: DM Sans + system fonts. Locks out Comic Sans even if Google Fonts blocked.
- Hole header redesign: number on top (64/52px), PAR below in centered column, YDS inline on right. Number white, value-first/label-after styling.
- Title font on non-hole screens bumped to 56/46px to match hole-num visual mass. "Round Saved" → "Save Round". "Final Round Score" → "Final Score" (so it fits at 46px).
- Bottom-row min-height unified at 86/74 across all five screens. SW bumped to v25.

**Learned:**
- iOS Safari `100dvh` doesn't reliably exclude the bottom URL bar overlay in every state. Elastic-stage architecture sidesteps the question entirely.
- `?v=N` cache-busts work for HTTP cache but not SW cache hits — the only fix for sticky SWs is the SW strategy itself (network-first for HTML).
- "Headroom didn't change between padding bumps" was the smoking gun — the footer was being clipped by `overflow: hidden`, not under-padded.
- iPhone 15 Pro Max viewport ~700–750px in Safari. Small-screen rule (`max-height: 750px`) applies.
- iOS tracking-protection banner ("Reduce Protections") shows because `?v=N` query strings look like tracking params. Cosmetic only. Pre-launch, switch to filename-based cache-busting (`index-v912.html`) to silence it.

**Next:** *(captured in PROJECT.md Open Items)*

---

## 2026-04-24 — Sheets integration shipped (v9.8 → v9.10)

**Did:**
- Apps Script webhook live end-to-end. App posts real rounds to Apps Script `/exec` URL embedded at `index.html` line 652.
- Schema locked: Player column dropped (single-player-per-sheet), Year column added (derived from Date), Tees column added (hard-coded "Blue" for now). 3+ Putts flag replaced with a Putts counter (default 2) feeding a server-derived Score column (strokes − putts).
- Slider switches wired (FIR/GIR/PEN/UD/X-UD = 1/null toggles, PUTTS = counter). `state.stats` is an 18-slot array. Sliders on non-hole screens are unwired visual placeholders.
- Post Score spinner: tap → success screen with "Posting…" spinner → "Posted!" on webhook resolve, "Saved locally" on failure. No layout shift.
- 2024 historical CSV generated at `~/Documents/Studio/2024-migration.csv` — 62 rounds, dates normalized, Tees=Blue, Round IDs `2024-001`–`2024-062`, all Front/Back/Total sums verified. *(Imported to Sheets shortly after; CSV no longer needed and was deleted.)*
- Local folder renamed `golf-scores` → `Golf`. Remote repo name unchanged (live URL stable).

**Learned:**
- Stats tab header changes only take effect when Stats is empty. Header migrations require deleting the tab and posting a fresh round.
- Apps Script redeploys keep the same `/exec` URL — ship fast, iterate the handler freely.
- After folder rename, GitHub Desktop may need the repo re-added pointing at the new path.

**Next:** *(captured in PROJECT.md Open Items)*

---

## 2026-04-20

**Did:**
- Discussed PWA distribution friction: Google Sheets onboarding is too heavy for non-technical golfers (Google account, Apps Script deploy, OAuth warning, URL paste).
- Considered alternatives: localStorage (single-device only), pre-deployed Apps Script URL (still has OAuth warning), Airtable/Notion (join code), Supabase/Firebase (smoothest UX, more backend work).
- Settled on small rollout to golf friends first, Paul assists setup personally, pre-deployed Sheets URL + plain-English instructions as the pragmatic path.
- Seeded the white-label-SaaS / golf-academy business idea (later expanded in BUSINESS.md).

**Learned:**
- Anthropic AI Fluency completed. Clarified Claude models (Sonnet/Haiku/Opus) vs. interfaces (Claude.ai, Cowork, Claude Code).
- Sessions don't transfer between interfaces — each is a fresh start.
- One golf friend uses Numbers (Apple) for posting stats — possible alt to explore.
- Removed Dispatch (remote iPhone task assignment) due to security concerns — MacBook risk warnings + Chrome bookmark sync exposed an old bank account.

**Next:**
- Resolve footer resizing (later shipped 2026-04-25).
- Implement toggle-switch data capture (later shipped 2026-04-24).
- Plan database structure for stats (later shipped 2026-04-24).

---

## 2026-04-19

**Did:**
- Set up Google Drive access for Claude (read/list/search/create files).
- Installed Chrome + Claude in Chrome extension on the laptop specifically as a tool for Claude. Paul does not use Chrome for personal browsing.
- Mounted `~/Documents/Studio` (formerly named `GitHub`).
- Confirmed read/write to live Google Sheets via Chrome browser control: wrote "hello world" into cell E69 of the 2024 Golf Stats sheet, Paul deleted the test entry afterward.

**Learned:**
- The 2024 Golf Stats sheet will serve as the live data source while the dashboard is in development. *(See `Dashboard/PROJECT.md` for the full data-source plan: demo-mode toggle, abstracted `getScores()` fetcher.)*
- Chrome extension is in beta; main risk is prompt injection from malicious pages. Low risk for editing Paul's own Drive files.
- Open: handicap data (not yet decided), partner scores (currently Paul-only).

**Next:**
- Begin dashboard work *(parked; Phase 2)*.

---

## 2026-04-18 — Footer redesign plan (later shipped)

**Did:**
- Designed the footer/stats redesign: green footer on every screen, nav buttons sliding up under progress bar, two-column footer mirroring header pattern.
- Player Entry: limit to 4 players max, remove "Built by Claude", tighten Capture Name spacing — solves iOS keyboard overlap with no layout shift.
- Footer stats: FIR / GIR / U&D / 3+ Putts, all slider switches (later evolved into PUTTS counter on 2026-04-24), dimmed-default opt-in.
- Sheets schema: separate Stats tab, columns `Hole | FIR | GIR | U&D | 3+ Putts` plus Round ID/Date/Player, values 1/0 for SUM/AVG friendliness. Hygiene rule: all-zero round = "stats not tracked" detected at read-time in Sheets, not in JS.

**Learned:**
- Dimmed-default + opt-in is the right pattern for casual players who don't want to think about it.
- All-slider visual consistency made the four-stat footer cohesive.

**Next:** *(redesign shipped progressively over 2026-04-24 / 2026-04-25)*

---

---

## 2026-05-06 — Email report redesign v2.2 (feedback pass)

**Did:**
Rewrote `sendReport_()` in `apps-script.gs` to address May 6 feedback. All changes are in the HTML/CSS/data output only — no schema changes.

**Changes:**
- **Collapsible drawers** — `<details>/<summary>` on Round by Round, N Round Average, Strokes Lost. First two open by default; Strokes Lost collapsed. Focus Areas always visible.
- **Reduced padding** — `.body` padding cut from `24px 28px` → `14px 12px`; table cell padding tightened to `5px 3px`. Tables fill more width.
- **Scoring Summary** — replaced 3-col KPI strip with 2-row × 4-col grid matching App layout. Hero cell (col 4, rowspan 2): avg score at 34px green, sub-line `HI: 20 | Net: X`. Other cells: Row 1 = FIR | GIR | PEN, Row 2 = UD | X-UD | PUTTS. Light green background.
- **Round by Round** — FIR and GIR now whole integers (not `/18` fractions). Added X-UD column (MissedOpp). Away-course rows highlighted `#daeaff`; no "Away" text; course name shown + `title` attr on `<tr>` for hover tooltip. All numeric columns center-justified. `white-space:nowrap` on Score header prevents wrapping. TSL column width unchanged, Score tightened.
- **N Round Average** — renamed from "Averages — Last N Rounds". Order matches App: FIR, GIR, PEN, UD, X-UD, PUTTS. Short abbreviations only. Short Game Efficiency removed. Putts per GIR removed. All values 1 decimal. X-UD note: "Failed up & downs — fewer is better".
- **Terminology fixes** — X-UD is "Failed up & downs" everywhere. Removed fractions (`/18`). Consistent 1-decimal formatting throughout.
- **Net score** — reads HI from Settings tab, computes CH using Mt. Paul Mens Blue ratings (CR 59.0, SR 86, Par 64). `netAvg = avgScore − ch`.

**Decided:**
- `details[open]` default: Round by Round and N Round Average open on load; Strokes Lost collapsed (useful but not primary).
- `<details>/<summary>` degrades gracefully in email clients that don't support it (all sections visible).
- CH computed server-side from Settings HI; hardcoded to Mens Blue until tee selector is wired.

**Files changed:** `apps-script.gs` (sendReport_, buildInsights_)

**Next:** Paste updated `apps-script.gs` into Apps Script editor → Deploy → New version → test via `sendReport()`.

---

## 2026-05-07 — Email Report polish + GPI naming

**Did:**
- Fixed `<details>/<summary>` → plain `<div>` headings (Gmail strips interactive elements)
- All section titles: consistent 12px green bold with rule line, 28px spacing above each section
- Scoring Summary: light green stat cards on white background, hero td fills full rowspan height, no ghost border
- Away rounds: light amber `#fef3cd` background + hover tooltip with course name
- Section titles all caps; Focus Areas 12px matches other headings
- Alternating row colours fixed in N Round Average and Cost Breakdown (index-based)
- Left-aligned text in 1st and 3rd columns of stat tables (inline styles for Gmail compatibility)
- Renamed TSL → COST; added explanatory sub-row below column headings
- Named the composite strokes-lost metric **GPI Rating** (Golf Performance Index)
- Subject line, masthead title → "Golf Performance Index Report"
- Masthead subtext → "Average of last (x) rounds"
- GPI_RULES.md created as reference backup

**Decided:**
- GPI is an informal personal metric — does not conflict with PGA Tour (Strokes Gained), WHS (Handicap Index), or Golf Canada terminology
- "Rating" preferred over "Score" — implies a standing, not just a tally
- Focus Areas left border removed; border-radius rounded all sides
- Cost Breakdown GPI Rating row follows alternating row pattern, no special background

**Files changed:** `apps-script.gs`, `GPI_RULES.md`, `PROJECT.md`, `JOURNAL.md`

**Next session:** Review GPI metric family — are multipliers calibrated for a ~20 HI player? HI-scaled benchmarks. Making Focus Areas advice data-driven.

---

## 2026-05-08 — GPI model exercise + Metrics Guide correction

**Did:**
- Loaded 2024 Golf Stats sheet (62 rounds, Mt. Paul, scores only — no GIR/Putts/X-UD/Penalties captured that season).
- Built a score-based stat estimation model using piecewise linear interpolation from GPI_RULES.md anchor points (Good ~68, Average ~74, Poor ~84).
- Applied model to all 62 rounds to produce estimated GPI — exercise only, not suitable for real reporting.
- Discovered and fixed a bug in the first model pass: BSCost formula in Metrics Guide was wrong (used HI-adjusted expected-GIR gap instead of `(18 − GIR) × 0.5`). Confirmed correct formula against GPI_RULES.md verification table.
- Corrected `2026-05-08-Golf-MetricsGuide.md` BSCost section to match GPI_RULES.md.

**2024 Estimated GPI Results (score-modelled, 62 rounds):**
- Season average GPI: **20.4 → Below Average** (19–28 HI bracket)
- Best: 10.0 (71-score rounds) / Worst: 29.5 (89)
- Band split: Good 10% · Average 21% · Below Avg 44% · Poor 26%
- Avg cost drivers: SGCost 7.8 · BSCost 7.5 · PuttCost 2.7 · PenCost 2.4
- Ball striking and short game essentially tied as primary leaks

**Decided:**
- Score-only GPI estimation is valid as a calibration/testing exercise but should never appear in real reports — it collapses all rounds of the same score to identical stat profiles.
- `(18 − GIR) × 0.5` is the canonical BSCost formula. HI-gap variant is retired.

**Files changed:** `2026-05-08-Golf-MetricsGuide.md`, `JOURNAL.md`

**Next:** Making Focus Areas advice data-driven; HI-scaled benchmark review.

---

## 2026-05-08 — Unposted Scores screen planned

**Did:**
- Confirmed app auto-stamps today's date on all rounds — no date picker exists in the current setup flow.
- Discussed HI tracking: Paul has 2026 scorecards but no way to back-enter them with correct dates.
- Decided against modifying the main round entry flow for backdating.

**Decided:**
- Add a dedicated **"Add Unposted Scores"** screen, accessible via a footer link on Home and other non-Hole screens.
- Screen supports two entry modes: **manual** (date picker, course, tees, hole-by-hole scores, optional stats) and **batch import** (CSV upload/paste matching existing Sheets column format, with preview and confirm step).
- Stats marked as partial/unavailable if not entered — scores-only rounds still feed HI calculation.
- Player selector included from the start so Dave can use the same screen when Player Profiles are built.
- This is Phase 2 work — no implementation yet.

**Context:**
- Paul has traditional scorecards for all 2026 rounds. Once the screen is built he can back-enter them to seed his HI.
- Dave tracks scores in a Numbers spreadsheet — batch CSV import is the likely path for him.
- 20 rounds needed for a stable WHS HI calculation. Until then, HI is flagged as provisional in the report.

**Files changed:** `JOURNAL.md`, `PROJECT.md`

**Next:** Continue GPI metric refinement; Unposted Scores screen is a tracked roadmap item.

---

## 2026-05-08 — Footer nav links

**Did:**
- Built footer nav grid on all 5 non-hole screens (Setup, Front 9, Back 9, Save Round, Course)
- 8 text links in a 4×2 grid: Settings, Add Scores, Pro Tips, Penalty Rules, Quick Rules, Game Formats, My Stats, Courses
- `showPanel()` stub wired — alert placeholder, panels to be built per link
- Fixed structural bug: nav grid was landing outside `.footer` div, corrected to inside
- Styled as text-only underlined links (no button borders/backgrounds)
- Bumped to v9.34

**Context:**
- Paul has 12 real 2026 scorecards; missing 4 rounds. Going live in ~2 weeks after deleting dummy Sheets entries.
- Stats won't be available for back-entered rounds.

**Files changed:** `index.html`, `JOURNAL.md`, `PROJECT.md`

**Next:** Pick a panel to build — Settings or Add Scores are the best candidates.

---

## 2026-05-10 — Architecture decisions, security hardening, sheet cleanup

**Did:**
- Removed hardcoded Apps Script `/exec` URL from `onboarding.html` (was exposed as a default `value` in a public GitHub repo)
- Added `courses.json` to SW cache ASSETS list; bumped cache to v31
- Deleted legacy Scorecard and Stats tabs from Google Sheets — Rounds, Diagnostics, Settings remain
- Dropped GolfCourseAPI.com integration entirely — incomplete Canadian coverage, dirty data, subscription cost
- Named the Courses footer panel "Add Course"
- Locked build order: Add Course → Add Scores → Settings
- Decided Add Scores reuses existing hole screens with a date picker + course selector entry step
- Away course workflow: enter course in Add Course from paper scorecard → replay hole-by-hole in Add Scores with correct date → posts to Sheets
- HI suppressed until 20 rounds entered (display "—"); no provisional number shown before threshold
- GPS proximity detection retained only for courses in courses.json that have coordinates; optional for manually added courses
- Confirmed PWA updates work via SW cache versioning — no App Store required
- Confirmed course data is per-device localStorage only; not shared between users
- Cleaned stale GolfCourseAPI references from PROJECT.md and Market Considerations section
- Updated TODO_LIST.md resume pointer

**Files changed:** `sw.js`, `onboarding.html`, `PROJECT.md`, `JOURNAL.md`, `TODO_LIST.md`

**Next:** Build the Add Course panel — manual course entry form + saved course list, stored in localStorage.

---

## 2026-05-11 — Add Course design, stat screen UX thread

**Did:**
- Designed `courses.html` — Add Course panel, two screens:
  - Screen 1: Course basics (name, holes, par, tee checkboxes with inline CR/SR expansion)
  - Screen 2: Hole-by-hole entry (one hole at a time — par, yardage per tee, stroke index, progress dots above nav buttons)
- Locked tee colour order: Gold → White → Blue → Red (longest to shortest)
- Locked tee options: Gold, White, Blue, Red only (no Black)
- Locked architecture: separate `courses.html` file (not in index.html — rarely used, same pattern as onboarding.html)
- Locked layout: Option B — full-page scroll, masthead always present, footer appears at bottom of content. Frees stage from fixed-height constraints, consistent across all admin/setup screens.
- Footer nav links: yellow, no underline, rendered from shared JS array (change once, applies everywhere)
- GPS coordinates: acquired silently in background, not shown in UI
- Decided: "Courses" footer link triggers courses.html
- New design thread: Stat entry moves from footer to Stage area — dedicated stat screen after score entry per hole. See PROJECT.md design threads.

**Files changed:** `JOURNAL.md`, `PROJECT.md`, `TODO_LIST.md`

**Next:** Build `courses.html` — scrollable Option B layout, Screen 1 basics form, Screen 2 hole-by-hole entry, add to SW cache (v32)

---

## 2026-05-12 — courses.html polish + 5-zone architecture locked

**Did:**

courses.html improvements:
- Header upper-left changed to "Courses: Listings" on library screen
- Tobiano auto-purged from localStorage on page load
- `syncPhones()` upgraded — backfills missing phones AND injects new courses.json entries missing from cache
- Valley Golf Centre added to courses.json (ID 12, 604-853-4653, 4211 Gladwin Road Abbotsford)
- Tee display: Black/Silver/standalone Green filtered out; max 3 shortest shown; all names normalized to Title Case; combined tees (Gold/White) preserved
- Holes text removed from library listings
- ADD COURSE button: no +, all caps via CSS text-transform
- HOME button: green, full width, dropped 50px, replaces grey "App" button
- Footer: white background, text colour changed to var(--text-muted)
- Address fields added to Add/Edit Course form: Street Address + City/Province (2-col grid, province 2-char uppercase, default BC)
- `toAddrCase()` function — on-the-fly Canada Post title case as user types; province always uppercase; directionals and abbreviations preserved
- City shown in library listing alongside tee info (e.g. "Blue, White, Red · Abbotsford")
- Address pre-fills correctly in edit mode; cleared on new course

index.html fix:
- `as-body` missing `background: #fff` and `margin-top: 12px` — fixed. Add Scores entry fields now sit on white stage, not green body.

**Locked decisions (all added to PROJECT.md):**
- **5-zone page template** — masthead · stageScore (optional) · stageScrolls · navBar · footer. Every current and future screen uses this structure. Documented with zone map by screen type.
- **shared.js** — NAV_LINKS array + renderMasthead() + renderFooterNav() render functions. One file, included by every HTML page. Change nav once, propagates everywhere.
- **No direction arrows** — no ← or → on any label or button anywhere in the app.
- **Footer nav universal** — same link set on every screen including hole screens.
- **Stats on Add Scores — none** — historical entry is scores only. No stat screen in that flow.
- **Per-hole stat screen — conditional** — live rounds only, only if Record Stats toggle is ON.
- **Masthead schema locked** — four named slots: breadcrumb (yellow), title (large white variable — string or number), subtitle (bot row — par/yds on hole screens, empty elsewhere), plus weather/date/duration in header upper. renderMasthead() accepts all as parameters. Subtitle data flows from courses.json → localStorage → hole screen JS → renderMasthead().

**Files changed:** `courses.html`, `courses.json`, `index.html`, `PROJECT.md`, `JOURNAL.md`

**Next session (tomorrow afternoon):**
- Build `shared.js` — NAV_LINKS + renderMasthead() + renderFooterNav()
- Migrate `courses.html` to 5-zone template
- Add shared.js to SW cache
- Then begin index.html migration

---

## 2026-05-13 — index.html UI fixes (player pill, nav all-caps, masthead height)

**Did:**
- Player name display: restored green pill — `background: var(--green); color: #fff; border-radius: 20px; padding: 5px 14px; font-size: 13px; font-weight: 500; flex: 0 0 auto; align-self: center;` + `.player-row { justify-content: center; }` to prevent full-width bleed
- All hole nav buttons: `text-transform: uppercase; letter-spacing: 0.04em;` — global via `.nav-btn`
- Hole 1 nav buttons: JS updated — first hole shows HOME | NEXT, subsequent holes BACK | NEXT
- Masthead height: reduced 248px → 208px; bottom padding 28px → 4px (saves ~40px vertical)
- as-body: `background: #fff; margin-top: 12px;` — fixes green background on Add Scores screen

**Pending push:** all changes are local only — not yet committed or pushed to GitHub

**Files changed:** `index.html`, `courses.json` (Valley GC name)

**Next session resume:** verify masthead height on device, then start shared.js build (NAV_LINKS + renderMasthead + renderFooterNav)


---

## 2026-05-12 — Stats screen, SW cache fixes, Valley GC eviction (v9.47 / SW v36)

**Did:**

**Stats screen (v9.40–v9.45)**
- Migrated hole screen to 5-zone template: extracted stat sliders out of footer into `.stats-zone`
- Built `#screen-stats` — two-step Score → Stats → Next Hole flow
- Stats screen: masthead (hole num + PAR/YDS strip), stageScrolls (player name pill + stats grid), navBar (BACK / NEXT)
- `nextHole()` routes to stats screen if `!state.historicalMode`; `statsBack()` / `statsNext()` complete the nav
- `showStatsScreen()`: renders hole num, par label (Birdie/Par/Bogey etc.), syncs stat sliders
- Dropped score badge from stats screen header; kept PAR/YDS strip
- Player name rendered via `renderPlayerName()` / `[data-player-name]` pattern from shared.js — same injection as footer nav
- Added `renderPlayerName()` + `getPlayerName()` to shared.js v1.1; auto-calls on DOMContentLoaded
- `.player-row` + `.player-name-display` CSS used for green pill, centred — consistent with other screens

**SW cache busting (SW v36)**
- Root cause identified: GitHub Pages CDN caching sw.js + index.html; SW's `fetch(req)` respected HTTP cache even in "network-first" strategy
- Fixed: HTML fetch now uses `fetch(req, { cache: 'no-cache' })` — bypasses CDN stale responses
- `skipWaiting()` already present; confirmed in install event

**Valley GC duplicate eviction (v9.46 → v9.47)**
- Removed entry "12" (Valley GC, Abbotsford, no tee data) from `courses.json`; 11 seeded courses remain
- v9.46: added `evictStaleSeeds()` IIFE to purge id:12 from `localStorage.courseCache` on startup; also fixed `seedCourseCache()` to use `cache: 'no-cache'`
- v9.47: **bug fix** — IIFE checked `entry.city === 'Abbotsford'` but actual structure is `entry.location.city`; city check always returned false so nothing was ever evicted. Fixed to check `entry.id === 12` only — unambiguous, correct.
- Duplicate now evicted on first page load after v9.47 deploys

**Files changed:** `index.html` (v9.47), `shared.js` (v1.1), `sw.js` (v36), `courses.json`

**Next session:** Add Scores screen — date picker + course selector (default Mt. Paul) + tees → existing hole screens → post to Sheets. Stats footer hidden for historical rounds (`state.historicalMode`).


---

## 2026-05-13 — Security hardening + footer cleanup (v9.57–v9.58 / SW v37)

**Did:**

**Security hardening (v9.57)**
- Removed hardcoded Apps Script URL fallback from `index.html` — `SHEETS_URL` now reads solely from `PROFILE.sheetsUrl` (set via onboarding)
- Removed bootstrap URL input field (HTML, CSS, JS) from setup screen — redundant since onboarding captures it
- Removed dev buttons ("Jump to Post Screen", "Simulate Failure") and all associated CSS/JS
- Confirmed: WEBHOOK_SECRET left in source — risk assessed as low (personal golf score data only, git history already cleaned previously, localStorage not meaningfully more secure)
- Both devices (macBook + iPhone) confirmed functional after changes
- iPhone localStorage was intact throughout; macBook required onboarding re-completion after earlier Safari data clear

**Footer cleanup + version display (v9.58 / SW v37)**
- Trimmed NAV_LINKS from 8 to 4 active links: Settings, Add Scores, My Stats, Courses
- Added `APP_VERSION = 'v9.58'` constant to `shared.js`
- `renderFooterNav()` now appends version string below the 2×2 grid — white, centred, 13px, 0.7 opacity
- Added `.footer-version` CSS to `index.html` and `courses.html`
- SW bumped to v37 to force cache eviction and pull fresh `shared.js`

**Tech debt noted:** inline `<style>` blocks duplicated across `index.html`, `courses.html`, `onboarding.html` — extract to `shared.css` in a future session.

**Files changed:** `index.html`, `shared.js`, `courses.html`, `sw.js`

**Next session:** Add Scores screen — date picker + course selector (default Mt. Paul) + tees entry → existing hole screens → post to Sheets. `state.historicalMode` suppresses stats screen.

---

## 2026-05-14 — 9-hole posting, pairing scaffold, Round_Type classification (v9.61→v9.63)

**Context:** Session started in Golf folder (not Studio root — reminder to connect at Studio level next time).

**Security housekeeping:**
- Confirmed GEMINI_API_KEY no longer in Script Properties (revoked May 6, history already scrubbed)
- Paul deleted the activation email containing the key — no offsite storage needed; WEBHOOK_SECRET is the only active secret

**GPI Report test:** Ran successfully — email received, no regressions from prior session changes.

**Continue | Post Now toggle (screen-midround):**
- Added `<div class="nine-hole-toggle-wrap">` inside `midround-wrap` with Continue / switch / Post Now layout
- Default state = Continue (NEXT button behaviour); toggling to Post Now switches button label to POST and calls `postFront9()`
- `postFront9()` slices holeList/scores/stats to 9, sets `state.pendingRound = true`, generates a UUID `state.pairingId`, then calls `submitRound()`
- State init updated: `pendingRound: false, pairingId: null`; `newRound()` clears both; `buildMidroundCard()` resets toggle on entry
- `submitRound()` payload now includes `courseId` and, if pending, `{ pending: true, pairingId }`

**Toggle CSS fixes (three iterations):**
1. Moved inside `midround-wrap` — was on green page background
2. Width `fit-content`, dark label colour
3. Default slider was white-on-white: specificity clash — global `.switch .slider-bg { background: rgba(255,255,255,0.25) }` overrode `.nht-switch .slider-bg`. Fixed by using `.switch.nht-switch .slider-bg { background: #9ca3af }` (higher specificity)
4. Labels: grey (#9ca3af), all-caps, 15px

**apps-script.gs — Pending + Pairing_ID + Round_Type:**
- `roundsHeader_()`: added `Pending` (col 16), `Pairing_ID` (col 17), `Round_Type` (col 18)
- `diagnosticsHeader_()`: added `Round_Type` (col 20)
- `doPost()`: extracts `isPending`, `pairingId`, `courseId`; classifies `roundType` (negative courseId = Away, name matches Home Course setting = Home, else Local); appends all three to each row
- `buildDiagnostics_()`: skips pending rows; reads `row[17]` for Round_Type; passes through to diagRows
- `countRounds_()`: reads 16 cols, filters out pending rows
- Response includes `pairingId` when pending

**Versions:** v9.61 (toggle + pending scaffold) → v9.62 (toggle grey fix) → v9.63 (label styling) / SW v40→v42

**Files changed:** `index.html`, `shared.js`, `sw.js`, `apps-script.gs`

**Pending (next session):**
- Paul to paste updated `apps-script.gs` into Apps Script editor and deploy new version
- ~~Pairing UI (server-side)~~ ✓ DONE — widow detection, renumber holes 10-18, merge under widow Round_ID, clear Pending, rebuild diagnostics
- Record Stats toggle on Setup screen
- Settings panel (name, home tees, HI, email, toggles)
- Auto-calculate HI (WHS formula, best 8 of 20)
- Dev button cleanup before release


---

## 2026-05-14 — settings.html built + NAV_LINKS wiring (v9.65 / SW v44)

**Did:**
- Built `settings.html` (new file) — full 5-zone layout, green theme, DM Sans
  - Record Stats toggle (SHOW/HIDE) → saves `profile.recordStats`
  - Performance Report row — Send Report Now button → `fetch(sheetsUrl + '?action=report')`
  - Report Email input → saves `profile.reportEmail` on blur
  - Courses → `showPanel('courses')` chevron row
  - DONE → `showPanel('home')`
- UI polish pass: 3D shadow on all buttons (report-btn matches btn-3d), uniform height/size, DONE centred, Send Report Now uppercase + centred, chevron doubled (18px → 36px), footer grid fixed (repeat(4,1fr) → 1fr 1fr), footer background explicit green (overlap fix)
- Removed Analytics placeholder from Settings — not a setting until built
- NAV_LINKS wiring (shared.js):
  - Added `title` field to each NAV_LINKS entry
  - `getNavEntry(id)` helper
  - `applyPageMeta(id)` — sets document.title, .header-lower-title, .hu-breadcrumb from NAV_LINKS
  - DOMContentLoaded auto-init: reads `data-page-id` from body, calls `applyPageMeta` automatically
  - settings.html body gets `data-page-id="settings"`
- Renamed `my-stats` → `analytics` in NAV_LINKS (footer label, stub, id all updated)
- APP_VERSION bumped v9.64 → v9.65; SW v43 → v44

**Files changed:** `settings.html` (new), `shared.js`, `sw.js`

---

## 2026-05-14 — shared.css extracted; global zone styles (v9.66 / SW v45)

**Did:**
- Created `shared.css` (new file) — single source of truth for masthead and footer nav zones:
  - CSS variables (:root)
  - Masthead: .masthead, .header-upper, .hu-*, .header-lower, .header-lower-*, small-screen media query
  - Footer nav: .footer, .footer-nav-grid, .fnav-btn, .fnav-btn:active, .footer-version
- Linked `shared.css` into all pages: index.html, settings.html, courses.html
- Stripped duplicate masthead + footer CSS from settings.html and courses.html
- Stripped footer-nav CSS from index.html (masthead kept — complex hole-screen variants layer on top)
- Added shared.css to SW ASSETS cache
- APP_VERSION v9.65 → v9.66; SW v44 → v45

**Why:** Footer height/style inconsistency (settings.html vs index.html) exposed that each page hand-copied the zone CSS. Now one file governs both zones for all pages.

**Files changed:** `shared.css` (new), `shared.js`, `sw.js`, `index.html`, `settings.html`, `courses.html`

---

## 2026-05-14 — CSS consolidation, settings rebuild, shared.css components (v9.72–v9.81)

**Did:**

**courses.json cleanup:**
- Stripped city/province/postal from all `address` fields — street-only now stored
- Added missing street addresses: Mt. Paul (615 Mt Paul Way), Meadow Creek (2975 Kimberland Dr)

**shared.css — promoted to component library (v1.3):**
- Added `.btn-3d` — canonical 3D button (gradient, multi-layer shadow, inset highlight, `-webkit-appearance:none`)
- Added `.btn-grey` — secondary/cancel button variant
- Added `.section-header` — uppercase section labels (13px/700/text-secondary)
- Added `.setting-row`, `.setting-left` — row layout primitives
- Added `.setting-label` (19px/700/green, matches `.lib-name`), `.setting-sublabel`
- Added SW cache warning comment — any change requires CACHE_NAME bump in sw.js
- courses.html: local `.btn-3d` visual styles removed; layout overrides (`flex:1`, `padding:15px`) kept locally

**settings.html rebuild (v1.5):**
- Section renamed: Gameplay → Score Card, Reports → Feedback, Tools → Admin; Account section removed
- "Record Stats" → "Track Your Stats", description updated
- "Performance Report" → "Performance Reports", description updated
- "Report Email" → "Change Email"; moved from Account to Admin section
- "Courses" → "Edit & Add Courses", description updated
- DONE button → SAVE
- Structure: Score Card / Feedback / Admin (Change Email + Edit & Add Courses)

**index.html Setup screen:**
- Removed Change Course button
- Start Round button centred (sole button in hole-actions)
- Course display card made tappable → `showPanel('courses')` (goes to listings, bypasses search)

**SW cache bumps:** v51 → v56 (one bump per shared.css change to force fresh delivery)

**Versions:** v9.72 (start of session) → v9.81 / SW v56

**Files changed:** `courses.json`, `shared.css`, `shared.js`, `sw.js`, `settings.html`, `index.html`, `courses.html`

**Queued for next session:**
- Course card tap cue — add "Change Course ›" sublabel under course name on Setup screen
- HOME button standard width — add to shared.css
- Toggle switch canonical definition in shared.css — restore yellow track (checked), translucent white track on green bg context, grey on white bg context
- Font type scale — define locked rules in shared.css (page title, section header, row label, sublabel, body)
- Button standard confirmed: white text, uppercase, all pages

---

## 2026-05-15 — Design & Planning Session (no code changes)

**Focus:** Settings screen redesign, Performance Reports architecture, PCC design thread, workflow & AI fluency discussion.

**Did:**

**PCC — Playing Conditions Calculation:**
- Added full PCC design thread to PROJECT.md
- Reframed PCC from a scoring adjustment to a conditions tag — context only, not a metric
- Player toggle (default Off); post-round dropdown for weather descriptor (maps to −1/+3 scale)
- Three data points stored per round: PCC_Selected, PCC_ScoreDelta, PCC_Flag
- Integrity caveat documented: inconsistent use (toggle Off for some rounds) makes PCC untrustworthy as analysis — accepted and noted in spec
- Silent pre-round weather fetch (OpenWeatherMap) noted as optional enhancement

**Settings Screen Redesign:**
- Full toggle layout replacing buttons; two-column design consistent with existing Track Stats row
- SAVE button retained at bottom for user affirmation only
- Admin section stays below toggle layout, untouched pending future home decision
- Toggle groups: Player Preferences (PCC), Stats Tracking (master switch), Metric Toggles (FIR/GIR/PEN/UD/X-UD/PUTTs), Performance Reports Frequency

**Performance Reports Architecture:**
- Four-tier structure: 5-Round / 10-Round / Monthly / Season Summary (Nov 15)
- Combined trigger logic: when multiple frequency thresholds coincide, one email — not multiple
- Combined report order: incremental, smallest window first (5 before 10, BiWeekly before Monthly)
- Rotating monthly spotlight cycles through active metrics — only activates if 2+ metrics tracked
- Score-based foundation always present regardless of stat tracking
- Narrative tone: plain language, coach voice — not tables or spreadsheet output
- Season-over-season reach-back comparisons as a core feature
- Welcome report for insufficient data — onboarding framed, not a warning
- Season Summary date Nov 15 fixed in Settings; adjustable in Admin profile (placeholder)

**Open Questions Resolved (4 of 6):**
- #4 Combined report order — incremental, smallest first ✓
- #5 Insufficient data — welcome/onboarding report ✓
- #6 Season Summary date — fixed Nov 15, adjustable in Admin ✓
- #3 PCC scope — conditions tag only, not a metric ✓ (conditional)

**Still Open:**
- #1 Toggle auto-save vs. hold until SAVE tapped
- #2 Future home for Admin section

**Workflow discussions:**
- Glob confirmed unreliable on mounted Studio directories — CLAUDE.md updated to use bash ls -la for mount verification
- Established optimal change batch size: 2–3 related changes per prompt, same file/section
- AI fluency signals discussed: "TOL" / "Thinking out loud" = explore not act; direct verb = execute
- Session close protocol established: always update JOURNAL, PROJECT, TODO before confirming done

**Files changed:** `PROJECT.md` (PCC section, Settings redesign section, open questions resolved)

**Queued for next session (carried from May 14):**
- Course card tap cue — "Change Course ›" sublabel under course name on Setup screen
- HOME button standard width — add to shared.css
- Toggle switch canonical definition in shared.css
- Font type scale — locked rules in shared.css
- Settings screen toggle layout rebuild (when design questions #1 and #2 are resolved)

---

## 2026-05-16 — Settings UI Build Session

**Focus:** settings.html restructure — Tracking Your Stats section, stat toggles, Performance Reports section.

**Did:**

**Tracking Your Stats section (new):**
- Replaced "Score Card" section header with "Tracking Your Stats"
- Added info card: introductory copy ("We suggest logging at least five rounds…") with expandable More/Close benchmark tables
- Two 4-col benchmark tables (FIR/GIR/PEN and UD/X-UD/PUTTS) by handicap range, zebra-striped, no row rules, shaded header row
- Source footnote with italic *Src:* label; callout paragraph (non-italic)
- Info card border-bottom removed so it flows seamlessly into master toggle

**Track Your Stats master toggle + sub-panel:**
- Replaced old SHOW/HIDE toggle with clean 2-col no-label toggle (label left, switch right)
- Sub-panel (hidden by default): description copy + 8 metric toggles (FIR, GIR, PEN, UD, X-UD, PUTTs, GPI, PPC)
- Sub-panel reveals only when master is ON; persists state on reload
- GPI (Strokes Gained) and PPC (Record Weather with Scores) included pending future scope decision
- localStorage keys: `recordStats` (master), `statFIR/GIR/PEN/UD/XUD/PUTTS/GPI/PPC`

**Performance Reports section (new):**
- Replaced old Feedback section entirely
- Description copy, border-bottom removed to flow into master toggle
- "Receive Reports" master toggle (no border-bottom) gates the sub-panel
- Sub-panel: 6 frequency toggles (Every 5/10/20 Rounds, BiWeekly, Monthly, Year End Summary) + Send Report Now button
- localStorage keys: `receiveReports` (master), `freqEvery5/10/20/BiWeekly/Monthly/YearEnd`
- All new toggles default Off; existing `recordStats` state preserved for returning users

**Other:**
- Sample Report noted in PROJECT.md and added to TODO_LIST.md (Medium priority)
- Admin → onboarding direction noted in PROJECT.md open questions
- APP_VERSION bumped to v9.84 / SW v57
- SW bump done via bash (Edit tool had permission issue on sw.js)

**Files changed:** `settings.html`, `shared.js`, `sw.js`, `PROJECT.md`, `TODO_LIST.md`

**Open / Queued for next session:**
- Server issues at session close — verify push landed cleanly next session
- GPI/PPC final scope decision (reports-only vs. diagnostic)
- Report metric groupings: Short Game, Ball Striking, Course Management
- Apps Script combined trigger logic for frequency reports
- Sample Performance Report (static, for new accounts)
- Admin section → onboarding breakout (future)
- Course card tap cue, HOME button width, toggle canonical in shared.css, font type scale (carried forward)

---

## 2026-05-16 — Apps Script Trigger Logic + Settings Radio Groups

**Focus:** Apps Script multi-tier report triggers, frequency toggle radio behaviour, PCC typo fix.

**Did:**

**PCC typo fix (settings.html):**
- Corrected PPC → PCC throughout settings.html (label text, toggle ID `tog-statPCC`, localStorage key `statPCC`)
- JOURNAL historical entries left as-is (accurate record of what was typed at the time)

**apps-script.gs — multi-tier report triggers:**
- Removed single `REPORT_EVERY_N_ROUNDS = 20` constant
- Added `ROUND_WINDOWS = [5, 10, 20]` — smallest first, combined email order
- Added `checkRoundTriggers_(ss, totalRounds, hi)` — called from doPost; determines which windows fire and dispatches one combined email
- Added `sendCombinedReport_(ss, windows, hi)` — builds one email with one section per firing window, sections separated by a horizontal rule
- Added `buildReportSectionHtml_(rounds, hi, homeCourse, windowSize)` — extracted section builder, reusable by all senders
- Removed old monolithic `sendReport_(ss, n)` private function (superseded)
- Updated `sendReport()` (manual menu item) to call `sendCombinedReport_` with [20] window
- Added calendar trigger functions: `setupBiweeklyTrigger`, `removeBiweeklyTrigger`, `setupMonthlyTrigger`, `removeMonthlyTrigger`, `setupSeasonSummaryTrigger`, `removeSeasonSummaryTrigger`
- Added scheduled handlers: `sendScheduledReport_biweekly` (10-round window), `sendScheduledReport_monthly` (20-round window)
- Added `checkSeasonSummary` — fires monthly on 15th via trigger; only sends in November; covers full season
- Added `removeTriggerByHandler_` helper — cleans up triggers safely on re-run
- Both doPost call sites updated to use `checkRoundTriggers_` (was inline modulo check)

**settings.html — frequency toggle radio behaviour:**
- Round-count group (Every 5 / 10 / 20 Rounds): radio behaviour via `selectFreqRound(key, el)`
- Calendar group (BiWeekly / Monthly): radio behaviour via `selectFreqCalendar(key, el)`
- Year End Summary: standalone toggle, `saveStatPref` — not part of either group
- Added `selectFreqGroup`, `selectFreqRound`, `selectFreqCalendar` JS functions
- Added `FREQ_ROUND_GROUP` and `FREQ_CALENDAR_GROUP` constants
- Added `.stat-group-label` CSS class (green, uppercase, 11px) for group sublabels
- Added group sublabels in HTML: "By Round Count (choose one)", "By Calendar (choose one)", "Annual"
- Nov 15 date shown inline on Year End Summary label as advisory

**Design decisions confirmed this session:**
- "None selected" is valid — player can opt out of reports entirely
- Year End Summary is fixed Nov 15, non-editable, standalone
- All windows fire is too noisy — radio groups prevent inbox flooding
- Settings bridge (localStorage → Sheets) deferred; noted as open gap

**Files changed:** `apps-script.gs`, `settings.html`, `JOURNAL.md`, `PROJECT.md`

**Open / Queued for next session:**
- Settings bridge: write frequency preferences to Sheets Settings tab so Apps Script can filter active windows
- Calendar trigger deduplication: if round-count and calendar fire same day, still one email
- GPI/PCC final scope decision (reports-only vs. diagnostic)
- Course card tap cue, HOME button width, toggle canonical in shared.css, font type scale (carried forward)

---

## 2026-05-16 — Session Close Notes (evening continued)

**Trigger setup completed:**
- `sendReport` — weekly Sunday 8am trigger registered manually via Script Editor UI
- `checkSeasonSummary` — monthly on 15th trigger registered; November-only logic confirmed (getMonth() === 10)
- Season Summary date fixed at Nov 15 — non-configurable for now; settings bridge required to make it user-selectable
- `listTriggers` diagnostic function removed, script redeployed as new version
- ScriptApp.newTrigger() silent failure noted — triggers must be registered manually via UI for this project; root cause not resolved (likely scope authorization gap)

**Email address note:**
- REPORT_EMAIL in script = kamloopspaul@gmail.com
- Profile reportEmail = kamloopspaul@live.ca
- Confirm which inbox should receive reports before first live report fires

**settings.html radio toggles confirmed working by Paul**

**Queued for next session (build order):**
1. shared.css — HOME button standard width (one class, all pages)
2. shared.css — Toggle switch canonical (yellow on checked; translucent white on green bg, grey on white bg)
3. shared.css — Font type scale (page title / section header / row label / sublabel / body)
4. Course card tap cue — "Change Course ›" sublabel on Setup screen
5. Sample Performance Report — static file for new accounts, linked from Settings description
6. Settings bridge — write frequency prefs from localStorage to Sheets Settings tab

**Files changed this close:** JOURNAL.md, PROJECT.md, TODO_LIST.md

---

## 2026-05-17 — Stat Metric Visibility + Symmetric Back Navigation

**Focus:** Wiring Settings stat metric toggles to hole stats screen; fixing Back navigation to include stats screen.

**Problems identified:**
- Stats screen showed all 6 metrics regardless of player's Settings selections — toggles weren't connected to the hole screen
- BACK from a score screen skipped the stats screen entirely — no way to correct stat entries on previous holes

**Changes made (v9.85 / SW v58):**

**index.html:**
- Wrapped each metric pair in `<div class="sg-row" data-metric="...">` — `display:contents` preserves grid layout, `display:none` hides both cells cleanly
- Added `.sg-row { display: contents; }` CSS
- Added `applyMetricVisibility()` — reads `localStorage.profile` for each stat key; defaults all-on if key unset (fresh install); called from `showStatsScreen()` so both forward and back paths benefit
- Fixed `prevHole()` — now calls `showStatsScreen()` instead of `showScreen('hole')` when stats are on and not in historical mode, making Back navigation fully symmetric: Score(N) ← Stats(N) ← Score(N+1)
- Fixed `applyMetricVisibility()` to read from `localStorage.profile` (not standalone keys) — consistent with how settings.html stores preferences

**shared.js:** APP_VERSION bumped v9.84 → v9.85
**sw.js:** CACHE_NAME bumped v57 → v58

**Verified working by Paul on live URL.**

**Design discussion — PCC placement:**
- Original spec: post-round prompt on Final Score screen
- New direction: live dropdown on hole screen, below Home Course display, same width
- Rationale: player can update as conditions change mid-round; final value at Post time = overall assessment; more accurate than post-round recall
- Interaction style chosen: Option 1 — dropdown with full condition labels (matches PROJECT.md spec labels)
- Status: first task next session

**Queued for next session (in order):**
1. **PCC dropdown on hole screen** — below Home Course display, same width, full condition labels, live throughout round
2. shared.css — HOME button standard width
3. shared.css — Toggle switch canonical (yellow on checked)
4. shared.css — Font type scale
5. Course card tap cue — "Change Course ›" sublabel on Setup screen
6. Sample Performance Report — static file for new accounts
7. Settings bridge — localStorage → Sheets Settings tab

**Files changed:** `index.html`, `shared.js`, `sw.js`

---

## 2026-05-17 (Session 2)

**Focus:** PCC dropdown implementation, placement refinement, design discussion.

**Completed:**

- **v9.86** — PCC dropdown built on hole screen masthead (col 1, below course name). Bug found immediately: `display:none` was inside `@media (min-width:600px)` so it showed on mobile regardless of setting.
- **v9.87** — PCC dropdown moved to correct location: **Start Round screen stage area**, below course card (Mt. Paul / blue tees). Full-width, rounded, white bg, styled to match course card. `applyPccVisibility()` wired via `updateAllWeather()`.
- **v9.88** — Default option text changed to "Record today's weather conditions…"

**Design decisions made:**

- PCC belongs in **Start Round screen**, not hole screen or Final Score screen
- Auto-default to **Normal / calm (0)** if player doesn't select — no blocking of Start Round button
- "Player Preferences" as a Settings section header was accidental — do not re-add. PCC toggle belongs at top of "Tracking Your Stats" with a visual separator, or in a minimal new section only if other preferences emerge
- **−1 (Easier than normal)** should not be auto-deduced from weather — too subjective (depends on wind direction relative to course, ground firmness)

**Queued — weather-deduced PCC default (discussed, not built):**
- Extend Open-Meteo API call to include `precipitation` and `weather_code`
- Store raw wind + precip values in state
- After weather fetch, call `deducePcc(wind, precip, weatherCode)` to pre-fill dropdown
- Mapping: <15 km/h → 0 | 15–25 → +1 | 25–40 → +2 | 40+ → +3; rain bumps +1
- Player can still override before tapping Start Round
- −1 (Easier than normal) stays manual only

**Files changed:** `index.html` (v9.88), `shared.js` (v9.88), `sw.js` (v61)

**Queued for next session (in order):**
1. **Apps Script** — write `pccSelected` to Rounds tab; add `PCC_ScoreDelta` + `PCC_Flag` compute in `buildDiagnostics_()`
2. **PCC Settings toggle** — move out of Stats block; position at top of Tracking Your Stats with separator
3. **Weather-deduced PCC default** — extend API call, `deducePcc()` pre-fills dropdown
4. shared.css — HOME button standard width
5. shared.css — Toggle switch canonical (yellow on checked)
6. shared.css — Font type scale
7. Course card tap cue — "Change Course ›" sublabel on Start Round screen
8. Sample Performance Report
9. Settings bridge — localStorage → Sheets Settings tab

---

## 2026-05-17 (Session 3)

**Focus:** Apps Script schema normalization, PCC integration, Settings redesign.

**Completed:**
- **Round_Meta tab** — normalized schema. Rounds tab is now a pure fact table (hole data only). Round_Meta holds one row per round: Date, Course, Tees, Round_Type, PCC_Selected, Pending, Pairing_ID. Migration runs automatically via `setup()`.
- **PCC columns in Diagnostics** — PCC_Selected, PCC_ScoreDelta, PCC_Flag computed in both `appendDiagnosticsRow_()` and `buildDiagnostics_()`. Rolling average threshold: +3 strokes above average.
- **Helper functions added** — `buildMetaMap_()`, `getMetaByRound_()`, `migrateRoundsToMeta_()`, updated `countRounds_()`.
- **doPost bug fixed** — direct 18-hole path was calling removed `REPORT_EVERY_N_ROUNDS`/`sendReport_`; now correctly calls `checkRoundTriggers_()`.
- **Settings v1.8** — GPI and PCC moved to new "Player Preferences" section (between Tracking Your Stats and Performance Reports). GPI and PCC each have descriptive text above their toggles. PCC description shortened and cleaned. "Player Preferences" is a placeholder heading.
- **GPI description written** — leads with "In the absence of Strokes Gained data (ie: distance and lie)..." explains HI-scaled weighting.
- **PCC description written** — plain language, course-agnostic.

**Design discussion — Dynamic Report Messaging:**
- Current Focus Areas in email reports use hardcoded tips per category (4 tips total, same text every report).
- Proposed: JSON response library (`report-responses.json`) with arrays of variations keyed by performance band and trend direction (improving / declining / steady_good / steady_poor / persistent_weakness etc.).
- Apps Script fetches library at report time, selects contextually based on actual trend data across windows.
- **Decision: defer to off-season.** Not worth building for a single user. Revisit when app has broader distribution.

**Files changed:** `apps-script.gs`, `settings.html`

**Queued for next session (in order):**
1. **Weather-deduced PCC default** — extend Open-Meteo call, `deducePcc()` pre-fills dropdown
2. shared.css — HOME button standard width
3. shared.css — Toggle switch canonical (yellow on checked)
4. shared.css — Font type scale
5. Course card tap cue — "Change Course ›" sublabel on Start Round screen
6. Sample Performance Report
7. Settings bridge — localStorage → Sheets Settings tab

---

## 2026-05-18 (Session 4 — PCC shelved + settings.html polish)

**Decision: Weather-deduced PCC default — shelved.**

PCC in the World Handicap System is a committee-level adjustment, not player-reported. The committee observes conditions and posts a PCC value (−1 to +3) that applies automatically to all scores that day. A solo player has no legitimate way to self-administer it.

The app's existing PCC implementation (player self-reports how conditions felt, stored as context/flag only, not applied to handicap) is appropriate and stays as-is. The planned weather-deduction enhancement (extend Open-Meteo call, `deducePcc()` pre-fills dropdown) is dropped — auto-deducing from wind/precip has the same authenticity problem and adds complexity without value.

**Queue revised — next session picks up at shared.css polish:**
1. shared.css — HOME button standard width
2. shared.css — Toggle switch canonical (yellow on checked)
3. shared.css — Font type scale
4. Course card tap cue — "Change Course ›" sublabel on Start Round screen
5. Sample Performance Report
6. Settings bridge — localStorage → Sheets Settings tab

**settings.html — Section and copy work (v1.9):**

- **Tracking Your Stats:** Corrected "represents the most strokes lost" → "represents the most strokes gained" in the description. (GPI is strokes gained — lower is better, reflects extra strokes received vs. scratch.)
- **GPI block — rewritten and hidden:**
  - Description revised: GPI simplified SG estimate across four game areas; "lower is better."
  - More ›/‹ Close toggle pattern applied using `.bench-expand-link` / `.benchmarks.open` classes — matching Tracking Your Stats. Pattern is now locked and consistent across all expandable sections.
  - Strokes Gained bench-table added (6 columns: Hdcp / Tee / Aprch / Grns / Putts / Total; 6 handicap rows: Scratch → 25). First column width override: 28%.
  - Alternate-row shading applied via `:nth-child(even)` on both tables.
  - `bench-footnote` (Src: golfity.com) and ‹ Close button in `bench-close-row`.
  - Entire GPI block hidden: `display:none` with comment pointing to snippet asset.
  - Full block preserved at `assets/snippets/gpi-settings-block.html` for future use (email reports once baseline established, or a Focus Mode section).
- **TRACK CONDITIONS section (was "Player Preferences" → "TRACK YOUR PERFORMANCE" → "TRACK CONDITIONS"):**
  - PCC description cleaned: removed sentence naming "PCC" explicitly. Remaining copy: conditions context only — no algorithm mention.
- **settings.html bumped to v1.9.**

**CSS locked:**
- `.bench-expand-link`: font-size 12px, italic, font-weight 600, color var(--green), display inline-block, margin-top 8px
- `.benchmarks`: display none; `.benchmarks.open`: display block

**Files changed:** `settings.html`, `assets/snippets/gpi-settings-block.html` (new)

---

## 2026-05-19 — Session 5 — shared.css v2.0 implementation

### What was done
Completed the shared.css centralisation work queued in the build list. All three HTML files now draw from a single stylesheet for all shared components.

**shared.css v2.0** (258 lines → 270 lines after btn-3d cleanup):
- Zone 0: `:root` with full brand palette + 11-step font type scale (`--fs-display` through `--fs-tiny`)
- Zone 1: Masthead family (`.masthead`, `.hole-masthead`, `.card-masthead`) + `.header-upper`, `.hu-*`, `.header-lower-*` — with `@media (max-height: 750px)` responsive rules
- Zone 2: `.stage-scrolls` (elastic middle zone)
- Zone 3: Canonical toggle switch 48×26px green-on-white + `.switch--dark` modifier
- Zone 4: `.nav-bar` + HOME button half-width rule (`.nav-bar .btn-3d:only-child`)
- Zone 5: `.footer`, `.footer-nav-grid`, `.fnav-btn`, `.footer-version`
- Zone 6: `.btn-3d`, `.btn-grey`, `.section-header`, `.setting-row`, `.setting-label`
- Removed `text-transform: uppercase` and `margin-bottom: 6px` from `.btn-3d` (regression risk)

**index.html** (−4887 chars):
- `shared.css` link moved to before `<style>`
- Removed: `* {}` reset, `:root`, `html/body`, `@media 600px`, `.screen/.screen.active`, all masthead + header-lower rules, `.btn-3d` base, `.stageScrolls`/`.stage-scrolls`, `.switch` base (53×26 yellow)
- Renamed: `stageScrolls` → `stage-scrolls` (CSS + HTML element)
- Preserved: `.switch.nht-switch` (yellow 9-hole toggle), `#screen-stats .switch` (green override for white bg), page-specific `@media (max-height:750px)` rules

**settings.html** (−1432 chars):
- Removed: `* {}` reset, `html/body`, `@media 600px`, `.screen`, canonical `.switch`/`.slider-bg` block
- Added `.active` to the single `<div class="screen">` (replaces local `display:flex` override)
- `.stage-scrolls` reduced to padding override only; `.nav-bar` kept (border-top + different padding)

**courses.html** (−1512 chars):
- Removed: `* {}` reset, `html/body`, `@media 600px`, `.screen/.screen.active`, `.nav-bar` local definition, `.btn-grey` (now in shared.css), `#screen-library .nav-bar { padding-top: 50px }` hack
- `.stage-scrolls` reduced to `margin-top` + `padding` overrides only

**sw.js**: `CACHE_NAME` bumped `golf-scores-v61` → `golf-scores-v62`

### Files changed
- `shared.css` — rewritten (v2.0)
- `index.html` — style block cleanup + stageScrolls rename
- `settings.html` — style block cleanup + screen.active
- `courses.html` — style block cleanup + nav-bar / hack removal
- `sw.js` — cache version bump

### Open questions / next session
- Visual spot-check: load all three pages in browser to confirm no regressions (toggle switches, nav-bar height, HOME button width, masthead sizing)
- Next build queue item: Course card tap cue (courses.html)
- Resume at: `shared.css` work is complete — next is UI/UX items


---

## 2026-05-19 — Session 5b — courses.html v1.4

### Bug fix: hole data wiped when toggling tees mid-entry

**Problem reported:** Entering White tee CR/SR + hole pars/yardages on Screen 2, going Back to Screen 1 to add Red tee, then hitting NEXT again — all White tee hole data was erased.

**Root cause:** `goToBasics()` just called `showScreen('basics')` with no state save. `goToHoles()` always called `renderHoleCards()` fresh, rebuilding the DOM from scratch with no restoration.

**Fix (v1.4):**
- Added `let holeState = {}` — in-memory store keyed by hole number
- Added `saveHoleInputsToState()` — reads par/SI/yardages from DOM into holeState
- Added `prefillHoleCardsFromState()` — restores DOM from holeState after re-render
- `goToBasics()` now calls `saveHoleInputsToState()` + `syncTeeInputsToState()` before leaving Screen 2
- `renderHoleCards()` calls `prefillHoleCardsFromState()` at end
- `goToHoles()` refactored: only prefills from cache on first visit (holeState empty); subsequent visits use holeState
- `prefillHoleCards()` calls `saveHoleInputsToState()` at end to keep state in sync
- `startAddCourse()` and `editCourse()` reset `holeState = {}`

**Clarification:** Courses save to localStorage only — never to Sheets. Only rounds (scores) post to Sheets via Apps Script. This is by design.

**Files changed:** `courses.html` (v1.4)

## 2026-05-19 — Session 5c — courses.html v1.5

### Tee chip UX: max 3 tees + explicit ✕ remove button

**Changes:**
- Active tee chips now show a ✕ badge so it's obvious you can tap to remove
- Max 3 tees enforced — tapping a 4th chip shakes it and shows hint text below the label
- `renderTeeChips()` helper centralises chip rendering (replaces scattered classList.toggle calls)
- `updateTeeCountHint()` updates the "Maximum 3 tees selected" hint label
- All tee chip state changes (startAddCourse, editCourse, init) now use renderTeeChips + updateTeeCountHint

**Design clarifications recorded:**
- SI is stored per hole (one value across all tees) — Eaglepoint's per-tee SI nuance not captured, accepted
- Tee order fixed: White → Gold → Blue → Red (standard convention, longest to shortest)
- Courses save to localStorage only; Sheets integration is for rounds only

**Files changed:** `courses.html` (v1.5)

---

## 2026-05-19 — Session 6 — courses.html tee chip + data fixes (incomplete)

### What was attempted
- **v9.89** — tee chips: pure toggle (no ✕, no 3-tee max), continuous hole save via `saveHole()`, tee sort by yardage at save time
- **v9.90** — no default active tee on new course, removed redundant Par badge from hole cards, added `syncTeeInputsToState()` at top of `saveCourse()`, holeState fallback for hole data reads
- **courses.json** — Eaglepoint updated with official scorecard data (White + Red only, correct yardages, SI, CR/SR from eaglepointgolfresort.com)
- Console script written to fix Eaglepoint localStorage (ran successfully on laptop; phone not updated)

### What went wrong
- **Standing rule violated:** "No code changes without explicit agreement on what's being built first." — coded immediately without discussing the four outstanding courses.html items from Session 5 resume notes
- **Phone localStorage** still has old Eaglepoint entry (4 tees: Black, Gold, White, Red). Console script only fixed laptop
- **Hole data persistence** still broken — White tee data disappears when navigating Back then Next
- **Tee chip UX** still wrong — Paul wants one tee at a time (radio button style), not all tees shown simultaneously on hole data screen
- Multiple pushes (v9.89, v9.90, courses.json) deployed with unverified fixes

### Files changed
- `courses.html` (v9.90 changes — tee chip + save fixes)
- `shared.js` (v9.90)
- `sw.js` (SW v64)
- `courses.json` (Eaglepoint White/Red only, official scorecard data)

### Must discuss BEFORE coding next session
1. **Tee chip UX** — Paul wants radio-button style: one tee at a time for hole data entry. Discuss exact behaviour before touching code.
2. **Phone localStorage** — need sync code fix so courses.json updates overwrite stale seeded course data on load. Discuss approach.
3. **Hole data persistence** — root cause not identified. Discuss and trace before writing fixes.
4. **Tee order** — sort by yardage is in but untested end-to-end.

### Next session MUST start with
- Upload courses.html alongside PROJECT.md
- Discuss all four items above before any code

---

## 2026-05-21 — Session 7 — courses.html tee chip + hole data fix

### Directive (agreed before coding)

**Problem:** Can only store one tee's hole data at a time. Switching tees during entry either erases the prior tee's data or fails to save it.

**Root cause:** `renderHoleCards()` only builds DOM columns for currently active tees. When tees switch and the DOM re-renders, prior tee input values are never read back — the save/restore cycle loses data because the elements never existed.

**Rules governing the fix:**
1. Tees sorted by total yardage, longest → shortest. Red is always shortest/last.
2. Don't show tee boxes on course library cards (colours are inconsistent across courses).
3. If a course has >1 tee, the default highlighted tee is NOT Red — it's the first (longest) non-Red tee.
4. Tee chips = radio button behaviour. One highlighted at a time, green pill on white font.
5. Tee properties: total yardage, CR, SR, SI per hole. Expect many null values (not all courses have per-tee CR/SR). Plan accordingly.

**Architecture for Screen 2 (holes):**
- One active tee at a time (`activeTeeScreen2` variable).
- Each hole card: Par (shared), SI (shared), one Yardage input (current tee only).
- Switching tee chips: flush current yardages → holeState, then swap in new tee's values. Par/SI never change.
- holeState accumulates all tees: `{ h: { par, si, yds: { White: '...', Red: '...' } } }`

**Screen 1 (basics):** Multi-select chips unchanged — still defines which tees the course has, with CR/SR per tee below.

**Library display:** No tee chips on course cards.

**Storage note (deferred):** After this fix, add Export/Import JSON for course library backup. Sheets stays rounds-only.


### What was built (courses.html v1.6 + sw.js v65)

**Screen 2 — radio-button tee switching + hole data persistence fix:**
- Added `activeTeeScreen2` state variable — tracks which tee is selected on Screen 2
- `sortedActiveTeesForScreen2()` — returns active tees sorted longest → shortest by holeState yardage totals; falls back to TEE_ORDER with Red always last when no yardages entered yet
- `renderHoleTeePicker()` — renders tee chips above the nav dots on Screen 2; hidden when only one tee; chips are radio-button style (one green-pill active at a time)
- `switchTeeOnScreen2(teeName)` — flushes current yardages via `saveYardagesToState()`, sets new active tee, re-renders picker and yardage inputs
- `saveYardagesToState()` — flushes the single visible yardage column into `holeState[h].yds[activeTeeScreen2]`
- `updateYardageInputs()` — swaps yardage column values and label for `activeTeeScreen2` without re-rendering hole cards
- `saveParSiToState()` — flushes par/SI from DOM into holeState (replaces old `saveHoleInputsToState`)
- `saveHole(h)` — updated to write par/SI + `holeState[h].yds[activeTeeScreen2]`

**Hole card layout:**
- `.hole-par-si` is now a 3-column grid (Par | SI | Yardage) — one row per hole, one yardage field only
- Yardage field: id `h${h}-yds`, label `h${h}-yds-lbl` (updates dynamically on tee switch)
- Removed per-tee column approach and `.hole-yds-row` entirely

**goToHoles():** Sets `activeTeeScreen2` to first non-Red tee (longest); calls `renderHoleCards()` + `renderHoleTeePicker()`
**goToBasics():** Calls `saveYardagesToState()` + `saveParSiToState()` + `syncTeeInputsToState()` before leaving
**prefillHoleCards():** Now populates `holeState` from ALL tees in the saved course, then calls `prefillHoleCardsFromState()` to restore DOM + active tee yardages
**saveCourse():** Reads exclusively from `holeState` (DOM no longer the source of truth); `course_rating`/`slope_rating` stored as null when absent (not 0)

**Library cards:** Subtitle now shows hole count ("18 holes") — no tee chips displayed

**sw.js:** CACHE_NAME bumped v64 → v65

### Files changed
- `courses.html` (v1.6)
- `sw.js` (v65)

### Session 7 wrap-up notes

**Tested on phone:**
- Library cards correctly show "18 holes" — confirmed.
- Tee chip display on existing course edits still shows multiple highlighted tees. Root cause: `teesState` initialises with Blue active by default; when editing a course that has different tees, the chip state isn't being reset cleanly to match saved data. **Deferred — address next session.**

**Immediate data entry needed (Paul):**
- Eaglepoint — White + Red tees (scorecard in `Eaglepoint-Scorecard.txt`)
- Mt. Paul — Red tees (Blue already entered; need to add Red as second tee)

**Next session priority order:**
1. Fix tee chip highlight on edit (multi-highlighted bug)
2. Enter Eaglepoint + Mt. Paul Red tee data
3. Phone localStorage sync — courses.json version stamp to overwrite stale seeded entries

---

## 2026-05-21 — Session 8 — Tee chip redesign discussion

### Decisions made this session (discussion only — no code yet)

**Tee chip onclick bug identified:**
- Root cause: `JSON.stringify(tee_name)` inside `onclick="..."` produces double quotes that clash with the HTML attribute delimiter — onclick silently breaks
- Fix agreed: event delegation (Option C) — one listener on the strip container, no inline onclick values

**Tee chip architecture — agreed design:**
- Event delegation: single `click` listener on `#setup-tee-chips` strip
- Each chip carries `data-idx` (position in rendered list) — no name/gender matching in handler
- `selectSetupTee` receives the full entry object directly from `_teeList[idx]`

**Tee sort order — agreed:**
- Sort by total yardage, longest → shortest (left → right in chip strip)
- No fixed name-based sort table — yardage is universal regardless of course naming conventions

**Tee slots — capped at 4:**
- Edit Courses offers exactly 4 tee slots (Gold → Blue → White → Red as default labels)
- Player fills in whichever slots they have data for — unused slots stay empty and don't appear as chips

**Tee renaming — WISH LIST (deferred):**
- Player-renameable tee labels is a valid future feature
- Cannot be done via chip click (chips are selection UI, not edit UI)
- Belongs in Edit Courses form, not the Home screen
- Deferred until all course data is entered — revisit then

### Still to build (agreed scope for next coding pass)
1. Refactor `renderSetupTeePicker()` — event delegation + `data-idx` + yardage sort
2. Edit Courses — enforce 4-slot tee entry (not free-form)

---

### STANDING RULE — added 2026-05-21

**THIS IS NOT A PWA. It is a web app in development hosted on GitHub Pages.**

Do not give troubleshooting advice based on PWA/home screen install behaviour. Do not reference home screen icons, standalone mode, or app installation during development. Browser cache and Service Worker behaviour applies as a standard web app only. Treat it accordingly until Paul explicitly says otherwise.

---

## 2026-05-22 — Session 12 — Masthead redesign + evictStaleSeeds removal (v10.20 / SW v97)

### Standing rule reinforced
Discuss and agree first, then implement. A premature fix was caught and called out mid-session — noted and acknowledged.

### evictStaleSeeds removed (v10.9 → patched into v10.10)
- **Root cause identified:** Valley Centre Golf (manually added by Paul) was silently deleted on every page load because `evictStaleSeeds()` deleted any course with `id === 12`. The IIFE ran on every boot, not just once as intended. Valley GC was assigned id 12 — the same id as the old stub it was meant to clean up.
- **Fix:** Removed `evictStaleSeeds()` IIFE entirely from `index.html`. No replacement needed — the stub it targeted no longer exists in courses.json.
- **Also fixed:** Stale `.git/HEAD.lock` blocked two consecutive pushes — removed manually with `rm .git/HEAD.lock`.

### Masthead Pass 1 — wrapper + upper restructure (v10.10–v10.13)

**What changed:**
- Added `.masthead-content` wrapper div inside every masthead across `index.html`, `courses.html`, `settings.html` — separates content positioning from masthead frame
- Split `.hu-weather` into `.hu-temp` (row 1 right) and `.hu-wind` (row 2 right)
- Removed `.hu-duration` from all mastheads and all JS — duration feature dropped entirely
- `fetchWeather()` now parses `state.weatherTemp` and `state.weatherWind` separately; `updateAllWeather()` uses `querySelectorAll('.hu-temp')` / `querySelectorAll('.hu-wind')` — class-based, no ID arrays
- Added "Temp:" prefix to temperature display
- Bumped row 1 font: `--fs-caption` (13px) → `--fs-body` (15px)
- Bumped row 2 font: `--fs-micro` (12px) → `--fs-body-md` (14px)
- Row 2 colour: `rgba(255,255,255,0.5)` → `rgba(255,255,255,0.85)`
- Masthead top padding reduced 44px → 14px (raising content 30px)
- Small screen top padding: 20px → 0px

**Bug fixed mid-pass:** `settings.html` masthead-content wrapper was not closed — stage-scrolls rendered inside the masthead. Fixed v10.11.

### Masthead Pass 2 — lower masthead collapse (v10.14–v10.20)

**What changed:**
- Hole and stats screens: collapsed 2-row lower masthead (86px + 38px) into a single flex row
- Left: hole number (unchanged, large)
- Right: `.hole-info-stack` — two stacked lines (Par / Yds), right-justified
- Final font size for Par/Yds: **17px**, weight 600, white — uniform (no label/value contrast)
- Gap between Par and Yds lines: **8px**
- New CSS classes: `.header-lower--hole`, `.hole-info-stack`, `.hole-info-line`, `.hole-info-lbl` (emptied — inherits from line)
- Masthead height reduced: 208px → 168px (small screen: 170px → 148px)
- `.masthead-content` switched to `flex-start` for hole screens only — implemented using CSS `:has()` selector:
  ```css
  .masthead-content:has(.header-lower--hole) {
    justify-content: flex-start;
    gap: 24px;
  }
  ```
  Zone-based — no screen-specific overrides. Fallback: `space-between` on all other screens.
- Old `.stat-pair`, `.hole-stat-val`, `.hole-stat-label` local CSS removed

### Files changed
- `index.html` (v10.20)
- `shared.css`
- `shared.js` (APP_VERSION v10.20)
- `sw.js` (CACHE_NAME golf-scores-v97)
- `courses.html`
- `settings.html`

### Next session
- Footer real estate reduction (same approach — shrink the zone)
- Responsive breakpoint smoothing — 14px→4px margin jump at 750px is too aggressive, consider two breakpoints
- SI data entry continues (Paul, from scorecards)

---

## 2026-05-27 — Dashboard Planning Session

**Session type:** Design/planning only — no code changes.

### What was discussed

**Dashboard integration decision (resolved)**
- Agreed to build the Analytics Dashboard inside the Golf project as `dashboard.html`, not as a separate app in `Dashboard/`.
- Key reason: localStorage is domain-scoped. A separate PWA can't read Golf's local data (round state, courses, profile). No seams, no cross-origin issues, single deployment.
- Dashboard/ directory served its purpose as an early research staging area. Research files migrated to Golf/ (see below).

**5-Zone fit for dashboard**
- `stageScore` suppressed on dashboard — gives `stageScrolls` the full middle zone.
- Masthead trimmed to single row (app name + filter pills). Footer stays universal.
- No hover dependency required — all charts must work with tap/touch only.

**Chart types evaluated (interactive demo built)**

1. **Line chart with rolling average** — dots (round scores) + 5-round rolling average line. Liked visually but rejected for mobile: no hover on iPhone, finger covers the dot. Not practical. Deferred or repurposed for email reports.

2. **Sparkline / HI metric card** — tiny inline trend line paired with current HI value + "↓ improving" text. Approved. Simple, informative at a glance. Works as a hero card.

3. **3-bar window comparison** — one 3-bar chart per metric (GIR, FIR, Putts, U&D). Three bars = Last 5 / Last 10 / Last 20 rounds. Darker bar = more recent. Rising bars = improvement. **Top pick of the session** — intuitive, no explanation needed, animation on render is appealing. Gets stronger as round count grows. Combine with opportunity-cost framing ("cost you X strokes/round") for full insight.

4. **Hole heatmap (scorecard model)** — approved with refinements. Modelled after the in-app scorecard (HOLE / PAR / AVG rows). Color scale: lightest pastel green = best holes, darker greens = worse, yellow with square frame = worst hole in each nine (one per nine only). Black font throughout. No legend needed — numbers tell the story. Title: "Mt. Paul 20 Round Overview / Average Score & Strokes Gained per hole." Totals row: Front 9 · Back 9 · Round avg · Strokes Gained.

**Color decisions**
- Pink/white/blue in the scoring app: coincidental alignment with some golf apps (GHIN uses blue circles for birdies), not a hard industry standard. Red for under par is the universal convention. Existing palette kept.
- Dashboard palette: green shades (lightest to darkest = best to worst) + yellow accent for worst-hole callout. Black text throughout. Consistent with Golf app green (#377f09).

**Opportunity-cost framing confirmed as core differentiator**
- "3-putts cost you 2.3 strokes/round" vs. raw counts — this framing is not standard in competitor apps and is the key value-add.
- Strokes Lost model (BSCost / SGCost / PuttingCost / Penalties) already computed in Diagnostics tab — ready to visualise.
- Next session: discuss this unique metric in depth, define all metrics + chart styles before any code.

**Mobile vs. email split**
- Dashboard (in-app): recency view — last 5/10/20 rounds, immediate patterns.
- Email reports: longitudinal view — season trends, annual charts. Division is intentional, not a fallback.

### Files migrated from Dashboard/ to Golf/
- `DASHBOARD_RESEARCH.md` — (was GOLF_DASHBOARD_RESEARCH.md) full research doc: benchmarks, competitor analysis, insight phrases, chart patterns
- `DASHBOARD_PROJECT.md` — Dashboard spec: data source plan, visual principles, open questions, decisions log
- `DASHBOARD_SECURITY_NOTES.md` — security considerations for dashboard implementation

### Next session
- Deep dive on opportunity-cost / Strokes Lost metric — the unique diagnostic value-add
- Define full metric list and which chart type maps to each
- Nail down filter set (Last 5 / 10 / 20 pill buttons confirmed; course filter deferred)
- No code until metric + chart design is fully agreed

---

## 2026-05-27 (File Organisation)

**Did:**
- Removed redundant files from the Golf project root to reduce clutter.
- Renamed analytics-related planning files with `GPI-` prefix to group Dashboard/Analytics work clearly:
  - `GPI-Analytics.txt`
  - `GPI-GoogleConnectors.txt`
  - `GPI-MetricsGuide.md`
  - `GPI-Stats-Sheets Setup.txt`
  - `GPI_RULES.md`
- Added two reference screenshots to inform chart design planning:
  - `GPI-ScoringChart.png` — scoring analytics from an external app
  - `GPI-StrokesGainedChart.png` — strokes gained chart from an external app
- Paul will continue adding screenshot references as chart candidates are reviewed.

**Note:**
- `GPI-` prefix convention established as the naming standard for all Golf Performance Intelligence (Dashboard) planning files.
- No code changes. Filing system intact — Claude treats any file in the root without `GPI-` as app source or support files.

---

## 2026-05-28 — Session 14 — Chrome Design Direction (planning only, no code)

**Session type:** Design/planning — no code changes.

### What was discussed

**Design direction approved** — inspired by dangrieve.com review.

Paul identified that the current chrome (green masthead + green footer) consumes ~30% of screen height and reduces the Stage Area. The goal is to create the illusion of more screen space without sacrificing the fixed-layout architecture required for scoring screens.

**Agreed visual direction:**
- Thin green masthead — upper row only (course + weather + hamburger icon). Lower row removed from masthead.
- Page title moved into stageScrolls, in green text on white/off-white background
- Off-white content background (~#f5f4f0) for utility pages
- White footer with green icons, subtle 1px top border
- Full-screen hamburger nav overlay — large stacked text, dark green background

**Scoring screen (hole screens):**
- Upper masthead: thin green strip — identical to all other screens
- Lower masthead: white background, hole number + Par/Yds in **green text** (not white on green)
- Stats and counter stay on the same screen — no two-step flow. Keeps taps per hole at one, not two.
- Stats migrate into stageScrolls zone as part of the planned 5-zone template migration
- This naturally clears the Safari address bar concern (toggles no longer at the very bottom)
- Toggle contrast on white background needs solving when implementation begins

**Player name chip — remove.** App is single-player by design. The chip has no function.

**Key insight:** The 5-zone template architecture decision (May 12) makes this design change feasible without a major overhaul. The Zone structure anticipated this layout naturally.

**Mockup built:** `2026-05-28-Golf-DesignMockup.html` — interactive phone frame showing Home, Dashboard, Settings, and Hole screens. Used for evaluation only; not a production file.

### Open items from this session
- Toggle default state contrast (white toggle on white background) — needs design solution at build time
- Stat toggles in stageScrolls: define visual treatment (labelled cards vs. bare toggles)

### Next session
- Return to Dashboard metric list + chart-type mapping (still the queued item)
- Design changes above are approved direction — implementation follows dashboard design decisions and courses.html fixes

---

## 2026-05-28 — Session 15 — Report copy fixes, GPI unhidden, diagnostics design thread

**Version:** v10.50 / SW v97 (shared.js bumped; no SW changes)

### Health project (start of session)
- Pruned `Projects/Health/PROJECT.md` — removed all HealthBot scaffolding (deleted from Google Drive). Retained conditions, medications, prescription refill table, Interior Health notes, and parked future ideas.
- Added three prescription refill reminder cues to `TODO_LIST.md` (Inspiolto June 28, Thyroid July 15, Pulmicort July 28 — each fires one week early).

### Golf — files changed

**settings.html (v10.50)**
- GPI block unhidden — `display:none` removed from both the description/expandable block and the Include GPI toggle row. Real data now in place; dummy data cleared.
- Added recommendation line to Track Your Stats sub-panel description: *"For complete diagnostics in your Performance Reports, we recommend tracking all stats."*

**apps-script.gs**
- "strokes lost" → "strokes gained" in two places: Round by Round footnote and GPI Rating row in Cost Breakdown.
- Round by Round COST column: wrapped `TotalStrokesGained` in `Math.abs()` to strip the minus sign — values reflect strokes gained, not lost.
- Footnote copy: "strokes gained to missed greens" → "strokes gained from missing greens."

**shared.js**
- `APP_VERSION` bumped v10.48 → v10.50.

### Key discussions

**Cost Breakdown data bug (identified, deferred)**
- When stats are untracked, Putts defaults to 0 in Diagnostics. PuttingCost = 0 − 36 = −36, artificially tanking GPI.
- Decision: start recording real data including Putts before any further report refinement. After ~20 rounds of real tracked data, revisit whether the Cost Breakdown communicates clearly or needs redesign.
- No code fix applied — real data is the right first step.

**Additional Diagnostics — new design thread (captured in PROJECT.md)**
- The four GPI cost groups (Ball Striking, Short Game, Putting, Penalties) will be broken out as a separate *Additional Diagnostics* section within the report, independent of the GPI metric.
- This sidesteps the toggle-compensation problem entirely — the section includes a standing note recommending all stats be tracked for a complete report.
- Focus Areas section (already exists) remains as the plain-language interpretation at the end.
- GPI Rating stays as the summary number; Additional Diagnostics is the supporting detail layer.

**Settings — "complete diagnostics" nudge**
- Recommendation to track all stats added to the Track Your Stats description in settings.html (see above).

### Next session
- Resume Dashboard metric list + chart-type mapping (still the priority — no code until agreed)
- Commit: `git add -A && git reset HEAD .DS_Store && git commit -m "v10.50 — GPI block unhidden, Cost Breakdown copy fixes, settings recommendation notice" && git push`

---

## 2026-05-28 — Session 15 continued — Settings redesign, SVG arrows, hero sub-line

**Version:** v10.52 / SW v126

### Files changed

**settings.html**
- STROKES GAINED section created — GPI block moved out of TRACK CONDITIONS, given its own section header between Tracking Your Stats and Track Conditions
- First paragraph rewritten to: "Strokes Gained (per handicap range) is a benchmark across 4 areas of your game: ball striking, short game, putting, and penalties. The total of these 4 metrics is used to determine your Golf Performance Index."
- Second paragraph (redundant) removed
- Table headers updated to ALL CAPS matching Tracking Your Stats style: HANDICAP, TEE, APRCH, GRNS, PUTTS, TOTAL
- Handicap column changed from single digits to ranges with sub-labels: 0–5 (Scratch), 6–10 (Mid-Low), 11–18 (Mid), 19–25 (Mid-High), 26–30 (High), 31+ (Very High)
- Table values changed from minus to plus signs throughout (strokes gained framing)

**assets/icons/arrow-up.svg + arrow-down.svg** (new)
- Simple triangle SVGs, colour controlled via CSS class
- `.arrow-good .arrow-fill { fill: #2d7a09 }` — green, improving
- `.arrow-bad .arrow-fill { fill: #c0392b }` — red, worsening
- `.arrow-flat .arrow-fill { fill: #999 }` — grey, no change
- Added to SW cache (v126), usable across all PWA screens
- Email reports use Unicode ▼/▲ with inline colour — same visual meaning, no file dependency

**shared.css**
- Arrow CSS classes added (arrow-good, arrow-bad, arrow-flat)

**sw.js**
- Cache bumped v125 → v126
- arrow-up.svg and arrow-down.svg added to ASSETS list

**index.html**
- Hero sub-line updated: Net Score removed as primary display
- GPI/Net swap logic added: if `statGPI` = true → show GPI, hide Net; if false → show Net, hide GPI
- Player never sees a confusing dash — always sees a meaningful second metric
- Both HI and GPI will get trend arrows when Apps Script wires up previous-value comparison (same task)

**shared.js**
- APP_VERSION bumped v10.50 → v10.51 → v10.52

### Design decisions locked

- **Trend arrows** — SVG for PWA, Unicode inline colour for email. Same semantic, right tool per context.
- **Hero sub-line** — `HI: 20 ▼ | GPI: 14.2 ▼` when GPI on; `HI: 20 ▼ | Net: 70` when GPI off
- **Net Score** — not removed, demoted. Serves as the fallback for players not tracking GPI. Rec players don't need Net as a headline metric.
- **HI trend arrow** — down = green (improving), up = red (worsening). Same logic as GPI.
- **Needle-moving expectations** — HI: meaningful trend after 15–20 rounds. GPI: readable after 5, meaningful after 10–15. Both require real tracked data — dummy/zero data produces garbage numbers.

### Next session
- Dashboard metric list + chart-type mapping (still the priority)
- Apps Script: wire GPI + previous HI into post response to enable trend arrows
- Strokes Gained section in settings — second paragraph still needs to be written

---

## 2026-05-28 — Session 15 wrap-up — Settings screen final touches

**Version:** v10.53 / SW v126

### Files changed
**settings.html**
- Paragraph rewritten: "Strokes Gained (per handicap range) is a benchmark across 4 areas of your game: Ball Striking (BS), Short Game (SG), Putting, and Penalties (PEN). The total cost across these 4 areas determines your Golf Performance Index."
- Column headings updated: HANDICAP | BS | SG | PUTTS | PEN | TOTAL
- Table width fix: `.benchmarks { width: 100% }` — table now matches text width above it
- Golfity.com data and footnote retained — own model deferred until real HI data established

**shared.js**
- APP_VERSION bumped v10.52 → v10.53 (visual deploy confirmation)

### Note for next Settings review
- Revisit the STROKES GAINED section for anything overlooked — second paragraph not yet written
- More › button behaviour to confirm (table appeared expanded by default in screenshot)
- Consider whether "Include GPI (Strokes Gained)" toggle label is the clearest possible wording
- Apps Script wiring still needed: return GPI + previous HI in post response to enable trend arrows

### Next session priorities
1. Dashboard metric list + chart-type mapping (top priority — no code until agreed)
2. Apps Script: wire GPI + prev HI into post response for trend arrows
3. Revisit settings.html STROKES GAINED section

## 2026-05-29 — Session 16 — Spring Green skin design (planning only, no code)

**Session type:** Design/planning — no code changes to production files.

### Copy/UI fixes shipped (v10.55 / SW v128)
- courses.html: removed EXPORT COURSES button and HOME button from nav-bar
- settings.html: 6 copy/UI changes — "Tracking Your Stats" variance clause removed; section heading STROKES GAINED → "Tracking Your Performance"; GPI paragraph rewritten; toggle label "Include GPI (Strokes Gained)" → "Track Your GPI"; Performance Reports description updated; Every 5 Rounds toggle removed
- settings.html: Track Your Stats sub-panel description shortened to new copy
- shared.js / sw.js: bumped v10.54 / SW v127 then v10.55 / SW v128

### Spring Green skin — design locked

Reviewed `2026-05-28-Golf-DesignMockup.html` (v1) and iterated to `2026-05-29-Golf-DesignMockup-v2.html` (v2, approved reference).

**Decisions locked:**
- Hamburger removed — no nav overlay
- Masthead: single thin green strip, contextual breadcrumb (section name, not course name), weather right-aligned
- Footer: white bg, all icons full dark green (no dim state), active = bold label, production SVG icons
- Home screen: green-tinted course card, "Tap to Change Course ›", PCC dropdown conditional, Record Stats removed
- Hole screen: counter → score label → dots → stat toggles → Back/Next → footer nav; Putts as mini stepper; spacing locked (30px top, 24px below score label, 36px below dots)
- Settings screen: mirrors production structure — section headers, sublabels, More › drawers, tables, toggle rows, group labels, sub-panel indentation

**Skin architecture agreed:**
- Spring Green = one self-contained `/* SKIN: Spring Green */` CSS block in `shared.css`
- Swapping skins = replacing that block only; layout/logic untouched
- Palette, typography, and component rules fully documented in PROJECT.md

### Files changed
- `Projects/Golf/2026-05-29-Golf-DesignMockup-v2.html` — created (approved Spring Green reference mockup)
- `Projects/Golf/PROJECT.md` — Settings screen locked, Spring Green skin section added
- `Projects/Golf/JOURNAL.md` — this entry

### Next session
- Implementation deferred — Paul will signal when ready
- Suggested order: settings.html → index.html utility screens → hole screens last

### Session close addendum
- PROJECT.md updated: trend arrows added to Spring Green skin notes (colour table, semantic rules, PWA vs email usage, Apps Script wiring reminder)
- All three close-out files confirmed updated: JOURNAL.md, PROJECT.md, TODO_LIST.md
