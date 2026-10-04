// Record Ledger page: chain status, record verification and the latest blocks.
// All hash checks run in the browser (shared/ledger.js).
import { api } from '../api.js';
import { html, mount, initShell, showError, $ } from '../ui.js';
import { verifyChain, verifyRecord, short } from '../shared/ledger.js';

const PAGE = 25;
let page = 0;
let overview;
let projects = [];
const KIND = { genesis: 'Genesis', project: 'Project record', decision: 'Approval decision', reply: 'Office reply' };
const when = (iso) => { try { return new Date(iso).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' }); } catch { return iso; } };

function renderKpis(chainCheck) {
  const c = overview.counts;
  const ok = chainCheck ? chainCheck.valid : overview.chain.valid;
  mount('#ledgerKpis', html`
    <section class="kpi-group" aria-label="Ledger">
      <h2>Ledger</h2>
      <div class="kpis kpis-4">
        <div class="kpi"><b>${overview.total}</b><span>blocks in the chain</span></div>
        <div class="kpi"><b>${overview.records_tracked}</b><span>project records fingerprinted</span></div>
        <div class="kpi"><b>${(c.decision || 0) + (c.reply || 0)}</b><span>approval decisions and replies</span></div>
        <div class="kpi"><b class="${ok ? 'ok' : 'error'}">${ok ? '✓' : '✕'}</b><span>${chainCheck ? (ok ? 'chain verified in your browser' : `chain broken at block #${chainCheck.broken_at}`) : (ok ? 'chain intact (server check)' : 'chain broken')}</span></div>
      </div>
    </section>
    <section class="kpi-group" aria-label="Latest block">
      <h2>Latest block</h2>
      <div class="kpi head-hash"><b class="mono">#${overview.chain.height}</b><span class="mono" title="${overview.chain.head_hash}">${short(overview.chain.head_hash, 16, 12)}</span></div>
    </section>`);
}

function renderBlocks() {
  const pages = Math.ceil(overview.total / PAGE);
  mount('#blockPager', pages > 1 ? html`<div class="pager">
    <button class="btn" type="button" data-page="${page - 1}" ${page === 0 ? html`disabled` : ''}>‹ Newer</button>
    <span class="small mono">${page + 1} / ${pages}</span>
    <button class="btn" type="button" data-page="${page + 1}" ${page >= pages - 1 ? html`disabled` : ''}>Older ›</button></div>` : '');
  mount('#blocks', html`<table class="table blocks"><thead><tr><th>Block</th><th>Recorded</th><th>Type</th><th>Record</th><th>Fingerprint</th><th>Previous hash</th><th>Block hash</th></tr></thead>
    <tbody>${overview.blocks.map((b) => html`<tr>
      <td data-label="Block" class="mono">#${b.height}</td>
      <td data-label="Recorded" class="small">${when(b.at)}<div class="meta small muted">${b.event}</div></td>
      <td data-label="Type">${KIND[b.kind] || b.kind}</td>
      <td data-label="Record">${b.kind === 'project' ? html`<a href="/map#/project/${b.record_id}">${b.label || b.record_id}</a>` : html`<span class="mono small">${b.record_id}</span>`}</td>
      <td data-label="Fingerprint" class="mono small" title="${b.fingerprint}">${short(b.fingerprint)}</td>
      <td data-label="Previous hash" class="mono small" title="${b.prev_hash}">${short(b.prev_hash)}</td>
      <td data-label="Block hash" class="mono small" title="${b.hash}">${short(b.hash)}</td></tr>`)}</tbody></table>`);
}

async function loadBlocks() {
  overview = await api.get(`/ledger?offset=${page * PAGE}&limit=${PAGE}`);
  renderBlocks();
}

async function showRecord(projectId) {
  mount('#vresults', '');
  mount('#vresult', html`<p class="small muted">Checking…</p>`);
  try {
    const d = await api.get(`/projects/${encodeURIComponent(projectId)}/integrity`);
    const v = await verifyRecord(d);
    const p = projects.find((x) => x.project_id === projectId);
    mount('#vresult', html`
      <div class="vcard ${v.ok ? 'ok' : 'bad'}">
        <div class="row between"><b>${p ? p.project : projectId}</b><span class="badge ${v.ok ? 'state-APPROVED' : 'gap-Overdue'}">${v.ok ? '✓ Matches ledger' : '✕ Does not match'}</span></div>
        <p class="small muted">${v.ok ? 'The record hashes to the fingerprint in its latest block, and that block hashes correctly and links to the block before it. Checked in your browser.' : 'The record or its block does not hash to what the ledger holds.'}</p>
        <dl class="vdl"><dt>Current fingerprint</dt><dd class="mono small">${v.fingerprintNow}</dd>
          <dt>Ledger fingerprint</dt><dd class="mono small">${d.latest ? d.latest.fingerprint : '—'}</dd></dl>
        <h3>History</h3>
        <ol class="vhist">${[...d.history].reverse().map((b) => html`<li><span class="mono">#${b.height}</span> ${b.event} · ${when(b.at)} <span class="mono small muted">${short(b.hash)}</span></li>`)}</ol>
        <details><summary class="small">Show the exact record that is hashed</summary><pre class="preview small">${JSON.stringify(JSON.parse(d.record), null, 2)}</pre></details>
        <p style="margin:8px 0 0"><a href="/map#/project/${projectId}">Open on the map ›</a></p>
      </div>`);
  } catch (e) {
    mount('#vresult', html`<p class="error">${e.message}</p>`);
  }
}

function searchProjects(q) {
  const t = q.trim().toLowerCase();
  if (!t) { mount('#vresults', ''); return; }
  const hits = projects.filter((p) => `${p.project} ${p.city} ${p.project_id}`.toLowerCase().includes(t)).slice(0, 8);
  mount('#vresults', hits.length ? hits.map((p) => html`<li class="item" data-pid="${p.project_id}" tabindex="0" role="button"><span class="title">${p.project}</span><div class="meta">${p.city}</div></li>`)
    : html`<li class="empty">No project matches.</li>`);
}

async function main() {
  try {
    initShell('ledger');
    const [ov, sc] = await Promise.all([api.get(`/ledger?limit=${PAGE}`), api.get('/scorecard')]);
    overview = ov;
    const names = Object.fromEntries(sc.cities.map((c) => [c.city_id, c.city]));
    projects = sc.projects.map((p) => ({ project_id: p.project_id, project: p.project, city: names[p.city_id] }));
    renderKpis(null);
    renderBlocks();
  } catch (e) {
    return showError('#page', e);
  }

  $('#blockPager').addEventListener('click', async (e) => {
    const b = e.target.closest('[data-page]');
    if (!b) return;
    page = Number(b.dataset.page);
    await loadBlocks();
  });
  $('#vq').addEventListener('input', (e) => searchProjects(e.target.value));
  const pick = (e) => { const li = e.target.closest('[data-pid]'); if (li) { $('#vq').value = li.querySelector('.title').textContent; showRecord(li.dataset.pid); } };
  $('#vresults').addEventListener('click', pick);
  $('#vresults').addEventListener('keydown', (e) => { if (e.key === 'Enter') pick(e); });
  $('#verifyAll').addEventListener('click', async (e) => {
    e.target.disabled = true;
    mount('#chainResult', html`<p class="small muted">Recomputing ${overview.total} blocks…</p>`);
    const all = await api.get('/ledger?all=1');
    const chain = [...all.blocks].reverse();
    const t0 = performance.now();
    const check = await verifyChain(chain);
    const ms = Math.round(performance.now() - t0);
    mount('#chainResult', check.valid
      ? html`<p class="ok-line">✓ All ${chain.length} blocks verified in ${ms} ms. Every hash matches and every block links to the one before it.</p><p class="small muted mono">Head #${check.height} · ${check.head_hash}</p>`
      : html`<p class="error">✕ Chain broken at block #${check.broken_at}: ${check.reason}.</p>`);
    renderKpis(check);
    e.target.disabled = false;
  });
  // Deep link: /ledger#<project_id> opens that record.
  const id = decodeURIComponent(location.hash.slice(1));
  if (id && projects.some((p) => p.project_id === id)) {
    $('#vq').value = projects.find((p) => p.project_id === id).project;
    showRecord(id);
    $('#verifyTitle').scrollIntoView();
  }
}

main();
