// "The Problem": two cinematic photo panels, with figures from the data.
import { html } from '../../ui.js';
import { PROBLEM } from '../copy.js';
import * as Cine from './CinematicImageSection.js';

function dataFacts(vm) {
  const s = vm.stats;
  const offices = new Set(vm.projects.filter((p) => p.fu.sent > p.fu.replied).map((p) => p.office)).size;
  return [
    { value: `${s.overdue}/${s.projects}`, text: 'tracked commitments are past their deadline' },
    { value: String(s.maintenance), text: 'finished defenses need maintenance to work again' },
    { value: String(offices), text: 'responsible offices have follow-ups without a reply' },
  ];
}

const factList = (facts) => html`<ul class="facts">${facts.map((f, i) => html`
  <li data-reveal style="--d:${300 + i * 120}ms"><b>${f.value}</b><span>${f.text}${f.source ? html` · <a href="${f.source.url}" target="_blank" rel="noopener">${f.source.name}</a>` : ''}</span></li>`)}</ul>`;

export function render(vm) {
  return html`<div id="problem">${PROBLEM.map((b) => Cine.render({
    ph: vm.photos[b.photo], eyebrow: b.eyebrow, title: b.title, body: b.body, right: b.right,
    extra: html`${factList(b.factsFromData ? dataFacts(vm) : b.facts)}${b.factsFromData ? html`<p class="sample-note" style="margin-top:14px">Figures from the Ripples sample dataset</p>` : ''}`,
  }))}</div>`;
}

export function enhance(root) {
  root.querySelectorAll('#problem .cine').forEach((s) => Cine.enhance(s));
}
