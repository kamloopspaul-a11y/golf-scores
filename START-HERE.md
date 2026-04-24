# START HERE — Session Handoff

> **Rewritten at the end of every working session.** Captures what's in flight so the next session doesn't start cold.

**Last updated:** April 24, 2026 (end of session 5 — "Sheets integration is live")

---

## TL;DR

Google Sheets integration shipped end-to-end. App posts real rounds to a live Apps Script webhook. Slider switches are wired. "3+ Putts" toggle replaced with a Putts counter (default 2) that drives a new Score column (strokes − putts). Spinner added to the Post Score flow. Folder renamed `golf-scores` → `Golf`.

## What shipped this session (v9.8 → v9.10-ish)

### Google Sheets webhook (the big one)
- **`apps-script.gs`** in the Golf folder — the bound Apps Script. Creates `Scorecard`, `Stats`, and `Settings` tabs on first run (`setup()`), self-heals Scorecard + Stats if missing on POST, accepts rounds from the PWA and appends rows.
- Live deployment URL wired into `index.html` line 652.
- Web app: Execute as Me / Access Anyone.

### Schema (locked further)
- **Player column dropped** — each user has their own Sheet, so it was redundant.
- **`Year` column added** to Scorecard (derived from Date) — implements the "Year column, not Year tab" decision.
- **`Tees` column added** to Scorecard — the app sends `tees: "Blue"` (still hard-coded for now).
- **`3+ Putts` flag replaced with `Putts` count + derived `Score`** on the Stats tab. Putts counter on the hole screen, default 2, clamped 0-9. Score = strokes − putts, computed server-side in Apps Script.
- Scorecard final columns: `Round ID | Date | Year | Course | Tees | H1…H18 | Front | Back | Total | Notes`
- Stats final columns: `Round ID | Date | Hole | FIR | GIR | U&D | Putts | Score`
- Settings: `Key | Value`, seeded with `Home Course | Kamloops G&CC` (should be `Mt. Paul` — see open issues).

### Slider switches wired (task #1 closed)
- FIR / GIR / U&D stay as toggles. Off = null (not tracked), on = 1.
- Putts is a counter now (not a toggle).
- `state.stats` is an 18-slot array of `{fir, gir, ud, putts}`. All switches reset to default on each new hole; revisiting a hole shows that hole's previous values.
- Sliders on non-hole screens (setup, midround, card, success) are still unwired visual placeholders. Left alone for now.

### UX polish
- **Post Score spinner.** Tapping Post Score jumps to the success screen immediately showing a spinning indicator + "Posting…", which swaps to "Posted!" when the webhook write resolves. Failure shows "Saved locally". No layout shift.

### Historical data
- **`2024-migration.csv`** generated at `~/Documents/Studio/` (one level above the repo — intentionally out of version control). 62 rounds, dates normalized to YYYY-MM-DD (including fix for two source typos), Tees all set to Blue, Round IDs `2024-001` through `2024-062`. All 62 Front/Back/Total sums verified against source.
- **Not yet imported** — Paul did test rounds but the CSV is still sitting on disk. Quick win next session.

