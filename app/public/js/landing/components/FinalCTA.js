// Closing scene: wide photograph, three-line message, and a cinematic exit
// into the full 3D explorer.
import { html } from '../../ui.js';
import { FINAL } from '../copy.js';
import { photo, credit } from './media.js';
import { arrowRight } from './icons.js';
import { parallax, reduced } from '../motion.js';

export function render(vm) {
  const ph = vm.photos['community-legazpi-sunrise'];
  return html`
    <section class="final" id="final" aria-labelledby="finalTitle">
      <div class="final-media">${photo(ph)}</div>
      <div class="wrap">
        <h2 id="finalTitle">${FINAL.title.map((t, i) => html`<span data-reveal style="--d:${i * 220}ms">${t}</span>`)}</h2>
        <a class="btn btn-light" href="/map" data-act="exit" data-reveal style="--d:700ms">${FINAL.cta} ${arrowRight()}</a>
      </div>
      <figcaption>${ph?.alt}. ${credit(ph)}</figcaption>
    </section>
    <div class="exit-veil" aria-hidden="true"></div>`;
}

export function enhance(root) {
  const sec = root.querySelector('#final');
  parallax(sec.querySelector('.final-media'), sec, 0.14);
  const veil = root.querySelector('.exit-veil');
  sec.querySelector('[data-act="exit"]').addEventListener('click', (e) => {
    if (reduced || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    const href = e.currentTarget.href;
    sec.querySelector('.final-media img').animate([{ transform: 'scale(1)' }, { transform: 'scale(1.12)' }], { duration: 700, easing: 'cubic-bezier(.22,.8,.2,1)', fill: 'forwards' });
    veil.classList.add('on');
    setTimeout(() => { location.href = href; }, 650);
  });
  // Coming back with the browser Back button restores the page without the veil.
  addEventListener('pageshow', () => veil.classList.remove('on'));
}
