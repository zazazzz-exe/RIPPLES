# Requirements — Ripples Quick System

**Spec:** `ripples-quick-system`
**Status:** Draft for review
**Source of truth:** `ripples-project-document.md` (Parts A–D), `quick-prompts.md` (D0–D7)

## Introduction

Ripples is an Amazon Quick–powered climate accountability system for the Philippines, built with Kiro as the primary development environment under a spec-driven, parallel-agent workflow. This spec defines what the system must do: ground all work in one Quick space, surface each city's climate-defense gaps on a scorecard, turn hazard advisories into four-audience guidance, draft neutral follow-up letters to responsible offices, triage citizen reports, automate deadline/typhoon/pre-season workflows behind a human-approval gate, answer questions through a chat agent, and give reviewers an app to approve or reject every draft.

All data is sample data. Every requirement inherits the seven safeguards (see `.kiro/steering/safeguards.md`, S1–S7) as cross-cutting acceptance criteria.

Acceptance criteria use EARS notation (WHEN/IF … THE SYSTEM SHALL …).

---

## Requirement 1 — Grounded knowledge space (D0)
**User story:** As a Ripples reviewer, I want one Quick space that holds the project document, prompts and sample CSVs, so that every dashboard, flow, report and agent is grounded in the same records.

#### Acceptance criteria
1. WHEN the space is created THE SYSTEM SHALL be named "Ripples: Climate Defense Map" and contain `ripples-project-document`, `quick-prompts.md`, and all six CSVs.
2. WHEN a user asks the grounded space a question about the sample data THE SYSTEM SHALL answer from those files and label the answer as sample data.
3. IF `ripples-climate-map.html` cannot be uploaded THEN THE SYSTEM SHALL rely on Part B of the project doc plus the CSVs for the same information.
4. WHERE a public PAGASA/NDRRMC web source is added THE SYSTEM SHALL index it via a web-crawler knowledge base.

## Requirement 2 — Climate scorecard dashboard (D2)
**User story:** As DRRMO staff or a partner, I want a scorecard of each city's commitments and open gaps, so that I can see where protection is missing before a hazard hits.

#### Acceptance criteria
1. WHEN the dashboard loads THE SYSTEM SHALL present five sheets: national overview, city scorecard table, gaps by agency, follow-up accountability, and project explorer.
2. WHEN counting open gaps THE SYSTEM SHALL count projects whose `gap` is `Overdue` or `Needs maintenance`.
3. WHEN rendering the national map THE SYSTEM SHALL color cities by `real_risk_level` in order Low, Moderate, High, Critical and read risk from the CSV, not recompute it.
4. WHEN displaying the city scorecard table THE SYSTEM SHALL sort by `risk_score` descending and include promises-kept %, maintained %, open gaps, and follow-ups sent vs. replied.
5. THE SYSTEM SHALL display a "Sample data" label in the dashboard title area.

## Requirement 3 — City risk brief (D3)
**User story:** As a reviewer preparing for a season, I want a per-city readiness brief, so that I can brief a DRRMO or partner with cited, current context.

#### Acceptance criteria
1. WHEN a brief is requested for a city THE SYSTEM SHALL include a hazard profile, a seasonal outlook, the city's commitments (on track / overdue / needs maintenance), the open gaps that matter most with interim measures, and three actions each for the DRRMO and residents.
2. WHEN citing an external fact THE SYSTEM SHALL cite the source; IF no current PAGASA outlook is found THEN THE SYSTEM SHALL say so plainly.
3. THE SYSTEM SHALL mark the commitment data as sample data and SHALL NOT call the city safe.

## Requirement 4 — Advisory guidance card (D4a)
**User story:** As a barangay official, I want a hazard advisory turned into guidance for households, schools, farmers and officials, so that each audience knows what to do given this city's gaps.

#### Acceptance criteria
1. WHEN an advisory text and `city_id` are provided THE SYSTEM SHALL identify advisory type and level using the PAGASA thresholds in the design doc (Appendix B).
2. WHEN composing guidance THE SYSTEM SHALL look up the city's open gaps (`projects.csv`) and evacuation centers (`evacuation_centers.csv`).
3. WHEN producing the card THE SYSTEM SHALL write four sections (households, schools, farmers, barangay officials) and SHALL end with a line deferring to PAGASA and NDRRMC official warnings.
4. THE SYSTEM SHALL emit the card as DRAFT in the `advisories.csv` structure and SHALL NOT say any area is safe.

## Requirement 5 — Follow-up letter (D4b)
**User story:** As a reviewer, I want a neutral follow-up letter drafted for a project, so that the responsible office is asked for status without accusation.

#### Acceptance criteria
1. WHEN a `project_id` is provided THE SYSTEM SHALL read the project and its city and draft a formal, neutral letter stating the commitment, budget, deadline, status, progress and gap.
2. THE SYSTEM SHALL request current progress and a revised completion date, interim measures for affected barangays this season, and the latest progress report under the applicable FOI basis.
3. THE SYSTEM SHALL state that the reply will be posted on the City Page and that "No reply" is recorded after 15 working days.
4. IF an active typhoon or rainfall advisory affects the city THEN THE SYSTEM SHALL add one sentence on why the defense matters this week.
5. THE SYSTEM SHALL emit the letter as DRAFT with a one-line log entry and SHALL NOT use accusatory language.

## Requirement 6 — Citizen report triage (D4c)
**User story:** As a reviewer, I want incoming citizen reports screened against the project and other reports, so that only corroborated evidence is trusted and reporters stay anonymous.

