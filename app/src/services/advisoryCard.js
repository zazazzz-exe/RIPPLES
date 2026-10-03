// D4a — Advisory guidance card: one advisory → four audience sections.
const rules = require('../domain/rules');
const { enforce, OFFICIAL_LINE, SAMPLE_LABEL, SIMULATION_LABEL } = require('../domain/safeguards');
const { advisorySections } = require('./templates/advisory');
const { ValidationError } = require('../errors');

function createAdvisoryCard({ repo, config }, { cities, drafts }) {
  // Classify by the fixed PAGASA rules (S4). Heat may be given as an index.
  function classify({ type, level, heat_index }) {
    if (!rules.ADVISORY_TYPES.includes(type)) throw new ValidationError(`type must be one of ${rules.ADVISORY_TYPES.join(', ')}`);
    let lvl = level;
    if (type === 'Heat' && heat_index != null && heat_index !== '') {
      lvl = rules.heatLevelFromIndex(Number(heat_index));
      if (!lvl) throw new ValidationError('Heat index below 27°C has no PAGASA category');
    }
    if (!rules.levelsFor(type).includes(lvl)) throw new ValidationError(`level for ${type} must be one of ${rules.levelsFor(type).join(', ')}`);
    return { type, level: lvl, hazard_points: rules.hazardPoints({ type, level: lvl }) };
  }

  function build(input) {
    const city = cities.mustCity(input.city_id);
    const c = classify(input);
    const gaps = cities.openGaps(city.city_id);
    const centers = repo.centersOf(city.city_id);
    const card = {
      kind: 'advisory',
      city_id: city.city_id, city: city.city,
      ...c,
      title: input.title || `${c.type}: ${c.level}`,
      source: input.source || 'PAGASA (sample)',
      issued: input.issued || `${config.today} 09:00`,
      sections: advisorySections({ type: c.type, points: c.hazard_points, centers, openGaps: gaps }),
      official_line: OFFICIAL_LINE,
      sample_label: input.simulated ? `${SAMPLE_LABEL} ${SIMULATION_LABEL}` : SAMPLE_LABEL,
      simulated: Boolean(input.simulated),
      simulation_id: input.simulation_id || null,
      source_records: [...gaps.map((g) => `projects.csv:${g.project_id}`), ...centers.map((e) => `evacuation_centers.csv:${e.center_id}`)],
    };
    return enforce(card, { kind: 'advisory' });
  }

  return {
    classify,
    preview: build,
    create: (input) => drafts.create(build(input)),
  };
}

module.exports = { createAdvisoryCard };
