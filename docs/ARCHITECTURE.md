# Ripples Web App: System Architecture

**What it is:** a web application that runs the Ripples system (Detect → Protect → Push) on the six sample CSVs, on desktop and mobile. It implements the Quick components that citizens and reviewers need (D2 scorecard, D4b follow-up letter, D4c report triage, D7 approval gate), so it can be demoed today and later stand behind or alongside the Quick build.

> All data is **sample data**. Generated text comes from deterministic templates, not an LLM. Nothing is ever really sent: "sends" land in a test outbox.

## Run it

```bash
cd app
npm install
cp .env.example .env   # add MAPBOX_TOKEN (public pk. token) for satellite imagery
npm start          # http://localhost:3000 (reads .env)
npm test           # 30 tests: rules, safeguards, services, API, explorer adapter, landing model + copy
```

Node 22.9+ (for `--env-file-if-exists`). Configuration lives in `app/src/config.js` (port, data folder, approval mode, Mapbox token, rating salt); secrets come from `app/.env`, which is git-ignored.

## Layers

```
 Browser (phone or desktop)
 ┌──────────────────────────────────────────────────────────────┐
 │ public/  /      landing page (story + 2D project map)        │  plain HTML/CSS/JS, no build
 │          /map   3D explorer (map → City Page → evidence)     │
 │          /ops   Scorecard + drafts approval + follow-up log  │
 └──────────────────────────────┬───────────────────────────────┘
                                │ fetch JSON
 ┌──────────────────────────────▼───────────────────────────────┐
 │ api/        Express routes: validation, HTTP codes only      │
 ├──────────────────────────────────────────────────────────────┤
 │ services/   cities · scorecard (D2) · followUpLetter (D4b) · │
 │             reportTriage (D4c) · followups · ratings ·       │
 │             drafts (approval lifecycle, D7) · outbox         │
 ├──────────────────────────────────────────────────────────────┤
 │ domain/     rules (Appendix B) · safeguards (S1–S7) ·        │  pure functions,
 │             approval policy (S2)                             │  no I/O
 ├──────────────────────────────────────────────────────────────┤
 │ data/       repository: ../data/*.csv (read-only)            │
 │             stateStore: app/state/state.json (drafts, outbox,│
 │             follow-up log, citizen reports, public ratings)  │
 └──────────────────────────────────────────────────────────────┘
```

Each layer calls only the one below it. `services/index.js` is the single place where everything is wired together.

## How a request flows (example: a follow-up letter)

1. On a project page (landing map or `/map`), "Draft follow-up letter" calls `GET /api/flows/follow-up-letter/preview`, then `POST /api/flows/follow-up-letter`.
2. `followUpLetter.create()` reads the project and city, adds a hazard sentence only if an active advisory scores ≥ 1 by the fixed rules, fills the neutral template, and passes the result through `safeguards.enforce`. A second draft for the same project is refused while one is pending (409).
3. `drafts.create` asks the **approval policy** for the initial state: `DRAFT` (required mode) or `APPROVED` (auto mode).
4. A person approves on the Scorecard page (`POST /api/drafts/:id/approve`) → `drafts.release()`: the letter goes to the test outbox and a 15-working-day reply clock starts in the follow-up log.
5. When the office replies, the Scorecard records it (`POST /api/followups/:id/reply`), and the city's "follow-ups answered" figure updates.

## D-ID → module map

| D-ID | Quick component | Web app |
|---|---|---|
| D0 | Space + knowledge | `data/repository.js` reads `data/*.csv` |
| D2 | Ripples Climate Scorecard | `services/scorecard.js` → `/ops` |
| D4b | Follow-up letter | `services/followUpLetter.js` + `templates/letter.js` |
| D4c | Citizen report triage | `services/reportTriage.js` → report form on `/project` |
| D7 | Ripples Reviewer | `domain/approval.js` + drafts panel on `/ops`; `services/followups.js` for the reply log |

D3 (city risk brief), D4a (advisory guidance card), D5a–D5c (automations) and D6 (City Assistant) remain in the Amazon Quick plan but are not part of the web app.

## Safeguards in code

| Rule | Where it is enforced |
|---|---|
| S1 Never "safe" | `safeguards.check` rejects "safe", "out of danger", etc. in letters, triage entries and all landing copy; every City Page links PAGASA and NDRRMC |
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

## The landing page (`/`)

A cinematic, data-journalism-style front door (`public/index.html`, `public/js/landing/`, `public/css/landing.css`). Civic palette (navy, blue, white; red only for route lines and items needing attention), real photography, no build step.

