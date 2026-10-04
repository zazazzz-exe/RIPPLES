const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

// All runtime configuration lives here. Change behavior by changing one value.
module.exports = {
  port: Number(process.env.PORT) || 3000,

  // Source of record: the repo's sample CSVs (read-only). On Vercel the build
  // copies them into app/data, because the function can only ship files under app/.
  dataDir: process.env.RIPPLES_DATA_DIR
    || [path.join(__dirname, '..', 'data'), path.join(__dirname, '..', '..', 'data')].find((d) => fs.existsSync(path.join(d, 'cities.csv'))),

  // Mutable state (drafts, outbox, follow-up log, citizen reports). Vercel's
  // filesystem is read-only except /tmp, and /tmp resets when an instance stops.
  stateDir: process.env.RIPPLES_STATE_DIR || (process.env.VERCEL ? path.join(os.tmpdir(), 'ripples-state') : path.join(__dirname, '..', 'state')),

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

  // Public Mapbox token (pk.…) for satellite imagery on the 3D map. Set in
  // app/.env; restrict it to the app's URLs in the Mapbox account.
  mapboxToken: process.env.MAPBOX_TOKEN || '',

  // Salt for hashing anonymous rating voter IDs (set a secret value in production).
  ratingSalt: process.env.RIPPLES_RATING_SALT || 'ripples-dev-rating-salt',
};
