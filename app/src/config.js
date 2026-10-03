const path = require('node:path');

// All runtime configuration lives here. Change behavior by changing one value.
module.exports = {
  port: Number(process.env.PORT) || 3000,

  // Source of record: the repo's sample CSVs (read-only).
  dataDir: process.env.RIPPLES_DATA_DIR || path.join(__dirname, '..', '..', 'data'),

  // Mutable state (drafts, outbox, follow-up log, simulation).
  stateDir: process.env.RIPPLES_STATE_DIR || path.join(__dirname, '..', 'state'),

  // Safeguard S2. "required": a person approves every draft before release.
  // "auto": drafts are released immediately. Switching to "auto" removes the
  // human approval step — record that as a change to S2 in the steering docs.
  approvalMode: process.env.RIPPLES_APPROVAL_MODE || 'required',

  // The sample data is frozen at this month (cities.csv as_of).
  asOf: '2026-10',
  today: '2026-10-02',

  // Every "send" goes to a test address. Nothing leaves the app.
  testEmailDomain: 'test.ripples.invalid',

  replyClockWorkingDays: 15,
  followUpCooldownDays: 30,
};
