// Import: adds the projects that exist in helloo/ripples-climate-map.html
// but not in data/projects.csv, with their evidence, then recomputes the
// precomputed city fields in data/cities.csv with the fixed rules (S4).
// Usage: node scripts/import-helloo-projects.js   (safe to re-run: skips existing ids)
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const config = require('../src/config');
const { parseCsv } = require('../src/data/csv');
const rules = require('../src/domain/rules');

const ROOT = path.join(__dirname, '..', '..');
const DATA = path.join(ROOT, 'data');
const HTML = path.join(ROOT, 'helloo', 'ripples-climate-map.html');
// Imports every helloo project not yet in projects.csv: the 40 hand-written ones and the 100
// generated flood-control work packages (FLOOD_EXPANSION_CITIES, ids <city>-flood-NN).

// Load the data <script> of the helloo page (the one that exports CITIES).
function loadHellooCities() {
  const html = fs.readFileSync(HTML, 'utf8');
  const blocks = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const data = blocks.find((b) => b.includes('const CITIES') && b.includes('module.exports'));
  if (!data) throw new Error('Could not find the CITIES data block in helloo/ripples-climate-map.html');
  const sandbox = { module: { exports: {} } };
  vm.runInNewContext(data, sandbox, { timeout: 2000 });
  return sandbox.module.exports.CITIES;
}

const csvEscape = (v) => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const readCsv = (name) => {
  const text = fs.readFileSync(path.join(DATA, `${name}.csv`), 'utf8');
  return { header: text.split(/\r?\n/)[0].split(','), rows: parseCsv(text), text };
};
const appendRows = (name, header, rows) => {
  const file = path.join(DATA, `${name}.csv`);
  let text = fs.readFileSync(file, 'utf8');
  if (!text.endsWith('\n')) text += '\n';
  text += rows.map((r) => header.map((h) => csvEscape(r[h])).join(',')).join('\n') + '\n';
  fs.writeFileSync(file, text);
};
const r4 = (n) => Math.round(n * 10000) / 10000;

function main() {
  const cities = loadHellooCities();
  const projects = readCsv('projects');
  const evidence = readCsv('evidence');
  const have = new Set(projects.rows.map((p) => p.project_id));
  const newProjects = [];
  const newEvidence = [];

  for (const c of cities) {
    for (const p of c.projects) {
      if (have.has(p.id)) continue;
      const row = {
        project_id: p.id, city_id: c.id, city: c.name, project: p.name, type: p.type, agency: p.agency,
        responsible_office: p.office, budget_php_millions: p.budget, status: p.status, progress_pct: p.progress,
        start: p.start || '', deadline: p.deadline, completed: p.done || '', maintenance: p.maint || '',
        gap: '', interim_measure: p.interim || '', lccap_source: c.lccap,
        followups_sent: p.fu ? p.fu.sent : 0, followups_replied: p.fu ? p.fu.replied : 0, latest_reply: (p.fu && p.fu.reply) || '',
        summary: p.summary, approx_lat: r4(c.lat + p.dy), approx_lon: r4(c.lon + p.dx), sample_data: 'yes',
      };
      row.gap = rules.gapType({ ...row, maintenance: row.maintenance }, config.asOf) || '';
      newProjects.push(row);
      (p.evidence || []).forEach((e, i) => newEvidence.push({
        evidence_id: `${p.id}-e${i + 1}`, project_id: p.id, city_id: c.id, date: e[0], source: e[1],
        observation: e[2], corroborated: e[3] ? 'yes' : 'no', sample_data: 'yes',
      }));
    }
  }

  if (newProjects.length) appendRows('projects', projects.header, newProjects);
  if (newEvidence.length) appendRows('evidence', evidence.header, newEvidence);

  // Recompute every city's precomputed risk and scorecard fields from the rules.
  const allProjects = parseCsv(fs.readFileSync(path.join(DATA, 'projects.csv'), 'utf8')).map((p) => ({
    ...p, progress_pct: Number(p.progress_pct), followups_sent: Number(p.followups_sent), followups_replied: Number(p.followups_replied),
  }));
  const advisories = parseCsv(fs.readFileSync(path.join(DATA, 'advisories.csv'), 'utf8'));
  const citiesCsv = readCsv('cities');
  const updated = citiesCsv.rows.map((c) => {
    const ps = allProjects.filter((p) => p.city_id === c.city_id);
    const risk = rules.cityRisk(advisories.filter((a) => a.city_id === c.city_id), ps, config.asOf);
    const sc = rules.cityScorecard(ps, config.asOf);
    return {
      ...c,
      hazard_points: risk.hazard_points, gap_points: risk.gap_points, risk_score: risk.risk_score, real_risk_level: risk.real_risk_level,
      commitments_due: sc.commitments_due, kept_on_time: sc.kept_on_time, promises_kept_pct: sc.promises_kept_pct ?? '',
      completed_defenses: sc.completed_defenses, maintained_ok: sc.maintained_ok, maintained_pct: sc.maintained_pct ?? '',
    };
  });
  fs.writeFileSync(path.join(DATA, 'cities.csv'),
    `${citiesCsv.header.join(',')}\n${updated.map((r) => citiesCsv.header.map((h) => csvEscape(r[h])).join(',')).join('\n')}\n`);

  console.log(`Added ${newProjects.length} projects and ${newEvidence.length} evidence rows.`);
  for (const c of updated) console.log(`  ${c.city_id}: ${c.real_risk_level} (${c.risk_score}), gaps ${c.gap_points}, kept ${c.promises_kept_pct}%`);
}

main();
