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
  return ['Round ID', 'Date', 'Hole', 'FIR', 'GIR', 'U&D', '3+ Putts'];
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
        rows.push([
          roundId, date, i + 1,
          s.fir   != null ? s.fir   : '',
          s.gir   != null ? s.gir   : '',
          s.ud    != null ? s.ud    : '',
          s.putts != null ? s.putts : ''
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
