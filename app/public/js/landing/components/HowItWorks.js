// Four steps. Desktop: a sticky visual that changes as each step reaches the
// middle of the screen. Mobile: each step carries its own visual.
import { html, raw } from '../../ui.js';
import { STEPS } from '../copy.js';
import { statusChip, progressBar } from './ProjectPreview.js';
import { statusColor } from './ProjectPin.js';

function visuals(vm) {
  const wall = vm.projects.find((p) => p.id === 'mal-wall');
  const obs = wall.evidence.find((e) => e[1] === 'Citizen photo report');
  const sat = wall.evidence.find((e) => e[1] === 'Satellite check');
  const dots = vm.projects.map((p) => {
    const [x, y] = vm.mini.project(p.city.lon + p.dx * 3.2, p.city.lat + p.dy * 3.2);
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.4" fill="${statusColor(p.status_key)}" stroke="#fff" stroke-width="1"/>`;
  }).join('');
  return [
    raw(`<svg viewBox="0 0 ${vm.mini.width} ${vm.mini.height}" style="height:100%;max-height:100%;width:auto" aria-hidden="true"><path d="${vm.mini.land}" fill="#fff" stroke="#7fa39a" stroke-width=".8"/>${dots}</svg>`),
    html`<div class="mini-card"><span class="k">${wall.city.name} · ${wall.type}</span><h5>${wall.name}</h5>
      <p style="margin:4px 0 10px">${wall.office}</p>${statusChip(wall.status_key)}<div style="margin-top:10px">${progressBar(wall.progress, wall.status_key)}</div></div>`,
    html`<div style="display:grid;gap:10px;width:min(360px,100%)">
      <div class="mini-card"><span class="k">Reported</span><h5>${wall.status} · ${wall.progress}% complete</h5></div>
      <div class="mini-card" style="border-left:3px solid var(--red)"><span class="k">Observed · corroborated</span><h5>“${obs[2]}”</h5><p style="margin:4px 0 0">${sat ? `Satellite check: ${sat[2]}` : ''}</p></div></div>`,
    html`<div class="mini-card"><span class="k">${wall.city.name} this season</span><h5>${wall.city.risk.lvl} real risk · ${wall.city.risk.s} of 6</h5>
      <p style="margin:6px 0 10px">Hazard +${wall.city.risk.h} and open gaps +${wall.city.risk.g}. Interim measure: ${wall.interim}</p>
      <div style="display:flex;flex-wrap:wrap;gap:6px">${['delayed', 'verify', 'ongoing', 'completed'].map((k) => statusChip(k))}</div></div>`,
  ];
}

export function render(vm) {
  const v = visuals(vm);
  return html`
    <section class="section" id="how" aria-labelledby="howTitle">
      <div class="wrap">
        <p class="eyebrow" data-reveal>How it works</p>
        <h2 id="howTitle" data-reveal style="--d:80ms;max-width:18ch">From a pin on the map to an informed question.</h2>
        <div class="how" style="margin-top:28px">
          <div class="how-visual" aria-hidden="true">${v.map((f, i) => html`<div class="frame ${i === 0 ? 'on' : ''}" data-frame="${i}">${f}</div>`)}</div>
          <ol class="steps">
            ${STEPS.map((s, i) => html`<li class="step ${i === 0 ? 'on' : ''}" data-step="${i}">
              <span class="num">${s.num}</span><h3>${s.title}</h3><p>${s.text}</p>
              <div class="mobile-visual" aria-hidden="true"><div class="frame">${v[i]}</div></div></li>`)}
          </ol>
        </div>
      </div>
    </section>`;
}

export function enhance(root) {
  const sec = root.querySelector('#how');
  const steps = [...sec.querySelectorAll('.step')];
  const frames = [...sec.querySelectorAll('.how-visual .frame')];
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const i = Number(e.target.dataset.step);
      steps.forEach((s, k) => s.classList.toggle('on', k === i));
      frames.forEach((f, k) => f.classList.toggle('on', k === i));
    }
  }, { rootMargin: '-45% 0px -45% 0px' });
  steps.forEach((s) => io.observe(s));
}
