# Pre-season readiness — Build Specification (D5c)

**Component:** Pre-season readiness · **D-ID:** D5c · **Quick feature:** Quick Automate
**Spec:** `.kiro/specs/ripples-quick-system/` · **Implements:** R9 (1–2), CC-1, CC-2, CC-7 · **Prompt:** `quick-prompts.md` → D5c
**Depends on:** Task 3 (D3 City risk brief), Task 2 (D2 Climate Scorecard), Task 5 (D7 Ripples Reviewer)
**Pilot city:** Malabon City (build and verify here first, then generalize)
**Status:** Build artifact — the concrete, hand-checkable configuration for the automation that lives inside the Quick space. The automation itself runs in Quick Automate; this file is the repo-side contract and the source for the worked Malabon run in this folder.

> **⚠ Sample data.** Every figure a readiness report carries comes from the Ripples sample CSVs
> in `data/` (`sample_data = yes`) and the D3 brief / D2 scorecard built from them. Reports use
> real city, office and agency names only to show how the system works. They do **not** describe
> the actual status of any LGU, DPWH, DENR, MMDA or PAGASA record. For live, authoritative
> warnings and evacuation orders, always follow **PAGASA** and **NDRRMC** (S1/CC-1).

---

## 1. Purpose and scope

This artifact fully defines the **Pre-season readiness** automation so it can be built in Quick
Automate and hand-verified. For every city in `data/cities.csv` it assembles a single, reviewer-ready
**readiness report** by combining two artifacts that already exist in the system:

1. the city's **D3 City risk brief** (Quick Research — `artifacts/city-risk-briefs/`), and
2. the city's **scorecard slice** from the **D2 Ripples Climate Scorecard** (Quick Sight —
   `quick-build/D2-ripples-climate-scorecard.md`).

The report is emitted as **DRAFT** and routed to the **D7 Ripples Reviewer**. Nothing is shared or
posted until a reviewer moves the item to `review_state = APPROVED` in the Reviewer app. Only then
does the automation share the approved report with the city DRRMO, the Sanggunian and the media
contacts the team provides, and post it on the City Page.

The automation does **no scoring and no risk/advisory estimation of its own**. It reads the
precomputed `real_risk_level` / `risk_score` from `cities.csv` (via the D3 brief and D2 scorecard)
and quotes them unchanged (CC-4). Its only "intelligence" is language assembly — combining two
grounded, already-approved-pattern artifacts into one briefing.

---

## 2. Trigger

| Trigger | When | Scope |
|---|---|---|
| **On demand** | A reviewer runs the automation manually (e.g. for a single city, or all cities). | One city or all 8 cities in `cities.csv`. |
| **Scheduled** | **Every year, four weeks before the start of the typhoon season.** | All 8 cities in `cities.csv`. |

The Philippine typhoon season runs mainly July–October (see the Malabon brief's cited PAGASA
climatology). "Four weeks before the season" is a fixed calendar lead the automation owner sets on
the schedule; the automation does not infer or forecast the season date itself — if a live PAGASA
seasonal signal is wanted later, it is read from the knowledge base, never estimated here.

Both triggers run the **same** per-city flow in §3. The only difference is the city set and who
initiated the run. **Neither trigger ever shares or posts anything** — both stop at the Reviewer
gate (S2/CC-2).

---

## 3. Per-city flow (the pipeline)

For each `city_id` in scope, the automation runs these steps in order. Steps 1–4 always run and end
at the gate; steps 5–6 run **only** after a human approval.

