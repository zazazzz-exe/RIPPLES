const fs = require('node:fs');
const path = require('node:path');

const EMPTY = () => ({
  drafts: [],          // generated outputs with review_state
  outbox: [],          // released letters/notices (test addresses only)
  followups: [],       // follow-up log: { project_id, sent_on, clock_due, status }
  reports: [],         // triaged citizen reports (no reporter identity)
  simulation: null,    // active typhoon simulation, or null
  seq: 0,
});

// Mutable application state persisted as one JSON file. Writes are atomic
// (temp file + rename). Pass { persist: false } for in-memory use in tests.
function createStateStore(stateDir, { persist = true } = {}) {
  const file = path.join(stateDir, 'state.json');
  let state = EMPTY();

  if (persist) {
    fs.mkdirSync(stateDir, { recursive: true });
    if (fs.existsSync(file)) {
      try { state = { ...EMPTY(), ...JSON.parse(fs.readFileSync(file, 'utf8')) }; }
      catch { state = EMPTY(); }
    }
  }

  function save() {
    if (!persist) return;
    const tmp = `${file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
    fs.renameSync(tmp, file);
  }

  return {
    get: () => state,
    update(fn) { const r = fn(state); save(); return r; },
    reset() { state = EMPTY(); save(); },
  };
}

module.exports = { createStateStore };
