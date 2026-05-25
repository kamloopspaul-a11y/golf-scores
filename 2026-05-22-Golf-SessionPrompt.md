# Golf PWA — Session Restore Prompt
**Date:** 2026-05-22
**App version:** v10.8 / SW v85
**Live:** https://kamloopspaul-a11y.github.io/golf-scores
**Repo:** https://github.com/kamloopspaul-a11y/golf-scores

---

## What to read first
Upload `PROJECT.md` and `index.html` alongside this file. Read `CLAUDE.md` for locked architecture decisions before touching any code.

---

## Standing rule — discuss before writing code
Diagnose and discuss the problem first. Agree on a plan. Then implement. No exceptions. This rule was established 2026-05-22 after a premature fix was written and had to be rolled back. It exists because hasty fixes without understanding the architecture waste sessions and create new bugs.

---

## Where we left off — Session 8

### Stage Area shift — fully resolved

The Stage Area was inconsistent in height and position across screens. Root cause: the 5-zone template migration (locked 2026-05-12) was never fully completed. Three separate issues across three files, all traced back to `margin-top: 12px` copy-paste and a legacy 220px footer override from the old stats-in-footer design.

**Changes made (all pushed):**

`shared.css` — Zone 2 updated: `.stage-score` added (`flex: 0 0 auto`). Both stage zones documented as flush with no gaps. (SW v83)

`index.html` — All local content classes: `flex: 1 0 auto` → `flex: 1 1 auto`; `margin-top: 12px` removed from all stage zones; legacy 220px `.footer` override removed; per-screen footer reset block removed. (SW v83–v85)

`courses.html` — `margin-top: 12px` removed from `.stage-scrolls` override; local `.footer` override removed entirely. (SW v84–v85)

`shared.js` — `APP_VERSION` v10.7 → v10.8

`sw.js` — SW v85

**Result:** Stage Area is now consistent in height and position on all screens. Footer height governed solely by `shared.css` on every page.

### Footer nav — already global
`NAV_LINKS` array in `shared.js` is the single source of truth. `renderFooterNav()` injects into any `<div class="footer" data-nav></div>`. Add or change a link once in `shared.js` and it propagates everywhere. Currently 4 links, room for more.

---

## Next session — masthead work
Review and tighten the upper and lower masthead zones — height, spacing, and visual balance across all screens. Discuss before touching anything.

---

## Pending (deferred, not forgotten)
- **Class name cleanup** — `.score-section` → `.stage-scrolls`, `.hole-actions` → `.nav-bar` in `index.html`. Naming only, no layout impact.
- **Phone localStorage sync** — `courses.json` version stamp → overwrite stale seeded entries
- **Export/Import JSON** — course library backup
- **Sample Performance Report** — email report preview
- **Settings bridge** — localStorage → Sheets Settings tab sync

---

## Key file versions
| File | Version |
|------|---------|
| `index.html` | APP_VERSION v10.8 |
| `courses.html` | v1.6 |
| `settings.html` | v1.9 |
| `shared.css` | v2.0 |
| `shared.js` | APP_VERSION v10.8 |
| `sw.js` | SW v85 |
| `apps-script.gs` | v2.1 |
