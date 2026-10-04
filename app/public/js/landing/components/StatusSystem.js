// The six public statuses: shape + color + definition + live count.
import { html } from '../../ui.js';
import { STATUSES } from '../model.js';
import { statusChip } from './ProjectPreview.js';

export function render(vm) {
  const total = vm.projects.length;
  return html`
    <section class="section" id="status" aria-labelledby="stTitle">
      <div class="wrap">
        <p class="eyebrow" data-reveal>Project status</p>
        <h2 id="stTitle" data-reveal style="--d:80ms;max-width:22ch">Six statuses, each with a clear rule.</h2>
        <p class="lede" data-reveal style="--d:160ms">Statuses come from fixed rules based on the deadline, the reported status and the latest maintenance check, so every label can be explained. Each status has its own shape, so it never relies on color alone.</p>
        <div class="statuses">
          ${STATUSES.map((s, i) => html`<article class="status-card st-${s.key}" data-reveal style="--d:${(i % 3) * 90}ms">
            <div class="top">${statusChip(s.key)}<span class="count" aria-label="${vm.counts[s.key]} projects">${vm.counts[s.key]}</span></div>
            <p>${s.desc}</p>
            <div class="share" aria-hidden="true"><i style="--w:${((vm.counts[s.key] / total) * 100).toFixed(1)}%"></i></div>
          </article>`)}
        </div>
        <p class="sample-note" style="margin-top:16px">Counts from the Ripples dataset (${total} projects)</p>
      </div>
    </section>`;
}
