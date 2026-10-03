---
inclusion: always
---

# Product Overview — Ripples: Climate Defense Map

## Purpose
Ripples is an Amazon Quick–powered **climate accountability system** for the Philippines. It tracks each city's climate-defense commitments (from its Local Climate Change Action Plan, LCCAP), turns hazard advisories into guidance people can act on, and drafts follow-ups to the offices responsible for unfinished or unmaintained defenses. **A person approves every output.**

The public-facing experience we are designing is an explorable 3D map of the Philippines (City Pages → project evidence). In this version that map is a **mockup only**; the system we actually build is the Amazon Quick orchestration layer behind it.

## The operating model: Detect → Protect → Push
- **Detect** — pull concrete commitments out of LCCAP documents, score each city's real risk (current hazard + open gaps), and surface promises kept vs. open gaps by city and agency.
- **Protect** — turn a PAGASA/NDRRMC advisory into guidance for four audiences (households, schools, farmers, barangay officials); prepare every affected city when a typhoon signal is raised; produce pre-season readiness reports.
- **Push** — when a deadline passes or a defense needs maintenance, draft a neutral follow-up letter to the responsible office, track a reply clock, and record silences.

## Target users
- **Ripples reviewers** (our team, later partner universities/NGOs) — approve or reject AI drafts.
- **DRRMO staff, barangay officials, partner NGOs** — grounded answers, readiness reports, interim-measure notices.
- **Responsible offices** (LGU, DPWH, DENR, MMDA) — receive neutral follow-up letters and FOI requests with a right of reply.
- **Residents** — reached through barangay channels and partners in this version; the public City Page is future work.

## Business objectives
- **Transparency** — make local climate commitments and their real status visible.
- **Accountability** — make unmet commitments lead to action from the right office.
- **Sustainability** — make sure completed defenses stay maintained, and that the system is cheap enough for a small team to run.
All three serve one goal: **the safety and well-being of Filipinos facing climate change.**

## Non-negotiable product rules (every feature must honor these)
1. **Never tell anyone they are "safe."** Official warnings and evacuation orders come first; every advisory links PAGASA and NDRRMC.
2. **Human approval.** Extracted commitments, letters, advisory cards and readiness reports are **drafts** until a reviewer approves them. Nothing sends or publishes automatically.
3. **Neutral language.** "Overdue," "disputed," "needs maintenance" — never "corrupt," "negligent" or similar.
4. **Fixed-rule risk.** Real-risk levels and advisory levels come from the rules in the design doc (Appendix B), never from a model's own scoring.
5. **Protect reporters.** No output ever includes who submitted a citizen report.
6. **Fraud protection.** A citizen report stays "unverified" until two more matching reports or a satellite check corroborate it.
7. **Sample data is labeled** as sample data everywhere it appears (`sample_data = yes`).

## Scope boundary (this hackathon version)
- **Built now:** the Quick space + knowledge, scorecard dashboard, city risk briefs, three flows, three automations, the chat agent, and the Reviewer app — all on the sample CSVs.
- **Mockup only:** `ripples-climate-map.html` (3D map, City Pages, evidence view, typhoon demo).
- **Future (not built):** live PAGASA/NDRRMC feeds, LCCAP ingestion at scale, Sentinel-2 satellite checks, real citizen uploads, a Ripples backend called via OpenAPI/MCP, Stellar-anchored records, a production map.

> All records in the mockup and CSVs are **sample data**. They use real city names to show how the app works; they do not describe the actual status of any LGU, DPWH, DENR, MMDA or PAGASA record.
