# Ripples: Climate Defense Map

> ***Micro effort, macro effect.***

> **Sample data.** Every city record, advisory and report in this repo is sample data that shows how the app works. The data uses real city names, but it does not describe the actual status of any LGU, DPWH, DENR, MMDA or PAGASA record. Always follow official PAGASA and NDRRMC advisories.

---

## Project overview

Ripples is a climate accountability system for the Philippines, powered by **Amazon Quick** and built with **Kiro** using spec-driven development.

It tracks each city's climate-defense commitments from its Local Climate Change Action Plan (LCCAP), such as dikes, drainage, pumping stations, seawalls, mangrove belts, evacuation centers and early-warning systems. It also turns hazard advisories into guidance people can act on, and drafts follow-ups to the offices responsible for unfinished or unmaintained defenses. **A person approves every output.**

The public face is an explorable 3D map of the Philippines. Users go from a city to its City Page and then to each project's evidence: status, progress, maintenance, follow-ups and reference photos.

It rests on three core focuses, which all serve one goal: **the well-being of Filipinos facing climate change.**

- **Transparency.** Make local climate commitments and their real status visible.
- **Accountability.** Make sure unmet commitments lead to action from the right office.
- **Sustainability.** Make sure the protection lasts, and that the system is cheap enough for a small team to run.

The motto, *micro effort, macro effect*, is how Ripples works. A citizen spends a minute rating a project, sending a photo or asking for a follow-up. Many of those small actions together put a public record on every promise, and push the right office to act before the next typhoon.

## Target market

**The Filipino citizen.** Ripples is open to the general public. Anyone can open the map, see what their city promised, and check how those promises are going. No account is needed.

What a citizen can do on Ripples:

- **See their city's climate defenses**: every dike, drain, pumping station, seawall, mangrove belt, evacuation center and warning system in the city's LCCAP, with its status, deadline, progress and maintenance.
- **Understand their real risk**: the current hazard together with the city's open gaps, with official PAGASA and NDRRMC advisories always first.
- **Get guidance they can act on**: advisory cards with sections for households, schools, farmers and barangay officials.
- **Take part**: rate a project, submit a photo report (reporter identities are never shown), dispute a "completed" project, or ask for a follow-up letter to the responsible office.
- **Hold offices to account**: see which follow-ups were sent, which were answered, and which got no reply.

This matters most for residents of flood- and typhoon-exposed cities. The approach can grow city by city, because every LGU has the same LCCAP requirement under the Climate Change Act (RA 9729, amended by RA 10174). The pilot city is Malabon City.

Behind the public site, a small Ripples review team approves every letter and advisory before it goes out.

## The problem

The Philippines faces about 20 tropical cyclones a year and has ranked as the world's most disaster-at-risk country in recent WorldRiskReports. Every LGU has a climate plan. The problem is what happens between the plan and the next typhoon:

1. **Promises are hard to track.** Commitments are buried in long LCCAP PDFs and budget documents, spread across the LGU, DPWH, DENR and MMDA. A delayed or downsized project goes unnoticed.
2. **"Completed" doesn't mean "working."** Drainage clogs, dikes erode, mangrove plantings die and pumps break down. The record still says "finished," so the city looks protected when it isn't.
3. **Risk warnings ignore local gaps.** PAGASA and NDRRMC warn about the hazard, but they can't say that this city's river wall is still unfinished. Everyone gets the same generic warning.
4. **Follow-ups don't happen, or go unanswered.** Letters, FOI requests and reply tracking take time that DRRMO staff, NGOs and residents don't have, and silence leaves no public record.
5. **The gap is found too late.** Usually a broken or unfinished defense is found only after a flood, as in Ondoy (2009), Yolanda (2013) and Carina with the habagat (2024).

**In short:** the plan, the project's status and the incoming hazard are all known, but they sit in separate places. No one has the capacity to connect them city by city and act in time.

## The solution

Ripples connects **what was promised** to **how at risk people actually are**, city by city, through one operating model: **Detect → Protect → Push**.

- **Detect.** Pull concrete commitments out of LCCAP documents. Score each city's real risk as the current hazard plus its open gaps (unfinished or unmaintained defenses). Show promises kept and open gaps by city and agency on a scorecard. Screen citizen reports, which stay "unverified" until they're corroborated.
- **Protect.** Turn a PAGASA or NDRRMC advisory into one guidance card with sections for households, schools, farmers and barangay officials. The card uses the city's own open gaps and evacuation centers. When a typhoon signal is raised, every affected city is prepared at once. Before the season, each city gets a readiness report.
- **Push.** When a deadline passes or a defense needs maintenance, draft a neutral follow-up letter to the responsible office. A reviewer approves it, the reply clock starts, and silence is recorded.

**Completion isn't the end.** Finished defenses are tracked for maintenance. An unmaintained defense counts as a gap again and triggers the same follow-up.

### Built-in safeguards

1. Never tells anyone they are "safe." Official warnings come first, and every advisory links PAGASA and NDRRMC.
2. A person approves every send or publish. Demo sends go to test addresses.
3. Neutral language only: "overdue," "disputed," "needs maintenance."
4. Risk and advisory levels come from fixed rules, never from model scoring.
5. A citizen reporter's identity is never exposed.
6. Reports stay "unverified" until corroborated, and suspicious patterns are flagged.
7. Sample data is labeled everywhere.

---

## Run the web app

Requires Node.js 22.9 or later.

```bash
cd app
npm install
cp .env.example .env   # add your Mapbox public token as MAPBOX_TOKEN
npm start              # http://localhost:3000
npm test
```

- `/` is the landing page and `/map` is the 3D map explorer (for example `/map#/city/manila`).
- `/ops` is the scorecard and approval queue.
- If the map service can't load, the explorer still runs without the map. The city log, project panels and photos keep working.

## Repo guide

| Path | What it is |
|---|---|
| `app/` | Web app (Node server, public pages, tests) |
| `data/` | Sample CSVs, project reference photos (`project_media.json`) and photo credits |
| `.kiro/steering/`, `.kiro/specs/` | Kiro steering files and specs (requirements → design → tasks) |
| `quick-prompts.md` | Paste-ready D0–D7 prompts for Amazon Quick |
| `ripples-project-document.md` | Concept source of truth |
| `ARCHITECTURE-AND-EXECUTION-PLAN.md`, `docs/ARCHITECTURE.md` | Build plan and architecture |
| `RUNBOOK.md` | How to run the demo and drive Kiro |

Project reference photos are illustrative, not evidence for the sample projects. Each one is credited with its source and license.
