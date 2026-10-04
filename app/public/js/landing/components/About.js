// About the platform: text, a photograph and a faint map outline.
import { html, raw } from '../../ui.js';
import { ABOUT } from '../copy.js';
import { photo, credit } from './media.js';
import { parallax } from '../motion.js';

export function render(vm) {
  const ph = vm.photos['mangrove-boardwalk'];
  return html`
    <section class="section alt" id="about" aria-labelledby="aboutTitle">
      <div class="wrap about">
        <div>
          <p class="eyebrow" data-reveal>${ABOUT.eyebrow}</p>
          <h2 id="aboutTitle" data-reveal style="--d:80ms">${ABOUT.title}</h2>
          ${ABOUT.body.map((p, i) => html`<p class="lede" data-reveal style="--d:${160 + i * 80}ms;margin-bottom:16px">${p}</p>`)}
          <div class="values">${ABOUT.values.map((v, i) => html`<div data-reveal style="--d:${i * 100}ms"><i>${v.k}</i><span><b>${v.title}</b>${v.text}</span></div>`)}</div>
        </div>
        <figure class="about-media" data-reveal="fade" style="margin:0">
          ${photo(ph, { sizes: '(max-width: 980px) 100vw, 560px' })}
          ${raw(`<svg viewBox="0 0 ${vm.mini.width} ${vm.mini.height}" aria-hidden="true"><path d="${vm.mini.land}" fill="rgba(255,255,255,.18)" stroke="rgba(255,255,255,.75)" stroke-width="1"/></svg>`)}
          <figcaption>${credit(ph)}</figcaption>
        </figure>
      </div>
    </section>`;
}

export function enhance(root) {
  const fig = root.querySelector('.about-media');
  parallax(fig.querySelector('img'), fig, 0.1);
}
