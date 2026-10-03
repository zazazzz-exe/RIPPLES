---
inclusion: always
---

# Project Structure — Ripples

## Repository layout
```
tanaw-quick-pack/
├── .kiro/
│   ├── steering/                      # persistent project knowledge (always loaded)
│   │   ├── product.md                 # product purpose, users, non-negotiable rules
│   │   ├── tech.md                    # Quick + Kiro stack, data model, constraints
│   │   ├── structure.md               # this file — layout & conventions
│   │   └── safeguards.md              # the 7 safeguards as enforceable checks (auto-included)
│   └── specs/
│       ├── ripples-web-app/           # the runnable web app spec
│       └── ripples-quick-system/      # the main feature spec
│           ├── requirements.md        # user stories + acceptance criteria (EARS)
│           ├── design.md              # architecture, data flow, Appendix B rules
│           └── tasks.md               # discrete tasks, dependency-tagged for parallel waves
├── app/                               # Ripples web app (Node + plain HTML), see docs/ARCHITECTURE.md
│   ├── server.js  src/{data,domain,services,api}  public/  test/
├── docs/ARCHITECTURE.md               # web app architecture
├── data/                              # six sample CSVs (source of record for the build)
│   ├── cities.csv  projects.csv  advisories.csv
│   ├── evidence.csv  evacuation_centers.csv  community_actions.csv
├── ripples-project-document.md/.docx  # concept source of truth (Parts A–D)
├── quick-prompts.md                   # paste-ready prompts (D0–D7) for Amazon Quick
├── ripples-climate-map.html           # 3D map mockup (front end, not connected)
├── ripples-architecture-diagram.html  # architecture diagram for the pitch
└── ARCHITECTURE-AND-EXECUTION-PLAN.md  # phased build plan
```

## Component naming (keep consistent across spec, prompts and app)
Each Quick component maps to a prompt ID in `quick-prompts.md`. Always refer to a component by both its name and its D-ID so tasks, prompts and the design stay traceable.

| D-ID | Component (exact name) | Quick feature |
|---|---|---|
| D0 | Space: **Ripples: Climate Defense Map** | Spaces / knowledge |
| D1 | Master kickoff prompt | — |
| D2 | **Ripples Climate Scorecard** | Quick Sight |
| D3 | **City risk brief** | Quick Research |
| D4a | **Advisory guidance card** | Quick Flows |
| D4b | **Follow-up letter** | Quick Flows |
| D4c | **Citizen report triage** | Quick Flows |
| D5a | **Deadline escalation** | Quick Automate |
| D5b | **Typhoon event playbook** | Quick Automate |
| D5c | **Pre-season readiness** | Quick Automate |
| D6 | **Ripples City Assistant** | Chat agent |
| D7 | **Ripples Reviewer** | Apps in Quick |

## Conventions
- **IDs:** entity IDs are lowercase slugs (`dagupan`, `dag-dike`, `dagupan-a1`). Keep this scheme for any new sample rows.
- **Sample-data flag:** every data row carries `sample_data = yes`; every generated output states it is sample data.
- **Draft marking:** every letter, advisory card and report is emitted with a visible **DRAFT** marker until approved.
- **Pilot city:** Malabon City. Build and test each component against Malabon first, then generalize.
- **Traceability:** every task in `tasks.md` references the requirement(s) it satisfies and the prompt ID (D-x) it implements.

## Where generated artifacts go
- Quick-built components live inside the Quick space (not in this repo).
- Repo artifacts (diagrams, plans, exported reports) live at the repo root or a clearly named subfolder.
- Do not edit the immutable versioned copies produced when a file is opened; always edit the main file at its repo path.

## Build order (critical path)
`D0 space → D4 flows → D7 Reviewer app → D5 automations`, with D2/D3/D6 alongside. Anything that **sends** depends on the Reviewer app existing first — never enable a D5 automation before D7 is in place.