### Repo housekeeping
- Local folder renamed `golf-scores` → `Golf`. GitHub repo on remote is still named `golf-scores` (live URL unchanged: https://kamloopspaul-a11y.github.io/golf-scores).
- START-HERE.md git cleanup paths updated to the new `Golf` folder.

---

## Locked architecture (do not revisit unless explicitly asked)

- **Sheets schema** — Scorecard / Stats / Settings tabs with the columns listed above. Date format `YYYY-MM-DD`. Year column derived from Date. Single-player-per-sheet.
- **Stats values** — 1/null for flags (FIR, GIR, U&D). Actual number for Putts. Score = strokes − putts computed server-side.
- **White-stage architecture** — body green, transparent chrome, white content stage. Footer grid 2-col.
- **Webhook principle** — Apps Script redeploys keep the same `/exec` URL. Ship fast, iterate the handler freely.

## Open issues to verify

1. **Stats tab header** — the header change this session (`3+ Putts` → `Putts` + `Score`) only takes effect when Stats is empty. If test data from earlier today is still there, Paul needs to **delete the Stats tab** and post a fresh round so it gets recreated with the new 8-column header.
2. **Service worker cache** — same drill as before if the PWA looks stale: delete from home screen, re-add from Safari.
3. **GitHub Desktop re-link** — after the folder rename, GitHub Desktop may need the repo re-added pointing at `~/Documents/Studio/Golf`. Paul reported successful push, so probably sorted.

## Next session — focused tasks (pick ONE)

1. **Stats summary on the Posted! screen** (Paul's last idea, deferred). Fixed-height summary inside `.success-body` (already `flex: 0 0 300px`, won't shift layout). Show front/back/total, FIR/GIR/U&D hit counts, average Score. Clear on New Round. ~30 min.
2. **Tee selector, one-time setup.** Mt. Paul has Blue + Red. Decided: not per-round, stored in Settings tab. Needs a small UI (radio or dropdown — revisit), restructure `COURSE.holes` to `{par, blue, red}`, read selected tees in the yardage display + payload. Future courses may bring white/gold/black.
3. **Import 2024 historical data.** CSV is at `~/Documents/Studio/2024-migration.csv` — 62 rounds, ready for File → Import → Append.
4. **Hide the footer stat controls on non-hole screens.** The setup/home screen still shows FIR/GIR/U&D toggles plus the old `3+ Putts` rocker (never updated to the new counter). They serve no purpose outside the hole screen and are inconsistent with the hole-screen counter. Cleanest fix: hide the whole `.footer-grid` on setup, midround, card, and success — they're not interactive anywhere but hole. Small CSS-only change.

## Out of scope (don't design for these yet)

- AI-assisted dashboard / natural-language queries
- Freemium → Pro unlock
- "Buy me a coffee" nag
- Book-a-lesson CTAs
- Municipal course sponsorship flow

Ship the free MVP first, get 5 users, then decide what earns a nag.

## Backlog (lower-priority, keep on file)

- Settings tab `Home Course` value should be updated to `Mt. Paul` (currently seeded as `Kamloops G&CC`)
- Hole 5 Red tee yardage (currently 94) will update when the new tee box is done in May
- Red tee yardages captured: `237, 120, 148, 265, 94, 320, 115, 230, 250` (front 9; back 9 = front 9 repeated, total 3,558)
- Test SW offline behaviour
- Create app icons (`icon-192.png`, `icon-512.png`)
- Privacy policy page (needed before OAuth distribution)
- Beta test with Dave
- Wire the placeholder sliders on non-hole screens (or remove them)
- iOS keyboard accessory bar on Player Entry — accepted for now

## Reference

- Canonical spec: `PROJECT.md`
- Redesign scope: `REDESIGN-PLAN.md`
- Live URL: https://kamloopspaul-a11y.github.io/golf-scores
- Webhook `/exec` URL is embedded in `index.html` line 652; redeploy doesn't change it.

## Notes for Claude

- Sheets integration is LIVE — don't re-litigate schema, date format, year-column, 1/0/null, or single-player-per-sheet.
- Paul works KISS, short answers, fast iteration. Task-specific sessions. Lead with a **TL;DR** on anything over a few sentences.
- Visual consistency matters — no layout shifts.
- Sandbox commits leave orphan `.git` lock files on Paul's Mac. Fix: quit GitHub Desktop first, then `rm -f ~/Documents/Studio/Golf/.git/*.lock ~/Documents/Studio/Golf/.git/objects/*.lock ~/Documents/Studio/Golf/.git/refs/heads/*.lock`, then reopen GitHub Desktop.
- After folder rename: if GitHub Desktop can't find the repo, File → Add Local Repository → `~/Documents/Studio/Golf`.
