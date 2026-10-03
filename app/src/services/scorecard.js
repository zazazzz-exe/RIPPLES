// D2 — Ripples Climate Scorecard.
const { SAMPLE_LABEL } = require('../domain/safeguards');

function createScorecard({ repo }, { cities }) {
  function build() {
    const cityRows = cities.list().map((c) => {
      const s = cities.scorecard(c.city_id);
      return {
        city_id: c.city_id, city: c.city, real_risk_level: c.real_risk_level, risk_score: c.risk_score,
        hazard_points: c.hazard_points, gap_points: c.gap_points, open_gaps: c.open_gaps,
        promises_kept_pct: s.promises_kept_pct, maintained_pct: s.maintained_pct,
        followups_sent: s.followups_sent, followups_replied: s.followups_replied,
        changed_by_simulation: c.changed_by_simulation,
      };
    }).sort((a, b) => b.risk_score - a.risk_score || a.city.localeCompare(b.city));

    const projects = repo.projects().map(cities.projectSummary);
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
      explanations: {
        cities: 'Cities ranked by real-risk score: current hazard points plus open-gap points (fixed rules).',
        gaps_by_agency: 'Open gaps are projects that are overdue or need maintenance, grouped by the agency responsible.',
        followup_accountability: 'Follow-up letters sent and replies received per responsible office.',
        projects: 'Every tracked commitment with its status, progress, deadline, gap and interim measure.',
      },
    };
  }
  return { build };
}

module.exports = { createScorecard };
