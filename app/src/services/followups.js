// Follow-up log: letters released through the approval gate start a reply
// clock (see drafts.js). The Scorecard reads the log and records replies.
const { ValidationError, NotFoundError } = require('../errors');

function createFollowups({ store, config }) {
  function recordReply(followupId, reply) {
    if (!String(reply || '').trim()) throw new ValidationError('reply text is required');
    return store.update((s) => {
      const f = s.followups.find((x) => x.id === followupId);
      if (!f) throw new NotFoundError(`No follow-up ${followupId}`);
      Object.assign(f, { status: 'Replied', reply: String(reply).trim(), replied_on: config.today });
      return f;
    });
  }

  function summary() {
    const f = store.get().followups;
    return {
      letters_sent: f.length,
      replies: f.filter((x) => x.status === 'Replied').length,
      no_reply: f.filter((x) => x.status === 'No reply').length,
      awaiting: f.filter((x) => x.status === 'Awaiting reply').length,
      followups: [...f].reverse(),
    };
  }

  return { recordReply, summary };
}

module.exports = { createFollowups };
