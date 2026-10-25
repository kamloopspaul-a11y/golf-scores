/**
 * shared.js — Golf PWA shared utilities
 * v1.2 — 2026-06-22
 *   - Added syncReportEmail_(email, sheetsUrl, webhookSecret): single
 *     source of truth for pushing the report-recipient email to Apps
 *     Script. Was duplicated in settings.html and onboarding.html —
 *     the keepalive:true write-race fix had to be applied twice because
 *     of that. Both pages now call this one function instead.
 * v1.1 — 2026-05-12
 *
 * Included by every HTML page via <script src="shared.js"></script>.
 * Provides:
 *   NAV_LINKS              — canonical 8-link footer nav array
 *   showPanel(name)        — universal panel/navigation handler
 *   renderFooterNav(el)    — writes the 4×2 nav grid into el
 *   syncReportEmail_(...)  — pushes report email to Apps Script (Script Properties)
 *
 * Auto-init: on DOMContentLoaded, renders footer nav into every
 * element that carries the [data-nav] attribute.
 *
 * ── Required CSS classes (define in each page) ───────────────────
 *
 * Footer nav (renderFooterNav output):
 *   .footer-nav-grid      — display:grid, grid-template-columns:1fr 1fr, gap:8px
 *   .fnav-btn             — no background/border, yellow, 12px, min-height 34px
 * ─────────────────────────────────────────────────────────────────
 */

'use strict';

// ── NAV LINKS ─────────────────────────────────────────────────────────────────
// Single source of truth for all footer nav links.
// Change label or order here — every page updates automatically.
const NAV_LINKS = [
  { id: 'analytics',  label: 'Analytics',  title: 'Analytics'  },
  { id: 'settings',   label: 'Settings',   title: 'Settings'   },
  { id: 'courses',    label: 'Courses',    title: 'Courses'    },
  { id: 'home',       label: 'Home',        title: 'Home'       },
];

// Filled SVG icons — yellow via currentColor, 24×24 viewBox.
// Analytics: bar chart  |  Settings: gear  |  Courses: hamburger  |  Home: house
const NAV_ICONS = {
  analytics:   '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="3" y="13" width="5" height="8" rx="1"/><rect x="9.5" y="8" width="5" height="13" rx="1"/><rect x="16" y="4" width="5" height="17" rx="1"/></svg>',
  settings:    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.57 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.21.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>',
  courses:     '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="3" y="5" width="18" height="3" rx="1.5"/><rect x="3" y="10.5" width="18" height="3" rx="1.5"/><rect x="3" y="16" width="18" height="3" rx="1.5"/></svg>',
  home:        '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>',
};

/**
 * Returns the NAV_LINKS entry for a given id, or null if not found.
 * @param {string} id
 */
function getNavEntry(id) {
  return NAV_LINKS.find(function(l) { return l.id === id; }) || null;
}

/**
 * Applies a nav entry's title to document.title and .hu-breadcrumb. Called automatically for pages with data-page-id on <body>.
 * Can also be called manually: applyPageMeta('courses') to override.
 * @param {string} id
 */
function applyPageMeta(id) {
  const entry = getNavEntry(id);
  if (!entry) return;
  const t = entry.title || entry.label;
  document.title = t;
  var crumbEl = document.querySelector('.hu-breadcrumb');
  if (crumbEl && !crumbEl.dataset.noMeta) crumbEl.textContent = t;
}

const APP_VERSION = 'v11.22';


// ── SHOW PANEL ─────────────────────────────────────────────────────────────────
/**
 * Universal panel / navigation handler.
 *
 * Pages that need to intercept a panel before the universal fallback runs
 * should assign a function to window._handlePanel:
 *
 *   window._handlePanel = function(name) {
 *     if (name === 'add-scores') { initAddScoresScreen(); showScreen('add-scores'); return true; }
 *     return false;   // false = let shared.js handle it
 *   };
 *
 * Return true to signal "handled"; return false to fall through.
 */
