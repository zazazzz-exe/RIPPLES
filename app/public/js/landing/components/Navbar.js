// Sticky navigation: transparent over the hero, solid after scrolling; marks
// the section in view; mobile menu with Esc and focus handling.
import { html } from '../../ui.js';
import { arrowRight } from './icons.js';

const LINKS = [
  ['#top', 'Home'],
  ['#map', 'Explore Map', 'map'],
  ['#map', 'Projects', 'projects'],
  ['#how', 'How It Works'],
  ['#about', 'About'],
  ['#faq', 'FAQ'],
];

export function render() {
  return html`
    <nav class="nav" aria-label="Main">
      <div class="wrap">
        <a class="logo" href="#top" aria-label="Ripples home"><img class="logo-img" src="/img/brand/ripples-logo.png" srcset="/img/brand/ripples-logo.png 1x, /img/brand/ripples-logo@2x.png 2x" alt="Ripples" width="119" height="40"><small>Climate defense map</small></a>
        <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="navLinks" aria-label="Open menu"><span></span></button>
        <ul class="nav-links" id="navLinks">
          ${LINKS.map(([href, label, act]) => html`<li><a href="${href}" ${act ? html`data-act="${act}"` : ''}>${label}</a></li>`)}
          <li class="mobile-cta"><a class="btn btn-light" href="/map">Open the 3D explorer</a></li>
        </ul>
        <a class="btn btn-light nav-cta" href="/map">Explore Map ${arrowRight()}</a>
      </div>
    </nav>`;
}

export function enhance(root, _vm, ctx) {
  const nav = root.querySelector('.nav');
  const toggle = nav.querySelector('.nav-toggle');
  const links = nav.querySelector('.nav-links');

  const onScroll = () => nav.classList.toggle('scrolled', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    links.classList.toggle('open', open);
    nav.classList.toggle('menu-open', open);
    if (open) links.querySelector('a').focus();
  }
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && links.classList.contains('open')) { setMenu(false); toggle.focus(); } });

  links.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    setMenu(false);
    if (a.dataset.act === 'map' || a.dataset.act === 'projects') {
      e.preventDefault();
      ctx.goToMap({ list: a.dataset.act === 'projects' });
    }
  });

  // Highlight the section in view.
  const byId = new Map();
  links.querySelectorAll('a[href^="#"]:not([data-act="projects"])').forEach((a) => byId.set(a.getAttribute('href').slice(1), a));
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      links.querySelectorAll('a[aria-current]').forEach((a) => a.removeAttribute('aria-current'));
      byId.get(e.target.id)?.setAttribute('aria-current', 'true');
    }
  }, { rootMargin: '-45% 0px -50% 0px' });
  byId.forEach((_a, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
}
