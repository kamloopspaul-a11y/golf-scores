# Session Summary — April 20, 2026

## Topics Covered

### AI Fluency & Interfaces
- Paul completed Anthropic AI Fluency courses this morning.
- Clarified the difference between Claude **models** (Sonnet, Haiku, Opus) and Claude **interfaces/products**:
  - **Claude.ai** — web/mobile chat (current session, running Sonnet 4.6)
  - **Cowork** — desktop app with local file system access
  - **Claude Code** — Terminal-based, coding-focused, local file + code execution access
- Sessions do not transfer between interfaces — each is a fresh start.
- Cowork is the right tool for accessing local GitHub/Documents directories directly.

### Dispatch App
- Paul installed and then removed Dispatch (remote iPhone task assignment).
- Removed due to security concerns: MacBook risk warnings + Chrome bookmark sync including old bank account.
- No current need for it anyway.

### Browser Automation Capability
- Confirmed Claude (via Claude in Chrome) can browse websites, fill forms, and interact with web pages.
- Example use case: ordering a pizza — navigate site, select items, fill form, stop before payment.
- User always confirms before any submit/purchase action. Payment handled by user.

### Golf Scores PWA — Distribution & Installer Planning

**Current architecture:** Results written to Google Sheets via Apps Script URL.

**Problem identified:** Google Sheets onboarding is too friction-heavy for non-technical golfers:
- Requires Google account
- Apps Script deployment
- Scary-looking Google OAuth permission screen
- Copy/paste of URL into app

**Storage alternatives considered:**
- **localStorage** — zero setup, single device only, no accounts needed
- **Pre-deployed Apps Script URL** — reduces user steps; OAuth warning remains the main hurdle
- **Airtable/Notion** — user enters a simple join code
- **Supabase/Firebase** — smooth UX, more backend build work

**Recommendation:** For a small known audience (golf friends), pre-deployed Sheets URL + plain-English instructions is the pragmatic path. For broader distribution, localStorage or a lightweight backend is cleaner.

One friend uses **Numbers** (free online service) for posting stats — worth noting as a possible integration or alternative.

### Golf Scores PWA — Feature Status & Roadmap

**Front End (in progress):**
- Player Stats added to Footer
- Resizing/too-tall issue not yet resolved
- Toggle switches (FIR, GIR, Up & Downs, 3-Putts) — need to capture data or gracefully ignore if unused
- Data tied into a database

**Phase 2 — Analytics Dashboard (not yet started):**
- Display player stats
- Insights and improvement suggestions

**Distribution plan:**
- Small rollout to golf friends first
- Paul assists with setup personally
- Gather feedback and usage data before broader release

### Business / Marketability (ongoing thread — deferred for later session)
- Golf pro subscription model noted as promising: branding + lead generation for a pro is a real value proposition
- Annual subscription angle worth exploring
- AI can handle marketing copy, emails, landing pages, social posts, customer support
- Scope creep acknowledged — no deadline, so it's evolution not a problem
- Validation step: get a few real golfers using it and see if they stick

## Action Items
- [ ] Upload PROJECT.md and index.html at start of next working session
- [ ] Resolve footer resizing (too-tall) issue
- [ ] Implement toggle switch data capture (FIR, GIR, U/Ds, 3-Putts)
- [ ] Plan database structure for stats
- [ ] Begin Analytics Dashboard planning (Phase 2)
- [ ] Revisit business/marketability thread in a future session
- [ ] Save this summary into Golf Scores local directory via Cowork or manually