function showPanel(name) {
  // Page-specific override first
  if (typeof window._handlePanel === 'function') {
    if (window._handlePanel(name) === true) return;
  }

  // Universal cross-page navigation
  const page = window.location.pathname.split('/').pop() || 'index.html';

  if (name === 'settings') {
    if (page !== 'settings.html') window.location.href = 'settings.html';
    return;
  }
  if (name === 'courses') {
    if (page !== 'courses.html') window.location.href = 'courses.html';
    return;
  }
  if (name === 'home') {
    if (page !== 'index.html') window.location.href = 'index.html';
    return;
  }
  if (name === 'analytics') {
    if (page !== 'analytics.html') window.location.href = 'analytics.html';
    return;
  }
  if (name === 'add-scores') {
    if (page !== 'index.html') {
      window.location.href = 'index.html?panel=add-scores';
    } else if (typeof window._handlePanel === 'function') {
      window._handlePanel('add-scores');
    }
    return;
  }

  // Stub — panels not yet built
  const stubs = {
    'pro-tips':      'Pro Tips — coming soon',
    'penalty-rules': 'Penalty Rules — coming soon',
    'quick-rules':   'Quick Rules — coming soon',
    'game-formats':  'Game Formats — coming soon',
  };
  if (stubs[name]) alert(stubs[name]);
}


// ── RENDER FOOTER NAV ──────────────────────────────────────────────────────────
/**
 * Renders the 4×2 footer nav grid into `el`.
 * Clears any existing content first.
 * Requires .footer-nav-grid and .fnav-btn CSS on the page.
 *
 * @param {HTMLElement} el  — the footer container element
 */
function renderFooterNav(el) {
  if (!el) return;

  const grid = document.createElement('div');
  grid.className = 'footer-nav-grid';

  NAV_LINKS.forEach(link => {
    const btn = document.createElement('button');
    btn.className     = 'fnav-btn';
    btn.innerHTML = (NAV_ICONS[link.id] || '') + '<span class="fnav-label">' + link.label + '</span>';
    btn.dataset.panel = link.id;
    btn.setAttribute('aria-label', link.label);
    btn.title         = link.label;
    btn.addEventListener('click', () => showPanel(link.id));
    grid.appendChild(btn);
  });

  const ver = document.createElement('div');
  ver.className = 'footer-version';
  ver.textContent = APP_VERSION;

  el.innerHTML = '';
  el.appendChild(grid);
  el.appendChild(ver);
  markActiveFooterBtn(el);
}

// ── MARK ACTIVE FOOTER BUTTON ─────────────────────────────────────────────────
/**
 * Adds .active class to the footer button matching the current page/panel.
 * Reads data-page-id from <body> (set on settings.html, courses.html).
 * Falls back to 'home' for index.html.
 * @param {HTMLElement} el — the footer container element
 */
function markActiveFooterBtn(el) {
  var pageId = document.body && document.body.dataset.pageId;
  var activeId;
  if (pageId) {
    activeId = pageId;
  } else {
    var page = window.location.pathname.split('/').pop() || 'index.html';
    if (page === 'settings.html') activeId = 'settings';
    else if (page === 'courses.html') activeId = 'courses';
    else activeId = 'home';
  }
  el.querySelectorAll('.fnav-btn').forEach(function(btn) {
    if (btn.dataset.panel === activeId) btn.classList.add('active');
  });
}




// ── PLAYER NAME ───────────────────────────────────────────────────────────────
/**
 * Reads player name from localStorage profile (same key index.html uses).
 * Falls back to 'Paul' if not set.
 */
function getPlayerName() {
  try {
    const p = JSON.parse(localStorage.getItem('profile') || '{}');
    return p.name || 'Paul';
  } catch(e) { return 'Paul'; }
}

/**
 * Populates every [data-player-name] element with the player name.
 * Pass a name explicitly (e.g. from state.players[0]) or omit to
 * read fresh from localStorage.
 *
 * @param {string} [name]
 */
function renderPlayerName(name) {
  const n = name || getPlayerName();
  document.querySelectorAll('[data-player-name]').forEach(function(el) {
    el.textContent = n;
  });
}

