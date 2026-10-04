// Full-bleed photograph with parallax and a text panel. Reused by "The Problem".
import { html } from '../../ui.js';
import { photo, credit } from './media.js';
import { parallax } from '../motion.js';

export function render({ ph, eyebrow, title, body, extra = '', right = false, id = '' }) {
  return html`
    <section class="cine ${right ? 'right' : ''}" ${id ? html`id="${id}"` : ''}>
      <div class="cine-media">${photo(ph)}</div>
      <div class="wrap"><div class="cine-copy on-dark">
        <p class="eyebrow" data-reveal>${eyebrow}</p>
        <h2 data-reveal style="--d:100ms">${title}</h2>
        <p class="lede" data-reveal style="--d:200ms">${body}</p>
        ${extra}
      </div></div>
      <figcaption>${ph?.alt}. ${credit(ph)}</figcaption>
    </section>`;
}

export function enhance(section) {
  parallax(section.querySelector('.cine-media'), section, 0.16);
}
