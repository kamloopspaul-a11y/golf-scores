# GPI Rules — Golf Performance Index

**Version:** 1.1 — 2026-05-08
**Status:** Informal personal metric. Not affiliated with the PGA Tour, Golf Canada, or the World Handicap System.

---

## What is the GPI?

The **Golf Performance Index (GPI) Rating** is an estimated strokes-lost score computed after each round. It measures how many strokes above an ideal baseline were lost to four areas of the game. The lower the GPI, the better the round.

The GPI is a personal tracking metric designed for recreational golfers who want to monitor improvement over time without requiring equipment, GPS, or shot-by-shot tracking.

---

## Input Metrics

These are captured hole-by-hole during play:

| Metric | Abbreviation | Type | Description |
|--------|-------------|------|-------------|
| Fairway in Regulation | FIR | Flag (1 or null) | Tee shot landed on the fairway |
| Green in Regulation | GIR | Flag (1 or null) | Green reached in regulation (par − 2 strokes) |
| Up & Down | UD | Flag (1 or null) | Got up and down from off the green in 2 strokes |
| Failed Up & Down | X-UD | Flag (1 or null) | Attempt made but failed to get up and down |
| Putts | PUTTS | Integer (0–9) | Total putts taken on the hole |
| Penalties | PEN | Integer | Penalty strokes taken on the hole |
| Score | — | Integer | Gross strokes on the hole |

---

## GPI Cost Components

The GPI Rating is the sum of four cost components. Each represents estimated strokes lost in that area.

### 1. Ball Striking Cost (BSCost)
```
BSCost = (18 − GIR) × 0.5
```
Strokes lost by missing greens. Every missed green forces a chip or pitch instead of a putt — each costs approximately 0.5 strokes on average. Measures approach play quality (and tee shots on par 3s).

### 2. Short Game Cost (SGCost)
```
SGCost = MissedOpp × sgMultiplier(HI)
MissedOpp = (18 − GIR) − UD    (= X-UD count)
```
Strokes lost by failing to recover once off the green. Isolates chipping and pitching execution — separate from the ball striking that caused the miss. The multiplier is HI-scaled because better players are expected to convert more often, so each failure costs them more relative to their baseline.

**SGCost multiplier by HI bracket (WHS, capped at 36):**

| HI bracket | Multiplier | Rationale |
|---|---|---|
| 0–9 | 0.75 | High conversion expected; each X-UD nearly guarantees a dropped stroke |
| 10–18 | 0.65 | Mixed conversion; most X-UDs cost a stroke but not all |
| **19–28** | **0.60** | **← Paul's bracket. Bogey still reachable without converting** |
| 29–36 | 0.55 | X-UDs so frequent they're semi-expected; bogey still reachable |

**Note:** BSCost and SGCost measure two sequential failures. Low BS + high SG = solid irons, short game costing you. High BS + low SG = bailing yourself out with good chipping despite missing greens.

*Changed v1.1: fixed multiplier 0.7 → 0.6 for mid-HI players.*
*Changed v1.2: multiplier HI-scaled by WHS bracket (0–9 / 10–18 / 19–28 / 29–36).*

### 3. Putting Cost (PuttCost)
```
PuttCost = TotalPutts − puttBenchmark(HI)
```
Strokes lost (or saved) on the greens vs the expected number of putts for your handicap bracket. Positive = strokes lost; negative = strokes saved.

**Putting benchmark by HI bracket:**

| HI bracket | Putt benchmark | Rationale |
|---|---|---|
| 0–9 | 30 | High GIR rate → longer first putts but fewer chip-putts |
| 10–18 | 32 | Mixed green-hit rate |
| **19–28** | **34** | **← Paul's bracket. Fewer GIR → more chip-putts but shorter** |
| 29+ | 36 | Low GIR rate → frequent chip-putts, more 3-putts |

*Changed v1.1: fixed benchmark of 36 replaced with HI-scaled table. A 20 HI averages ~33–35 putts; 36 was making putting look like a strength when it isn't.*

### 4. Penalty Cost (PenCost)
```
PenCost = Total Penalties
```
Each penalty stroke is a direct one-stroke cost. Multiplier is 1:1 regardless of HI.

---

## GPI Rating Formula
```
GPI Rating = BSCost + SGCost + PuttCost + PenCost
```

Lower is better.

---

## GPI Interpretation Bands (HI-scaled)

| HI bracket | Excellent | Good | Average | Below avg | Poor |
|---|---|---|---|---|---|
| 0–9 | < 4 | 4–7 | 8–11 | 12–15 | 16+ |
| 10–18 | < 5 | 5–9 | 10–14 | 15–19 | 20+ |
| **19–28** | **< 7** | **7–12** | **13–17** | **18–22** | **23+** |
| 29+ | < 9 | 9–14 | 15–20 | 21–26 | 27+ |

**Verification — 19–28 HI bracket (typical 20 HI round on Mt. Paul, par 64):**

| Round type | Score | GIR | Putts | X-UD | Pen | GPI | Band |
|---|---|---|---|---|---|---|---|
| Good | ~68 | 7 | 32 | 6 | 0 | 7.1 | Good |
| Average | ~74 | 5 | 34 | 9 | 1 | 12.9 | Average |
| Poor | ~84 | 2 | 38 | 15 | 3 | 24.0 | Poor |

---

## Supporting Diagnostics (Diagnostics Tab)

These are computed server-side and stored in the Diagnostics Sheet tab:

| Column | Formula | Description |
|--------|---------|-------------|
| BallStrikingGap | 18 − GIR | Greens missed |
| ShortGameOpp | 18 − GIR | Opportunities to get up & down |
| MissedOpp | ShortGameOpp − UD | Failed up & downs (= X-UD) |
| ShortGameEff | UD / ShortGameOpp | Up & down conversion rate (0–1) |
| PuttsPerGIR | Putts / GIR | Putting efficiency when on the green |
| DiagnosticScore | BallStrikingGap + MissedOpp + Putts | Raw composite (used internally) |

---

## Email Report — Golf Performance Index Report

Auto-sent every 5 rounds. Also triggered manually via `sendReport()` in Apps Script.
Contains: Scoring Summary, Round by Round, N Round Average, Cost Breakdown, Focus Areas.

- **Away rounds** highlighted in light amber (`#fef3cd`) with hover tooltip showing course name.
- **Home course** read from Settings tab (`Home Course` key).
- **HI and Net Score** read from Settings tab (`Handicap_Index` key). Net = Gross − Course Handicap (Mt. Paul Mens Blue: CR 59.0, SR 86, Par 64).
- **Putt benchmark** read from HI bracket at report generation time.

---

## Changelog

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-05-07 | Initial version |
| 1.1 | 2026-05-08 | SGCost multiplier 0.7 → 0.6; putting benchmark HI-scaled (34 for 19–28 HI); interpretation bands added |
| 1.2 | 2026-05-08 | SGCost multiplier HI-scaled by WHS bracket (0.75 / 0.65 / 0.60 / 0.55); capped at HI 36 |

---

## Open Questions

- Focus Areas advice (e.g., "practice 10–30 yard shots") — how to make recommendations data-driven given we don't capture shot distance or dispersion?
- Should Short Game Efficiency (UD conversion rate) surface in the email report?
- Is PuttsPerGIR a more meaningful putting metric than total putts for the report?
- Should SGCost multiplier extend beyond HI 36? WHS allows up to 54.0 but bracket calibration above 36 has no data basis.
