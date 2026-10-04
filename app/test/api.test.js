const test = require('node:test');
const assert = require('node:assert/strict');
const config = require('../src/config');
const { createApp } = require('../server');

test('API smoke test: letter → approval → outbox → reply, over HTTP', async (t) => {
  const { app } = createApp({ ...config, approvalMode: 'required' }, { persist: false });
  const server = app.listen(0);
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const get = (p) => fetch(base + p).then(async (r) => ({ status: r.status, body: await r.json() }));
  const post = (p, body) => fetch(base + p, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body || {}) })
    .then(async (r) => ({ status: r.status, body: await r.json() }));

  assert.equal((await get('/health')).body.approval_mode, 'required');
  assert.ok('mapbox_token' in (await get('/config')).body);
  assert.equal((await get('/cities')).body.cities.length, 16);

  const mal = await get('/cities/malabon');
  assert.equal(mal.body.risk.real_risk_level, 'Critical');
  assert.equal(mal.body.open_gaps.length, 9);
  assert.equal((await get('/cities/atlantis')).status, 404);
  assert.equal((await get('/projects/mal-wall')).body.evidence.length, 4);
  assert.equal((await get('/explore')).body.cities.length, 16);

  // Letter: preview, draft, nothing sent until approved, then the reply clock.
  assert.match((await get('/flows/follow-up-letter/preview?project_id=mal-wall')).body.body, /Freedom of Information/);
  const draft = await post('/flows/follow-up-letter', { project_id: 'mal-wall' });
  assert.equal(draft.status, 201);
  assert.equal(draft.body.review_state, 'DRAFT');
  assert.equal((await post('/flows/follow-up-letter', { project_id: 'mal-wall' })).status, 409);
  assert.equal((await get('/outbox')).body.messages.length, 0);
  const ok = await post(`/drafts/${draft.body.id}/approve`);
  assert.equal(ok.body.review_state, 'APPROVED');
  assert.equal((await get('/outbox')).body.messages.length, 1);
  assert.equal((await post(`/drafts/${draft.body.id}/approve`)).status, 409);
  const fu = (await get('/followups')).body.followups[0];
  assert.equal(fu.status, 'Awaiting reply');
  assert.equal((await post(`/followups/${fu.id}/reply`, { reply: 'Work resumes in November.' })).body.status, 'Replied');

  // Citizen report triage and validation.
  assert.equal((await post('/reports', { project_id: 'mal-wall', report_type: 'dispute' })).status, 400);
  assert.equal((await post('/reports', { project_id: 'mal-wall', report_type: 'dispute', text: 'Gap still open.' })).status, 201);

  const bad = await fetch(`${base}/reports`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{oops' });
  assert.equal(bad.status, 400);

  // Public rating: anonymous, one per browser.
  const voter = 'browser-0123456789abcdef';
  const up = await post('/projects/mal-wall/rating', { voter, vote: 'up' });
  assert.deepEqual([up.status, up.body.up, up.body.mine], [200, 1, 'up']);
  const mine = await get(`/projects/mal-wall/rating?voter=${voter}`);
  assert.equal(mine.body.mine, 'up');
  assert.equal((await get('/projects/mal-wall/rating')).body.mine, null);
  assert.equal((await post('/projects/mal-wall/rating', { voter: 'x', vote: 'up' })).status, 400);
  assert.equal((await post('/projects/mal-wall/rating', { voter, vote: 'up', reason: 'other' })).status, 400);
  assert.equal((await post('/projects/nowhere/rating', { voter, vote: 'up' })).status, 404);
  assert.deepEqual((await get('/projects/mal-wall')).body.project.rating, { up: 1, down: 0 });

  // Removed features are gone.
  assert.equal((await post('/simulate/typhoon')).status, 404);
  assert.equal((await post('/assistant', { question: 'hello' })).status, 404);
  assert.equal((await post('/flows/advisory-card', { city_id: 'malabon' })).status, 404);
  assert.equal((await post('/automations/escalation/run')).status, 404);
});
