/**
 * Golf Scores — bound Apps Script webhook
 * Schema v2 — Vertical (one row per hole)
 * v2.1 — Advanced Diagnostics tab + email reporting
 *
 * SETUP (one time):
 * 1. Open your Google Sheet → Extensions → Apps Script
 * 2. Paste this whole file over the existing Code.gs
 * 3. Save, then Run → setup() once (approve permissions)
 * 4. Deploy → New deployment → type "Web app"
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy the /exec URL → paste into index.html as SHEETS_URL
 *
 * Email reports: auto-sent every REPORT_EVERY_N_ROUNDS rounds.
 * To send manually: Run → sendReport()
 * To set up a weekly trigger: Run → setupWeeklyTrigger() once.
 *
 * To update later: paste new code → Deploy → Manage deployments →
 * edit → New version. URL stays the same.
 *
 * Gemini key: Project Settings → Script Properties → GEMINI_API_KEY
 */

const ROUNDS      = 'Rounds';
const SETTINGS    = 'Settings';
const DIAGNOSTICS = 'Diagnostics';

const REPORT_EMAIL          = 'kamloopspaul@gmail.com';
const REPORT_EVERY_N_ROUNDS = 5;   // send after every 5th round
const REPORT_LAST_N_ROUNDS  = 5;   // how many rounds to include in report

// ── Schema ─────────────────────────────────────────────────────────────────
//
//  Rounds tab  (one row per hole per round — 18 rows per round)
//  Round_ID | Date | Course | Tees | Hole | Par | Stroke_Index |
//  Score | Putts | FIR | GIR | UD | X_UD | Penalties | Net_Score
//
//  Diagnostics tab  (one row per round — computed by buildDiagnostics_)
//  Round_ID | Date | Course | Score | FIR | GIR | UD | Putts | Penalties |
//  BallStrikingGap | ShortGameOpp | MissedOpp | ShortGameEff |
//  PuttsPerGIR | DiagnosticScore | BSCost | SGCost | PuttingCost | TotalStrokesLost
//
//  Settings tab  (Key | Value)
//  Home Course    | Mt. Paul
//  Handicap_Index | 20
//
// ───────────────────────────────────────────────────────────────────────────

function roundsHeader_() {
  return [
    'Round_ID', 'Date', 'Course', 'Tees', 'Hole',
    'Par', 'Stroke_Index', 'Score', 'Putts',
    'FIR', 'GIR', 'UD', 'X_UD', 'Penalties', 'Net_Score'
  ];
}

function diagnosticsHeader_() {
  return [
    'Round_ID', 'Date', 'Course', 'Score', 'FIR', 'GIR', 'UD', 'Putts', 'Penalties',
    'BallStrikingGap', 'ShortGameOpp', 'MissedOpp', 'ShortGameEff',
    'PuttsPerGIR', 'DiagnosticScore', 'BSCost', 'SGCost', 'PuttingCost', 'TotalStrokesLost'
  ];
}

// ── Setup ──────────────────────────────────────────────────────────────────

function setup() {
  const ss = SpreadsheetApp.getActive();

  ensureSheet_(ss, ROUNDS,      roundsHeader_());
  ensureSheet_(ss, DIAGNOSTICS, diagnosticsHeader_());
  ensureSheet_(ss, SETTINGS,    ['Key', 'Value']);

  const settingsSh = ss.getSheetByName(SETTINGS);
  const existing   = getSettings_(settingsSh);
  if (!existing['Home Course'])    settingsSh.appendRow(['Home Course',    'Mt. Paul']);
  if (!existing['Handicap_Index']) settingsSh.appendRow(['Handicap_Index', 20]);

  // Style the Diagnostics tab
  styleDiagnosticsSheet_(ss.getSheetByName(DIAGNOSTICS));

  // Remove legacy tabs if they exist and are empty of data
  ['Scorecard', 'Stats'].forEach(name => {
    const sh = ss.getSheetByName(name);
    if (sh && sh.getLastRow() <= 1) ss.deleteSheet(sh);
  });

  // Remove the default Sheet1 if still present
  const sh1 = ss.getSheetByName('Sheet1');
  if (sh1 && sh1.getLastRow() === 0) ss.deleteSheet(sh1);
}

