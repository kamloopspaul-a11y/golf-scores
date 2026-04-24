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
  return ['Round ID', 'Date', 'Hole', 'FIR', 'GIR', 'PLTY', 'U/D', 'X-U/D', 'Putts', 'Score'];
}

/**
 * Migrate Stats tab from the old 8-col schema
 *   [Round ID, Date, Hole, FIR, GIR, U&D, Putts, Score]
 * to the new 10-col schema
 *   [Round ID, Date, Hole, FIR, GIR, PLTY, U/D, X-U/D, Putts, Score]
 * Preserves existing data rows — new columns get blanks.
 * No-op once the header already matches the new schema.
 */
function ensureStatsSchema_(ss) {
  const sh = ss.getSheetByName(STATS);
  if (!sh || sh.getLastRow() < 1) return;
  const width = Math.max(sh.getLastColumn(), 1);
  const header = sh.getRange(1, 1, 1, width).getValues()[0];
  if (width >= 10 && header[5] === 'PLTY' && header[7] === 'X-U/D') return; // already migrated
  if (header[5] === 'U&D') {
    // Insert PLTY column at position 6 (before old U&D)
    sh.insertColumnBefore(6);
    sh.getRange(1, 6).setValue('PLTY').setFontWeight('bold').setBackground('#f0f0f0');
    // U&D shifted to col 7 — rename
    sh.getRange(1, 7).setValue('U/D');
    // Insert X-U/D column at position 8 (after U/D)
    sh.insertColumnAfter(7);
    sh.getRange(1, 8).setValue('X-U/D').setFontWeight('bold').setBackground('#f0f0f0');
  } else if (sh.getLastRow() === 1) {
    // Header is something else and no data yet — overwrite
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
      const pars    = Array.isArray(p.pars) ? p.pars : [];
      const rows = [];
      for (let i = 0; i < 18; i++) {
        const s = p.stats[i] || {};
        const strokes = holes[i];
        const putts   = (s.putts != null) ? s.putts : '';
        const score   = (strokes != null && putts !== '') ? (strokes - putts) : '';
        const fir     = s.fir  != null ? s.fir  : '';
        const gir     = s.gir  != null ? s.gir  : '';
        const plty    = s.plty != null ? s.plty : '';
        // U/D & X-U/D derived per Paul's rule:
        // Only apply when GIR was missed AND the hole was played.
        // strokes <= par  → U/D = 1, X-U/D = null
        // strokes >  par  → U/D = null, X-U/D = 1
        // GIR hit or hole unplayed → both null.
        let ud   = '';
        let xUd  = '';
        const par = pars[i];
        if (s.gir == null && strokes != null && strokes > 0 && par != null) {
          if (strokes <= par) { ud = 1; }
          else                { xUd = 1; }
        }
        rows.push([
          roundId, date, i + 1,
          fir, gir, plty, ud, xUd, putts, score
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
