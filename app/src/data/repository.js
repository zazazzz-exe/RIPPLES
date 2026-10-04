const fs = require('node:fs');
const path = require('node:path');
const { parseCsv } = require('./csv');

const NUMERIC = new Set([
  'lat', 'lon', 'hazard_points', 'gap_points', 'risk_score', 'commitments_due', 'kept_on_time',
  'promises_kept_pct', 'completed_defenses', 'maintained_ok', 'maintained_pct',
  'budget_php_millions', 'progress_pct', 'followups_sent', 'followups_replied',
  'approx_lat', 'approx_lon', 'capacity_persons',
]);

function load(dir, name) {
  const rows = parseCsv(fs.readFileSync(path.join(dir, `${name}.csv`), 'utf8'));
  return rows.map((r) => {
    const out = {};
    for (const [k, v] of Object.entries(r)) {
      if (NUMERIC.has(k)) out[k] = v === '' ? null : Number(v);
      else if (k === 'corroborated' || k === 'sample_data') out[k] = v === 'yes';
      else if (k === 'pilot_city') out[k] = v === 'yes';
      else out[k] = v;
    }
    return out;
  });
}

function groupBy(list, key) {
  const m = new Map();
  for (const item of list) {
    if (!m.has(item[key])) m.set(item[key], []);
    m.get(item[key]).push(item);
  }
  return m;
}

// Read-only access to the sample CSVs. Swap this module for a database-backed
// one with the same methods to move off CSVs.
function createRepository(dataDir) {
  const cities = load(dataDir, 'cities');
  const projects = load(dataDir, 'projects');
  const advisories = load(dataDir, 'advisories');
  const evidence = load(dataDir, 'evidence');
  const centers = load(dataDir, 'evacuation_centers');
  const actions = load(dataDir, 'community_actions');

  // Optional reference photos and source links per project (data/project_media.json).
  const mediaFile = path.join(dataDir, 'project_media.json');
  const media = fs.existsSync(mediaFile) ? JSON.parse(fs.readFileSync(mediaFile, 'utf8')).projects || {} : {};

  const cityById = new Map(cities.map((c) => [c.city_id, c]));
  const projectById = new Map(projects.map((p) => [p.project_id, p]));
  const projectsByCity = groupBy(projects, 'city_id');
  const advisoriesByCity = groupBy(advisories, 'city_id');
  const evidenceByProject = groupBy(evidence, 'project_id');
  const centersByCity = groupBy(centers, 'city_id');
  const actionsByCity = groupBy(actions, 'city_id');

  return {
    cities: () => cities,
    city: (id) => cityById.get(id) || null,
    projects: () => projects,
    project: (id) => projectById.get(id) || null,
    projectsOf: (cityId) => projectsByCity.get(cityId) || [],
    advisories: () => advisories,
    advisoriesOf: (cityId) => advisoriesByCity.get(cityId) || [],
    evidence: () => evidence,
    evidenceOf: (projectId) => evidenceByProject.get(projectId) || [],
    centersOf: (cityId) => centersByCity.get(cityId) || [],
    actionsOf: (cityId) => actionsByCity.get(cityId) || [],
    mediaOf: (projectId) => media[projectId] || { photos: [], references: [] },
    counts: () => ({
      cities: cities.length, projects: projects.length, advisories: advisories.length,
      evidence: evidence.length, centers: centers.length, actions: actions.length,
    }),
  };
}

module.exports = { createRepository };