```
┌─ for each city in cities.csv ───────────────────────────────────────────────┐
│                                                                              │
│  STEP 1  Run D3 City risk brief (Quick Research)                             │
│          → cited, 5-section brief for the city (reads cities/projects/       │
│            evidence/evacuation_centers + PAGASA/NDRRMC web). Fixed-rule       │
│            risk quoted, not recomputed (CC-4). Defers to PAGASA/NDRRMC (S1).  │
│                                                                              │
│  STEP 2  Attach the city's D2 scorecard slice (Quick Sight)                  │
│          → the city's row from the Scorecard: real_risk_level, risk_score,   │
│            promises_kept_pct, maintained_pct, open-gap count, follow-ups     │
│            sent/replied. Read-only; colors from the fixed §3.2 D2 palette.   │
│                                                                              │
│  STEP 3  Produce the readiness report (assemble 1 + 2)                       │
│          → one document per the template in `report-template.md`, marked     │
│            DRAFT and "sample data", neutral language only (S3, S7/CC-7).     │
│                                                                              │
│  STEP 4  Route to the Ripples Reviewer (D7) as DRAFT                         │
│          → create a Drafts-queue item: kind = readiness_report,              │
│            review_state = DRAFT, source_ref = city_id. STOP here.            │
│          ════════════ HUMAN APPROVAL GATE (S2/CC-2) ════════════            │
│                                                                              │
│   … automation blocks on this item until a reviewer decides …               │
│                                                                              │
│  STEP 5  IF review_state = APPROVED  →  share                                │
│          → send the approved report to the city DRRMO, the Sanggunian and    │
│            the provided media contacts — all TEST addresses in the demo.     │
│                                                                              │
│  STEP 6  … and post it on the City Page (mockup target in this version).     │
│                                                                              │
│          IF review_state = REJECTED  →  do nothing; log the rejection;       │
│            the item is returned for re-drafting (a new DRAFT).               │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Step contract detail

| Step | Reads | Writes / emits | Safeguard in force |
|---|---|---|---|
| 1 — D3 brief | `cities.csv`, `projects.csv`, `evidence.csv`, `evacuation_centers.csv`, PAGASA/NDRRMC web | the city brief (5 sections, cited) | S1/CC-1 (defer+link, never "safe"), S3, CC-4 |
| 2 — scorecard | the D2 analysis (`cities.csv` row + project aggregates) | the city scorecard slice | CC-4 (read-only), S7/CC-7 |
| 3 — assemble | steps 1 & 2 | the readiness report, marked **DRAFT** + sample data | S3, S7/CC-7 |
| 4 — route | the report | a D7 Drafts-queue item, `review_state = DRAFT` | **S2/CC-2** (gate) |
| 5 — share | the item's `review_state` | sends to DRRMO/Sanggunian/media **test** contacts | S2/CC-2 (only if APPROVED) |
| 6 — post | the item's `review_state` | posts to the City Page | S2/CC-2 (only if APPROVED) |

The gate between step 4 and step 5 is the serialization point: **the automation cannot proceed to
share or post on its own.** It reads the `review_state` that the D7 app sets (see
`quick-build/D7-ripples-reviewer/app-spec.md` §3). `DRAFT` and `REJECTED` both mean "do nothing".

---

## 4. Reviewer gating — the exact contract (S2/CC-2)

This automation is a Wave-4 automation and therefore depends on Task 5 (D7) being in place first —
per the build order `D0 → D4 flows → D7 Reviewer → D5 automations`. The gate is not advisory; it is
the only path from a DRAFT report to a share/post.

```
review_state ∈ { DRAFT, APPROVED, REJECTED }        ← set by D7, read by D5c
```

| `review_state` | Set by | What D5c does |
|---|---|---|
| `DRAFT` | D5c at step 4 (creation) | **Nothing shared or posted.** Report waits in the Drafts queue. |
| `APPROVED` | a reviewer, in the D7 app | Share to test DRRMO/Sanggunian/media contacts **and** post to City Page. |
| `REJECTED` | a reviewer, in the D7 app | **Nothing shared or posted.** Log the rejection; return for re-draft. |

The D7 Drafts queue already lists `readiness_report` as a supported `kind` (see D7 app-spec §2
Screen 2 and §3 "How each automation reads the state → D5c"), so the queue item D5c creates lands in
an existing, built screen.

**Queue item D5c creates (matches the D7 item record):**

```
item_id        draft-<city_id>-readiness          e.g. draft-malabon-readiness
queue          drafts
kind           readiness_report
source_ref     <city_id>                           e.g. malabon
title          "Pre-season readiness — <City>"     e.g. "Pre-season readiness — Malabon City"
review_state   DRAFT                                ← the default; D5c never sets APPROVED
decided_by     (empty until a reviewer decides)
decided_at     (empty until a reviewer decides)
sample_data    yes
```

D5c **never** writes `APPROVED` itself — only the human reviewer in D7 can. This is what makes the
"not shared until approved" exit test hold.

---

## 5. Share targets and the City Page (step 5–6, approval-only)

All of these run **only** on `APPROVED` and, in the demo, target **test addresses** (S2/CC-2 — the
tech.md rule that "all sends in the demo target test addresses, never real offices").

| Target | What it receives | Demo address |
|---|---|---|
| City **DRRMO** | the approved readiness report (PDF/MD) | DRRMO **test** inbox (action connector: email/Slack/Teams) |
| **Sanggunian** contacts | the approved report | Sanggunian **test** inbox |
| **Media** contacts (team-provided) | the approved report | media **test** inbox(es) the team configures per run |
| **City Page** | the approved report posted to the city's page | the **mockup** City Page (`ripples-climate-map.html`) — not a live site in this version |

The media and Sanggunian contact lists are **provided per run by the team**; the automation does not
harvest or infer contacts. The City Page target is the mockup in this version (presentation layer is
mockup-only per product.md); posting to a production City Page is future work.

---

## 6. What the automation reads (grounding) and what it must not do

**Reads (all read-only):**

| Source | Via | Used for |
|---|---|---|
| `data/cities.csv` | D3 + D2 | the city list to iterate; `real_risk_level`, `risk_score`, `promises_kept_pct`, `maintained_pct`, `as_of` |
| `data/projects.csv` | D3 + D2 | commitments, open gaps, interim measures, follow-ups sent/replied |
| `data/evidence.csv` | D3 | cited current-condition observations for each gap |
| `data/evacuation_centers.csv` | D3 | resident actions |
| D2 Ripples Climate Scorecard | step 2 | the attached scorecard slice |
| PAGASA / NDRRMC public web | D3 | seasonal outlook + hazard climatology, **cited** |
| D7 queue item `review_state` | step 4→5 gate | the approval decision |

**Must not do (hard constraints):**

- **Must not** compute, re-weight, or model-estimate any risk or advisory level — it quotes the
  fixed-rule `real_risk_level` / `risk_score` as read (CC-4 / S4).
- **Must not** state or imply any city is "safe" or "out of danger"; every report defers to and
  links PAGASA and NDRRMC (S1/CC-1).
- **Must not** share, send, or post anything while `review_state ≠ APPROVED` (S2/CC-2).
- **Must not** use accusatory language — only `overdue`, `disputed`, `needs maintenance`, `no reply`,
  `on track` (S3).
- **Must not** drop the sample-data label from any report it emits (S7/CC-7).

---

## 7. Safeguard checklist (must all hold)

- [x] **S1 / CC-1 — Never "safe."** Every readiness report carries the official-source line, defers
      to and links **PAGASA** and **NDRRMC**, and makes no safety claim. Inherited from the D3 brief
      and restated in the report template's header and footer.
- [x] **S2 / CC-2 — Human approval before share/publish.** Reports are emitted as **DRAFT** and routed
      to D7; steps 5–6 (share + post) run **only** on `review_state = APPROVED`; the automation never
      sets `APPROVED` itself; demo sends go to **test** addresses.
- [x] **S3 — Neutral language.** The report uses only neutral status words; it adds no language beyond
      what the D3 brief and D2 scorecard already carry.
- [x] **S4 / CC-4 — Fixed-rule risk.** `real_risk_level` / `risk_score` are quoted from `cities.csv`
      via D3/D2; the automation never recomputes or re-weights them.
- [x] **S7 / CC-7 — Sample data labeled.** Every report states up front and in the scorecard section
      that all figures are sample data; the queue item carries `sample_data = yes`.

Safeguards not directly exercised by this automation (no citizen-report handling here): **S5** and
**S6** — these are enforced upstream in D4c / D7's Reports queue, which this automation does not touch.

---

## 8. Exit test (Task 6c definition of done)

> **Exit test:** an on-demand run produces a per-city report routed to the reviewer, not shared until
> approved.

Verified for the pilot city (Malabon) in `worked-run-malabon.md`:

1. An **on-demand** run for Malabon runs D3 + attaches the D2 scorecard slice and produces a
   **per-city readiness report** (`readiness-report-malabon.md`).
2. The report is emitted as **DRAFT** and routed to the D7 Reviewer as a Drafts-queue item
   (`item_id = draft-malabon-readiness`, `review_state = DRAFT`).
3. With `review_state = DRAFT`, the automation performs **no share and no post** — the DRRMO,
   Sanggunian, media contacts and City Page receive nothing.
4. The share/post steps (5–6) are shown as **gated**: they would run only if a reviewer moves the item
   to `APPROVED` in D7 — which this automation never does on its own.

**Pass criterion:** the Malabon readiness report exists, is marked DRAFT + sample data, is routed to
the reviewer, and nothing is shared/posted while the item is not `APPROVED`. If any share/post occurs
before approval, the build is not done.

---

## 9. Build notes for Quick Automate

1. Create an automation named **"Pre-season readiness"** in the D0 Quick space.
2. Set two triggers: **on demand**, and a **yearly schedule** fixed to four weeks before the typhoon
   season.
3. Loop over `cities.csv` rows (`city_id`). For each city:
   a. Call the **D3 City risk brief** Quick Research prompt (`quick-prompts.md` → D3) for the city.
   b. Pull the city's **D2 scorecard** slice from the Ripples Climate Scorecard (Quick Sight).
   c. Assemble the readiness report from `report-template.md`, keeping the **DRAFT** marker and the
      sample-data label.
   d. Create a **Drafts-queue** item in the D7 Reviewer app with `kind = readiness_report`,
      `review_state = DRAFT`, `source_ref = city_id`.
4. **Stop at the gate.** Configure steps 5–6 (share + post) to run **only** when the item's
   `review_state = APPROVED`. Point all share connectors at **test** addresses and the City Page
   target at the mockup.
5. Verify the Malabon path first (`worked-run-malabon.md`) before enabling the all-cities schedule.
6. Confirm the gate: run on demand, leave the item in `DRAFT`, and check that nothing was sent or
   posted. That is the exit test.
