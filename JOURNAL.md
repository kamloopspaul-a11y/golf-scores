# JOURNAL — Golf

*Append-only session log. Newest entries at the top.*

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
