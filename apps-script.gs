/**
 * Golf Scores — bound Apps Script webhook
 *
 * SETUP (one time):
 * 1. In your Google Sheet: Extensions → Apps Script
 * 2. Paste this whole file over the default Code.gs
 * 3. Save, then Run → setup() once (approve permissions)
 * 4. Deploy → New deployment → type "Web app"
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy the /exec URL → paste into index.html as SHEETS_URL
 *
 * To update the handler later: just paste new code and Deploy → Manage
 * deployments → edit → New version. URL stays the same.
 */

const SCORECARD = 'Scorecard';
const STATS     = 'Stats';
const SETTINGS  = 'Settings';

function setup() {
  const ss = SpreadsheetApp.getActive();
  ensureSheet_(ss, SCORECARD, scorecardHeader_());
  ensureSheet_(ss, STATS,    statsHeader_());
  ensureSheet_(ss, SETTINGS, ['Key', 'Value']);
  ensureStatsSchema_(ss);

  const settings = ss.getSheetByName(SETTINGS);
  if (settings.getLastRow() === 1) {
    settings.appendRow(['Home Course', 'Kamloops G&CC']);
  }

  // Remove the default empty Sheet1 if still around
  const sh1 = ss.getSheetByName('Sheet1');
  if (sh1 && sh1.getLastRow() === 0) ss.deleteSheet(sh1);
}

function scorecardHeader_() {
  const h = ['Round ID', 'Date', 'Year', 'Course', 'Tees'];
  for (let i = 1; i <= 18; i++) h.push('H' + i);
  h.push('Front', 'Back', 'Total', 'Notes');
  return h;
}

function statsHeader_() {
  return ['Round ID', 'Date', 'Hole', 'FIR', 'GIR', 'PEN', 'UD', 'X-UD', 'PUTTS', 'Score'];
}

/**
 * Migrate Stats tab to the current 10-col schema:
 *   [Round ID, Date, Hole, FIR, GIR, PEN, UD, X-UD, PUTTS, Score]
 *
 * Handles two prior shapes in place (preserves data rows):
 *   - 8-col legacy:  [Round ID, Date, Hole, FIR, GIR, U&D, Putts, Score]
 *   - 10-col interim:[Round ID, Date, Hole, FIR, GIR, PLTY, U/D, X-U/D, Putts, Score]
 *
 * No-op once the header already matches the current schema.
 */
function ensureStatsSchema_(ss) {
  const sh = ss.getSheetByName(STATS);
  if (!sh || sh.getLastRow() < 1) return;
  const width = Math.max(sh.getLastColumn(), 1);
  const header = sh.getRange(1, 1, 1, width).getValues()[0];

  // Already on current schema?
  if (width >= 10 && header[5] === 'PEN' && header[6] === 'UD' && header[7] === 'X-UD' && header[8] === 'PUTTS') {
    return;
  }

  // Interim 10-col → current: rename PLTY→PEN, U/D→UD, X-U/D→X-UD, Putts→PUTTS
  if (width >= 10 && header[5] === 'PLTY' && header[7] === 'X-U/D') {
    sh.getRange(1, 6).setValue('PEN');
    sh.getRange(1, 7).setValue('UD');
    sh.getRange(1, 8).setValue('X-UD');
    sh.getRange(1, 9).setValue('PUTTS');
    return;
  }

  // Legacy 8-col → current 10-col
  if (header[5] === 'U&D') {
    // Insert PEN at col 6 (before old U&D, which becomes UD at col 7)
    sh.insertColumnBefore(6);
    sh.getRange(1, 6).setValue('PEN').setFontWeight('bold').setBackground('#f0f0f0');
    sh.getRange(1, 7).setValue('UD');
    // Insert X-UD at col 8 (after UD)
    sh.insertColumnAfter(7);
    sh.getRange(1, 8).setValue('X-UD').setFontWeight('bold').setBackground('#f0f0f0');
    // Rename Putts → PUTTS (now at col 9)
    sh.getRange(1, 9).setValue('PUTTS');
    return;
  }

  // Header is something else and no data yet — overwrite cleanly
  if (sh.getLastRow() === 1) {
    sh.getRange(1, 1, 1, statsHeader_().length).setValues([statsHeader_()])
      .setFontWeight('bold').setBackground('#f0f0f0');
  }
}

function ensureSheet_(ss, name, header) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.appendRow(header);
    sh.getRange(1, 1, 1, header.length).setFontWeight('bold').setBackground('#f0f0f0');
    sh.setFrozenRows(1);
  }
}

function doPost(e) {
  try {
    const p = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActive();

    // Self-heal if user never ran setup()
    ensureSheet_(ss, SCORECARD, scorecardHeader_());
    ensureSheet_(ss, STATS,    statsHeader_());
    ensureStatsSchema_(ss);

    const roundId = Utilities.getUuid();
    const date    = p.date || '';
    const year    = date ? Number(date.slice(0, 4)) : '';
    const holes   = p.holes || [];
    const front   = holes.slice(0, 9).reduce((a, b) => a + (b || 0), 0);
    const back    = holes.slice(9, 18).reduce((a, b) => a + (b || 0), 0);
    const total   = front + back;

    const row = [roundId, date, year, p.course || '', p.tees || ''];
    for (let i = 0; i < 18; i++) row.push(holes[i] != null ? holes[i] : '');
    row.push(front, back, total, p.notes || '');
    ss.getSheetByName(SCORECARD).appendRow(row);

    // Stats — only write if the app sent them
    if (Array.isArray(p.stats)) {
      const statsSh = ss.getSheetByName(STATS);
      const rows = [];
      for (let i = 0; i < 18; i++) {
        const s = p.stats[i] || {};
        const strokes = holes[i];
        const putts   = (s.putts != null) ? s.putts : '';
        const score   = (strokes != null && putts !== '') ? (strokes - putts) : '';
        const fir     = s.fir != null ? s.fir : '';
        const gir     = s.gir != null ? s.gir : '';
        // Accept new 'pen' key, fall back to legacy 'plty'.
        const pen     = (s.pen != null) ? s.pen : (s.plty != null ? s.plty : '');
        const ud      = s.ud  != null ? s.ud  : '';
        // X-UD is now a manual rocker (was previously derived).
        const xUd     = s.xUd != null ? s.xUd : (s.xud != null ? s.xud : '');
        rows.push([
          roundId, date, i + 1,
          fir, gir, pen, ud, xUd, putts, score
        ]);
      }
      statsSh.getRange(statsSh.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
    }

    return json_({ ok: true, roundId: roundId });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doGet() {
  return ContentService.createTextOutput('Golf webhook live. POST only.');
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
