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
- [x] 9. Landing page at `/` (explorer moves to `/map`)
  - _Depends on:_ 8 · _Requirements:_ W1–W3, S1, S3, S7 · _Exit test:_ hero → pinned map transition plays; clusters, pins, preview, detail, BACK/NEXT/RETURN work with mouse, keyboard and touch; compare slider works; stats and status counts match `/api/explore`; copy passes the safeguard word test; photos credited and labeled representative; no horizontal scroll at 375 px; old links redirect.
- [x] 10. Remove the typhoon demo, Simulate and Assistant (UI and server code)
  - _Depends on:_ 9 · _Requirements:_ W1–W7, W9 · _Exit test:_ `/simulate`, `/assistant` and their API routes return 404; the explorer has no demo button; letters still flow draft → approval → test outbox → reply; all tests pass. The Amazon Quick plan (D3, D4a, D5, D6) is unchanged.
- [x] 11. Public thumbs up/down ratings (explorer evidence view + Scorecard)
  - _Depends on:_ 10 · _Requirements:_ W8, S3–S6 · _Exit test:_ one vote per browser, changeable/removable; reasons only with thumbs down; only hashes stored; status and risk unchanged; Scorecard shows counts and "Most thumbs down"; tests pass.
- [x] 12. Mapbox satellite on the 3D map, green-and-blue theme, helloo photos and data (140 projects: 40 hand-written + 100 generated city work packages)
  - _Depends on:_ 11 · _Exit test:_ satellite imagery shows with pins/route unchanged and falls back without a token; city imagery sharpens on arrival; attribution visible; explorer, Scorecard and landing use the green/blue palette; team photos shown as credited reference photos (news photos flagged as needing permission), mismatched photos left out; 140 projects with cities.csv matching the rules; tests pass.
- [x] 13. Explorer on a real Mapbox GL map (satellite-streets, neighbouring countries visible), with the 3D pins, route animation and panels kept
  - _Depends on:_ 12 · _Requirements:_ W1–W3, S1, S7 · _Exit test:_ `/map` shows Mapbox satellite-streets with place names; city and project pins, beams, pulses and gap rings render on the map at a constant size; NEXT flies to the next city with the traveler on the route; city and project views frame correctly beside the panels; overlapping project labels are hidden; Mapbox logo and attribution visible; no token or `?nogl=1` → panels still work with a note; tests pass.
- [x] 14. Record ledger (blockchain-style record integrity), map search, Scorecard tabs, new logo, 8 more cities
  - _Depends on:_ 13 · _Requirements:_ W1–W3, S2, S3, S7 · _Exit test:_ every project record is SHA-256 fingerprinted and hash-chained; a new report chains a "Record updated" block; editing any block is detected; the project page and `/ledger` verify records in the browser; no currency, wallet or payment fields; map search finds projects by name, city, river or office and flies to them; Scorecard is organized in tabs (Overview, Cities, Projects, Follow-ups, Approvals); logo3 used on all pages; 16 cities / 220 projects with cities.csv matching the rules; tests pass.
