# My Golf Scores — Business & Marketability Notes

> **Purpose:** Capture business-model thinking that sits alongside the app spec in `PROJECT.md`. This is a working document — ideas and directions, not commitments. Blend into something actionable in future sessions.

**Started:** April 20, 2026
**Status:** Exploratory — feeling out viability

---

## The Idea (one sentence)

Turn the existing My Golf Scores PWA into a white-label, multi-tenant SaaS that golf academies subscribe to and distribute to their lesson clients as a branded stats-tracking tool — giving the pro an always-on touchpoint with their students.

---

## Why This Might Work

- The app already exists and is close to a working player experience
- Small golf academies have students but no ongoing digital relationship beyond a newsletter
- A branded app = a weekly+ touchpoint with every student, not just at lesson time
- CRM dressed as a score tracker: retention tool, upsell channel (indoor golf, merch, equipment), off-season engagement
- Pros aren't capacity-constrained on lessons — they're value-constrained on *retention and differentiation*
- No direct competitor in the regional-pro space; bigger players (GolfGenius, TrackMan, Shot Scope) play further up-market

---

## Target Customer Profile

**Primary:** Small golf academies — 1 to 3 pros, local/regional presence, active teaching roster.

**Example (Kamloops, real):** Nearby academy, two pros, also owns an indoor golf facility. Comfortable income, active newsletter, established lesson bookings. Not starving for business — looking for *stickier* relationships with existing students.

**Secondary (later):** Independent pros, small pro shops, teaching academies in resort/destination markets.

---

## Product Shape — Three Roles

| Role | What they do | UI |
|------|-------------|-----|
| **Academy Admin** | Signs up, uploads logo, picks accent color, invites pros, manages seats and billing | Admin panel |
| **Pro / Coach** | Sees a list of their students; drills into any player's rounds and stats to inform lessons and outreach | Coach dashboard |
| **Player / Student** | Uses the existing app, branded with the academy's logo, invited via magic link | Current PWA |

White-label scope (chosen): **logo + color swap** — simple, KISS. Not full custom-domain white-label (v1).

---

## Tech Shift vs Current App

- **Player app** — existing PWA mostly stays as-is, with branding hooks (logo, accent color pulled from academy config)
- **Backend** — Supabase (free tier to start). Auth, Postgres, row-level security (automatic data segregation: pro sees only their clients, player sees only themselves)
- **Coach dashboard** — new build. List of my students, per-player drill-down into rounds/stats, trend views
- **Admin panel** — new build. Logo upload, color picker, invite pros, manage seats. Can be faked in Supabase UI for MVP — you do it manually
- **Billing** — Stripe subscriptions
- **Regional course data** — pre-loaded Pars/Yardages for all 7 courses in the Kamloops area (and onward as you scale)

This is no longer a weekend project — it's roughly 3–4 stacked builds. But it does not all need to ship at once.

---

## Pricing Model — Clarified

**Two models exist. They get confused easily.**

### Per-client (consumer SaaS)
- Student pays directly, or pro bakes it into lesson packages
- Example: $15–30/mo per active student
- Doesn't fit small-academy use case — pushes cost to students, adds friction

### Per-seat (B2B SaaS) — *this is the chosen model*
- Academy pays a flat fee for pro seats; unlimited students included
- Predictable, Slack/Notion-style pricing
- Academy absorbs the cost as a retention/marketing tool

**Recommended starting price:** **$79–99/mo per academy** — includes 2 pro seats, unlimited players, regional course data.

**Rationale:**
- No direct comp to anchor against
- Rounding error vs. academy revenue
- Leaves room to offer $50/mo (or similar) to early co-development partners and have it feel like a real favor, not your standard price

**Co-development deal (proposed):** First 1–2 years at $50/mo for the local Kamloops academy in exchange for feedback, feature input, and real usage data. They become the case study.

---

## Unit Economics — Rough

- 10 academies @ $79 = **$790/mo** (~$9.5K/yr) — meaningful side income
- 50 academies @ $89 = **$4,450/mo** (~$53K/yr) — real small business
- 200 academies @ $99 = **$19,800/mo** (~$238K/yr) — scaled regional play, North America wide

Costs at these volumes: Supabase + Stripe fees are a small percentage. Main cost is Paul's time (and eventually support/onboarding).

