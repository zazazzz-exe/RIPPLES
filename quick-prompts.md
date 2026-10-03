# Ripples: prompts for Amazon Quick

Paste these into Amazon Quick in order. They assume the space described in D0 holds `ripples-project-document`, the six CSVs from `data/`, and (if Quick accepts it) the mockup `ripples-climate-map.html`. Replace anything in [BRACKETS]. All CSV data is sample data from the mockup.

## D0. Set up the space

1. In Quick, create a space named **Ripples: Climate Defense Map**.
2. Add knowledge → file uploads: `ripples-project-document.md` (or the `.docx`), `quick-prompts.md`, and all six CSVs from `data/`.
3. Add the mockup. Upload `ripples-climate-map.html` if Quick accepts HTML files. If it doesn't, Part B of the project document and the CSVs carry the same information. If the team shares the published mockup link publicly, it can also be added through a web crawler knowledge base.
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
