// Recompute: re-derives every rule-based column in the sample CSVs (S4).
//   1. projects.csv `gap`  = rules.gapType(project, asOf)
//   2. cities.csv precomputed risk and scorecard fields = rules.cityRisk + rules.cityScorecard
// Column order, row order and CSV quoting are preserved; only those fields change.
// Usage: node scripts/recompute-cities.js   (safe to re-run)
const fs = require('node:fs');
const path = require('node:path');
const config = require('../src/config');
const { parseCsv } = require('../src/data/csv');
const rules = require('../src/domain/rules');

const DATA = path.join(__dirname, '..', '..', 'data');

const csvEscape = (v) => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const readCsv = (name) => {
  const text = fs.readFileSync(path.join(DATA, `${name}.csv`), 'utf8');
  return { header: text.split(/\r?\n/)[0].split(','), rows: parseCsv(text) };
};
const writeCsv = (name, header, rows) => {
  fs.writeFileSync(path.join(DATA, `${name}.csv`),
    `${header.join(',')}\n${rows.map((r) => header.map((h) => csvEscape(r[h])).join(',')).join('\n')}\n`);
};

function main() {
  // 1. Project gaps.
  const projects = readCsv('projects');
  let changed = 0;
  for (const p of projects.rows) {
    const gap = rules.gapType(p, config.asOf) || '';
    if (gap !== p.gap) changed += 1;
    p.gap = gap;
  }
  writeCsv('projects', projects.header, projects.rows);

  // 2. City risk and scorecard fields.
  const typed = projects.rows.map((p) => ({
    ...p, progress_pct: Number(p.progress_pct), followups_sent: Number(p.followups_sent), followups_replied: Number(p.followups_replied),
  }));
  const advisories = readCsv('advisories').rows;
  const cities = readCsv('cities');
  const updated = cities.rows.map((c) => {
    const ps = typed.filter((p) => p.city_id === c.city_id);
    const risk = rules.cityRisk(advisories.filter((a) => a.city_id === c.city_id), ps, config.asOf);
    const sc = rules.cityScorecard(ps, config.asOf);
    return {
      ...c,
      hazard_points: risk.hazard_points, gap_points: risk.gap_points, risk_score: risk.risk_score, real_risk_level: risk.real_risk_level,
      commitments_due: sc.commitments_due, kept_on_time: sc.kept_on_time, promises_kept_pct: sc.promises_kept_pct ?? '',
      completed_defenses: sc.completed_defenses, maintained_ok: sc.maintained_ok, maintained_pct: sc.maintained_pct ?? '',
      _open: risk.open_gaps, _n: ps.length,
    };
  });
  writeCsv('cities', cities.header, updated);

  console.log(`Recomputed gaps for ${projects.rows.length} projects (${changed} changed) and ${updated.length} cities.`);
  for (const c of updated) {
    console.log(`  ${c.city_id}: ${c._n} projects, ${c.real_risk_level} (${c.risk_score}), open gaps ${c._open}, kept ${c.promises_kept_pct}%`);
  }
}

main();
