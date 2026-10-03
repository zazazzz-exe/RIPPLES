// Shared UI for the Scorecard, Simulate and Assistant pages: safe HTML
// templating, the app shell (styled like the 3D explorer's HUD), badges, toast.

class Raw { constructor(s) { this.s = s; } }
export const raw = (s) => new Raw(s);

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ESC[c]);

function toStr(v) {
  if (v == null || v === false) return '';
  if (v instanceof Raw) return v.s;
  if (Array.isArray(v)) return v.map(toStr).join('');
  return esc(v);
}

// Tagged template: interpolations are escaped unless wrapped in raw() or html``.
export function html(strings, ...vals) {
  return raw(strings.reduce((out, s, i) => out + s + (i < vals.length ? toStr(vals[i]) : ''), ''));
}

export function mount(el, content) {
  const node = typeof el === 'string' ? document.querySelector(el) : el;
  node.innerHTML = toStr(content);
  return node;
}

export const $ = (sel, root = document) => root.querySelector(sel);
const cls = (s) => String(s || '').replace(/\s+/g, '-');

export const riskBadge = (level) => html`<span class="badge risk risk-${level}">${level}</span>`;
export const statusBadge = (status) => html`<span class="badge st-${cls(status)}">${status}</span>`;
export const gapBadge = (gap) => (gap ? html`<span class="badge gap-${cls(gap)}">${gap}</span>` : '');
export const stateBadge = (state) => html`<span class="badge state-${state}">${state}</span>`;
export const pct = (v) => (v == null ? '—' : `${v}%`);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const month = (ym) => (ym ? `${MONTHS[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}` : '—');

let toastTimer;
export function toast(message) {
  let t = $('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.append(t); }
  t.textContent = message;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 4200);
}

export function showError(el, err) {
  mount(el, html`<p class="error">Could not load: ${err.message}</p>`);
}

const ICONS = {
  map: '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>',
  ops: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  sim: '<path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0M5 9c2-5 9-6 12-3M19 15c-2 5-9 6-12 3"/>',
  chat: '<path d="M4 5h16v11H9l-5 4V5Z"/><path d="M8 9h8M8 12h5"/>',
};
const icon = (k) => raw(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[k]}</svg>`);

const NAV = [
  ['map', '/', '3D Map'],
  ['ops', '/ops', 'Scorecard'],
  ['sim', '/simulate', 'Simulate'],
  ['chat', '/assistant', 'Assistant'],
];

// The explorer's brand mark (sun with a red core).
const BRAND = raw('<svg viewBox="0 0 40 40" aria-hidden="true"><g fill="none" stroke="#ffcf4a" stroke-width="1.6"><circle cx="20" cy="20" r="6.5"/><path d="M20 4v6M20 30v6M4 20h6M30 20h6M8.7 8.7l4.2 4.2M27.1 27.1l4.2 4.2M8.7 31.3l4.2-4.2M27.1 12.9l4.2-4.2"/></g><circle cx="20" cy="20" r="2.2" fill="#ff2e4a"/></svg>');

// Renders banners, top bar, side nav and bottom tab bar.
export function initShell(active, { simulation = null } = {}) {
  const links = NAV.map(([k, href, label]) => html`<a href="${href}" ${raw(k === active ? 'aria-current="page"' : '')}>${icon(k)}<span>${label}</span></a>`);
  mount('#chrome', html`
    <div class="banner"><b>SAMPLE DATA</b><span>Real city names, sample records. For live warnings follow <a href="https://www.pagasa.dost.gov.ph" target="_blank" rel="noopener">PAGASA</a> and <a href="https://ndrrmc.gov.ph" target="_blank" rel="noopener">NDRRMC</a>.</span></div>
    ${simulation ? html`<div class="banner sim" role="status"><b>DEMO MODE</b><span>Simulated typhoon. Not a real advisory.</span><a href="/simulate">Manage</a></div>` : ''}
    <header class="topbar">
      <a class="brand" href="/">${BRAND}<span>RIPPLES<small>Climate defense map</small></span></a>
      <div class="spacer"></div>
      <a class="to-map" href="/">Open 3D map ›</a>
    </header>`);
  mount('#navs', html`
    <nav class="nav" aria-label="Main">${links}<div class="nav-foot">Sample data · as of Oct 2026</div></nav>
    <nav class="tabbar" aria-label="Main">${links}</nav>`);
}

// One-time-confirm button: first click arms it, second click runs the action.
export function confirmButton(btn, label, action) {
  let armed = false;
  const original = btn.textContent;
  btn.addEventListener('click', async () => {
    if (!armed) { armed = true; btn.textContent = label; setTimeout(() => { armed = false; btn.textContent = original; }, 3000); return; }
    armed = false; btn.textContent = original; await action();
  });
}
