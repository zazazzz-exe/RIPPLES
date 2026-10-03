// Composition root: wires the data layer, domain policy and services together.
const { createRepository } = require('../data/repository');
const { createStateStore } = require('../data/stateStore');
const { createApprovalPolicy } = require('../domain/approval');
const { createOutbox } = require('./outbox');
const { createDraftService } = require('./drafts');
const { createCityService } = require('./cities');
const { createScorecard } = require('./scorecard');
const { createAdvisoryCard } = require('./advisoryCard');
const { createFollowUpLetter } = require('./followUpLetter');
const { createReportTriage } = require('./reportTriage');
const { createCityBrief } = require('./cityBrief');
const { createAutomations } = require('./automations');
const { createAssistant } = require('./assistant');

function createServices(config, { persist = true } = {}) {
  const ctx = {
    config,
    repo: createRepository(config.dataDir),
    store: createStateStore(config.stateDir, { persist }),
    policy: createApprovalPolicy(config.approvalMode),
  };
  const outbox = createOutbox(ctx);
  const drafts = createDraftService(ctx, { outbox });
  const cities = createCityService(ctx);
  const scorecard = createScorecard(ctx, { cities });
  const advisoryCard = createAdvisoryCard(ctx, { cities, drafts });
  const followUpLetter = createFollowUpLetter(ctx, { cities, drafts, outbox });
  const reportTriage = createReportTriage(ctx);
  const cityBrief = createCityBrief(ctx, { cities });
  const automations = createAutomations(ctx, { cities, drafts, outbox, advisoryCard, followUpLetter, cityBrief });
  const assistant = createAssistant(ctx, { cities, advisoryCard, scorecard });

  return {
    config, outbox, drafts, cities, scorecard, advisoryCard, followUpLetter, reportTriage, cityBrief, automations, assistant,
    resetAll: () => ctx.store.reset(),
  };
}

module.exports = { createServices };
