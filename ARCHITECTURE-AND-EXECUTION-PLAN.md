---
title: "Ripples: Climate Defense Map — Architecture & Execution Plan"
subtitle: "How we build it on Amazon Quick · v1 · October 2026"
status: "Team working plan — pairs with ripples-project-document.md and quick-prompts.md"
---

# 0. Purpose of this document

This is the **build plan**: how the team turns the Ripples concept (see `ripples-project-document.md`) into a working system on Amazon Quick, in what order, who does what, and how we know each piece works. It does not re-explain the concept — it tells us how to execute it.

Read it alongside:

| File | Role |
|---|---|
| `ripples-project-document.md` | Source of truth: concept, experience, Quick layer, rules, appendices |
| `quick-prompts.md` | Paste-ready prompts (D0–D7) that create each component |
| `ARCHITECTURE-AND-EXECUTION-PLAN.md` | **This file:** the architecture + the step-by-step build order |

**Three principles that govern every decision below:**

1. **Rule-based where it matters, AI where it helps.** Risk levels and advisory levels come from fixed rules (Appendix B of the project doc). AI only does language work — extracting, triaging, drafting. Every result is explainable.
2. **A person approves every output.** Nothing is sent or published automatically. Quick drafts; a reviewer approves.
3. **One space grounds everything.** A single Quick space holds the doc, the CSVs, and later the LCCAP files, so every flow, research report and automation reads the same records.

---

# 1. System architecture

## 1.1 Layered view

```
┌──────────────────────────────────────────────────────────────────┐
│  PRESENTATION (mockup only this version)                           │
│  ripples-climate-map.html — 3D national map → City Page → Evidence │
│  Not connected to Quick yet. Shows the same sample data.           │
└──────────────────────────────────────────────────────────────────┘
                               ▲  (future: OpenAPI/MCP connector)
                               │
┌──────────────────────────────────────────────────────────────────┐
│  ORCHESTRATION — AMAZON QUICK (what we build now)                  │
│                                                                    │
│  ┌─ Chat agent ─────────┐   ┌─ Reviewer app ─────────────────┐    │
│  │ Ripples City         │   │ Commitments / Drafts / Reports │    │
│  │ Assistant (D6)       │   │ queues (D7)                    │    │
│  └──────────┬───────────┘   └───────────────┬────────────────┘    │
│             │                                │ approve / reject    │
│  ┌─ Automations (Quick Automate, D5) ────────┴───────────────┐    │
│  │ Deadline escalation · Typhoon playbook · Pre-season       │    │
│  └──────────┬────────────────────────────────────────────────┘    │
│             │ call                                                 │
│  ┌─ Flows (Quick Flows, D4) ─────────────────────────────────┐    │
│  │ Advisory guidance card · Follow-up letter · Report triage │    │
│  └──────────┬────────────────────────────────────────────────┘    │
│             │                                                      │
│  ┌─ Research (Quick Research, D3) ─┐  ┌─ Analytics (Sight, D2) ─┐  │
│  │ City risk brief · commitment    │  │ Ripples Climate         │  │
│  │ extraction check                │  │ Scorecard dashboard     │  │
│  └─────────────────────────────────┘  └─────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                               ▲
                               │  grounds everything
┌──────────────────────────────────────────────────────────────────┐
│  DATA & KNOWLEDGE (Quick space "Ripples: Climate Defense Map", D0) │
│  Project doc · prompts · 6 CSVs · (later) LCCAP PDFs ·             │
│  web-crawler KB for PAGASA/NDRRMC                                  │
└──────────────────────────────────────────────────────────────────┘
                               ▲
                               │  fixed rules, outside Quick
┌──────────────────────────────────────────────────────────────────┐
│  RULES ENGINE (Appendix B) — real-risk & advisory levels          │
│  Precomputed into cities.csv now; app backend later.              │
│  Quick READS results; it never changes them.                      │
└──────────────────────────────────────────────────────────────────┘
```

## 1.2 Component responsibilities

| # | Component | Quick feature | Reads | Produces | Approval gate |
|---|---|---|---|---|---|
| D0 | Space & knowledge | Spaces, Index, KB | — | Grounded knowledge base | — |
| D2 | Scorecard dashboard | Quick Sight | cities, projects, evidence | Dashboard (5 sheets) | — (read-only) |
| D3 | City risk brief | Quick Research | space docs + web | 2-page brief | Reviewer before share |
| D4a | Advisory guidance card | Quick Flows | advisories, projects, evac centers | 4-audience card (DRAFT) | Reviewer |
| D4b | Follow-up letter | Quick Flows | projects, cities | Formal letter (DRAFT) | Reviewer |
| D4c | Citizen report triage | Quick Flows | projects, evidence | Evidence entry + flag | Reviewer on suspicious |
| D5a | Deadline escalation | Quick Automate | projects | Letters, reply clock, log | Reviewer per letter |
| D5b | Typhoon event playbook | Quick Automate | cities, projects, advisories | Cards + notices + status msg | Reviewer per output |
| D5c | Pre-season readiness | Quick Automate + Research | cities + dashboard | Readiness reports | Reviewer before share |
| D6 | Ripples City Assistant | Chat agent | whole space + web | Cited answers | — (read/draft only) |
| D7 | Ripples Reviewer app | Apps in Quick | projects, advisories, evidence | Approve/reject actions | Is the gate |