// ── REPORT EMAIL SYNC ────────────────────────────────────────────────────────
/**
 * Single source of truth for pushing the report-recipient email to Apps
 * Script (Script Properties: REPORT_EMAIL). Called from settings.html (on
 * the email field's blur) and onboarding.html (Save & Continue) — the only
 * two places this value is ever written. Best-effort: failures are
 * swallowed silently and never block the caller's local save/redirect.
 *
 * keepalive:true lets the request survive a same-tick page navigation —
 * Settings' Save button navigates to index.html right after this fires;
 * onboarding redirects to index.html the same way.
 *
 * @param {string} email         - new report-recipient address
 * @param {string} sheetsUrl     - Apps Script /exec URL (profile.sheetsUrl)
 * @param {string} webhookSecret - profile.webhookSecret, checked server-side
 *                                 against Script Properties WEBHOOK_SECRET
 */
function syncReportEmail_(email, sheetsUrl, webhookSecret) {
  if (!sheetsUrl) {
    console.log('[syncReportEmail_] No sheetsUrl provided');
    return;
  }
  fetch(sheetsUrl, {
    method: 'POST',
    keepalive: true,
    body: JSON.stringify({ action: 'updateEmail', email: email, secret: webhookSecret || '' })
  })
    .then(function(res) { return res.json(); })
    .then(function(data) { console.log('[syncReportEmail_] Response:', data); })
    .catch(function(err) { console.log('[syncReportEmail_] Error:', err); });
}

// ── HANDICAP INDEX (World Handicap System) ────────────────────────────────────
// Single source of truth — used by analytics.html (hero + counting card) and
// index.html (Save Round line). Ported from A Bit of Bogey's hand-verified
// engine, adapted so each round uses its own course's rating/slope/par.
//   Differential = (Adjusted Gross − Course Rating) × 113 / Slope, 1 decimal
//   Adjusted Gross: net double bogey per hole (par + 2 + strokes received);
//     the first 3 rounds ever played cap at par + 5 (no index in effect yet).
//   Index = mean of the lowest 8 of the most recent 20 differentials,
//     rounded to 0.1, capped at 54.0. No 0.96 multiplier (pre-2020 system).
// Locked rule (CLAUDE.md): no index until 20 rounds — returns value null.
var HCP_ROUNDS_NEEDED = 20;
var HCP_STORE_KEY = 'handicapIndex';

function hcpNorm(t) { return String(t || '').toLowerCase().replace(/mount/g, 'mt').replace(/[^a-z0-9]/g, ''); }

// Older Rounds rows have the Hole cell date-formatted, so Sheets sends an ISO
// date instead of 1..18. Convert back to the Sheets day number (1899-12-30 = 0).
function golfHoleNumber(v) {
  if (typeof v === 'number') return v;
  var n = Number(v);
  if (isFinite(n)) return n;
  var t = Date.parse(v);
  return isNaN(t) ? NaN : Math.round((t - Date.UTC(1899, 11, 30)) / 86400000);
}

// action=data rows (one per hole) → rounds, oldest first.
function hcpRoundsFromDataRows(rows) {
  var byId = {};
  (rows || []).forEach(function(r) {
    var score = Number(r.Score), par = Number(r.Par);
    if (!r.Round_ID || !isFinite(score) || !isFinite(par)) return;
    var id = String(r.Round_ID);
    if (!byId[id]) byId[id] = { roundId: id, date: r.Date || '', course: r.Course || '', tees: r.Tees || '', holes: [] };
    var si = Number(r.Stroke_Index);
    byId[id].holes.push({ hole: golfHoleNumber(r.Hole), par: par, score: score, si: (isFinite(si) && si > 0) ? si : null });
  });
  return Object.keys(byId).map(function(k) { return byId[k]; })
    .sort(function(a, b) { return new Date(a.date) - new Date(b.date); });
}

function hcpTeeRatings(courseName, teeName, cache, gender) {
  var club = Object.keys(cache || {}).map(function(k) { return cache[k]; }).find(function(c) {
    return c && c.club_name && hcpNorm(c.club_name) === hcpNorm(courseName);
  });
  if (!club || !club.tees) return null;
  var pick = function(list) {
    return (list || []).find(function(t) { return hcpNorm(t.tee_name) === hcpNorm(teeName); });
  };
  var tee = pick(club.tees[gender]) || pick(club.tees.male);
  if (!tee || !tee.course_rating || !tee.slope_rating) return null;
  return { cr: Number(tee.course_rating), sr: Number(tee.slope_rating) };
}

