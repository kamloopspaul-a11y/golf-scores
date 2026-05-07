# GPI Rules — Golf Performance Index

**Version:** 1.0 — 2026-05-07
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
Each green missed is estimated to cost 0.5 strokes on average (missed green → chip/pitch required → likely bogey or worse).

### 2. Short Game Cost (SGCost)
```
SGCost = MissedOpp × 0.7
MissedOpp = (18 − GIR) − UD    (failed up & downs)
```
Each failed up & down is estimated to cost 0.7 strokes. Equivalent to X-UD count.

### 3. Putting Cost (PuttCost)
```
PuttCost = TotalPutts − 36
```
Benchmark is 36 putts (2 putts per hole × 18 holes). Positive = strokes lost; negative = strokes saved.

### 4. Penalty Cost
```
PenCost = Total Penalties
```
Each penalty stroke is a direct one-stroke cost.

---

## GPI Rating Formula
```
GPI Rating = BSCost + SGCost + PuttCost + PenCost
```

Lower is better. No target threshold is currently set — thresholds will be calibrated once sufficient rounds are recorded and HI-scaled benchmarks are built.

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

---

## Open Questions (for future session)

- Are the cost multipliers (0.5 for BSCost, 0.7 for SGCost) well-calibrated for a ~20 HI player?
- Should GPI thresholds scale with Handicap Index (e.g., different benchmarks for 0–9, 10–18, 19–28, 29+)?
- Focus Areas advice (e.g., "practice 10–30 yard shots") — how to make recommendations data-driven given we don't capture shot distance or dispersion?
- Is PuttsPerGIR a more meaningful putting metric than total putts?
- Should Short Game Efficiency (UD conversion rate) surface in the email report?
