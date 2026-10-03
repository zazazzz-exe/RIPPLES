// Advisory card renderer, shared by the City Page and Ops drafts panel.
import { html } from './ui.js';

const AUDIENCES = [
  ['households', 'For households'],
  ['schools', 'For schools'],
  ['farmers', 'For farmers'],
  ['barangay_officials', 'For barangay officials'],
];

export function advisoryCard(a, { open = false, officialLine } = {}) {
  return html`
    <details class="adv" data-points="${a.hazard_points}" ${open ? html`open` : ''}>
      <summary>
        <div class="row between">
          <span class="t">${a.title}</span>
          ${a.simulated ? html`<span class="badge tag-sim">Simulated</span>` : ''}
        </div>
        <span class="small muted">${a.type} · ${a.level} · hazard +${a.hazard_points} · ${a.issued} · ${a.source}</span>
      </summary>
      <div class="body">
        ${AUDIENCES.map(([k, label]) => html`<div class="aud"><b>${label}</b><span>${a.sections[k]}</span></div>`)}
        <p class="official">${officialLine || 'Follow official warnings and evacuation orders from PAGASA and NDRRMC.'}</p>
      </div>
    </details>`;
}
