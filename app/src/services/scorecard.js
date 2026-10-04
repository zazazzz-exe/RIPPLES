// D2 — Ripples Climate Scorecard.
const { SAMPLE_LABEL } = require('../domain/safeguards');

function createScorecard({ repo }, { cities, ratings }) {
  function build() {
    const cityRows = cities.list().map((c) => {
      const s = cities.scorecard(c.city_id);
      return {
        city_id: c.city_id, city: c.city, island_group: c.island_group, real_risk_level: c.real_risk_level, risk_score: c.risk_score,
        hazard_points: c.hazard_points, gap_points: c.gap_points, open_gaps: c.open_gaps,
        promises_kept_pct: s.promises_kept_pct, maintained_pct: s.maintained_pct,
        followups_sent: s.followups_sent, followups_replied: s.followups_replied,
      };
    }).sort((a, b) => b.risk_score - a.risk_score || a.city.localeCompare(b.city));

    const rated = ratings.summary();
    const projects = repo.projects().map((p) => {
      const r = rated[p.project_id] || { up: 0, down: 0 };
      return { ...cities.projectSummary(p), rating_up: r.up, rating_down: r.down };
    });
    // Most thumbs down: at least one down, sorted by downs, then lowest score.
    const mostDown = projects.filter((p) => p.rating_down > 0)
      .sort((a, b) => b.rating_down - a.rating_down || (a.rating_up - a.rating_down) - (b.rating_up - b.rating_down) || a.project.localeCompare(b.project))
      .slice(0, 5)
      .map((p) => {
        const t = ratings.tally(p.project_id);
        const top = Object.entries(t.reasons).sort((a, b) => b[1] - a[1])[0];
        return { project_id: p.project_id, project: p.project, city_id: p.city_id, up: t.up, down: t.down, top_reason: top ? ratings.REASONS[top[0]] : null };
      });
    const gaps = projects.filter((p) => p.gap);

    const byAgency = {};
    for (const g of gaps) {
      byAgency[g.agency] ||= { agency: g.agency, Overdue: 0, 'Needs maintenance': 0, total: 0 };
      byAgency[g.agency][g.gap] += 1;
      byAgency[g.agency].total += 1;
    }

    const byOffice = {};
    for (const p of projects.filter((x) => x.followups_sent > 0)) {
      byOffice[p.responsible_office] ||= { office: p.responsible_office, agency: p.agency, sent: 0, replied: 0 };
      byOffice[p.responsible_office].sent += p.followups_sent;
      byOffice[p.responsible_office].replied += p.followups_replied;
    }
    const offices = Object.values(byOffice).map((o) => ({ ...o, unanswered: o.sent - o.replied }))
      .sort((a, b) => b.unanswered - a.unanswered || a.office.localeCompare(b.office));

    return {
      title: 'Ripples Climate Scorecard',
      sample_label: SAMPLE_LABEL,
      kpis: {
        commitments_tracked: projects.length,
        open_gaps: gaps.length,
        overdue: gaps.filter((g) => g.gap === 'Overdue').length,
        needs_maintenance: gaps.filter((g) => g.gap === 'Needs maintenance').length,
        cities_high_or_critical: cityRows.filter((c) => c.real_risk_level === 'High' || c.real_risk_level === 'Critical').length,
        offices_without_reply: offices.filter((o) => o.unanswered > 0).length,
      },
      cities: cityRows,
      gaps_by_agency: Object.values(byAgency).sort((a, b) => b.total - a.total),
      followup_accountability: offices,
      projects,
      most_down: mostDown,
      explanations: {
        cities: 'Cities ranked by real-risk score: current hazard points plus open-gap points (fixed rules).',
        gaps_by_agency: 'Open gaps are projects that are overdue or need maintenance, grouped by the agency responsible.',
        followup_accountability: 'Follow-up letters sent and replies received per responsible office.',
        projects: 'Every tracked commitment with its status, progress, deadline, gap, interim measure and public rating.',
        most_down: 'Anonymous public ratings. They are opinions only and never change a project’s status or risk.',
      },
    };
  }
  return { build };
}

module.exports = { createScorecard };
