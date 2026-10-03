# Ripples Climate Scorecard — Build Specification (D2)

**Component:** Ripples Climate Scorecard · **D-ID:** D2 · **Quick feature:** Quick Sight
**Spec:** `.kiro/specs/ripples-quick-system/` · **Implements:** R2 (1–5), CC-4, CC-7 · **Prompt:** `quick-prompts.md` → D2
**Depends on:** Task 1 (D0 space & knowledge)
**Status:** Build artifact — concrete, hand-checkable configuration for the dashboard that lives inside the Quick space.

> **Sample data.** Every figure in this document is derived from the sample CSVs in `data/`. The dashboard it defines uses real city names only to show how the system works; it does not describe the actual status of any LGU, DPWH, DENR, MMDA or PAGASA record. The dashboard MUST carry a visible **"Sample data"** label in its title area (CC-7 / S7).

---

## 1. Purpose and scope

This artifact fully defines the **Ripples Climate Scorecard** so it can be built in Quick Sight and hand-verified against the CSVs. It is the single source of record for:

- the **five sheets** and their visuals,
- the **field mappings** from `cities.csv` / `projects.csv` / `evidence.csv`,
- the **open-gap definition** (`gap ∈ {Overdue, Needs maintenance}`),
- the **risk-color mapping** read from `real_risk_level` (never recomputed, CC-4), and
- the **"Sample data"** label requirement (CC-7).

The dashboard reads precomputed fields only. It performs aggregation and filtering, but it **never computes, re-weights, or estimates** a risk score or risk level (CC-4 / S4).

## 2. Data sources (inputs)

| Dataset | File | Rows | Role in dashboard |
|---|---|---|---|
| Cities | `data/cities.csv` | 8 | Map points, risk colors, KPI tiles, city table |
| Projects | `data/projects.csv` | 32 | Open gaps, gaps-by-agency, follow-up accountability, project explorer |
| Evidence | `data/evidence.csv` | 48 | Available for drill-through in the project explorer (project_id join) |

**Joins.** `city_id` is the hub (`projects.city_id → cities.city_id`). `evidence.project_id → projects.project_id`.
**Sample-data flag.** Every source row carries `sample_data = yes`; the dashboard surfaces this as the title-area label.

## 3. Core definitions (single source for all KPIs)

### 3.1 Open gap (used by every open-gap KPI)
A project is an **open gap** when its `gap` field is exactly one of:

```
gap = "Overdue"   OR   gap = "Needs maintenance"
```

Any other value — including blank/empty and `OK` — is **not** an open gap. This is the only definition of "open gap" anywhere in the dashboard. (R2.2)

### 3.2 Risk level and risk color — fixed-rule, read-only (CC-4 / S4)
The map and the city table color/sort by the **precomputed** fields `real_risk_level` and `risk_score` taken directly from `cities.csv`. The dashboard does **not** derive risk from `hazard_points`, `gap_points`, open-gap counts, or any model. It reads the stored value and maps it to a color.

**Risk-color mapping (fixed order Low → Moderate → High → Critical):**

| `real_risk_level` | Color | Hex (matches mockup palette) |
|---|---|---|
| Low | Green | `#2ecc71` |
| Moderate | Yellow | `#f1c40f` |
| High | Orange | `#e67e22` |
| Critical | Red | `#e74c3c` |

Palette and background match `ripples-climate-map.html` (dark navy background; green/yellow/orange/red risk ramp; condensed display headings). **Note:** no city in the current sample data is `Critical`; the Critical/red band is defined so the mapping is complete and future-proof, but it will render zero cities today.

## 4. The five sheets

### Sheet 1 — National overview
**Visuals**
- **KPI tiles**
  - *Commitments tracked* = count of rows in `projects.csv` = **32**.
  - *Open gaps* = count of projects where `gap ∈ {Overdue, Needs maintenance}` = **12**.
  - *Cities at High or Critical real-risk level* = count of `cities.csv` rows where `real_risk_level ∈ {High, Critical}` = **3**.
- **National map** — one point per city using `cities.csv` `lat`/`lon`, colored by `real_risk_level` using the fixed mapping in §3.2 (read-only, CC-4). Tooltip: `city`, `real_risk_level`, `risk_score`, `promises_kept_pct`, open-gap count.

**One-line captions (neutral language, S3)**
- Open gaps tile: "Projects that are Overdue or Needs maintenance."
- Map: "Cities colored by their recorded real-risk level (sample data; levels are read from the record, not recalculated)."

