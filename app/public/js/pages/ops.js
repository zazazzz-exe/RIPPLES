import { api } from '../api.js';
import { html, mount, initShell, riskBadge, statusBadge, gapBadge, stateBadge, pct, month, showError, toast, $ } from '../ui.js';
import { advisoryCard } from '../advisory.js';

let sc;
let draftFilter = 'DRAFT';
const explorer = { city: '', status: '', type: '', agency: '', gapsOnly: false, q: '' };

const KIND_LABEL = { advisory: 'Advisory card', letter: 'Follow-up letter', notice: 'Interim notice', report: 'Readiness report' };

function draftBody(d) {
  if (d.kind === 'advisory') return advisoryCard(d, { open: true, officialLine: d.official_line });
  const to = Array.isArray(d.to) ? d.to.join(', ') : d.to;
  return html`<p class="small muted">To: <span class="mono">${to}</span></p><div class="preview">${d.kind === 'report' ? d.text : `${d.subject}\n\n${d.body}`}</div>`;
}

async function renderDrafts() {
  const { approval_mode: mode, drafts } = await api.get(`/drafts${draftFilter ? `?state=${draftFilter}` : ''}`);
  mount('#draftsHead', html`
    <div class="row between">
      <h2 id="draftsTitle" style="margin:0">Drafts ${draftFilter === 'DRAFT' ? 'awaiting approval' : ''}</h2>
      <span class="badge">Approval mode: ${mode}</span>
    </div>
    <p class="small muted">${mode === 'required' ? 'Nothing is published or sent until a person approves it here (safeguard S2). Approved letters go to a test outbox only.' : 'Auto mode: drafts are released immediately. The human approval step (S2) is off.'}</p>
    <div class="chips" role="group" aria-label="Filter drafts">${[['DRAFT', 'Awaiting'], ['APPROVED', 'Approved'], ['REJECTED', 'Rejected'], ['', 'All']].map(([v, l]) => html`<button class="chip" type="button" data-state="${v}" aria-pressed="${v === draftFilter}">${l}</button>`)}</div>`);
  mount('#drafts', drafts.length ? drafts.map((d) => html`
    <li class="item" data-id="${d.id}">
      <details>
        <summary class="row between" style="cursor:pointer">
          <span><span class="title">${KIND_LABEL[d.kind]}</span> <span class="meta">· ${d.city}${d.project ? ` · ${d.project}` : ''} · ${d.id}</span></span>
          <span class="row">${d.simulated ? html`<span class="badge tag-sim">Simulated</span>` : ''}${stateBadge(d.review_state)}</span>
        </summary>
        <div class="stack" style="margin-top:10px">
          ${draftBody(d)}
          ${d.source_records ? html`<div class="cites">${d.source_records.map((s) => html`<code>${s}</code>`)}</div>` : ''}
          ${d.review_state === 'DRAFT' ? html`
            <label>Note (optional) <input name="note" maxlength="500" placeholder="Reason or comment"></label>
            <div class="row"><button class="btn go" type="button" data-act="approve">Approve</button><button class="btn danger" type="button" data-act="reject">Reject</button></div>`
            : html`<p class="small muted">${d.review_state} ${d.decided_at ? `on ${d.decided_at.slice(0, 10)}` : ''}${d.decision_note ? ` · “${d.decision_note}”` : ''}${d.release ? ` · released${d.release.outbox_id ? ` (${d.release.outbox_id})` : ''}${d.release.published_to ? ` to ${d.release.published_to}` : ''}` : ''}</p>`}
        </div>
      </details>
    </li>`) : html`<li class="empty">${draftFilter === 'DRAFT' ? 'No drafts are waiting. Run an automation on the Simulate page, or draft a letter from a project.' : 'Nothing here.'}</li>`);
}

