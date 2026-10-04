# Requirements — Ripples Web App

**Spec:** `ripples-web-app` · **Builds on:** `ripples-quick-system` (same D-IDs, same safeguards S1–S7)

## Introduction
A runnable web application that implements the Ripples system (Detect → Protect → Push) on the six sample CSVs. It works on desktop and mobile, mirrors the Amazon Quick components one-to-one (D2–D6), and keeps the 3D map (`ripples-climate-map.html`) as a separate pitch demo. Generated text comes from deterministic templates (no LLM). Login and roles are out of scope for this version.

## Glossary
- **Open gap:** a project whose `gap` is `Overdue` or `Needs maintenance`.
- **Draft:** a generated follow-up letter; `review_state ∈ {DRAFT, APPROVED, REJECTED}`.
- **Release:** sending an approved letter to the test outbox and starting its reply clock.
- **Approval mode:** `required` (a person approves before release) or `auto` (release immediately). Default `required`.

## Requirements

### W1 — Public map (Detect)
As a resident, I want a map of the tracked cities colored by real-risk level, so I can see where defenses are missing.
1. WHEN the home page loads THE app SHALL show every city in `cities.csv` as a map marker colored by `real_risk_level`, plus an accessible list of the same cities.
2. IF map tiles fail to load THEN the city list SHALL remain fully usable.
3. THE page SHALL work at 360 px width without horizontal scrolling.

### W2 — City Page (Detect / Protect)
1. THE City Page SHALL show the real-risk level with its breakdown (hazard points + gap points = score), active advisories with four audience sections, projects (filterable by status), open gaps with interim measures, seasonal outlook, evacuation centers, community actions, scorecard and official sources (PAGASA, NDRRMC).

### W3 — Project evidence view (Detect)
1. THE project view SHALL show location, project, progress, status, timeline, responsible office, follow-ups, and every evidence item with source and corroboration.

### W4 — Rules engine (S4)
1. THE rules engine SHALL compute hazard points from the PAGASA tables, gap points (open gaps, capped at 3), score and level (0–1 Low, 2–3 Moderate, 4 High, 5–6 Critical).
2. THE rules engine SHALL reproduce every precomputed risk and scorecard field in `cities.csv`.

### W5 — Ops scorecard (D2)
1. THE ops page SHALL show KPIs (commitments tracked, open gaps, cities at High/Critical), a city table sorted by `risk_score`, gaps by agency, follow-up accountability, and a filterable project explorer.
2. THE open-gap total SHALL equal a hand count of `projects.csv`.

### W6 — Flows (D4b, D4c)
1. Follow-up letter: neutral letter with the three requests (progress + revised date, interim measures, FOI copy), the reply-clock sentence, and a hazard sentence only when an advisory is active; emit a DRAFT and a log entry.
2. Citizen report triage: `corroborated` only with ≥2 matching reports in 30 days or a satellite check; otherwise `unverified`; flag suspicious patterns; never store reporter identity.

### W7 — Follow-up log
1. WHEN a letter is released THE system SHALL log it with a 15-working-day reply clock.
2. THE Scorecard SHALL let a reviewer record a reply, which then counts in the city's "follow-ups answered".

> Removed from the web app (still in the Amazon Quick plan): advisory guidance card (D4a), automations (D5a–D5c), typhoon simulation and the City Assistant (D6).

### W8 — Public ratings
1. THE project evidence view SHALL let anyone give a thumbs up or down, one vote per browser, changeable or removable.
2. WHEN a vote is a thumbs down THE view SHALL offer one optional reason from a fixed neutral list; no free text.
3. THE system SHALL store only a salted hash of the browser's random ID, per project (S5).
4. Ratings SHALL NOT change a project's status, gaps or risk (S4), and SHALL NOT count as evidence (S6).
5. THE Scorecard SHALL show per-project counts and the five projects with the most thumbs down, with their most-given reason.

### W9 — Approval policy (S2)
1. Every release SHALL go through one approval-policy function.
2. WHEN mode is `required` THEN nothing SHALL reach the outbox or a City Page until a person approves it.
3. Changing the mode SHALL require changing one configuration value only.

### Cross-cutting (S1–S7)
Every generated output SHALL pass the safeguard checks: never "safe" (S1), DRAFT until released (S2), neutral language (S3), fixed-rule levels (S4), no reporter identity (S5), corroboration rule (S6), sample-data label (S7).
