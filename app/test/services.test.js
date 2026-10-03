const test = require('node:test');
const assert = require('node:assert/strict');
const baseConfig = require('../src/config');
const { createServices } = require('../src/services');
const safeguards = require('../src/domain/safeguards');

const make = (approvalMode = 'required') => createServices({ ...baseConfig, approvalMode }, { persist: false });

test('D2 scorecard: open-gap total equals a hand count of projects.csv', () => {
  const s = make();
  const sc = s.scorecard.build();
  assert.equal(sc.kpis.commitments_tracked, 32);
  assert.equal(sc.kpis.open_gaps, 12);
  assert.equal(sc.kpis.overdue, 8);
  assert.equal(sc.kpis.needs_maintenance, 4);
  assert.equal(sc.kpis.cities_high_or_critical, 3);
  assert.deepEqual(sc.cities.map((c) => c.risk_score), [...sc.cities.map((c) => c.risk_score)].sort((a, b) => b - a));
  assert.match(sc.sample_label, /Sample/);
});

test('D4a advisory card for Malabon: four sections, official line, DRAFT, never "safe"', () => {
  const s = make();
  const d = s.advisoryCard.create({ city_id: 'malabon', type: 'Flood', level: 'Advisory' });
  assert.equal(d.review_state, 'DRAFT');
  assert.equal(d.hazard_points, 2);
  assert.deepEqual(Object.keys(d.sections), ['households', 'schools', 'farmers', 'barangay_officials']);
  assert.match(d.sections.households, /Malabon National High School/);
  assert.match(d.sections.barangay_officials, /Tullahan River wall repair/);
  assert.equal(d.official_line, safeguards.OFFICIAL_LINE);
  assert.deepEqual(safeguards.check(d, { kind: 'advisory' }), []);
  assert.throws(() => s.advisoryCard.create({ city_id: 'malabon', type: 'Flood', level: 'Purple' }), /level for Flood/);
  assert.equal(s.advisoryCard.preview({ city_id: 'davao', type: 'Heat', heat_index: 45 }).level, 'Danger');
});

test('every advisory type and level produces a card that passes the safeguards', () => {
  const s = make();
  const rules = require('../src/domain/rules');
  for (const key of Object.keys(rules.ADVISORY_POINTS)) {
    const [type, level] = key.split(':');
    for (const city of ['malabon', 'davao']) {
      const card = s.advisoryCard.preview({ city_id: city, type, level });
      assert.deepEqual(safeguards.check(card, { kind: 'advisory' }), [], `${key} ${city}`);
    }
  }
});

test('D4b letter for Malabon river wall: neutral, three requests, hazard sentence', () => {
  const s = make();
  const d = s.followUpLetter.create('mal-wall');
  assert.equal(d.review_state, 'DRAFT');
  assert.match(d.body, /1\. Current progress and a revised completion date/);
  assert.match(d.body, /2\. Interim measures/);
  assert.match(d.body, /3\. A copy of the latest progress report.*Executive Order No\. 2, s\. 2016/);
  assert.match(d.body, /"No reply"/);
  assert.equal(d.hazard_sentence_included, true);
  assert.match(d.to, /@test\.ripples\.invalid$/);
  assert.deepEqual(safeguards.check(d, { kind: 'letter' }), []);
  // Davao has only a Caution heat advisory (0 points) → no hazard sentence.
  assert.equal(s.followUpLetter.preview('dav-floodwall').hazard_sentence_included, false);
});

test('approval gate: nothing reaches the outbox until a person approves (S2)', () => {
  const s = make('required');
  const d = s.followUpLetter.create('mal-wall');
  assert.equal(s.outbox.list().length, 0);
  const approved = s.drafts.decide(d.id, 'approve');
  assert.equal(approved.review_state, 'APPROVED');
  assert.equal(s.outbox.list().length, 1);
  assert.match(s.outbox.list()[0].to[0], /@test\.ripples\.invalid$/);
  assert.equal(s.automations.weeklySummary().awaiting, 1);
  assert.throws(() => s.drafts.decide(d.id, 'reject'), /already APPROVED/);

  const r = s.followUpLetter.create('dag-dike');
  s.drafts.decide(r.id, 'reject', 'Wrong office');
  assert.equal(s.outbox.list().length, 1);
});

test('auto mode releases immediately (one config value)', () => {
  const s = make('auto');
  const d = s.followUpLetter.create('mal-wall');
  assert.equal(d.review_state, 'APPROVED');
  assert.equal(s.outbox.list().length, 1);
});

