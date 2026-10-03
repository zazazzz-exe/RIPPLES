const express = require('express');
const { AppError } = require('../errors');
const { SafeguardError } = require('../domain/safeguards');
const publicRoutes = require('./public');
const opsRoutes = require('./ops');
const automationRoutes = require('./automations');

// Placeholder for auth/roles (future). Every request is treated as the demo
// operator today; real login plugs in here without touching the routes.
function identify(req, _res, next) {
  req.actor = { id: 'demo-operator', role: 'operator' };
  next();
}

function createApi(services) {
  const api = express.Router();
  api.use(express.json({ limit: '32kb' }));
  api.use(identify);

  api.get('/health', (_req, res) => res.json({ ok: true, approval_mode: services.drafts.mode, as_of: services.config.asOf }));
  api.use(publicRoutes(services));
  api.use(opsRoutes(services));
  api.use(automationRoutes(services));

  api.use((_req, res) => res.status(404).json({ error: 'Not found' }));
  // eslint-disable-next-line no-unused-vars
  api.use((err, _req, res, _next) => {
    if (err instanceof AppError) return res.status(err.status).json({ error: err.message });
    if (err instanceof SafeguardError) return res.status(422).json({ error: err.message, violations: err.violations });
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON body' });
    console.error(err);
    return res.status(500).json({ error: 'Internal error' });
  });
  return api;
}

module.exports = { createApi };
