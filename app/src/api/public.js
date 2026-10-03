// Public, read-only routes: map, City Page, project evidence.
const express = require('express');

module.exports = function publicRoutes({ cities, automations }) {
  const r = express.Router();
  r.get('/cities', (_req, res) => {
    const sim = automations.simulation();
    res.json({ cities: cities.list(), simulation: sim ? { name: sim.name, track: sim.track, signals: sim.signals } : null });
  });
  r.get('/cities/:id', (req, res) => res.json(cities.page(req.params.id)));
  r.get('/projects/:id', (req, res) => res.json(cities.project(req.params.id)));
  r.get('/explore', (_req, res) => res.json(cities.explore()));
  return r;
};