function hcpStrokesReceived(ch, si) {
  if (ch === null || si === null) return 0;
  if (ch >= 0) return Math.floor(ch / 18) + (si <= ch % 18 ? 1 : 0);
  var give = -ch;
  return -(Math.floor(give / 18) + (si > 18 - (give % 18) ? 1 : 0));
}

// rounds: oldest first, each { date, course, tees (or holes[0].tees), holes:[{par, score, si}] }
// Returns { value, used:[{date, course, gross, adjusted, diff}], have, need }.
function computeHandicapIndex(rounds, cache, gender) {
  var full = (rounds || []).filter(function(r) { return r.holes && r.holes.length === 18; });
  var offset = full.length - Math.min(full.length, HCP_ROUNDS_NEEDED);
  var win = full.slice(offset).map(function(r, k) {
    var tees = r.tees || (r.holes[0] && r.holes[0].tees) || '';
    return {
      r: r,
      rating: hcpTeeRatings(r.course, tees, cache, gender),
      par: r.holes.reduce(function(s, h) { return s + (h.par || 0); }, 0),
      gross: r.holes.reduce(function(s, h) { return s + (h.score || 0); }, 0),
      established: (offset + k) >= 3
    };
  }).filter(function(w) { return w.rating; });

  if (win.length < HCP_ROUNDS_NEEDED) return { value: null, used: [], have: win.length, need: HCP_ROUNDS_NEEDED };

  function differentials(index) {
    return win.map(function(w) {
      var cr = w.rating.cr, sr = w.rating.sr;
      var ch = index === null ? null : Math.round(index * (sr / 113) + (cr - w.par));
      var ags = w.r.holes.reduce(function(sum, h) {
        if (!w.established) return sum + Math.min(h.score, h.par + 5);
        if (ch === null || h.si == null) return sum + h.score;
        var strokes = hcpStrokesReceived(ch, h.si);
        var cap = (ch > 54 && strokes >= 4) ? h.par + 5 : h.par + 2 + strokes;
        return sum + Math.min(h.score, cap);
      }, 0);
      return { date: w.r.date, course: w.r.course, gross: w.gross, adjusted: ags,
               diff: Math.round(((ags - cr) * 113 / sr) * 10) / 10 };
    });
  }
  function indexFrom(list) {
    var low = list.slice().sort(function(a, b) { return a.diff - b.diff; }).slice(0, 8);
    var mean = low.reduce(function(s, d) { return s + d.diff; }, 0) / low.length;
    return { value: Math.min(54, Math.round(mean * 10) / 10), used: low };
  }
  // Differentials need a Course Handicap, which needs the index: seed with
  // unadjusted scores, then iterate to a fixed point (2-3 passes in practice).
  var res = indexFrom(differentials(null));
  for (var i = 0; i < 6; i++) {
    var next = indexFrom(differentials(res.value));
    if (next.value === res.value) { res = next; break; }
    res = next;
  }
  res.have = win.length; res.need = HCP_ROUNDS_NEEDED;
  return res;
}

function hcpCourseCache() {
  try { return JSON.parse(localStorage.getItem('courseCache') || '{}') || {}; } catch (e) { return {}; }
}
function hcpGender(profile) { return /^ladies/.test((profile && profile.homeTees) || '') ? 'female' : 'male'; }

// Last calculated index, remembered on this device so the Save Round line
// has a real figure even when posting offline.
function saveLatestHandicap(value) {
  if (value == null) return;
  try { localStorage.setItem(HCP_STORE_KEY, JSON.stringify({ value: value, at: new Date().toISOString() })); } catch (e) {}
}
function getLatestHandicap() {
  try { var v = JSON.parse(localStorage.getItem(HCP_STORE_KEY) || 'null'); return v && typeof v.value === 'number' ? v.value : null; }
  catch (e) { return null; }
}

// ── AUTO-INIT ──────────────────────────────────────────────────────────────────
// Render footer nav into every [data-nav] element once the DOM is ready.
// Usage in HTML: <div class="footer" data-nav></div>
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('[data-nav]').forEach(function (el) {
    renderFooterNav(el);
  });
  renderPlayerName();
  // Auto-apply page meta (title + breadcrumb) if body carries data-page-id
  var pageId = document.body && document.body.dataset.pageId;
  if (pageId) applyPageMeta(pageId);
});
