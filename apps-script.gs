/**
 * Golf Scores — bound Apps Script webhook
 * Schema v2 — Vertical (one row per hole)
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
 * To update later: paste new code → Deploy → Manage deployments →
 * edit → New version. URL stays the same.
 */

const ROUNDS   = 'Rounds';
const SETTINGS = 'Settings';

// ── Schema ─────────────────────────────────────────────────────────────────
//
//  Rounds tab  (one row per hole per round — 18 rows per round)
//  Round_ID | Date | Course | Tees | Hole | Par | Stroke_Index |
//  Score | Putts | FIR | GIR | UD | X_UD | Penalties | Net_Score
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

// ── Setup ──────────────────────────────────────────────────────────────────

function setup() {
  const ss = SpreadsheetApp.getActive();

  ensureSheet_(ss, ROUNDS,   roundsHeader_());
  ensureSheet_(ss, SETTINGS, ['Key', 'Value']);

  const settingsSh = ss.getSheetByName(SETTINGS);
  const existing   = getSettings_(settingsSh);
  if (!existing['Home Course'])    settingsSh.appendRow(['Home Course',    'Mt. Paul']);
  if (!existing['Handicap_Index']) settingsSh.appendRow(['Handicap_Index', 20]);

  // Remove legacy tabs if they exist and are empty of data
  ['Scorecard', 'Stats'].forEach(name => {
    const sh = ss.getSheetByName(name);
    if (sh && sh.getLastRow() <= 1) ss.deleteSheet(sh);
  });

  // Remove the default Sheet1 if still present
  const sh1 = ss.getSheetByName('Sheet1');
  if (sh1 && sh1.getLastRow() === 0) ss.deleteSheet(sh1);
}

// ── Webhook ────────────────────────────────────────────────────────────────

function doPost(e) {
  try {
    const p  = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActive();

    // Self-heal: ensure tabs exist
    ensureSheet_(ss, ROUNDS,   roundsHeader_());
    ensureSheet_(ss, SETTINGS, ['Key', 'Value']);

    // Use client-supplied Round_ID (enables idempotency on retry)
    const roundId = p.roundId || Utilities.getUuid();
    const date    = p.date   || '';
    const course  = p.course || '';
    const tees    = p.tees   || '';

    // Duplicate prevention — if this Round_ID already exists, return ok without writing
    const roundsSh = ss.getSheetByName(ROUNDS);
    if (roundsSh.getLastRow() > 1) {
      const existing = roundsSh.createTextFinder(roundId).matchEntireCell(true).findAll();
      if (existing.length > 0) {
        return json_({ ok: true, roundId: roundId, duplicate: true });
      }
    }

    // Handicap from Settings (server is the source of truth)
    const settingsSh = ss.getSheetByName(SETTINGS);
    const settings   = getSettings_(settingsSh);
    const hi         = parseFloat(settings['Handicap_Index'] || 0);

    // Course Handicap = round(HI × SR / 113 + (CR − Par))
    const cr  = parseFloat(p.courseRating || 0);
    const sr  = parseFloat(p.slopeRating  || 113);
    const par = parseInt(p.par            || 0, 10);
    const ch  = (cr && sr && par)
      ? Math.round(hi * (sr / 113) + (cr - par))
      : Math.round(hi);   // fallback if ratings not supplied

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

      // Net score per hole: player gets one stroke allowance on holes
      // where strokeIndex ≤ courseHandicap (WHS method)
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

    return json_({ ok: true, roundId: roundId, courseHandicap: ch });

  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doGet() {
  return ContentService.createTextOutput('Golf webhook live. POST only.');
}

// ── Helpers ────────────────────────────────────────────────────────────────

function ensureSheet_(ss, name, header) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.appendRow(header);
    sh.getRange(1, 1, 1, header.length)
      .setFontWeight('bold')
      .setBackground('#f0f0f0');
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

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
