// Responsive photo markup from credits.json entries, plus the credit line
// required by the photos' licenses.
import { html } from '../../ui.js';

const BASE = '/img/landing/';

// p: a credits.json entry (landing photos) or a project reference photo (pass base '/img/projects/').
export function photo(p, { sizes = '100vw', eager = false, cls = '', alt, base = BASE } = {}) {
  if (!p) return '';
  return html`<img class="${cls}" src="${base}${p.file}" srcset="${base}${p.small} 800w, ${base}${p.file} ${p.width}w" sizes="${sizes}"
    width="${p.width}" height="${p.height}" alt="${alt ?? p.alt}" ${eager ? html`fetchpriority="high"` : html`loading="lazy"`} decoding="async">`;
}

export const credit = (p) => (p ? `Photo: ${p.author || 'Unknown'} · ${p.license} · Wikimedia Commons` : '');
