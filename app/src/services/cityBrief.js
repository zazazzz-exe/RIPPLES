// D3 — City risk brief (pre-season readiness brief), built from the data.
// No live research: the outlook section says so plainly instead of guessing.
const { enforce, OFFICIAL_LINE, OFFICIAL_SOURCES, SAMPLE_LABEL } = require('../domain/safeguards');
const OUTLOOK = require('../data/outlook');
const { monthName } = require('./templates/letter');

function createCityBrief({ repo, config }, { cities }) {
  function build(cityId) {
    const city = cities.mustCity(cityId);
    const risk = cities.risk(cityId);
    const projects = repo.projectsOf(cityId).map(cities.projectSummary);
    const gaps = projects.filter((p) => p.gap);
    const onTrack = projects.filter((p) => !p.gap && p.status !== 'Completed');
    const centers = repo.centersOf(cityId);
    const sc = cities.scorecard(cityId);

    const sections = [
      {
        heading: 'Hazard profile',
        items: [
          `Main hazards on record: ${city.hazards.replace(/; /g, ', ')}.`,
          `Real-risk level now: ${risk.real_risk_level} (hazard +${risk.hazard_points}, open gaps +${risk.gap_points}, score ${risk.risk_score} of 6)${risk.driver ? `, driven by ${risk.driver}` : ''}.`,
          'Hazard history from external sources is not connected in this version. See HazardHunterPH and Project NOAH.',
        ],
      },
      {
        heading: 'Seasonal outlook',
        items: [
          'No live PAGASA seasonal outlook is connected. The lines below are sample text; check PAGASA for the current outlook.',
          ...(OUTLOOK[city.island_group] || []).map(([m, t]) => `${m}: ${t}`),
        ],
      },
      {
        heading: 'Climate commitments',
        items: [
          `On track (${onTrack.length}): ${onTrack.map((p) => `${p.project} (${p.progress_pct}%, due ${monthName(p.deadline)})`).join('; ') || 'none'}.`,
          `Overdue (${gaps.filter((g) => g.gap === 'Overdue').length}): ${gaps.filter((g) => g.gap === 'Overdue').map((p) => `${p.project} (${p.status}, ${p.progress_pct}%, was due ${monthName(p.deadline)})`).join('; ') || 'none'}.`,
          `Needs maintenance (${gaps.filter((g) => g.gap === 'Needs maintenance').length}): ${gaps.filter((g) => g.gap === 'Needs maintenance').map((p) => p.project).join('; ') || 'none'}.`,
          `Scorecard: ${sc.promises_kept_pct ?? '—'}% of promises kept on time, ${sc.maintained_pct ?? '—'}% of finished defenses maintained, ${sc.followups_replied} of ${sc.followups_sent} follow-ups answered.`,
        ],
      },
      {
        heading: 'Open gaps that matter most this season',
        items: gaps.length
          ? gaps.map((g) => `${g.project} (${g.gap.toLowerCase()}, ${g.responsible_office}). Interim measure: ${g.interim_measure || 'none recorded'}`)
          : ['No open gaps on record.'],
      },
      {
        heading: 'Recommended actions',
        items: [
          'For the city DRRMO:',
          ...(gaps.length
            ? [
              `Confirm the interim measure for ${gaps[0].project} is in place before the next advisory.`,
              `Request revised completion dates for ${gaps.filter((g) => g.gap === 'Overdue').length || 'the'} overdue defense(s) from the responsible offices.`,
              `Pre-identify households exposed by the open gaps for pre-emptive evacuation to ${centers.map((c) => c.name).join(', ')}.`,
            ]
            : ['Keep maintenance checks on completed defenses.', 'Test early-warning systems before the season.', `Confirm ${centers.map((c) => c.name).join(', ')} are stocked.`]),
          'For residents:',
          `Know your route to the nearest evacuation center: ${centers.map((c) => c.name).join(', ')}.`,
          'Prepare a go-bag with documents, water and medicine before the season.',
          'Report blocked drains, damaged walls or offline sensors to your barangay, and follow PAGASA and NDRRMC updates.',
        ],
      },
    ];

    const title = `Pre-season readiness brief: ${city.city}`;
    const text = [
      title,
      `${SAMPLE_LABEL} Prepared ${config.today} from the Ripples sample data.`,
      ...sections.map((s) => `${s.heading}\n${s.items.map((i) => (i.endsWith(':') ? i : `- ${i}`)).join('\n')}`),
      `Official sources: ${OFFICIAL_SOURCES.map((o) => `${o.name} (${o.url})`).join(', ')}.`,
      OFFICIAL_LINE,
    ].join('\n\n');

    return enforce({ city_id: cityId, city: city.city, title, sections, text, sample_label: SAMPLE_LABEL, official_line: OFFICIAL_LINE }, { kind: 'report' });
  }

  return { build };
}

module.exports = { createCityBrief };
