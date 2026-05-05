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
 *
 * Gemini key: Project Settings → Script Properties → GEMINI_API_KEY
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

// ── GET — returns rounds data or health check ──────────────────────────────

function doGet(e) {
  const action = e && e.parameter && e.parameter.action;

  if (action === 'data') {
    // Return all rounds data as JSON for Gemini context
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

  // Default: health check
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

// ── Gemini Query Handler ────────────────────────────────────────────────────

function handleGeminiQuery_(ss, question) {
  if (!question) return json_({ ok: false, error: 'No question provided.' });

  // Pull rounds data from the sheet
  const sh = ss.getSheetByName(ROUNDS);
  let context = 'No rounds have been recorded yet.';

  if (sh && sh.getLastRow() >= 2) {
    const headers = roundsHeader_();
    const raw     = sh.getRange(2, 1, sh.getLastRow() - 1, headers.length).getValues();

    // Summarise by round (group 18 rows into one round object)
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

    // Build a compact text summary for Gemini
    const lines = [];
    Object.values(byRound).forEach(r => {
      const total  = r.holes.reduce((s,h) => s + (Number(h.Score) || 0), 0);
      const net    = r.holes.reduce((s,h) => s + (Number(h.Net_Score) || 0), 0);
      const putts  = r.holes.reduce((s,h) => s + (Number(h.Putts) || 0), 0);
      const firs   = r.holes.filter(h => h.FIR === true || h.FIR === 'TRUE' || h.FIR === 1).length;
      const girs   = r.holes.filter(h => h.GIR === true || h.GIR === 'TRUE' || h.GIR === 1).length;
      const pens   = r.holes.reduce((s,h) => s + (Number(h.Penalties) || 0), 0);
      lines.push(
        `Round ${r.Date} at ${r.Course} (${r.Tees}): ` +
        `Gross ${total}, Net ${net}, Putts ${putts}, FIR ${firs}/18, GIR ${girs}/18, Penalties ${pens}`
      );
    });
    context = lines.join('\n');
  }

  // Retrieve API key from Script Properties
  const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!apiKey) return json_({ ok: false, error: 'Gemini API key not configured in Script Properties.' });

  // Call Gemini 1.5 Flash
  const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey;
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
