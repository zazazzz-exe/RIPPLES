// Project detail panel: representative photo / planned design, status,
// progress, timeline, evidence, responsible office, and project navigation.
import { html, mount, raw } from '../../ui.js';
import { schematic } from '../../shared/schematic.js';
import { TYPE_PHOTO } from '../copy.js';
import { photo, credit } from './media.js';
import { statusChip, progressBar } from './ProjectPreview.js';
import { closeIcon } from './icons.js';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const ym = (s) => { const [y, m] = s.split('-').map(Number); return y * 12 + m - 1; };
const fmt = (s) => (s ? `${MONTHS[Number(s.slice(5, 7)) - 1]} ${s.slice(0, 4)}` : '—');

function timeline(p, asOf) {
  const marks = [[p.start, 'Started'], [p.deadline, 'Deadline', 'dl']];
  if (p.done) marks.push([p.done, 'Completed']);
  const now = ym(asOf);
  const ts = marks.filter((m) => m[0]).map((m) => ym(m[0]));
  const t0 = Math.min(...ts, now) - 2;
  const t1 = Math.max(...ts, now) + 2;
  const pos = (t) => ((t - t0) / (t1 - t0)) * 100;
  return html`<div class="timeline" role="img" aria-label="Started ${fmt(p.start)}, due ${fmt(p.deadline)}${p.done ? `, completed ${fmt(p.done)}` : ''}">
    <div class="tl-track"></div><div class="tl-done" style="--w:${pos(Math.min(now, t1)).toFixed(1)}%"></div>
    ${marks.filter((m) => m[0]).map(([d, l, c]) => html`<span class="tl-m ${c || ''} ${ym(d) > now ? 'future' : ''}" style="left:${pos(ym(d)).toFixed(1)}%"></span><span class="tl-l" style="left:${pos(ym(d)).toFixed(1)}%">${l}<br>${fmt(d)}</span>`)}
    <span class="tl-now" style="left:${pos(now).toFixed(1)}%"></span></div>`;
}