test('D4c triage: lone report unverified, corroborated with matches, never stores identity', () => {
  const s = make();
  const lone = s.reportTriage.triage({ project_id: 'mar-green', report_type: 'status update', text: 'Several new trees have died along the bikeway.', photo_description: 'dead trees', name: 'Juan', phone: '0917' });
  assert.equal(lone.status, 'unverified');
  assert.ok(!('name' in lone) && !('phone' in lone));
  assert.ok(!JSON.stringify(s.reportTriage.list()).includes('Juan'));

  const backed = s.reportTriage.triage({ project_id: 'mal-wall', report_type: 'dispute', text: 'The gap in the wall is still open.', photo_description: 'river wall with sandbags' });
  assert.equal(backed.status, 'corroborated');

  const mismatch = s.reportTriage.triage({ project_id: 'mal-wall', report_type: 'dispute', text: 'Not finished.', photo_description: 'a basketball court' });
  assert.equal(mismatch.status, 'unverified');
  assert.ok(mismatch.flags.length > 0);

  const dup = s.reportTriage.triage({ project_id: 'mal-wall', report_type: 'dispute', text: 'The gap in the wall is still open.', photo_description: 'river wall' });
  assert.ok(dup.flags.includes('Identical wording to an earlier report'));
});

test('D5a escalation selects the 12 candidates and respects the 30-day cooldown', () => {
  const s = make();
  const first = s.automations.runEscalation();
  assert.equal(first.candidates, 12);
  assert.equal(first.drafted, 12);
  assert.equal(s.outbox.list().length, 0);
  const again = s.automations.runEscalation();
  assert.equal(again.drafted, 0); // drafts already pending
  const mal = first.drafts.find((d) => d.project_id === 'mal-wall');
  s.drafts.decide(mal.id, 'approve');
  const skip = s.automations.escalationCandidates().find((c) => c.project_id === 'mal-wall');
  assert.match(skip.skip, /last 30 days/);
  const clocks = s.automations.checkClocks('2026-11-30');
  assert.equal(clocks.marked_no_reply.length, 1);
  assert.equal(s.automations.weeklySummary().no_reply, 1);
});

test('D5b typhoon: Malabon goes Critical, drafts wait for approval, reset restores baseline', () => {
  const s = make();
  const run = s.automations.runTyphoon();
  const mal = run.affected.find((a) => a.city_id === 'malabon');
  assert.equal(mal.signal, 3);
  assert.equal(mal.real_risk_level, 'Critical');
  assert.equal(s.outbox.list().length, 0);
  assert.ok(run.awaiting_approval > 0);
  // Approved simulated card shows on the City Page while the simulation runs.
  const card = s.drafts.list({ kind: 'advisory', city_id: 'malabon' })[0];
  assert.equal(s.cities.page('malabon').advisories.some((a) => a.id === card.id), false);
  s.drafts.decide(card.id, 'approve');
  assert.equal(s.cities.page('malabon').advisories[0].id, card.id);
  s.automations.resetTyphoon();
  assert.equal(s.cities.risk('malabon').real_risk_level, 'High');
  assert.equal(s.cities.page('malabon').advisories.some((a) => a.id === card.id), false);
  assert.equal(s.drafts.list({ state: 'DRAFT' }).length, 0);
});

test('D3/D5c readiness report for every city, released only after approval', () => {
  const s = make();
  const brief = s.cityBrief.build('malabon');
  assert.equal(brief.sections.length, 5);
  assert.match(brief.text, /No live PAGASA seasonal outlook is connected/);
  const run = s.automations.runReadiness();
  assert.equal(run.reports.length, 8);
  assert.equal(s.cities.page('malabon').readiness_reports.length, 0);
  s.drafts.decide(run.reports.find((r) => r.city_id === 'malabon').id, 'approve');
  assert.equal(s.cities.page('malabon').readiness_reports.length, 1);
  assert.equal(s.outbox.list()[0].to.length, 3);
});

test('D6 assistant answers the canonical questions with citations', () => {
  const s = make();
  const gaps = s.assistant.ask("Which open gaps raise Malabon's risk this season?");
  assert.equal(gaps.intent, 'gaps');
  assert.match(gaps.text, /2 open gaps/);
  assert.ok(gaps.citations.includes('projects.csv:mal-wall'));

  const silent = s.assistant.ask('Which offices have not replied to follow-ups?');
  assert.equal(silent.intent, 'no_reply');
  assert.ok(silent.bullets.length > 0);

  const draft = s.assistant.ask('Draft the household section for an orange rainfall warning in Legazpi.');
  assert.equal(draft.intent, 'draft_guidance');
  assert.match(draft.bullets[0], /^households:/);

  const live = s.assistant.ask('Is there a typhoon right now in Davao?');
  assert.equal(live.intent, 'live');
  assert.equal(s.assistant.ask('hello').intent, 'fallback');
  for (const a of [gaps, silent, draft, live]) assert.deepEqual(safeguards.check(a, { kind: 'answer' }), []);
});