## 1.3 Data model (grounding the build)

The six sample CSVs in `data/` are the system's spine. Verified row counts and keys:

| File | Rows | Primary key | Links to |
|---|---|---|---|
| `cities.csv` | 8 | `city_id` | — |
| `projects.csv` | 32 | `project_id` | `city_id` → cities |
| `advisories.csv` | 10 | `advisory_id` | `city_id` → cities |
| `evidence.csv` | 48 | `evidence_id` | `project_id`, `city_id` |
| `evacuation_centers.csv` | 24 | `center_id` | `city_id` → cities |
| `community_actions.csv` | 19 | `action_id` | `city_id` → cities |

- 8 cities: Dagupan, Malabon, Marikina, Legazpi, Tacloban, Iloilo, Cagayan de Oro, Davao. **Malabon = pilot.**
- Every row carries `sample_data = yes`. Every Quick component must label output as sample data.
- `real_risk_level`, `risk_score`, `hazard_points`, `gap_points` are **precomputed** in `cities.csv` by the Appendix B rules. Quick reads them, never recomputes.
- An **open gap** = project with `gap` in {`Overdue`, `Needs maintenance`}. This single definition drives the dashboard KPIs, the escalation trigger, and the advisory "barangay officials" section.

---

# 2. Execution plan — phased build order

The guiding rule: **build bottom-up and prove each layer before adding the one above it.** Data → analytics → research → flows → automations → agent/app. Automations come late because they chain the flows beneath them; turn each on only after the human-approval gate (the Reviewer app) exists.

## Phase 0 — Foundation (space & data)  · prompt D0
**Goal:** one grounded space everything else reads.
- [ ] Create space **Ripples: Climate Defense Map**.
- [ ] Upload `ripples-project-document.md` (or `.docx`), `quick-prompts.md`, all 6 CSVs.
- [ ] Try uploading `ripples-climate-map.html`; if rejected, note that Part B + CSVs carry the same info.
- [ ] (Optional) Add web-crawler KB for PAGASA + NDRRMC public pages.
- [ ] Run the **D1 master kickoff** prompt so Quick restates the build plan back to us.

**Exit test:** ask the Assistant-to-be "How many open gaps does Malabon have and why?" — it should answer from the CSVs and label the data as sample.

## Phase 1 — Analytics  · prompt D2
**Goal:** the Scorecard dashboard, our demo centerpiece and the thing automations refresh.
- [ ] Build **Ripples Climate Scorecard** (5 sheets: national overview, city scorecard table, gaps by agency, follow-up accountability, project explorer).
- [ ] Verify KPIs by hand against the CSVs (open-gap count, cities at High/Critical).

**Exit test:** dashboard open-gap total matches a manual count of `projects.csv` rows where `gap` ∈ {Overdue, Needs maintenance}; map colors match `real_risk_level`.

## Phase 2 — Research  · prompt D3
**Goal:** per-city risk brief, reused later by the pre-season automation.
- [ ] Generate the **City risk brief** for **Malabon** (pilot) first.
- [ ] Confirm it cites external facts, flags CSV data as sample, and never calls the city "safe."

**Exit test:** brief has all 5 required sections and at least one cited PAGASA/NDRRMC source (or an explicit "no current outlook found").

## Phase 3 — Flows  · prompt D4 (a, b, c)
**Goal:** the three reusable building blocks the automations call. Build and test each **standalone** before any automation wires them together.
- [ ] **D4a Advisory guidance card** — test with a sample Malabon advisory.
- [ ] **D4b Follow-up letter** — test with Malabon's overdue river wall (`project_id` from `projects.csv`).
- [ ] **D4c Citizen report triage** — test with a corroborated and an uncorroborated case.

**Exit test for each:** output matches the target CSV structure, is marked **DRAFT**, uses neutral language, never says "safe," never exposes a reporter.

## Phase 4 — The approval gate  · prompt D7
**Goal:** stand up the **Ripples Reviewer** app *before* automations, so there is somewhere for drafts to land.
- [ ] Build the 3 queues: Commitments, Drafts, Reports.
- [ ] Confirm Approve/Reject works and the Reports queue never shows reporter identity.
- [ ] Match the mockup look (dark navy; green/yellow/orange/red risk colors).

**Exit test:** a draft letter from Phase 3 appears in the Drafts queue and can be approved.

## Phase 5 — Automations  · prompt D5 (a, b, c)  ⚠ human-approval required
**Goal:** chain the flows on triggers. **Confirm with the team before enabling each**, per the D1 rule. For the demo, keep sends pointed at **test addresses**.
- [ ] **D5a Deadline escalation** — daily check → draft letter → Reviewer → send → 15-working-day clock.
- [ ] **D5b Typhoon event playbook** — signal entered manually → advisory cards + interim notices + queue escalations + refresh dashboard + team status.
- [ ] **D5c Pre-season readiness** — on-demand now; schedule "4 weeks before season" later.

