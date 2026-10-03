# Implementation Plan — Ripples Quick System

**Spec:** `ripples-quick-system`
**Implements:** requirements.md R1–R11 + CC-1…CC-7, design.md
**How to run:** In Kiro, open this spec and "run all tasks." Kiro builds a dependency graph from the `Depends on` tags (see `## Task Dependency Graph`) and executes independent tasks concurrently in waves. Each task notes the requirements it satisfies, the prompt ID (D-x) it implements, and an exit test.

> Convention: `Depends on: —` means no dependency (eligible for Wave 1). Keep every task small enough to run and verify on its own.

## Overview

This plan turns the Ripples design into discrete, dependency-tagged build tasks for Amazon Quick, executed with Kiro under the spec-driven, parallel-wave workflow. The build follows the critical path **D0 space → D4 flows → D7 Reviewer app → D5 automations**, with analytics (D2), research (D3), and the chat agent (D6) running alongside. The Reviewer app (D7, task 5) is the serialization point: nothing that **sends** may run before it exists, so every D5 automation routes drafts through it.

Each task is grounded in the single Quick space (D0) and the six sample CSVs, is built and verified against the pilot city **Malabon** first, and carries an exit test tied to its acceptance criteria. Every generated artifact must hold the seven safeguards (S1–S7 / CC-1…CC-7): never "safe," DRAFT until approved, neutral language, fixed-rule levels, no reporter identity, corroboration-before-trust, and sample-data labeling. No money, no live feeds, no real-office sends — demo sends target test addresses only.

This design relies on fixed Amazon Quick components rather than pseudocode, so no implementation-language choice is required. There is no "Correctness Properties" section in the design, so verification uses per-component exit tests and a final safeguard audit rather than property-based tests.

## Tasks

### Wave 1 — Foundation (no dependencies)

- [x] 1. Set up the Quick space and knowledge (D0)
  - Create space "Ripples: Climate Defense Map"; upload project doc, `quick-prompts.md`, all six CSVs; attempt `ripples-climate-map.html`; optionally add PAGASA/NDRRMC web-crawler KB.
  - Run the D1 master kickoff prompt and capture the build plan it returns.
  - _Depends on:_ —
  - _Requirements:_ R1 (1–4), CC-7
  - _Prompt ID:_ D0 (+ D1 kickoff)
  - _Exit test:_ asking "How many open gaps does Malabon have and why?" returns a CSV-grounded, sample-labeled answer.

### Wave 2 — Analytics, research, and the three flows (depend only on D0)

- [x] 2. Build the Climate Scorecard dashboard (D2)
  - Five sheets per design (national overview, city scorecard table, gaps by agency, follow-up accountability, project explorer); "Sample data" label; map colored by `real_risk_level`; table sorted by `risk_score` desc.
  - Reads `real_risk_level`/`risk_score`; never recomputes them (CC-4).
  - _Depends on:_ 1
  - _Requirements:_ R2 (1–5), CC-4, CC-7
  - _Prompt ID:_ D2
  - _Exit test:_ dashboard open-gap total equals a manual count of `projects.csv` rows with `gap ∈ {Overdue, Needs maintenance}`; colors match the CSV.

- [x] 3. Create the City risk brief (D3) — build and verify for Malabon first
  - Five required sections (hazard profile, seasonal outlook, commitments on-track/overdue/needs-maintenance, open gaps that matter most with interim measures, three actions each for DRRMO and residents); cite external facts; say so plainly if no PAGASA outlook is found; sample-labeled; never "safe."
  - _Depends on:_ 1
  - _Requirements:_ R3 (1–3), CC-1, CC-7
  - _Prompt ID:_ D3
  - _Exit test:_ Malabon brief has all five sections and ≥1 cited PAGASA/NDRRMC source (or an explicit "none found").

- [ ] 4. Build the three Quick Flows (D4) — build and verify for Malabon first
  - [x] 4.1 Advisory guidance card flow (D4a)
    - Classify advisory type/level using Appendix B PAGASA thresholds → look up open gaps + evacuation centers → write four audience sections (households, schools, farmers, barangay officials) → append the official-source line deferring to PAGASA/NDRRMC; emit DRAFT in the `advisories.csv` shape.
    - _Depends on:_ 1
    - _Requirements:_ R4 (1–4), CC-1, CC-2, CC-4
    - _Prompt ID:_ D4a
    - _Exit test:_ a sample Malabon advisory yields a 4-section DRAFT card that never says "safe" and ends with the PAGASA/NDRRMC line.

  - [x] 4.2 Follow-up letter flow (D4b)
    - Read project + city → draft a neutral letter (commitment, budget, deadline, status, progress, gap) with the three FOI requests, a reply-clock statement (reply posted on City Page; "No reply" after 15 working days), and a conditional hazard sentence when an advisory is active; emit DRAFT + one-line log entry.
    - _Depends on:_ 1
    - _Requirements:_ R5 (1–5), CC-2, CC-3
    - _Prompt ID:_ D4b
    - _Exit test:_ letter for Malabon's overdue river wall is neutral, marked DRAFT, and contains all three requests.

  - [x] 4.3 Citizen report triage flow (D4c)
    - Match report to the project's type/location → count matching reports in the last 30 days in `evidence.csv` → set `corroborated` only if ≥2 matches or a satellite check agree, else `unverified` → flag suspicious patterns (identical wording, many reports in minutes, mismatched type) → write a one-line evidence entry; never include reporter identity.
    - _Depends on:_ 1
    - _Requirements:_ R6 (1–4), CC-5, CC-6
    - _Prompt ID:_ D4c
    - _Exit test:_ a lone report → `unverified`; a report with ≥2 matches → `corroborated`; neither output names a reporter.

