// The interactive Philippine map, inside a pinned scroll scene.
// Scroll 0→0.55: the aerial photo dissolves and the map zooms out from Tacloban
// to the whole archipelago; 0.5: city clusters drop in; 0.58→0.82: the red route
// draws; ≥0.8: the map becomes interactive (cities → projects → detail panel).
import { html, mount } from '../../ui.js';
import { MAP, SCENE_BEATS } from '../copy.js';
import { createProjection, geoPath, pinLonLat, SPREAD, STATUSES, STATUS } from '../model.js';
import { photo, credit } from './media.js';
import { pin, cluster, statusColor } from './ProjectPin.js';
import { createPreview } from './ProjectPreview.js';
import { createDetail } from './ProjectDetail.js';
import { plusIcon, minusIcon, homeIcon, listIcon, closeIcon, statusIcon } from './icons.js';
import { scrub, tween, reduced, clamp, lerp, easeInOut } from '../motion.js';

const INTERACTIVE_AT = 0.8;
// Only drop back into the scroll scene when the user has clearly scrolled up,
// so small scroll or viewport changes never reset an open project.
const RESET_BELOW = 0.6;
const LABELS = [
  ['LUZON', 121.5, 17.6], ['VISAYAS', 122.4, 12.15], ['MINDANAO', 126.3, 8.35],
  ['Philippine Sea', 126.3, 15.2, 'sea'], ['West Philippine Sea', 117.9, 14.2, 'sea'], ['Sulu Sea', 120.1, 8.7, 'sea'], ['Celebes Sea', 123.3, 5.3, 'sea'],
];

export function render(vm) {
  const aerial = vm.photos['aerial-tacloban'];
  return html`
    <section class="map-scene" id="map" aria-label="Interactive project map">
      <div class="map-stage pmap-scene-off">
        <div class="pmap" aria-hidden="false">
          <svg viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Map of the Philippines with climate-defense projects"></svg>
          <div class="pmap-layer" data-layer="labels"></div>
          <div class="pmap-layer" data-layer="markers"></div>
        </div>
        <div class="scene-photo">${photo(aerial, { alt: aerial?.alt, eager: true })}</div>
        <div class="scene-captions" aria-hidden="true">${SCENE_BEATS.map((b) => html`<p class="${b.dark ? 'dark' : ''}">${b.text}</p>`)}</div>
        <div class="map-ui">
          <div class="map-head">
            <p class="eyebrow">Interactive map</p>
            <h2>${MAP.title}</h2>
            <p data-head-lede>${MAP.lede}</p>
            <div class="map-crumb" hidden><span>Philippines ›</span> <b data-crumb></b> <button type="button" data-act="country">Return to map</button></div>
          </div>
          <div class="map-tools">
            <button class="tool" type="button" data-act="zin" aria-label="Zoom in">${plusIcon()}</button>
            <button class="tool" type="button" data-act="zout" aria-label="Zoom out">${minusIcon()}</button>
            <button class="tool" type="button" data-act="country" aria-label="Show the whole country">${homeIcon()}</button>
            <button class="tool" type="button" data-act="list" aria-label="Browse projects as a list" aria-expanded="false">${listIcon()}</button>
          </div>
          <div class="map-legend" aria-label="Legend">
            ${STATUSES.map((s) => html`<span class="st-${s.key}" style="color:var(--c)">${statusIcon(s.key)}<span style="color:var(--ink-2)">${s.label}</span></span>`)}
            <span><i class="route-key"></i>Readiness route</span>
          </div>
          <div class="map-hint">${MAP.hint}</div>
        </div>
      </div>
      <p class="sr-only">${credit(aerial)}</p>
    </section>`;
}

