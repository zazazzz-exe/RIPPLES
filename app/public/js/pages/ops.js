// Climate Scorecard, organized in tabs: Overview, Cities, Projects, Follow-ups
// and Approvals. The open tab is kept in the URL hash (/ops#projects).
import { api } from '../api.js';
import { html, mount, initShell, riskBadge, statusBadge, gapBadge, stateBadge, pct, month, showError, toast, $ } from '../ui.js';

let sc;
let followups;
let ledger;
let draftFilter = 'DRAFT';
let draftsAwaiting = 0;
const TABS = [['overview', 'Overview'], ['cities', 'Cities'], ['projects', 'Projects'], ['followups', 'Follow-ups'], ['approvals', 'Approvals']];
const cityView = { group: '', sort: 'risk' };
const explorer = { city: '', status: '', type: '', agency: '', gapsOnly: false, q: '', sort: 'gaps', page: 0 };
const PAGE = 25;
const officeView = { all: false };

const KIND_LABEL = { letter: 'Follow-up letter' };
const RISK_N = { Low: 1, Moderate: 2, High: 3, Critical: 4 };
const cityName = () => Object.fromEntries(sc.cities.map((c) => [c.city_id, c.city]));

/* ---------- tabs ---------- */
function currentTab() {
  const h = location.hash.slice(1);
  return TABS.some(([k]) => k === h) ? h : 'overview';
}
function renderTabs() {
  const counts = { cities: sc.cities.length, projects: sc.projects.length, followups: followups ? followups.letters_sent : null, approvals: draftsAwaiting };
  const tab = currentTab();
  mount('#tabs', TABS.map(([k, l]) => html`<a role="tab" href="#${k}" id="tab-${k}" aria-controls="panel-${k}" aria-selected="${k === tab}" class="${k === tab ? 'on' : ''}">${l}${counts[k] ? html` <b class="${k === 'approvals' ? 'hot' : ''}">${counts[k]}</b>` : ''}</a>`));
  for (const [k] of TABS) $(`#panel-${k}`).hidden = k !== tab;
}

/* ---------- headline numbers ---------- */
function renderKpis() {
  const k = sc.kpis;
  mount('#kpis', html`
    <section class="kpi-group" aria-label="Commitments">
      <h2>Commitments</h2>
      <div class="kpis kpis-4">
        <div class="kpi"><b>${k.commitments_tracked}</b><span>tracked in ${sc.cities.length} cities</span></div>
        <div class="kpi"><b class="error">${k.open_gaps}</b><span>open gaps</span></div>
        <div class="kpi"><b>${k.overdue}</b><span>overdue</span></div>
        <div class="kpi"><b>${k.needs_maintenance}</b><span>need maintenance</span></div>
      </div>
    </section>
    <section class="kpi-group" aria-label="Accountability">
      <h2>Accountability</h2>
      <div class="kpis kpis-3">
        <div class="kpi"><b>${k.cities_high_or_critical}</b><span>cities High or Critical</span></div>
        <div class="kpi"><b>${k.offices_without_reply}</b><span>offices with unanswered follow-ups</span></div>
        <a class="kpi kpi-link" href="#approvals"><b>${draftsAwaiting}</b><span>drafts awaiting approval ›</span></a>
      </div>
    </section>`);
}

