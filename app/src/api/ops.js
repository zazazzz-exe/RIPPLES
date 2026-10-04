// Operations routes: scorecard, drafts (approval), letters, reports, outbox, follow-ups.
const express = require('express');
const { ValidationError } = require('../errors');

const str = (v, name, max = 2000) => {
  if (typeof v !== 'string' || !v.trim()) throw new ValidationError(`${name} is required`);
  return v.trim().slice(0, max);
};

module.exports = function opsRoutes({ scorecard, drafts, followUpLetter, reportTriage, outbox, followups, resetAll }) {
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

  // Flows (D4b follow-up letter, D4c citizen report triage)
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

  r.get('/followups', (_req, res) => res.json(followups.summary()));
  r.post('/followups/:id/reply', (req, res) => res.json(followups.recordReply(req.params.id, String(req.body?.reply || '').slice(0, 2000))));

  // Clears drafts, outbox, follow-ups and reports (demo/test helper; the CSVs are never changed).
  r.post('/admin/reset', (_req, res) => { resetAll(); res.json({ reset: true }); });

  return r;
};
