# Golf Dashboard — Research Reference

Findings from 10 searches across golf stats queries and dashboard design patterns. Use this as a reference when scoping the analytics module.

---

## Part 1 — What Golfers Actually Want to Know

The searches kept pointing to the same truth: golfers don't want raw numbers, they want **answers**. Every stat in the dashboard should map back to a question they'd type into Google.

### Scoring questions
- **What counts as a good score?** 90 is the psychological magic number — only 26% of amateurs ever break it. Average male score is 95.7. Crossing 100, 90, 80, 70 are tracked milestones.
- **Am I actually getting better?** The single biggest driver of app adoption. Needs clear trend visualization.
- **Which part of my game is hurting me most?** The stat that drives action.

### Driving / FIR
- **How many fairways should I hit?** Benchmarks by handicap:
  - Scratch: ~56.5%
  - 10-handicap: ~48%
  - 15-handicap: ~42%
- Distance at accuracy matters more than raw %. Low handicaps miss fairways from 270+ yards; amateurs from 220.

### Approach / GIR
This is the headline stat — biggest differentiator across handicap levels.
- Scratch: ~12 GIR/round
- 5-handicap: ~8
- 10-handicap: ~6.3
- 15-handicap: 4–5
- Pros: ~12+

Amateurs want to know: "Is my GIR of X good for a Y-handicap?" — that benchmark framing is essential.

### Putting
- **How many putts should I average?** Amateur: 40–45/round (2.2/hole). Pro: ~32 (1.8/hole). Under 32 signals amateur mastery.
- **Why do I 3-putt so much?** 15+ handicaps avg 3–4 per round. 1–5 handicaps avg 1.6. Pros: 0.51. Reducing 3-putts is consistently cited as the **fastest** way to lower scores.

### Short game / U/D (scrambling)
Less talked about online, but high-impact. "Scramble rate" (getting up-and-down after missing GIR) separates good amateurs from average ones. Pros: ~58%. 15-handicap: ~20–25%.

### Trends & improvement
- Month-over-month comparisons
- Seasonal trends
- Best/worst rounds with context
- Peer/handicap-relative comparisons (not tour-relative — demoralizing)

---

## Part 2 — What Makes a Dashboard Feel Elegant

The best golf apps (Arccos, Shot Scope, TheGrint, 18Birdies) converge on a few principles:

### Insight framing over raw numbers
Don't show "you 3-putted 8 times." Show **"3-putts cost you ~2.3 strokes per round."** Frame every metric as opportunity cost. This is the single biggest pattern worth stealing.

### Peer-relative benchmarks, not tour-relative
Amateurs don't care they're 4 strokes behind a pro. They care they're 0.8 strokes ahead of a typical 12-handicap. **Every benchmark should normalize to the user's handicap band.**

### Category handicaps (Arccos pattern)
Break handicap into Driving / Approach / Short Game / Putting. Lets the golfer see *where* to focus practice without drowning in data.

### Simplicity wins
Shot Scope offers 100+ stats and gets criticized for overwhelming users. Arccos offers breakdowns but is criticized for steep learning curve. **Curate aggressively.** Primary view = 5–7 key metrics. Detail views on tap.

---

## Part 3 — Visualization Patterns That Work

| Chart type | Best for |
|---|---|
| Line chart | Score/GIR/putts trending across rounds |
| Bar chart | Side-by-side comparisons (club performance, round-vs-round) |
| Hole-by-hole mosaic / heatmap | Red/yellow/green grid showing score vs par per hole — reveals problem holes instantly |
| Gauge / donut | FIR%, GIR%, 3-putt% — glanceable single-metric snapshots |
| Sparkline tables | Dense but scannable: stat rows × round columns |

**Golf-specific color coding:** pink/red = over par, white = par, blue = birdie, yellow/gold = eagle. Fits your existing 2024 Stats sheet. Keep it consistent everywhere.

---

## Part 4 — Insight Phrases to Steal

Pattern > content. Here's how the best apps talk:

- "Your new driver gained 1.2 strokes per round."
- "You lose 2.3 strokes per round to 3-putts."
- "Your GIR of 6 ranks in the top 40% for 12-handicaps."
- "Hole 8 costs you 0.7 strokes vs expected."
- "Your scramble rate dropped 8% this month — worth checking."

Each one is: **metric + comparison + plain English + implied action.** That's the template.

---

## Part 5 — What NOT to Do

- **Don't show 100 stats on the main view.** Curate 5–7 headline metrics.
- **Don't use tour-level strokes gained** without amateur adjustment — meaningless.
- **Don't use dense tables** that can't be read in sunlight at arm's length.
- **Don't break color consistency.** Pick the score-relative-to-par palette once and commit.
- **Don't bury common actions in menus.** Scores ↔ Stats toggle, not dropdowns.

---

## Part 6 — Mobile / PWA Essentials

- **Offline-first.** Signal drops on the course — let users enter scores offline, sync later.
- **Glanceable layouts.** No horizontal scroll. One tap from round list to round detail to stats.
- **High contrast for outdoor readability.** Forest-green theme is standard; pastels fail in sun.
- **Two entry modes.** Quick (score only) for casual rounds; detailed (score + FIR + GIR + U/D + putts) for tracked rounds. Don't force 7 inputs if the user only wants 1.
- **Home-screen-friendly.** A small summary card (last score, handicap trend) readable at a glance.

---

## Part 7 — Recommended MVP Feature List

Based on above, a strong v1 dashboard would include:

1. **Round log** — list of all rounds with date, course, score, key stats
2. **Headline KPIs** — scoring avg, GIR%, FIR%, putts/round, 3-putts/round, scramble% — each with benchmark comparison for user's handicap
3. **Trend view** — line chart of score over last N rounds
4. **Hole performance heatmap** — mosaic showing score-vs-par per hole, aggregated
5. **Insight cards** — 3–5 auto-generated "you lose X strokes to Y" observations
6. **Handicap category breakdown** — Driving / Approach / Short Game / Putting sub-scores
7. **Demo mode toggle** — switches data source to 2024 Stats for marketing/showcasing

---

## Sources

Golf stats benchmarks:
- The Left Rough — Golf Statistics by Handicap
- Golf.com — GIR per round
- Golf Monthly — 3-putts data
- Arccos — Pros vs Joes 3-putt analysis
- SMART Golf & Fitness — stats to improve scores

Dashboard design patterns:
- Shot Scope vs Arccos comparison (WickedSmartGolf)
- TheGrint, 18Birdies, Chart My Golf product tours
- Data Golf trend table (pro-level reference)
- Strokes Gained guide for amateurs (GolfPass)
- Dribbble golf app design gallery