#### Acceptance criteria
1. WHEN a report is submitted THE SYSTEM SHALL check it against the project's type and location in `projects.csv`.
2. WHEN scoring corroboration THE SYSTEM SHALL mark the report `corroborated` only IF at least two other matching reports (last 30 days) or a satellite check agree; otherwise `unverified`.
3. WHEN patterns suggest coordination or fakery (identical wording, many reports in minutes, mismatched type) THE SYSTEM SHALL flag it for a reviewer.
4. THE SYSTEM SHALL write a one-sentence evidence entry in the `evidence.csv` format and SHALL NOT include the reporter's identity in any output.

## Requirement 7 — Deadline escalation automation (D5a)
**User story:** As a reviewer, I want overdue or unmaintained defenses to trigger follow-up letters on a schedule, so that silences are chased and recorded without manual tracking.

#### Acceptance criteria
1. WHEN the daily check runs THE SYSTEM SHALL select projects where (status ≠ Completed AND deadline < today) OR (`maintenance` = Needs maintenance), with no follow-up sent in the last 30 days.
2. WHEN a candidate is found THE SYSTEM SHALL run the follow-up letter flow and route the draft to the reviewer for approval.
3. WHEN approved THE SYSTEM SHALL send to the office's (test) contact, log it, and start a 15-working-day reply clock.
4. IF a reply arrives THEN THE SYSTEM SHALL attach it to the project and post it to the City Page; IF the clock expires THEN THE SYSTEM SHALL record "No reply".
5. IF the backend `anchor_record` action is connected THEN THE SYSTEM SHALL call it per status change; otherwise it SHALL log the change and skip.
6. THE SYSTEM SHALL send a weekly summary and SHALL NOT send anything without reviewer approval.

## Requirement 8 — Typhoon event playbook (D5b)
**User story:** As a reviewer during a storm, I want every affected city prepared at once, so that guidance and escalations are ready for approval the moment a signal is raised.

#### Acceptance criteria
1. WHEN a tropical cyclone wind signal is raised for a city (PAGASA source or manual entry) THE SYSTEM SHALL run the advisory guidance card for each affected city.
2. THE SYSTEM SHALL draft an interim-measure notice listing the city's open gaps for barangay officials.
3. WHERE affected cities have overdue flood/drainage/dike/pump/seawall projects THE SYSTEM SHALL queue the deadline-escalation steps with a note that the advisory is active.
4. THE SYSTEM SHALL refresh the scorecard dashboard and send the team a status message (cities, real-risk levels, open gaps in the path, drafts awaiting approval).
5. THE SYSTEM SHALL emit all outputs as DRAFT until a reviewer approves them.

## Requirement 9 — Pre-season readiness automation (D5c)
**User story:** As a reviewer, I want a readiness report per city before the season, so that partners get a cited briefing combined with the city's scorecard.

#### Acceptance criteria
1. WHEN run on demand or four weeks before the typhoon season THE SYSTEM SHALL, for each city, run the city risk brief and attach the city's scorecard to produce a readiness report.
2. THE SYSTEM SHALL send each report to the reviewer, and WHEN approved SHALL share it with the DRRMO, Sanggunian and provided media contacts and post it on the City Page.

## Requirement 10 — Ripples City Assistant (D6)
**User story:** As a team member or partner, I want to ask questions grounded in the data, so that I get cited answers without reading every file.

#### Acceptance criteria
1. THE SYSTEM SHALL answer only from this space and the PAGASA/NDRRMC web sources.
2. WHEN answering THE SYSTEM SHALL cite the file or source and SHALL state when data is sample data.
3. WHEN asked about live warnings THE SYSTEM SHALL link PAGASA and NDRRMC rather than answer from memory, and SHALL NOT say a place is safe.

## Requirement 11 — Ripples Reviewer app (D7) — the approval gate
**User story:** As a reviewer, I want queues for commitments, drafts and reports, so that I can approve or reject every AI output before it has any effect.

#### Acceptance criteria
1. THE SYSTEM SHALL present three screens: commitments queue (editable extracted fields + Approve/Reject), drafts queue (letters, advisory cards, readiness reports with the source record beside each), and reports queue (triage result + corroborate/reject).
2. THE SYSTEM SHALL NOT display reporter identity anywhere in the reports queue.
3. WHEN a draft is approved or rejected THE SYSTEM SHALL update its state so dependent automations can act.
4. THE SYSTEM SHALL match the mockup look (dark navy; risk colors green/yellow/orange/red; condensed display headings) and use the CSVs as sample data.

---

## Cross-cutting requirements (apply to every requirement above)
- **CC-1 (S1):** No output says or implies "safe"; advisories defer to and link PAGASA/NDRRMC.
- **CC-2 (S2):** Every letter/advisory/report/commitment is DRAFT until a reviewer approves; nothing auto-sends; demo sends go to test addresses.
- **CC-3 (S3):** Neutral language only.
- **CC-4 (S4):** Risk and advisory levels come from fixed rules / precomputed fields, never model scoring.
- **CC-5 (S5):** Reporter identity never appears in any output or queue.
- **CC-6 (S6):** Reports stay `unverified` until corroborated; suspicious patterns are flagged.
- **CC-7 (S7):** Sample data is labeled everywhere.

## Out of scope (this version)
Live feeds, LCCAP ingestion at scale, satellite checks, real citizen uploads with EXIF/face handling, the Ripples backend (OpenAPI/MCP), Stellar anchoring, and the production public map. The 3D map remains a mockup.
