const test = require('node:test');
const assert = require('node:assert/strict');
const config = require('../src/config');
const { createServices } = require('../src/services');

const make = () => createServices({ ...config, approvalMode: 'required' }, { persist: false });
const adapter = () => import('../public/js/explore/adapter.js');

test('/api/explore bundle: 16 cities in CSV route order, server risk', () => {
  const s = make();
  const data = s.cities.explore();
  assert.deepEqual(data.cities.map((c) => c.city.city_id),
    ['dagupan', 'tuguegarao', 'malabon', 'manila', 'marikina', 'naga', 'legazpi', 'tacloban',
      'ormoc', 'cebu', 'iloilo', 'puerto-princesa', 'zamboanga', 'cdo', 'butuan', 'davao']);
  const mal = data.cities[2];
  assert.equal(mal.risk.real_risk_level, 'Critical');
  assert.equal(mal.open_gaps.length, 9);
  assert.equal(mal.projects.find((p) => p.project_id === 'mal-wall').evidence.length, 4);
  assert.equal(data.simulation, undefined);
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
  const mal = cities[2];
  assert.deepEqual([mal.risk.h, mal.risk.g, mal.risk.s, mal.risk.lvl], [2, 3, 5, 'Critical']);
  assert.deepEqual(mal.risk.top, { type: 'Flood', level: 'Advisory' });
  assert.equal(mal.score.kept, 29);
  const wall = mal.projects.find((p) => p.id === 'mal-wall');
  assert.deepEqual(wall.fu, { sent: 2, replied: 0, awaiting: 0, reply: null });
  assert.equal(wall.evidence.find((e) => e[4] === 'mine')[0], '2026-09');
  assert.equal(mal.advisories.length, 2);
  assert.deepEqual(wall.rating, { up: 0, down: 0 });
});

test('letter drafts: a second draft for the same project is refused while one is pending', () => {
  const s = make();
  s.followUpLetter.create('mal-wall');
  assert.throws(() => s.followUpLetter.create('mal-wall'), /already waiting for approval/);
  assert.match(s.followUpLetter.preview('mal-wall').body, /Executive Order No\. 2/);
});

test('project media: every reference photo is credited; news photos carry the permission note', () => {
  const s = make();
  const fs = require('node:fs');
  const path = require('node:path');
  const pump = s.cities.project('mal-pump').project.media;
  assert.equal(pump.photos[0].file, 'malabon-pumping-station.jpg');
  assert.match(pump.photos[0].source, /DPWH/);
  const all = Object.values(JSON.parse(fs.readFileSync(path.join(__dirname, '../../data/project_media.json'), 'utf8')).projects);
  const photos = all.flatMap((m) => m.photos);
  for (const ph of photos) {
    assert.ok(ph.source && ph.license_note && ph.title && ph.match, ph.file);
    assert.ok(fs.existsSync(path.join(__dirname, '../public/img/projects', ph.file)), ph.file);
    assert.ok(fs.existsSync(path.join(__dirname, '../public/img/projects', ph.small)), ph.small);
    // News and company photos are credited references that need permission before a public release.
    if (/ABS-CBN|GMA|AFP|Manila Bulletin|SunStar|Daily Guardian|MLION|Metro CDO/i.test(ph.source)) {
      assert.match(ph.license_note, /permission/);
    }
  }
  // A photo picked for a project is shown for that project only; projects without one share a same-type photo.
  const files = photos.filter((p) => !/shared photo/.test(p.match)).map((p) => p.file);
  assert.equal(new Set(files).size, files.length);
  // Photos whose content doesn't match their name are left out.
  assert.doesNotMatch(photos.map((p) => p.file).join(' '), /pantal|evacuation|telemetry|retention/);
});
