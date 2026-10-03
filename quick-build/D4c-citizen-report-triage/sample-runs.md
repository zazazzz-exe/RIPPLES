# Sample runs — Citizen report triage (D4c)

**Sample data.** These runs use the sample CSVs in `data/`. All outputs are **DRAFT** and **sample data**. No run captures or emits any reporter identity (S5/CC-5).

Both runs anchor on `report_date = 2026-09`, matching the month granularity of `evidence.csv`. The "last 30 days" window therefore selects rows dated `2026-09` (the report month) and immediately adjacent dates.

---

## Run A — Lone report → `unverified`

### Input
```
project_id:        dag-tidegate
report_text:       "The tide gates at the Calmay outfall still aren't there — only bare ground and some stakes."
report_type:       status update
photo_description: "Empty lot at the outfall, survey stakes, no gate structure."
report_date:       2026-09
```

### Step 0 — Strip identity
No reporter identifier present after de-identification. Proceed on de-identified text only.

### Step 1 — Match to project
`dag-tidegate` found in `projects.csv`: Dagupan City, type **Pump** (tide gates / outfall), `status = Not started`, `approx_lat/lon = 16.0510/120.3040`.
- `type_match = yes` (a status update on the outfall tide-gate works).
- `location_match = yes` (Calmay outfall, Dagupan).

### Step 2 — Count recent matching reports
Rows in `evidence.csv` for `project_id = dag-tidegate`:

| evidence_id | date | source | observation |
|---|---|---|---|
| dag-tidegate-e1 | 2026-04 | LGU update | Detailed design ongoing. |

Within the last 30 days of `2026-09`: **none** (the only row is dated `2026-04`).
- `matching_reports_30d = 0`
- `satellite_check_agrees = false`

### Step 3 — Corroboration status
`0 >= 2`? no. Satellite agrees? no. → **`unverified`**.

### Step 4 — Suspicious-pattern flags
No identical wording, no burst, type/location both match. `review_flag = no`.

### Step 5 — Evidence entry (`evidence.csv` shape)
```
evidence_id,project_id,city_id,date,source,observation,corroborated,sample_data
dag-tidegate-e2,dag-tidegate,dagupan,2026-09,Citizen photo report,Reported the Calmay outfall tide gates are not yet built; only bare ground and survey stakes were observed.,no,yes
```

### Output (DRAFT · Sample data)
```
triage_status:          unverified
matching_reports_30d:   0
satellite_check_agrees: false
review_flag:            no
```
**Result: `unverified`.** No reporter identity anywhere in the input handling or output.

---

## Run B — Report with ≥2 matching reports → `corroborated`

### Input
```
project_id:        mal-wall
report_text:       "The gap in the Tullahan river wall at Tinajeros is still open; the sandbags have been pushed out of place."
report_type:       maintenance problem
photo_description: "Open gap in the concrete river wall, scattered sandbags at the base."
report_date:       2026-09
```

### Step 0 — Strip identity
No reporter identifier present after de-identification. Proceed on de-identified text only.

### Step 1 — Match to project
`mal-wall` found in `projects.csv`: Malabon City, type **Dike** (Tullahan River wall repair, Tinajeros), `status = Delayed`, `gap = Overdue`, `approx_lat/lon = 14.6720/120.9650`.
- `type_match = yes` (river wall / dike condition).
- `location_match = yes` (Tullahan River wall, Tinajeros, Malabon).

### Step 2 — Count recent matching reports
Rows in `evidence.csv` for `project_id = mal-wall`:

| evidence_id | date | source | observation |
|---|---|---|---|
| mal-wall-e1 | 2026-09 | Citizen photo report | Gap in the wall still open, sandbags displaced. |
| mal-wall-e2 | 2026-09 | Citizen photo report | Same gap photographed from the opposite bank. |
| mal-wall-e3 | 2026-07 | Satellite check | No construction activity visible at the site. |
| mal-wall-e4 | 2026-02 | LGU update | 30% complete, awaiting materials. |

Within the last 30 days of `2026-09`: **mal-wall-e1** and **mal-wall-e2** (both `2026-09`), both describing the same open gap / displaced sandbags.
- `matching_reports_30d = 2`
- `satellite_check_agrees = false` (the satellite row is dated `2026-07`, outside the 30-day window; corroboration already holds without it.)

### Step 3 — Corroboration status
`2 >= 2`? **yes.** → **`corroborated`**.

### Step 4 — Suspicious-pattern flags
Two reports from opposite banks on the same month corroborate rather than duplicate; wording is not identical and there is no minutes-apart burst; type/location match. `review_flag = no`.

### Step 5 — Evidence entry (`evidence.csv` shape)
```
evidence_id,project_id,city_id,date,source,observation,corroborated,sample_data
mal-wall-e5,mal-wall,malabon,2026-09,Citizen photo report,Reported the Tinajeros section of the Tullahan River wall still has an open gap with displaced sandbags.,yes,yes
```

### Output (DRAFT · Sample data)
```
triage_status:          corroborated
matching_reports_30d:   2
satellite_check_agrees: false
review_flag:            no
```
**Result: `corroborated`.** No reporter identity anywhere in the input handling or output.

---

## Exit-test verification

| Case | Project | matching_reports_30d | satellite agrees | Result | Reporter named |
|---|---|---|---|---|---|
| Lone report | `dag-tidegate` | 0 | false | **unverified** ✅ | none ✅ |
| ≥2 matches | `mal-wall` | 2 | false | **corroborated** ✅ | none ✅ |

Both outcomes match the task's exit test, and neither output — nor any intermediate variable, evidence row, or log line — names a reporter. Default-`unverified` corroboration (S6/CC-6) and reporter anonymity (S5/CC-5) both hold.
