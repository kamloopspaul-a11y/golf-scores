/**
 * shared.js — Golf PWA shared utilities
 * v1.1 — 2026-05-12
 *
 * Included by every HTML page via <script src="shared.js"></script>.
 * Provides:
 *   NAV_LINKS           — canonical 8-link footer nav array
 *   showPanel(name)     — universal panel/navigation handler
 *   renderFooterNav(el) — writes the 4×2 nav grid into el
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

const APP_VERSION = 'v10.95';


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
    'analytics':     'Analytics — coming soon',
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
