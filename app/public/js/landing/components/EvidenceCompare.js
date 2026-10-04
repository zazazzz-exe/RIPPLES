// "See the difference": the planned design (PROMISED) beside a representative
// photo and the recorded observation (OBSERVED), with a draggable comparison.
import { html, mount, raw } from '../../ui.js';
import { COMPARE } from '../copy.js';
import { schematic } from '../../shared/schematic.js';
import { photo, credit } from './media.js';
import { onceVisible, tween, reduced } from '../motion.js';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmt = (s) => `${MONTHS[Number(s.slice(5, 7)) - 1]} ${s.slice(0, 4)}`;

function caseData(vm, c) {
  const p = vm.projects.find((x) => x.id === c.project);
  const obs = p.evidence.find((e) => e[1] !== 'LGU update') || p.evidence[0];
  return { ...c, p, obs, ph: vm.photos[c.photo] };
}

export function render(vm) {
  const cases = COMPARE.cases.map((c) => caseData(vm, c));
  return html`
    <section class="section alt" id="evidence" aria-labelledby="evTitle">
      <div class="wrap">
        <p class="eyebrow" data-reveal>${COMPARE.eyebrow}</p>
        <h2 id="evTitle" data-reveal style="--d:80ms;max-width:20ch">${COMPARE.title}</h2>
        <p class="lede" data-reveal style="--d:160ms">${COMPARE.lede}</p>
        <div class="compare-grid" style="margin-top:44px">
          <div class="cases" role="group" aria-label="Choose an example" data-reveal="left">
            ${cases.map((c, i) => html`<button class="case-btn" type="button" data-case="${i}" aria-pressed="${i === 0}">
              <b>${c.label}</b><span>${c.p.city.name} · ${c.p.status}</span></button>`)}
            <p class="sample-note" style="margin-top:10px">${COMPARE.note}</p>
          </div>
          <div data-reveal style="--d:120ms">
            <div class="compare" style="--x:50%">
              <div class="side observed"><span class="tag">Observed</span><div data-obs-img></div></div>
              <div class="side promised"><span class="tag">Promised</span><div data-plan></div></div>
              <input type="range" min="0" max="100" value="50" aria-label="Compare promised and observed. Left shows the planned design, right shows the observation.">
              <div class="handle" aria-hidden="true"></div>
            </div>
            <div class="compare-caps"><div data-cap-plan></div><div class="obs" data-cap-obs></div></div>
          </div>
        </div>
      </div>
    </section>`;
}

export function enhance(root, vm) {
  const sec = root.querySelector('#evidence');
  const cmp = sec.querySelector('.compare');
  const range = cmp.querySelector('input');
  const cases = COMPARE.cases.map((c) => caseData(vm, c));
  const setX = (v) => { cmp.style.setProperty('--x', `${v}%`); range.value = String(Math.round(v)); };

  function show(i) {
    const c = cases[i];
    sec.querySelectorAll('[data-case]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.case) === i)));
    mount(cmp.querySelector('[data-plan]'), raw(schematic({ type: c.p.type, gap: null })));
    mount(cmp.querySelector('[data-obs-img]'), photo(c.ph, { sizes: '(max-width: 980px) 100vw, 760px', alt: `Representative photo: ${c.ph?.alt}` }));
    mount(sec.querySelector('[data-cap-plan]'), html`<b>Promised · ${c.p.lccap}</b>${c.p.summary} Due ${fmt(c.p.deadline)}.`);
    mount(sec.querySelector('[data-cap-obs]'), html`<b>Observed · ${fmt(c.obs[0])} · ${c.obs[1]} · ${c.obs[3] ? 'corroborated' : 'unverified'}</b>“${c.obs[2]}” <a href="#map" data-open="${c.p.id}">See it on the map →</a><br><span class="sample-note">${credit(c.ph)}</span>`);
  }
  sec.addEventListener('click', (e) => {
    const b = e.target.closest('[data-case]');
    if (b) { show(Number(b.dataset.case)); return; }
    const o = e.target.closest('[data-open]');
    if (o) { e.preventDefault(); window.dispatchEvent(new CustomEvent('ripples:open-project', { detail: o.dataset.open })); }
  });
  range.addEventListener('input', () => setX(Number(range.value)));
  // Dragging anywhere on the image moves the divider.
  cmp.addEventListener('pointermove', (e) => {
    if (e.buttons !== 1 && e.pointerType === 'mouse') return;
    const r = cmp.getBoundingClientRect();
    setX(Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100)));
  });
  show(0);
  setX(reduced ? 50 : 88);
  onceVisible(cmp, () => tween({ from: [88], to: [50], dur: 1600, onUpdate: ([v]) => setX(v) }), 0.5);
}
