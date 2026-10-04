# Design — Ripples Web App

Full architecture write-up: `docs/ARCHITECTURE.md`. This file is the spec-level summary.

## Layers
```
public/   responsive HTML/CSS/JS (no framework, no build step)
   │ fetch JSON
api/      Express routes — validation, HTTP mapping, nothing else
   │
services/ scorecard (D2), followUpLetter (D4b), reportTriage (D4c), drafts + followups (D7), outbox
   │
domain/   rules (Appendix B), safeguards (S1–S7), approval policy — pure functions
   │
data/     repository (read-only CSVs from ../data)  +  stateStore (JSON files in app/state)
```
Each layer only calls the layer below. Domain code has no I/O, so it is tested directly.

## D-ID → module map
| D-ID | Quick component | Web app module |
|---|---|---|
| D2 | Ripples Climate Scorecard | `services/scorecard.js` → `ops.html` |
| D4b | Follow-up letter | `services/followUpLetter.js` |
| D4c | Citizen report triage | `services/reportTriage.js` |
| D7 | Ripples Reviewer | replaced by `domain/approval.js` + drafts panel on `ops.html` |

## Key decisions
- **CSV stays the source of record**, read from the repo's `data/` folder; mutable state (drafts, outbox, follow-up log, citizen reports) lives in `app/state/state.json`.
- **Risk** = CSV advisories → rules engine; equals the precomputed CSV values (tested).
- **Approval policy** (`APPROVAL_MODE`, default `required`) is the single gate for every release. The team is considering removing the Reviewer; switching to `auto` changes one value and must be recorded as a change to S2.
- **Outbox only:** no email or SMS is ever sent; released letters land in the outbox inside `app/state/state.json` addressed to `*@test.ripples.invalid`.
- **Templates, not an LLM:** all generated text comes from `services/templates/*`, linted by `domain/safeguards.js`.
- **Public UI = map explorer:** the `ripples-climate-map.html` experience on a Mapbox GL satellite map (three.js r128 pins as a custom layer) fed by `GET /api/explore`, with hash routes and a no-WebGL fallback. Ops pages share its visual language: mobile-first, bottom tab bar under 768 px, side nav above, tables collapse to cards.
- **Future-ready:** auth/roles (middleware slot in `api/index.js`), database (swap repository/stateStore), live feeds, Quick integration via the same service boundaries.
