# Readiness report — reusable template (D5c)

**Component:** Pre-season readiness report · **Prompt ID:** D5c (`quick-prompts.md`) · **Quick feature:** Quick Automate
**Implements:** R9 (1–2), CC-1, CC-2, CC-7 · **Spec:** `ripples-quick-system`
**Assembled from:** D3 City risk brief (`artifacts/city-risk-briefs/`) + D2 Climate Scorecard slice (`quick-build/D2-ripples-climate-scorecard.md`)
**Pilot city:** Malabon City (build and verify here first, then generalize)

> This is the fixed shape of **every** per-city readiness report the D5c automation emits. The
> automation fills the placeholders from the D3 brief and the D2 scorecard; it adds no risk scoring
> and no language beyond neutral status words. Every report is emitted **DRAFT** and routed to the
> D7 Reviewer; nothing is shared or posted until a reviewer approves it.

---

## Required header (every report)

```
# Pre-season readiness report — <City>

**DRAFT — not approved. Not shared or posted.**   ← visible DRAFT marker (S2/CC-2)
Component: Pre-season readiness (D5c, Quick Automate) · Routed to: Ripples Reviewer (D7)
Review state: DRAFT   ·   Queue item: draft-<city_id>-readiness
Real-risk level: <real_risk_level> (risk_score <risk_score>) — read from cities.csv (fixed-rule, CC-4)
Data as of: <as_of> (cities.csv)
```

- A **⚠ Sample data** block (S7/CC-7) stating all figures come from the sample CSVs and use real
  names only to show how the system works.
- The **official-source line** up front (S1/CC-1): follow PAGASA and NDRRMC for live warnings; this
  report cannot declare any area safe.

## Section A — Scorecard slice (from D2) — **sample data**

The city's row from the Ripples Climate Scorecard, read-only (CC-4). A compact table:

| Field | Source | Note |
|---|---|---|
| `real_risk_level` + color | `cities.csv` via D2 §3.2 palette | fixed-rule, not recomputed |
| `risk_score` | `cities.csv` | fixed-rule |
| `promises_kept_pct` | `cities.csv` | — |
| `maintained_pct` | `cities.csv` | — |
| open-gap count | `projects.csv` (`gap ∈ {Overdue, Needs maintenance}`) | D2 §3.1 definition |
| follow-ups sent / replied | `projects.csv` | neutral: "no reply recorded" where replied = 0 |

## Section B — City risk brief (from D3)

The full D3 brief, or a faithful condensation that keeps **all five** D3 sections:
1. Hazard profile (cited; `real_risk_level`/`risk_score` quoted, not recomputed)
2. Seasonal outlook (next ~3 months) — cited PAGASA outlook, or an explicit "none found" with live
   PAGASA/NDRRMC links
3. Climate commitments (sample data), grouped On track / Overdue / Needs maintenance
4. Open gaps that matter most + one interim measure each (with cited evidence)
5. Three actions each for the DRRMO and residents

## Section C — Pre-season readiness summary

A short, neutral synthesis the reviewer and partners read first:
- the city's recorded real-risk level (quoted),
- the number of open gaps going into the season and which matter most,
- the interim measures currently in place,
- the single clearest "do this before the season" item for the DRRMO,
- a restatement that residents should follow PAGASA/NDRRMC directly.
No new facts, no scoring — only a synthesis of A and B.

## Required footer (every report)

```
## Official-source line
Follow official warnings and evacuation orders from PAGASA (https://www.pagasa.dost.gov.ph/) and
NDRRMC (https://ndrrmc.gov.ph/). This report does not and cannot declare any area safe.

## Routing & approval (S2/CC-2)
Status: DRAFT. Routed to the Ripples Reviewer (D7), Drafts queue, as item draft-<city_id>-readiness.
Not shared with the DRRMO, Sanggunian or media contacts and not posted on the City Page unless and
until a reviewer sets review_state = APPROVED in the Reviewer app. The automation never approves its
own report.
```

## Safeguards checklist (must all hold on every report)

- [ ] **S1 / CC-1** — never "safe"; defers to and links PAGASA/NDRRMC; official-source line present.
- [ ] **S2 / CC-2** — DRAFT marker visible; routing/approval footer present; nothing shared/posted
      pre-approval; demo sends to test addresses only.
- [ ] **S3** — neutral status words only.
- [ ] **S4 / CC-4** — `real_risk_level`/`risk_score` quoted from `cities.csv`, not recomputed.
- [ ] **S7 / CC-7** — sample-data block in header and in Section A.

## Exit test (per city)
The report has the DRAFT header, Section A (scorecard slice), Section B (all five D3 sections),
Section C (summary), and the routing/approval footer; it is routed to D7 as DRAFT and is not
shared/posted until `review_state = APPROVED`.
