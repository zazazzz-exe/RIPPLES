# Design — Ripples Quick System

**Spec:** `ripples-quick-system`
**Implements:** requirements.md R1–R11 + CC-1…CC-7
**Status:** Draft for review

## Overview

Ripples is built on Amazon Quick as an AI orchestration layer with a strict human-approval gate. The design separates three things that must never blur:
1. **Deterministic rules** (risk + advisory levels) — computed outside any model, read-only to Quick.
2. **AI language work** (extract, triage, draft, answer) — done by Quick, always as drafts.
3. **Human approval** (the Reviewer app) — the only path from draft to sent/published.

One Quick space grounds everything, so each component reads the same records. The 3D map is a mockup; the connection to it (OpenAPI/MCP) is future work.

## Architecture

```
PRESENTATION (mockup only) ── ripples-climate-map.html (3D map → City Page → evidence)
        ▲  future OpenAPI/MCP connector
        │
ORCHESTRATION — AMAZON QUICK
  Surfaces:    D6 Ripples City Assistant (chat)   D7 Ripples Reviewer (approval gate)
  Automations: D5a Deadline escalation  D5b Typhoon playbook  D5c Pre-season readiness
  Flows:       D4a Advisory card  D4b Follow-up letter  D4c Report triage
  Research:    D3 City risk brief            Analytics: D2 Climate Scorecard
        ▲  grounds everything
        │
DATA & KNOWLEDGE — D0 space: project doc · prompts · 6 CSVs · web-crawler KB · (later) LCCAP PDFs
        ▲  read-only
        │
RULES ENGINE (Appendix B) — real-risk + advisory levels, precomputed into cities.csv
```

**Critical path:** D0 → D4 flows → D7 Reviewer → D5 automations (D2/D3/D6 in parallel). Nothing that sends may run before D7 exists.

## Components and interfaces

### D0 — Space & knowledge
- **Inputs:** project doc, prompts, six CSVs, optional PAGASA/NDRRMC crawl.
- **Interface:** grounded retrieval for every other component.
- **Design note:** CSVs are the system of record for the build; treat them as realistic test data, never real LGU records.

### D2 — Ripples Climate Scorecard (Quick Sight)
- **Inputs:** `cities.csv`, `projects.csv`, `evidence.csv`.
- **Sheets:** national overview (KPI tiles + risk-colored map), city scorecard table (sorted by `risk_score` desc), gaps by agency (bar, split by gap type), follow-up accountability (sent vs. replied by office), project explorer (filterable).
- **Open-gap definition:** `gap ∈ {Overdue, Needs maintenance}` — single source for all KPIs.
- **Rule link:** reads `real_risk_level`/`risk_score`; never recomputes (CC-4).

### D3 — City risk brief (Quick Research)
- **Inputs:** space docs + public web.
- **Output:** ~2-page brief with the five required sections, cited; sample-data labeled; never "safe."

### D4a — Advisory guidance card (Quick Flows)
- **Inputs:** advisory text, `city_id`.
- **Steps:** classify type/level (Appendix B) → look up open gaps + evac centers → write 4 audience sections → append official-source line.
- **Output:** DRAFT card in `advisories.csv` shape.

### D4b — Follow-up letter (Quick Flows)
- **Inputs:** `project_id`.
- **Steps:** read project + city → draft neutral letter (commitment, budget, deadline, status, progress, gap) with the three FOI requests → add reply-clock statement → add one hazard sentence if an advisory is active.
- **Output:** DRAFT letter + one-line log entry.

### D4c — Citizen report triage (Quick Flows)
- **Inputs:** `project_id`, report text, report type, photo description.
- **Steps:** match to project type/location → count matching reports (30 days) in `evidence.csv` → set `corroborated`/`unverified` → flag suspicious patterns → write one-line evidence entry.
- **Output:** evidence entry (no reporter identity).

### D5a — Deadline escalation (Quick Automate)
- **Trigger:** daily.
- **Selects:** (status ≠ Completed AND deadline < today) OR (`maintenance` = Needs maintenance), no follow-up in 30 days.
- **Flow:** D4b → reviewer approval → send to test contact → log → 15-working-day clock → reply attached & posted / "No reply" recorded. Calls `anchor_record` if connected, else logs. Weekly summary.

