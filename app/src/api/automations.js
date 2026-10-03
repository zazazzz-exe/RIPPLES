// Automation and simulation routes (D5a, D5b, D5c).
const express = require('express');
const { ValidationError } = require('../errors');

module.exports = function automationRoutes({ automations, resetAll }) {
  const r = express.Router();

  r.get('/automations/escalation/candidates', (_req, res) => res.json({ candidates: automations.escalationCandidates() }));
  r.post('/automations/escalation/run', (_req, res) => res.json(automations.runEscalation()));
  r.post('/automations/escalation/check-clocks', (req, res) => {
    const today = req.body?.today;
    if (today !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(today)) throw new ValidationError('today must be YYYY-MM-DD');
    res.json(automations.checkClocks(today));
  });
  r.get('/followups', (_req, res) => res.json(automations.weeklySummary()));
  r.post('/followups/:id/reply', (req, res) => res.json(automations.recordReply(req.params.id, String(req.body?.reply || '').slice(0, 2000))));

  r.get('/simulate/typhoon', (_req, res) => res.json({ simulation: automations.simulation() }));
  r.post('/simulate/typhoon', (req, res) => res.json(automations.runTyphoon(req.body && req.body.track ? { name: String(req.body.name || 'Typhoon DEMO').slice(0, 60), track: req.body.track } : {})));
  r.post('/simulate/reset', (_req, res) => res.json(automations.resetTyphoon()));

  r.post('/automations/readiness/run', (req, res) => {
    const ids = Array.isArray(req.body?.city_ids) ? req.body.city_ids.map(String) : undefined;
    res.json(automations.runReadiness({ city_ids: ids }));
  });

  // Clears drafts, outbox, follow-ups, reports and simulation (demo reset).
  r.post('/admin/reset', (_req, res) => { resetAll(); res.json({ reset: true }); });

  return r;
};
