// Appendix B: the fixed real-risk rules. Pure functions, no I/O.
// Every risk and advisory level in the app comes from here (safeguard S4).

// Hazard points per advisory "Type:Level", mirroring PAGASA categories.
const ADVISORY_POINTS = Object.freeze({
  'Heat:Caution': 0, 'Heat:Extreme Caution': 1, 'Heat:Danger': 2, 'Heat:Extreme Danger': 3,
  'Rain:Yellow': 1, 'Rain:Orange': 2, 'Rain:Red': 3,
  'Flood:Watch': 1, 'Flood:Advisory': 2, 'Flood:Warning': 3,
  'Typhoon:Signal 1': 1, 'Typhoon:Signal 2': 2, 'Typhoon:Signal 3': 3, 'Typhoon:Signal 4': 3, 'Typhoon:Signal 5': 3,
  'Drought:Dry condition': 1, 'Drought:Dry spell': 1, 'Drought:Drought': 2,
  'Thunderstorm:Advisory': 1, 'Coastal:Gale warning': 1, 'Coastal:High tide': 1,
});

const ADVISORY_TYPES = Object.freeze(['Heat', 'Rain', 'Flood', 'Typhoon', 'Drought', 'Thunderstorm', 'Coastal']);

const LEVELS = Object.freeze(['Low', 'Moderate', 'High', 'Critical']);

// PAGASA heat index categories (°C).
function heatLevelFromIndex(celsius) {
  if (celsius >= 52) return 'Extreme Danger';
  if (celsius >= 42) return 'Danger';
  if (celsius >= 33) return 'Extreme Caution';
  if (celsius >= 27) return 'Caution';
  return null;
}

function levelsFor(type) {
  return Object.keys(ADVISORY_POINTS).filter((k) => k.startsWith(`${type}:`)).map((k) => k.split(':')[1]);
}

function hazardPoints({ type, level }) {
  const key = `${type}:${level}`;
  if (!(key in ADVISORY_POINTS)) throw new RangeError(`Unknown advisory level: ${key}`);
  return ADVISORY_POINTS[key];
}

// A project is an open gap when it is Delayed, Not started after its
// deadline, or Completed but flagged "Needs maintenance".
function gapType(project, asOf) {
  if (project.status === 'Completed') {
    return project.maintenance === 'Needs maintenance' ? 'Needs maintenance' : null;
  }
  if (project.status === 'Delayed') return 'Overdue';
  if (project.deadline && project.deadline < asOf) return 'Overdue';
  return null;
}

const isOpenGap = (project, asOf) => gapType(project, asOf) !== null;

function riskLevel(score) {
  if (score <= 1) return 'Low';
  if (score <= 3) return 'Moderate';
  if (score === 4) return 'High';
  return 'Critical';
}

function cityRisk(advisories, projects, asOf) {
  const hazard = advisories.reduce((max, a) => Math.max(max, hazardPoints(a)), 0);
  const gaps = projects.filter((p) => isOpenGap(p, asOf));
  const gap = Math.min(3, gaps.length);
  const score = hazard + gap;
  const top = advisories.find((a) => hazardPoints(a) === hazard && hazard > 0) || null;
  return {
    hazard_points: hazard,
    gap_points: gap,
    risk_score: score,
    real_risk_level: riskLevel(score),
    open_gaps: gaps.length,
    driver: top ? `${top.type}: ${top.level}` : null,
  };
}

const pct = (n, d) => (d === 0 ? null : Math.round((n / d) * 100));

// Scorecard: promises kept on time, defenses maintained, follow-ups answered.
function cityScorecard(projects, asOf) {
  const due = projects.filter((p) => p.deadline && p.deadline < asOf);
  const kept = due.filter((p) => p.completed && p.completed <= p.deadline);
  const completed = projects.filter((p) => p.status === 'Completed');
  const maintained = completed.filter((p) => p.maintenance === 'OK');
  const sent = projects.reduce((s, p) => s + (p.followups_sent || 0), 0);
  const replied = projects.reduce((s, p) => s + (p.followups_replied || 0), 0);
  return {
    commitments_due: due.length,
    kept_on_time: kept.length,
    promises_kept_pct: pct(kept.length, due.length),
    completed_defenses: completed.length,
    maintained_ok: maintained.length,
    maintained_pct: pct(maintained.length, completed.length),
    followups_sent: sent,
    followups_replied: replied,
    followups_answered_pct: pct(replied, sent),
  };
}

// Simulated typhoon: the 3D mockup's track and distance thresholds (degrees).
const DEMO_TYPHOON = Object.freeze({
  name: 'Typhoon DEMO',
  track: [[12.2, 131.5], [12.8, 127.5], [13.1, 124.9], [13.6, 123.0], [14.2, 121.3], [15.0, 119.0]],
});

function signalForDistance(d) {
  if (d < 0.9) return 3;
  if (d < 1.8) return 2;
  if (d < 2.8) return 1;
  return 0;
}

// Shortest distance (degrees, longitude scaled by latitude) from a point to a polyline.
function distanceToTrack(lat, lon, track) {
  const cs = Math.cos((lat * Math.PI) / 180);
  let best = Infinity;
  for (let i = 0; i < track.length - 1; i++) {
    const [ay, axr] = track[i];
    const [by, bxr] = track[i + 1];
    const ax = axr * cs; const bx = bxr * cs; const px = lon * cs; const py = lat;
    const dx = bx - ax; const dy = by - ay;
    let t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy);
    t = Math.max(0, Math.min(1, t));
    best = Math.min(best, Math.hypot(px - (ax + t * dx), py - (ay + t * dy)));
  }
  return best;
}

// Working days after an ISO date (Mon–Fri; holidays not modeled).
function addWorkingDays(isoDate, days) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  let left = days;
  while (left > 0) {
    d.setUTCDate(d.getUTCDate() + 1);
    const wd = d.getUTCDay();
    if (wd !== 0 && wd !== 6) left -= 1;
  }
  return d.toISOString().slice(0, 10);
}

function daysBetween(a, b) {
  return Math.round((new Date(`${b}T00:00:00Z`) - new Date(`${a}T00:00:00Z`)) / 86400000);
}

module.exports = {
  ADVISORY_POINTS, ADVISORY_TYPES, LEVELS, DEMO_TYPHOON,
  heatLevelFromIndex, levelsFor, hazardPoints, gapType, isOpenGap, riskLevel, cityRisk,
  cityScorecard, signalForDistance, distanceToTrack, addWorkingDays, daysBetween,
};