| Component | Role |
|---|---|
| `Navbar` | Sticky; transparent over the hero, solid on scroll; highlights the section in view; mobile menu |
| `Hero` | Full-screen photo with drift and parallax, headline, Explore the map / Learn more |
| `PhilippineMap` | Pinned scroll scene: aerial photo dissolves, the SVG map zooms out from Tacloban, city clusters drop in, the red route draws; then interactive (cities → project pins → detail), with keyboard, touch, list view and drag-to-pan |
| `ProjectPin` / `ProjectPreview` / `ProjectDetail` | Status-shaped markers (real buttons), hover/tap preview card, detail panel (representative photo or planned schematic, status, progress, timeline, evidence, office, BACK / NEXT / RETURN TO MAP, link into `/map`) |
| `EvidenceCompare` | Promised (planned schematic) vs observed (photo + recorded evidence) with a draggable, keyboard-accessible slider |
| `Problem` (`CinematicImageSection`) | Parallax photo panels with sourced facts and figures from the data |
| `HowItWorks` · `Features` · `StatusSystem` · `About` · `ImpactStats` · `FAQ` · `FinalCTA` · `Footer` | Story sections; stats and status counts are live from `/api/explore`; the final CTA plays an exit transition into `/map`; the footer lists photo credits |

- **Data:** the same `/api/explore` call and `toCities()` adapter as the explorer; `js/landing/model.js` (pure, tested) maps records to six public statuses (Planned, Ongoing, Completed, Delayed, Incomplete, Requires verification), computes impact numbers and projects the map.
- **Copy:** all text lives in `js/landing/copy.js`; a test checks it and every component against the safeguard word lists (only the quoted FAQ term "ghost project" is allowed).
- **Photos:** 13 openly licensed Wikimedia Commons photos in `public/img/landing/` (with `-sm` variants), credited in `credits.json` and the footer. Next to sample projects they are always labeled "Representative photo · not this project".
- **Motion:** `js/landing/motion.js` — one scroll-driven rAF loop, IntersectionObserver reveals, tweens and count-ups; everything respects `prefers-reduced-motion`.
- **Shared code:** project schematics live in `js/shared/schematic.js`, used by both the landing page and the explorer.

## The map explorer (`/map`)

The explorer is the experience from `ripples-climate-map.html`, rebuilt on a real Mapbox map (`public/map.html`, `public/js/explore/app.js`, `public/css/explore.css`):

- **Base map:** Mapbox GL JS v3 with the `satellite-streets-v12` style (satellite imagery, roads and place names for the Philippines and its neighbours), Mercator projection. Drag to pan, right-drag to rotate and tilt, scroll to zoom.
- **3D pins on the map:** the mockup's three.js (r128) pins are drawn inside Mapbox as a custom 3D layer that shares the map's camera: city pins (color = real-risk level, beam height = score, ring = promises kept), project pins with progress beams and pulsing gap rings, and evacuation markers. Pins keep a constant on-screen size at every zoom. Glows always face the camera.
- **Readiness route:** curved Mapbox line layers with a moving dash. When you press NEXT, the camera flies to the next city (Mapbox `flyTo`) while a traveler dot runs along that route segment and lights it up.
- **Camera:** overview fitted to the Philippines (with room for the city log), city view fitted to that city's projects and evacuation centers (with room for the City Page), and project view at street level. Projects sit at their recorded approximate coordinates.
- **Labels:** HTML labels follow the pins. Project labels that would overlap are hidden, with priority for the hovered project and then projects with open gaps.
- Navigation: BACK / NEXT / MAP bar, diamond strip, arrow keys and M, hover previews, the city log and risk filters.
- **Routes:** `/map#/city/<id>` and `/map#/project/<id>` are shareable; the browser Back button works. The old `/city?id=` and `/project?id=` URLs redirect there.
- **Data:** one call to `GET /api/explore`; `public/js/explore/adapter.js` maps it onto the model the scene was built for. Risk, gaps and the scorecard are read from the server, never recomputed (S4).
- **Approval gate in the UI (S2):** "Draft follow-up letter" shows the server's letter and creates a draft; nothing is sent from the map. A reviewer approves it on the Scorecard page.
- **Reports (S5, S6):** the photo is re-encoded in the browser to strip location data and stays on the device (IndexedDB). Only the written description goes to `POST /api/reports` for triage.
- **Token:** `MAPBOX_TOKEN` in `app/.env`, served to the page by `GET /api/config`. It is a public token; restrict it to the app's URLs in the Mapbox account. Mapbox's logo and attribution are always shown.
- **Fallback:** without a token, without WebGL, or with `?nogl=1`, the city log, City Page, evidence view and navigation all still work, with a note explaining why the map is missing.

## Record ledger (blockchain-style record integrity)

Ripples keeps project records tamper-evident with a SHA-256 hash chain (`src/domain/ledger.js`, `src/services/ledger.js`). It is used for record integrity and record keeping only: there is no cryptocurrency, wallet, token or payment.

