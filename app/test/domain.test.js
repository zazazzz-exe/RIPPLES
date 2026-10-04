const test = require('node:test');
const assert = require('node:assert/strict');
const config = require('../src/config');
const { createRepository } = require('../src/data/repository');
const rules = require('../src/domain/rules');
const safeguards = require('../src/domain/safeguards');
const { createApprovalPolicy } = require('../src/domain/approval');

const repo = createRepository(config.dataDir);

test('repository loads every sample CSV', () => {
  assert.deepEqual(repo.counts(), { cities: 16, projects: 220, advisories: 21, evidence: 261, centers: 48, actions: 38 });
  assert.ok(repo.cities().every((c) => c.sample_data));
});

test('gapType reproduces the gap column of projects.csv', () => {
  for (const p of repo.projects()) {
    assert.equal(rules.gapType(p, config.asOf) || '', p.gap, p.project_id);
  }
});

test('cityRisk reproduces every precomputed risk field in cities.csv (S4)', () => {
  for (const c of repo.cities()) {
    const r = rules.cityRisk(repo.advisoriesOf(c.city_id), repo.projectsOf(c.city_id), config.asOf);
    assert.equal(r.hazard_points, c.hazard_points, `${c.city_id} hazard`);
    assert.equal(r.gap_points, c.gap_points, `${c.city_id} gap`);
    assert.equal(r.risk_score, c.risk_score, `${c.city_id} score`);
    assert.equal(r.real_risk_level, c.real_risk_level, `${c.city_id} level`);
  }
});

test('cityScorecard reproduces the scorecard fields in cities.csv', () => {
  for (const c of repo.cities()) {
    const s = rules.cityScorecard(repo.projectsOf(c.city_id), config.asOf);
    for (const k of ['commitments_due', 'kept_on_time', 'promises_kept_pct', 'completed_defenses', 'maintained_ok', 'maintained_pct']) {
      assert.equal(s[k], c[k], `${c.city_id} ${k}`);
    }
  }
});

test('risk bands follow Appendix B', () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6].map(rules.riskLevel),
    ['Low', 'Low', 'Moderate', 'Moderate', 'High', 'Critical', 'Critical']);
  assert.throws(() => rules.hazardPoints({ type: 'Heat', level: 'Scorching' }), RangeError);
});

test('addWorkingDays skips weekends', () => {
  assert.equal(rules.addWorkingDays('2026-10-02', 15), '2026-10-23'); // Fri + 15 working days
});

test('safeguards flag "safe", accusations, missing labels and reporter fields', () => {
  assert.deepEqual(safeguards.check('Sample data. Stay alert.', { kind: 'answer' }), []);
  const rule = (txt, opts) => safeguards.check(txt, opts).map((v) => v.rule);
  assert.ok(rule('Sample. You are safe now.', { kind: 'answer' }).includes('S1'));
  assert.ok(rule('Sample. The office is corrupt.', { kind: 'letter' }).includes('S3'));
  assert.ok(rule('No label here.', { kind: 'answer' }).includes('S7'));
  assert.ok(rule('Sample advisory', { kind: 'advisory' }).includes('S1'));
  assert.ok(safeguards.check({ note: 'sample', email: 'x@y' }, { kind: 'evidence' }).some((v) => v.rule === 'S5'));
  assert.deepEqual(safeguards.redactReporter({ name: 'A', phone: '1', text: 't' }), { text: 't' });
  assert.equal(safeguards.check('Sample. Safety first; move safely.', { kind: 'answer' }).length, 0);
  assert.equal(safeguards.check('Sample. Low-lying streets may flood.', { kind: 'answer' }).length, 0);
  assert.ok(rule('Sample. The office is lying.', { kind: 'letter' }).includes('S3'));
});

test('corroboration needs two matching reports or a satellite check (S6)', () => {
  assert.equal(safeguards.corroborationStatus({ matchingReports: 0, satelliteAgrees: false }), 'unverified');
  assert.equal(safeguards.corroborationStatus({ matchingReports: 1, satelliteAgrees: false }), 'unverified');
  assert.equal(safeguards.corroborationStatus({ matchingReports: 2, satelliteAgrees: false }), 'corroborated');
  assert.equal(safeguards.corroborationStatus({ matchingReports: 0, satelliteAgrees: true }), 'corroborated');
});

test('approval policy blocks release until approved (S2)', () => {
  const policy = createApprovalPolicy('required');
  const draft = { id: 'd1', review_state: policy.initialState() };
  assert.equal(draft.review_state, 'DRAFT');
  assert.equal(policy.canRelease(draft), false);
  assert.throws(() => policy.assertReleasable(draft));
  const approved = policy.decide(draft, 'approve', { at: '2026-10-02' });
  assert.equal(policy.canRelease(approved), true);
  assert.throws(() => policy.decide(approved, 'reject'));
  assert.equal(createApprovalPolicy('auto').initialState(), 'APPROVED');
  assert.throws(() => createApprovalPolicy('sometimes'));
});
