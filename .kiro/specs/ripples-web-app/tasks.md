# Implementation Plan — Ripples Web App

**Spec:** `ripples-web-app` · **Implements:** requirements W1–W9 + S1–S7 · **Pilot:** Malabon first

- [x] 1. Data layer — CSV parser, repository, JSON state store
  - _Depends on:_ — · _Requirements:_ W4, W9 · _Exit test:_ repository loads 8 cities, 32 projects, 10 advisories, 48 evidence, 24 centers, 19 actions.
- [x] 2. Domain — rules engine, safeguards, approval policy
  - _Depends on:_ 1 · _Requirements:_ W4, W9, S1–S7 · _Exit test:_ rules reproduce every risk and scorecard field in `cities.csv`; gate blocks release in `required` mode.
- [x] 3. Services — D2 scorecard, D4a/D4b/D4c flows
  - _Depends on:_ 2 · _Requirements:_ W5, W6 · _Exit test:_ open gaps = 12; Malabon card has four sections and ends with the PAGASA/NDRRMC line; `mal-wall` letter has the three requests; triage cases pass.
- [x] 4. Services — D3 brief, D5a/D5b/D5c automations, D6 assistant, outbox
  - _Depends on:_ 3 · _Requirements:_ W7, W8 · _Exit test:_ escalation selects 12 candidates; Signal 3 simulation makes Malabon Critical; nothing reaches the outbox before approval.
- [x] 5. API — REST routes, validation, error handler
  - _Depends on:_ 4 · _Requirements:_ W1–W9 · _Exit test:_ API smoke test passes.
- [x] 6. Front end — public map, City Page, project view, ops, simulate, assistant
  - _Depends on:_ 5 · _Requirements:_ W1–W3, W5, W7, W8 · _Exit test:_ demo walk-through works at desktop width and at 390 px with no horizontal scroll.
- [x] 7. Docs — `docs/ARCHITECTURE.md`, steering and runbook updates
  - _Depends on:_ 6 · _Exit test:_ D-ID → module map matches the code.
- [x] 8. 3D explorer: port `ripples-climate-map.html` as the public UI, restyle ops pages to match
  - _Depends on:_ 6 · _Requirements:_ W1–W3, W7, W9, S2, S4, S5 · _Exit test:_ explorer loads from `/api/explore` with server risk; deep links `#/city/…` and `#/project/…` work; typhoon demo raises risk and leaves guidance pending until approved; letters and reports go through the API; `?nogl=1` fallback works; no horizontal scroll at 375 px.
