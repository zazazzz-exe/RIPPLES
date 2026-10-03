// D5a Deadline escalation · D5b Typhoon event playbook · D5c Pre-season readiness.
// Automations only create drafts; release always goes through the approval policy.
const rules = require('../domain/rules');
const { enforce, SAMPLE_LABEL, SIMULATION_LABEL } = require('../domain/safeguards');
const { interimNotice } = require('./templates/notice');
const { ValidationError, NotFoundError } = require('../errors');

const FLOOD_DEFENSES = new Set(['Dike', 'Drainage', 'Pump', 'Seawall']);

function createAutomations({ repo, store, config }, { cities, drafts, outbox, advisoryCard, followUpLetter, cityBrief }) {
  // ---------- D5a: deadline escalation ----------
  function recentlyFollowedUp(projectId, today) {
    return store.get().followups.some((f) => f.project_id === projectId && rules.daysBetween(f.sent_on, today) < config.followUpCooldownDays);
  }

  function escalationCandidates(today = config.today) {
    const month = today.slice(0, 7);
    return repo.projects()
      .filter((p) => (p.status !== 'Completed' && p.deadline && p.deadline < month) || p.maintenance === 'Needs maintenance')
      .map((p) => {
        let skip = null;
        if (recentlyFollowedUp(p.project_id, today)) skip = `follow-up sent in the last ${config.followUpCooldownDays} days`;
        else if (drafts.pendingFor('letter', 'project_id', p.project_id)) skip = 'a letter draft is already awaiting approval';
        return { project_id: p.project_id, city_id: p.city_id, project: p.project, rule: p.status === 'Completed' ? 'needs maintenance' : 'overdue', skip };
      });
  }

  function runEscalation({ today = config.today, note = '', only } = {}) {
    const candidates = escalationCandidates(today).filter((c) => !only || only.includes(c.project_id));
    const created = candidates.filter((c) => !c.skip).map((c) => followUpLetter.create(c.project_id, { note }));
    return {
      automation: 'Deadline escalation (D5a)', today, approval_mode: drafts.mode,
      candidates: candidates.length, drafted: created.length, skipped: candidates.filter((c) => c.skip),
      drafts: created.map((d) => ({ id: d.id, project_id: d.project_id, review_state: d.review_state })),
      sample_label: SAMPLE_LABEL,
    };
  }

  // Reply clocks: record a reply, or mark "No reply" once the clock expires.
  function recordReply(followupId, reply) {
    if (!String(reply || '').trim()) throw new ValidationError('reply text is required');
    return store.update((s) => {
      const f = s.followups.find((x) => x.id === followupId);
      if (!f) throw new NotFoundError(`No follow-up ${followupId}`);
      Object.assign(f, { status: 'Replied', reply: String(reply).trim(), replied_on: config.today });
      return f;
    });
  }

  function checkClocks(today = config.today) {
    return store.update((s) => {
      const expired = s.followups.filter((f) => f.status === 'Awaiting reply' && today > f.clock_due);
      for (const f of expired) f.status = 'No reply';
      return { today, marked_no_reply: expired.map((f) => f.id) };
    });
  }

  function weeklySummary() {
    const f = store.get().followups;
    return {
      letters_sent: f.length,
      replies: f.filter((x) => x.status === 'Replied').length,
      no_reply: f.filter((x) => x.status === 'No reply').length,
      awaiting: f.filter((x) => x.status === 'Awaiting reply').length,
      followups: [...f].reverse(),
    };
  }

  // ---------- D5b: typhoon event playbook ----------
  function runTyphoon({ name = rules.DEMO_TYPHOON.name, track = rules.DEMO_TYPHOON.track } = {}) {
    if (!Array.isArray(track) || track.length < 2 || !track.every((pt) => Array.isArray(pt) && pt.length === 2 && pt.every(Number.isFinite))) {
      throw new ValidationError('track must be a list of at least two [lat, lon] points');
    }
    resetTyphoon();
    const simId = `sim-${Date.now().toString(36)}`;
    const signals = {};
    for (const c of repo.cities()) {
      const sig = rules.signalForDistance(rules.distanceToTrack(c.lat, c.lon, track));
      if (sig) signals[c.city_id] = sig;
    }
    store.update((s) => { s.simulation = { id: simId, name, track, signals, started_at: `${config.today} 06:00` }; });

    const affected = Object.entries(signals).map(([cityId, sig]) => {
      const city = repo.city(cityId);
      const gaps = cities.openGaps(cityId);
      const card = advisoryCard.create({
        city_id: cityId, type: 'Typhoon', level: `Signal ${sig}`, title: `Wind Signal No. ${sig}: ${name}`,
        source: 'SIMULATED · demo mode', issued: `${config.today} 06:00`, simulated: true, simulation_id: simId,
      });
      const n = interimNotice({ city, signal: sig, stormName: name, openGaps: gaps });
      const notice = drafts.create(enforce({
        kind: 'notice', city_id: cityId, city: city.city, to: outbox.testAddress(`barangay officials ${city.city}`),
        subject: n.subject, body: n.body, simulated: true, simulation_id: simId,
        sample_label: `${SAMPLE_LABEL} ${SIMULATION_LABEL}`,
      }, { kind: 'notice' }));
      const flood = gaps.filter((g) => g.gap === 'Overdue' && FLOOD_DEFENSES.has(g.type)).map((g) => g.project_id);
      const esc = flood.length ? runEscalation({ only: flood, note: `Advisory active: Wind Signal No. ${sig} (${name}, simulated)` }) : null;
      const risk = cities.risk(cityId);
      return {
        city_id: cityId, city: city.city, signal: sig, real_risk_level: risk.real_risk_level, risk_score: risk.risk_score,
        baseline_level: risk.baseline.real_risk_level, open_gaps_in_path: gaps.map((g) => g.project),
        drafts: [card.id, notice.id, ...(esc ? esc.drafts.map((d) => d.id) : [])],
      };
    });

    return {
      automation: 'Typhoon event playbook (D5b)', simulation_id: simId, name, label: SIMULATION_LABEL,
      approval_mode: drafts.mode, affected,
      awaiting_approval: drafts.list({ state: 'DRAFT' }).length,
      sample_label: SAMPLE_LABEL,
    };
  }

  // Ends the simulation and discards its unreleased drafts.
  function resetTyphoon() {
    return store.update((s) => {
      const sim = s.simulation;
      if (!sim) return { ended: null };
      const before = s.drafts.length;
      s.drafts = s.drafts.filter((d) => !(d.simulation_id === sim.id && d.review_state === 'DRAFT'));
      s.simulation = null;
      return { ended: sim.id, discarded_drafts: before - s.drafts.length };
    });
  }

  // ---------- D5c: pre-season readiness ----------
  function runReadiness({ city_ids } = {}) {
    const ids = city_ids && city_ids.length ? city_ids : repo.cities().map((c) => c.city_id);
    const created = ids.map((id) => {
      const b = cityBrief.build(id);
      return drafts.create({
        kind: 'report', city_id: id, city: b.city, title: b.title, sections: b.sections, text: b.text,
        subject: b.title,
        to: ['DRRMO', 'Sanggunian', 'local media'].map((r) => outbox.testAddress(`${r} ${b.city}`)),
        sample_label: SAMPLE_LABEL, official_line: b.official_line,
      });
    });
    return {
      automation: 'Pre-season readiness (D5c)', approval_mode: drafts.mode,
      reports: created.map((d) => ({ id: d.id, city_id: d.city_id, review_state: d.review_state })),
      sample_label: SAMPLE_LABEL,
    };
  }

  return {
    escalationCandidates, runEscalation, recordReply, checkClocks, weeklySummary,
    runTyphoon, resetTyphoon, simulation: () => store.get().simulation,
    runReadiness,
  };
}

module.exports = { createAutomations };
