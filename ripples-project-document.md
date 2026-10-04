---
title: "Ripples: Climate Defense Map"
subtitle: "Project document and Amazon Quick brief · v2 · October 2026"
---

# How to use this document

This is the team's single source of truth for the project, and it doubles as the brief for Amazon Quick. It has four parts:

- **Part A, Concept.** What the Quick-built system does, who uses it and why: Detect → Protect → Push, city by city. Also separates what is built now from what is mockup-only or future work.
- **Part B, Experience.** The public face we are designing: an explorable 3D map of the Philippines that opens into City Pages and project evidence. This is what the mockup shows; it is not yet a connected app.
- **Part C, Amazon Quick.** How Quick acts as the AI orchestration layer: connecting data sources, synthesizing research, turning ideas into actions and automating workflows.
- **Part D, Prompts for Quick.** Paste-ready prompts that tell Quick what to build.

The appendices hold the data dictionary for the sample CSVs, the real-risk rules, notes on the mockup, and Q&A prep.

**Working name:** Ripples. Rename freely.

**Files that go with this document:**

| File | What it is |
|---|---|
| `ripples-project-document.md` / `.docx` | This document |
| `quick-prompts.md` | Part D on its own, for copy-paste into Quick |
| `ripples-climate-map.html` | The interactive mockup (open in a browser) |
| `data/cities.csv` | 8 sample cities with risk level and scorecard |
| `data/projects.csv` | 32 sample climate-defense commitments |
| `data/advisories.csv` | Sample advisories with guidance for four audiences |
| `data/evidence.csv` | Sample citizen reports, satellite checks, LGU updates |
| `data/evacuation_centers.csv` | Sample evacuation centers |
| `data/community_actions.csv` | Sample community actions |

> **All records in the mockup and the CSVs are sample data.** They use real city names to show how the app works. They do not describe the actual status of any LGU, DPWH or PAGASA record. Every row carries `sample_data = yes`.

# Part A: Concept

## One-liner

An Amazon Quick–powered climate accountability system. It tracks each city's climate-defense commitments, turns hazard advisories into guidance people can act on, and drafts follow-ups to the offices responsible for unfinished or unmaintained defenses. A person approves every output. The public face we are designing for it is an explorable 3D map of the Philippines, shown in the mockup (Part B).

## Core focuses

- **Transparency.** Make local climate commitments and their real status visible.
- **Accountability.** Make sure unmet commitments lead to action from the right office.
- **Sustainability.** Make sure the protection lasts: for the environment, for communities, and for the system itself.

All three serve one goal: **the safety and well-being of Filipinos facing climate change.**

## The problem

The Philippines faces about 20 tropical cyclones a year, and it has ranked as the world's most disaster-at-risk country in recent WorldRiskReports. Floods, storm surge and extreme heat are getting worse. Under the Climate Change Act (RA 9729, amended by RA 10174), every LGU must prepare a Local Climate Change Action Plan (LCCAP) that lists the defenses it will build: dikes, drainage, pumping stations, seawalls, mangrove belts, evacuation centers and early-warning systems.

The plans exist. The problem is what happens between the plan and the next typhoon:

1. **Promises are hard to track.** Commitments are buried in long LCCAP PDFs and budget documents, spread across the LGU, DPWH, DENR and MMDA. No one keeps a running list of what was promised for each city, by which office and by when, so a delayed or downsized project goes unnoticed.
2. **"Completed" doesn't mean "working."** A drainage canal clogs, a dike erodes, a mangrove planting dies, a pump breaks down. Records show the project as finished, so the city looks protected when it isn't.
3. **Risk warnings ignore local gaps.** PAGASA and NDRRMC warn about the hazard, such as a Signal 3 typhoon or an orange rainfall warning. They can't say that, in this city, the river wall meant to hold that flood is still unfinished. Households, schools, farmers and barangay officials get the same generic warning everywhere.
4. **Follow-ups don't happen, or go unanswered.** Asking the responsible office for a status update means drafting letters and FOI requests, tracking deadlines and chasing replies. DRRMO staff, NGOs and residents don't have the time, and unanswered requests leave no public record.
5. **The gap is found too late.** Today the usual way an unfinished or broken defense comes to light is a flood, as in Marikina during Ondoy (2009), Tacloban during Yolanda (2013) and Metro Manila during Carina and the habagat (2024). By then people are already harmed.

