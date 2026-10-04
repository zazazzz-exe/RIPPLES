// Headline numbers, counted live from the sample dataset; they count up once
// when the band scrolls into view.
import { html } from '../../ui.js';
import { IMPACT } from '../copy.js';
import { countUp, onceVisible } from '../motion.js';

export function render(vm) {
  const s = vm.stats;
  const items = [
    [s.projects, 'Projects tracked'],
    [s.cities, 'Cities on the map'],
    [s.island_groups, 'Island groups covered'],
    [s.evidence, 'Evidence records'],
    [s.needs_attention, 'Projects needing verification or follow-up', 'attn'],
  ];
  return html`
    <section class="section dark on-dark" id="impact" aria-labelledby="impTitle">
      <div class="wrap">
        <p class="eyebrow" data-reveal>${IMPACT.eyebrow}</p>
        <h2 id="impTitle" data-reveal style="--d:80ms;max-width:20ch">${IMPACT.title}</h2>
        <p class="lede" data-reveal style="--d:160ms">${IMPACT.lede}</p>
        <div class="impact">${items.map(([n, label, cls]) => html`<div class="${cls || ''}"><b data-count="${n}">0</b><span>${label}</span></div>`)}</div>
        <p class="sample-note" style="margin-top:16px">Sample data · as of ${vm.asOfLabel}</p>
      </div>
    </section>`;
}

export function enhance(root) {
  const band = root.querySelector('#impact .impact');
  onceVisible(band, () => band.querySelectorAll('[data-count]').forEach((el, i) => setTimeout(() => countUp(el, Number(el.dataset.count)), i * 120)));
}
