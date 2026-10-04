---
inclusion: always
---

# Technology Stack — Ripples

## Primary development environment
- **Kiro** is the primary development environment for this project: spec-driven development, agentic engineering, and parallel agent workflows. All feature work flows through a Kiro spec (requirements → design → tasks) and is executed as trackable tasks, run in parallel waves where dependencies allow.

## Orchestration platform: Amazon Quick
The system is built **on Amazon Quick** as the AI orchestration layer. Feature names follow AWS documentation as of October 2026 — confirm availability in the hackathon environment before relying on any one component.

| Layer | Technology | Use in Ripples |
|---|---|---|
| Knowledge & grounding | Quick **Spaces**, Quick **Index**, **knowledge bases** (S3, web crawler, Drive, SharePoint) | One space holds the project doc, CSVs, LCCAP PDFs; web crawler indexes PAGASA/NDRRMC |
| Analytics | Quick **Sight** | Ripples Climate Scorecard dashboard |
| Research | Quick **Research** | City risk briefs, commitment-extraction checks, pre-season research |
| Workflows | Quick **Flows** | Advisory guidance card, follow-up letter, citizen report triage |
| Automation | Quick **Automate** | Deadline escalation, typhoon playbook, pre-season readiness |
| Conversation | Quick **chat agents** | Ripples City Assistant |
| Internal UI | **Apps in Amazon Quick** | Ripples Reviewer app (approval gate) |
| Integrations | **Action connectors** (email/Slack/Teams), **OpenAPI/MCP** | Sending letters/notices now; Ripples backend later |

## Web app (runnable, sample data)
- `app/`: Node 20+ with Express and plain HTML/CSS/JS (no build step). Layers: `data/` → `domain/` (rules, safeguards, approval policy) → `services/` (one per D-ID) → `api/` → `public/`. Public UI is the 3D explorer ported from `ripples-climate-map.html` (three.js r128, data from `GET /api/explore`); ops pages share its visual language.
- Generated text comes from deterministic templates (no LLM). All "sends" go to a test outbox.
- Approval mode (`app/src/config.js`): `required` (default, S2 on) or `auto` (S2 off; update safeguards.md if used).
- Architecture: `docs/ARCHITECTURE.md`. Tests: `cd app && npm test`.

## Mockup (front end, not connected)
- `ripples-climate-map.html` — single-file HTML/CSS/JS 3D map mockup. Opens in a browser. Design reference only; it is **not** wired to Quick in this version.
- Visual language to match in any UI (incl. the Reviewer app): **dark navy background; risk colors green / yellow / orange / red; condensed display headings.**

## Data
- Six sample CSVs in `data/` are the system's source of record for the build: `cities.csv` (8), `projects.csv` (32), `advisories.csv` (10), `evidence.csv` (48), `evacuation_centers.csv` (24), `community_actions.csv` (19).
- Keys: `city_id` is the join key; `projects/advisories/evidence/evacuation_centers/community_actions` all reference it. `evidence.project_id` → `projects.project_id`.
- **Open gap** (used everywhere) = a project whose `gap` is `Overdue` **or** `Needs maintenance`.
- Risk fields (`hazard_points`, `gap_points`, `risk_score`, `real_risk_level`) are **precomputed** by fixed rules; Quick reads them and must not recompute or invent them.

## Rules engine (deterministic, outside the model)
- Real-risk level = current hazard points + open-gap points; advisory levels follow PAGASA thresholds (design doc Appendix B).
- Rationale: every risk and advisory level must be **explainable**. AI is used only for language work (extracting, triaging, drafting). Keep this split in every implementation.

## Constraints
- No money is handled anywhere in the system.
- Runs on public + sample data; no LGU system integration required for v1.
- Low operating cost: Quick does the orchestration; no backend to run yet.
- All sends in the demo target **test addresses**, never real offices.

## Future stack (roadmap, do not build now)
Live PAGASA/NDRRMC feeds · LCCAP ingestion pipeline · Sentinel-2 checks · browser-side photo re-encoding (strips location/EXIF, blurs faces) · Ripples backend via OpenAPI/MCP · hosted tamper-evident record ledger · production map (Mapbox/MapLibre). Build tool for the public app to be confirmed with organizers.