function renderScorecard() {
  const k = sc.kpis;
  mount('#kpis', html`
    <div class="kpi"><b>${k.commitments_tracked}</b><span>commitments tracked</span></div>
    <div class="kpi"><b>${k.open_gaps}</b><span>open gaps</span></div>
    <div class="kpi"><b>${k.overdue}</b><span>overdue</span></div>
    <div class="kpi"><b>${k.needs_maintenance}</b><span>need maintenance</span></div>
    <div class="kpi"><b>${k.cities_high_or_critical}</b><span>cities High or Critical</span></div>
    <div class="kpi"><b>${k.offices_without_reply}</b><span>offices with unanswered follow-ups</span></div>`);

  mount('#cityTable', html`
    <table class="table"><thead><tr><th>City</th><th>Risk</th><th>Score</th><th>Open gaps</th><th>Promises kept</th><th>Maintained</th><th>Follow-ups answered</th></tr></thead>
    <tbody>${sc.cities.map((c) => html`<tr>
      <td data-label="City"><a href="/#/city/${c.city_id}">${c.city}</a></td>
      <td data-label="Risk">${riskBadge(c.real_risk_level)}</td>
      <td data-label="Score" class="mono">${c.hazard_points}+${c.gap_points}=${c.risk_score}</td>
      <td data-label="Open gaps">${c.open_gaps}</td>
      <td data-label="Promises kept">${pct(c.promises_kept_pct)}</td>
      <td data-label="Maintained">${pct(c.maintained_pct)}</td>
      <td data-label="Follow-ups answered">${c.followups_replied}/${c.followups_sent}</td></tr>`)}</tbody></table>
    <p class="small muted">${sc.explanations.cities}</p>`);

  const max = Math.max(...sc.gaps_by_agency.map((a) => a.total), 1);
  mount('#agencyBars', html`
    <div class="legend"><span><i class="dot" style="background:var(--crit)"></i>Overdue</span><span><i class="dot" style="background:var(--maint)"></i>Needs maintenance</span></div>
    <div class="bars" style="margin-top:10px">${sc.gaps_by_agency.map((a) => html`
      <div class="bar-row"><div class="row between small"><span>${a.agency}</span><span class="mono">${a.Overdue} + ${a['Needs maintenance']} = ${a.total}</span></div>
      <div class="bar" role="img" aria-label="${a.agency}: ${a.Overdue} overdue, ${a['Needs maintenance']} need maintenance">
        <i class="ov" style="width:${(a.Overdue / max) * 100}%"></i><i class="nm" style="width:${(a['Needs maintenance'] / max) * 100}%"></i></div></div>`)}</div>
    <p class="small muted">${sc.explanations.gaps_by_agency}</p>`);

  mount('#officeTable', html`
    <table class="table"><thead><tr><th>Responsible office</th><th>Sent</th><th>Replied</th><th>Unanswered</th></tr></thead>
    <tbody>${sc.followup_accountability.map((o) => html`<tr>
      <td data-label="Office">${o.office}</td><td data-label="Sent">${o.sent}</td><td data-label="Replied">${o.replied}</td>
      <td data-label="Unanswered">${o.unanswered ? html`<b class="error">${o.unanswered}</b>` : '0'}</td></tr>`)}</tbody></table>
    <p class="small muted">${sc.explanations.followup_accountability}</p>`);

  const opts = (key) => [...new Set(sc.projects.map((p) => p[key]))].sort();
  const cityName = Object.fromEntries(sc.cities.map((c) => [c.city_id, c.city]));
  mount('#explorerFilters', html`
    <label>Search <input id="fq" type="search" placeholder="Project name" value="${explorer.q}"></label>
    <label>City <select id="fcity"><option value="">All</option>${opts('city_id').map((v) => html`<option value="${v}" ${v === explorer.city ? html`selected` : ''}>${cityName[v]}</option>`)}</select></label>
    <label>Status <select id="fstatus"><option value="">All</option>${opts('status').map((v) => html`<option ${v === explorer.status ? html`selected` : ''}>${v}</option>`)}</select></label>
    <label>Type <select id="ftype"><option value="">All</option>${opts('type').map((v) => html`<option ${v === explorer.type ? html`selected` : ''}>${v}</option>`)}</select></label>
    <label>Agency <select id="fagency"><option value="">All</option>${opts('agency').map((v) => html`<option ${v === explorer.agency ? html`selected` : ''}>${v}</option>`)}</select></label>
    <label class="row" style="align-self:end"><input id="fgaps" type="checkbox" style="width:auto;min-height:0" ${explorer.gapsOnly ? html`checked` : ''}> Open gaps only</label>`);
  renderExplorer(cityName);
}

