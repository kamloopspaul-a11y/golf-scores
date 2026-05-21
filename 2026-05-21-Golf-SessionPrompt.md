# Golf PWA — Session Restore Prompt
**Date:** 2026-05-21  
**App version:** v9.90 / SW v65  
**Live:** https://kamloopspaul-a11y.github.io/golf-scores  
**Repo:** https://github.com/kamloopspaul-a11y/golf-scores

---

## What to read first
Upload `PROJECT.md` and `courses.html` alongside this file. Read `CLAUDE.md` for locked architecture decisions before touching any code.

---

## Where we left off — Session 7

Completed a significant refactor of `courses.html` (v1.6). The core bug was that hole data for a second tee was being lost when entering courses with multiple tee boxes.

### What was built

**courses.html v1.6 — tee radio-button + hole data persistence:**

- `activeTeeScreen2` — new state variable tracking which tee is selected on Screen 2
- Screen 2 hole cards now have a single yardage column (not multi-column per tee). Par and SI are shared across all tees; only yardage changes per tee.
- Tee chips above the nav dots on Screen 2 behave as radio buttons (one green pill active at a time). Chips only appear when there are 2+ tees.
- Switching tees: flushes current yardages into `holeState[h].yds[teeName]`, then swaps in the new tee's values. Both tees accumulate without loss.
- `holeState` is now the single source of truth — `saveCourse()` reads exclusively from it, not from DOM.
- Default active tee = first non-Red (longest yardage); Red never defaults as active.
- Tees sorted longest → shortest by total yardage; Red always last.
- Library cards now show "18 holes" / "9 holes" instead of tee names (tee colour is inconsistent across courses).
- SW cache bumped v64 → v65.

### Governing rules (agreed this session)
1. Tees sorted by total yardage, longest → shortest. Red always shortest/last.
2. No tee chips on library course cards.
3. If course has >1 tee, default highlighted tee is NOT Red.
4. Tee chips = radio button — one active at a time, green pill / white text.
5. Tee properties: total yardage, CR, SR, SI per hole. Many null values expected — plan accordingly.

---

## Still to test
- **Enter a new course with two tees** (e.g. White + Red): enter White hole data, tap Red chip, enter Red yardages, save. Verify both tees persisted in localStorage.
- **Edit an existing course**: go Back from Screen 2 to Screen 1, add a second tee, go Next, confirm original hole data still present.
- **Single-tee course**: confirm tee chip strip is hidden on Screen 2.
- **Phone localStorage**: still has old Eaglepoint entry (4 tees: Black, Gold, White, Red). Needs a sync fix — `seedCourseCache()` currently skips overwriting existing entries. Approach to discuss: version-stamp in `courses.json._meta` triggers overwrite when bumped.

---

## Next build queue (in order)
1. **Phone localStorage sync** — courses.json version stamp → overwrite stale seeded entries on load
2. **Export/Import JSON** — course library backup against Safari cache wipe (localStorage only, no Sheets sync for courses)
3. **Course card tap cue** — "Change Course ›" sublabel on Setup screen (index.html)
4. **Sample Performance Report** — email report preview
5. **Settings bridge** — localStorage → Sheets Settings tab sync

---

## Key file versions
| File | Version |
|------|---------|
| `index.html` | v9.90 |
| `courses.html` | v1.6 |
| `settings.html` | v1.9 |
| `shared.css` | v2.0 |
| `shared.js` | v9.90 |
| `sw.js` | SW v65 |
| `apps-script.gs` | v2.1 |