### D5b — Typhoon event playbook (Quick Automate)
- **Trigger:** wind signal raised (manual in this version).
- **Flow:** for each affected city run D4a → draft interim-measure notice → queue D5a steps for overdue flood-related projects (advisory-active note) → refresh D2 → team status message. All DRAFT.

### D5c — Pre-season readiness (Quick Automate)
- **Trigger:** on demand + 4 weeks pre-season.
- **Flow:** per city run D3 + attach scorecard → readiness report → reviewer → share with DRRMO/Sanggunian/media + post to City Page.

### D6 — Ripples City Assistant (chat agent)
- **Grounding:** this space + PAGASA/NDRRMC only.
- **Behavior:** cite source per answer; flag sample data; link officials for live warnings; never "safe."

### D7 — Ripples Reviewer (Apps in Quick) — approval gate
- **Screens:** commitments queue (editable fields + Approve/Reject), drafts queue (letters/cards/reports with source record), reports queue (triage result + corroborate/reject, identity hidden).
- **State:** approve/reject updates a draft's status that D5a/b/c read before sending.
- **Look:** dark navy; risk green/yellow/orange/red; condensed headings.

## Data model (sample CSVs — verified)

| File | Rows | Key | Key fields used |
|---|---|---|---|
| cities.csv | 8 | city_id | lat, lon, hazards, risk_score, real_risk_level, promises_kept_pct, maintained_pct |
| projects.csv | 32 | project_id | city_id, type, agency, responsible_office, status, deadline, maintenance, gap, interim_measure, followups_sent/replied |
| advisories.csv | 10 | advisory_id | city_id, type, level, for_households, for_schools, for_farmers, for_barangay_officials |
| evidence.csv | 48 | evidence_id | project_id, city_id, date, source, observation, corroborated |
| evacuation_centers.csv | 24 | center_id | city_id, name, capacity_persons, lat, lon |
| community_actions.csv | 19 | action_id | city_id, kind, action, when |

- **Joins:** `city_id` is the hub; `evidence.project_id → projects.project_id`.
- Every row carries `sample_data = yes`.

## Data flow — typhoon event (sequence)

```
Signal raised (manual)
  → D5b playbook
     → for each affected city: D4a advisory card (DRAFT)
     → draft interim-measure notice (open gaps) (DRAFT)
     → queue D5a steps for overdue flood/drainage/dike/pump/seawall projects
     → refresh D2 scorecard
     → team status message
  → Reviewer (D7) approves each draft
     → approved advisory cards shared; approved letters sent to test contacts
     → reply clocks started
```

## Rules engine — Appendix B (deterministic)

> This is the fixed-rule contract. Quick reads results; it never computes or overrides them. Confirm exact thresholds against the project document's Appendix B before implementation.

- **Real-risk level** = `hazard_points` (current hazard severity) + `gap_points` (open-gap burden) → `risk_score` → banded into **Low / Moderate / High / Critical**.
- **Open gap** contributes `gap_points`: a project with `gap ∈ {Overdue, Needs maintenance}`.
- **Advisory level** follows **PAGASA categories/thresholds**: heat index, rainfall warnings (yellow/orange/red), flood advisories, tropical cyclone wind signals, drought — mapped to a level used by D4a.
- **Why fixed rules:** explainability. Any risk or advisory level must be traceable to inputs, so it can be defended to an LGU or the public (CC-4).

## Error handling & edge cases
- **No current PAGASA outlook (R3):** state plainly that none was found; do not fabricate.
- **HTML upload rejected (R1):** fall back to Part B + CSVs.
- **Backend not connected (R7):** log status changes, skip `anchor_record`.
- **Suspicious reports (R6):** flag, never auto-corroborate.
- **Unresolved/missing data:** surface a visible gap rather than guessing; keep sample-data labeling intact.

## Testing strategy
- **Per-component exit tests** (see tasks.md), each tied to acceptance criteria.
- **Pilot-first:** build and verify every component against **Malabon** before generalizing.
- **Hand-check analytics:** dashboard open-gap total must equal a manual count of `projects.csv` rows with `gap ∈ {Overdue, Needs maintenance}`; map colors must match `real_risk_level`.
- **Safeguard tests:** for each generated artifact, assert S1–S7 (never "safe," DRAFT marker, neutral language, fixed-rule level, no reporter identity, corroboration rule, sample-data label).
- **Gate test:** confirm no D5 automation sends before a D7 approval; demo sends resolve to test addresses only.
