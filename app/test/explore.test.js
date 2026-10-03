const test = require('node:test');
const assert = require('node:assert/strict');
const config = require('../src/config');
const { createServices } = require('../src/services');

const make = () => createServices({ ...config, approvalMode: 'required' }, { persist: false });
const adapter = () => import('../public/js/explore/adapter.js');

test('/api/explore bundle: 8 cities in CSV route order, server risk', () => {
  const s = make();
  const data = s.cities.explore();
  assert.deepEqual(data.cities.map((c) => c.city.city_id),
    ['dagupan', 'malabon', 'marikina', 'legazpi', 'tacloban', 'iloilo', 'cdo', 'davao']);
  const mal = data.cities[1];
  assert.equal(mal.risk.real_risk_level, 'High');
  assert.equal(mal.open_gaps.length, 2);
  assert.equal(mal.projects.find((p) => p.project_id === 'mal-wall').evidence.length, 4);
  assert.equal(data.simulation, null);
  assert.equal(data.typhoon.track.length, 6);
});

test('adapter maps the API onto the 3D explorer model', async () => {
  const { toCities } = await adapter();
  const s = make();
  const cities = toCities(s.cities.explore(), { mine: new Set(['mal-wall-e1']) });
  const dag = cities[0];
  assert.equal(dag.name, 'Dagupan City');
  assert.equal(dag.prov, 'Pangasinan');
  assert.equal(dag.region, 'Luzon');
  assert.deepEqual(dag.hazards, ['Flood', 'Storm surge', 'Subsidence']);
  // Offsets reproduce the mockup's dx/dy (dag-dike: dy 0.014, dx 0.012).
  const dike = dag.projects.find((p) => p.id === 'dag-dike');
  assert.equal(dike.dy, 0.014);
  assert.equal(dike.dx, 0.012);
  assert.equal(dike.gap, 'Overdue');
  assert.deepEqual(dag.evac[0], ['Dagupan City Central School', 1200, 0.01, 0.006]);
  // Risk and scorecard come from the server, not recomputed.
  const mal = cities[1];
  assert.deepEqual([mal.risk.h, mal.risk.g, mal.risk.s, mal.risk.lvl], [2, 2, 4, 'High']);
  assert.deepEqual(mal.risk.top, { type: 'Flood', level: 'Advisory' });
  assert.equal(mal.score.kept, 67);
  const wall = mal.projects.find((p) => p.id === 'mal-wall');
  assert.deepEqual(wall.fu, { sent: 2, replied: 0, awaiting: 0, reply: null });
  assert.equal(wall.evidence.find((e) => e[4] === 'mine')[0], '2026-09');
  assert.equal(mal.advisories.length, 2);
});

test('adapter: simulated signal shows as pending until its card is approved (S2)', async () => {
  const { toCities } = await adapter();
  const s = make();
  s.automations.runTyphoon();
  let mal = toCities(s.cities.explore())[1];
  assert.equal(mal.risk.lvl, 'Critical');
  assert.equal(mal.advisories[0].pending, true);
  assert.equal(mal.advisories[0].households, undefined);

  const card = s.drafts.list({ kind: 'advisory', city_id: 'malabon' })[0];
  s.drafts.decide(card.id, 'approve');
  mal = toCities(s.cities.explore())[1];
  assert.equal(mal.advisories[0].pending, undefined);
  assert.match(mal.advisories[0].households, /Typhoon-force winds/);
});

test('letter drafts: a second draft for the same project is refused while one is pending', () => {
  const s = make();
  s.followUpLetter.create('mal-wall');
  assert.throws(() => s.followUpLetter.create('mal-wall'), /already waiting for approval/);
  assert.match(s.followUpLetter.preview('mal-wall').body, /Executive Order No\. 2/);
});