### Sheet 2 — City scorecard table
**Columns (in order):** `city`, `real_risk_level`, `risk_score`, `promises_kept_pct`, `maintained_pct`, **open gaps** (count of this city's projects with `gap ∈ {Overdue, Needs maintenance}`), **follow-ups sent** (`SUM(followups_sent)` for the city), **follow-ups replied** (`SUM(followups_replied)` for the city).
**Sort:** `risk_score` **descending** (R2.4). The `real_risk_level` cell is tinted with the §3.2 color.

**Expected rendering from the sample data (hand-check):**

| city | real_risk_level | risk_score | promises_kept_pct | maintained_pct | open gaps | follow-ups sent | follow-ups replied |
|---|---|---:|---:|---:|---:|---:|---:|
| Legazpi City | High | 4 | 33 | 50 | 2 | 2 | 1 |
| Malabon City | High | 4 | 67 | 50 | 2 | 3 | 1 |
| Dagupan City | High | 4 | 50 | 0 | 2 | 2 | 1 |
| Iloilo City | Moderate | 3 | 67 | 50 | 2 | 1 | 0 |
| Cagayan de Oro City | Moderate | 2 | 50 | 100 | 1 | 1 | 0 |
| Marikina City | Moderate | 2 | 50 | 100 | 1 | 1 | 1 |
| Tacloban City | Moderate | 2 | 50 | 100 | 1 | 1 | 1 |
| Davao City | Low | 1 | 50 | 100 | 1 | 0 | 0 |

(Ties at `risk_score = 4` and `= 2` may order arbitrarily among themselves; the required rule is descending `risk_score`.)

### Sheet 3 — Gaps by agency
**Visual:** bar chart of **open-gap count by `agency`**, each bar split (stacked) by `gap` type (`Overdue` vs `Needs maintenance`). Open-gap filter from §3.1 applies.

**Expected rendering (hand-check):**

| agency | Overdue | Needs maintenance | Total open gaps |
|---|---:|---:|---:|
| DPWH | 6 | 2 | 8 |
| City Government | 2 | 2 | 4 |
| **All agencies** | **8** | **4** | **12** |

(The 32-row dataset also contains MMDA, DENR projects, but none of those are open gaps in the sample data, so they do not appear on this chart.)

### Sheet 4 — Follow-up accountability
**Visual:** paired bars of **follow-ups sent vs. replied by `responsible_office`**, plus a KPI for the **number of offices with sent > 0 that have not replied** (replied = 0).

**Expected rendering (hand-check):** totals across all projects — **sent = 10, replied = 4.**

| responsible_office | sent | replied |
|---|---:|---:|
| District Engineer, DPWH Pangasinan District Engineering Office | 1 | 0 |
| City Engineer, Dagupan City Engineering Office | 1 | 1 |
| District Engineer, DPWH Malabon-Navotas District Engineering Office | 2 | 0 |
| City DRRM Officer, Malabon CDRRMO | 1 | 1 |
| District Engineer, DPWH Metro Manila 2nd District Engineering Office | 1 | 1 |
| District Engineer, DPWH Albay 2nd District Engineering Office | 1 | 0 |
| District Engineer, DPWH Leyte 1st District Engineering Office | 1 | 1 |
| City Engineer, Iloilo City Engineering Office | 1 | 0 |
| City DRRM Officer, Cagayan de Oro CDRRMO | 1 | 0 |

**Offices with no reply (sent > 0, replied = 0):** 5 — DPWH Pangasinan, DPWH Malabon-Navotas, DPWH Albay 2nd, Iloilo City Engineering, Cagayan de Oro CDRRMO.
Caption uses neutral language: "No reply recorded" (never accusatory, S3).

### Sheet 5 — Project explorer
**Visual:** filterable table of all 32 projects.
**Columns:** `project_id`, `city`, `project`, `type`, `agency`, `responsible_office`, `status`, `progress_pct`, `deadline`, `gap`, `interim_measure`.
**Filters:** `city`, `status`, `type`, `agency` (and an optional "open gaps only" toggle applying §3.1).
**Drill-through:** by `project_id` into `evidence.csv` observations (`date`, `source`, `observation`, `corroborated`).

## 5. Field-mapping reference

| Dashboard element | Source field(s) | Transform |
|---|---|---|
| Map point location | `cities.csv.lat`, `cities.csv.lon` | none |
| Map point color | `cities.csv.real_risk_level` | §3.2 mapping (read-only) |
| City table sort | `cities.csv.risk_score` | descending |
| Promises kept % | `cities.csv.promises_kept_pct` | none |
| Maintained % | `cities.csv.maintained_pct` | none |
| Open-gap count (any scope) | `projects.csv.gap` | count where `∈ {Overdue, Needs maintenance}` |
| Gaps by agency | `projects.csv.agency`, `projects.csv.gap` | open-gap filter, group by agency, split by gap |
| Follow-ups sent / replied | `projects.csv.followups_sent`, `followups_replied` | SUM at the chosen scope |
| Offices with no reply | `projects.csv.responsible_office`, `followups_sent`, `followups_replied` | count offices with sent>0 and SUM(replied)=0 |
| Project explorer rows | `projects.csv` (all) | filterable |
| Evidence drill-through | `evidence.csv` via `project_id` | join |

## 6. Safeguard checklist (S1–S7)

- **S1 (never "safe"):** N/A to this analytics surface — the dashboard reports status; it makes no safety claims. No tile, caption, or label uses "safe" / "out of danger."
- **S2 (human approval):** N/A — a dashboard neither sends nor publishes. It is a read-only view.
- **S3 (neutral language):** captions and the no-reply KPI use `Overdue`, `Needs maintenance`, `No reply recorded`; no accusatory terms.
- **S4 (fixed-rule risk):** **enforced** — map color and table sort read `real_risk_level` / `risk_score` from `cities.csv`; the dashboard never recomputes risk. (CC-4)
- **S5 (protect reporters):** evidence drill-through exposes `source`/`observation`/`corroborated` only — no reporter identity field is surfaced.
- **S6 (fraud protection):** the evidence `corroborated` flag is displayed as stored; the dashboard does not change corroboration state.
- **S7 (label sample data):** **enforced** — a visible "Sample data" label sits in the title area and this spec notes the sample-data basis. (CC-7)

## 7. Exit test (Task 2 definition of done)

**Test:** the dashboard open-gap total must equal a manual count of `projects.csv` rows with `gap ∈ {Overdue, Needs maintenance}`, and the map colors must match the CSV `real_risk_level`.

**Verified against the sample data (via `count_open_gaps.ps1`):**

- **Open-gap total = 12** — 8 `Overdue` + 4 `Needs maintenance`.
  - *Overdue (8):* `dag-dike`, `mal-wall`, `mar-wall`, `leg-lahar`, `tac-embank`, `ilo-pump`, `cdo-telemetry`, `dav-floodwall`.
  - *Needs maintenance (4):* `dag-drain`, `mal-sensor`, `leg-seawall`, `ilo-floodway`.
  - *By city:* dagupan 2, malabon 2, legazpi 2, iloilo 2, marikina 1, tacloban 1, cdo 1, davao 1 (sum = 12).
- **Risk colors (map must match):** Dagupan **High/orange**, Malabon **High/orange**, Legazpi **High/orange**, Iloilo **Moderate/yellow**, CDO **Moderate/yellow**, Marikina **Moderate/yellow**, Tacloban **Moderate/yellow**, Davao **Low/green**. No Critical/red in the sample.

**Pilot check (Malabon first):** Malabon shows **2 open gaps** (`mal-wall` Overdue, `mal-sensor` Needs maintenance), **High / orange** on the map, `risk_score = 4`, follow-ups sent 3 / replied 1 — consistent with Task 1's grounded answer.

**Pass criterion:** when built in Quick Sight, the National overview "Open gaps" tile reads **12** and the map renders the eight cities in the colors above. If either differs, the build is not done.

## 8. Build notes for Quick Sight

1. Load `cities.csv`, `projects.csv`, `evidence.csv` from the D0 space.
2. Name the analysis **"Ripples Climate Scorecard"** and place a **"Sample data"** label in the title area.
3. Create a calculated field `is_open_gap = (gap = "Overdue") OR (gap = "Needs maintenance")` and reuse it for every open-gap KPI so the definition stays single-sourced.
4. Bind the map and the city-table risk cell color to `real_risk_level` with the §3.2 palette — do **not** derive it from any numeric field.
5. Build the five sheets per §4; add the one-sentence neutral caption beneath each visual.
6. Hand-check the National overview "Open gaps" tile against §7 (= 12) before marking the task done.
