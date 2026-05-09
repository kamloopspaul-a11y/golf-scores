# Golf Metrics Guide
**Project:** Mt. Paul Golf PWA  
**Version:** 1.0 — 2026-05-08  
**Purpose:** Reference document for understanding every metric used in the GPI Report — what it means, how it is calculated, and how it applies to a player's game.

---

## 1. The Handicap System

### What is a Handicap Index (HI)?

A **Handicap Index** is a portable measure of a golfer's potential ability, expressed as a number (e.g., 20.4). It is maintained under the World Handicap System (WHS) and is meant to reflect the score a player is *capable* of shooting on their best days — not their average.

- A **lower HI** means a better player. A scratch golfer has an HI of 0.0.
- HI is calculated from the best 8 of a player's last 20 Score Differentials.
- It is intentionally "potential-based" — it rewards consistency and improvement without penalising the occasional bad round.

**In plain terms:** If your HI is 20, you are capable of playing to net par (your Course Handicap) on a good day at any rated course.

---

### What is a Score Differential?

The building block of the HI calculation:

```
Score Differential = (Adjusted Gross Score − Course Rating) × (113 / Slope Rating)
```

This normalises your score across different courses and tees, so a round at a difficult course counts fairly against a round at an easy one.

---

### What is a Course Rating (CR)?

The **Course Rating** is the expected score for a scratch golfer (HI 0.0) under normal playing conditions on that course and tee.

- Mt. Paul Mens Blue: **CR 59.0** (par 64, 9-hole loop × 2)
- A scratch golfer is expected to shoot 59 at Mt. Paul from the Blue tees.

---

### What is a Slope Rating (SR)?

The **Slope Rating** measures how much harder a course is for a bogey golfer compared to a scratch golfer. It ranges from 55 (very easy) to 155 (very hard). The standard is **113**.

- Mt. Paul Mens Blue: **SR 86**
- An SR below 113 means the course does not punish weaker players as much as an average course would.

---

### What is a Course Handicap (CH)?

The **Course Handicap** converts your Handicap Index to the specific course and tee you are playing. It is the number of strokes you receive on that day.

```
Course Handicap = Round( HI × (SR / 113) + (CR − Par) )
```

**Example — 20 HI at Mt. Paul Mens Blue:**
```
CH = Round( 20 × (86 / 113) + (59.0 − 64) )
   = Round( 20 × 0.761 + (−5) )
   = Round( 15.23 − 5 )
   = Round( 10.23 )
   = 10
```
A 20 HI player receives **10 strokes** at Mt. Paul from the Blue tees.

---

### What is a Stroke Index (Hole Index)?

The **Stroke Index** (sometimes called Hole Index) is a ranking assigned to each hole, from 1 (hardest) to 18 (easiest). It determines *which holes* you receive your handicap strokes on.

- If your Course Handicap is 10, you receive 1 stroke on each of the 10 hardest holes (SI 1–10).
- If your CH is 18, you receive 1 stroke on every hole.
- If your CH is 19+, you receive 2 strokes on the hardest hole(s).

This makes match play and net scoring fair between players of different abilities.

---

## 2. Performance Metrics (What We Track)

These are the raw stats captured in the app for each round:

| Metric | What it means |
|---|---|
| **Score** | Total gross strokes for the round |
| **Net Score** | Gross Score minus Course Handicap |
| **GIR** | Greens in Regulation — reached the green in Par minus 2 strokes, leaving 2 putts for par |
| **FIR** | Fairways in Regulation — tee shot landed in the fairway (par 4s and 5s only) |
| **Putts** | Total putts taken across all holes |
| **UD** | Successful Up & Downs — chipped/pitched close enough to make the putt |
| **X-UD** | Failed Up & Downs — missed the green and did NOT get up and down |
| **ShortGameOpp** | Total short game opportunities (UD + X-UD) |
| **Penalties** | Penalty strokes taken (OB, lost ball, water hazards) |

---

### How do these compare to expectations?

Performance benchmarks are scaled to Handicap Index bracket, because a 20 HI player and a 4 HI player have completely different "normal" rounds.

