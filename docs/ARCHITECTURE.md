# Ripples Web App: System Architecture

**What it is:** a web application that runs the Ripples system (Detect → Protect → Push) on the six sample CSVs, on desktop and mobile. It mirrors the Amazon Quick components (D2–D7) one-to-one, so it can be demoed today and later stand behind or alongside the Quick build.

> All data is **sample data**. Generated text comes from deterministic templates, not an LLM. Nothing is ever really sent: "sends" land in a test outbox.

## Run it

```bash
cd app
npm install
npm start          # http://localhost:3000
npm test           # 26 tests: rules, safeguards, services, API, 3D explorer adapter
```

Node 20+. Configuration lives in `app/src/config.js` (port, data folder, approval mode).

## Layers

```
 Browser (phone or desktop)
 ┌──────────────────────────────────────────────────────────────┐
 │ public/  index = 3D explorer (map → City Page → evidence)    │  plain HTML/CSS/JS, no build
 │          ops · simulate · assistant (same visual language)   │
 └──────────────────────────────┬───────────────────────────────┘
                                │ fetch JSON
 ┌──────────────────────────────▼───────────────────────────────┐
 │ api/        Express routes: validation, HTTP codes only      │
 ├──────────────────────────────────────────────────────────────┤
 │ services/   one module per Quick component (D2–D6)           │
 │             cities · scorecard · advisoryCard · followUpLetter│
 │             reportTriage · cityBrief · automations · assistant│
 │             drafts (approval lifecycle) · outbox (test sends) │
 ├──────────────────────────────────────────────────────────────┤
 │ domain/     rules (Appendix B) · safeguards (S1–S7) ·        │  pure functions,
 │             approval policy (S2)                             │  no I/O
 ├──────────────────────────────────────────────────────────────┤
 │ data/       repository: ../data/*.csv (read-only)            │
 │             stateStore: app/state/state.json (drafts, outbox,│
 │             follow-up log, reports, simulation)              │
 └──────────────────────────────────────────────────────────────┘
```

Each layer calls only the one below it. `services/index.js` is the single place where everything is wired together.

## How a request flows (example: typhoon demo)

1. `POST /api/simulate/typhoon` → `automations.runTyphoon()`.
2. For each city, `rules.distanceToTrack` + `rules.signalForDistance` give a wind signal (same track and thresholds as the 3D mockup). The simulation is saved in state.
3. `cities.risk()` now sees the signal as an active advisory and recomputes the level with `rules.cityRisk` (Malabon: High → Critical).
4. For each affected city: `advisoryCard.create` (four audiences), an interim notice, and follow-up letters for overdue flood defenses. Each output passes `safeguards.enforce` and goes to `drafts.create`.
5. `drafts.create` asks the **approval policy** for the initial state: `DRAFT` (required mode) or `APPROVED` (auto mode).
6. A person approves on the Scorecard page (`POST /api/drafts/:id/approve`) → `drafts.release()`: advisories appear on the City Page; letters go to the test outbox and start a 15-working-day reply clock.

## D-ID → module map

| D-ID | Quick component | Web app |
|---|---|---|
| D0 | Space + knowledge | `data/repository.js` reads `data/*.csv` |
| D2 | Ripples Climate Scorecard | `services/scorecard.js` → `/ops` |
| D3 | City risk brief | `services/cityBrief.js` |
| D4a | Advisory guidance card | `services/advisoryCard.js` + `templates/advisory.js` |
| D4b | Follow-up letter | `services/followUpLetter.js` + `templates/letter.js` |
| D4c | Citizen report triage | `services/reportTriage.js` → report form on `/project` |
| D5a | Deadline escalation | `services/automations.js` (`runEscalation`, `checkClocks`) |
| D5b | Typhoon event playbook | `services/automations.js` (`runTyphoon`) + `templates/notice.js` |
| D5c | Pre-season readiness | `services/automations.js` (`runReadiness`) |
| D6 | Ripples City Assistant | `services/assistant.js` → `/assistant` |
| D7 | Ripples Reviewer | `domain/approval.js` + drafts panel on `/ops` |

## Safeguards in code

| Rule | Where it is enforced |
|---|---|
| S1 Never "safe" | `safeguards.check` rejects "safe", "out of danger", etc.; advisory, notice and report outputs must contain the PAGASA/NDRRMC line |
| S2 Human approval | `domain/approval.js` is the only gate; `outbox.send` refuses non-test addresses |
| S3 Neutral language | `safeguards.check` rejects accusatory words |
| S4 Fixed-rule risk | `domain/rules.js`; a test proves it reproduces every risk field in `cities.csv` |
| S5 Protect reporters | `redactReporter` strips identity fields before triage; nothing identifying is stored |
| S6 Corroboration | `corroborationStatus`: two matching reports or a satellite check; flagged reports never auto-corroborate |
| S7 Sample label | every output carries `sample_label`; every page shows the sample-data banner |

