import { api } from '../api.js';
import { html, mount, initShell, riskBadge, showError, toast, confirmButton, $ } from '../ui.js';

const LEVELS = {
  Heat: ['Caution', 'Extreme Caution', 'Danger', 'Extreme Danger'],
  Rain: ['Yellow', 'Orange', 'Red'],
  Flood: ['Watch', 'Advisory', 'Warning'],
  Typhoon: ['Signal 1', 'Signal 2', 'Signal 3', 'Signal 4', 'Signal 5'],
  Drought: ['Dry condition', 'Dry spell', 'Drought'],
  Thunderstorm: ['Advisory'],
  Coastal: ['Gale warning', 'High tide'],
};

let cities = [];

const awaitNote = (mode) => (mode === 'required' ? html`Drafts are waiting for approval in <a href="/ops">Scorecard → Drafts</a>.` : 'Auto mode: drafts were released immediately.');

async function renderTyphoon() {
  const { simulation: sim } = await api.get('/simulate/typhoon');
  initShell('sim', { simulation: sim });
  mount('#typhoonState', sim
    ? html`<p><b>${sim.name}</b> is active (simulated). Signals: ${Object.entries(sim.signals).map(([id, s]) => `${cities.find((c) => c.city_id === id)?.city || id} ${s}`).join(', ')}.</p>`
    : html`<p class="muted">No simulation running.</p>`);
  $('#runTyphoon').disabled = Boolean(sim);
  $('#endTyphoon').disabled = !sim;
}

async function renderCandidates() {
  const { candidates } = await api.get('/automations/escalation/candidates');
  const ready = candidates.filter((c) => !c.skip);
  mount('#candidates', html`
    <p class="small">${candidates.length} projects meet the rule; ${ready.length} will get a letter now.</p>
    <ul class="list">${candidates.map((c) => html`<li class="small"><span class="badge ${c.rule === 'overdue' ? 'gap-Overdue' : 'gap-Needs-maintenance'}">${c.rule}</span> ${c.project} <span class="muted">· ${c.city_id}${c.skip ? ` · skipped: ${c.skip}` : ''}</span></li>`)}</ul>`);
}

async function renderOutbox() {
  const { note, messages } = await api.get('/outbox');
  mount('#outbox', html`<p class="small muted">${note}</p>
    ${messages.length ? html`<ul class="list">${messages.map((m) => html`
      <li class="item"><details><summary class="row between" style="cursor:pointer"><span class="title">${m.subject}</span><span class="row">${m.simulated ? html`<span class="badge tag-sim">Simulated</span>` : ''}<span class="badge">${m.kind}</span></span></summary>
        <p class="small mono" style="margin-top:8px">To: ${m.to.join(', ')} · ${m.sent_on} · ${m.id}</p><div class="preview">${m.body}</div></details></li>`)}</ul>`
    : html`<p class="empty">The outbox is empty. Approved letters, notices and reports appear here.</p>`}`);
}

function renderLevelOptions() {
  const type = $('#advType').value;
  mount('#advLevel', LEVELS[type].map((l) => html`<option>${l}</option>`));
  $('#heatWrap').classList.toggle('hidden', type !== 'Heat');
}

async function refresh() {
  await Promise.all([renderTyphoon(), renderCandidates(), renderOutbox()]);
}

async function main() {
  try {
    ({ cities } = await api.get('/cities'));
    mount('#advCity', cities.map((c) => html`<option value="${c.city_id}" ${c.pilot_city ? html`selected` : ''}>${c.city}</option>`));
    mount('#readyCity', html`<option value="">All cities</option>${cities.map((c) => html`<option value="${c.city_id}">${c.city}</option>`)}`);
    mount('#advType', Object.keys(LEVELS).map((t) => html`<option>${t}</option>`));
    renderLevelOptions();
    await refresh();
  } catch (e) {
    initShell('sim');
    return showError('#page', e);
  }

  $('#runTyphoon').addEventListener('click', async () => {
    try {
      const r = await api.post('/simulate/typhoon');
      mount('#typhoonResult', html`
        <table class="table"><thead><tr><th>City</th><th>Signal</th><th>Before</th><th>Now</th><th>Drafts</th></tr></thead><tbody>
        ${r.affected.map((a) => html`<tr><td data-label="City"><a href="/#/city/${a.city_id}">${a.city}</a></td><td data-label="Signal">${a.signal}</td>
          <td data-label="Before">${riskBadge(a.baseline_level)}</td><td data-label="Now">${riskBadge(a.real_risk_level)}</td><td data-label="Drafts">${a.drafts.length}</td></tr>`)}
        </tbody></table><p class="small">${r.awaiting_approval} drafts in total. ${awaitNote(r.approval_mode)}</p>`);
      toast(`${r.name}: ${r.affected.length} cities affected.`);
      await refresh();
    } catch (e) { toast(e.message); }
  });
  $('#endTyphoon').addEventListener('click', async () => {
    const r = await api.post('/simulate/reset');
    mount('#typhoonResult', '');
    toast(r.ended ? `Simulation ended. ${r.discarded_drafts} unapproved simulated drafts discarded.` : 'No simulation was running.');
    await refresh();
  });

  $('#advType').addEventListener('change', renderLevelOptions);
  $('#advForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget));
    if (f.type !== 'Heat' || !f.heat_index) delete f.heat_index;
    try {
      const d = await api.post('/flows/advisory-card', f);
      mount('#advResult', html`<p class="small">Created <b>${d.id}</b>: ${d.type} ${d.level}, hazard +${d.hazard_points} (fixed PAGASA rule). ${awaitNote(d.review_state === 'DRAFT' ? 'required' : 'auto')}</p>`);
    } catch (err) { mount('#advResult', html`<p class="error small">${err.message}</p>`); }
  });

  $('#runEscalation').addEventListener('click', async () => {
    const r = await api.post('/automations/escalation/run');
    mount('#escResult', html`<p class="small">${r.drafted} letters drafted, ${r.skipped.length} skipped. ${awaitNote(r.approval_mode)}</p>`);
    await refresh();
  });
  $('#clockForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const r = await api.post('/automations/escalation/check-clocks', { today: $('#clockDate').value });
    toast(`${r.marked_no_reply.length} follow-up(s) marked "No reply".`);
  });

  $('#runReadiness').addEventListener('click', async () => {
    const id = $('#readyCity').value;
    const r = await api.post('/automations/readiness/run', id ? { city_ids: [id] } : {});
    mount('#readyResult', html`<p class="small">${r.reports.length} readiness report(s) created. ${awaitNote(r.approval_mode)}</p>`);
  });

  confirmButton($('#resetAll'), 'Click again to clear all demo activity', async () => {
    await api.post('/admin/reset');
    toast('Demo activity cleared. The sample CSVs are unchanged.');
    ['#typhoonResult', '#advResult', '#escResult', '#readyResult'].forEach((s) => mount(s, ''));
    await refresh();
  });
}

main();