| Metric | 0–9 HI | 10–18 HI | 19–28 HI | 29+ HI |
|---|---|---|---|---|
| GIR (of 18) | 10–14 | 5–9 | 2–6 | 0–3 |
| Putts | 28–32 | 30–34 | 32–36 | 34–38 |
| X-UD | 0–3 | 2–5 | 4–8 | 6–12 |
| Penalties | 0–0.5 | 0.5–1.5 | 1–2.5 | 2–4 |

---

## 3. The GPI — Golf Performance Index

The GPI (Golf Performance Index) is a single number that summarises how many strokes were *lost* in a round compared to the benchmark for your HI bracket. Lower is better.

It is made up of four cost components:

---

### BSCost — Ball Striking Cost

Measures strokes lost because you missed greens. Every missed green forces a chip or pitch instead of a two-putt, costing approximately 0.5 strokes on average.

```
BSCost = (18 − GIR) × 0.5
```

The baseline is 18 (a perfect round, every green hit). The multiplier is 0.5 because a missed green still gives you a chance to chip close and save par — it is not a guaranteed dropped stroke.

**Example:** 5 GIR. BSCost = (18 − 5) × 0.5 = 13 × 0.5 = **6.5**

> **Note:** An earlier version of this guide described BSCost using an HI-adjusted expected-GIR gap. That formula was incorrect — GPI_RULES.md (the authoritative source) uses `(18 − GIR) × 0.5` and the verification table only checks out with this formula.

---

### SGCost — Short Game Cost

Measures strokes lost to failed up-and-downs. Every time you miss the green and fail to chip on and one-putt, that is a stroke lost.

```
SGCost = X-UD × sgMultiplier(HI)
```

The multiplier is less than 1.0 because not every failed up-and-down results in a double — sometimes you still make bogey. It is HI-scaled because better players are expected to convert more often, so each failure costs them more relative to their baseline. Brackets follow WHS, capped at HI 36.

| HI Bracket | Multiplier | Rationale |
|---|---|---|
| 0–9 | 0.75 | High conversion expected; each X-UD nearly guarantees a dropped stroke |
| 10–18 | 0.65 | Mixed conversion; most X-UDs cost a stroke but not all |
| **19–28** | **0.60** | **Bogey still reachable without converting** |
| 29–36 | 0.55 | X-UDs so frequent they're semi-expected; bogey still reachable |

**Example (20 HI):** 7 failed up-and-downs. SGCost = 7 × 0.60 = **4.2**

---

### PuttCost — Putting Cost

Measures strokes lost to putting above the benchmark for your HI bracket.

```
PuttBenchmark:  0–9 HI = 30  |  10–18 HI = 32  |  19–28 HI = 34  |  29+ HI = 36
PuttCost = Total Putts − PuttBenchmark
```

A negative PuttCost means you saved strokes with the putter. A positive means you lost strokes.

**Example (20 HI):** 37 putts − 34 benchmark = **+3.0** (lost 3 strokes putting)

---

### PenCost — Penalty Cost

Penalty strokes are direct stroke costs with no multiplier reduction.

```
PenCost = Total Penalties
```

---

### GPI — Total

```
GPI = BSCost + SGCost + PuttCost + PenCost
```

---

### GPI Interpretation Bands (by HI bracket)

| Rating | 0–9 HI | 10–18 HI | 19–28 HI | 29+ HI |
|---|---|---|---|---|
| Excellent | < 4 | < 5 | < 7 | < 9 |
| Good | 4–7 | 5–9 | 7–12 | 9–15 |
| Average | 8–11 | 10–14 | 13–17 | 16–21 |
| Below Average | 12–15 | 15–18 | 18–22 | 22–27 |
| Poor | > 15 | > 18 | > 22 | > 27 |

---

## 4. How to Identify Where a Player is Weak

The GPI cost breakdown shows *where* strokes were lost, not just how many. The largest cost component is the highest-priority area to work on.

**Decision logic:**

1. **BSCost is highest** → Ball-striking is the primary leak. Work on approach accuracy and club selection.
2. **SGCost is highest** → Short game is the primary leak. Chip-and-pitch practice from 10–30 yards.
3. **PuttCost is highest** → Putting is the primary leak. Lag putting from 20–40 ft or short putt conversion.
4. **PenCost is highest** → Course management is the primary leak. Smarter tee shots, safer lines.

