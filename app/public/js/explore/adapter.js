// Maps GET /api/explore onto the data model the 3D explorer was built for
// (the mockup's CITIES). Pure function: no DOM, no fetch. Risk, gaps and the
// scorecard come from the server's fixed rules; nothing is recomputed here.

const round = (n) => Math.round(n * 10000) / 10000;

function advisory(a) {
  return {
    id: a.id, type: a.type, level: a.level, time: a.issued, title: a.title, source: a.source,
    households: a.sections.households, schools: a.sections.schools,
    farmers: a.sections.farmers, barangay: a.sections.barangay_officials,
    points: a.hazard_points,
  };
}

function project(p, city, mine) {
  return {
    id: p.project_id, name: p.project, type: p.type, agency: p.agency, office: p.responsible_office,
    budget: p.budget_php_millions, status: p.status, progress: p.progress_pct,
    start: p.start, deadline: p.deadline, done: p.completed || null, maint: p.maintenance || null,
    summary: p.summary, interim: p.interim_measure, gap: p.gap || null, lccap: p.lccap_source,
    evidence: p.evidence.map((e) => [e.date, e.source, e.observation, Boolean(e.corroborated), mine.has(e.evidence_id) ? 'mine' : null, e.flags || []]),
    fu: { sent: p.followups.sent, replied: p.followups.replied, awaiting: p.followups.awaiting, reply: p.latest_reply || null },
    dx: round(p.approx_lon - city.lon), dy: round(p.approx_lat - city.lat),
    rating: p.rating || { up: 0, down: 0 },
    media: p.media || { photos: [], references: [] },
  };
}

export function toCities(data, { mine = new Set() } = {}) {
  return data.cities.map((b) => {
    const c = b.city;
    const [topType, topLevel] = (b.risk.driver || '').split(': ');
    const s = b.scorecard;
    return {
      id: c.city_id, name: c.city, prov: c.province, region: c.island_group, lat: c.lat, lon: c.lon,
      pilot: c.pilot_city, hazards: c.hazards, lccap: c.lccap,
      advisories: b.advisories.map(advisory),
      evac: b.evacuation_centers.map((e) => [e.name, e.capacity_persons, round(e.approx_lon - c.lon), round(e.approx_lat - c.lat)]),
      actions: b.community_actions.map((a) => [a.kind, a.action, a.when]),
      projects: b.projects.map((p) => project(p, c, mine)),
      outlook: b.outlook.months, outlookLabel: b.outlook.label,
      risk: {
        h: b.risk.hazard_points, g: b.risk.gap_points, s: b.risk.risk_score, lvl: b.risk.real_risk_level,
        top: topType ? { type: topType, level: topLevel } : null,
      },
      score: {
        kept: s.promises_kept_pct, keptN: s.kept_on_time, dueN: s.commitments_due,
        maint: s.maintained_pct, okN: s.maintained_ok, doneN: s.completed_defenses,
        sent: s.followups_sent, rep: s.followups_replied, silent: s.followups_sent - s.followups_replied,
      },
    };
  });
}
