const test = require('node:test');
const assert = require('node:assert/strict');
const config = require('../src/config');
const { createApp } = require('../server');

test('API smoke test: demo path over HTTP', async (t) => {
  const { app } = createApp({ ...config, approvalMode: 'required' }, { persist: false });
  const server = app.listen(0);
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const get = (p) => fetch(base + p).then(async (r) => ({ status: r.status, body: await r.json() }));
  const post = (p, body) => fetch(base + p, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body || {}) })
    .then(async (r) => ({ status: r.status, body: await r.json() }));

  assert.equal((await get('/health')).body.approval_mode, 'required');
  assert.equal((await get('/cities')).body.cities.length, 8);

  const mal = await get('/cities/malabon');
  assert.equal(mal.body.risk.real_risk_level, 'High');
  assert.equal(mal.body.open_gaps.length, 2);
  assert.equal((await get('/cities/atlantis')).status, 404);
  assert.equal((await get('/projects/mal-wall')).body.evidence.length, 4);

  const sim = await post('/simulate/typhoon');
  assert.equal(sim.body.affected.find((a) => a.city_id === 'malabon').real_risk_level, 'Critical');
  const pending = (await get('/drafts?state=DRAFT')).body.drafts;
  assert.ok(pending.length > 0);
  assert.equal((await get('/outbox')).body.messages.length, 0);

  const letter = pending.find((d) => d.kind === 'letter');
  const ok = await post(`/drafts/${letter.id}/approve`);
  assert.equal(ok.body.review_state, 'APPROVED');
  assert.equal((await get('/outbox')).body.messages.length, 1);
  assert.equal((await post(`/drafts/${letter.id}/approve`)).status, 409);

  assert.equal((await post('/flows/advisory-card', { city_id: 'malabon', type: 'Rain', level: 'Mauve' })).status, 400);
  assert.equal((await post('/reports', { project_id: 'mal-wall', report_type: 'dispute' })).status, 400);
  assert.equal((await post('/assistant', { question: "Which open gaps raise Malabon's risk this season?" })).body.intent, 'gaps');

  const bad = await fetch(`${base}/assistant`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{oops' });
  assert.equal(bad.status, 400);

  await post('/simulate/reset');
  assert.equal((await get('/cities/malabon')).body.risk.real_risk_level, 'High');
});