---

## Value Proposition (what the pro actually buys)

- **Retention** — students think about their pro weekly, not just at lesson time
- **Engagement surface** — every round opens a branded app; natural place to surface indoor-golf promos, lesson discounts, merch, equipment referrals
- **Off-season presence** — newsletter reaches them 12×/yr; a stats app reaches them 30–40×/yr
- **Differentiation** — most local pros don't have a branded digital product
- **Coaching data** — real stats on real rounds, not self-reported anecdote. Better lesson conversations.

It's positioned as a retention + CRM tool, not a "get you more students" tool.

---

## Moats (small but real)

- **Regional course data** — pre-loaded Pars/Yardages for local courses. Low-tech, high-friction to replicate one region at a time
- **Pro-specific branding** — student loyalty attaches to the pro, not to a generic app
- **First-mover in regional-pro niche** — bigger players aren't looking here
- **Relationship with early pros** — co-development means the product fits *them* better than a generic competitor could

---

## Risks

- **Idea theft by the pros themselves** — low. Two working pros aren't going to hire a developer; they'd have already done it
- **Bigger player ships something similar** — real, but addressable with speed + regional depth + pro relationships
- **Low adoption from students** — biggest practical risk. If students don't open the app, the retention story collapses. Mitigation: pros actively push it in lessons; gamify with streaks, achievements later
- **Support burden scales** — every academy is a relationship. Plan for this before 20+ accounts

---

## Viability & Feasibility

**Viable?** Yes. Unit economics work at $79–99/mo. ~10 academies = meaningful side income. ~50 = real business. Scales to North America if the model proves out regionally.

**Possible?** Yes. Tech is not exotic — Supabase + existing PWA + coach dashboard + Stripe. Hard part is the first sale and the feedback loop, not the build.

---

## Phased Path (rough, not committed)

1. **Phase 0 — Finish player app.** Footer stats, toggles, DB structure, Phase 2 analytics dashboard. Current PROJECT.md roadmap.
2. **Phase 1 — Single-academy MVP.** Supabase backend. Local academy as first partner at discounted co-dev rate. Manual onboarding. Coach dashboard built. Admin panel faked in Supabase UI.
3. **Phase 2 — Validated pilot.** If first academy sticks and their students actually use it, onboard 2–3 more local academies. Still mostly manual.
4. **Phase 3 — Self-serve.** Real admin panel, Stripe checkout, automated onboarding. Push regionally (other BC markets first, then Alberta, then broader).
5. **Phase 4 — Scale.** North America. Partnerships, affiliate programs, possibly franchise-style territory reps.

---

## Open Questions (for future sessions)

- [ ] How does a student discover the app — QR at the facility, magic link in an email from the pro, or an app store listing?
- [ ] Do we need iOS/Android app store presence, or is PWA enough for v1?
- [ ] What's the onboarding flow for a new student — academy invites by email? Pro hands out a QR in lesson?
- [ ] What coach-dashboard views actually help a pro (not just look cool)?
- [ ] Is there a freemium/trial tier to reduce first-sale friction?
- [ ] Legal/business structure — sole prop, LLC, incorporate? Timing?
- [ ] How does this connect to (or stay separate from) the friends-and-family rollout currently in PROJECT.md?

---

## Notes

- This is a last-minute idea from April 20, 2026 — not validated, not committed
- Worth blending with `PROJECT.md` roadmap in future sessions once more thinking is done
- Don't let this derail current app-finishing work; it's a parallel thread, not a pivot

---

## Player Profile — Design Notes (May 5, 2026)

### Confirmed Direction
- **Solo app only** — one copy per player, not one copy per foursome
- Multi-player removed deliberately: turns user into scorekeeper, complicates stats ownership
- Marketing upside: each golfer buys/installs their own copy

### Player Profile — Lite Version (build next)
Core fields only:
- Player Name
- Home Course
- Handicap Index
- Email (for reports)
- Track Stats toggle (Footer Stats on/off)
- Stat Reports toggle + delivery settings (every N rounds OR weekly calendar)

Profile accessible by tapping player name in Stage (available on most screens).

