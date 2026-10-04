// Full-screen opening scene: photo with a slow drift and parallax, headline,
// and the two primary actions.
import { html } from '../../ui.js';
import { HERO } from '../copy.js';
import { photo, credit } from './media.js';
import { arrowRight } from './icons.js';
import { parallax } from '../motion.js';

export function render(vm) {
  const p = vm.photos['hero-flood-quezon-city'];
  return html`
    <header class="hero" id="top">
      <div class="hero-media">${photo(p, { eager: true })}</div>
      <div class="wrap hero-content">
        <p class="eyebrow light" data-reveal style="--d:100ms">${HERO.eyebrow}</p>
        <h1>${HERO.title.map((t, i) => html`<span data-reveal style="--d:${250 + i * 180}ms">${t}</span>`)}</h1>
        <p class="lede" data-reveal style="--d:650ms">${HERO.lede}</p>
        <div class="hero-actions" data-reveal style="--d:820ms">
          <a class="btn btn-light" href="#map" data-act="explore">${HERO.primary} ${arrowRight()}</a>
          <a class="btn btn-ghost" href="#problem">${HERO.secondary}</a>
        </div>
      </div>
      <p class="hero-meta">${p ? p.alt : ''}. ${credit(p)}</p>
      <div class="scroll-cue" aria-hidden="true">Scroll<i></i></div>
    </header>`;
}

export function enhance(root, _vm, ctx) {
  const hero = root.querySelector('.hero');
  parallax(hero.querySelector('.hero-media'), hero, 0.18);
  hero.querySelector('[data-act="explore"]').addEventListener('click', (e) => { e.preventDefault(); ctx.goToMap(); });
}
