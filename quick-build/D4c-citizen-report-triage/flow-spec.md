# Flow specification — Citizen report triage (D4c)

**Component:** Citizen report triage
**D-ID:** D4c
**Quick feature:** Quick Flows
**Implements:** `quick-prompts.md` → D4c; design.md → "D4c — Citizen report triage"
**Satisfies:** Requirement 6 (1–4), CC-5 (S5), CC-6 (S6), CC-7 (S7)
**Pilot city:** Malabon City (built and verified against Malabon first)

> **Sample data.** This flow runs entirely on the sample CSVs in `data/` (`projects.csv`, `evidence.csv`). Every row carries `sample_data = yes`. Outputs are **sample data** and are emitted as **DRAFT** for the Ripples Reviewer (D7); nothing is published or trusted automatically.

---

## Purpose

Screen an incoming citizen report against the project it concerns and against other recent reports, so that **only corroborated evidence is trusted** and **the reporter stays anonymous**. The flow never decides a project is fine or a place is "safe"; it only sets an evidence `corroborated` value under the fixed corroboration rule (S6) and hands a DRAFT evidence entry to a human reviewer.

This is **language/triage work only**. It does not compute risk or advisory levels (those are fixed-rule, CC-4) and it does not send or publish anything (CC-2).

---

## Inputs

| Input | Type | Required | Notes |
|---|---|---|---|
| `project_id` | string (slug) | yes | Must exist in `projects.csv` (e.g. `mal-wall`). Join key to the project and its city. |
| `report_text` | string | yes | The citizen's free-text observation. |
| `report_type` | enum | yes | One of: `status update`, `dispute`, `maintenance problem`. |
| `photo_description` | string | optional | Text description of any attached photo. **No image, EXIF, location, or face data is read or stored in this version** (future work per tech.md). |
| `report_date` | date (`YYYY-MM`) | yes | Date the report was received; anchors the 30-day corroboration window. Matches the month granularity used in `evidence.csv`. |

**Never accepted / never stored:** reporter name, phone, email, device ID, handle, or any other identifier. The flow has **no input field for reporter identity** by design (S5/CC-5). If an identifier is present in `report_text` or `photo_description`, Step 0 strips it before anything else runs.

---

## Reference data (read-only)

- **`projects.csv`** — for the matched project's `type`, `city`/`city_id`, location (`approx_lat`, `approx_lon`), `status`, `gap`. Read-only; the flow never writes back to projects.
- **`evidence.csv`** — for counting recent matching reports for the same `project_id`. Columns: `evidence_id, project_id, city_id, date, source, observation, corroborated, sample_data`.

Join: `evidence.project_id → projects.project_id`; `projects.city_id → cities.city_id`.

---

## Steps

### Step 0 — Strip reporter identity (S5/CC-5)
Before any processing, remove any reporter-identifying text from `report_text` and `photo_description` (names, contact details, handles, "I am…", signatures). The remainder of the flow operates only on de-identified text. The reporter is **never** carried into any variable, log line, or output.

### Step 1 — Match the report to the project (R6.1)
Look up `project_id` in `projects.csv`.
- If not found → set `match = no (unknown project)`, `corroborated = unverified`, and flag for reviewer (`reason = unknown project_id`). Stop at the evidence-entry step.
- If found, compare the report against the project's **type** and **location/city**:
  - **Type match:** does the report's subject fit the project `type` (Dike, Drainage, Pump, Seawall, Mangrove, Warning, Greening, Evac)? A `maintenance problem` on a `Drainage` project matches; a report describing a seawall on a `Drainage` project does **not**.
  - **Location match:** does the report concern the project's city/area (`city`, `approx_lat/lon`)?
- Record `type_match` (yes/no) and `location_match` (yes/no). A mismatch does not stop the flow but is a suspicious-pattern signal (Step 4).

### Step 2 — Count recent matching reports (R6.2)
From `evidence.csv`, select rows where:
- `project_id` equals the report's `project_id`, **and**
- `date` is within the **last 30 days** of `report_date` (inclusive of the report month and the prior month at this data's month granularity), **and**
- the row **matches** the same concern (same project; type-consistent observation).

Compute:
- `matching_reports_30d` = count of such rows (other than the report being triaged).
- `satellite_check_agrees` = true if any selected row has `source = Satellite check` whose observation agrees with the report.

### Step 3 — Set corroboration status (R6.2, S6/CC-6)
Apply the **fixed corroboration rule** (no model judgment):

```
corroborated = "corroborated"  IF  matching_reports_30d >= 2
                               OR  satellite_check_agrees == true
             = "unverified"    otherwise
```

A report is **unverified by default**. It only becomes `corroborated` when **≥2 other matching reports in the last 30 days** agree, **or** a satellite check agrees. This status is never upgraded by the model's opinion of the text.

### Step 4 — Flag suspicious patterns for a reviewer (R6.3, S6/CC-6)
Raise `review_flag = yes` with one or more reasons when any hold:
- **Identical wording** — the report text is a near-duplicate of another recent report for the project.
- **Burst timing** — many reports for the same project arrive within minutes/the same short window.
- **Mismatched type/location** — `type_match = no` or `location_match = no` from Step 1.
A flag never auto-rejects and never auto-corroborates; it routes the item to the Reviewer (D7) reports queue for a human decision.

### Step 5 — Write a one-sentence evidence entry (R6.4, CC-7)
Emit **one** row in the exact `evidence.csv` shape, de-identified and sample-labeled:

```
evidence_id,project_id,city_id,date,source,observation,corroborated,sample_data
```

- `evidence_id` — `<project_id>-eN` using the next free index for that project.
- `source` — the report channel only (e.g. `Citizen photo report`), **never** a person.
- `observation` — one neutral sentence summarizing the de-identified report.
- `corroborated` — `yes` if Step 3 = `corroborated`, else `no` (mirrors the existing column's yes/no convention; `unverified` ⇒ `no`).
- `sample_data` — `yes`.

---

## Output

A **DRAFT** triage result containing:
1. `triage_status`: `corroborated` | `unverified`
2. `matching_reports_30d`, `satellite_check_agrees`
3. `review_flag` and reasons (if any)
4. The one-line `evidence.csv` row (Step 5)

The result carries a visible **DRAFT** marker and a **Sample data** label, and is routed to the Ripples Reviewer (D7) reports queue. **No reporter identity appears anywhere** in the output, the log, or the queue.

---

## Safeguard checklist (must all hold)

- [x] **S5/CC-5** — No input field for, and no output containing, reporter identity; Step 0 strips any identifier.
- [x] **S6/CC-6** — Default `unverified`; `corroborated` only on ≥2 matching 30-day reports or a satellite check; suspicious patterns flagged, never auto-corroborated.
- [x] **S3/CC-3** — Neutral language in the evidence sentence.
- [x] **S7/CC-7** — `sample_data = yes` on the row; output labeled sample data.
- [x] **S2/CC-2** — Emitted as DRAFT; trusted only after reviewer action in D7.
- [x] **CC-4** — No risk/advisory scoring performed; corroboration is a fixed rule.

---

## Exit test (Requirement 6)

| Case | Input | Expected `triage_status` | Reporter named? |
|---|---|---|---|
| Lone report | new report on a project with no matching reports in the last 30 days | `unverified` | no |
| Corroborated | new report on a project with ≥2 matching reports in the last 30 days | `corroborated` | no |

Worked runs proving both cases are in `sample-runs.md`.
