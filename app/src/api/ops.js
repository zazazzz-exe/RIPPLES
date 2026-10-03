// Operations routes: scorecard, drafts (approval), flows, outbox, assistant.
const express = require('express');
const { ValidationError } = require('../errors');

const str = (v, name, max = 2000) => {
  if (typeof v !== 'string' || !v.trim()) throw new ValidationError(`${name} is required`);
  return v.trim().slice(0, max);
};

module.exports = function opsRoutes({ scorecard, drafts, advisoryCard, followUpLetter, reportTriage, outbox, assistant }) {
  const r = express.Router();

  r.get('/scorecard', (_req, res) => res.json(scorecard.build()));

  r.get('/drafts', (req, res) => {
    const { state, kind, city_id: cityId } = req.query;
    res.json({ approval_mode: drafts.mode, drafts: drafts.list({ state, kind, city_id: cityId }) });
  });
  r.get('/drafts/:id', (req, res) => res.json(drafts.get(req.params.id)));
  r.post('/drafts/:id/:decision(approve|reject)', (req, res) => {
    const note = typeof req.body?.note === 'string' ? req.body.note.slice(0, 500) : '';
    res.json(drafts.decide(req.params.id, req.params.decision, note));
  });

  // Flows (D4a, D4b, D4c)
  r.post('/flows/advisory-card', (req, res) => {
    const { city_id: cityId, type, level, heat_index: heatIndex, title } = req.body || {};
    res.status(201).json(advisoryCard.create({ city_id: str(cityId, 'city_id', 40), type: str(type, 'type', 20), level, heat_index: heatIndex, title }));
  });
  r.get('/flows/follow-up-letter/preview', (req, res) => {
    res.json(followUpLetter.preview(str(req.query.project_id, 'project_id', 40)));
  });
  r.post('/flows/follow-up-letter', (req, res) => {
    res.status(201).json(followUpLetter.create(str(req.body?.project_id, 'project_id', 40), { note: req.body?.note ? String(req.body.note).slice(0, 300) : '' }));
  });
  r.get('/reports', (_req, res) => res.json({ reports: reportTriage.list() }));
  r.post('/reports', (req, res) => {
    const b = req.body || {};
    res.status(201).json(reportTriage.triage({
      project_id: str(b.project_id, 'project_id', 40),
      report_type: str(b.report_type, 'report_type', 40),
      text: str(b.text, 'text', 1000),
      photo_description: typeof b.photo_description === 'string' ? b.photo_description.slice(0, 300) : '',
    }));
  });

  r.get('/outbox', (_req, res) => res.json({ note: 'Test outbox. Nothing is sent outside this app.', messages: outbox.list() }));

  r.post('/assistant', (req, res) => res.json(assistant.ask(str(req.body?.question, 'question', 500))));
  r.get('/assistant/suggestions', (_req, res) => res.json({ suggestions: assistant.SUGGESTIONS }));

  return r;
};
