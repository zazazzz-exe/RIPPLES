// Public routes: map, City Page, project evidence, and anonymous ratings.
const express = require('express');

module.exports = function publicRoutes({ cities, ratings, ledger, config }) {
  const r = express.Router();
  // Client config. The Mapbox token is a public (pk.) token by design.
  r.get('/config', (_req, res) => res.json({ mapbox_token: config.mapboxToken || null }));
  r.get('/cities', (_req, res) => res.json({ cities: cities.list() }));
  r.get('/cities/:id', (req, res) => res.json(cities.page(req.params.id)));
  r.get('/projects/:id', (req, res) => res.json(cities.project(req.params.id)));
  r.get('/explore', (_req, res) => res.json(cities.explore()));
  // Record ledger (record integrity only).
  r.get('/ledger', (req, res) => res.json(ledger.overview({ offset: req.query.offset, limit: req.query.limit, all: req.query.all === '1' })));
  r.get('/projects/:id/integrity', (req, res) => res.json(ledger.integrity(req.params.id)));
  r.get('/projects/:id/rating', (req, res) => res.json(ratings.tally(req.params.id, req.query.voter)));
  r.post('/projects/:id/rating', (req, res) => {
    const { voter, vote, reason = null } = req.body || {};
    res.json(ratings.vote(req.params.id, voter, vote === undefined ? null : vote, reason));
  });
  return r;
};