### Player Profile — Deferred Ideas (build later)
- **Newsletter / retention mailer** — hide the UI hook now, build the backend later. Likely requires connector to a mailer service (Mailchimp, etc.). Good client-retention feature for a future paid tier.
- **Training schedule** — structured practice plan based on Diagnostics weak areas
- **Calendar integration** — log upcoming rounds, track frequency
- **Multi-player option** — each player has their own copy; shared leaderboard is a separate future product

### Report Trigger (replace hardcoded constants)
Move `REPORT_EVERY_N_ROUNDS` and `REPORT_LAST_N_ROUNDS` out of code and into Settings tab.
Player Profile writes: Player_Name, Player_Email, Track_Stats, Stat_Reports, Report_Trigger (rounds/weekly), Report_Every_N.
Apps Script reads Settings on every doPost — no redeployment needed when player changes preferences.

---

## Email Report — Design Improvements (May 5, 2026)

### UD Row Fix
Rewrite "of 12.4 opp." to "1.2 of 12.4 (10%)" with full colour treatment (green/amber/red) matching all other rows. Benchmark: HI-scaled thresholds (see below).

### HI-Scaled Benchmarks (Option B — recommended)
Replace fixed tour-average thresholds with HI-bracket-scaled thresholds. Four brackets: 0–9, 10–18, 19–28, 29+. Small lookup table in Apps Script. Every stat row gets a colour based on what's realistic for the player's handicap level, not tour standards. Meaningful from round one — no personal history needed.

Example brackets for Short Game Efficiency:
| HI Bracket | Green (good) | Amber (watch) | Red (needs work) |
|------------|-------------|---------------|-----------------|
| 0–9        | ≥50%        | 30–50%        | <30%            |
| 10–18      | ≥35%        | 20–35%        | <20%            |
| 19–28      | ≥25%        | 12–25%        | <12%            |
| 29+        | ≥15%        | 8–15%         | <8%             |

Apply same bracket logic to: FIR, GIR, UD%, PuttsPerGIR, TotalStrokesLost.

---

## Player Goal & Improvement Philosophy (May 5, 2026)

### Concept
Player states a goal in their Profile: "I'm a 20 HI, I want to reach 10 HI within 2 years." This becomes the engine behind stat reports — every report is framed around progress toward that goal, not just raw performance.

### Methodology
- Goal stored in Settings tab: `Goal_Target_HI`, `Goal_Timeframe_Months`
- Report calculates: current trajectory vs. required improvement rate
- Each focus area recommendation is weighted toward what moves the needle most for HI reduction (GIR improvement has the highest leverage for most handicaps)
- Nudges change as the player improves — early reports focus on biggest leaks, later reports celebrate milestones and refine targets

### Philosophy of Stat Delivery
Not "here's what's wrong" — instead "here's where you are, here's where you're going, here's what to work on this week." Progress tracker first, diagnostic tool second. Matches the Dashboard purpose already defined in PROJECT.md.

### Milestone Triggers (future)
- First round posted → welcome report, baseline established
- HI drops 2 points → celebration nudge in next report
- Halfway to goal → progress summary
- Goal achieved → special report + new goal prompt

### Connects to
- Player Profile (stores goal)
- HI-scaled benchmarks (performance judged relative to current HI, not target)
- Dashboard (visual trend toward goal)
- Newsletter/retention feature (deferred) — goal progress is natural content for a mailer


---

## "Cost" Metric & Strokes Gained (May 5, 2026)

### Naming Decision
- Renamed "Lost" → **"Cost"** in all report UI
- "Strokes Gained" is the official PGA Tour term — avoid repurposing it for our simplified model as it has a specific technical meaning golfers may know
- Current model uses fixed benchmarks (not personal averages) — more accurately described as "estimated stroke cost of your stat pattern"
- Future upgrade (20+ rounds): replace fixed benchmarks with player's own rolling averages → genuine personal Strokes Gained equivalent
- **Tooltip idea (deferred):** add ⓘ icon next to "Cost" column header with plain-English explanation: "An estimate of strokes given away based on your stat pattern. Lower is better. Becomes more meaningful as your personal baseline builds up."

### Plain Language Options Considered
- "Strokes Lost" — too close to official term, implies comparison to something specific
- "Cost" — clean, neutral, directionally clear
- "Given Away" — conversational, considered but wordier
- "Efficiency Score" — too corporate

