# CLAUDE.md — Session Startup Routine

> **Purpose:** Cold-start procedure and tool inventory for any new Claude session
> on the My Golf Scores project. Read this FIRST.

---

## Cold-Start Procedure (do this every new session)

1. **Read this file** (CLAUDE.md) — tool inventory + operating rules
2. **Read the latest `SESSION_YYYY-MM-DD.md`** in this folder — current in-flight work
3. **Read `PROJECT.md`** — canonical spec
4. **Read top of `index.html`** (changelog) — confirm latest version
5. **Cross-check version numbers** across all four sources. If they disagree,
   `index.html` is authoritative.
6. **Greet Paul briefly**, confirm what we're working on. Don't start work
   until he says go.

---

## Operating Principles for Paul

- **KISS** — simplicity over elaboration. Apple / Jonathan Ive aesthetic.
- **Build fast, iterate** — don't over-explain. Ship a fix, get a screenshot,
  refine.
- **Short answers** unless he asks for depth.
- **Prose over bullets** for conversation. Structured lists are fine for
  technical reference docs and code.
- **No re-litigation** — locked decisions carry forward. Don't re-pitch ideas
  he's already decided against (leaderboard, dashboards, freemium, etc.).
- **Visual consistency** — fixed layouts, consistent fonts, no shifting elements
  between screens. This is a hard rule.
- **Cold-start friction is painful** — load all context up front, then work.

Paul is 67, retired, web/graphic designer background. Comfortable with
HTML/CSS/JS but not a daily coder. He mostly builds PWA web apps and tools.

---

## File Locations

- **Workspace root:** `~/Documents/Studio/Golf` (mounted in sandbox at
  `/sessions/.../mnt/Studio/Golf`)
- **Live URL:** https://kamloopspaul-a11y.github.io/golf-scores
- **Repo:** https://github.com/kamloopspaul-a11y/golf-scores
- **Migration CSV:** `~/Documents/Studio/2024-migration.csv` (out of repo on purpose)

When editing files in the workspace, use bash + python heredoc or sed when
possible — the Edit/Write/Read tools sometimes hit EPERM on this folder. The
bash sandbox path always works.

---

## Tools & Connectors Available

### File system
- `Read`, `Edit`, `Write` — for files in the sandbox or workspace mount
- `Bash` (`mcp__workspace__bash`) — Linux sandbox, Python 3, git, etc. Always works.
- `Glob`, `Grep` — search

### Connectors (status as of 2026-04-25)
- **Gmail** — authenticated. Can search threads, read messages.
  - No attachment-download tool exposed; ask Paul to drop attachments into
    chat directly when needed.
- **Google Drive** — authenticated. Can list, read, search, download files.
- **Engineering plugin skills** — installed and ready (no auth needed):
  - `engineering:debug` — structured reproduce/isolate/diagnose/fix
  - `engineering:code-review` — security/perf/correctness pass
  - `engineering:architecture` — ADR for design decisions
  - `engineering:system-design`, `tech-debt`, `testing-strategy`,
    `documentation`, `deploy-checklist`, `incident-response`, `standup`
- **Engineering plugin connectors** — installed but **NOT authenticated**
  (probably not needed for golf project): Linear, Asana, Notion, Atlassian/Jira,
  Slack, PagerDuty.
- **GitHub** — no dedicated connector yet. Paul pushes via GitHub Desktop.
  Future task: install a GitHub MCP so Claude can commit + push directly.

### Browser / desktop control
- **Chrome MCP** (`mcp__Claude_in_Chrome__*`) — Paul's desktop Chrome is
  connected ("Browser 1", macOS). Can probe live URLs, inspect DOM, run
  JS in tabs. Useful for verifying deploys when sandbox can't reach the live URL.
- **Computer use** (`mcp__computer-use__*`) — available for native desktop
  apps if needed. Requires `request_access` per app first.