**In short:** the information needed to see the gap before the season (the plan, the project's status and the incoming hazard) already exists, but it sits in separate places. No one has the capacity to connect it city by city and act on it in time. Ripples uses Amazon Quick to do that connecting work, with people reviewing every output.

## Who it's for

| Who | What they use | What they get |
|---|---|---|
| **Ripples reviewers** (our team, later partner universities or NGOs) | Ripples Reviewer app, chat agent, dashboard | A queue of AI drafts (extracted commitments, letters, advisory cards, readiness reports, triaged reports) to approve or reject |
| **DRRMO staff, barangay officials, partner NGOs** | Chat agent, scorecard dashboard, shared reports | Answers grounded in the data, readiness reports before the season, interim-measure notices during a typhoon |
| **Responsible offices** (LGU, DPWH, DENR, MMDA) | They receive our letters | Neutral follow-up letters and FOI requests, with a right of reply |
| **Residents** | Approved advisories and reports, shared through barangay channels; later the public City Page | Clear guidance for households, schools and farmers, and a view of what their city promised |

The system is **operated by people, through Quick**. Residents are the audience it ultimately serves, but in this version they reach the content through barangay officials and partners, not through a public app.

## How it works: Detect → Protect → Push

Everything is organized **by city**. One Quick space holds this document, the sample data and (later) the LCCAP files, so every research report, flow and automation is grounded in the same records.

| Stage | What happens | Quick component | Output | In this version |
|---|---|---|---|---|
| **Detect** | Pull concrete commitments (what, where, budget, deadline, responsible office) out of LCCAP documents and compare them with published records | Quick Research: commitment extraction check | List of new, changed and missing commitments for a reviewer | Built; sample LCCAP files |
| **Detect** | Screen citizen reports against the project and other reports | Quick Flows: citizen report triage | "Unverified" or "corroborated" evidence entry | Built; sample reports |
| **Detect** | Score each city's real risk: current hazard + open gaps (unfinished or unmaintained defenses) | Fixed rules (Appendix B), read by Quick | Real-risk level with its breakdown | Precomputed in `cities.csv` |
| **Detect** | Show promises kept, defenses maintained, open gaps by city and agency | Quick Sight: Ripples Climate Scorecard | Dashboard | Built |
| **Protect** | Turn a PAGASA or NDRRMC advisory into guidance for households, schools, farmers and barangay officials, using the city's open gaps and evacuation centers | Quick Flows: advisory guidance card | Draft advisory card | Built |
| **Protect** | When a typhoon signal is raised, prepare every affected city at once | Quick Automate: typhoon event playbook | Advisory cards, interim-measure notices, status message to the team | Built; signal entered manually |
| **Protect** | Before the season, research each city's outlook and combine it with its open gaps | Quick Research + Automate: pre-season readiness | Two-page readiness report | Built |
| **Push** | When a deadline passes or a defense needs maintenance, write to the responsible office | Quick Flows: follow-up letter; Quick Automate: deadline escalation | Draft letter → reviewer approval → sent, 15-working-day reply clock, "No reply" recorded | Built; sends to test addresses |
| **Push** | Answer questions from the team and partners | Quick chat agent: Ripples City Assistant | Cited answers | Built |

**Completion isn't the end.** Finished defenses are tracked for maintenance (clogged drainage, eroded dikes, mangrove survival). An unmaintained defense counts as a gap again and triggers the same follow-up.

**Each advisory includes guidance for everyone in one card:** what's happening (type, level, time, official source), then sections for households, schools, farmers and barangay officials. Advisory types follow PAGASA categories: heat index, rainfall warnings, flood advisories, tropical cyclone wind signals and drought (thresholds in Appendix B).

## What we're building now, and what comes later

| Tier | What it includes |
|---|---|
| **Built in Amazon Quick (the hackathon system)** | The Ripples space and knowledge (D0), scorecard dashboard (D2), city risk briefs (D3), advisory, letter and triage flows (D4), deadline, typhoon and pre-season automations (D5), the Ripples City Assistant chat agent (D6) and the Ripples Reviewer app (D7). All run on the sample CSVs in `data/`. |
| **Mockup (shows the public experience)** | `ripples-climate-map.html`: the 3D map, City Pages, project evidence view, typhoon demo, in-browser photo report and a simulated "Verified record" badge. It shows the same sample data that Quick uses. It is a design, not a connected app. |
| **Future (not built)** | Live PAGASA and NDRRMC feeds, LCCAP ingestion across many cities, Sentinel-2 satellite checks, real citizen uploads with location stripping and face blurring, a Ripples backend that Quick calls through an OpenAPI or MCP connector, a blockchain-style record ledger (SHA-256 hash chain) that keeps project records tamper-evident, and a production map (Mapbox or MapLibre). The build tool for the public app (Kiro, if required) is still to be confirmed with the organizers. |

**Rule-based where it matters.** Advisory levels and real-risk levels come from fixed rules (PAGASA thresholds and the gap count), not a model, so every result can be explained. Quick uses AI for the language work (extracting commitments, triaging reports, writing guidance, letters and reports) and a person checks all of it.

## Safeguards

These rules are written into every Quick prompt (Part D) and enforced by the reviewer step:

- **Never tells anyone they're "safe."** Official warnings and evacuation orders always come first, and every advisory links PAGASA and NDRRMC.
- **Human approval:** extracted commitments, letters, advisory cards and readiness reports are drafts until a reviewer approves them. Nothing is sent or published automatically.
- **Neutral language:** "overdue," "disputed," "needs maintenance," never "corrupt."
- **Fraud protection:** a report stays "unverified" until two more matching reports or a satellite check back it up.
- **Protects reporters:** no output ever includes who submitted a report. (Stripping photo location data and blurring faces are part of the future public upload feature.)
- **No money handled:** sponsors give directly to partner NGOs or LGUs.
- **Sample data is labeled** as sample data everywhere it appears.

## What makes it different

Existing tools each cover one piece: NDRRMC sends alerts, Project NOAH and HazardHunterPH map hazards, and government sites take complaints. **Ripples connects what was promised to how at risk people actually are**, city by city, including whether finished defenses are still working. Because one Quick space grounds the research, flows and automations, the slow work (reading plans, writing guidance, chasing replies) is drafted automatically, and people only review and approve.

## Feasibility and next steps

**What is true today:**

- Runs on public and sample data. The first version needs no LGU system integration: it reads published LCCAPs and advisories and writes to official contacts.
- Low cost: Quick does the orchestration; there are no messaging fees and no backend to run yet.
- A small team can operate it, because a reviewer only approves drafts.

**Pilot:** one city, one hazard season, one DRRMO or NGO partner. The mockup and sample data use Malabon City.

**If the pilot works (hypotheses to test):**

- Partner universities or NGOs take over review in each region.
- A strong scorecard could support LGU proposals to the People's Survival Fund, giving LGUs a reason to participate.
- Funding from climate and governance grants, NGO partnerships and business CSR.
- It can grow city by city, because every LGU has the same LCCAP requirement.

## MVP demo flow

1. **Open the Ripples Climate Scorecard** in Quick Sight. Show open gaps by city and agency, and which offices have not replied.
2. **Ask the Ripples City Assistant:** "Which open gaps raise Malabon's risk this season?" It answers with citations and labels the data as sample data.
3. **Enter a sample Signal 3 typhoon.** The typhoon event playbook runs the advisory guidance card for affected cities: one card with sections for households, schools, farmers and barangay officials.
4. **Deadline escalation** drafts a follow-up letter for Malabon's overdue river wall. Approve it in the **Ripples Reviewer** app; the reply clock starts and the dashboard updates.
5. **Show a pre-season readiness report** from Quick Research.
6. **Close with the mockup:** the same data on the public 3D map and City Page, including the typhoon demo. "This is where it goes next."

## Mission statement

"We help Filipino communities stay safe from climate change by making local climate commitments transparent, holding responsible offices accountable for delivering them, and making sure the protection they provide is sustainable for years to come."

## Pitch line

"Every Filipino city has a climate plan. Ripples, powered by Amazon Quick, makes sure those plans actually protect people, today and for years to come."

# Part B: The experience, an explorable climate map

This part describes the public experience we are designing, as shown in the mockup. It uses the same data as the Quick system in Part A but is not yet connected to it. The app should feel like an exploration game combined with a government transparency dashboard. People are not reading a report; they are flying across the country, choosing where to look, and following the evidence. Interactivity, navigation and clickable elements matter more than animation.

## Three levels

| Level | What the user sees | What they can do |
|---|---|---|
| **National map** | 3D map of the Philippines. City pins colored by real-risk level. Beam height shows the risk score. A ring around each pin fills with the share of promises kept on time. A red route links the cities. | Pan, zoom, rotate, tilt between 2D and 3D. Filter cities by risk level. Hover for a preview. Click a pin or a row in the city log. Start the route. Run the typhoon demo. |
| **City Page** | The camera frames the city on the right; the City Page slides in on the left. Project pins (colored by status, with a pulsing ring on open gaps) and evacuation centers appear on the map. | Read the risk breakdown and advisories. Expand an advisory for the four audience sections. Filter projects by status. Click a project in the list or on the map. Jump between sections with tabs. |
| **Project evidence view** | A large evidence frame (citizen photo, satellite image or a schematic of the defense) beside an information rail. | Read Location → Project → Current Progress → Status → Date/Timeline → Responsible office → Evidence. Generate a follow-up letter. Submit a photo report. Dispute a "completed" status. |

## Navigation controls

A game-style navigation bar docks at the bottom whenever the user is inside a city or project.

| Control | On a City Page | In a project evidence view |
|---|---|---|
| **← BACK** | Returns to the previous city, or to the map if this was the first stop | Returns to the City Page or the previous project |
| **NEXT →** | Flies along the red route to the next city | Moves to the next project in the same city |
| **MAP** | Zooms back out to the whole Philippines | Same |
| **Diamond strip** | Jump to any city on the route | Jump to any project in the city |

Keyboard: ← BACK, → NEXT, M or Esc for MAP. Buttons glow on hover, shift slightly when pressed, and show where they lead ("NEXT · Marikina City · 16 km").

## Transitions

1. The user selects a pin.
2. The camera flies toward the city.
3. The City Page slides in while the camera reframes the city beside it.
4. Selecting a project zooms the camera to its pin, then the evidence view opens out from it and the information rail animates in step by step.
5. NEXT on a City Page closes the page and flies the camera along the red line to the next city.
6. BACK retraces the user's actual path.
7. MAP zooms smoothly back out to the whole country.

## Typhoon demo mode

A clearly labeled simulation for pitching and training. A typhoon crosses the map along a forecast track. Each city gets a wind signal based on its distance from the track. Real-risk levels, pin colors and beam heights update. Affected City Pages get a new advisory with guidance for all four audiences, generated from the signal level and the city's open gaps. A follow-up letter is drafted for the pilot city's most urgent overdue defense. A banner stays on screen: "Simulated typhoon. Not a real advisory."

## Evidence and trust

- Every evidence item shows its source (citizen photo, satellite check, LGU update, community monitoring) and whether it is corroborated.
- Citizen photos are re-encoded in the browser on upload, which removes location and camera data.
- Every project and scorecard shows a "Verified record" badge with a short record hash. The web app backs it with a blockchain-style record ledger: every record is fingerprinted with SHA-256 and hash-chained, and anyone can verify it in their browser. It is used for record integrity only, with no currency, wallets or payments.

# Part C: Amazon Quick, the AI orchestration layer

Amazon Quick is the system we build for the hackathon (Part A). The map and City Pages in the mockup are the planned public front end. Quick is the orchestration layer that does four jobs for the team: **connects data sources, synthesizes research, turns ideas into actions, and automates workflows.** Quick feature names below follow AWS's documentation as of October 2026. Confirm with the organizers which components the hackathon environment includes.

## What Quick does, by objective

| Objective | Quick component | What it does for Ripples |
|---|---|---|
| **Connect data sources** | Spaces, Quick Index, knowledge bases (S3, web crawler, Google Drive, SharePoint), structured data, action connectors, MCP and OpenAPI | One space holds this document, the CSVs, LCCAP PDFs and LGU budget files. The web crawler indexes public PAGASA and NDRRMC pages. Action connectors reach email, Slack or Teams. Later, an OpenAPI or MCP connector calls the Ripples backend (project records and the record ledger); for now the CSVs stand in for it. |
| **Synthesize research** | Quick Research | Per-city climate risk briefs; pre-season readiness research; cross-checking AI-extracted commitments against the source LCCAP; summarizing news about a project. |
| **Turn ideas into actions** | Quick Flows, chat agents | Repeatable, shareable workflows: advisory text → four-audience guidance card; project record → follow-up letter; citizen report → triage summary; city → readiness report. A custom chat agent answers team and partner questions grounded in the space. |
| **Automate workflows** | Quick Automate | Multi-step escalation that runs on triggers: a deadline passes, a typhoon signal is raised, the pre-season window opens. Includes human approval steps before anything is sent. |
| **Analytics** | Quick Sight | Scorecard dashboard: promises kept, defenses maintained, follow-up response rates, open gaps by city and agency. |
| **Prototype** | Apps in Amazon Quick | A lightweight internal reviewer app (approve extracted commitments, review reports and letters) built from a natural-language description and the mockup. |

## Data sources Quick connects

| Source | How it reaches Quick | Used for |
|---|---|---|
| LCCAP documents and LGU budgets (PDF) | Upload to the space or S3 knowledge base | Commitment extraction and verification |
| Ripples project records | CSV now (`data/*.csv`); API later via OpenAPI or MCP connector | Dashboards, letters, escalation |
| PAGASA and NDRRMC public pages | Web crawler knowledge base or web search | Advisories, outlooks, official links |
| Citizen reports | `evidence.csv` now; Ripples backend via connector later | Triage and corroboration |
| Sentinel-2 satellite checks | Sample rows in `evidence.csv` now; backend summary fields later | Evidence for large projects |
| This document | Upload to the space | Grounding for every agent and flow |

## Workflows Quick runs

**1. Deadline escalation (Quick Automate).** Trigger: a project deadline passes and the status is not Completed, or a completed defense is flagged "Needs maintenance." Steps: pull the project record → check the latest evidence → draft a neutral follow-up letter and FOI request → **reviewer approves** → send to the responsible office → log it and start a 15-working-day reply clock → if no reply, record "No reply" on the scorecard → chain each status change into the record ledger.

**2. Advisory guidance (Quick Flows).** Input: a PAGASA or NDRRMC advisory and the city. Steps: classify type and level against the PAGASA thresholds in Appendix B → pull the city's open gaps and evacuation centers → write the four audience sections → **reviewer approves** → post to the City Page. The flow never says an area is safe and always links the official source.

**3. Typhoon event playbook (Quick Automate).** Trigger: a tropical cyclone wind signal is raised for any tracked city. Steps: run the advisory guidance flow for each affected city → list open gaps in the storm's path → draft interim-measure notices for barangay officials → flag the overdue defenses for follow-up → refresh the dashboard.

**4. Pre-season readiness report (Quick Research + Flows).** Trigger: four weeks before the typhoon season, or on demand. Steps: for each city, research the seasonal outlook and recent hazard history → combine with the city's open gaps and scorecard → write a two-page readiness report → **reviewer approves** → publish on the City Page and share with the DRRMO, Sanggunian members and local media.

**5. Citizen report triage (Quick Flows).** Input: a new report. Steps: check that the photo matches the project type and location → look for matching reports in the last 30 days → summarize → mark "unverified" or "corroborated" → send anything that looks coordinated or fake to a reviewer.

**6. Commitment extraction check (Quick Research).** Input: an LCCAP PDF. Steps: extract each commitment (what, where, budget, deadline, responsible office) with page references → compare against the records already published → list new, changed and missing items for the reviewer.

## What stays outside Quick

- **The real-risk calculation** runs in the app backend as fixed rules (Appendix B), so it is predictable and auditable. Quick reads its results; it does not change them.
- **Record ledger** runs in the backend. Every project record is fingerprinted (SHA-256) and hash-chained, so past records cannot be quietly edited. Record keeping only: no currency, wallets or payments.
- **Nothing is sent or published without human approval.** Quick drafts; a reviewer approves.

# Part D: Prompts for Amazon Quick

Use these in order. Each prompt is self-contained. The same prompts are in `quick-prompts.md` for copying.

## D0. Set up the space

1. In Quick, create a space named **Ripples: Climate Defense Map**.
2. Add knowledge → file uploads: `ripples-project-document.md` (or the `.docx`), `quick-prompts.md`, and all six CSVs from `data/`.
3. Add the mockup. Upload `ripples-climate-map.html` if Quick accepts HTML files. If it doesn't, Part B and the CSVs carry the same information. If the team shares the published mockup link publicly, it can also be added through a web crawler knowledge base.
4. Optional: add a web crawler knowledge base for the public PAGASA and NDRRMC sites.

## D1. Master kickoff prompt

```
You are the AI orchestration layer for Ripples, a climate adaptation app for the Philippines. Read "ripples-project-document" in this space first; it is the source of truth. The CSVs in this space (cities, projects, advisories, evidence, evacuation_centers, community_actions) are SAMPLE DATA from our mockup. Treat them as realistic test data and never present them as real LGU records.

Our goal: find gaps in each city's climate defenses before hazards hit, help Filipinos prepare for those gaps, and push the responsible offices to close them. The public app is organized by city on an explorable 3D map; each city has a City Page; each project has an evidence view. That front end is only a mockup for now: you build the internal system that reviewers, DRRMO staff and partners use.

Your four objectives:
1. Connect data sources: tell me which connectors and knowledge bases to set up (S3 or uploads for LCCAP PDFs, web crawler for PAGASA/NDRRMC, our CSVs now and our API later through OpenAPI or MCP, email/Slack/Teams action connectors).
2. Synthesize research: per-city risk briefs and pre-season readiness reports.
3. Turn ideas into actions: reusable flows for advisory guidance, follow-up letters and citizen report triage.
4. Automate workflows: deadline escalation and a typhoon event playbook, with human approval before anything is sent.

Rules you must follow in everything you create:
- Never say a place or person is "safe." Always defer to PAGASA and NDRRMC and link them.
- Use neutral language: overdue, disputed, needs maintenance. Never "corrupt," "negligent" or similar.
- Real-risk levels come from the fixed rules in Appendix B. Do not invent your own scoring.
- Every letter, advisory or report is a draft until a reviewer approves it.
- Never expose who submitted a citizen report.

Start by giving me a build plan: the list of dashboards, flows, automations, research reports and chat agents you will create for these objectives, with the inputs and outputs of each. Then build them one at a time, starting with the scorecard dashboard, and ask me to confirm before each automation is turned on.
```

## D2. Scorecard dashboard (Quick Sight)

```
Using cities.csv, projects.csv and evidence.csv in this space, build a dashboard called "Ripples Climate Scorecard". Label it "Sample data" in the title area.

Sheets and visuals:
1. National overview: KPI tiles for commitments tracked, open gaps (projects where gap is "Overdue" or "Needs maintenance"), and cities at High or Critical real-risk level. A map of cities using lat/lon, colored by real_risk_level (Low, Moderate, High, Critical in that order).
2. City scorecard table: city, real_risk_level, risk_score, promises_kept_pct, maintained_pct, open gaps, follow-ups sent and replied (sum from projects.csv). Sort by risk_score descending.
3. Gaps by agency: bar chart of open gaps by agency, split by gap type.
4. Follow-up accountability: follow-ups sent vs replied by responsible_office, with the number of offices that have not replied.
5. Project explorer: filterable table of projects with status, progress_pct, deadline, gap and interim_measure. Filters for city, status, type and agency.

Explain each visual in one sentence beneath it. Use neutral language.
```

## D3. City risk brief (Quick Research)

```
Write a pre-season readiness brief for [CITY NAME] using this space's documents and public web sources.

Include:
1. Hazard profile: the main climate hazards for this city (typhoon, flood, storm surge, heat, landslide, drought) with what recent seasons looked like. Cite sources.
2. Seasonal outlook for the next three months from PAGASA, if available. Cite it, and say plainly if you could not find a current outlook.
3. The city's climate commitments from projects.csv: what is on track, what is overdue, what needs maintenance. Mark these as sample data.
4. The open gaps that matter most for the coming season and the interim measures for each.
5. Three recommended actions for the city DRRMO and three for residents.

Rules: never call the city safe; defer to PAGASA and NDRRMC; neutral language only. Keep it to about two pages and cite every external fact.
```

## D4. Flows (Quick Flows)

**D4a. Advisory → four-audience guidance**

```
Create a flow named "Advisory guidance card".
Inputs: advisory text (pasted from PAGASA or NDRRMC), city_id.
Steps:
1. Identify the advisory type (Heat, Rain, Flood, Typhoon, Drought, Thunderstorm, Coastal) and level, using the PAGASA thresholds in Appendix B of ripples-project-document.
2. Look up the city's open gaps in projects.csv (gap = Overdue or Needs maintenance) and its evacuation centers in evacuation_centers.csv.
3. Write four short sections, two to three sentences each: For households (what to prepare and when to go to which evacuation center), For schools (suggested schedule changes, deferring to DepEd and LGU announcements), For farmers (crops, drainage, irrigation, fisherfolk), For barangay officials (which open gaps matter now and the interim measure for each).
4. Add the official source and time. End with: "Follow official warnings and evacuation orders from PAGASA and NDRRMC."
Output: a card in the same structure as advisories.csv, marked DRAFT for reviewer approval.
Never say an area is safe.
```

**D4b. Follow-up letter**

```
Create a flow named "Follow-up letter".
Input: project_id.
Steps:
1. Read the project row from projects.csv and its city from cities.csv.
2. Draft a formal, neutral letter to the responsible_office. State the LCCAP commitment, budget, deadline, current status, progress and gap. Request (1) current progress and revised completion date, (2) interim measures for affected barangays this season, (3) a copy of the latest progress report under Executive Order No. 2, s. 2016 (Freedom of Information) or the applicable local FOI ordinance.
3. Say the reply will be posted in full on the City Page and that "No reply" will be recorded after 15 working days.
4. If an active typhoon or rainfall advisory affects the city, add one sentence explaining why the defense matters this week.
Output: the letter marked DRAFT, plus a one-line log entry (date, project_id, office, "drafted").
Never use words that accuse anyone of wrongdoing.
```

**D4c. Citizen report triage**

```
Create a flow named "Citizen report triage".
Inputs: project_id, report text, report type (status update, dispute, maintenance problem), photo description.
Steps:
1. Check that the report matches the project type and location in projects.csv.
2. Count matching reports for the same project in evidence.csv from the last 30 days.
3. If at least two other reports or a satellite check agree, mark "corroborated"; otherwise "unverified".
4. Flag possible coordinated or fake reports (identical wording, many reports in minutes, mismatched project type) for a reviewer.
5. Write a one-sentence evidence entry in the evidence.csv format.
Never include the reporter's identity in any output.
```

## D5. Automations (Quick Automate)

**D5a. Deadline escalation**

```
Create an automation named "Deadline escalation".
Trigger: daily check. Select projects where (status is not Completed and deadline is before today) or (maintenance is "Needs maintenance"), and no follow-up was sent in the last 30 days.
For each project:
1. Run the "Follow-up letter" flow.
2. Send the draft to the reviewer for approval (email or Slack). Wait for approval.
3. On approval, send it to the responsible office's official contact and log it.
4. Start a 15-working-day reply clock. If a reply arrives, attach it to the project and post it to the City Page. If not, record "No reply" for the scorecard.
5. If the Ripples backend action "anchor_record" is connected, call it for each status change. If it is not connected yet, log the status change and skip this step.
Send me a weekly summary: letters sent, replies received, silences recorded, by city and agency.
Do not send anything without reviewer approval.
```

**D5b. Typhoon event playbook**

```
Create an automation named "Typhoon event playbook".
Trigger: a tropical cyclone wind signal is raised for any city in cities.csv (from the PAGASA source or entered manually by the team).
Steps:
1. For each affected city, run "Advisory guidance card" with the signal advisory.
2. List the city's open gaps and draft an interim-measure notice for barangay officials.
3. For overdue flood, drainage, dike, pump or seawall projects in affected cities, queue the "Deadline escalation" steps with a note that the advisory is active.
4. Refresh the "Ripples Climate Scorecard" dashboard.
5. Send the team a status message: cities affected, real-risk levels, open gaps in the path, drafts waiting for approval.
All outputs are drafts until a reviewer approves them.
```

**D5c. Pre-season readiness report**

```
Create an automation named "Pre-season readiness".
Trigger: on demand, and every year four weeks before the typhoon season.
For each city in cities.csv: run the City risk brief research prompt, attach the city's scorecard from the dashboard, and produce a readiness report. Send each report to the reviewer. After approval, share it with the city DRRMO, Sanggunian contacts and local media contacts the team provides, and post it on the City Page.
```

## D6. Chat agent

```
Create a custom chat agent named "Ripples City Assistant", grounded only in this space and in the PAGASA and NDRRMC web sources.
It answers questions from the team, partner NGOs and DRRMO staff, such as: "Which open gaps raise Malabon's risk this season?", "Which offices have not replied to follow-ups?", "Draft the household section for an orange rainfall warning in Legazpi."
Rules: cite the file or source for each answer; say when data is sample data; never say a place is safe; neutral language; for live warnings, link PAGASA and NDRRMC instead of answering from memory.
```

## D7. Reviewer app (Apps in Amazon Quick)

```
Build an internal app named "Ripples Reviewer" for our data reviewers.
Screens:
1. Commitments queue: AI-extracted LCCAP commitments with source page, editable fields (what, where, budget, deadline, responsible office) and Approve / Reject buttons.
2. Drafts queue: follow-up letters, advisory guidance cards and readiness reports waiting for approval, with the source record beside each.
3. Reports queue: citizen reports with triage result, matching reports and a corroborate / reject control. Never show reporter identity.
Use projects.csv, advisories.csv and evidence.csv as sample data. Match the look of the mockup in this space: dark navy background, risk colors green, yellow, orange and red, condensed display headings.
```

# Appendix A: Data dictionary (sample CSVs)

All files use one row per record and include `sample_data = yes`. Dates are `YYYY-MM`. The mockup is frozen at **October 2026**.

**cities.csv:** `city_id`, `city`, `province`, `island_group`, `lat`, `lon`, `hazards`, `lccap`, `pilot_city`, `hazard_points`, `gap_points`, `risk_score`, `real_risk_level`, `commitments_due`, `kept_on_time`, `promises_kept_pct`, `completed_defenses`, `maintained_ok`, `maintained_pct`, `as_of`

**projects.csv:** `project_id`, `city_id`, `city`, `project`, `type` (Dike, Drainage, Mangrove, Seawall, Pump, Evac, Greening, Warning), `agency`, `responsible_office`, `budget_php_millions`, `status` (Not started, In progress, Completed, Delayed), `progress_pct`, `start`, `deadline`, `completed`, `maintenance` (OK, Needs maintenance, blank), `gap` (Overdue, Needs maintenance, blank), `interim_measure`, `lccap_source`, `followups_sent`, `followups_replied`, `latest_reply`, `summary`, `approx_lat`, `approx_lon`

**advisories.csv:** `advisory_id`, `city_id`, `type`, `level`, `hazard_points`, `issued`, `title`, `source`, `for_households`, `for_schools`, `for_farmers`, `for_barangay_officials`

**evidence.csv:** `evidence_id`, `project_id`, `city_id`, `date`, `source` (Citizen photo report, Satellite check, LGU update, Community monitoring), `observation`, `corroborated`

**evacuation_centers.csv:** `center_id`, `city_id`, `name`, `capacity_persons`, `approx_lat`, `approx_lon`

**community_actions.csv:** `action_id`, `city_id`, `kind` (Clean-up, Monitoring, Sponsor need), `action`, `when`

# Appendix B: Real-risk rules

The real-risk level is a fixed rule, not a model.

**Hazard points (0–3):** the highest-scoring active advisory for the city.

| Advisory | 0 | 1 | 2 | 3 |
|---|---|---|---|---|
| Heat index (PAGASA) | Caution 27–32°C | Extreme Caution 33–41°C | Danger 42–51°C | Extreme Danger ≥52°C |
| Rainfall warning (PAGASA) | none | Yellow | Orange | Red |
| Flood | none | Watch | Advisory | Warning |
| Tropical cyclone wind signal | none | Signal 1 | Signal 2 | Signal 3–5 |
| Drought | none | Dry condition or dry spell | Drought | |
| Other (thunderstorm advisory, gale warning, high tide) | | 1 | | |

**Gap points (0–3):** one point per open gap, capped at 3. A project is an open gap when it is Delayed, Not started after its deadline, or Completed but flagged "Needs maintenance."

**Score = hazard points + gap points (0–6).**

| Score | Real-risk level |
|---|---|
| 0–1 | Low |
| 2–3 | Moderate |
| 4 | High |
| 5–6 | Critical |

**Scorecard:** promises kept on time = commitments completed by their deadline ÷ commitments whose deadline has passed. Defenses maintained = completed defenses with maintenance "OK" ÷ all completed defenses. Follow-ups answered = replies ÷ letters sent.

# Appendix C: The mockup

`ripples-climate-map.html` is a single file. Open it in Chrome, Edge or Safari with an internet connection (it loads the 3D library and fonts from public CDNs). It runs entirely in the browser; photo reports are saved only in that browser.

**What it shows:** 8 sample cities (Dagupan, Malabon, Marikina, Legazpi, Tacloban, Iloilo, Cagayan de Oro, Davao) with 32 commitments, 10 advisories, 24 evacuation centers and 48 evidence items. Malabon is the sample pilot city.

**Two-minute demo script:**

1. Hover a few pins, then click **Malabon City** (pilot). Point out the High risk level and its breakdown: hazard +2, gaps +2.
2. Click **Tullahan River wall repair**. Show the overdue status, the open-section schematic, the evidence log and the unanswered follow-up.
3. Press **BACK**, then **Run typhoon demo**. Malabon goes Critical; the new Signal 3 advisory opens with four audience sections.
4. Click **Review letter** in the notice, then **Mark as sent**. The scorecard's follow-up count updates.
5. Press **NEXT** to fly to Marikina, then **MAP** to zoom out and show the typhoon crossing the country.

# Appendix D: Q&A prep

**"Without SMS, how do you reach people who don't check the City Page?"** Barangay officials share the page's advisories through their existing channels (group chats, barangay pages, public address), and residents can add the City Page to their phone's home screen. The advisory card is written so it can be forwarded as-is.

**"Isn't the risk level a judgment call?"** No. It is a fixed rule based on PAGASA categories and the count of open gaps (Appendix B), and every City Page shows the breakdown.

**"What if an LGU says your data is wrong?"** Every office has a right of reply that is posted in full, every status change is timestamped, and citizen reports stay "unverified" until corroborated.

**"What did you actually build, and what is a mockup?"** We built the internal system in Amazon Quick: the dashboard, research briefs, flows, automations, chat agent and reviewer app, all running on sample data. The 3D map is a mockup of the public experience. Live feeds, satellite checks, and citizen uploads are future work; the record ledger runs in the web app (Part A, "What we're building now, and what comes later").

**"What does Amazon Quick actually do?"** It is the orchestration layer: it connects the documents and data, writes the research briefs, runs the letter and advisory flows, and automates the escalation and typhoon workflows, with a person approving every output (Part C).
