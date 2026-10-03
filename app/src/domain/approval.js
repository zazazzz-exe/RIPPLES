// Safeguard S2 as one policy. Every release (publish an advisory, send a
// letter) asks this policy first. The mode is set once in config.js.

const STATES = Object.freeze({ DRAFT: 'DRAFT', APPROVED: 'APPROVED', REJECTED: 'REJECTED' });

class ApprovalError extends Error {}

function createApprovalPolicy(mode) {
  if (mode !== 'required' && mode !== 'auto') throw new RangeError(`Unknown approval mode: ${mode}`);

  return {
    mode,
    initialState: () => (mode === 'auto' ? STATES.APPROVED : STATES.DRAFT),
    canRelease: (draft) => draft.review_state === STATES.APPROVED,

    decide(draft, decision, { note = '', at } = {}) {
      if (draft.review_state !== STATES.DRAFT) {
        throw new ApprovalError(`Draft ${draft.id} is already ${draft.review_state}`);
      }
      if (decision !== 'approve' && decision !== 'reject') throw new ApprovalError(`Unknown decision: ${decision}`);
      return {
        ...draft,
        review_state: decision === 'approve' ? STATES.APPROVED : STATES.REJECTED,
        decided_at: at,
        decision_note: note,
      };
    },

    assertReleasable(draft) {
      if (draft.review_state !== STATES.APPROVED) {
        throw new ApprovalError(`Draft ${draft.id} is ${draft.review_state}; it needs approval before release`);
      }
    },
  };
}

module.exports = { STATES, ApprovalError, createApprovalPolicy };
