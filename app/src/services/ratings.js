// Public thumbs up/down ratings, one per browser per project.
// The browser sends a random ID; only a salted hash of (project, ID) is kept,
// so nothing identifies a person and votes can't be linked across projects (S5).
// Ratings are opinions: they never change status or risk (S4) and are not
// evidence (S6).
const crypto = require('node:crypto');
const { ValidationError, NotFoundError } = require('../errors');

const REASONS = Object.freeze({
  unfinished: 'Looks unfinished',
  not_working: 'Not working or not maintained',
  hard_to_access: 'Hard to find or access',
  not_useful: 'Not useful to the community',
  other: 'Other',
});
const VOTER = /^[A-Za-z0-9-]{16,64}$/;

function createRatings({ repo, store, config }) {
  const hash = (projectId, voter) => crypto.createHash('sha256').update(`${config.ratingSalt}|${projectId}|${voter}`).digest('hex');

  function mustProject(projectId) {
    if (!repo.project(projectId)) throw new NotFoundError(`No project ${projectId}`);
  }
  function checkVoter(voter) {
    if (typeof voter !== 'string' || !VOTER.test(voter)) throw new ValidationError('voter must be 16–64 letters, digits or dashes');
  }

  function tally(projectId, voter) {
    mustProject(projectId);
    const votes = Object.values(store.get().ratings[projectId] || {});
    const reasons = {};
    for (const v of votes) if (v.vote === 'down' && v.reason) reasons[v.reason] = (reasons[v.reason] || 0) + 1;
    const up = votes.filter((v) => v.vote === 'up').length;
    const down = votes.length - up;
    let mine = null;
    if (voter !== undefined && voter !== null && voter !== '') {
      checkVoter(voter);
      mine = (store.get().ratings[projectId] || {})[hash(projectId, voter)] || null;
    }
    return { project_id: projectId, up, down, score: up - down, reasons, mine: mine ? mine.vote : null, mine_reason: mine ? mine.reason : null, reason_options: REASONS };
  }

  function vote(projectId, voter, value, reason = null) {
    mustProject(projectId);
    checkVoter(voter);
    if (value !== 'up' && value !== 'down' && value !== null) throw new ValidationError('vote must be "up", "down" or null');
    if (reason !== null && reason !== undefined && reason !== '') {
      if (value !== 'down') throw new ValidationError('a reason can only go with a thumbs down');
      if (!(reason in REASONS)) throw new ValidationError(`reason must be one of ${Object.keys(REASONS).join(', ')}`);
    } else reason = null;
    const key = hash(projectId, voter);
    store.update((s) => {
      s.ratings[projectId] ||= {};
      if (value === null) delete s.ratings[projectId][key];
      else s.ratings[projectId][key] = { vote: value, reason, at: new Date().toISOString() };
    });
    return tally(projectId, voter);
  }

  // { projectId: { up, down } } for every rated project.
  function summary() {
    const out = {};
    for (const [pid, votes] of Object.entries(store.get().ratings)) {
      const list = Object.values(votes);
      const up = list.filter((v) => v.vote === 'up').length;
      out[pid] = { up, down: list.length - up };
    }
    return out;
  }

  const of = (projectId) => summary()[projectId] || { up: 0, down: 0 };

  return { vote, tally, summary, of, REASONS };
}

module.exports = { createRatings, REASONS };
