// Follow-up letter template (D4b). Neutral wording only (S3).
// Based on quick-build/D4b-follow-up-letter/sample-letter-mal-wall.md.

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const monthName = (ym) => (ym ? `${MONTHS[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}` : 'not recorded');
const peso = (m) => (m == null ? 'not recorded' : `₱${m.toLocaleString('en-US')} million`);

function salutation(office) {
  const title = office.split(',')[0].trim();
  return `Dear ${title},`;
}

function followUpLetter({ project, city, gap, activeAdvisories, replyDays }) {
  const subject = `Status request: ${project.project} (sample reference ${project.project_id})`;
  const hazard = activeAdvisories.length
    ? `This defense matters this week because ${activeAdvisories.map((a) => `${a.source.replace(/ \(sample\)$/, '')} has an active ${a.type.toLowerCase()} advisory (${a.level})`).join(' and ')} for ${city.city}, which raises the exposure of the barangays this project is meant to protect.`
    : null;

  const paragraphs = [
    salutation(project.responsible_office),
    `We write regarding the ${project.project}, a commitment under ${city.city}'s ${project.lccap_source}. ${project.summary} The recorded budget is ${peso(project.budget_php_millions)}, with a committed deadline of ${monthName(project.deadline)}.`,
    `Our records currently show the project's status as ${project.status}, with progress at about ${project.progress_pct}%${gap ? `, and the commitment is marked ${gap}` : ''}. The recorded interim measure is: ${project.interim_measure || 'none recorded'} ${project.followups_sent ? `We note that ${project.followups_sent} follow-up${project.followups_sent === 1 ? ' has' : 's have'} been recorded for this project, with ${project.followups_replied} ${project.followups_replied === 1 ? 'reply' : 'replies'} logged to date.` : ''}`.trim(),
    'So that this record can be kept accurate and complete, we respectfully request the following:',
    `1. Current progress and a revised completion date for the ${project.project}.\n2. Interim measures your office recommends for the affected barangays for the current season.\n3. A copy of the latest progress report, requested under Executive Order No. 2, s. 2016 (Freedom of Information) or the applicable local FOI ordinance.`,
    `Your reply will be posted in full on the City Page so residents can read it directly. If no reply is received within ${replyDays} working days, the record will note "No reply" for that period.`,
    hazard,
    'Thank you for your attention to this request. We would be glad to receive your response at your earliest convenience.',
    'Respectfully,\nRipples Follow-up Program (sample-data demonstration)',
  ].filter(Boolean);

  return { subject, body: paragraphs.join('\n\n'), hazard_sentence_included: Boolean(hazard) };
}

module.exports = { followUpLetter, monthName, peso };
