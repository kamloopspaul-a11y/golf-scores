# JOURNAL — Golf

*Append-only session log. Newest entries at the top.*

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