**Exit test:** each automation stops at the Reviewer gate and sends nothing until approved; D5b run on a sample Signal 3 pushes Malabon to Critical and generates a 4-audience card.

## Phase 6 — Conversational layer  · prompt D6
**Goal:** the **Ripples City Assistant** chat agent for team/partner Q&A.
- [ ] Create the agent grounded only in the space + PAGASA/NDRRMC web sources.
- [ ] Test the three canonical questions (open gaps raising Malabon's risk; offices with no reply; draft a household section).

**Exit test:** every answer cites a file/source, flags sample data, links PAGASA/NDRRMC for live warnings, never says "safe."

---

# 3. Dependency map (what blocks what)

```
D0 space ──┬─> D2 dashboard ───────────────┐
           ├─> D3 research ───────┐         │
           ├─> D4a card ─┐        │         │
           ├─> D4b letter┤        │         │
           └─> D4c triage┘        │         │
                   │              │         │
                   ▼              ▼         ▼
            D7 Reviewer app   (D3 feeds)  (D2 refreshed by)
                   │              │         │
                   ▼              ▼         ▼
            D5a escalation   D5c pre-season  D5b typhoon playbook
                   │              │         │   (calls D4a + D5a)
                   └──────────────┴─────────┘
                             │
                             ▼
                      D6 chat agent (reads all of the above)
```

**Critical path:** D0 → D4 flows → D7 Reviewer → D5 automations. Everything that *sends* depends on the Reviewer app existing first. Build D7 before D5.

---

# 4. The seven safeguards, mapped to where they live in the build

Every safeguard from the project doc is enforced at a specific point — not left to good intentions:

| Safeguard | Enforced in | How |
|---|---|---|
| Never says "safe" | D4a, D6 prompts | Hard rule in prompt; Reviewer rejects violations |
| Human approval | D7 app + D5 gates | Drafts can't send without an approve action |
| Neutral language | All D3/D4/D5 prompts | "overdue/disputed/needs maintenance" only |
| Fraud protection | D4c triage | "unverified" until 2 reports or satellite agree |
| Protects reporters | D4c + D7 | Identity never written to output or shown in queue |
| No money handled | Scope | Sponsors give directly to NGOs/LGUs; no payment path |
| Sample data labeled | D0–D7 | `sample_data=yes` surfaced in every output |

---

# 5. Roles & ownership (fill in names)

| Area | Owner | Backup |
|---|---|---|
| Space & data (D0) | | |
| Dashboard (D2) | | |
| Research briefs (D3) | | |
| Flows (D4) | | |
| Automations (D5) | | |
| Chat agent (D6) | | |
| Reviewer app (D7) | | |
| Mockup / demo narration | | |

---

# 6. MVP demo runsheet (what we show, in order)

Mirrors the project doc's demo flow; use this as the live script.

1. **Scorecard** (Quick Sight) — open gaps by city & agency; offices with no reply.
2. **Ask the Assistant** — "Which open gaps raise Malabon's risk this season?" → cited, sample-labeled answer.
3. **Enter a sample Signal 3** → Typhoon playbook runs the 4-audience advisory card for affected cities.
4. **Deadline escalation** drafts the letter for Malabon's overdue river wall → **approve in the Reviewer app** → reply clock starts → dashboard updates.
5. **Pre-season readiness report** from Quick Research.
6. **Close on the mockup** — same data on the 3D map + City Page + typhoon demo: "This is where it goes next."

---

# 7. Risks & open questions to resolve with organizers

| Item | Why it matters | Action |
|---|---|---|
| Which Quick features the hackathon env includes | Automate/Flows/Apps availability shapes scope | Confirm with organizers (Part C note) |
| HTML upload to a space | Decides whether the mockup lives in the space | Test in D0; fall back to Part B + CSVs |
| Send targets for D5a/D5b | Must not email real offices with sample data | Point all sends at **test addresses** for the demo |
| Build tool for the public app (e.g. Kiro) | Future, post-hackathon | Defer; mockup stands in for now |
| Live PAGASA/NDRRMC feeds, satellite, Stellar | All marked future work | Out of scope this version; keep in roadmap |

---

# 8. Definition of done (this version)

- [ ] Space set up and grounded (D0), master prompt run.
- [ ] Scorecard dashboard matches hand-checked CSV numbers (D2).
- [ ] Malabon city risk brief produced and reviewed (D3).
- [ ] All three flows produce correct DRAFT outputs (D4a/b/c).
- [ ] Reviewer app approves/rejects and hides reporter identity (D7).
- [ ] Three automations stop at the approval gate; typhoon playbook pushes Malabon to Critical on a sample Signal 3 (D5a/b/c).
- [ ] Chat agent answers the 3 canonical questions with citations and safeguards (D6).
- [ ] Full demo runsheet (Section 6) rehearsed end to end.

> **Everything in this build runs on the sample CSVs. Nothing here represents the real status of any LGU, DPWH, DENR, MMDA or PAGASA record.**
