// D6 — Ripples City Assistant. Rule-based: it recognizes a fixed set of
// questions, answers from the data with citations, and defers to PAGASA and
// NDRRMC for anything live or unrecognized.
const rules = require('../domain/rules');
const { enforce, OFFICIAL_SOURCES, OFFICIAL_LINE, SAMPLE_LABEL } = require('../domain/safeguards');

const CITY_ALIASES = { cdo: ['cagayan de oro', 'cdo'] };

function createAssistant({ repo }, { cities, advisoryCard, scorecard }) {
  function findCity(q) {
    const text = q.toLowerCase();
    return repo.cities().find((c) => {
      const names = [c.city.toLowerCase(), c.city.toLowerCase().replace(/ city$/, ''), ...(CITY_ALIASES[c.city_id] || [])];
      return names.some((n) => new RegExp(`\\b${n}\\b`).test(text));
    }) || null;
  }

  // "orange rainfall warning", "signal 3", "heat index 45", "flood warning"...
  function findAdvisory(q) {
    const t = q.toLowerCase();
    let m;
    if ((m = t.match(/(yellow|orange|red)\s+rain/))) return { type: 'Rain', level: m[1][0].toUpperCase() + m[1].slice(1) };
    if ((m = t.match(/signal\s*(?:no\.?\s*)?([1-5])/))) return { type: 'Typhoon', level: `Signal ${m[1]}` };
    if ((m = t.match(/heat index\s*(?:of\s*)?(\d{2})/))) return { type: 'Heat', heat_index: Number(m[1]) };
    if ((m = t.match(/flood (watch|advisory|warning)/))) return { type: 'Flood', level: m[1][0].toUpperCase() + m[1].slice(1) };
    if (/thunderstorm/.test(t)) return { type: 'Thunderstorm', level: 'Advisory' };
    if (/high tide/.test(t)) return { type: 'Coastal', level: 'High tide' };
    if (/gale/.test(t)) return { type: 'Coastal', level: 'Gale warning' };
    if ((m = t.match(/\b(drought|dry spell)\b/))) return { type: 'Drought', level: m[1] === 'drought' ? 'Drought' : 'Dry spell' };
    return null;
  }

  const AUDIENCES = [
    ['households', /household|family|families|resident/],
    ['schools', /school|class/],
    ['farmers', /farmer|fisher|crop/],
    ['barangay_officials', /barangay|official|kagawad|captain/],
  ];

  const INTENTS = [
    {
      id: 'live',
      test: (q) => /\b(right now|currently|today|tonight|live|latest warning|current warning|is there a (typhoon|storm))\b/.test(q),
      answer: () => ({
        text: 'For live warnings and evacuation orders, check PAGASA and NDRRMC directly. This assistant only knows the Ripples sample records and does not receive live feeds.',
        citations: [],
      }),
    },
    {
      id: 'draft_guidance',
      test: (q, ctx) => /\b(draft|write|prepare)\b/.test(q) && ctx.advisory && ctx.city,
      answer: (q, { city, advisory }) => {
        const card = advisoryCard.preview({ city_id: city.city_id, ...advisory });
        const wanted = AUDIENCES.filter(([, re]) => re.test(q)).map(([k]) => k);
        const keys = wanted.length ? wanted : AUDIENCES.map(([k]) => k);
        return {
          text: `DRAFT guidance for ${card.type}: ${card.level} in ${city.city} (hazard points ${card.hazard_points}, fixed PAGASA rules). This is a preview; use Simulate or Ops to create a draft for approval.`,
          bullets: keys.map((k) => `${k.replace('_', ' ')}: ${card.sections[k]}`).concat(OFFICIAL_LINE),
          citations: card.source_records,
        };
      },
    },
    {
      id: 'no_reply',
      test: (q) => /(not|n't|no) (yet )?(replied|reply|respond|answered)|unanswered|silent/.test(q),
      answer: (q, { city }) => {
        const rows = scorecard.build().followup_accountability.filter((o) => o.unanswered > 0)
          .filter((o) => !city || repo.projects().some((p) => p.city_id === city.city_id && p.responsible_office === o.office));
        return {
          text: rows.length
            ? `${rows.length} office${rows.length === 1 ? ' has' : 's have'} follow-ups without a reply${city ? ` in ${city.city}` : ''}:`
            : `No unanswered follow-ups are on record${city ? ` for ${city.city}` : ''}.`,
          bullets: rows.map((o) => `${o.office}: ${o.replied} of ${o.sent} answered`),
          citations: repo.projects().filter((p) => rows.some((o) => o.office === p.responsible_office) && p.followups_sent > p.followups_replied).map((p) => `projects.csv:${p.project_id}`),
        };
      },
    },
    {
      id: 'evacuation',
      test: (q, ctx) => /evacuat|shelter/.test(q) && ctx.city,
      answer: (q, { city }) => {
        const list = repo.centersOf(city.city_id);
        return {
          text: `Evacuation centers on record for ${city.city}:`,
          bullets: list.map((c) => `${c.name}, capacity ${c.capacity_persons.toLocaleString('en-US')}`),
          citations: list.map((c) => `evacuation_centers.csv:${c.center_id}`),
        };
      },
    },
    {
      id: 'gaps',
      test: (q, ctx) => /gap|overdue|delay|maintenance|unfinished|missing/.test(q) && ctx.city,
      answer: (q, { city }) => {
        const gaps = cities.openGaps(city.city_id);
        const r = cities.risk(city.city_id);
        return {
          text: gaps.length
            ? `${city.city} has ${gaps.length} open gap${gaps.length === 1 ? '' : 's'}, adding +${r.gap_points} to its real-risk score (${r.real_risk_level}, ${r.risk_score} of 6):`
            : `${city.city} has no open gaps on record. Its real-risk level is ${r.real_risk_level}.`,
          bullets: gaps.map((g) => `${g.project}: ${g.gap.toLowerCase()} (${g.status}, ${g.progress_pct}%). Responsible: ${g.responsible_office}. Interim measure: ${g.interim_measure}`),
          citations: gaps.map((g) => `projects.csv:${g.project_id}`).concat(`cities.csv:${city.city_id}`),
        };
      },
    },
    {
      id: 'risk',
      test: (q, ctx) => /risk|level|score|danger|how (bad|exposed)/.test(q) && ctx.city,
      answer: (q, { city }) => {
        const r = cities.risk(city.city_id);
        return {
          text: `${city.city}'s real-risk level is ${r.real_risk_level}: hazard +${r.hazard_points}${r.driver ? ` (${r.driver})` : ''} plus open gaps +${r.gap_points} = ${r.risk_score} of 6. The level comes from fixed rules, not a model.`,
          bullets: [],
          citations: [`cities.csv:${city.city_id}`, ...repo.advisoriesOf(city.city_id).map((a) => `advisories.csv:${a.advisory_id}`)],
        };
      },
    },
    {
      id: 'ranking',
      test: (q) => /which cities|most at risk|highest risk|rank/.test(q),
      answer: () => {
        const list = cities.list().sort((a, b) => b.risk_score - a.risk_score);
        return {
          text: 'Cities by real-risk score (fixed rules):',
          bullets: list.map((c) => `${c.city}: ${c.real_risk_level} (${c.risk_score} of 6), ${c.open_gaps} open gap${c.open_gaps === 1 ? '' : 's'}`),
          citations: list.map((c) => `cities.csv:${c.city_id}`),
        };
      },
    },
  ];

  const SUGGESTIONS = [
    'Which open gaps raise Malabon\'s risk this season?',
    'Which offices have not replied to follow-ups?',
    'Draft the household section for an orange rainfall warning in Legazpi.',
    'What is the risk level of Dagupan?',
    'Where are the evacuation centers in Tacloban?',
  ];

  function ask(question) {
    const raw = String(question || '').trim().slice(0, 500);
    const q = raw.toLowerCase();
    const ctx = { city: findCity(q), advisory: findAdvisory(q) };
    const intent = INTENTS.find((i) => i.test(q, ctx));
    let a;
    if (intent) {
      try { a = { intent: intent.id, ...intent.answer(q, ctx) }; }
      catch (e) { a = { intent: 'error', text: `I could not answer that: ${e.message}`, citations: [] }; }
    } else {
      a = {
        intent: 'fallback',
        text: ctx.city || /\b(city|cities)\b/.test(q)
          ? 'I can answer questions about open gaps, risk levels, evacuation centers and follow-up replies, and draft advisory guidance. Try one of the suggestions.'
          : 'I could not match that to a city or a supported question. Name one of the tracked cities, or try a suggestion.',
        citations: [],
      };
    }
    const answer = {
      question: raw,
      ...a,
      bullets: a.bullets || [],
      sample_label: `${SAMPLE_LABEL} Answers come from the Ripples sample records.`,
      official_sources: OFFICIAL_SOURCES.slice(0, 2),
      suggestions: intent ? [] : SUGGESTIONS,
    };
    return enforce(answer, { kind: 'answer' });
  }

  return { ask, SUGGESTIONS };
}

module.exports = { createAssistant };