// ── GET — returns rounds data or health check ──────────────────────────────

function doGet(e) {
  const action = e && e.parameter && e.parameter.action;

  if (action === 'data') {
    try {
      const ss      = SpreadsheetApp.getActive();
      const sh      = ss.getSheetByName(ROUNDS);
      if (!sh || sh.getLastRow() < 2) {
        return json_({ ok: true, rounds: [] });
      }
      const headers = roundsHeader_();
      const raw     = sh.getRange(2, 1, sh.getLastRow() - 1, headers.length).getValues();
      const rounds  = raw.map(row => {
        const obj = {};
        headers.forEach((h, i) => { obj[h] = row[i]; });
        return obj;
      });
      return json_({ ok: true, rounds: rounds });
    } catch (err) {
      return json_({ ok: false, error: String(err) });
    }
  }

  return ContentService.createTextOutput('Golf webhook live. POST only.');
}

// ── POST — score submission or Gemini query ────────────────────────────────

function doPost(e) {
  try {
    const p  = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActive();

    // ── Gemini query branch ──────────────────────────────────────────────
    if (p.action === 'query') {
      return handleGeminiQuery_(ss, p.question);
    }

    // ── Score submission branch ──────────────────────────────────────────

    ensureSheet_(ss, ROUNDS,      roundsHeader_());
    ensureSheet_(ss, DIAGNOSTICS, diagnosticsHeader_());
    ensureSheet_(ss, SETTINGS,    ['Key', 'Value']);

    const roundId = p.roundId || Utilities.getUuid();
    const date    = p.date   || '';
    const course  = p.course || '';
    const tees    = p.tees   || '';

    // Duplicate prevention
    const roundsSh = ss.getSheetByName(ROUNDS);
    if (roundsSh.getLastRow() > 1) {
      const existing = roundsSh.createTextFinder(roundId).matchEntireCell(true).findAll();
      if (existing.length > 0) {
        return json_({ ok: true, roundId: roundId, duplicate: true });
      }
    }

    // Handicap from Settings
    const settingsSh = ss.getSheetByName(SETTINGS);
    const settings   = getSettings_(settingsSh);
    const hi         = parseFloat(settings['Handicap_Index'] || 0);

    const cr  = parseFloat(p.courseRating || 0);
    const sr  = parseFloat(p.slopeRating  || 113);
    const par = parseInt(p.par            || 0, 10);
    const ch  = (cr && sr && par)
      ? Math.round(hi * (sr / 113) + (cr - par))
      : Math.round(hi);

    const holes = Array.isArray(p.holes) ? p.holes : [];
    const rows  = [];

    for (let i = 0; i < holes.length; i++) {
      const h   = holes[i];
      const num = i + 1;

      const hPar   = h.par         != null ? h.par         : '';
      const hIdx   = h.strokeIndex != null ? h.strokeIndex : '';
      const hScore = h.score       != null ? h.score       : '';
      const hPutts = h.putts       != null ? h.putts       : '';
      const hFir   = h.fir        != null ? h.fir        : '';
      const hGir   = h.gir        != null ? h.gir        : '';
      const hUd    = h.ud         != null ? h.ud         : '';
      const hXud   = h.xud        != null ? h.xud        : '';
      const hPen   = h.pen        != null ? h.pen        : '';

      let netScore = '';
      if (hScore !== '' && hIdx !== '' && ch > 0) {
        netScore = hScore - (hIdx <= ch ? 1 : 0);
      }

      rows.push([
        roundId, date, course, tees, num,
        hPar, hIdx, hScore, hPutts,
        hFir, hGir, hUd, hXud, hPen, netScore
      ]);
    }

    if (rows.length > 0) {
      roundsSh
        .getRange(roundsSh.getLastRow() + 1, 1, rows.length, rows[0].length)
        .setValues(rows);
    }

    // Rebuild the Diagnostics tab after each posted round
    buildDiagnostics_(ss);

    // Count total distinct rounds and send report every N rounds
    const totalRounds = countRounds_(roundsSh);
    if (totalRounds > 0 && totalRounds % REPORT_EVERY_N_ROUNDS === 0) {
      sendReport_(ss, REPORT_LAST_N_ROUNDS);
    }

    return json_({ ok: true, roundId: roundId, courseHandicap: ch, totalRounds: totalRounds });

  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

// ── Diagnostics Builder ────────────────────────────────────────────────────
//
//  Reads all rows from Rounds, groups by Round_ID, computes per-round
//  stats and diagnostic fields, then rewrites the Diagnostics tab.
//  One call rebuilds everything — safe to call after every post.
//
// ───────────────────────────────────────────────────────────────────────────

function buildDiagnostics_(ss) {
  const roundsSh = ss.getSheetByName(ROUNDS);
  const diagSh   = ss.getSheetByName(DIAGNOSTICS);
  if (!roundsSh || !diagSh) return;

  ensureSheet_(ss, DIAGNOSTICS, diagnosticsHeader_());

  // Read all Rounds data
  if (roundsSh.getLastRow() < 2) return;

  const headers = roundsHeader_();
  const raw = roundsSh.getRange(2, 1, roundsSh.getLastRow() - 1, headers.length).getValues();

  // Group rows by Round_ID — preserve insertion order (rounds in date order)
  const order  = [];
  const byRound = {};

  raw.forEach(row => {
    const id = String(row[0]);
    if (!byRound[id]) {
      order.push(id);
      byRound[id] = {
        Round_ID: id,
        Date:     row[1],
        Course:   row[2],
        holes:    []
      };
    }
    byRound[id].holes.push({
      Score:    row[7],
      Putts:    row[8],
      FIR:      row[9],
      GIR:      row[10],
      UD:       row[11],
      Pen:      row[13]
    });
  });

  // Build computed rows
  const diagRows = order.map(id => {
    const r = byRound[id];

    const score    = r.holes.reduce((s, h) => s + (Number(h.Score) || 0), 0);
    const putts    = r.holes.reduce((s, h) => s + (Number(h.Putts) || 0), 0);
    const fir      = r.holes.filter(h => isTruthy_(h.FIR)).length;
    const gir      = r.holes.filter(h => isTruthy_(h.GIR)).length;
    const ud       = r.holes.filter(h => isTruthy_(h.UD)).length;
    const pen      = r.holes.reduce((s, h) => s + (Number(h.Pen) || 0), 0);
    const holes    = 18;

    // Diagnostic calculations (Paul's model)
    const bsGap   = holes - gir;                                        // Ball Striking Gap
    const sgOpp   = holes - gir;                                        // Short Game Opportunities
    const missed  = sgOpp - ud;                                         // Missed Opportunities (failed up-and-downs)
    const sgEff   = sgOpp > 0 ? parseFloat((ud / sgOpp).toFixed(3)) : 0; // Short Game Efficiency
    const ppGir   = gir   > 0 ? parseFloat((putts / gir).toFixed(2))  : 0; // Putts per GIR
    const diagScore = bsGap + missed + putts;                           // Diagnostic Score

    // Strokes Lost model
    const bsCost  = parseFloat((bsGap * 0.5).toFixed(2));              // Ball Striking Cost
    const sgCost  = parseFloat((missed * 0.7).toFixed(2));             // Short Game Cost
    const puttCost = putts - 36;                                        // Putting Cost (>0 = strokes lost)
    const totalSL  = parseFloat((bsCost + sgCost + puttCost + pen).toFixed(2));

    return [
      r.Round_ID,
      r.Date,
      r.Course,
      score,
      fir,
      gir,
      ud,
      putts,
      pen,
      bsGap,
      sgOpp,
      missed,
      sgEff,
      ppGir,
      diagScore,
      bsCost,
      sgCost,
      puttCost,
      totalSL
    ];
  });

  // Rewrite Diagnostics tab (keep header row)
  if (diagSh.getLastRow() > 1) {
    diagSh.getRange(2, 1, diagSh.getLastRow() - 1, diagnosticsHeader_().length).clearContent();
  }

  if (diagRows.length > 0) {
    diagSh.getRange(2, 1, diagRows.length, diagRows[0].length).setValues(diagRows);

    // Reapply colour coding
    applyDiagnosticsColours_(diagSh, diagRows.length);
  }
}

// Rebuild manually from the menu — handy if the tab gets out of sync
function rebuildDiagnostics() {
  buildDiagnostics_(SpreadsheetApp.getActive());
  SpreadsheetApp.getUi().alert('Diagnostics tab rebuilt.');
}

// ── Email Report ───────────────────────────────────────────────────────────

/**
 * sendReport — callable from the Script Editor menu.
 * Reads the last REPORT_LAST_N_ROUNDS rows from Diagnostics and sends
 * an HTML email to REPORT_EMAIL.
 */
function sendReport() {
  sendReport_(SpreadsheetApp.getActive(), REPORT_LAST_N_ROUNDS);
  SpreadsheetApp.getUi().alert('Report sent to ' + REPORT_EMAIL);
}

function sendReport_(ss, n) {
  const diagSh = ss.getSheetByName(DIAGNOSTICS);
  if (!diagSh || diagSh.getLastRow() < 2) return;

  const headers = diagnosticsHeader_();
  const lastRow = diagSh.getLastRow();
  const startRow = Math.max(2, lastRow - n + 1);
  const numRows  = lastRow - startRow + 1;

  const raw = diagSh.getRange(startRow, 1, numRows, headers.length).getValues();

  // Parse into objects
  const rounds = raw.map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });

  const count = rounds.length;
  if (count === 0) return;

  // Compute averages
  const avg = key => {
    const vals = rounds.map(r => Number(r[key]) || 0);
    return parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2));
  };

  const avgScore    = avg('Score');
  const avgFIR      = avg('FIR');
  const avgGIR      = avg('GIR');
  const avgUD       = avg('UD');
  const avgPutts    = avg('Putts');
  const avgPen      = avg('Penalties');
  const avgBSGap    = avg('BallStrikingGap');
  const avgMissed   = avg('MissedOpp');
  const avgSGEff    = avg('ShortGameEff');
  const avgPPGIR    = avg('PuttsPerGIR');
  const avgDiag     = avg('DiagnosticScore');
  const avgBSCost   = avg('BSCost');
  const avgSGCost   = avg('SGCost');
  const avgPuttCost = avg('PuttingCost');
  const avgTSL      = avg('TotalStrokesLost');

  // Colour helpers — green = good, amber = watch it, red = needs work
  function scoreColour(val, low, high) {
    // low = good threshold, high = needs-work threshold (higher = worse)
    if (val <= low)  return '#2d7a09';  // green
    if (val <= high) return '#e07b00';  // amber
    return '#c0392b';                   // red
  }
  function effColour(val, high, low) {
    // high = good threshold (higher = better)
    if (val >= high) return '#2d7a09';
    if (val >= low)  return '#e07b00';
    return '#c0392b';
  }

  const dateRange = count > 1
    ? formatDate_(rounds[0].Date) + ' – ' + formatDate_(rounds[count - 1].Date)
    : formatDate_(rounds[0].Date);

  const courseList = [...new Set(rounds.map(r => r.Course))].join(', ');

  // Build round-by-round table rows
  const roundRows = rounds.map(r => `
    <tr>
      <td>${formatDate_(r.Date)}</td>
      <td>${r.Course}</td>
      <td style="text-align:center;font-weight:bold">${r.Score}</td>
      <td style="text-align:center">${r.FIR}/18</td>
      <td style="text-align:center">${r.GIR}/18</td>
      <td style="text-align:center">${r.UD}</td>
      <td style="text-align:center">${r.Putts}</td>
      <td style="text-align:center">${r.Penalties || 0}</td>
      <td style="text-align:center;color:${scoreColour(r.TotalStrokesLost, 8, 15)};font-weight:bold">${r.TotalStrokesLost}</td>
    </tr>`).join('');

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body      { font-family: Arial, sans-serif; color: #222; background: #f4f7f0; margin: 0; padding: 20px; }
  .wrap     { max-width: 640px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,.12); }
  .header   { background: #377f09; color: #fff; padding: 24px 28px 18px; }
  .header h1{ margin: 0; font-size: 22px; }
  .header p { margin: 6px 0 0; font-size: 13px; opacity: .85; }
  .body     { padding: 24px 28px; }
  h2        { color: #377f09; font-size: 15px; margin: 24px 0 10px; border-bottom: 1px solid #e0e8d8; padding-bottom: 4px; }
  table     { border-collapse: collapse; width: 100%; font-size: 13px; margin-bottom: 16px; }
  th        { background: #e8f3de; color: #2a5a06; text-align: left; padding: 7px 8px; font-size: 12px; }
  td        { padding: 6px 8px; border-bottom: 1px solid #f0f0f0; }
  tr:last-child td { border-bottom: none; }
  .kpi-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 20px; }
  .kpi      { background: #f4f7f0; border-radius: 6px; padding: 12px; text-align: center; }
  .kpi-val  { font-size: 24px; font-weight: bold; color: #377f09; }
  .kpi-lbl  { font-size: 11px; color: #666; margin-top: 2px; }
  .insight  { background: #fffbe6; border-left: 4px solid #e07b00; padding: 12px 14px; border-radius: 0 6px 6px 0; font-size: 13px; margin-bottom: 10px; }
  .good     { color: #2d7a09; font-weight: bold; }
  .warn     { color: #e07b00; font-weight: bold; }
  .poor     { color: #c0392b; font-weight: bold; }
  .footer   { background: #f4f7f0; padding: 14px 28px; font-size: 11px; color: #888; text-align: center; }
</style>
</head>
<body>
<div class="wrap">

  <div class="header">
    <h1>⛳ Golf Performance Report</h1>
    <p>Last ${count} round${count > 1 ? 's' : ''} · ${dateRange}</p>
    <p>${courseList}</p>
  </div>

  <div class="body">

    <h2>Scoring Summary</h2>
    <div class="kpi-grid">
      <div class="kpi">
        <div class="kpi-val">${avgScore}</div>
        <div class="kpi-lbl">Avg Score</div>
      </div>
      <div class="kpi">
        <div class="kpi-val" style="color:${effColour(avgGIR, 5, 3)}">${avgGIR}</div>
        <div class="kpi-lbl">Avg GIR / 18</div>
      </div>
      <div class="kpi">
        <div class="kpi-val" style="color:${scoreColour(avgPutts, 34, 38)}">${avgPutts}</div>
        <div class="kpi-lbl">Avg Putts</div>
      </div>
    </div>

    <h2>Round by Round</h2>
    <table>
      <thead>
        <tr>
          <th>Date</th><th>Course</th><th>Score</th>
          <th>FIR</th><th>GIR</th><th>UD</th>
          <th>Putts</th><th>Pen</th><th>Strokes Lost</th>
        </tr>
      </thead>
      <tbody>${roundRows}</tbody>
    </table>

    <h2>Averages — Last ${count} Rounds</h2>
    <table>
      <thead>
        <tr><th>Stat</th><th>Value</th><th>Interpretation</th></tr>
      </thead>
      <tbody>
        <tr>
          <td>Fairways in Regulation (FIR)</td>
          <td style="text-align:center">${avgFIR}/18</td>
          <td style="color:${effColour(avgFIR, 7, 4)}">${avgFIR >= 7 ? '✓ Solid tee play' : avgFIR >= 4 ? '▲ Serviceable' : '✗ Focus on tee ball'}</td>
        </tr>
        <tr>
          <td>Greens in Regulation (GIR)</td>
          <td style="text-align:center">${avgGIR}/18</td>
          <td style="color:${effColour(avgGIR, 5, 3)}">${avgGIR >= 5 ? '✓ Good ball-striking' : avgGIR >= 3 ? '▲ Room to improve' : '✗ Iron play needs work'}</td>
        </tr>
        <tr>
          <td>Up &amp; Downs (UD)</td>
          <td style="text-align:center">${avgUD}</td>
          <td>of ${Math.round(avgBSGap)} opportunities</td>
        </tr>
        <tr>
          <td>Short Game Efficiency</td>
          <td style="text-align:center">${Math.round(avgSGEff * 100)}%</td>
          <td style="color:${effColour(avgSGEff, 0.4, 0.25)}">${avgSGEff >= 0.4 ? '✓ Solid short game' : avgSGEff >= 0.25 ? '▲ Developing' : '✗ Priority area'}</td>
        </tr>
        <tr>
          <td>Putts per GIR</td>
          <td style="text-align:center">${avgPPGIR}</td>
          <td style="color:${scoreColour(avgPPGIR, 1.8, 2.2)}">${avgPPGIR <= 1.8 ? '✓ Strong on the greens' : avgPPGIR <= 2.2 ? '▲ Average putting' : '✗ Work on lag putting'}</td>
        </tr>
        <tr>
          <td>Penalties</td>
          <td style="text-align:center">${avgPen}</td>
          <td style="color:${scoreColour(avgPen, 0.5, 2)}">${avgPen <= 0.5 ? '✓ Clean rounds' : avgPen <= 2 ? '▲ Some costly holes' : '✗ Course management'}</td>
        </tr>
      </tbody>
    </table>

    <h2>Strokes Lost Breakdown</h2>
    <table>
      <thead>
        <tr><th>Category</th><th>Avg Cost</th><th>What it means</th></tr>
      </thead>
      <tbody>
        <tr>
          <td>Ball Striking Cost</td>
          <td style="text-align:center;color:${scoreColour(avgBSCost, 4, 7)};font-weight:bold">${avgBSCost}</td>
          <td>Strokes lost from missed greens — focus: iron play</td>
        </tr>
        <tr>
          <td>Short Game Cost</td>
          <td style="text-align:center;color:${scoreColour(avgSGCost, 3, 6)};font-weight:bold">${avgSGCost}</td>
          <td>Strokes lost from failed up-&amp;-downs — focus: chipping</td>
        </tr>
        <tr>
          <td>Putting Cost</td>
          <td style="text-align:center;color:${scoreColour(avgPuttCost, 0, 4)};font-weight:bold">${avgPuttCost > 0 ? '+' + avgPuttCost : avgPuttCost}</td>
          <td>${avgPuttCost < 0 ? '✓ Putting is saving you strokes' : avgPuttCost === 0 ? '✓ Benchmark putting' : '▲ Above benchmark (36 putts)'}</td>
        </tr>
        <tr style="background:#f4f7f0;">
          <td><strong>Total Strokes Lost</strong></td>
          <td style="text-align:center;font-weight:bold;font-size:15px;color:${scoreColour(avgTSL, 8, 15)}">${avgTSL}</td>
          <td>Lower is better — target under 10 for your handicap</td>
        </tr>
      </tbody>
    </table>

    <h2>Focus Area</h2>
    ${buildInsights_(avgBSCost, avgSGCost, avgPuttCost, avgPen)}

  </div>

  <div class="footer">
    Generated by My Golf Scores · ${new Date().toLocaleDateString('en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
  </div>
</div>
</body>
</html>`;

  const subject = `⛳ Golf Report — Last ${count} Rounds (avg ${avgScore})`;
  GmailApp.sendEmail(REPORT_EMAIL, subject, 'Your golf report (HTML email)', { htmlBody: html });
}

// ── Insights builder ───────────────────────────────────────────────────────

function buildInsights_(bsCost, sgCost, puttCost, pen) {
  // Rank the cost areas and surface the top 1–2 insights
  const areas = [
    { name: 'Iron Play / Ball Striking', cost: bsCost,  tip: 'Work on mid-iron approach shots — getting more GIR will cascade into lower scores across the board.' },
    { name: 'Short Game',                cost: sgCost,  tip: 'More up-and-downs from off the green. Practice chips and pitches from 10–30 yards, varying the lie.' },
    { name: 'Putting',                   cost: Math.max(0, puttCost), tip: 'Lag putting is the high-return skill — focus on speed control from 20–40 feet to avoid 3-putts.' },
    { name: 'Penalty Management',        cost: pen,    tip: 'Course management off the tee — play for the fat part of the fairway when the trouble is tight.' }
  ];

  areas.sort((a, b) => b.cost - a.cost);

  return areas.slice(0, 2).map(a =>
    `<div class="insight"><strong>${a.name}</strong> — ${a.tip}</div>`
  ).join('');
}

// ── Diagnostics sheet styling ──────────────────────────────────────────────

function styleDiagnosticsSheet_(sh) {
  if (!sh) return;
  sh.setFrozenRows(1);
  sh.setFrozenColumns(3);
  // Column widths
  const widths = [160, 90, 140, 55, 45, 45, 45, 55, 65, 100, 100, 85, 90, 85, 110, 65, 65, 80, 110];
  widths.forEach((w, i) => sh.setColumnWidth(i + 1, w));
}

function applyDiagnosticsColours_(sh, numDataRows) {
  if (numDataRows < 1) return;

  // Colour coding for key columns (1-based)
  // Col 4 = Score, 5=FIR, 6=GIR, 7=UD, 8=Putts, 13=ShortGameEff, 19=TotalStrokesLost
  const rules = sh.getConditionalFormatRules ? sh.getConditionalFormatRules() : [];
  // Keep any existing rules, add ours (simple approach: clear all and rebuild)
  sh.clearConditionalFormatRules();

  const dataRange = (col) => sh.getRange(2, col, numDataRows, 1);
  const green  = SpreadsheetApp.newColor().setRgbColor('#c6efce').build();
  const amber  = SpreadsheetApp.newColor().setRgbColor('#ffeb9c').build();
  const red    = SpreadsheetApp.newColor().setRgbColor('#ffc7ce').build();

  const newRules = [];

  function addGTE(col, threshold, colour) {
    newRules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenNumberGreaterThanOrEqualTo(threshold)
      .setBackground(colour)
      .setRanges([dataRange(col)])
      .build());
  }
  function addLTE(col, threshold, colour) {
    newRules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenNumberLessThanOrEqualTo(threshold)
      .setBackground(colour)
      .setRanges([dataRange(col)])
      .build());
  }

  // GIR (col 6): ≥6 green, ≤2 red
  addGTE(6, 6, green); addLTE(6, 2, red);
  // Putts (col 8): ≤34 green, ≥40 red
  addLTE(8, 34, green); addGTE(8, 40, red);
  // Short Game Eff (col 13): ≥0.4 green, ≤0.2 red
  addGTE(13, 0.4, green); addLTE(13, 0.2, red);
  // Total Strokes Lost (col 19): ≤8 green, ≥16 red
  addLTE(19, 8, green); addGTE(19, 16, red);

  if (newRules.length > 0) sh.setConditionalFormatRules(newRules);
}

// ── Weekly trigger setup ────────────────────────────────────────────────────

/**
 * Run once from the Script Editor to set up a weekly Sunday email.
 * Run → setupWeeklyTrigger()
 */
function setupWeeklyTrigger() {
  // Remove existing weekly triggers first to avoid duplicates
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'sendReport')
    .forEach(t => ScriptApp.deleteTrigger(t));

  ScriptApp.newTrigger('sendReport')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.SUNDAY)
    .atHour(8)
    .create();

  SpreadsheetApp.getUi().alert('Weekly Sunday 8am report scheduled.');
}

/**
 * Remove the weekly trigger.
 */
function removeWeeklyTrigger() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'sendReport')
    .forEach(t => ScriptApp.deleteTrigger(t));
  SpreadsheetApp.getUi().alert('Weekly trigger removed.');
}

// ── Gemini Query Handler ────────────────────────────────────────────────────

function handleGeminiQuery_(ss, question) {
  if (!question) return json_({ ok: false, error: 'No question provided.' });

  const sh = ss.getSheetByName(ROUNDS);
  let context = 'No rounds have been recorded yet.';

  if (sh && sh.getLastRow() >= 2) {
    const headers = roundsHeader_();
    const raw     = sh.getRange(2, 1, sh.getLastRow() - 1, headers.length).getValues();

    const byRound = {};
    raw.forEach(row => {
      const id = row[0];
      if (!byRound[id]) {
        byRound[id] = {
          Round_ID: id,
          Date:     row[1],
          Course:   row[2],
          Tees:     row[3],
          holes:    []
        };
      }
      byRound[id].holes.push({
        Hole:         row[4],
        Par:          row[5],
        Stroke_Index: row[6],
        Score:        row[7],
        Putts:        row[8],
        FIR:          row[9],
        GIR:          row[10],
        UD:           row[11],
        X_UD:         row[12],
        Penalties:    row[13],
        Net_Score:    row[14]
      });
    });

    const lines = [];
    Object.values(byRound).forEach(r => {
      const total  = r.holes.reduce((s,h) => s + (Number(h.Score) || 0), 0);
      const net    = r.holes.reduce((s,h) => s + (Number(h.Net_Score) || 0), 0);
      const putts  = r.holes.reduce((s,h) => s + (Number(h.Putts) || 0), 0);
      const firs   = r.holes.filter(h => isTruthy_(h.FIR)).length;
      const girs   = r.holes.filter(h => isTruthy_(h.GIR)).length;
      const pens   = r.holes.reduce((s,h) => s + (Number(h.Penalties) || 0), 0);
      lines.push(
        `Round ${r.Date} at ${r.Course} (${r.Tees}): ` +
        `Gross ${total}, Net ${net}, Putts ${putts}, FIR ${firs}/18, GIR ${girs}/18, Penalties ${pens}`
      );
    });
    context = lines.join('\n');
  }

  const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!apiKey) return json_({ ok: false, error: 'Gemini API key not configured in Script Properties.' });

  const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey;
  const prompt   = [
    'You are a friendly golf statistics assistant. The player is Paul, a 67-year-old recreational golfer.',
    'Here is his round data:\n' + context,
    '\nAnswer this question in plain, conversational English (2–4 sentences max): ' + question
  ].join('\n');

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.4, maxOutputTokens: 256 }
  };

  const resp = UrlFetchApp.fetch(endpoint, {
    method:      'post',
    contentType: 'application/json',
    payload:     JSON.stringify(payload),
    muteHttpExceptions: true
  });

  const code = resp.getResponseCode();
  const body = JSON.parse(resp.getContentText());

  if (code !== 200) {
    return json_({ ok: false, error: body.error ? body.error.message : 'Gemini error ' + code });
  }

  const answer = body.candidates &&
                 body.candidates[0] &&
                 body.candidates[0].content &&
                 body.candidates[0].content.parts &&
                 body.candidates[0].content.parts[0] &&
                 body.candidates[0].content.parts[0].text
                   ? body.candidates[0].content.parts[0].text.trim()
                   : 'No answer returned.';

  return json_({ ok: true, answer: answer });
}

// ── Helpers ────────────────────────────────────────────────────────────────

function ensureSheet_(ss, name, header) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.appendRow(header);
    sh.getRange(1, 1, 1, header.length)
      .setFontWeight('bold')
      .setBackground('#e8f3de');
    sh.setFrozenRows(1);
  }
}

function getSettings_(sh) {
  const map = {};
  if (!sh || sh.getLastRow() < 2) return map;
  const rows = sh.getRange(2, 1, sh.getLastRow() - 1, 2).getValues();
  rows.forEach(r => { if (r[0]) map[String(r[0])] = r[1]; });
  return map;
}

function countRounds_(roundsSh) {
  if (!roundsSh || roundsSh.getLastRow() < 2) return 0;
  const ids = roundsSh.getRange(2, 1, roundsSh.getLastRow() - 1, 1).getValues();
  return new Set(ids.map(r => String(r[0]))).size;
}

function isTruthy_(val) {
  return val === true || val === 'TRUE' || val === 1 || val === '1';
}

function formatDate_(d) {
  if (!d) return '';
  if (d instanceof Date) return d.toLocaleDateString('en-CA');
  return String(d);
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
