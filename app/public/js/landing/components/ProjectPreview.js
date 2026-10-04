// Small preview card shown on hover/focus (desktop) or first tap (touch).
import { html, mount } from '../../ui.js';
import { STATUS } from '../model.js';
import { statusIcon } from './icons.js';

export const statusChip = (key) => html`<span class="chip st-${key}">${statusIcon(key)}${STATUS[key].label}</span>`;
export const progressBar = (p, key) => html`<div class="progress st-${key}" aria-label="${p}% complete"><div class="track"><div class="fill" style="--p:${p}%"></div></div>${p}%</div>`;

export function createPreview(stage) {
  const el = document.createElement('div');
  el.className = 'preview';
  el.setAttribute('role', 'status');
  stage.append(el);
  let current = null;

  function place(x, y) {
    const r = stage.getBoundingClientRect();
    const w = el.offsetWidth || 280;
    const h = el.offsetHeight || 140;
    const left = Math.min(Math.max(12, x + 18), r.width - w - 12);
    const top = y - h - 24 < 70 ? y + 22 : y - h - 24;
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
  }

  return {
    get current() { return current; },
    showProject(p, x, y, { touch = false, onOpen } = {}) {
      current = p.id;
      mount(el, html`
        <div class="pv-k">${p.city.name} · ${p.type}</div>
        <h4>${p.name}</h4>
        <div class="pv-loc">${p.city.prov} · ${p.agency}</div>
        <div class="pv-row">${statusChip(p.status_key)}</div>
        <div style="margin-top:10px">${progressBar(p.progress, p.status_key)}</div>
        <button class="btn btn-primary btn-sm pv-open" type="button">Open project</button>`);
      el.classList.toggle('touch', touch);
      if (touch && onOpen) el.querySelector('.pv-open').onclick = onOpen;
      place(x, y);
      el.classList.add('on');
    },
    showCity(c, counts, x, y) {
      current = `city:${c.id}`;
      mount(el, html`
        <div class="pv-k">${c.prov} · ${c.region}</div>
        <h4>${c.name}</h4>
        <div class="pv-loc">${counts.total} projects · ${counts.attn} need attention</div>
        <div class="pv-row">${counts.attn ? statusChip('delayed') : statusChip('ongoing')}<span class="sample-note">Click to explore</span></div>`);
      el.classList.remove('touch');
      place(x, y);
      el.classList.add('on');
    },
    hide() { current = null; el.classList.remove('on', 'touch'); },
  };
}
