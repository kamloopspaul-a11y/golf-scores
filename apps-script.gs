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

// Rebuild manually from the Script Editor — handy if the tab gets out of sync
function rebuildDiagnostics() {
  buildDiagnostics_(SpreadsheetApp.getActive());
  Logger.log('Diagnostics tab rebuilt successfully.');
}

// ── Email Report ───────────────────────────────────────────────────────────

/**
 * sendReport — callable from the Script Editor menu.
 * Reads the last REPORT_LAST_N_ROUNDS rows from Diagnostics and sends
 * an HTML email to REPORT_EMAIL.
 */
function sendReport() {
  sendReport_(SpreadsheetApp.getActive(), REPORT_LAST_N_ROUNDS);
  Logger.log('Report sent to ' + REPORT_EMAIL);
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

  // Read settings
  const settingsSh = ss.getSheetByName(SETTINGS);
  const settings   = getSettings_(settingsSh);
  const hi         = parseFloat(settings['Handicap_Index'] || 20);
  const homeCourse = String(settings['Home Course'] || 'Mt. Paul').trim();

  // Course Handicap — Mt. Paul Mens Blue (update when tee selector is wired)
  const teeRatings = { cr: 59.0, sr: 86, par: 64 };
  const ch = Math.round(hi * (teeRatings.sr / 113) + (teeRatings.cr - teeRatings.par));

  // Compute averages (raw floats — formatted on output)
  const avg = key => {
    const vals = rounds.map(r => Number(r[key]) || 0);
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  };

  const avgScore    = avg('Score');
  const avgFIR      = avg('FIR');
  const avgGIR      = avg('GIR');
  const avgUD       = avg('UD');
  const avgXUD      = avg('MissedOpp');      // Failed Up & Downs (X-UD)
  const avgPutts    = avg('Putts');
  const avgPen      = avg('Penalties');
  const avgSGOpp    = avg('ShortGameOpp');
  const avgBSCost   = avg('BSCost');
  const avgSGCost   = avg('SGCost');
  const avgPuttCost = avg('PuttingCost');
  const avgTSL      = avg('TotalStrokesLost');

  const netAvg = (avgScore - ch).toFixed(1);

  // Format helpers
  const f1   = v  => parseFloat(v.toFixed(1));    // 1 decimal
  const fInt = v  => Math.round(v);               // integer
  const fPc  = v  => Math.round(v * 100);         // percent (0–100)

  // Colour helpers — green = good, amber = watch, red = needs work
  function scoreColour(val, low, high) {
    if (val <= low)  return '#2d7a09';
    if (val <= high) return '#e07b00';
    return '#c0392b';
  }
  function effColour(val, high, low) {
    if (val >= high) return '#2d7a09';
    if (val >= low)  return '#e07b00';
    return '#c0392b';
  }

  const dateRange = count > 1
    ? formatDate_(rounds[0].Date) + ' – ' + formatDate_(rounds[count - 1].Date)
    : formatDate_(rounds[0].Date);

  // ── Round-by-round rows ────────────────────────────────────────────────────
  const roundRows = rounds.map((r, i) => {
    const rowBg = i % 2 === 1 ? ' style="background:#f5f9f0"' : '';
    return `
    <tr${rowBg}>
      <td style="text-align:center;font-weight:bold;white-space:nowrap">${r.Score}</td>
      <td style="text-align:center">${fInt(r.FIR)}</td>
      <td style="text-align:center">${fInt(r.GIR)}</td>
      <td style="text-align:center">${fInt(r.Penalties || 0)}</td>
      <td style="text-align:center">${fInt(r.UD)}</td>
      <td style="text-align:center">${fInt(r.MissedOpp || 0)}</td>
      <td style="text-align:center">${fInt(r.Putts)}</td>
      <td style="text-align:center;color:${scoreColour(r.TotalStrokesLost, 8, 15)};font-weight:bold">${f1(r.TotalStrokesLost)}</td>
    </tr>`;
  }).join('');

  // ── N Round Average rows — order: FIR, GIR, PEN, UD, X-UD, PUTTS ──────────
  const avgTableRows = [
    { lbl: 'FIR',   val: f1(avgFIR),   col: effColour(avgFIR, 7, 4),       note: avgFIR >= 7  ? 'Solid tee play'           : avgFIR >= 4  ? 'Serviceable'              : 'Focus on tee ball'         },
    { lbl: 'GIR',   val: f1(avgGIR),   col: effColour(avgGIR, 5, 3),       note: avgGIR >= 5  ? 'Good ball striking'        : avgGIR >= 3  ? 'Room to improve'           : 'Iron play needs work'      },
    { lbl: 'PEN',   val: f1(avgPen),   col: scoreColour(avgPen, 0.5, 2),   note: avgPen <= 0.5 ? 'Clean rounds'              : avgPen <= 2  ? 'Some costly holes'         : 'Course management priority'},
    { lbl: 'UD',    val: f1(avgUD),    col: effColour(avgUD, 4, 2),        note: `${fInt(avgSGOpp)} opportunities to get up and down`                                                                   },
    { lbl: 'X-UD',  val: f1(avgXUD),  col: scoreColour(avgXUD, 3, 7),     note: 'Failed up & downs — fewer is better'                                                                                  },
    { lbl: 'PUTTS', val: f1(avgPutts), col: scoreColour(avgPutts, 34, 38), note: avgPutts <= 34 ? 'Strong on greens'          : avgPutts <= 36 ? 'Near benchmark of 36'    : 'Work on lag putting'      }
  ].map(r => `
    <tr${rowBg}>
      <td style="width:22%;font-weight:600">${r.lbl}</td>
      <td style="width:13%;text-align:center;color:${r.col};font-weight:500">${r.val}</td>
      <td style="width:65%;color:${r.col}">${r.note}</td>
    </tr>`).join('');

  // ── HTML ───────────────────────────────────────────────────────────────────
  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body     { font-family: Arial, sans-serif; color: #222; background: #f4f7f0; margin: 0; padding: 16px; }
  .wrap    { max-width: 640px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,.12); }
  .hdr     { background: #377f09; color: #fff; padding: 18px 16px 14px; }
  .hdr h1  { margin: 0; font-size: 20px; }
  .hdr p   { margin: 4px 0 0; font-size: 12px; opacity: .85; }
  .body    { padding: 14px 12px; }
  /* Scoring summary grid */
  .ss      { width: 100%; border-collapse: collapse; background: #e8f3de; margin-bottom: 14px; }
  .ss td   { padding: 10px 6px; text-align: center; width: 20%; vertical-align: middle; }
  .ss-val  { font-size: 22px; font-weight: bold; }
  .ss-lbl  { font-size: 10px; color: #555; margin-top: 3px; text-transform: uppercase; letter-spacing: .4px; }
  .ss-hero { background: #fff; border-left: 2px solid #c8e0b0; width: 40%; vertical-align: middle; }
  .ss-big  { font-size: 34px; font-weight: bold; color: #377f09; line-height: 1; }
  .ss-sub  { font-size: 11px; color: #666; margin-top: 5px; }
  /* Collapsible sections */
  details  { margin: 12px 0 0; }
  summary  { cursor: pointer; color: #377f09; font-size: 14px; font-weight: bold;
             padding: 6px 2px 4px; border-bottom: 1px solid #e0e8d8;
             list-style: none; user-select: none; }
  summary::-webkit-details-marker { display: none; }
  summary::before      { content: '▶ '; font-size: 10px; vertical-align: middle; }
  details[open] summary::before { content: '▼ '; }
  details > *:not(summary) { margin-top: 8px; }
  /* Tables */
  table    { border-collapse: collapse; width: 100%; font-size: 12px; }
  th       { background: #e8f3de; color: #2a5a06; text-align: center; padding: 5px 3px;
             font-size: 11px; white-space: nowrap; }
  th:first-child { text-align: left; padding-left: 4px; }
  td       { padding: 5px 3px; border-bottom: 1px solid #f0f0f0; text-align: center; }
  td:first-child { text-align: left; padding-left: 4px; }
  tr:last-child td { border-bottom: none; }
  .insight { background: #fffbe6; border-left: 4px solid #e07b00; padding: 10px 12px;
             border-radius: 0 6px 6px 0; font-size: 13px; margin-bottom: 8px; }
  .footer  { background: #f4f7f0; padding: 10px 14px; font-size: 11px; color: #888;
             text-align: center; border-top: 1px solid #e0e8d8; margin-top: 14px; }
</style>
</head>
<body>
<div class="wrap">

  <div class="hdr">
    <h1>Golf Performance Report</h1>
    <p>${dateRange} · ${count} round${count > 1 ? 's' : ''}</p>
  </div>

  <div class="body">

    <!-- Scoring Summary: 2-row × 4-col grid matching App layout -->
    <table class="ss">
      <tr${rowBg}>
        <td><div class="ss-val" style="color:${effColour(avgFIR,7,4)}">${fInt(avgFIR)}</div><div class="ss-lbl">FIR</div></td>
        <td><div class="ss-val" style="color:${effColour(avgGIR,5,3)}">${fInt(avgGIR)}</div><div class="ss-lbl">GIR</div></td>
        <td><div class="ss-val" style="color:${scoreColour(avgPen,0.5,2)}">${f1(avgPen)}</div><div class="ss-lbl">PEN</div></td>
        <td class="ss-hero" rowspan="2">
          <div class="ss-big">${f1(avgScore)}</div>
          <div class="ss-sub">HI: ${hi} | Net: ${netAvg}</div>
        </td>
      </tr>
      <tr${rowBg}>
        <td><div class="ss-val" style="color:${effColour(avgUD,4,2)}">${f1(avgUD)}</div><div class="ss-lbl">UD</div></td>
        <td><div class="ss-val" style="color:${scoreColour(avgXUD,3,7)}">${f1(avgXUD)}</div><div class="ss-lbl">X-UD</div></td>
        <td><div class="ss-val" style="color:${scoreColour(avgPutts,34,38)}">${f1(avgPutts)}</div><div class="ss-lbl">PUTTS</div></td>
      </tr>
    </table>

    <!-- Round by Round -->
    <details open style="margin-top:20px">
      <summary>Round by Round</summary>
      <table>
        <thead>
          <tr${rowBg}>
            <th>Score</th>
            <th>FIR</th><th>GIR</th><th>PEN</th>
            <th>UD</th><th>X-UD</th><th>PUTTS</th>
            <th>TSL</th>
          </tr>
        </thead>
        <tbody>${roundRows}</tbody>
      </table>
    </details>

    <!-- N Round Average -->
    <details open style="margin-top:20px">
      <summary>${count} Round Average</summary>
      <table>
        <thead>
          <tr${rowBg}>
            <th style="text-align:left;width:22%">Stat</th>
            <th style="width:13%">Avg</th>
            <th style="text-align:left;width:65%">Reading</th>
          </tr>
        </thead>
        <tbody>${avgTableRows}</tbody>
      </table>
    </details>

    <!-- Cost Breakdown -->
    <details style="margin-top:20px">
      <summary>Cost Breakdown</summary>
      <table>
        <thead>
          <tr${rowBg}>
            <th style="text-align:left;width:22%">Category</th>
            <th style="width:13%">Avg</th>
            <th style="text-align:left;width:65%">What it means</th>
          </tr>
        </thead>
        <tbody>
          <tr${rowBg}>
            <td style="font-weight:600">Ball Striking</td>
            <td style="text-align:center;color:${scoreColour(avgBSCost,4,7)};font-weight:500">${f1(avgBSCost)}</td>
            <td>Missed greens × 0.5 — each green missed costs half a stroke on average</td>
          </tr>
          <tr${rowBg}>
            <td style="font-weight:600">Short Game</td>
            <td style="text-align:center;color:${scoreColour(avgSGCost,3,6)};font-weight:500">${f1(avgSGCost)}</td>
            <td>Failed up &amp; downs × 0.7 — each X-UD costs about 0.7 strokes</td>
          </tr>
          <tr${rowBg}>
            <td style="font-weight:600">Putting</td>
            <td style="text-align:center;color:${scoreColour(avgPuttCost,0,4)};font-weight:500">${avgPuttCost > 0 ? '+' + f1(avgPuttCost) : f1(avgPuttCost)}</td>
            <td>${avgPuttCost < 0 ? 'Saving strokes — below the 36-putt benchmark' : avgPuttCost === 0 ? 'At the 36-putt benchmark' : 'Above the 36-putt benchmark'}</td>
          </tr>
          <tr${rowBg}>
            <td style="font-weight:600">Penalties</td>
            <td style="text-align:center;color:${scoreColour(avgPen,0.5,2)};font-weight:500">${f1(avgPen)}</td>
            <td>Direct stroke cost — each penalty adds one stroke</td>
          </tr>
          <tr style="background:#f4f7f0">
            <td style="font-weight:700">Total</td>
            <td style="text-align:center;color:${scoreColour(avgTSL,8,15)};font-weight:700;font-size:14px">${f1(avgTSL)}</td>
            <td>Sum of all four categories — lower is better, target below 10</td>
          </tr>
        </tbody>
      </table>
    </details>

    <!-- Focus Areas -->
    <div style="margin-top:14px">
      ${buildInsights_(avgBSCost, avgSGCost, avgPuttCost, avgPen)}
    </div>

  </div>

  <div class="footer">
    My Golf Scores · ${new Date().toLocaleDateString('en-CA')}
  </div>

</div>
</body>
</html>`;

  const subject = `Golf Report — Last ${count} Rounds (avg ${f1(avgScore)})`;
  GmailApp.sendEmail(REPORT_EMAIL, subject, 'Your golf report (HTML email)', { htmlBody: html });
}

// ── Insights builder ───────────────────────────────────────────────────────

function buildInsights_(bsCost, sgCost, puttCost, pen) {
  const areas = [
    { name: 'Ball Striking',      cost: bsCost,              tip: 'Work on mid-iron approach shots — more GIR cascades into lower scores.' },
    { name: 'Short Game',         cost: sgCost,              tip: 'Chips and pitches from 10–30 yards. Vary the lie. X-UD count drops fast with 20 min of practice.' },
    { name: 'Putting',            cost: Math.max(0,puttCost), tip: 'Lag speed control from 20–40 ft is the highest-return putting skill.' },
    { name: 'Penalty Management', cost: pen,                  tip: 'Play to the fat part of the fairway when trouble is tight. One safe shot beats two recovery shots.' }
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

  sh.clearConditionalFormatRules();

  const dataRange = (col) => sh.getRange(2, col, numDataRows, 1);

  const newRules = [];

  function addRule(col, type, threshold, hex) {
    const builder = SpreadsheetApp.newConditionalFormatRule()
      .setBackground(hex)
      .setRanges([dataRange(col)]);
    if (type === 'gte') builder.whenNumberGreaterThanOrEqualTo(threshold);
    else                builder.whenNumberLessThanOrEqualTo(threshold);
    newRules.push(builder.build());
  }

  // GIR (col 6): ≥6 green, ≤2 red
  addRule(6, 'gte', 6,  '#c6efce');
  addRule(6, 'lte', 2,  '#ffc7ce');
  // Putts (col 8): ≤34 green, ≥40 red
  addRule(8, 'lte', 34, '#c6efce');
  addRule(8, 'gte', 40, '#ffc7ce');
  // Short Game Eff (col 13): ≥0.4 green, ≤0.2 red
  addRule(13, 'gte', 0.4, '#c6efce');
  addRule(13, 'lte', 0.2, '#ffc7ce');
  // Total Strokes Lost (col 19): ≤8 green, ≥16 red
  addRule(19, 'lte', 8,  '#c6efce');
  addRule(19, 'gte', 16, '#ffc7ce');

  sh.setConditionalFormatRules(newRules);
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

  Logger.log('Weekly Sunday 8am report scheduled.');
}

/**
 * Remove the weekly trigger.
 */
function removeWeeklyTrigger() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'sendReport')
    .forEach(t => ScriptApp.deleteTrigger(t));
  Logger.log('Weekly trigger removed.');
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
