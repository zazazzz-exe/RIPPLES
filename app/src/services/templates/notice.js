// Interim-measure notice for barangay officials (D5b).
const { OFFICIAL_LINE } = require('../../domain/safeguards');

function interimNotice({ city, signal, stormName, openGaps }) {
  const subject = `Interim measures: Wind Signal No. ${signal} (${stormName}), ${city.city}`;
  const gaps = openGaps.length
    ? openGaps.map((g) => `- ${g.project} (${g.gap.toLowerCase()}, ${g.responsible_office}): ${g.interim_measure || 'assign watchers and pre-position sandbags.'}`).join('\n')
    : '- No open gaps on record. Confirm evacuation centers are open, staffed and stocked.';
  const body = [
    `To barangay officials of ${city.city}:`,
    `Wind Signal No. ${signal} applies to the city under the ${stormName} simulation. These open gaps leave households more exposed while the signal is up. Please put the interim measures below in place and prioritize pre-emptive evacuation of the households they affect.`,
    gaps,
    OFFICIAL_LINE,
  ].join('\n\n');
  return { subject, body };
}

module.exports = { interimNotice };