export function createDetail(stage, { photos, asOf, onPrev, onNext, onReturn, onClose }) {
  const el = document.createElement('aside');
  el.className = 'detail';
  el.setAttribute('aria-label', 'Project details');
  el.setAttribute('tabindex', '-1');
  stage.append(el);

  function render(p, prev, next) {
    // Prefer the project's own government/public-domain reference photo; else the type's representative photo.
    const own = p.media && p.media.photos[0];
    const ph = own ? null : photos[TYPE_PHOTO[p.type]];
    const caption = own
      ? `Reference photo (${own.match}) · not this sample project's own record. Photo: ${own.source}, ${own.license_note}.`
      : `Representative photo · not this project. ${credit(ph)}`;
    const latest = p.evidence[0];
    const i = (n) => raw(`style="--i:${n}"`);
    mount(el, html`
      <div class="detail-scroll">
        <figure class="d-media">
          ${own ? photo({ ...own, alt: own.title }, { base: '/img/projects/', sizes: '(max-width: 760px) 100vw, 460px', alt: `Reference photo: ${own.title}` })
            : photo(ph, { sizes: '(max-width: 760px) 100vw, 460px', alt: `Representative photo: ${ph?.alt || p.type}` })}
          <div class="schem-wrap">${raw(schematic({ type: p.type, gap: null }))}</div>
          <figcaption data-cap="photo">${caption}</figcaption>
          <div class="d-tabs" role="group" aria-label="Image">
            <button type="button" data-view="photo" aria-pressed="true">Photo</button>
            <button type="button" data-view="plan" aria-pressed="false">Planned design</button>
          </div>
          <button class="d-close" type="button" aria-label="Close project" data-act="close">${closeIcon()}</button>
        </figure>
        <div class="d-body">
          <div class="d-kicker" ${i(0)}>${p.city.name} · ${p.type} · ${p.agency}</div>
          <h3 ${i(1)}>${p.name}</h3>
          <p class="d-loc" ${i(2)}>${p.city.name}, ${p.city.prov} · ${(p.city.lat + p.dy).toFixed(3)}°N ${(p.city.lon + p.dx).toFixed(3)}°E</p>
          <div class="d-row" ${i(3)}>${statusChip(p.status_key)}<span class="sample-note">Sample record</span></div>
          <div ${i(4)}>${progressBar(p.progress, p.status_key)}</div>
          <div class="d-sec" ${i(5)}><h4>Project</h4><p>${p.summary}</p><p class="sample-note">${p.lccap} · ₱${p.budget}M budget</p>
            ${p.gap ? html`<p><b>Interim measure:</b> ${p.interim}</p>` : ''}</div>
          <div class="d-sec" ${i(6)}><h4>Timeline</h4>${timeline(p, asOf)}</div>
          <div class="d-sec" ${i(7)}><h4>Evidence (${p.evidence.length})</h4>
            <ul class="ev-list">${p.evidence.map((e) => html`<li><span class="d">${fmt(e[0])}</span><span><b>${e[1]}${e[4] === 'mine' ? ' (you)' : ''}</b><span class="ev-tag ${e[3] ? 'v' : 'u'}">${e[3] ? 'corroborated' : 'unverified'}</span><br>${e[2]}</span></li>`)}</ul>
            ${latest ? '' : html`<p>No evidence recorded yet.</p>`}</div>
          ${p.media && p.media.references.length ? html`<div class="d-sec" ${i(8)}><h4>Source references</h4><ul class="ev-list" style="grid-template-columns:1fr">${p.media.references.map((r) => html`<li style="display:block"><a href="${r.url}" target="_blank" rel="noopener">${r.title}</a> · ${r.source}</li>`)}</ul></div>` : ''}
          <div class="d-sec" ${i(8)}><h4>Responsible office</h4><p>${p.office}</p>
            <p>${p.fu.replied} of ${p.fu.sent} follow-ups answered${p.fu.reply ? html`. Latest reply: “${p.fu.reply}”` : ''}.</p></div>
          <div class="d-sec" ${i(9)} style="display:flex;flex-wrap:wrap;gap:8px">
            <a class="btn btn-primary btn-sm" href="/map#/project/${p.id}">Open in 3D explorer</a>
            <a class="btn btn-outline btn-sm" href="/map#/project/${p.id}">Report on this project</a>
          </div>
        </div>
      </div>
      <nav class="d-nav" aria-label="Project navigation">
        <button class="btn btn-outline" type="button" data-act="prev">← Back<small>${prev.name}</small></button>
        <button class="btn btn-outline" type="button" data-act="return">Return to map</button>
        <button class="btn btn-primary" type="button" data-act="next">Next →<small>${next.name}</small></button>
      </nav>`);
    el.querySelector('.detail-scroll').scrollTop = 0;
  }

  el.addEventListener('click', (e) => {
    const v = e.target.closest('[data-view]');
    if (v) {
      el.querySelectorAll('[data-view]').forEach((b) => b.setAttribute('aria-pressed', String(b === v)));
      el.querySelector('.d-media').classList.toggle('show-plan', v.dataset.view === 'plan');
      el.querySelector('[data-cap]').textContent = v.dataset.view === 'plan' ? 'Planned design (schematic drawn from the project type)' : el.querySelector('[data-cap]').dataset.photo;
      return;
    }
    const a = e.target.closest('[data-act]')?.dataset.act;
    if (a === 'prev') onPrev(); else if (a === 'next') onNext(); else if (a === 'return') onReturn(); else if (a === 'close') onClose();
  });

  return {
    el,
    open(p, prev, next) {
      render(p, prev, next);
      const cap = el.querySelector('[data-cap]');
      cap.dataset.photo = cap.textContent;
      requestAnimationFrame(() => { el.classList.add('open'); el.focus({ preventScroll: true }); });
    },
    close() { el.classList.remove('open'); },
    get isOpen() { return el.classList.contains('open'); },
  };
}

