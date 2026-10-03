# City Risk Brief — Reusable Template & Spec (D3)

**Component:** City risk brief · **Prompt ID:** D3 (`quick-prompts.md`) · **Quick feature:** Quick Research
**Implements:** Requirements R3 (1–3), CC-1, CC-7 · **Spec:** `ripples-quick-system`
**Pilot city:** Malabon City (build and verify here first, then generalize)

> **Sample data.** Every commitment, project, gap and figure in a brief produced from this
> template is drawn from the Ripples sample CSVs (`sample_data = yes`). It uses real city
> names to show how the system works and does **not** describe the actual status of any
> LGU, DPWH, DENR, MMDA or PAGASA record.

---

## Purpose

A per-city, roughly two-page pre-season readiness brief that a reviewer can hand to a DRRMO
or partner. It combines the city's own commitment data (from the sample CSVs) with cited
external hazard/seasonal context, so the reader gets grounded, current context without
reading every file.

The brief is a **research/language artifact**. It never computes a risk level — it reads
`real_risk_level` / `risk_score` from `cities.csv` (fixed-rule, CC-4) and quotes them.

---

## Data this template reads (grounding)

| Source | Fields used |
|---|---|
| `cities.csv` (filter `city_id`) | `city`, `province`, `hazards`, `real_risk_level`, `risk_score`, `promises_kept_pct`, `maintained_pct`, `as_of` |
| `projects.csv` (filter `city_id`) | `project`, `type`, `agency`, `responsible_office`, `status`, `progress_pct`, `deadline`, `maintenance`, `gap`, `interim_measure`, `summary` |
| `evidence.csv` (join `project_id`) | `date`, `source`, `observation` — to ground what each gap looks like now |
| `evacuation_centers.csv` (filter `city_id`) | `name`, `capacity_persons` — for resident actions |
| Public web | PAGASA seasonal climate outlook; NDRRMC / PAGASA advisory pages — **cited** |

**Open gap** = a project whose `gap` is `Overdue` **or** `Needs maintenance` (single definition, used everywhere).

---

## The five required sections (all mandatory)

A brief is **not done** unless all five are present.

### 1. Hazard profile
The city's main climate hazards (typhoon, flood, storm surge, high tide, heat, landslide,
drought, lahar), taken from `cities.csv.hazards`, with a short note on what recent seasons
looked like. **Cite every external fact** (e.g., PAGASA climatology, NDRRMC situation
reports). State the city's `real_risk_level` and `risk_score` as read from the CSV
(fixed-rule — do not recompute).

### 2. Seasonal outlook (next ~3 months)
The PAGASA seasonal outlook, **cited**. **If no current PAGASA outlook can be retrieved,
say so plainly** — do not fabricate numbers or a forecast. Point the reader to the live
PAGASA Seasonal Climate Outlook and NDRRMC pages for the authoritative, current picture.

### 3. Commitments (from `projects.csv`) — **marked sample data**
List the city's climate commitments grouped by status:
- **On track** — in-progress/not-yet-due projects with no open gap.
- **Overdue** — `gap = Overdue`.
- **Needs maintenance** — `gap = Needs maintenance`.
Use neutral status words only. State plainly this is sample data.

### 4. Open gaps that matter most + interim measures
For each open gap (ranked by what matters most for the coming season), give the project,
its `responsible_office`, the current `interim_measure` from the CSV, and — where available
— a cited evidence observation showing the current condition. One interim measure per gap.

### 5. Three actions each for DRRMO and residents
Exactly three recommended actions for the city DRRMO and three for residents, grounded in
the gaps and evacuation centers above. Resident actions reference named evacuation centers
from `evacuation_centers.csv`.

---

## Safeguards checklist (must all hold — S1, S3, S4, CC-1, CC-7)

- [ ] **S1 / CC-1 — Never "safe."** The brief never states or implies the city is "safe,"
      "out of danger," or equivalent. It defers to and links **PAGASA** and **NDRRMC**.
- [ ] **S3 — Neutral language.** Only `overdue`, `disputed`, `needs maintenance`, `no reply`,
      `on track`. No accusatory words ("corrupt," "negligent," "lying," etc.).
- [ ] **S4 / CC-4 — Fixed-rule risk.** `real_risk_level` / `risk_score` are quoted from
      `cities.csv`, never recomputed or model-estimated.
- [ ] **CC-7 / S7 — Sample data labeled.** The brief states up front, and again at the
      commitments section, that all commitment data is sample data.
- [ ] **R3.2 — Citations.** Every external fact is cited; if no current PAGASA outlook is
      found, that is stated plainly.

## Exit test (per city)
The brief has **all five sections** and **≥1 cited PAGASA/NDRRMC source** (or an explicit
"none found" for the seasonal outlook, with the live PAGASA/NDRRMC links still provided).

---

## How to generate a brief from this template

1. Filter `cities.csv`, `projects.csv`, `evidence.csv`, `evacuation_centers.csv` to the
   target `city_id`.
2. Fill the five sections in order using only the grounded data above.
3. Pull the live PAGASA seasonal outlook if available and cite it; otherwise write the
   plain "none found" statement and keep the PAGASA/NDRRMC links.
4. Run the safeguards checklist and the exit test before marking done.

> In production this prompt runs as **D3 in Quick Research** (see `quick-prompts.md`).
> This file is the repo-side spec and the source for the built Malabon instance in this folder.