/* ---------- overview ---------- */
function renderOverview() {
  const attention = sc.cities.slice(0, 5);
  const max = Math.max(...sc.gaps_by_agency.map((a) => a.total), 1);
  mount('#panel-overview', html`
    <div class="cols-2">
      <section class="card">
        <div class="row between"><h2>Cities needing attention</h2><a class="small" href="#cities">All ${sc.cities.length} cities ›</a></div>
        <ol class="rank">${attention.map((c, i) => html`<li>
          <span class="rank-n">${i + 1}</span>
          <a class="rank-name" href="/map#/city/${c.city_id}">${c.city}</a>
          ${riskBadge(c.real_risk_level)}
          <span class="small muted">${c.open_gaps} gap${c.open_gaps === 1 ? '' : 's'} · ${pct(c.promises_kept_pct)} kept</span></li>`)}</ol>
        <p class="small muted">${sc.explanations.cities}</p>
      </section>
      <section class="card">
        <h2>Open gaps by agency</h2>
        <div class="legend"><span><i class="dot" style="background:var(--crit)"></i>Overdue</span><span><i class="dot" style="background:var(--maint)"></i>Needs maintenance</span></div>
        <div class="bars" style="margin-top:10px">${sc.gaps_by_agency.map((a) => html`
          <div class="bar-row"><div class="row between small"><span>${a.agency}</span><span class="mono">${a.Overdue} + ${a['Needs maintenance']} = ${a.total}</span></div>
          <div class="bar" role="img" aria-label="${a.agency}: ${a.Overdue} overdue, ${a['Needs maintenance']} need maintenance">
            <i class="ov" style="width:${(a.Overdue / max) * 100}%"></i><i class="nm" style="width:${(a['Needs maintenance'] / max) * 100}%"></i></div></div>`)}</div>
        <p class="small muted">${sc.explanations.gaps_by_agency}</p>
      </section>
      <section class="card">
        <div class="row between"><h2>Follow-up letters</h2><a class="small" href="#followups">Open log ›</a></div>
        ${followups ? html`<div class="kpis kpis-4 compact">
          <div class="kpi"><b>${followups.letters_sent}</b><span>sent</span></div>
          <div class="kpi"><b>${followups.awaiting}</b><span>awaiting reply</span></div>
          <div class="kpi"><b>${followups.replies}</b><span>replied</span></div>
          <div class="kpi"><b>${followups.no_reply}</b><span>no reply</span></div></div>` : ''}
        <p class="small muted">Each approved letter starts a 15-working-day reply clock.</p>
      </section>
      <section class="card ledger-card">
        <div class="row between"><h2>Record integrity</h2><a class="small" href="/ledger">Open ledger ›</a></div>
        ${ledger ? html`<p class="ledger-line"><b class="${ledger.chain.valid ? 'ok' : 'error'}">${ledger.chain.valid ? '✓ Chain intact' : '✕ Chain broken'}</b> · ${ledger.total} blocks · ${ledger.records_tracked} project records fingerprinted</p>
          <p class="small muted mono">Latest block #${ledger.chain.height} · ${String(ledger.chain.head_hash).slice(0, 16)}…</p>` : ''}
        <p class="small muted">Every project record is hashed with SHA-256 and chained in a blockchain-style ledger, so past records can't be quietly edited. Record keeping only: no currency, wallets or payments.</p>
      </section>
      <section class="card">
        <h2>Most thumbs down</h2>
        ${sc.most_down.length ? html`<ol class="list" style="padding:0;list-style:none">${sc.most_down.map((m) => html`<li class="item">
          <div class="row between"><a class="title" href="/map#/project/${m.project_id}">${m.project}</a><span class="mono">▲ ${m.up} · <span class="error">▼ ${m.down}</span></span></div>
          <div class="meta">${cityName()[m.city_id] || m.city_id}${m.top_reason ? ` · most given reason: ${m.top_reason}` : ''}</div></li>`)}</ol>`
          : html`<p class="empty">No thumbs down yet. Ratings appear here as people rate projects on the map.</p>`}
        <p class="small muted">${sc.explanations.most_down}</p>
      </section>
    </div>`);
}

/* ---------- cities ---------- */
function renderCities() {
  const groups = [...new Set(sc.cities.map((c) => c.island_group))].filter(Boolean);
  const sorters = {
    risk: (a, b) => b.risk_score - a.risk_score || a.city.localeCompare(b.city),
    gaps: (a, b) => b.open_gaps - a.open_gaps || a.city.localeCompare(b.city),
    kept: (a, b) => (a.promises_kept_pct ?? 101) - (b.promises_kept_pct ?? 101) || a.city.localeCompare(b.city),
    name: (a, b) => a.city.localeCompare(b.city),
  };
  const rows = sc.cities.filter((c) => !cityView.group || c.island_group === cityView.group).sort(sorters[cityView.sort]);
  const byLevel = Object.keys(RISK_N).reverse().map((l) => [l, sc.cities.filter((c) => c.real_risk_level === l).length]);
  mount('#panel-cities', html`
    <section class="card">
      <div class="toolbar">
        <div class="chips" role="group" aria-label="Island group">${[['', 'All'], ...groups.map((g) => [g, g])].map(([v, l]) => html`<button class="chip" type="button" data-group="${v}" aria-pressed="${v === cityView.group}">${l}</button>`)}</div>
        <label class="inline">Sort <select id="citySort">${[['risk', 'Highest risk'], ['gaps', 'Most open gaps'], ['kept', 'Fewest promises kept'], ['name', 'City A–Z']].map(([v, l]) => html`<option value="${v}" ${v === cityView.sort ? html`selected` : ''}>${l}</option>`)}</select></label>
      </div>
      <p class="small muted">${byLevel.map(([l, n]) => `${n} ${l}`).join(' · ')}</p>
      <table class="table"><thead><tr><th>City</th><th>Island group</th><th>Risk</th><th>Score</th><th>Open gaps</th><th>Promises kept</th><th>Maintained</th><th>Follow-ups answered</th></tr></thead>
      <tbody>${rows.map((c) => html`<tr>
        <td data-label="City"><a href="/map#/city/${c.city_id}">${c.city}</a></td>
        <td data-label="Island group">${c.island_group}</td>
        <td data-label="Risk">${riskBadge(c.real_risk_level)}</td>
        <td data-label="Score" class="mono">${c.hazard_points}+${c.gap_points}=${c.risk_score}</td>
        <td data-label="Open gaps"><a href="#projects" data-city-gaps="${c.city_id}">${c.open_gaps}</a></td>
        <td data-label="Promises kept">${pct(c.promises_kept_pct)}</td>
        <td data-label="Maintained">${pct(c.maintained_pct)}</td>
        <td data-label="Follow-ups answered">${c.followups_replied}/${c.followups_sent}</td></tr>`)}</tbody></table>
      <p class="small muted">${sc.explanations.cities} Click an open-gap count to see those projects.</p>
    </section>`);
}

/* ---------- projects ---------- */
function filteredProjects() {
  const q = explorer.q.trim().toLowerCase();
  const names = cityName();
  const rows = sc.projects.filter((p) => (!explorer.city || p.city_id === explorer.city) && (!explorer.status || p.status === explorer.status)
    && (!explorer.type || p.type === explorer.type) && (!explorer.agency || p.agency === explorer.agency)
    && (!explorer.gapsOnly || p.gap)
    && (!q || [p.project, names[p.city_id], p.type, p.agency, p.responsible_office].join(' ').toLowerCase().includes(q)));
  const sorters = {
    gaps: (a, b) => (!!b.gap - !!a.gap) || (a.gap === 'Overdue' ? -1 : 0) - (b.gap === 'Overdue' ? -1 : 0) || String(a.deadline).localeCompare(String(b.deadline)),
    deadline: (a, b) => String(a.deadline).localeCompare(String(b.deadline)),
    progress: (a, b) => a.progress_pct - b.progress_pct,
    city: (a, b) => names[a.city_id].localeCompare(names[b.city_id]) || a.project.localeCompare(b.project),
    down: (a, b) => b.rating_down - a.rating_down || a.project.localeCompare(b.project),
  };
  return rows.sort(sorters[explorer.sort]);
}
function renderProjectFilters() {
  const opts = (key) => [...new Set(sc.projects.map((p) => p[key]))].sort();
  const names = cityName();
  const sel = (id, label, key, list, fmt = (v) => v) => html`<label>${label} <select id="${id}"><option value="">All</option>${list.map((v) => html`<option value="${v}" ${v === explorer[key] ? html`selected` : ''}>${fmt(v)}</option>`)}</select></label>`;
  mount('#projectFilters', html`
    <label class="grow">Search <input id="fq" type="search" placeholder="Project, city, office…" value="${explorer.q}"></label>
    ${sel('fcity', 'City', 'city', sc.cities.map((c) => c.city_id).sort((a, b) => names[a].localeCompare(names[b])), (v) => names[v])}
    ${sel('fstatus', 'Status', 'status', opts('status'))}
    ${sel('ftype', 'Type', 'type', opts('type'))}
    ${sel('fagency', 'Agency', 'agency', opts('agency'))}
    <label>Sort <select id="fsort">${[['gaps', 'Open gaps first'], ['deadline', 'Deadline'], ['progress', 'Least progress'], ['city', 'City'], ['down', 'Most thumbs down']].map(([v, l]) => html`<option value="${v}" ${v === explorer.sort ? html`selected` : ''}>${l}</option>`)}</select></label>
    <label class="check"><input id="fgaps" type="checkbox" ${explorer.gapsOnly ? html`checked` : ''}> Open gaps only</label>
    <button class="btn" type="button" id="fclear">Clear</button>`);
}
function renderProjects() {
  const rows = filteredProjects();
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  explorer.page = Math.min(explorer.page, pages - 1);
  const shown = rows.slice(explorer.page * PAGE, (explorer.page + 1) * PAGE);
  const names = cityName();
  mount('#projectTable', html`
    <div class="row between"><p class="small muted" style="margin:0">${rows.length} of ${sc.projects.length} commitments${rows.length > PAGE ? ` · showing ${explorer.page * PAGE + 1}–${explorer.page * PAGE + shown.length}` : ''}</p>${pager(pages)}</div>
    ${shown.length ? html`<table class="table"><thead><tr><th>Project</th><th>City</th><th>Type</th><th>Status</th><th>Progress</th><th>Deadline</th><th>Gap</th><th>Rating</th></tr></thead>
    <tbody>${shown.map((p) => html`<tr>
      <td data-label="Project"><a href="/map#/project/${p.project_id}">${p.project}</a><div class="meta small muted">${p.agency}</div>${p.gap ? html`<div class="small interim">Interim: ${p.interim_measure}</div>` : ''}</td>
      <td data-label="City">${names[p.city_id]}</td>
      <td data-label="Type">${p.type}</td>
      <td data-label="Status">${statusBadge(p.status)}</td>
      <td data-label="Progress"><span class="prog"><i style="width:${p.progress_pct}%"></i></span> <span class="mono small">${p.progress_pct}%</span></td>
      <td data-label="Deadline">${month(p.deadline)}</td>
      <td data-label="Gap">${gapBadge(p.gap) || '—'}</td>
      <td data-label="Rating" class="mono">${p.rating_up || p.rating_down ? `▲ ${p.rating_up} · ▼ ${p.rating_down}` : '—'}</td></tr>`)}</tbody></table>
    <div class="row" style="justify-content:flex-end;margin-top:10px">${pager(pages)}</div>`
    : html`<p class="empty">No commitments match these filters.</p>`}`);
}
function pager(pages) {
  if (pages <= 1) return '';
  return html`<div class="pager"><button class="btn" type="button" data-page="${explorer.page - 1}" ${explorer.page === 0 ? html`disabled` : ''}>‹ Prev</button>
    <span class="small mono">${explorer.page + 1} / ${pages}</span>
    <button class="btn" type="button" data-page="${explorer.page + 1}" ${explorer.page >= pages - 1 ? html`disabled` : ''}>Next ›</button></div>`;
}

/* ---------- follow-ups ---------- */
function renderFollowups() {
  const f = followups;
  const offices = officeView.all ? sc.followup_accountability : sc.followup_accountability.filter((o) => o.unanswered > 0);
  mount('#panel-followups', html`
    <div class="cols-2">
      <section class="card">
        <h2>Letter log</h2>
        <div class="kpis kpis-4 compact">
          <div class="kpi"><b>${f.letters_sent}</b><span>sent</span></div>
          <div class="kpi"><b>${f.awaiting}</b><span>awaiting reply</span></div>
          <div class="kpi"><b>${f.replies}</b><span>replied</span></div>
          <div class="kpi"><b>${f.no_reply}</b><span>no reply</span></div>
        </div>
        ${f.followups.length ? html`<ul class="list" style="margin-top:10px">${f.followups.map((x) => html`
          <li class="item"><div class="row between"><a class="title" href="/map#/project/${x.project_id}">${x.project_id}</a><span class="badge ${x.status === 'Replied' ? 'state-APPROVED' : x.status === 'No reply' ? 'gap-Overdue' : 'state-DRAFT'}">${x.status}</span></div>
            <div class="meta">${x.office} · sent ${x.sent_on} · reply due ${x.clock_due}</div>
            ${x.reply ? html`<p class="small">Reply: ${x.reply}</p>` : ''}
            ${x.status === 'Awaiting reply' ? html`<form class="row" data-reply="${x.id}" style="margin-top:6px"><input name="reply" placeholder="Paste the office's reply" required style="flex:1;min-width:180px"><button class="btn" type="submit">Record reply</button></form>` : ''}
          </li>`)}</ul>` : html`<p class="empty">No letters sent from this app yet. Approve a follow-up letter draft to start a reply clock.</p>`}
      </section>
      <section class="card">
        <div class="row between"><h2>Accountability by office</h2>
          <label class="check small"><input type="checkbox" id="officeAll" ${officeView.all ? html`checked` : ''}> Show offices with all replies in</label></div>
        ${offices.length ? html`<table class="table"><thead><tr><th>Responsible office</th><th>Sent</th><th>Replied</th><th>Unanswered</th></tr></thead>
          <tbody>${offices.map((o) => html`<tr>
            <td data-label="Office">${o.office}<div class="meta small muted">${o.agency}</div></td><td data-label="Sent">${o.sent}</td><td data-label="Replied">${o.replied}</td>
            <td data-label="Unanswered">${o.unanswered ? html`<b class="error">${o.unanswered}</b>` : '0'}</td></tr>`)}</tbody></table>`
          : html`<p class="empty">Every office has replied to its follow-ups.</p>`}
        <p class="small muted">${sc.explanations.followup_accountability} ${officeView.all ? '' : `Showing ${offices.length} of ${sc.followup_accountability.length} offices with unanswered letters.`}</p>
      </section>
    </div>`);
}

/* ---------- approvals ---------- */
function draftBody(d) {
  const to = Array.isArray(d.to) ? d.to.join(', ') : d.to;
  return html`<p class="small muted">To: <span class="mono">${to}</span></p><div class="preview">${d.kind === 'report' ? d.text : `${d.subject}\n\n${d.body}`}</div>`;
}
async function renderDrafts() {
  const [{ approval_mode: mode, drafts }, awaiting] = await Promise.all([
    api.get(`/drafts${draftFilter ? `?state=${draftFilter}` : ''}`),
    draftFilter === 'DRAFT' ? null : api.get('/drafts?state=DRAFT'),
  ]);
  draftsAwaiting = (awaiting || { drafts }).drafts.length;
  mount('#panel-approvals', html`
    <section class="card stack">
      <div class="row between">
        <h2 style="margin:0">Drafts ${draftFilter === 'DRAFT' ? 'awaiting approval' : ''}</h2>
        <span class="badge">Approval mode: ${mode}</span>
      </div>
      <p class="small muted">${mode === 'required' ? 'Nothing is published or sent until a person approves it here (safeguard S2). Approved letters go to a test outbox only.' : 'Auto mode: drafts are released immediately. The human approval step (S2) is off.'}</p>
      <div class="chips" role="group" aria-label="Filter drafts">${[['DRAFT', 'Awaiting'], ['APPROVED', 'Approved'], ['REJECTED', 'Rejected'], ['', 'All']].map(([v, l]) => html`<button class="chip" type="button" data-state="${v}" aria-pressed="${v === draftFilter}">${l}</button>`)}</div>
      <ul class="list" id="drafts">${drafts.length ? drafts.map((d) => html`
        <li class="item" data-id="${d.id}">
          <details>
            <summary class="row between" style="cursor:pointer">
              <span><span class="title">${KIND_LABEL[d.kind]}</span> <span class="meta">· ${d.city}${d.project ? ` · ${d.project}` : ''} · ${d.id}</span></span>
              <span class="row">${stateBadge(d.review_state)}</span>
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
        </li>`) : html`<li class="empty">${draftFilter === 'DRAFT' ? 'No drafts are waiting. Open a project on the map and choose “Draft follow-up letter”.' : 'Nothing here.'}</li>`}</ul>
    </section>`);
}

/* ---------- load and wire up ---------- */
async function refresh() {
  [sc, followups, ledger] = await Promise.all([api.get('/scorecard'), api.get('/followups'), api.get('/ledger?limit=1')]);
  await renderDrafts();
  renderKpis();
  renderOverview();
  renderCities();
  renderProjectFilters();
  renderProjects();
  renderFollowups();
  renderTabs();
}

async function main() {
  try {
    initShell('ops');
    await refresh();
  } catch (e) {
    return showError('#page', e);
  }

  addEventListener('hashchange', () => { renderTabs(); scrollTo({ top: $('#tabs').offsetTop - 12 }); });

  // Approvals
  $('#panel-approvals').addEventListener('click', async (e) => {
    const f = e.target.closest('[data-state]');
    if (f) { draftFilter = f.dataset.state; await renderDrafts(); return; }
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

  // Follow-ups
  $('#panel-followups').addEventListener('submit', async (e) => {
    const form = e.target.closest('[data-reply]');
    if (!form) return;
    e.preventDefault();
    try {
      await api.post(`/followups/${form.dataset.reply}/reply`, { reply: new FormData(form).get('reply') });
      toast('Reply recorded and added to the scorecard.');
      await refresh();
    } catch (err) { toast(err.message); }
  });
  $('#panel-followups').addEventListener('change', (e) => {
    if (e.target.id === 'officeAll') { officeView.all = e.target.checked; renderFollowups(); }
  });

  // Cities
  $('#panel-cities').addEventListener('click', (e) => {
    const g = e.target.closest('[data-group]');
    if (g) { cityView.group = g.dataset.group; renderCities(); return; }
    const gaps = e.target.closest('[data-city-gaps]');
    if (gaps) {
      Object.assign(explorer, { city: gaps.dataset.cityGaps, status: '', type: '', agency: '', q: '', gapsOnly: true, page: 0 });
      renderProjectFilters();
      renderProjects();
    }
  });
  $('#panel-cities').addEventListener('change', (e) => {
    if (e.target.id === 'citySort') { cityView.sort = e.target.value; renderCities(); }
  });

  // Projects
  const readFilters = () => Object.assign(explorer, {
    q: $('#fq').value, city: $('#fcity').value, status: $('#fstatus').value, type: $('#ftype').value,
    agency: $('#fagency').value, sort: $('#fsort').value, gapsOnly: $('#fgaps').checked, page: 0,
  });
  $('#projectFilters').addEventListener('input', () => { readFilters(); renderProjects(); });
  $('#projectFilters').addEventListener('click', (e) => {
    if (e.target.id !== 'fclear') return;
    Object.assign(explorer, { city: '', status: '', type: '', agency: '', gapsOnly: false, q: '', sort: 'gaps', page: 0 });
    renderProjectFilters();
    renderProjects();
  });
  $('#projectTable').addEventListener('click', (e) => {
    const b = e.target.closest('[data-page]');
    if (!b) return;
    explorer.page = Number(b.dataset.page);
    renderProjects();
    $('#panel-projects').scrollIntoView({ block: 'start' });
  });
}

main();
