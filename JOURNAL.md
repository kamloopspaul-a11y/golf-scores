# JOURNAL — Golf

*Append-only session log. Newest entries at the top.*

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
