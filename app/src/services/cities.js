// City and project views. Risk is always computed by the fixed rules from the
// active advisories and the projects (S4).
const rules = require('../domain/rules');
const { OFFICIAL_SOURCES, OFFICIAL_LINE, SAMPLE_LABEL } = require('../domain/safeguards');
const OUTLOOK = require('../data/outlook');
const { NotFoundError } = require('../errors');

function createCityService({ repo, store, config }, { ratings }) {
  function mustCity(id) {
    const c = repo.city(id);
    if (!c) throw new NotFoundError(`No city ${id}`);
    return c;
  }

  const activeAdvisories = (cityId) => repo.advisoriesOf(cityId);

  function risk(cityId) {
    mustCity(cityId);
    return rules.cityRisk(activeAdvisories(cityId), repo.projectsOf(cityId), config.asOf);
  }

  // CSV follow-up counts plus letters released by this app.
  function followupsOf(project) {
    const log = store.get().followups.filter((f) => f.project_id === project.project_id);
    return {
      sent: (project.followups_sent || 0) + log.length,
      replied: (project.followups_replied || 0) + log.filter((f) => f.status === 'Replied').length,
      no_reply: log.filter((f) => f.status === 'No reply').length,
      awaiting: log.filter((f) => f.status === 'Awaiting reply').length,
      log,
    };
  }

  function projectSummary(p) {
    const fu = followupsOf(p);
    return {
      project_id: p.project_id, city_id: p.city_id, project: p.project, type: p.type, agency: p.agency,
      responsible_office: p.responsible_office, status: p.status, progress_pct: p.progress_pct,
      start: p.start, deadline: p.deadline, completed: p.completed, maintenance: p.maintenance,
      gap: rules.gapType(p, config.asOf), interim_measure: p.interim_measure,
      budget_php_millions: p.budget_php_millions, followups_sent: fu.sent, followups_replied: fu.replied,
      approx_lat: p.approx_lat, approx_lon: p.approx_lon,
    };
  }

  const openGaps = (cityId) => repo.projectsOf(cityId).map(projectSummary).filter((p) => p.gap);

  function scorecard(cityId) {
    const projects = repo.projectsOf(cityId).map((p) => {
      const fu = followupsOf(p);
      return { ...p, followups_sent: fu.sent, followups_replied: fu.replied };
    });
    return rules.cityScorecard(projects, config.asOf);
  }

  function list() {
    return repo.cities().map((c) => {
      const r = risk(c.city_id);
      const s = scorecard(c.city_id);
      return {
        city_id: c.city_id, city: c.city, province: c.province, island_group: c.island_group,
        lat: c.lat, lon: c.lon, pilot_city: c.pilot_city, hazards: c.hazards.split('; '),
        ...r, promises_kept_pct: s.promises_kept_pct, maintained_pct: s.maintained_pct,
      };
    });
  }

  // Advisories residents see: the CSV sample advisories, strongest first.
  function publicAdvisories(cityId) {
    return repo.advisoriesOf(cityId).map((a) => ({
      id: a.advisory_id, type: a.type, level: a.level, hazard_points: a.hazard_points, issued: a.issued,
      title: a.title, source: a.source,
      sections: { households: a.for_households, schools: a.for_schools, farmers: a.for_farmers, barangay_officials: a.for_barangay_officials },
    })).sort((a, b) => b.hazard_points - a.hazard_points || String(b.issued).localeCompare(String(a.issued)));
  }

  function page(cityId) {
    const c = mustCity(cityId);
    return {
      city: {
        city_id: c.city_id, city: c.city, province: c.province, island_group: c.island_group, lat: c.lat, lon: c.lon,
        hazards: c.hazards.split('; '), lccap: c.lccap, pilot_city: c.pilot_city, as_of: c.as_of,
      },
      risk: risk(cityId),
      advisories: publicAdvisories(cityId),
      projects: repo.projectsOf(cityId).map(projectSummary),
      open_gaps: openGaps(cityId),
      outlook: { label: 'Sample outlook. No live PAGASA outlook is connected; check PAGASA.', months: OUTLOOK[c.island_group] || [] },
      evacuation_centers: repo.centersOf(cityId),
      community_actions: repo.actionsOf(cityId),
      scorecard: scorecard(cityId),
      official_sources: OFFICIAL_SOURCES,
      official_line: OFFICIAL_LINE,
      sample_label: SAMPLE_LABEL,
    };
  }

  function project(projectId) {
    const p = repo.project(projectId);
    if (!p) throw new NotFoundError(`No project ${projectId}`);
    const c = repo.city(p.city_id);
    const siblings = repo.projectsOf(p.city_id).map((x) => x.project_id);
    const i = siblings.indexOf(projectId);
    const reports = store.get().reports.filter((r) => r.project_id === projectId)
      .map(({ observation_full, recorded_at, ...r }) => r);
    return {
      project: { ...projectSummary(p), summary: p.summary, lccap_source: p.lccap_source, latest_reply: p.latest_reply, rating: ratings.of(projectId), media: repo.mediaOf(projectId) },
      city: { city_id: c.city_id, city: c.city },
      evidence: [...reports, ...repo.evidenceOf(projectId)].sort((a, b) => String(b.date).localeCompare(String(a.date))),
      followups: followupsOf(p),
      nav: { prev: siblings[(i - 1 + siblings.length) % siblings.length], next: siblings[(i + 1) % siblings.length] },
      sample_label: SAMPLE_LABEL,
    };
  }

  // Everything the 3D explorer needs in one call, cities in route (CSV) order.
  function explore() {
    return {
      as_of: config.asOf,
      cities: repo.cities().map((c) => {
        const p = page(c.city_id);
        return {
          ...p,
          projects: p.projects.map((s) => {
            const d = project(s.project_id);
            return { ...d.project, evidence: d.evidence, followups: { sent: d.followups.sent, replied: d.followups.replied, awaiting: d.followups.awaiting } };
          }),
        };
      }),
      sample_label: SAMPLE_LABEL,
    };
  }

  return { list, page, project, explore, risk, activeAdvisories, openGaps, projectSummary, followupsOf, scorecard, mustCity };
}

module.exports = { createCityService };
