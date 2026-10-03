# Worked on-demand run — Pre-season readiness (D5c), pilot city Malabon

**Component:** Pre-season readiness · **D-ID:** D5c · **Quick feature:** Quick Automate
**Implements:** R9 (1–2), CC-1, CC-2, CC-7 · **Pilot city:** Malabon City
**Purpose:** show one on-demand run end to end — a per-city readiness report produced, routed to the
Reviewer as DRAFT, and **not** shared until approved. This is the task 6c exit test, worked.

> **⚠ Sample data.** This run uses the Ripples sample CSVs (`sample_data = yes`) and the D3/D2
> artifacts built from them. All send targets are **test** addresses; the City Page target is the
> mockup. Nothing in this run reaches a real office.

---

## Run parameters

```
Automation:   Pre-season readiness (D5c)
Trigger:      ON DEMAND  (reviewer-initiated; the yearly schedule is not exercised here)
Scope:        single city — city_id = malabon  (pilot-first)
Initiated by: reviewer (demo)
Run at:       <demo timestamp>
```

---

## Step-by-step trace

### STEP 1 — Run the D3 City risk brief (Quick Research)
Input: `city_id = malabon`. The automation calls the D3 prompt, which reads `cities.csv`,
`projects.csv`, `evidence.csv`, `evacuation_centers.csv` filtered to Malabon plus PAGASA/NDRRMC web.

Result: the five-section Malabon brief
(`artifacts/city-risk-briefs/malabon-city-risk-brief.md`). Fixed-rule risk **High / score 4** quoted,
not recomputed (CC-4). Seasonal outlook handled as "none found" with live PAGASA/NDRRMC links. ✔

### STEP 2 — Attach the D2 scorecard slice (Quick Sight)
The automation pulls Malabon's row from the Ripples Climate Scorecard
(`quick-build/D2-ripples-climate-scorecard.md`). Read-only; no recomputation (CC-4).

```
Malabon City | real_risk_level=High (orange) | risk_score=4 | promises_kept_pct=67
             | maintained_pct=50 | open_gaps=2 (mal-wall Overdue, mal-sensor Needs maintenance)
             | followups_sent=3 | followups_replied=1
```
Consistent with D2 §7 pilot check. ✔

### STEP 3 — Produce the readiness report
The automation assembles Section A (scorecard slice) + Section B (D3 brief) + Section C (summary)
into one document per `report-template.md`, keeping the **DRAFT** marker and the sample-data label,
neutral language only.

Result: `readiness-report-malabon.md`, marked **DRAFT — not approved. Not shared or posted.** ✔

### STEP 4 — Route to the Ripples Reviewer (D7) as DRAFT  ← GATE
The automation creates a Drafts-queue item in the D7 Reviewer app and **stops**:

```
item_id      draft-malabon-readiness
queue        drafts
kind         readiness_report
source_ref   malabon
title        "Pre-season readiness — Malabon City"
review_state DRAFT                    ← the automation sets DRAFT, never APPROVED
decided_by   (empty)
decided_at   (empty)
sample_data  yes
```

The item lands in the D7 Drafts queue (an existing, built screen — D7 app-spec §2 Screen 2 lists
`readiness_report` as a supported kind, beside its source record). ════ HUMAN APPROVAL GATE ════

---

## State at the end of the on-demand run (no approval yet)

| Target | Received anything? | Why |
|---|---|---|
| City DRRMO (test inbox) | **No** | `review_state = DRAFT` — step 5 not reached |
| Sanggunian (test inbox) | **No** | `review_state = DRAFT` — step 5 not reached |
| Media contacts (test inbox) | **No** | `review_state = DRAFT` — step 5 not reached |
| City Page (mockup) | **No** | `review_state = DRAFT` — step 6 not reached |
| Ripples Reviewer (D7) Drafts queue | **Yes — one DRAFT item** | step 4 routed it here |

**The report is reviewer-gated.** At the end of the on-demand run the only thing that happened is a
DRAFT report appearing in the Reviewer's Drafts queue. Nothing was sent to the DRRMO, Sanggunian or
media, and nothing was posted to the City Page.

---

## What approval would do (shown, not executed in this run)

Steps 5–6 are **gated** and run only if a reviewer opens `draft-malabon-readiness` in the D7 app and
chooses **Approve**, setting `review_state = APPROVED`. The automation never does this itself.

```
IF a reviewer sets review_state = APPROVED in D7:
   STEP 5  share the approved report → DRRMO + Sanggunian + media  (TEST addresses in the demo)
   STEP 6  post the approved report → City Page (mockup in this version)

IF a reviewer sets review_state = REJECTED in D7:
   do nothing; log the rejection; return the item for re-draft (a new DRAFT)
```

Because this worked run left the item in `DRAFT`, neither branch executed. That is the exit test
condition: **produced, routed, not shared until approved.**

---

## Exit-test result (Task 6c)

> *Exit test:* an on-demand run produces a per-city report routed to the reviewer, not shared until
> approved.

| Check | Result |
|---|---|
| On-demand run produced a per-city (Malabon) readiness report | **PASS** (`readiness-report-malabon.md`) |
| Report combines D3 brief + attached D2 scorecard | **PASS** (Sections A + B) |
| Report emitted as DRAFT + sample data | **PASS** (header marker + sample-data block) |
| Routed to the Ripples Reviewer (D7) as a Drafts-queue item | **PASS** (`draft-malabon-readiness`, `review_state = DRAFT`) |
| Nothing shared with DRRMO/Sanggunian/media or posted to City Page while not APPROVED | **PASS** (state table above — all "No") |
| Automation never sets APPROVED itself | **PASS** (only a reviewer in D7 can) |

**Overall: PASS — the report is reviewer-gated.**

---

## Safeguards audit for this run

- S1 / CC-1 — report defers to and links PAGASA/NDRRMC; no "safe" claim. ✔
- S2 / CC-2 — DRAFT; routed to D7; share/post gated on APPROVED; demo targets are test addresses. ✔
- S3 — neutral language only. ✔
- S4 / CC-4 — risk read from `cities.csv` via D3/D2, not recomputed. ✔
- S7 / CC-7 — sample-data labeled throughout; queue item `sample_data = yes`. ✔
- S5 / S6 — not exercised (no citizen-report handling in this automation). ✔ (n/a)

## Generalizing beyond Malabon
The same four-step pipeline + gate runs for every `city_id` in `cities.csv` (dagupan, marikina,
legazpi, tacloban, iloilo, cdo, davao) on the on-demand all-cities run or the yearly schedule. Each
produces its own DRAFT `readiness-report-<city>.md` and its own `draft-<city>-readiness` queue item,
and each is independently reviewer-gated — no city's report is shared or posted until its own item is
`APPROVED`.