Every service output goes through `safeguards.enforce`, which throws if any check fails, so a template change that breaks a rule fails the tests.

## The approval decision

The team is considering removing the Reviewer step. The architecture keeps that decision cheap:

- **Keep it:** `approvalMode: 'required'` (default). Drafts wait on the Scorecard page.
- **Remove it:** set `approvalMode: 'auto'` in `config.js` (or `RIPPLES_APPROVAL_MODE=auto`). Drafts are released as soon as they are created. No other code changes.

Switching to `auto` turns off safeguard S2. Update `.kiro/steering/safeguards.md` and the project document if you do.

## The 3D explorer (public side)

The public side is the experience from `ripples-climate-map.html`, ported into the app (`public/index.html`, `public/js/explore/app.js`, `public/css/explore.css`):

- A three.js (r128) Philippines built from `public/data/ph-geo.json`, with glowing city pins (color = real-risk level, beam height = score, ring = promises kept), the red readiness route, camera fly-to, the City Page sliding in beside the map, and the project evidence view (schematic frame plus step-by-step info rail).
- Navigation: BACK / NEXT / MAP bar, diamond strip, arrow keys and M, hover previews, the city log and risk filters.
- **Routes:** `/#/city/<id>` and `/#/project/<id>` are shareable; the browser Back button works. The old `/city?id=` and `/project?id=` URLs redirect.
- **Data:** one call to `GET /api/explore`; `public/js/explore/adapter.js` maps it onto the model the scene was built for. Risk, gaps and the scorecard are read from the server, never recomputed (S4).
- **Approval gate in the UI (S2):** the TYPHOON DEMO button runs the server simulation. The wind signal raises risk at once, but its guidance card shows "awaiting approval" until a reviewer approves it on the Scorecard page. "Draft follow-up letter" shows the server's letter and creates a draft; nothing is sent from the map.
- **Reports (S5, S6):** the photo is re-encoded in the browser to strip location data and stays on the device (IndexedDB). Only the written description goes to `POST /api/reports` for triage.
- **Fallback:** without WebGL (or with `?nogl=1`), the city log, City Page, evidence view and navigation all still work.

## Responsive design

- The explorer follows the mockup's breakpoints: under 760 px the city log and City Page become bottom sheets and the map controls hide.
- Scorecard, Simulate and Assistant use the same visual language (dark navy, glowing outlines, condensed display type, scanlines). Under 768 px: one column, a bottom tab bar, tables become cards. From 768 px: a side nav.
- Dark only, like the explorer.
- Checked at 375 px: no horizontal page scroll.

## Ready for later

| Later | Where it plugs in |
|---|---|
| Login and roles | `identify()` middleware in `api/index.js`; routes already split into public (`api/public.js`) and operator (`api/ops.js`, `api/automations.js`) |
| A real database | replace `data/repository.js` and `data/stateStore.js`, keeping the same method names |
| Live PAGASA/NDRRMC feeds | feed advisories into `cities.activeAdvisories()`; the rules engine is unchanged |
| Real email/SMS | replace `services/outbox.js`; the approval gate stays in front of it |
| Amazon Quick | Quick flows can call this API (OpenAPI/MCP connector), or the app can read Quick outputs as drafts |
| An LLM for wording | swap a template in `services/templates/`; `safeguards.enforce` still checks every output |

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Status and approval mode |
| GET | `/api/cities` | All cities with effective risk and the active simulation |
| GET | `/api/cities/:id` | City Page bundle |
| GET | `/api/explore` | Everything the 3D explorer needs, cities in route order |
| GET | `/api/projects/:id` | Project evidence view |
| GET | `/api/scorecard` | D2 dashboard data |
| GET | `/api/drafts?state=&kind=&city_id=` | Drafts |
| POST | `/api/drafts/:id/approve` · `/reject` | Decide on a draft (body: `{ note }`) |
| POST | `/api/flows/advisory-card` | D4a (`city_id`, `type`, `level` or `heat_index`) |
| GET | `/api/flows/follow-up-letter/preview?project_id=` | D4b preview (nothing stored) |
| POST | `/api/flows/follow-up-letter` | D4b (`project_id`); 409 if one is already awaiting approval |
| GET/POST | `/api/reports` | D4c triage (`project_id`, `report_type`, `text`, `photo_description`) |
| GET | `/api/automations/escalation/candidates` | D5a selection |
| POST | `/api/automations/escalation/run` | D5a run |
| POST | `/api/automations/escalation/check-clocks` | Mark expired reply clocks "No reply" |
| GET | `/api/followups` · POST `/api/followups/:id/reply` | Follow-up log, record a reply |
| GET/POST | `/api/simulate/typhoon` · POST `/api/simulate/reset` | D5b simulation |
| POST | `/api/automations/readiness/run` | D5c (`city_ids` optional) |
| GET | `/api/outbox` | Test outbox |
| POST | `/api/assistant` | D6 (`question`) |
| POST | `/api/admin/reset` | Clear demo activity (CSVs are never changed) |
