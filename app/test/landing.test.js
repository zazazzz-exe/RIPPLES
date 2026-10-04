const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const config = require('../src/config');
const { createServices } = require('../src/services');
const safeguards = require('../src/domain/safeguards');

const load = async () => {
  const { toCities } = await import('../public/js/explore/adapter.js');
  const model = await import('../public/js/landing/model.js');
  const s = createServices({ ...config, approvalMode: 'required' }, { persist: false });
  return { model, s, cities: toCities(s.cities.explore()) };
};

test('every project maps to exactly one public status', async () => {
  const { model, cities } = await load();
  const counts = model.statusCounts(cities);
  assert.deepEqual(counts, { planned: 22, ongoing: 87, completed: 45, delayed: 27, incomplete: 12, verify: 27 });
  const byId = Object.fromEntries(model.orderedProjects(cities).map((p) => [p.id, p.status_key]));
  assert.equal(byId['mal-wall'], 'delayed');
  assert.equal(byId['leg-lahar'], 'incomplete');
  assert.equal(byId['mal-sensor'], 'verify');
  assert.equal(byId['ilo-basin'], 'planned');
});

test('a flagged citizen report moves a project to "requires verification"', async () => {
  const { toCities } = await import('../public/js/explore/adapter.js');
  const model = await import('../public/js/landing/model.js');
  const s = createServices({ ...config, approvalMode: 'required' }, { persist: false });
  s.reportTriage.triage({ project_id: 'mar-green', report_type: 'dispute', text: 'Not done at all.', photo_description: 'a basketball court' });
  const p = model.orderedProjects(toCities(s.cities.explore())).find((x) => x.id === 'mar-green');
  assert.equal(p.status_key, 'verify');
});

test('impact numbers come from the data', async () => {
  const { model, cities } = await load();
  assert.deepEqual(model.impactStats(cities), {
    projects: 220, cities: 16, island_groups: 3, evidence: 261, open_gaps: 84, needs_attention: 66, overdue: 57, maintenance: 27,
  });
});

test('projection keeps every city and project pin inside the map', async () => {
  const { model, cities } = await load();
  const proj = model.createProjection({ width: 1000 });
  for (const p of model.orderedProjects(cities)) {
    const [x, y] = proj.project(...model.pinLonLat(p.city, p));
    assert.ok(x > 0 && x < proj.width && y > 0 && y < proj.height, p.id);
  }
  const geo = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/data/ph-geo.json'), 'utf8'));
  const d = model.geoPath(geo.ph, proj.project);
  assert.match(d, /^M[\d.]+ [\d.]+L/);
  assert.ok(d.length < 400000, `path is ${d.length} chars`);
});

test('landing copy passes the safeguard word checks (S1, S3)', () => {
  const dir = path.join(__dirname, '../public/js/landing');
  const files = [path.join(dir, 'copy.js'), ...fs.readdirSync(path.join(dir, 'components')).map((f) => path.join(dir, 'components', f))];
  for (const f of files) {
    // The FAQ explains the term "ghost project" in quotes (and says Ripples never
    // applies it). Only that quoted mention is allowed; any other use still fails.
    const text = fs.readFileSync(f, 'utf8').replace(/"ghost projects?"/gi, '');
    const v = safeguards.check(`${text} sample`, { kind: 'answer' }).filter((x) => x.rule === 'S1' || x.rule === 'S3');
    assert.deepEqual(v, [], path.basename(f));
  }
});
