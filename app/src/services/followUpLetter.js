// D4b — Follow-up letter to the responsible office.
const rules = require('../domain/rules');
const { enforce, SAMPLE_LABEL } = require('../domain/safeguards');
const { followUpLetter } = require('./templates/letter');
const { NotFoundError, ConflictError } = require('../errors');

function createFollowUpLetter({ repo, config }, { cities, drafts, outbox }) {
  function build(projectId, { note = '' } = {}) {
    const project = repo.project(projectId);
    if (!project) throw new NotFoundError(`No project ${projectId}`);
    const city = repo.city(project.city_id);
    const fu = cities.followupsOf(project);
    const active = cities.activeAdvisories(city.city_id).filter((a) => rules.hazardPoints(a) >= 1);
    const letter = followUpLetter({
      project: { ...project, followups_sent: fu.sent, followups_replied: fu.replied },
      city,
      gap: rules.gapType(project, config.asOf),
      activeAdvisories: active,
      replyDays: config.replyClockWorkingDays,
    });
    const draft = {
      kind: 'letter',
      city_id: city.city_id, city: city.city, project_id: project.project_id, project: project.project,
      office: project.responsible_office, agency: project.agency,
      to: outbox.testAddress(project.responsible_office),
      subject: letter.subject, body: letter.body,
      hazard_sentence_included: letter.hazard_sentence_included,
      note,
      log_entry: `${config.today}, ${project.project_id}, "${project.responsible_office}", drafted`,
      sample_label: SAMPLE_LABEL,
      source_records: [`projects.csv:${project.project_id}`, `cities.csv:${city.city_id}`, ...active.map((a) => `advisories.csv:${a.advisory_id}`)],
    };
    return enforce(draft, { kind: 'letter' });
  }

  return {
    preview: build,
    create(projectId, opts) {
      if (drafts.pendingFor('letter', 'project_id', projectId)) {
        throw new ConflictError(`A follow-up letter for ${projectId} is already waiting for approval`);
      }
      return drafts.create(build(projectId, opts));
    },
  };
}

module.exports = { createFollowUpLetter };
