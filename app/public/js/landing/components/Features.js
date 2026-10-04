// Feature cards, each linking to the real feature.
import { html } from '../../ui.js';
import { FEATURES } from '../copy.js';
import { featureIcon, arrowRight } from './icons.js';

export function render() {
  return html`
    <section class="section alt" id="features" aria-labelledby="featTitle">
      <div class="wrap">
        <p class="eyebrow" data-reveal>Features</p>
        <h2 id="featTitle" data-reveal style="--d:80ms;max-width:20ch">Everything you need to follow a project.</h2>
        <div class="features">
          ${FEATURES.map((f, i) => html`<a class="feature ${f.highlight ? 'highlight' : ''}" href="${f.href}" data-reveal style="--d:${(i % 3) * 90}ms" ${f.href === '#map' ? html`data-act="map"` : ''}>
            <span class="ic">${featureIcon(f.icon)}</span><span class="go">${arrowRight()}</span>
            ${f.highlight ? html`<span class="feature-tag">Record integrity</span>` : ''}<h3>${f.title}</h3><p>${f.text}</p></a>`)}
        </div>
      </div>
    </section>`;
}

export function enhance(root, _vm, ctx) {
  root.querySelector('#features').addEventListener('click', (e) => {
    const a = e.target.closest('[data-act="map"]');
    if (a) { e.preventDefault(); ctx.goToMap(); }
  });
}
