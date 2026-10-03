// D4c — Citizen report triage. Reporter identity is never stored (S5);
// reports stay "unverified" until corroborated (S6).
const { enforce, redactReporter, corroborationStatus, SAMPLE_LABEL } = require('../domain/safeguards');
const { NotFoundError, ValidationError } = require('../errors');

const REPORT_TYPES = ['status update', 'dispute', 'maintenance problem'];

// Words that suggest a photo shows this kind of defense.
const TYPE_WORDS = {
  Dike: ['dike', 'wall', 'embankment', 'river', 'levee', 'sandbag'],
  Seawall: ['seawall', 'wall', 'coast', 'shore', 'boulevard', 'embankment', 'waves'],
  Drainage: ['drain', 'canal', 'culvert', 'inlet', 'floodway', 'silt', 'water', 'flood'],
  Pump: ['pump', 'station', 'generator', 'foundation'],
  Mangrove: ['mangrove', 'seedling', 'plant', 'coast'],
  Greening: ['tree', 'park', 'shade', 'roof', 'plant', 'forest'],
  Evac: ['evacuation', 'center', 'building', 'roof', 'shelter'],
  Warning: ['sensor', 'siren', 'gauge', 'telemetry', 'light', 'alarm'],
};

// Month-level dates in the sample data: "last 30 days" = this month or last.
function withinWindow(date, today) {
  const ym = today.slice(0, 7);
  const d = new Date(`${ym}-01T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() - 1);
  return String(date).slice(0, 7) >= d.toISOString().slice(0, 7);
}

const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();

function createReportTriage({ repo, store, config }) {
  function triage(raw) {
    const input = redactReporter(raw || {});
    const { project_id: projectId, report_type: reportType, text = '', photo_description: photo = '' } = input;
    const project = repo.project(projectId);
    if (!project) throw new NotFoundError(`No project ${projectId}`);
    if (!REPORT_TYPES.includes(reportType)) throw new ValidationError(`report_type must be one of ${REPORT_TYPES.join(', ')}`);
    if (!String(text).trim()) throw new ValidationError('text is required');

    const flags = [];
    const words = TYPE_WORDS[project.type] || [];
    const described = `${text} ${photo}`.toLowerCase();
    if (photo && !words.some((w) => described.includes(w))) flags.push('Photo does not appear to match the project type');

    const prior = store.get().reports.filter((r) => r.project_id === projectId);
    const now = Date.now();
    if (prior.some((r) => normalize(r.observation_full) === normalize(text))) flags.push('Identical wording to an earlier report');
    if (prior.filter((r) => now - Date.parse(r.recorded_at) < 10 * 60 * 1000).length >= 2) flags.push('Many reports for this project within minutes');

    const evidence = repo.evidenceOf(projectId).filter((e) => withinWindow(e.date, config.today));
    const matchingReports = evidence.filter((e) => e.source === 'Citizen photo report').length
      + prior.filter((r) => withinWindow(r.date, config.today) && !r.flags.length).length;
    const satelliteAgrees = evidence.some((e) => e.source === 'Satellite check');

    // Flagged reports never auto-corroborate; a reviewer looks at them.
    const status = flags.length ? 'unverified' : corroborationStatus({ matchingReports, satelliteAgrees });
    const sentence = String(text).trim().split(/(?<=[.!?])\s/)[0].slice(0, 200);

    const entry = enforce({
      evidence_id: `${projectId}-r${prior.length + 1}`,
      project_id: projectId, city_id: project.city_id,
      date: config.today.slice(0, 7),
      source: 'Citizen photo report',
      report_type: reportType,
      observation: sentence,
      corroborated: status === 'corroborated',
      status,
      basis: { matching_reports: matchingReports, satellite_check: satelliteAgrees, window: 'this month and last month' },
      flags,
      needs_review: flags.length > 0,
      sample_label: SAMPLE_LABEL,
    }, { kind: 'evidence' });

    store.update((s) => { s.reports.push({ ...entry, observation_full: String(text), recorded_at: new Date().toISOString() }); });
    return entry;
  }

  const list = () => store.get().reports.map(({ observation_full, ...r }) => r).reverse();

  return { triage, list, REPORT_TYPES };
}

module.exports = { createReportTriage };
