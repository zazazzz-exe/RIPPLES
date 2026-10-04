// Safeguards S1–S7 as code. Every generated output passes through check().

const OFFICIAL_SOURCES = Object.freeze([
  { name: 'PAGASA', url: 'https://www.pagasa.dost.gov.ph', role: 'Weather, rainfall, heat and tropical cyclone warnings' },
  { name: 'NDRRMC', url: 'https://ndrrmc.gov.ph', role: 'Disaster response and evacuation orders' },
  { name: 'HazardHunterPH', url: 'https://hazardhunter.georisk.gov.ph', role: 'Hazard maps by location' },
  { name: 'Project NOAH', url: 'https://noah.up.edu.ph', role: 'Flood, landslide and storm surge maps' },
]);

const OFFICIAL_LINE = 'Follow official warnings and evacuation orders from PAGASA and NDRRMC.';
const SAMPLE_LABEL = 'Sample data. Not an official record.';

// S1: never tell anyone they are "safe".
const NEVER_SAFE = [/\bsafe\b/i, /\bout of danger\b/i, /\bno risk\b/i, /\bnothing to worry\b/i];

// S3: neutral language only.
const ACCUSATORY = [
  /\bcorrupt(ion|ed)?\b/i, /\bnegligen(t|ce)\b/i, /(?<!-)\blying\b/i, /\bliars?\b/i, /\bfraudulent\b/i,
  /\bsteal(ing)?\b/i, /\bstole(n)?\b/i, /\btheft\b/i, /\bincompeten(t|ce)\b/i, /\bscam\b/i,
  /\bghost project/i, /\bkickbacks?\b/i, /\bembezzl/i,
];

// S5: fields that could identify a reporter. Never stored, never returned.
const REPORTER_FIELDS = ['name', 'reporter', 'reporter_name', 'email', 'phone', 'contact', 'mobile', 'address', 'ip', 'device'];

function textOf(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(textOf).join('\n');
  if (typeof value === 'object') return Object.values(value).map(textOf).join('\n');
  return String(value);
}

// Returns a list of violations (empty = passes).
// kind: 'advisory' | 'letter' | 'notice' | 'report' | 'answer' | 'evidence'
function check(output, { kind, requireSampleLabel = true } = {}) {
  const text = textOf(output);
  const violations = [];
  for (const re of NEVER_SAFE) if (re.test(text)) violations.push({ rule: 'S1', detail: `matches ${re}` });
  for (const re of ACCUSATORY) if (re.test(text)) violations.push({ rule: 'S3', detail: `matches ${re}` });
  if ((kind === 'advisory' || kind === 'notice' || kind === 'report') && !text.includes(OFFICIAL_LINE)) {
    violations.push({ rule: 'S1', detail: 'missing the PAGASA/NDRRMC official line' });
  }
  if (requireSampleLabel && !/sample/i.test(text)) violations.push({ rule: 'S7', detail: 'missing sample-data label' });
  if (kind === 'evidence' && output && typeof output === 'object') {
    for (const f of REPORTER_FIELDS) {
      if (f in output) violations.push({ rule: 'S5', detail: `contains field "${f}"` });
    }
  }
  return violations;
}

class SafeguardError extends Error {
  constructor(violations) {
    super(`Safeguard check failed: ${violations.map((v) => `${v.rule} ${v.detail}`).join('; ')}`);
    this.violations = violations;
  }
}

function enforce(output, opts) {
  const v = check(output, opts);
  if (v.length) throw new SafeguardError(v);
  return output;
}

function redactReporter(input) {
  const out = { ...input };
  for (const f of REPORTER_FIELDS) delete out[f];
  return out;
}

// S6: corroborated only with ≥2 other matching reports or a satellite check.
function corroborationStatus({ matchingReports, satelliteAgrees }) {
  return matchingReports >= 2 || satelliteAgrees ? 'corroborated' : 'unverified';
}

module.exports = {
  OFFICIAL_SOURCES, OFFICIAL_LINE, SAMPLE_LABEL, REPORTER_FIELDS,
  check, enforce, SafeguardError, redactReporter, corroborationStatus,
};
