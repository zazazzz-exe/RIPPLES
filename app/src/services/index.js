// Composition root: wires the data layer, domain policy and services together.
const { createRepository } = require('../data/repository');
const { createStateStore } = require('../data/stateStore');
const { createApprovalPolicy } = require('../domain/approval');
const { createOutbox } = require('./outbox');
const { createDraftService } = require('./drafts');
const { createCityService } = require('./cities');
const { createScorecard } = require('./scorecard');
const { createFollowUpLetter } = require('./followUpLetter');
const { createReportTriage } = require('./reportTriage');
const { createFollowups } = require('./followups');
const { createRatings } = require('./ratings');
const { createLedger } = require('./ledger');

function createServices(config, { persist = true } = {}) {
  const ctx = {
    config,
    repo: createRepository(config.dataDir),
    store: createStateStore(config.stateDir, { persist }),
    policy: createApprovalPolicy(config.approvalMode),
  };
  const outbox = createOutbox(ctx);
  const drafts = createDraftService(ctx, { outbox });
  const ratings = createRatings(ctx);
  const cities = createCityService(ctx, { ratings });
  const scorecard = createScorecard(ctx, { cities, ratings });
  const followUpLetter = createFollowUpLetter(ctx, { cities, drafts, outbox });
  const reportTriage = createReportTriage(ctx);
  const followups = createFollowups(ctx);
  const ledger = createLedger(ctx);
  ledger.sync();

  return {
    config, outbox, drafts, cities, scorecard, followUpLetter, reportTriage, followups, ratings, ledger,
    resetAll: () => ctx.store.reset(),
  };
}

module.exports = { createServices };
