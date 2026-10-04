// Record ledger service. Every project record (details, status, progress,
// deadline, maintenance and all evidence) is fingerprinted; when a fingerprint
// changes, a new block is chained on. Approval decisions and office replies are
// chained too. The ledger syncs lazily, on read, so no write path can skip it.
const { sha256, canonical, makeBlock, verifyChain } = require('../domain/ledger');
const { NotFoundError } = require('../errors');
const { SAMPLE_LABEL } = require('../domain/safeguards');

const EVENTS = { genesis: 'Ledger started', project: ['Record created', 'Record updated'], decision: 'Approval decision', reply: 'Office reply recorded' };

function createLedger({ repo, store }) {
  // The project record that is fingerprinted.
  function recordOf(projectId) {
    const p = repo.project(projectId);
    if (!p) throw new NotFoundError(`No project ${projectId}`);
    const reports = store.get().reports.filter((r) => r.project_id === projectId)
      .map((r) => ({ id: r.evidence_id, date: r.date, source: r.source, observation: r.observation, corroborated: !!r.corroborated }));
    const csv = repo.evidenceOf(projectId)
      .map((e) => ({ id: e.evidence_id, date: e.date, source: e.source, observation: e.observation, corroborated: e.corroborated === true || e.corroborated === 'yes' }));
    return {
      record: 'project', project_id: p.project_id, city_id: p.city_id, project: p.project, type: p.type, agency: p.agency,
      responsible_office: p.responsible_office, budget_php_millions: p.budget_php_millions, status: p.status,
      progress_pct: p.progress_pct, start: p.start || null, deadline: p.deadline || null, completed: p.completed || null,
      maintenance: p.maintenance || null, interim_measure: p.interim_measure || null, lccap_source: p.lccap_source || null,
      evidence: [...csv, ...reports].sort((a, b) => String(a.id).localeCompare(String(b.id))),
    };
  }

  // Records that are not projects: decided drafts and recorded replies.
  function otherRecords() {
    const s = store.get();
    const decisions = s.drafts.filter((d) => d.review_state !== 'DRAFT').map((d) => ({
      kind: 'decision', record_id: d.id,
      record: { record: 'decision', draft_id: d.id, project_id: d.project_id || null, decision: d.review_state, decided_at: d.decided_at || null, subject: d.subject || null },
    }));
    const replies = s.followups.filter((f) => f.status === 'Replied').map((f) => ({
      kind: 'reply', record_id: f.id,
      record: { record: 'reply', followup_id: f.id, project_id: f.project_id, office: f.office || null, replied_on: f.replied_on || null, reply: f.reply || null },
    }));
    return [...decisions, ...replies];
  }

  function sync() {
    const blocks = store.get().ledger || [];
    const latest = new Map(blocks.map((b) => [`${b.kind}:${b.record_id}`, b.fingerprint]));
    const add = [];
    if (!blocks.length) add.push({ kind: 'genesis', record_id: 'ripples', fingerprint: sha256('Ripples record ledger'), event: EVENTS.genesis });
    for (const p of repo.projects()) {
      const fp = sha256(canonical(recordOf(p.project_id)));
      const before = latest.get(`project:${p.project_id}`);
      if (before !== fp) add.push({ kind: 'project', record_id: p.project_id, fingerprint: fp, event: EVENTS.project[before ? 1 : 0] });
    }
    for (const r of otherRecords()) {
      const fp = sha256(canonical(r.record));
      if (latest.get(`${r.kind}:${r.record_id}`) !== fp) add.push({ kind: r.kind, record_id: r.record_id, fingerprint: fp, event: EVENTS[r.kind] });
    }
    if (add.length) {
      const at = new Date().toISOString();
      store.update((s) => {
        s.ledger ||= [];
        let prev = s.ledger[s.ledger.length - 1];
        for (const a of add) { prev = makeBlock(prev, { at, ...a }); s.ledger.push(prev); }
      });
    }
    return store.get().ledger;
  }

  const label = (b) => (b.kind === 'project' ? repo.project(b.record_id)?.project : null);

  function overview({ offset = 0, limit = 25, all = false } = {}) {
    const blocks = sync();
    const check = verifyChain(blocks);
    const newest = [...blocks].reverse();
    const counts = {};
    for (const b of blocks) counts[b.kind] = (counts[b.kind] || 0) + 1;
    return {
      sample_label: SAMPLE_LABEL,
      explanation: 'Each block stores a SHA-256 fingerprint of one record and the hash of the block before it, so any quiet edit to a past record breaks the chain. Used for record integrity only: no currency, wallets or payments.',
      chain: check, total: blocks.length, counts,
      records_tracked: new Set(blocks.filter((b) => b.kind === 'project').map((b) => b.record_id)).size,
      blocks: (all ? newest : newest.slice(Number(offset) || 0, (Number(offset) || 0) + Math.min(Number(limit) || 25, 200)))
        .map((b) => ({ ...b, label: label(b) })),
    };
  }

  // One project's record, its current fingerprint and its block history.
  function integrity(projectId) {
    const blocks = sync();
    const record = canonical(recordOf(projectId));
    const fingerprint = sha256(record);
    const history = blocks.filter((b) => b.kind === 'project' && b.record_id === projectId);
    const latest = history[history.length - 1] || null;
    return {
      project_id: projectId, record, fingerprint, matches: !!latest && latest.fingerprint === fingerprint,
      latest, previous_block: latest && latest.height > 0 ? blocks[latest.height - 1] : null,
      history, chain: verifyChain(blocks),
    };
  }

  return { sync, overview, integrity, recordOf };
}

module.exports = { createLedger };