When two costs are close, both areas are identified as co-priorities.

---

## 5. HI-Scaled Advice

Advice is only meaningful if it matches what a player at that HI level can realistically act on.

### Ball Striking

| HI Bracket | Trigger (BSCost >) | Advice |
|---|---|---|
| 0–9 | 2.0 | "Approach accuracy from 100–150 yards. Track which club is missing and why." |
| 10–18 | 3.0 | "Work on consistent strike first — direction follows contact. Focus on 50–100 yard approach." |
| 19–28 | 4.0 | "Getting any part of the green from 50–80 yards is the priority. Aim for the fat part." |
| 29+ | 5.0 | "Solid contact beats good aim. Brush the grass before the ball on every iron shot." |

### Short Game

| HI Bracket | Trigger (SGCost >) | Advice |
|---|---|---|
| 0–9 | 1.5 | "Trajectory and spin control from tight lies. Vary your chip shot shapes in practice." |
| 10–18 | 3.0 | "10–30 yard chips are the highest-ROI practice zone at your level." |
| 19–28 | 4.5 | "Get within 10 feet from 20 yards. Use a low-running chip; fewer variables." |
| 29+ | 6.0 | "Consistent contact is the goal — thin and fat cost more than poor direction." |

### Putting

| HI Bracket | Trigger (PuttCost >) | Advice |
|---|---|---|
| 0–9 | 1.0 | "Speed control from 30+ ft. Three-putts at your level are momentum killers." |
| 10–18 | 2.0 | "Lag putting from 20–40 ft returns the most strokes. Aim within a 3-ft circle." |
| 19–28 | 3.0 | "Lag speed control from 20–40 ft is the highest-return putting skill at your level." |
| 29+ | 4.0 | "Two-putt goal from anywhere. Get in the 6-ft circle from long range." |

### Penalties

| HI Bracket | Trigger (PenCost >) | Advice |
|---|---|---|
| All | 2.0 | "Course management: tee up on the side of trouble, aim for the safe half of the fairway. One penalty undoes 2 good chips." |

---

## 6. What Should the GPI Report Teach Players?

The report is the right place to build player literacy over time. Suggested approach: keep it light, contextual, and consistent.

### Always visible (every report):
- GPI score with interpretation band label (e.g., "Good — 9.4")
- The single largest cost component highlighted with a one-line plain-language note
- Net score vs. Course Handicap (did you play to handicap?)

### On demand / expandable:
- Full cost breakdown (BS / SG / Putt / Pen)
- Trend sparklines for last 5–10 rounds per metric
- HI bracket benchmarks so the player can see where "normal" sits

### Contextual tooltips (future):
- A small "?" or "ℹ" icon next to GPI, BSCost, etc. that reveals a one-sentence plain-language definition
- Example: *"SGCost — strokes lost to missed chip-and-putt opportunities. Lower is better."*

### What NOT to include in every report:
- Full formula explanations (save for a Help/About screen)
- More than one piece of advice per report (focus beats volume)
- Jargon without definition (WHS, CR, SR should always spell out first use)

---

## 7. Summary — Metric Quick Reference

| Metric | Type | Good direction | HI-scaled? |
|---|---|---|---|
| Handicap Index | Ability | Lower | — |
| Course Handicap | Strokes received | Contextual | Yes |
| GIR | Accuracy | Higher | Yes |
| FIR | Accuracy | Higher | Loosely |
| Putts | Putting | Lower | Yes |
| X-UD | Short game | Lower | Yes |
| Penalties | Management | Lower | No |
| BSCost | GPI component | Lower | Yes |
| SGCost | GPI component | Lower | Yes |
| PuttCost | GPI component | Lower | Yes |
| PenCost | GPI component | Lower | No |
| **GPI** | **Overall** | **Lower** | **Yes** |

---

*This document is the source of truth for GPI metric definitions. Any changes to multipliers, benchmarks, or thresholds should be reflected here AND in GPI_RULES.md and apps-script.gs.*