function renderExplorer(cityName = Object.fromEntries(sc.cities.map((c) => [c.city_id, c.city]))) {
  const q = explorer.q.toLowerCase();
  const rows = sc.projects.filter((p) => (!explorer.city || p.city_id === explorer.city) && (!explorer.status || p.status === explorer.status)
    && (!explorer.type || p.type === explorer.type) && (!explorer.agency || p.agency === explorer.agency)
    && (!explorer.gapsOnly || p.gap) && (!q || p.project.toLowerCase().includes(q)));
  mount('#explorer', html`
    <p class="small muted">${rows.length} of ${sc.projects.length} commitments.</p>
    <table class="table"><thead><tr><th>Project</th><th>City</th><th>Status</th><th>Progress</th><th>Deadline</th><th>Gap</th><th>Interim measure</th></tr></thead>
    <tbody>${rows.map((p) => html`<tr>
      <td data-label="Project"><a href="/#/project/${p.project_id}">${p.project}</a></td>
      <td data-label="City">${cityName[p.city_id]}</td>
      <td data-label="Status">${statusBadge(p.status)}</td>
      <td data-label="Progress">${p.progress_pct}%</td>
      <td data-label="Deadline">${month(p.deadline)}</td>
      <td data-label="Gap">${gapBadge(p.gap) || '—'}</td>
      <td data-label="Interim" class="small">${p.gap ? p.interim_measure : ''}</td></tr>`)}</tbody></table>`);
}

async function renderFollowups() {
  const f = await api.get('/followups');
  mount('#followups', html`
    <div class="kpis" style="grid-template-columns:repeat(4,minmax(0,1fr))">
      <div class="kpi"><b>${f.letters_sent}</b><span>letters sent</span></div>
      <div class="kpi"><b>${f.awaiting}</b><span>awaiting reply</span></div>
      <div class="kpi"><b>${f.replies}</b><span>replied</span></div>
      <div class="kpi"><b>${f.no_reply}</b><span>no reply</span></div>
    </div>
    ${f.followups.length ? html`<ul class="list" style="margin-top:10px">${f.followups.map((x) => html`
      <li class="item"><div class="row between"><span class="title">${x.project_id}</span><span class="badge ${x.status === 'Replied' ? 'state-APPROVED' : x.status === 'No reply' ? 'gap-Overdue' : 'state-DRAFT'}">${x.status}</span></div>
        <div class="meta">${x.office} · sent ${x.sent_on} · reply due ${x.clock_due}</div>
        ${x.reply ? html`<p class="small">Reply: ${x.reply}</p>` : ''}
        ${x.status === 'Awaiting reply' ? html`<form class="row" data-reply="${x.id}" style="margin-top:6px"><input name="reply" placeholder="Paste the office's reply" required style="flex:1;min-width:180px"><button class="btn" type="submit">Record reply</button></form>` : ''}
      </li>`)}</ul>` : html`<p class="empty">No letters sent yet. Approve a follow-up letter draft to start a reply clock.</p>`}`);
}

async function refresh() {
  sc = await api.get('/scorecard');
  renderScorecard();
  await Promise.all([renderDrafts(), renderFollowups()]);
}

async function main() {
  try {
    const sim = await api.get('/simulate/typhoon');
    initShell('ops', { simulation: sim.simulation });
    await refresh();
  } catch (e) {
    return showError('#page', e);
  }

  $('#draftsHead').addEventListener('click', (e) => {
    const b = e.target.closest('[data-state]');
    if (!b) return;
    draftFilter = b.dataset.state;
    renderDrafts();
  });
  $('#drafts').addEventListener('click', async (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const li = b.closest('[data-id]');
    b.disabled = true;
    try {
      const d = await api.post(`/drafts/${li.dataset.id}/${b.dataset.act}`, { note: $('input[name=note]', li)?.value || '' });
      toast(`${d.id} ${d.review_state.toLowerCase()}${d.release?.outbox_id ? ` and sent to the test outbox (${d.release.outbox_id})` : d.release?.published_to ? ` and published to the ${d.release.published_to}` : ''}.`);
      await refresh();
    } catch (err) { toast(err.message); b.disabled = false; }
  });
  $('#followups').addEventListener('submit', async (e) => {
    const form = e.target.closest('[data-reply]');
    if (!form) return;
    e.preventDefault();
    try {
      await api.post(`/followups/${form.dataset.reply}/reply`, { reply: new FormData(form).get('reply') });
      toast('Reply recorded and added to the scorecard.');
      await refresh();
    } catch (err) { toast(err.message); }
  });
  const filters = $('#explorerFilters');
  filters.addEventListener('input', () => {
    Object.assign(explorer, {
      q: $('#fq').value, city: $('#fcity').value, status: $('#fstatus').value, type: $('#ftype').value,
      agency: $('#fagency').value, gapsOnly: $('#fgaps').checked,
    });
    renderExplorer();
  });
}

main();
