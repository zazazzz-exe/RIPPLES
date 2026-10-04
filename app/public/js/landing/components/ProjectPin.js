// Map markers rendered as real <button>s (focusable, labelled) over the SVG map.
import { html, raw } from '../../ui.js';
import { STATUS, STATUSES } from '../model.js';
import { pinBody, pinGlyph } from './icons.js';

const COLOR = {
  planned: '#5b6b82', ongoing: '#1f5fa8', completed: '#18794e', delayed: '#a85a07', incomplete: '#7a3e9d', verify: '#c8102e',
};
export const statusColor = (key) => COLOR[key];
const ATTENTION = new Set(['delayed', 'incomplete', 'verify']);

export function pin(p) {
  const s = STATUS[p.status_key];
  return html`<button class="pin st-${p.status_key} ${ATTENTION.has(p.status_key) ? 'attn' : ''}" type="button" data-pid="${p.id}"
    aria-label="${p.name}, ${p.city.name}: ${s.label}, ${p.progress}% progress">
    <span class="mk">${pinBody(COLOR[p.status_key])}${pinGlyph(p.status_key)}</span><span class="lbl">${p.name}</span></button>`;
}

// City cluster: a ring split by status share, with the number of projects.
export function cluster(city, ci, projects) {
  const mine = projects.filter((p) => p.ci === ci);
  const total = mine.length;
  let offset = 0;
  const C = 2 * Math.PI * 17;
  const arcs = STATUSES.map((s) => {
    const n = mine.filter((p) => p.status_key === s.key).length;
    if (!n) return '';
    const len = (n / total) * C;
    const a = `<circle cx="20" cy="20" r="17" fill="none" stroke="${COLOR[s.key]}" stroke-width="4" stroke-dasharray="${len.toFixed(2)} ${(C - len).toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}"/>`;
    offset += len;
    return a;
  }).join('');
  const attn = mine.filter((p) => ATTENTION.has(p.status_key)).length;
  return html`<button class="cluster ${city.pilot ? 'pilot' : ''}" type="button" data-ci="${ci}"
    aria-label="${city.name}: ${total} projects, ${attn} need attention. Open city.">
    <span class="dot">${raw(`<svg viewBox="0 0 40 40" aria-hidden="true">${arcs}</svg>`)}${total}</span><span class="name">${city.name.replace(' City', '')}</span></button>`;
}