- **Record → fingerprint:** each project's record (details, status, progress, deadline, maintenance, interim measure and every piece of evidence, including triaged citizen reports) is serialized as canonical JSON and hashed with SHA-256.
- **Fingerprint → block:** a block holds `height`, time, record type, record id, the fingerprint and the previous block's hash; its own hash is SHA-256 of those fields. Block 0 is the genesis block.
- **When blocks are added:** the ledger syncs on every read. A project gets a "Record created" block the first time and a "Record updated" block whenever its fingerprint changes (e.g. a new citizen report). Approval decisions and recorded office replies are chained as their own blocks.
- **Verification in the browser:** `public/js/shared/ledger.js` recomputes the hashes with Web Crypto, so a visitor does not have to trust the server. Changing any past record or block breaks the chain at that block.
- **Where it shows:** the "Record integrity · blockchain ledger" step on every project page on the map, a ledger link on each City Page, a Record integrity card on the Scorecard, the landing page feature and FAQ, and the `/ledger` page (chain status, how it works, verify any project record, latest blocks, verify the entire chain).
- **Storage:** blocks live in the JSON state store next to drafts and follow-ups. A hosted, shared ledger is roadmap work.

## Project photos and source references

`data/project_media.json` (from `app/scripts/import_helloo_photos.py`) gives some projects a **reference photo** and lists **source links** for all projects that have them. All 16 distinct team photos that show what their name says are shown, each credited to its source (government, public domain, news and company photos). News and company photos are marked as needing the owner's permission before a public release. Four photos are left out because their content doesn't match their name (the Dagupan "Pantal River" street scene, and the evacuation-center, telemetry-gauge and retention-basin images). Photos are labelled "reference only, not this sample project's own record". The helloo manifest reused images across unrelated entries, so the photo mapping is explicit and was checked by eye.

## Public ratings

Anyone can give a project a thumbs up or down from the 3D explorer's evidence view (`/map`, "Public rating" step). A thumbs down can carry one optional reason from a fixed, neutral list: looks unfinished, not working or not maintained, hard to find or access, not useful to the community, other.

- **One per browser:** the browser keeps a random ID (`localStorage` key `ripples-voter`). The server stores only `sha256(salt | project | ID)` (`services/ratings.js`, salt from `RIPPLES_RATING_SALT`), so nothing identifies a person and the same browser can't be linked across projects (S5). Votes can be changed or removed. This is a fairness measure, not tamper-proof.
- **Opinions only:** ratings never change a project's status, gaps or risk (S4) and are not evidence or corroboration (S6). The UI says so next to the buttons.
- **Scorecard:** the project explorer shows ▲/▼ counts, and a "Most thumbs down" card lists the top 5 with their most-given reason.

## Responsive design

- The explorer follows the mockup's breakpoints: under 760 px the city log and City Page become bottom sheets and the map controls hide.
- The Scorecard uses the same visual language (dark navy, glowing outlines, condensed display type, scanlines). Under 768 px: one column, a bottom tab bar, tables become cards. From 768 px: a side nav.
- Dark only, like the explorer.
- Checked at 375 px: no horizontal page scroll.

## Ready for later

| Later | Where it plugs in |
|---|---|
| Login and roles | `identify()` middleware in `api/index.js`; routes already split into public (`api/public.js`) and operator (`api/ops.js`) |
| A real database | replace `data/repository.js` and `data/stateStore.js`, keeping the same method names |
| Live PAGASA/NDRRMC feeds | feed advisories into `cities.activeAdvisories()`; the rules engine is unchanged |
| Real email/SMS | replace `services/outbox.js`; the approval gate stays in front of it |
| Amazon Quick | Quick flows can call this API (OpenAPI/MCP connector), or the app can read Quick outputs as drafts |
| An LLM for wording | swap a template in `services/templates/`; `safeguards.enforce` still checks every output |

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Status and approval mode |
| GET | `/api/config` | Client config: the public Mapbox token (or null) |
| GET | `/api/cities` | All cities with risk, gaps and scorecard figures |
| GET | `/api/cities/:id` | City Page bundle |
| GET | `/api/explore` | Everything the 3D explorer needs, cities in route order |
| GET | `/api/ledger` | Record ledger: chain check, counts and blocks (`offset`, `limit`, or `all=1`) |
| GET | `/api/projects/:id/integrity` | One project's hashed record, current fingerprint and block history |
| GET | `/api/projects/:id` | Project evidence view (includes `rating: { up, down }`) |
| GET | `/api/projects/:id/rating?voter=` | Rating tally, this browser's vote, reason options |
| POST | `/api/projects/:id/rating` | Rate (`voter`, `vote`: `up` · `down` · `null` to remove, optional `reason` with `down`) |
| GET | `/api/scorecard` | D2 dashboard data |
| GET | `/api/drafts?state=&kind=&city_id=` | Drafts |
| POST | `/api/drafts/:id/approve` · `/reject` | Decide on a draft (body: `{ note }`) |
| GET | `/api/flows/follow-up-letter/preview?project_id=` | D4b preview (nothing stored) |
| POST | `/api/flows/follow-up-letter` | D4b (`project_id`); 409 if one is already awaiting approval |
| GET/POST | `/api/reports` | D4c triage (`project_id`, `report_type`, `text`, `photo_description`) |
| GET | `/api/followups` · POST `/api/followups/:id/reply` | Follow-up log, record a reply |
| GET | `/api/outbox` | Test outbox |
| POST | `/api/admin/reset` | Clear demo activity: drafts, outbox, follow-ups, reports, ratings (CSVs are never changed; no UI) |
