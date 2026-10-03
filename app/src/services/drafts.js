// Draft lifecycle: create → (approve | reject) → release. The approval policy
// (domain/approval.js) decides when a draft may be released (S2).
const rules = require('../domain/rules');
const { NotFoundError, ConflictError, ValidationError } = require('../errors');
const { ApprovalError } = require('../domain/approval');

const PREFIX = { advisory: 'adv', letter: 'ltr', notice: 'ntc', report: 'rpt' };

function createDraftService({ store, config, policy }, { outbox }) {
  const find = (id) => store.get().drafts.find((d) => d.id === id);

  function replace(updated) {
    store.update((s) => { s.drafts = s.drafts.map((d) => (d.id === updated.id ? updated : d)); });
    return updated;
  }

  // What "release" means for each kind of draft.
  const RELEASE = {
    advisory: (d) => ({ published_to: `City Page: ${d.city}` }),
    letter: (d) => {
      const msg = outbox.send({ to: d.to, subject: d.subject, body: d.body, kind: 'letter', draft_id: d.id, city_id: d.city_id, simulated: d.simulated });
      const entry = store.update((s) => {
        const e = {
          id: `fu-${String(s.followups.length + 1).padStart(4, '0')}`,
          project_id: d.project_id, city_id: d.city_id, office: d.office, draft_id: d.id, outbox_id: msg.id,
          sent_on: config.today,
          clock_due: rules.addWorkingDays(config.today, config.replyClockWorkingDays),
          status: 'Awaiting reply', reply: null,
          anchor_record: 'skipped: Ripples backend not connected (status change logged)',
        };
        s.followups.push(e);
        return e;
      });
      return { outbox_id: msg.id, followup_id: entry.id, clock_due: entry.clock_due };
    },
    notice: (d) => ({ outbox_id: outbox.send({ to: d.to, subject: d.subject, body: d.body, kind: 'notice', draft_id: d.id, city_id: d.city_id, simulated: d.simulated }).id }),
    report: (d) => ({
      outbox_id: outbox.send({ to: d.to, subject: d.subject, body: d.text, kind: 'report', draft_id: d.id, city_id: d.city_id }).id,
      published_to: `City Page: ${d.city}`,
    }),
  };

  function release(draft) {
    try { policy.assertReleasable(draft); } catch (e) { throw new ConflictError(e.message); }
    const result = RELEASE[draft.kind](draft);
    return replace({ ...draft, released_at: new Date().toISOString(), release: result });
  }

  function create(draft) {
    if (!PREFIX[draft.kind]) throw new ValidationError(`Unknown draft kind: ${draft.kind}`);
    const full = store.update((s) => {
      s.seq += 1;
      const d = {
        id: `${PREFIX[draft.kind]}-${String(s.seq).padStart(4, '0')}`,
        ...draft,
        review_state: policy.initialState(),
        created_at: new Date().toISOString(),
      };
      s.drafts.push(d);
      return d;
    });
    return policy.canRelease(full) ? release(full) : full;
  }

  function decide(id, decision, note = '') {
    const d = find(id);
    if (!d) throw new NotFoundError(`No draft ${id}`);
    let updated;
    try { updated = policy.decide(d, decision, { note, at: new Date().toISOString() }); }
    catch (e) { throw e instanceof ApprovalError ? new ConflictError(e.message) : e; }
    replace(updated);
    return policy.canRelease(updated) ? release(updated) : updated;
  }

  function list({ state, kind, city_id } = {}) {
    return store.get().drafts
      .filter((d) => (!state || d.review_state === state) && (!kind || d.kind === kind) && (!city_id || d.city_id === city_id))
      .slice().reverse();
  }

  function get(id) {
    const d = find(id);
    if (!d) throw new NotFoundError(`No draft ${id}`);
    return d;
  }

  const pendingFor = (kind, key, value) => store.get().drafts.some((d) => d.kind === kind && d[key] === value && d.review_state === 'DRAFT');

  return { create, decide, list, get, pendingFor, mode: policy.mode };
}

module.exports = { createDraftService };