### Network
- **Sandbox web fetch** is firewalled. `kamloopspaul-a11y.github.io` and
  `raw.githubusercontent.com` are **blocked**. Use Chrome MCP (Paul's browser)
  or ask Paul for screenshots when verifying live deploys.

---

## Skills Folder (Read-only at /sessions/.../mnt/.claude/skills)

- `pdf` — PDF read/edit/create/merge/split
- `docx` — Word docs
- `xlsx` — Excel / .csv / spreadsheet workflows
- `pptx` — slide decks
- `skill-creator` — make new skills
- `setup-cowork`, `schedule` — Cowork-specific
- `cowork-plugin-management:*` — plugin authoring
- `init`, `review`, `security-review` — utility commands

Read the relevant SKILL.md before doing anything that touches that file type.

---

## Known Issues / Workarounds

### Sandbox can't push to git
The sandbox has read/write on the workspace folder but commits leave behind
`.git/*.lock` files that the sandbox can't delete due to macOS extended ACLs.
**Workflow:** Claude edits files via bash/python in the workspace mount; Paul
commits and pushes from GitHub Desktop. Don't try to commit from sandbox.

If lock files persist after a session:
```
rm -f ~/Documents/Studio/Golf/.git/*.lock
rm -f ~/Documents/Studio/Golf/.git/objects/*.lock
rm -f ~/Documents/Studio/Golf/.git/refs/heads/*.lock
```

### Edit/Write tools hit EPERM on workspace
Use bash with python heredoc or sed instead. Example:
```bash
python3 <<'PY'
with open("/sessions/.../mnt/Studio/Golf/foo.txt", "r") as f: s = f.read()
s = s.replace("old", "new")
with open("/sessions/.../mnt/Studio/Golf/foo.txt", "w") as f: f.write(s)
PY
```

### iOS Safari cache stickiness
The SW is now network-first for HTML (since v9.12 / SW v13+), so deploys reach
iPhones on next page load. Don't recommend "clear website data" anymore.

### Cache-bust URLs
When Paul tests, append `?v=N` (any new value he hasn't used) to bypass HTTP
cache. Old `?v=N` values can be cached. Keep bumping.

---

## Architectural Decisions (locked — do not revisit)

- **Layout:** masthead fixed, stage `flex: 1 1 auto`, footer `flex: 0 0 auto`
  with `min-height: calc(220px + safe-area-inset-bottom)`. All screens have
  identical masthead/stage/footer dimensions.
- **Sheets schema:** Scorecard / Stats / Settings tabs, single-player-per-sheet,
  YYYY-MM-DD dates, Year column derived, FIR/GIR/PEN/UD/X-UD as 1/null,
  PUTTS as integer 0–9, Score = strokes − putts (server-derived).
- **Service worker:** network-first HTML, cache-first assets.
- **Visual consistency:** No layout shift between screens. Period.
- **Title font:** matches hole-num size (56/46px) for visual mass parity.
- **Folder name:** `Golf` (was `golf-scores`). Remote repo name unchanged.

---

## Out of Scope (don't design for these)

- AI-assisted dashboard / natural-language queries
- Freemium → Pro unlock
- "Buy me a coffee" nag screens
- Book-a-lesson CTAs
- Municipal course sponsorship flow

Ship the free MVP first, get 5 users, then revisit.

---

## End-of-Session Routine

When Paul says "wrap up" or "save state":
1. Ask if there's any open thread to capture
2. Write/update `SESSION_YYYY-MM-DD.md` with what shipped + next steps
3. Update `PROJECT.md` if any locked decision changed
4. Update `index.html` changelog if version bumped
5. Confirm everything's pushed (or remind Paul to push)
6. Bump the next-session focus list in `SESSION_*.md`

---

## Last Updated

April 25, 2026 — added Engineering plugin skills, Chrome MCP, Gmail + Drive
connector status. Bumped to v9.15 / SW v18.
