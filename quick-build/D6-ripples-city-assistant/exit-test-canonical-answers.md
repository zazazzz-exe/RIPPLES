# D6 — Ripples City Assistant — Exit test: canonical answers

**Component:** Ripples City Assistant (D6) · **Implements prompt:** D6 in `quick-prompts.md`
**Requirements:** R10 (1–3), CC-1, CC-7 · **Safeguards:** S1, S3, S4, S5, S7

> **⚠ Sample data.** The answers below are drawn from the Ripples sample CSVs in `data/`
> (`sample_data = yes`). Real city names are used only to show how the system works; these answers
> do **not** describe the actual status of any LGU, DPWH, DENR, MMDA or PAGASA record. For live,
> authoritative warnings, follow **PAGASA** (https://www.pagasa.dost.gov.ph/) and **NDRRMC**
> (https://ndrrmc.gov.ph/).

These are the three canonical questions from the D6 prompt, answered exactly as the agent should —
each grounded in the space, cited, sample-flagged, and with every safeguard intact.

---

## Q1 — "Which open gaps raise Malabon's risk this season?"

**Answer (sample data).** Malabon City has **two open gaps** in the sample data, and together they
account for its open-gap contribution to risk.

Malabon's recorded real-risk level is **High** (`risk_score = 4`), from `cities.csv` — this is a
precomputed field (hazard points 2 + open-gap points 2) and is read as stored, not recalculated.

The two open gaps (`projects.csv`, `city_id = malabon`, `gap ∈ {Overdue, Needs maintenance}`):

1. **Tullahan River wall repair, Tinajeros** — `project_id mal-wall`, type Dike, responsible office
   *District Engineer, DPWH Malabon-Navotas District Engineering Office*. Status Delayed (30%),
   deadline 2026-05, **gap = Overdue**. Interim measure on record: a temporary sandbag line covers
   the 120-m gap and does not hold against a strong high tide. *(source: `projects.csv:mal-wall`)*
2. **Flood early-warning sensors (6 sites)** — `project_id mal-sensor`, type Warning, responsible
   office *City DRRM Officer, Malabon CDRRMO*. Completed (100%) but **gap = Needs maintenance**: two
   of six sensors offline since August. Interim measure on record: manual watchers at the two
   offline sites during advisories. *(source: `projects.csv:mal-sensor`)*

Why these matter this season: the city's hardest-hit riverside stretch has a physical opening in its
flood wall **and** reduced automated warning coverage going into the wet/typhoon season.

**Live conditions:** for whether a hazard is active over Malabon right now, follow the official
sources — PAGASA (https://www.pagasa.dost.gov.ph/) and NDRRMC (https://ndrrmc.gov.ph/). I don't
report live warnings from memory, and I can't call any area safe.

**Citations:** `cities.csv` (malabon row), `projects.csv:mal-wall`, `projects.csv:mal-sensor`.
**Sample-data flag:** yes. **Risk level:** read from `cities.csv`, not recomputed (S4).

---

## Q2 — "Which offices have not replied to follow-ups?"

**Answer (sample data).** Using the sample data, an office counts as **"no reply"** when its
projects have `followups_sent > 0` and `followups_replied = 0`. Across `projects.csv`, **five
responsible offices** have outstanding follow-ups with no reply recorded:

| Responsible office | Project (id) | sent | replied | status |
|---|---|---:|---:|---|
| District Engineer, DPWH Pangasinan District Engineering Office | Pantal River dike raising, Phase 2 (`dag-dike`) | 1 | 0 | No reply |
| District Engineer, DPWH Malabon-Navotas District Engineering Office | Tullahan River wall repair (`mal-wall`) | 2 | 0 | No reply |
| District Engineer, DPWH Albay 2nd District Engineering Office | Yawa River lahar dike extension (`leg-lahar`) | 1 | 0 | No reply |
| City Engineer, Iloilo City Engineering Office | Pumping station, La Paz (`ilo-pump`) | 1 | 0 | No reply |
| City DRRM Officer, Cagayan de Oro CDRRMO | River level telemetry upgrade (`cdo-telemetry`) | 1 | 0 | No reply |

For contrast, offices that **have** replied in the sample data (not in the no-reply list) include
Dagupan City Engineering (`dag-drain`), Malabon CDRRMO (`mal-sensor`), DPWH Metro Manila 2nd
(`mar-wall`), and DPWH Leyte 1st (`tac-embank`).

This is neutral status reporting: "No reply recorded" after the follow-up clock — not a judgment
about any office.

**Citations:** `projects.csv` — fields `responsible_office`, `followups_sent`, `followups_replied`
on rows `dag-dike`, `mal-wall`, `leg-lahar`, `ilo-pump`, `cdo-telemetry`.
**Sample-data flag:** yes.

---

## Q3 — "Draft the household section for an orange rainfall warning in Legazpi."

**Answer (DRAFT — sample data).** Below is a **DRAFT** household section for reviewer approval
(Ripples Reviewer, D7). It is grounded in Legazpi's sample advisory and sample data; it is not a
live warning.

The sample advisory on record is **`legazpi-a1` — Orange rainfall warning** (`advisories.csv`,
type Rain, level **Orange**, `hazard_points = 2`, source "PAGASA (sample)"). The level is read from
the advisory record, not computed.

> **DRAFT — For households (Legazpi City, Orange rainfall warning) — sample data**
>
> An Orange rainfall warning means flooding is threatening. If you live near the **Yawa River** or
> the **lahar channels off Mayon**, prepare to evacuate now and move valuables and vehicles to
> higher ground. Go to your nearest evacuation center when advised: **Albay Astrodome** (capacity
> ~2,500), **Bogtong evacuation center** (~800), or the **Legazpi Port district school** (~600)
> *(evacuation_centers.csv: legazpi-ev1/ev2/ev3)*. Note that the **Yawa River lahar dike extension
> is Overdue and not yet started** (`projects.csv:leg-lahar`), so households in the unprotected
> upstream section should pre-evacuate during orange and red warnings rather than wait.
>
> **Follow official warnings and evacuation orders from PAGASA
> (https://www.pagasa.dost.gov.ph/) and NDRRMC (https://ndrrmc.gov.ph/).**

Note: this draft uses the **sample** advisory to show the format. For the current rainfall warning
level over Legazpi, follow PAGASA and NDRRMC directly — I don't issue or confirm live warnings, and
I can't call any area safe.

**Citations:** `advisories.csv:legazpi-a1` (level Orange, read as stored),
`evacuation_centers.csv` (legazpi-ev1/ev2/ev3), `projects.csv:leg-lahar` (Overdue, interim measure).
**Sample-data flag:** yes. **DRAFT:** yes (routes to D7). **Advisory level:** read, not recomputed (S4).

---

## Verification — exit test & safeguards

**Exit test:** PASS. The agent answers all **three canonical questions** from the D6 prompt, and
**each answer carries citations** to the specific file + row (and PAGASA/NDRRMC URLs where live
conditions are referenced).

| Question | Grounded in | Citation present | Sample-data flag |
|---|---|---|---|
| Q1 — Malabon open gaps raising risk | `cities.csv`, `projects.csv:mal-wall`, `:mal-sensor` | ✔ | ✔ |
| Q2 — Offices with no reply | `projects.csv` (5 rows) | ✔ | ✔ |
| Q3 — Legazpi orange-rainfall household section | `advisories.csv:legazpi-a1`, `evacuation_centers.csv`, `projects.csv:leg-lahar` | ✔ | ✔ |

**Safeguards hold:**
- **S1 / CC-1** — No answer says or implies "safe"; every answer defers to and links PAGASA/NDRRMC
  for live warnings. ✔
- **S3** — Neutral language only (`Overdue`, `Needs maintenance`, `No reply recorded`). ✔
- **S4 / CC-4** — `real_risk_level`/`risk_score` and advisory `level` are read from the CSVs as
  stored; nothing is recomputed. ✔
- **S5** — No citizen-reporter identity appears in any answer (evidence not surfaced by name). ✔
- **S7 / CC-7** — Every CSV-grounded answer is flagged as sample data. ✔
- **Draft rule (S2/CC-2)** — The Q3 household section is emitted as **DRAFT** for the Reviewer. ✔
- **Grounding (R10.1)** — All answers come from the space + PAGASA/NDRRMC only. ✔
