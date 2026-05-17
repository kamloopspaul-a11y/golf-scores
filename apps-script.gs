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
 */

const ROUNDS      = 'Rounds';
const SETTINGS    = 'Settings';
const DIAGNOSTICS = 'Diagnostics';

const REPORT_EMAIL   = 'kamloopspaul@gmail.com';

// Round-count windows (rounds). A report fires when totalRounds % n === 0 for any window.
// Smallest first — combined email sections appear in this order.
const ROUND_WINDOWS  = [5, 10, 20];

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
    'FIR', 'GIR', 'UD', 'X_UD', 'Penalties', 'Net_Score',
    'Pending', 'Pairing_ID', 'Round_Type'
  ];
}

function diagnosticsHeader_() {
  return [
    'Round_ID', 'Date', 'Course', 'Score', 'FIR', 'GIR', 'UD', 'Putts', 'Penalties',
    'BallStrikingGap', 'ShortGameOpp', 'MissedOpp', 'ShortGameEff',
    'PuttsPerGIR', 'DiagnosticScore', 'BSCost', 'SGCost', 'PuttingCost', 'TotalStrokesLost',
    'Round_Type'
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

  // Migrate Rounds header — add any columns that are in roundsHeader_() but missing from row 1
  const roundsSh = ss.getSheetByName(ROUNDS);
  if (roundsSh && roundsSh.getLastRow() >= 1) {
    const fullHeader = roundsHeader_();
    const existingHeader = roundsSh.getRange(1, 1, 1, roundsSh.getLastColumn()).getValues()[0];
    fullHeader.forEach((col, i) => {
      if (!existingHeader[i]) roundsSh.getRange(1, i + 1).setValue(col);
    });
  }

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

  if (action === 'report') {
    try {
      sendReport_(SpreadsheetApp.getActive(), REPORT_LAST_N_ROUNDS);
      return json_({ ok: true, message: 'Report sent.' });
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

    // ── Secret token check ───────────────────────────────────────────────
    const secret = PropertiesService.getScriptProperties().getProperty('WEBHOOK_SECRET');
    if (secret && p.secret !== secret) {
      return json_({ ok: false, error: 'Unauthorised.' });
    }

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

    const isPending = p.pending === true;
    const pairingId = p.pairingId || '';

    // Round_Type: Home / Local / Away
    const homeCourse_ = String((getSettings_(ss.getSheetByName(SETTINGS))['Home Course'] || 'Mt. Paul')).trim().toLowerCase();
    const courseId_   = (p.courseId != null) ? Number(p.courseId) : NaN;
    const roundType   = isNaN(courseId_)   ? 'Local'
                      : courseId_ < 0      ? 'Away'
                      : sanitize_(course).trim().toLowerCase() === homeCourse_ ? 'Home'
                      : 'Local';

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
        roundId, sanitize_(date), sanitize_(course), sanitize_(tees), num,
        hPar, hIdx, hScore, hPutts,
        hFir, hGir, hUd, hXud, hPen, netScore,
        isPending ? 'TRUE' : '', pairingId, roundType
      ]);
    }

    if (rows.length > 0) {
      roundsSh
        .getRange(roundsSh.getLastRow() + 1, 1, rows.length, rows[0].length)
        .setValues(rows);
    }

    // ── Widow pairing ───────────────────────────────────────────────────────
    // If this is a pending 9-hole round, check whether an unmatched pending
    // round already exists.  If so, merge them into one 18-hole record:
    //   • renumber the new holes 10–18
    //   • reassign their Round_ID to the widow's Round_ID
    //   • clear the Pending flag on all rows for both halves
    //   • rebuild Diagnostics on the completed 18-hole round
    if (isPending) {
      const allData = roundsSh.getLastRow() > 1
        ? roundsSh.getRange(2, 1, roundsSh.getLastRow() - 1, 16).getValues()
        : [];

      // Find the oldest pending round that isn't this submission
      let widowId = null;
      for (let i = 0; i < allData.length; i++) {
        const rId      = String(allData[i][0]);
        const rPending = allData[i][15];
        if ((rPending === 'TRUE' || rPending === true) && rId !== roundId) {
          widowId = rId;
          break;
        }
      }

      if (widowId) {
        // Update the 9 rows we just appended: new Round_ID, holes 10-18, clear Pending
        const lastRow     = roundsSh.getLastRow();
        const newRowStart = lastRow - rows.length + 1;
        for (let i = 0; i < rows.length; i++) {
          const sheetRow = newRowStart + i;
          roundsSh.getRange(sheetRow, 1).setValue(widowId);   // Round_ID
          roundsSh.getRange(sheetRow, 5).setValue(i + 10);    // Hole number 10-18
          roundsSh.getRange(sheetRow, 16).setValue('');        // clear Pending
        }

        // Clear Pending on the widow's original 9 rows
        const refreshed = roundsSh.getRange(2, 1, roundsSh.getLastRow() - 1, 16).getValues();
        for (let i = 0; i < refreshed.length; i++) {
          if (String(refreshed[i][0]) === widowId &&
              (refreshed[i][15] === 'TRUE' || refreshed[i][15] === true)) {
            roundsSh.getRange(i + 2, 16).setValue('');
          }
        }

        // Full 18-hole round is now complete — append one Diagnostics row
        appendDiagnosticsRow_(ss, widowId, hi);
        const totalRounds = countRounds_(roundsSh);
        checkRoundTriggers_(ss, totalRounds, hi);
        return json_({ ok: true, roundId: widowId, paired: true, courseHandicap: ch, totalRounds: totalRounds });
      }

      // No widow found — stored as pending, nothing more to do
      return json_({ ok: true, roundId: roundId, pending: true, pairingId: pairingId, courseHandicap: ch, totalRounds: countRounds_(roundsSh) });
    }

    // Full 18-hole round — append one Diagnostics row, check report trigger
    appendDiagnosticsRow_(ss, roundId, hi);
    const totalRounds = countRounds_(roundsSh);
    if (totalRounds > 0 && totalRounds % REPORT_EVERY_N_ROUNDS === 0) {
      sendReport_(ss, REPORT_LAST_N_ROUNDS);
    }

    const response = { ok: true, roundId: roundId, courseHandicap: ch, totalRounds: totalRounds };
    if (isPending) response.pairingId = pairingId;
    return json_(response);

  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

// ── Diagnostics: append one row for a completed round ─────────────────────
//
//  Called by doPost after each completed 18-hole record (direct post or
//  widow pairing). Reads only the rows for roundId, computes stats,
//  appends one row to Diagnostics, and refreshes conditional format rules.
//  Never called for pending 9-hole rounds.
//
// ───────────────────────────────────────────────────────────────────────────

function appendDiagnosticsRow_(ss, roundId, hi) {
  const roundsSh = ss.getSheetByName(ROUNDS);
  const diagSh   = ss.getSheetByName(DIAGNOSTICS);
  if (!roundsSh || !diagSh) return;

  const headers  = roundsHeader_();
  const allData  = roundsSh.getLastRow() > 1
    ? roundsSh.getRange(2, 1, roundsSh.getLastRow() - 1, headers.length).getValues()
    : [];

  const roundRows = allData.filter(r => String(r[0]) === roundId);
  if (!roundRows.length) return;

  const date      = roundRows[0][1];
  const course    = roundRows[0][2];
  const roundType = roundRows[0][17] || '';

  const score = roundRows.reduce((s, h) => s + (Number(h[7]) || 0), 0);
  const putts = roundRows.reduce((s, h) => s + (Number(h[8]) || 0), 0);
  const fir   = roundRows.filter(h => isTruthy_(h[9])).length;
  const gir   = roundRows.filter(h => isTruthy_(h[10])).length;
  const ud    = roundRows.filter(h => isTruthy_(h[11])).length;
  const pen   = roundRows.reduce((s, h) => s + (Number(h[13]) || 0), 0);

  const bsGap     = 18 - gir;
  const sgOpp     = 18 - gir;
  const missed    = sgOpp - ud;
  const sgEff     = sgOpp > 0 ? parseFloat((ud / sgOpp).toFixed(3)) : 0;
  const ppGir     = gir   > 0 ? parseFloat((putts / gir).toFixed(2)) : 0;
  const diagScore = bsGap + missed + putts;

  const bsCost        = parseFloat((bsGap * 0.5).toFixed(2));
  const sgMultiplier  = hi >= 29 ? 0.55 : hi >= 19 ? 0.60 : hi >= 10 ? 0.65 : 0.75;
  const sgCost        = parseFloat((missed * sgMultiplier).toFixed(2));
  const puttBenchmark = hi >= 29 ? 36 : hi >= 19 ? 34 : hi >= 10 ? 32 : 30;
  const puttCost      = putts - puttBenchmark;
  const totalSL       = parseFloat((bsCost + sgCost + puttCost + pen).toFixed(2));

  diagSh.appendRow([
    roundId, date, course, score, fir, gir, ud, putts, pen,
    bsGap, sgOpp, missed, sgEff, ppGir, diagScore,
    bsCost, sgCost, puttCost, totalSL, roundType
  ]);

  applyDiagnosticsColours_(diagSh, diagSh.getLastRow() - 1);
}

// ── Diagnostics: full rebuild (manual utility only) ────────────────────────
//
//  Rewrites the entire Diagnostics tab from Rounds data.
//  Call from the Script Editor menu after setup() or to repair drift.
//  NOT called by doPost — use appendDiagnosticsRow_() for live posts.
//
// ───────────────────────────────────────────────────────────────────────────

function buildDiagnostics_(ss) {
  const roundsSh = ss.getSheetByName(ROUNDS);
  const diagSh   = ss.getSheetByName(DIAGNOSTICS);
  if (!roundsSh || !diagSh) return;

  // Read HI from Settings so rebuild works correctly outside of doPost scope
  const hi = parseFloat(getSettings_(ss.getSheetByName(SETTINGS))['Handicap_Index'] || 0);

  ensureSheet_(ss, DIAGNOSTICS, diagnosticsHeader_());

  // Read all Rounds data
  if (roundsSh.getLastRow() < 2) return;

  const headers = roundsHeader_();
  const raw = roundsSh.getRange(2, 1, roundsSh.getLastRow() - 1, headers.length).getValues();

  // Group rows by Round_ID — preserve insertion order (rounds in date order)
  const order  = [];
  const byRound = {};

  raw.forEach(row => {
    const id      = String(row[0]);
    const pending = row[15];                          // col 16 = Pending
    if (pending === 'TRUE' || pending === true) return; // skip pending 9-hole rounds
    if (!byRound[id]) {
      order.push(id);
      byRound[id] = {
        Round_ID:   id,
        Date:       row[1],
        Course:     row[2],
        Round_Type: row[17] || '',
        holes:      []
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
    const sgMultiplier = hi >= 29 ? 0.55 : hi >= 19 ? 0.60 : hi >= 10 ? 0.65 : 0.75; // HI-scaled SG multiplier (v1.2, WHS brackets, capped 36)
    const sgCost  = parseFloat((missed * sgMultiplier).toFixed(2));    // Short Game Cost (v1.2: HI-bracket multiplier)
    const puttBenchmark = hi >= 29 ? 36 : hi >= 19 ? 34 : hi >= 10 ? 32 : 30; // HI-scaled putt benchmark (v1.1)
    const puttCost = putts - puttBenchmark;                             // Putting Cost (>0 = strokes lost)
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
      totalSL,
      r.Round_Type || ''
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
 * Sends a last-20-rounds report manually. Same as the 20-round window in the auto triggers.
 * Run → sendReport()
 */
function sendReport() {
  const ss = SpreadsheetApp.getActive();
  const hi = parseFloat(getSettings_(ss.getSheetByName(SETTINGS))['Handicap_Index'] || 20);
  sendCombinedReport_(ss, [20], hi);
  Logger.log('Report sent to ' + REPORT_EMAIL);
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

// ── Round-count trigger dispatcher ─────────────────────────────────────────
//
//  Called from doPost after each completed 18-hole round.
//  Determines which ROUND_WINDOWS fire for totalRounds, then sends one
//  combined email covering all firing windows (smallest section first).
//  No email is sent when no window fires.
//
// ───────────────────────────────────────────────────────────────────────────

function checkRoundTriggers_(ss, totalRounds, hi) {
  if (totalRounds < 1) return;
  const firing = ROUND_WINDOWS.filter(n => totalRounds % n === 0);
  if (firing.length === 0) return;
  sendCombinedReport_(ss, firing, hi);
}

// ── Combined report sender ─────────────────────────────────────────────────
//
//  Builds one email with one section per window in `windows` array.
//  windows: array of integers, e.g. [5] or [5, 10] or [5, 10, 20].
//  Sections appear smallest first (ROUND_WINDOWS order is already smallest-first).
//
// ───────────────────────────────────────────────────────────────────────────

function sendCombinedReport_(ss, windows, hi) {
  const diagSh    = ss.getSheetByName(DIAGNOSTICS);
  if (!diagSh || diagSh.getLastRow() < 2) return;

  const settingsSh  = ss.getSheetByName(SETTINGS);
  const settings    = getSettings_(settingsSh);
  const hiVal       = hi != null ? hi : parseFloat(settings['Handicap_Index'] || 20);
  const homeCourse  = String(settings['Home Course'] || 'Mt. Paul').trim();

  const headers   = diagnosticsHeader_();
  const lastRow   = diagSh.getLastRow();
  const maxWindow = Math.max(...windows);
  const startRow  = Math.max(2, lastRow - maxWindow + 1);
  const numRows   = lastRow - startRow + 1;
  const raw       = diagSh.getRange(startRow, 1, numRows, headers.length).getValues();
  const allRounds = raw.map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });

  if (allRounds.length === 0) return;

  // Build one HTML section per window
  const sections = windows.map(n => {
    const slice = allRounds.slice(-n);
    return buildReportSectionHtml_(slice, hiVal, homeCourse, n);
  });

  // Subject line
  const windowLabels = windows.map(n => n + '-Round');
  const subject = windows.length === 1
    ? `Golf Performance Index — Last ${windows[0]} Rounds`
    : `Golf Performance Index — ${windowLabels.join(' & ')} Report`;

  // Assemble full email
  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body     { font-family: Arial, sans-serif; color: #222; background: #f4f7f0; margin: 0; padding: 16px; }
  .wrap    { max-width: 640px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,.12); }
  .hdr     { background: #377f09; color: #fff; padding: 18px 16px 20px; }
  .hdr h1  { margin: 0; font-size: 20px; }
  .hdr p   { margin: 4px 0 0; font-size: 12px; opacity: .85; }
  .body    { padding: 14px 12px; }
  .section-divider { border: none; border-top: 2px solid #e0e8d8; margin: 32px 0 24px; }
  .section-title { background: #f4f7f0; border-radius: 6px; padding: 10px 12px; margin-bottom: 16px;
                   font-size: 13px; font-weight: bold; color: #377f09; letter-spacing: .3px; }
  .ss-wrap { background: #fff; border-radius: 10px; padding: 5px; margin-bottom: 14px; }
  .ss      { width: 100%; border-collapse: separate; border-spacing: 4px; }
  .ss td   { padding: 0; vertical-align: middle; }
  .ss-card { background: #e8f3de; border-radius: 8px; padding: 10px 4px; text-align: center; }
  .ss-val  { font-size: 22px; font-weight: bold; color: #377f09; }
  .ss-lbl  { font-size: 10px; color: #555; margin-top: 3px; text-transform: uppercase; letter-spacing: .4px; }
  .ss-hero { background: #e8f3de; border-radius: 8px; padding: 14px 8px; text-align: center; vertical-align: middle; }
  .ss-big  { font-size: 34px; font-weight: bold; color: #377f09; line-height: 1; }
  .ss-sub  { font-size: 11px; color: #666; margin-top: 5px; }
  details  { margin: 24px 0 0; }
  summary  { cursor: pointer; color: #377f09; font-size: 10px; font-weight: bold;
             padding: 6px 2px 6px; border-bottom: 1px solid #e0e8d8;
             list-style: none; user-select: none; }
  summary::-webkit-details-marker { display: none; }
  summary::before      { content: '▶ '; font-size: 10px; vertical-align: middle; }
  details[open] summary::before { content: '▼ '; }
  details > *:not(summary) { margin-top: 8px; }
  table    { border-collapse: collapse; width: 100%; font-size: 12px; }
  th       { background: #e8f3de; color: #2a5a06; text-align: center; padding: 5px 3px;
             font-size: 11px; white-space: nowrap; }
  th:first-child { text-align: left; padding-left: 4px; }
  td       { padding: 5px 3px; border-bottom: 1px solid #f0f0f0; text-align: center; }
  td:first-child { text-align: left; padding-left: 4px; }
  tr:last-child td { border-bottom: none; }
  .stat-tbl td:nth-child(3) { text-align: left; }
  .insight { background: #fffbe6; padding: 10px 12px;
             border-radius: 6px; font-size: 13px; margin-bottom: 8px; }
  .footer  { background: #f4f7f0; padding: 10px 14px; font-size: 11px; color: #888;
             text-align: center; border-top: 1px solid #e0e8d8; margin-top: 14px; }
</style>
</head>
<body>
<div class="wrap">
  <div class="hdr">
    <h1>Golf Performance Index Report</h1>
    <p>${windows.length > 1 ? windows.join('-Round · ') + '-Round combined report' : 'Last ' + windows[0] + ' rounds'}</p>
  </div>
  <div class="body">
    ${sections.join('\n<hr class="section-divider">\n')}
  </div>
  <div class="footer">
    My Golf Scores · ${new Date().toLocaleDateString('en-CA')}
  </div>
</div>
</body>
</html>`;

  GmailApp.sendEmail(REPORT_EMAIL, subject, 'Your golf report (HTML email)', { htmlBody: html });
}

// ── Report section HTML builder ────────────────────────────────────────────
//
//  Builds the inner HTML for one report window.
//  rounds: array of Diagnostics row objects for this window.
//  Returns an HTML string (no <html>/<head>/<body> wrapper).
//
// ───────────────────────────────────────────────────────────────────────────

function buildReportSectionHtml_(rounds, hi, homeCourse, windowSize) {
  const count = rounds.length;
  if (count === 0) return '<p style="color:#888;font-size:12px">No data for this window.</p>';

  // Course Handicap — Mt. Paul Mens Blue (update when tee selector is wired)
  const teeRatings = { cr: 59.0, sr: 86, par: 64 };
  const ch = Math.round(hi * (teeRatings.sr / 113) + (teeRatings.cr - teeRatings.par));

  const avg = key => {
    const vals = rounds.map(r => Number(r[key]) || 0);
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  };

  const avgScore    = avg('Score');
  const avgFIR      = avg('FIR');
  const avgGIR      = avg('GIR');
  const avgUD       = avg('UD');
  const avgXUD      = avg('MissedOpp');
  const avgPutts    = avg('Putts');
  const avgPen      = avg('Penalties');
  const avgSGOpp    = avg('ShortGameOpp');
  const avgBSCost   = avg('BSCost');
  const avgSGCost   = avg('SGCost');
  const avgPuttCost = avg('PuttingCost');
  const avgTSL      = avg('TotalStrokesLost');
  const netAvg      = (avgScore - ch).toFixed(1);

  const f1   = v => parseFloat(v.toFixed(1));
  const fInt = v => Math.round(v);

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

  const sgMultiplier  = hi >= 29 ? 0.55 : hi >= 19 ? 0.60 : hi >= 10 ? 0.65 : 0.75;

  const roundRows = rounds.map((r, i) => {
    const isAway  = String(r.Course).trim() !== homeCourse;
    const rowStyle = isAway
      ? ` style="background:#fef3cd" title="${r.Course}"`
      : (i % 2 === 1 ? ' style="background:#f5f9f0"' : '');
    return `
    <tr${rowStyle}>
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

  const avgTableRows = [
    { lbl: 'FIR',   val: f1(avgFIR),   col: effColour(avgFIR, 7, 4),       note: avgFIR >= 7  ? 'Solid tee play'            : avgFIR >= 4  ? 'Serviceable'              : 'Focus on tee ball'          },
    { lbl: 'GIR',   val: f1(avgGIR),   col: effColour(avgGIR, 5, 3),       note: avgGIR >= 5  ? 'Good ball striking'         : avgGIR >= 3  ? 'Room to improve'           : 'Iron play needs work'       },
    { lbl: 'PEN',   val: f1(avgPen),   col: scoreColour(avgPen, 0.5, 2),   note: avgPen <= 0.5 ? 'Clean rounds'              : avgPen <= 2  ? 'Some costly holes'          : 'Course management priority' },
    { lbl: 'UD',    val: f1(avgUD),    col: effColour(avgUD, 4, 2),        note: `${fInt(avgSGOpp)} opportunities to get up and down`                                                                    },
    { lbl: 'X-UD',  val: f1(avgXUD),  col: scoreColour(avgXUD, 3, 7),     note: 'Failed up & downs — fewer is better'                                                                                   },
    { lbl: 'PUTTS', val: f1(avgPutts), col: scoreColour(avgPutts, 32, 36), note: avgPutts <= 32 ? 'Strong on greens'          : avgPutts <= 34 ? 'Near benchmark'           : 'Work on lag putting'       }
  ].map((r, i) => {
    const bg = i % 2 === 1 ? ' style="background:#f5f9f0"' : '';
    return `
    <tr${bg}>
      <td style="width:22%;font-weight:600">${r.lbl}</td>
      <td style="width:13%;text-align:center;color:${r.col};font-weight:500">${r.val}</td>
      <td style="width:65%;text-align:left;color:${r.col}">${r.note}</td>
    </tr>`;
  }).join('');

  return `
  <div class="section-title">LAST ${windowSize} ROUNDS</div>

  <!-- Scoring summary -->
  <div class="ss-wrap">
    <table class="ss">
      <tr>
        <td style="width:18%"><div class="ss-card"><div class="ss-val">${fInt(avgFIR)}</div><div class="ss-lbl">FIR</div></div></td>
        <td style="width:18%"><div class="ss-card"><div class="ss-val">${fInt(avgGIR)}</div><div class="ss-lbl">GIR</div></div></td>
        <td style="width:18%"><div class="ss-card"><div class="ss-val">${f1(avgPen)}</div><div class="ss-lbl">PEN</div></div></td>
        <td rowspan="2" class="ss-hero" style="width:46%"><div class="ss-big">${f1(avgScore)}</div><div class="ss-sub">HI: ${hi} | Net: ${netAvg}</div></td>
      </tr>
      <tr>
        <td><div class="ss-card"><div class="ss-val">${f1(avgUD)}</div><div class="ss-lbl">UD</div></div></td>
        <td><div class="ss-card"><div class="ss-val">${f1(avgXUD)}</div><div class="ss-lbl">X-UD</div></div></td>
        <td><div class="ss-card"><div class="ss-val">${f1(avgPutts)}</div><div class="ss-lbl">PUTTS</div></div></td>
      </tr>
    </table>
  </div>

  <!-- Round by Round -->
  <div style="margin-top:28px">
    <div style="color:#377f09;font-size:12px;font-weight:bold;padding:6px 2px 6px;border-bottom:1px solid #e0e8d8;margin-bottom:8px">ROUND BY ROUND</div>
    <table>
      <thead>
        <tr>
          <th>Score</th>
          <th>FIR</th><th>GIR</th><th>PEN</th>
          <th>UD</th><th>X-UD</th><th>PUTTS</th>
          <th>COST</th>
        </tr>
        <tr>
          <td colspan="8" style="font-size:10px;color:#666;font-style:italic;text-align:left;padding:4px 4px 6px;border-bottom:1px solid #e0e8d8">Cost = estimated strokes lost to missed greens, failed up &amp; downs, putting above benchmark, and penalties. Lower is better.</td>
        </tr>
      </thead>
      <tbody>${roundRows}</tbody>
    </table>
  </div>

  <!-- Round Average -->
  <div style="margin-top:28px">
    <div style="color:#377f09;font-size:12px;font-weight:bold;padding:6px 2px 6px;border-bottom:1px solid #e0e8d8;margin-bottom:8px">${count} ROUND AVERAGE</div>
    <table class="stat-tbl">
      <thead>
        <tr>
          <th style="text-align:left;width:22%">Stat</th>
          <th style="width:13%">Avg</th>
          <th style="text-align:left;width:65%">Reading</th>
        </tr>
      </thead>
      <tbody>${avgTableRows}</tbody>
    </table>
  </div>

  <!-- Cost Breakdown -->
  <div style="margin-top:28px">
    <div style="color:#377f09;font-size:12px;font-weight:bold;padding:6px 2px 6px;border-bottom:1px solid #e0e8d8;margin-bottom:8px">COST BREAKDOWN</div>
    <table class="stat-tbl">
      <thead>
        <tr>
          <th style="text-align:left;width:22%">Category</th>
          <th style="width:13%">Avg</th>
          <th style="text-align:left;width:65%">What it means</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="font-weight:600">Ball Striking</td>
          <td style="text-align:center;color:${scoreColour(avgBSCost,4,7)};font-weight:500">${f1(avgBSCost)}</td>
          <td style="text-align:left">Missed greens × 0.5 — each green missed costs half a stroke on average</td>
        </tr>
        <tr style="background:#f5f9f0">
          <td style="font-weight:600">Short Game</td>
          <td style="text-align:center;color:${scoreColour(avgSGCost,3,6)};font-weight:500">${f1(avgSGCost)}</td>
          <td style="text-align:left">Failed up &amp; downs × ${sgMultiplier} — HI-scaled cost per X-UD</td>
        </tr>
        <tr>
          <td style="font-weight:600">Putting</td>
          <td style="text-align:center;color:${scoreColour(avgPuttCost,0,4)};font-weight:500">${avgPuttCost > 0 ? '+' + f1(avgPuttCost) : f1(avgPuttCost)}</td>
          <td style="text-align:left">${avgPuttCost < 0 ? 'Saving strokes — below benchmark' : avgPuttCost === 0 ? 'At benchmark' : 'Above benchmark'}</td>
        </tr>
        <tr style="background:#f5f9f0">
          <td style="font-weight:600">Penalties</td>
          <td style="text-align:center;color:${scoreColour(avgPen,0.5,2)};font-weight:500">${f1(avgPen)}</td>
          <td style="text-align:left">Direct stroke cost — each penalty adds one stroke</td>
        </tr>
        <tr>
          <td style="font-weight:700">GPI Rating</td>
          <td style="text-align:center;color:${scoreColour(avgTSL,8,15)};font-weight:700">${f1(avgTSL)}</td>
          <td style="text-align:left">Estimated strokes lost per round. Lower is better.</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Focus Areas -->
  <div style="margin-top:14px">
    <div style="color:#377f09;font-size:12px;font-weight:bold;padding:6px 2px 6px;border-bottom:1px solid #e0e8d8;margin-bottom:8px">FOCUS AREAS</div>
    ${buildInsights_(avgBSCost, avgSGCost, avgPuttCost, avgPen)}
  </div>`;
}

// ── Calendar-based trigger setup ───────────────────────────────────────────
//
//  BiWeekly — fires every two weeks (Apps Script approximates with 14-day intervals).
//  Monthly  — fires on the 1st of each month at 8am.
//  Season Summary — fires on the 15th of each month at 8am; handler checks for November.
//
//  Run each setup function ONCE from the Script Editor.
//  The handler function sendScheduledReport() sends a ROUND_WINDOWS[last] report.
//  checkSeasonSummary() sends the full season report only in November.
//
// ───────────────────────────────────────────────────────────────────────────

/**
 * Set up a biweekly (every 14 days) email trigger.
 * Run once from Script Editor: Run → setupBiweeklyTrigger()
 */
function setupBiweeklyTrigger() {
  removeTriggerByHandler_('sendScheduledReport_biweekly');
  ScriptApp.newTrigger('sendScheduledReport_biweekly')
    .timeBased()
    .everyWeeks(2)
    .onWeekDay(ScriptApp.WeekDay.SUNDAY)
    .atHour(8)
    .create();
  Logger.log('Biweekly Sunday 8am trigger set.');
}

function removeBiweeklyTrigger() {
  removeTriggerByHandler_('sendScheduledReport_biweekly');
  Logger.log('Biweekly trigger removed.');
}

/**
 * Set up a monthly trigger (1st of month, 8am).
 * Run once from Script Editor: Run → setupMonthlyTrigger()
 */
function setupMonthlyTrigger() {
  removeTriggerByHandler_('sendScheduledReport_monthly');
  ScriptApp.newTrigger('sendScheduledReport_monthly')
    .timeBased()
    .onMonthDay(1)
    .atHour(8)
    .create();
  Logger.log('Monthly 1st-of-month 8am trigger set.');
}

function removeMonthlyTrigger() {
  removeTriggerByHandler_('sendScheduledReport_monthly');
  Logger.log('Monthly trigger removed.');
}

/**
 * Set up the Season Summary trigger — fires Nov 15 at 8am.
 * Uses a monthly-on-15th trigger; handler checks for November.
 * Run once from Script Editor: Run → setupSeasonSummaryTrigger()
 */
function setupSeasonSummaryTrigger() {
  removeTriggerByHandler_('checkSeasonSummary');
  ScriptApp.newTrigger('checkSeasonSummary')
    .timeBased()
    .onMonthDay(15)
    .atHour(8)
    .create();
  Logger.log('Season Summary trigger set (fires monthly on 15th; sends only in November).');
}

function removeSeasonSummaryTrigger() {
  removeTriggerByHandler_('checkSeasonSummary');
  Logger.log('Season Summary trigger removed.');
}

/**
 * BiWeekly scheduled send — last 10 rounds (ROUND_WINDOWS[1]).
 * Called automatically by the biweekly trigger.
 */
function sendScheduledReport_biweekly() {
  const ss  = SpreadsheetApp.getActive();
  const hi  = parseFloat(getSettings_(ss.getSheetByName(SETTINGS))['Handicap_Index'] || 20);
  sendCombinedReport_(ss, [10], hi);
}

/**
 * Monthly scheduled send — last 20 rounds (ROUND_WINDOWS[2]).
 * Called automatically by the monthly trigger.
 */
function sendScheduledReport_monthly() {
  const ss  = SpreadsheetApp.getActive();
  const hi  = parseFloat(getSettings_(ss.getSheetByName(SETTINGS))['Handicap_Index'] || 20);
  sendCombinedReport_(ss, [20], hi);
}

/**
 * Season Summary — fires monthly on the 15th; only sends in November.
 * Covers all rounds in the Diagnostics tab (full season).
 */
function checkSeasonSummary() {
  if (new Date().getMonth() !== 10) return;  // 10 = November (0-indexed)
  const ss      = SpreadsheetApp.getActive();
  const diagSh  = ss.getSheetByName(DIAGNOSTICS);
  if (!diagSh || diagSh.getLastRow() < 2) return;

  const settingsSh = ss.getSheetByName(SETTINGS);
  const settings   = getSettings_(settingsSh);
  const hi         = parseFloat(settings['Handicap_Index'] || 20);
  const homeCourse = String(settings['Home Course'] || 'Mt. Paul').trim();

  const headers  = diagnosticsHeader_();
  const numRows  = diagSh.getLastRow() - 1;
  const raw      = diagSh.getRange(2, 1, numRows, headers.length).getValues();
  const allRounds = raw.map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });

  if (allRounds.length === 0) return;

  const sectionHtml = buildReportSectionHtml_(allRounds, hi, homeCourse, allRounds.length);
  const year        = new Date().getFullYear();

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body     { font-family: Arial, sans-serif; color: #222; background: #f4f7f0; margin: 0; padding: 16px; }
  .wrap    { max-width: 640px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,.12); }
  .hdr     { background: #377f09; color: #fff; padding: 18px 16px 20px; }
  .hdr h1  { margin: 0; font-size: 20px; }
  .hdr p   { margin: 4px 0 0; font-size: 12px; opacity: .85; }
  .body    { padding: 14px 12px; }
  .section-title { background: #f4f7f0; border-radius: 6px; padding: 10px 12px; margin-bottom: 16px;
                   font-size: 13px; font-weight: bold; color: #377f09; letter-spacing: .3px; }
  .ss-wrap { background: #fff; border-radius: 10px; padding: 5px; margin-bottom: 14px; }
  .ss      { width: 100%; border-collapse: separate; border-spacing: 4px; }
  .ss td   { padding: 0; vertical-align: middle; }
  .ss-card { background: #e8f3de; border-radius: 8px; padding: 10px 4px; text-align: center; }
  .ss-val  { font-size: 22px; font-weight: bold; color: #377f09; }
  .ss-lbl  { font-size: 10px; color: #555; margin-top: 3px; text-transform: uppercase; letter-spacing: .4px; }
  .ss-hero { background: #e8f3de; border-radius: 8px; padding: 14px 8px; text-align: center; vertical-align: middle; }
  .ss-big  { font-size: 34px; font-weight: bold; color: #377f09; line-height: 1; }
  .ss-sub  { font-size: 11px; color: #666; margin-top: 5px; }
  table    { border-collapse: collapse; width: 100%; font-size: 12px; }
  th       { background: #e8f3de; color: #2a5a06; text-align: center; padding: 5px 3px; font-size: 11px; white-space: nowrap; }
  th:first-child { text-align: left; padding-left: 4px; }
  td       { padding: 5px 3px; border-bottom: 1px solid #f0f0f0; text-align: center; }
  td:first-child { text-align: left; padding-left: 4px; }
  tr:last-child td { border-bottom: none; }
  .stat-tbl td:nth-child(3) { text-align: left; }
  .insight { background: #fffbe6; padding: 10px 12px; border-radius: 6px; font-size: 13px; margin-bottom: 8px; }
  .footer  { background: #f4f7f0; padding: 10px 14px; font-size: 11px; color: #888;
             text-align: center; border-top: 1px solid #e0e8d8; margin-top: 14px; }
</style>
</head>
<body>
<div class="wrap">
  <div class="hdr">
    <h1>${year} Season Summary</h1>
    <p>Full season · ${allRounds.length} rounds recorded</p>
  </div>
  <div class="body">
    ${sectionHtml}
  </div>
  <div class="footer">
    My Golf Scores · ${new Date().toLocaleDateString('en-CA')}
  </div>
</div>
</body>
</html>`;

  GmailApp.sendEmail(
    REPORT_EMAIL,
    `Golf ${year} Season Summary`,
    'Your season summary (HTML email)',
    { htmlBody: html }
  );
}

// ── Internal: remove all triggers for a named handler ─────────────────────

function removeTriggerByHandler_(handlerName) {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === handlerName)
    .forEach(t => ScriptApp.deleteTrigger(t));
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
  // Read cols 1 (Round_ID) + 16 (Pending); exclude pending 9-hole rounds
  const rows = roundsSh.getRange(2, 1, roundsSh.getLastRow() - 1, 16).getValues();
  const completedIds = rows
    .filter(r => r[15] !== 'TRUE' && r[15] !== true)
    .map(r => String(r[0]));
  return new Set(completedIds).size;
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

// ── Input sanitiser — prevents formula injection in Sheets ──────────
// Prefixes strings that start with a Sheets formula trigger character
// with an apostrophe so they are stored as plain text.
function sanitize_(v) {
  if (typeof v !== 'string') return v;
  return /^[=+\-@|%`]/.test(v) ? "'" + v : v;
}