export function enhance(root, vm, ctx) {
  const scene = root.querySelector('.map-scene');
  const stage = scene.querySelector('.map-stage');
  const svg = stage.querySelector('svg');
  const labelLayer = stage.querySelector('[data-layer="labels"]');
  const markerLayer = stage.querySelector('[data-layer="markers"]');
  const photoEl = stage.querySelector('.scene-photo');
  const captions = [...stage.querySelectorAll('.scene-captions p')];
  const crumb = stage.querySelector('.map-crumb');
  const headLede = stage.querySelector('[data-head-lede]');
  const { cities, projects } = vm;

  // ---------- geometry ----------
  const P = createProjection({ width: 1000 });
  const xy = (lon, lat) => P.project(lon, lat);
  const grat = (step) => {
    let d = '';
    for (let lon = 95; lon <= 150; lon += step) { const [a, b] = [xy(lon, -10), xy(lon, 35)]; d += `M${a[0].toFixed(1)} ${b[1].toFixed(1)}V${a[1].toFixed(1)}`; }
    for (let lat = -10; lat <= 35; lat += step) { const [a, b] = [xy(95, lat), xy(150, lat)]; d += `M${a[0].toFixed(1)} ${a[1].toFixed(1)}H${b[0].toFixed(1)}`; }
    return d;
  };
  const cityXY = cities.map((c) => xy(c.lon, c.lat));
  let routeD = '';
  for (let i = 0; i < cityXY.length - 1; i++) {
    const [a, b] = [cityXY[i], cityXY[i + 1]];
    const [mx, my] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
    const bend = 0.16;
    routeD += `${i ? '' : `M${a[0].toFixed(1)} ${a[1].toFixed(1)}`}Q${(mx - dy * bend).toFixed(1)} ${(my + dx * bend).toFixed(1)} ${b[0].toFixed(1)} ${b[1].toFixed(1)}`;
  }
  const land = geoPath(vm.geo.ph, xy, 0.35);
  svg.innerHTML = `
    <rect class="sea" x="-4000" y="-4000" width="9000" height="10000"/>
    <path class="grat" d="${grat(1)}"/><path class="grat major" d="${grat(5)}"/>
    <path class="nb" d="${geoPath(vm.geo.nb, xy, 0.5)}"/>
    <path d="${land}" fill="none" stroke="#c2ddd6" stroke-width="7" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
    <path class="land" d="${land}"/>
    <path class="route" d="${routeD}" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/>
    <path class="route-flow" d="${routeD}" style="opacity:0"/>`;
  const routeEl = svg.querySelector('.route');
  const flowEl = svg.querySelector('.route-flow');

  // ---------- overlays (HTML, constant screen size) ----------
  const overlays = [];
  const addOverlay = (el, mx, my, kind) => { overlays.push({ el, mx, my, kind }); return el; };
  const frag = (markup) => { const t = document.createElement('template'); mount(t, markup); return t.content.firstElementChild; };
  for (const [text, lon, lat, cls] of LABELS) {
    const el = document.createElement('div');
    el.className = `geo-label ${cls || ''}`;
    el.textContent = text;
    labelLayer.append(addOverlay(el, ...xy(lon, lat), cls === 'sea' ? 'sea' : 'region'));
  }
  cities.forEach((c, ci) => {
    c.evac.forEach((e) => {
      const el = document.createElement('div');
      el.className = 'evac-mk';
      markerLayer.append(addOverlay(el, ...xy(c.lon + e[2] * SPREAD, c.lat + e[3] * SPREAD), 'evac'));
    });
  });
  projects.forEach((p) => markerLayer.append(addOverlay(frag(pin(p)), ...xy(...pinLonLat(p.city, p)), 'pin')));
  cities.forEach((c, ci) => {
    const el = frag(cluster(c, ci, projects));
    // Put the name on the left when another city sits just to the east.
    if (cities.some((o) => o !== c && Math.abs(o.lat - c.lat) < 0.8 && o.lon > c.lon && o.lon - c.lon < 2.6)) el.classList.add('left');
    markerLayer.append(addOverlay(el, ...cityXY[ci], 'cluster'));
  });
  overlays.forEach((o, i) => { o.el.style.setProperty('--d', `${(i % 12) * 60}ms`); });

  // ---------- view box ----------
  let SW = 1;
  let SH = 1;
  let vb = { x: 0, y: 0, w: 1000, h: 1000 };
  const narrow = () => SW < 760;
  const rectAt = (px, py, w, fx = 0.5, fy = 0.5) => { const h = (w * SH) / SW; return { x: px - fx * w, y: py - fy * h, w, h }; };
  function countryRect() {
    const pad = narrow() ? 1.06 : 1.12;
    const w = Math.max(P.width * pad, (P.height * pad * SW) / SH);
    const fx = narrow() ? 0.5 : 0.6;
    return rectAt(P.width / 2, P.height / 2 + (narrow() ? 30 : 0), w, fx, 0.5);
  }
  const startRect = () => rectAt(...xy(124.9, 11.2), narrow() ? 110 : 150);
  const cityRect = (ci) => rectAt(...cityXY[ci], narrow() ? 64 : 82, narrow() ? 0.5 : 0.56, narrow() ? 0.46 : 0.52);
  const projectRect = (p) => rectAt(...xy(...pinLonLat(p.city, p)), narrow() ? 48 : 60, narrow() ? 0.5 : 0.33, narrow() ? 0.16 : 0.5);
  const interp = (a, b, k, lift = 0) => {
    const w = Math.exp(lerp(Math.log(a.w), Math.log(b.w), k)) * (1 + lift * Math.sin(Math.PI * k));
    const cx = lerp(a.x + a.w / 2, b.x + b.w / 2, k);
    const cy = lerp(a.y + a.h / 2, b.y + b.h / 2, k);
    return rectAt(cx, cy, w);
  };

  function place() {
    const z = vb.w;
    const showPins = z < 330;
    const showClusters = z > 250;
    stage.classList.toggle('zoomed', showPins);
    for (const o of overlays) {
      let on = true;
      if (o.kind === 'pin' || o.kind === 'evac') on = showPins;
      else if (o.kind === 'cluster') on = showClusters && clustersShown;
      else if (o.kind === 'region') on = z > 300;
      else if (o.kind === 'sea') on = z > 500;
      const x = ((o.mx - vb.x) / vb.w) * SW;
      const y = ((o.my - vb.y) / vb.h) * SH;
      if (on && (x < -80 || x > SW + 80 || y < -80 || y > SH + 80)) on = false;
      if (o.on !== on) { o.el.style.display = on ? '' : 'none'; o.on = on; }
      if (on) o.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    }
    stage.querySelector('.pmap').classList.toggle('show-pin-labels', z < 70);
  }
  function setVB(r) {
    vb = r;
    svg.setAttribute('viewBox', `${r.x.toFixed(2)} ${r.y.toFixed(2)} ${r.w.toFixed(2)} ${r.h.toFixed(2)}`);
    place();
  }
  function flyTo(target, { dur = 1200, lift = 0 } = {}) {
    const from = vb;
    return tween({ from: [0], to: [1], dur, key: 'vb', onUpdate: ([k]) => setVB(interp(from, target, k, lift)) });
  }
  function measure() {
    SW = stage.clientWidth || innerWidth;
    SH = stage.clientHeight || innerHeight;
  }

  // ---------- state ----------
  let mode = 'scene'; // scene | country | city | project
  let clustersShown = false;
  let cur = { ci: -1, pid: null };
  let sceneK = 0;
  const preview = createPreview(stage);
  const idx = (pid) => projects.findIndex((p) => p.id === pid);
  const detail = createDetail(stage, {
    photos: vm.photos, asOf: vm.asOf,
    onPrev: () => step(-1), onNext: () => step(1), onReturn: () => toCountry(), onClose: () => toCity(cur.ci),
  });
  const list = buildList();

  function setMode(m) {
    mode = m;
    stage.dataset.mode = m;
    stage.classList.toggle('pmap-scene-off', m === 'scene');
    stage.querySelector('.pmap').classList.toggle('interactive', m !== 'scene');
    crumb.hidden = !(m === 'city' || m === 'project');
    headLede.hidden = m === 'city' || m === 'project';
    if (cur.ci >= 0) crumb.querySelector('[data-crumb]').textContent = cities[cur.ci].name;
    markerLayer.querySelectorAll('.pin.active').forEach((el) => el.classList.remove('active'));
    if (m === 'project') markerLayer.querySelector(`.pin[data-pid="${cur.pid}"]`)?.classList.add('active');
  }
  function toCountry() {
    detail.close(); list.close(); preview.hide();
    cur = { ci: -1, pid: null };
    setMode('country');
    return flyTo(countryRect(), { dur: 1100 });
  }
  function toCity(ci) {
    detail.close(); preview.hide();
    const far = cur.ci >= 0 && cur.ci !== ci;
    cur = { ci, pid: null };
    setMode('city');
    return flyTo(cityRect(ci), { dur: far ? 1700 : 1200, lift: far ? 2.5 : 0 });
  }
  async function openProject(pid) {
    const p = projects[idx(pid)];
    if (!p) return;
    if (mode === 'scene') await ctx.goToMap();
    preview.hide(); list.close();
    const far = cur.ci !== p.ci && cur.ci >= 0;
    cur = { ci: p.ci, pid };
    setMode('project');
    const n = projects.length;
    const i = idx(pid);
    detail.open(p, projects[(i - 1 + n) % n], projects[(i + 1) % n]);
    await flyTo(projectRect(p), { dur: far ? 1800 : 1100, lift: far ? 3 : 0 });
  }
  function step(d) {
    const i = cur.pid ? idx(cur.pid) : -1;
    const n = projects.length;
    openProject(projects[(i + d + n) % n].id);
  }

  // ---------- list panel ----------
  function buildList() {
    const el = document.createElement('aside');
    el.className = 'plist';
    el.setAttribute('aria-label', 'All projects');
    mount(el, html`
      <header><h3>All projects</h3><button class="tool" type="button" data-act="close-list" aria-label="Close list">${closeIcon()}</button></header>
      <div class="scroll">${cities.map((c, ci) => html`
        <h4>${c.name}</h4>
        ${projects.filter((p) => p.ci === ci).map((p) => html`
          <button class="row" type="button" data-pid="${p.id}"><b>${p.name}</b><span class="chip st-${p.status_key}" style="grid-row:span 2;align-self:center">${statusIcon(p.status_key)}${STATUS[p.status_key].label}</span><span>${p.type} · ${p.progress}%</span></button>`)}`)}
      </div>`);
    stage.append(el);
    const btn = stage.querySelector('[data-act="list"]');
    return {
      open() { el.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); el.querySelector('button.row')?.focus({ preventScroll: true }); },
      close() { el.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); },
      toggle() { el.classList.contains('open') ? this.close() : this.open(); },
    };
  }

  // ---------- input ----------
  let lastPointer = 'mouse';
  stage.addEventListener('pointerdown', (e) => { lastPointer = e.pointerType; }, true);
  stage.addEventListener('click', (e) => {
    if (mode === 'scene') return;
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'country') return void toCountry();
    if (act === 'list') return void list.toggle();
    if (act === 'close-list') return void list.close();
    if (act === 'zin' || act === 'zout') {
      const f = act === 'zin' ? 0.6 : 1.6;
      const w = clamp(vb.w * f, 18, countryRect().w * 1.2);
      return void flyTo(rectAt(vb.x + vb.w / 2, vb.y + vb.h / 2, w), { dur: 450 });
    }
    const row = e.target.closest('.plist [data-pid]');
    if (row) return void openProject(row.dataset.pid);
    const c = e.target.closest('.cluster');
    if (c) return void toCity(Number(c.dataset.ci));
    const pn = e.target.closest('.pin');
    if (pn) {
      const p = projects[idx(pn.dataset.pid)];
      if (lastPointer === 'touch' && preview.current !== p.id) {
        const r = pn.getBoundingClientRect();
        const s = stage.getBoundingClientRect();
        preview.showProject(p, r.left - s.left, r.top - s.top, { touch: true, onOpen: () => openProject(p.id) });
        markerLayer.querySelectorAll('.pin.hot').forEach((x) => x.classList.remove('hot'));
        pn.classList.add('hot');
        return;
      }
      openProject(p.id);
    }
  });
  function hoverFor(el) {
    const s = stage.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    if (el.classList.contains('pin')) preview.showProject(projects[idx(el.dataset.pid)], r.left - s.left, r.top - s.top - 30);
    else {
      const ci = Number(el.dataset.ci);
      const mine = projects.filter((p) => p.ci === ci);
      preview.showCity(cities[ci], { total: mine.length, attn: mine.filter((p) => ['delayed', 'incomplete', 'verify'].includes(p.status_key)).length }, r.left - s.left, r.top - s.top);
    }
  }
  markerLayer.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse' || mode === 'scene') return;
    const el = e.target.closest('.pin, .cluster');
    if (el && !(el.classList.contains('pin') && el.dataset.pid === cur.pid && detail.isOpen)) hoverFor(el);
  });
  markerLayer.addEventListener('pointerout', (e) => { if (e.pointerType === 'mouse' && e.target.closest('.pin, .cluster') && !e.relatedTarget?.closest?.('.pin, .cluster')) preview.hide(); });
  markerLayer.addEventListener('focusin', (e) => { const el = e.target.closest('.pin, .cluster'); if (el && mode !== 'scene') hoverFor(el); });
  markerLayer.addEventListener('focusout', () => preview.hide());

  // Mouse drag pans the map (touch keeps native page scrolling).
  let drag = null;
  svg.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || mode === 'scene') return;
    drag = { x: e.clientX, y: e.clientY, vb };
    svg.setPointerCapture(e.pointerId);
  });
  svg.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const k = drag.vb.w / SW;
    setVB({ ...drag.vb, x: drag.vb.x - (e.clientX - drag.x) * k, y: drag.vb.y - (e.clientY - drag.y) * k });
  });
  svg.addEventListener('pointerup', () => { drag = null; });

  addEventListener('keydown', (e) => {
    if (mode === 'scene' || e.target.matches?.('input, textarea, select')) return;
    const inMap = stage.contains(document.activeElement) || detail.isOpen;
    if (!inMap) return;
    if (e.key === 'Escape') {
      if (list && stage.querySelector('.plist.open')) list.close();
      else if (mode === 'project') toCity(cur.ci);
      else if (mode === 'city') toCountry();
    } else if (mode === 'project' && e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    else if (mode === 'project' && e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
  });

  // ---------- scroll scene ----------
  function sceneFrame(k) {
    sceneK = k;
    if (k < RESET_BELOW && mode !== 'scene') {
      detail.close(); list.close(); preview.hide();
      cur = { ci: -1, pid: null };
      setMode('scene');
    }
    if (mode === 'scene') setVB(interp(startRect(), countryRect(), easeInOut(clamp(k / 0.55))));
    const pk = clamp(k / 0.3);
    photoEl.style.opacity = String(1 - easeInOut(pk));
    photoEl.style.transform = `scale(${(1 + 0.22 * pk).toFixed(3)})`;
    photoEl.style.setProperty('--wash', String(0.2 + 0.5 * pk));
    const beat = k < INTERACTIVE_AT ? SCENE_BEATS.reduce((a, b, i) => (k >= b.at ? i : a), -1) : -1;
    captions.forEach((c, i) => c.classList.toggle('on', i === beat));
    const show = k > 0.48;
    if (show !== clustersShown) {
      clustersShown = show;
      markerLayer.querySelectorAll('.cluster').forEach((el) => el.classList.toggle('pin-drop', show));
      place();
    }
    routeEl.style.strokeDashoffset = String(1 - clamp((k - 0.58) / 0.24));
    flowEl.style.opacity = k > 0.82 ? '0.7' : '0';
    if (k >= INTERACTIVE_AT && mode === 'scene') setMode('country');
  }

  measure();
  setVB(startRect());
  if (reduced) {
    sceneFrame(1);
    setVB(countryRect());
  } else {
    scrub(scene, sceneFrame, { pinned: true });
  }
  addEventListener('resize', () => {
    measure();
    // Keep an open map in its interactive scroll position when the viewport changes.
    if (mode !== 'scene' && !reduced) scrollTo({ top: ctx.map.scrollTarget(), behavior: 'auto' });
    if (mode === 'scene' || mode === 'country') setVB(mode === 'scene' ? interp(startRect(), countryRect(), easeInOut(clamp(sceneK / 0.55))) : countryRect());
    else if (mode === 'city') setVB(cityRect(cur.ci));
    else if (mode === 'project') setVB(projectRect(projects[idx(cur.pid)]));
  });

  // Public API used by the navbar, hero and other sections.
  ctx.map = {
    scrollTarget() {
      const top = scene.getBoundingClientRect().top + scrollY;
      return reduced ? top : top + (scene.offsetHeight - innerHeight) * 0.86;
    },
    openList() { if (mode !== 'scene') list.open(); },
    openProject,
    statusColor,
  };
}