### Wave 3 — The approval gate (depends on flows existing to populate it)

- [x] 5. Build the Ripples Reviewer app (D7) — the approval gate, built BEFORE automations
  - Three queues (commitments with editable extracted fields + Approve/Reject; drafts with letters/advisory cards/readiness reports and the source record beside each; reports with triage result + corroborate/reject). Reports queue hides reporter identity; approve/reject updates draft state so dependent automations can act; match the mockup look (dark navy; risk green/yellow/orange/red; condensed display headings); CSVs as sample data.
  - _Depends on:_ 4.1, 4.2, 4.3
  - _Requirements:_ R11 (1–4), CC-2, CC-5
  - _Prompt ID:_ D7
  - _Exit test:_ a DRAFT letter from task 4.2 appears in the drafts queue and can be approved; reports queue shows no identity.

### Wave 4 — Automations (depend on flows + the gate)

- [x] 6. Build the three Quick Automate automations (D5) — never enabled before the D7 gate (task 5)
  - [x] 6.1 Deadline escalation automation (D5a)
    - Daily selection rule — (status ≠ Completed AND deadline < today) OR (`maintenance` = Needs maintenance), with no follow-up sent in the last 30 days → run D4b → route to reviewer approval → on approval send to the office's test contact → log → start a 15-working-day reply clock → attach reply & post to City Page, or record "No reply" on expiry → call `anchor_record` if connected else log and skip → send a weekly summary. Nothing sends without approval.
    - _Depends on:_ 4.2, 5
    - _Requirements:_ R7 (1–6), CC-2
    - _Prompt ID:_ D5a
    - _Exit test:_ run stops at the reviewer gate and sends nothing until approved; approval sends to a test address and starts the clock.

  - [x] 6.2 Typhoon event playbook (D5b)
    - On a raised wind signal (manual entry in this version) → run D4a for each affected city → draft an interim-measure notice listing the city's open gaps for barangay officials → queue D5a steps for overdue flood/drainage/dike/pump/seawall projects with an advisory-active note → refresh the D2 scorecard → send the team a status message (cities, real-risk levels, open gaps in the path, drafts awaiting approval); all outputs DRAFT until approved.
    - _Depends on:_ 4.1, 6.1, 2
    - _Requirements:_ R8 (1–5), CC-1, CC-2
    - _Prompt ID:_ D5b
    - _Exit test:_ a sample Signal 3 pushes affected cities to the expected level, generates 4-audience cards, and leaves drafts awaiting approval.

  - [x] 6.3 Pre-season readiness automation (D5c)
    - On demand or four weeks before the typhoon season, for each city → run D3 + attach the city's scorecard to produce a readiness report → route to the reviewer → on approval share with DRRMO/Sanggunian/media contacts and post to the City Page.
    - _Depends on:_ 3, 2, 5
    - _Requirements:_ R9 (1–2), CC-1, CC-2, CC-7
    - _Prompt ID:_ D5c
    - _Exit test:_ an on-demand run produces a per-city report routed to the reviewer, not shared until approved.

### Wave 5 — Conversational layer (reads everything above)

- [x] 7. Create the Ripples City Assistant chat agent (D6)
  - Grounded only in the space + PAGASA/NDRRMC sources; cite the file or source per answer; flag sample data; link PAGASA/NDRRMC for live warnings rather than answering from memory; never say a place is "safe."
  - _Depends on:_ 1, 2
  - _Requirements:_ R10 (1–3), CC-1, CC-7
  - _Prompt ID:_ D6
  - _Exit test:_ answers the three canonical questions with citations and safeguards intact.

### Wave 6 — Integration verification (depends on all)

- [x] 8. End-to-end demo rehearsal & safeguard audit
  - Run the full demo runsheet: scorecard → assistant question → sample Signal 3 → escalation draft → approve in Reviewer → readiness report → close on the mockup.
  - Audit every generated artifact against S1–S7 and confirm the gate test: no D5 automation sends before a D7 approval; demo sends resolve to test addresses only.
  - _Depends on:_ 2, 3, 4.1, 4.2, 4.3, 5, 6.1, 6.2, 6.3, 7
  - _Requirements:_ CC-1…CC-7, all R
  - _Prompt ID:_ D0–D7 (integration)
  - _Exit test:_ the full runsheet completes; no artifact violates a safeguard; nothing sent without approval.

## Notes

- Every task references the requirement(s) it satisfies and the prompt ID (D-x) it implements, and carries an exit test — a task is not done until its exit test passes and the artifact holds S1–S7.
- Pilot-first: where a task says "Malabon first," verify that path before the task reports done, then generalize.
- The design has no "Correctness Properties" section, so verification uses per-component exit tests plus the final safeguard/gate audit (task 8) rather than property-based tests.
- Critical build order: D0 space → D4 flows → D7 Reviewer app → D5 automations. Task 5 (Reviewer app) is the serialization point — nothing that sends may run before it exists.
- Within the automations epic, 6.1/6.2/6.3 run concurrently once task 5 is done, but 6.2 reads 6.1's escalation steps — keep 6.1 ahead of 6.2 (6.2 is scheduled in a later wave to honor this).
- All demo sends target test addresses; no money is handled anywhere; all records are sample data (`sample_data = yes`).

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2", "3", "4.1", "4.2", "4.3"] },
    { "id": 2, "tasks": ["5"] },
    { "id": 3, "tasks": ["6.1", "6.3", "7"] },
    { "id": 4, "tasks": ["6.2"] },
    { "id": 5, "tasks": ["8"] }
  ]
}
```
