// Landing page composition. Navbar and hero render as soon as photo credits
// load; everything else renders once the map data (/api/explore) arrives.
import { mount, html } from '../ui.js';
import { toCities } from '../explore/adapter.js';
import { orderedProjects, impactStats, statusCounts, createProjection, geoPath } from './model.js';
import { reveal, refreshScrub, reduced } from './motion.js';
import * as Navbar from './components/Navbar.js';
import * as Hero from './components/Hero.js';
import * as PhilippineMap from './components/PhilippineMap.js';
import * as EvidenceCompare from './components/EvidenceCompare.js';
import * as Problem from './components/Problem.js';
import * as HowItWorks from './components/HowItWorks.js';
import * as Features from './components/Features.js';
import * as StatusSystem from './components/StatusSystem.js';
import * as About from './components/About.js';
import * as ImpactStats from './components/ImpactStats.js';
import * as FAQ from './components/FAQ.js';
import * as FinalCTA from './components/FinalCTA.js';
import * as Footer from './components/Footer.js';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Shared actions available to every component.
const ctx = {
  goToMap({ list = false } = {}) {
    const target = ctx.map ? ctx.map.scrollTarget() : document.getElementById('m-map').offsetTop;
    scrollTo({ top: target, behavior: reduced ? 'auto' : 'smooth' });
    return new Promise((resolve) => {
      const t0 = performance.now();
      (function wait() {
        if (Math.abs(scrollY - target) < 4 || performance.now() - t0 > 2600) {
          if (list) ctx.map?.openList();
          resolve();
        } else requestAnimationFrame(wait);
      })();
    });
  },
};

// [placeholder id, component] in page order.
const SECTIONS = [
  ['m-map', PhilippineMap], ['m-evidence', EvidenceCompare], ['m-problem', Problem], ['m-how', HowItWorks],
  ['m-features', Features], ['m-status', StatusSystem], ['m-about', About], ['m-impact', ImpactStats],
  ['m-faq', FAQ], ['m-final', FinalCTA], ['m-footer', Footer],
];

async function main() {
  // Photo credits only decorate the page; never let them block it from rendering.
  const credits = await fetch('/img/landing/credits.json')
    .then((r) => { if (!r.ok) throw new Error(`credits ${r.status}`); return r.json(); })
    .catch((e) => { console.warn('[landing] photo credits unavailable:', e.message); return { photos: [] }; });
  const photos = Object.fromEntries(credits.photos.map((p) => [p.file.replace(/\.jpg$/, ''), p]));
  mount('#m-nav', Navbar.render());
  mount('#m-hero', Hero.render({ photos }));
  Hero.enhance(document, null, ctx);
  reveal();

  let geo;
  let explore;
  try {
    [geo, explore] = await Promise.all([
      fetch('/data/ph-geo.json').then((r) => r.json()),
      fetch('/api/explore').then((r) => { if (!r.ok) throw new Error(`API ${r.status}`); return r.json(); }),
    ]);
  } catch (e) {
    mount('#m-map', html`<section class="section" id="map"><div class="wrap"><h2>The map could not load</h2><p class="lede">${e.message}. Is the Ripples server running?</p></div></section>`);
    Navbar.enhance(document, null, ctx);
    return;
  }

  const cities = toCities(explore);
  const mini = createProjection({ width: 300 });
  const vm = {
    photos, credits, geo, cities,
    projects: orderedProjects(cities),
    stats: impactStats(cities),
    counts: statusCounts(cities),
    asOf: explore.as_of,
    asOfLabel: `${MONTHS[Number(explore.as_of.slice(5, 7)) - 1]} ${explore.as_of.slice(0, 4)}`,
    mini: { ...mini, land: geoPath(geo.ph, mini.project, 1.2) },
    // Unique project reference photos, for the footer credits.
    projectPhotos: [...new Map(cities.flatMap((c) => c.projects.flatMap((p) => p.media.photos)).map((ph) => [ph.file, ph])).values()],
  };

  for (const [id, C] of SECTIONS) mount(`#${id}`, C.render(vm));
  for (const [, C] of SECTIONS) C.enhance?.(document, vm, ctx);
  Navbar.enhance(document, vm, ctx);
  reveal();
  refreshScrub();

  // Other sections can ask the map to open a project.
  addEventListener('ripples:open-project', async (e) => {
    await ctx.goToMap();
    ctx.map.openProject(e.detail);
  });
}

main().then(() => { window.__ripplesLanding = 'ok'; }, (e) => { window.__ripplesLanding = 'failed'; window.ripplesLandingFailed?.(e); });
