const test = require('node:test');
const assert = require('node:assert/strict');
const baseConfig = require('../src/config');
const { createServices } = require('../src/services');
const safeguards = require('../src/domain/safeguards');

const make = (approvalMode = 'required') => createServices({ ...baseConfig, approvalMode }, { persist: false });

test('D2 scorecard: open-gap total equals a hand count of projects.csv', () => {
  const s = make();
  const sc = s.scorecard.build();
  assert.equal(sc.kpis.commitments_tracked, 220);
  assert.equal(sc.kpis.open_gaps, 84);
  assert.equal(sc.kpis.overdue, 57);
  assert.equal(sc.kpis.needs_maintenance, 27);
  assert.equal(sc.kpis.cities_high_or_critical, 11);
  assert.deepEqual(sc.cities.map((c) => c.risk_score), [...sc.cities.map((c) => c.risk_score)].sort((a, b) => b - a));
  assert.match(sc.sample_label, /Sample/);
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
  assert.equal(s.followups.summary().awaiting, 1);
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

test('follow-up log: an approved letter starts a reply clock and a reply can be recorded', () => {
  const s = make();
  const d = s.followUpLetter.create('mal-wall');
  assert.equal(s.followups.summary().letters_sent, 0);
  s.drafts.decide(d.id, 'approve');
  const [f] = s.followups.summary().followups;
  assert.equal(f.project_id, 'mal-wall');
  assert.equal(f.status, 'Awaiting reply');
  assert.equal(f.clock_due, '2026-10-23');
  s.followups.recordReply(f.id, 'Revised completion date: March 2027.');
  assert.equal(s.followups.summary().replies, 1);
  assert.throws(() => s.followups.recordReply(f.id, '  '), /reply text is required/);
  assert.throws(() => s.followups.recordReply('fu-9999', 'x'), /No follow-up/);
  // The reply now counts on the city scorecard.
  assert.equal(s.cities.scorecard('malabon').followups_replied, 2);
});

test('public ratings: one vote per browser, changeable, anonymous, and never change status or risk', () => {
  const s = make();
  const A = 'voter-aaaaaaaaaaaaaaaa';
  const B = 'voter-bbbbbbbbbbbbbbbb';
  assert.deepEqual(s.ratings.tally('mal-wall', A).mine, null);
  let t = s.ratings.vote('mal-wall', A, 'up');
  assert.deepEqual([t.up, t.down, t.mine], [1, 0, 'up']);
  t = s.ratings.vote('mal-wall', A, 'up');
  assert.equal(t.up, 1, 'same browser counts once');
  t = s.ratings.vote('mal-wall', A, 'down', 'unfinished');
  assert.deepEqual([t.up, t.down, t.mine, t.mine_reason, t.reasons.unfinished], [0, 1, 'down', 'unfinished', 1]);
  t = s.ratings.vote('mal-wall', B, 'down', 'hard_to_access');
  assert.deepEqual([t.down, t.mine], [2, 'down']);
  t = s.ratings.vote('mal-wall', A, null);
  assert.deepEqual([t.up, t.down, t.mine], [0, 1, null]);

  assert.throws(() => s.ratings.vote('mal-wall', A, 'up', 'unfinished'), /only go with a thumbs down/);
  assert.throws(() => s.ratings.vote('mal-wall', A, 'down', 'corrupt'), /reason must be one of/);
  assert.throws(() => s.ratings.vote('mal-wall', 'short', 'up'), /voter must be/);
  assert.throws(() => s.ratings.vote('mal-wall', A, 'maybe'), /vote must be/);
  assert.throws(() => s.ratings.vote('atlantis', A, 'up'), /No project/);

  // Only hashes are stored, and the same browser is not linkable across projects.
  s.ratings.vote('mal-pump', B, 'up');
  const raw = JSON.stringify(s.ratings.summary()) + JSON.stringify(s.cities.explore());
  assert.ok(!raw.includes(B));
  const ratingsState = require('node:util').inspect(s.ratings.tally('mal-wall'));
  assert.ok(!ratingsState.includes(B));

  // Opinions only: status and risk are unchanged (S4).
  assert.equal(s.cities.risk('malabon').real_risk_level, 'Critical');
  assert.equal(s.cities.project('mal-wall').project.status, 'Delayed');
  assert.deepEqual(s.cities.project('mal-wall').project.rating, { up: 0, down: 1 });

  // Scorecard: most thumbs down with the leading reason.
  s.ratings.vote('dag-dike', A, 'down', 'not_working');
  s.ratings.vote('dag-dike', B, 'down', 'not_working');
  const sc = s.scorecard.build();
  assert.deepEqual(sc.most_down.map((m) => m.project_id), ['dag-dike', 'mal-wall']);
  assert.equal(sc.most_down[0].top_reason, 'Not working or not maintained');
  assert.equal(sc.projects.find((p) => p.project_id === 'mal-pump').rating_up, 1);
});

test('rating hashes differ per project for the same browser', () => {
  const s = make();
  const crypto = require('node:crypto');
  const h = (pid) => crypto.createHash('sha256').update(`${baseConfig.ratingSalt}|${pid}|voter-cccccccccccccccc`).digest('hex');
  assert.notEqual(h('mal-wall'), h('mal-pump'));
  s.ratings.vote('mal-wall', 'voter-cccccccccccccccc', 'up');
  assert.equal(s.ratings.tally('mal-wall', 'voter-cccccccccccccccc').mine, 'up');
  assert.equal(s.ratings.tally('mal-pump', 'voter-cccccccccccccccc').mine, null);
});
