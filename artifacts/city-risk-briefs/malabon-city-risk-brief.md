# City Risk Brief — Malabon City

**Component:** City risk brief (D3, Quick Research) · **Pilot city:** Malabon City
**Implements:** R3 (1–3), CC-1, CC-7 · **Generated from:** `TEMPLATE-city-risk-brief.md`
**Data as of:** 2026-10 (`cities.csv`)

> **⚠ Sample data.** All commitment, project and status figures below come from the Ripples
> sample CSVs (`sample_data = yes`). Real city names are used to show how the system works.
> This brief does **not** describe the actual status of any Malabon City, DPWH, MMDA, DENR or
> PAGASA record. For live, authoritative warnings, always follow **PAGASA** and **NDRRMC**.

**Real-risk level: High** (`risk_score` 4) — read from `cities.csv`, computed by the fixed
Appendix B rules (hazard points 2 + open-gap points 2). This brief does not recompute it.

---

## 1. Hazard profile

Malabon City (Metro Manila, Luzon; `lat 14.662, lon 120.957`) faces three main climate
hazards per the sample record (`cities.csv.hazards`): **flood, storm surge, and high tide.**
As a low-lying coastal city at the mouth of the Tullahan River, it is exposed to combined
rainfall flooding and tidal backflow, and much of the city sits at or below mean high-water
level.

Recent seasons (external context — cited):
- The Philippines is affected by an average of about 20 tropical cyclones per year, roughly
  half of which make landfall, with the main season spanning July–October. Source:
  [PAGASA — Tropical Cyclone Information](https://www.pagasa.dost.gov.ph/climate/tropical-cyclone-information)
  *(content rephrased for compliance)*.
- Metro Manila flooding is driven by a mix of monsoon rains, tropical cyclones, high tide and
  drainage capacity; NDRRMC situation reports catalogue the affected areas during major
  events. Source: [NDRRMC — Situational Reports](https://ndrrmc.gov.ph/).

The city's exposure to **high tide** compounding river flooding is specifically reflected in
its sample project set (a river wall overtopped during the 2024 typhoon season — see §4).

> Sources for Malabon-specific status are the sample CSVs; the climatological statements above
> are cited to PAGASA and NDRRMC public pages.

---

## 2. Seasonal outlook (next ~3 months)

**No current PAGASA seasonal climate outlook was retrieved for this build.** Rather than
estimate or fabricate a forecast, this brief states that plainly, per R3.2 and the design
doc's error-handling rule.

For the authoritative, current three-month outlook and any active warnings, consult the live
official sources directly:
- PAGASA — Seasonal Climate Outlook: https://www.pagasa.dost.gov.ph/climate/climate-prediction/seasonal-forecast
- PAGASA — Daily Weather / Tropical Cyclone Bulletins: https://www.pagasa.dost.gov.ph/
- NDRRMC: https://ndrrmc.gov.ph/

When a reviewer runs this brief with the D3 Quick Research prompt against the web-crawler
knowledge base, the current PAGASA outlook should be pulled in here and cited. Until then,
**defer to PAGASA and NDRRMC for the live picture.**

---

## 3. Climate commitments (from `projects.csv` — sample data)

Malabon has four LCCAP commitments in the sample data (`LCCAP 2020–2030`). Promises kept on
time: **67%**; maintained: **50%** (`cities.csv`). Status grouping below uses neutral terms
only.

**On track**
- **Floodgate pumping station upgrade** (`mal-pump`, Pump, MMDA — Flood Control and Sewerage
  Management Office). In progress, 70%, deadline 2027-01. Adding two pumps and backup power so
  the floodgate station keeps running during outages. No open gap. *(sample data)*
- **Barangay drainage mains, Longos** (`mal-drain`, Drainage, City Engineer). Completed (100%,
  finished a month early), maintenance OK, inspected quarterly. *(sample data)*

**Overdue**
- **Tullahan River wall repair, Tinajeros** (`mal-wall`, Dike, DPWH — Malabon-Navotas DEO).
  Delayed, 30%, deadline 2026-05, `gap = Overdue`. *(sample data)*

**Needs maintenance**
- **Flood early-warning sensors, 6 sites** (`mal-sensor`, Warning, City DRRM Officer / CDRRMO).
  Completed (100%) but `maintenance = Needs maintenance`: two of six units offline since
  August. *(sample data)*

Open-gap count: **2** (one Overdue, one Needs maintenance) — matches `gap_points = 2`.

---

## 4. Open gaps that matter most + interim measures

Ranked by what matters most for the coming wet/typhoon season.

**(1) Tullahan River wall repair, Tinajeros — `mal-wall` (Overdue)**
Responsible office: *District Engineer, DPWH Malabon-Navotas District Engineering Office.*
Scope: repairing/raising 900 m of river wall where floodwater overtopped during the 2024
typhoon season.
- **Interim measure (from CSV):** a temporary sandbag line covers the 120-m gap; it does not
  hold against a strong high tide.
- **Current condition (cited sample evidence):** citizen photo report, 2026-09 — "Gap in the
  wall still open, sandbags displaced" (`evidence.csv:mal-wall-e1`); satellite check, 2026-07
  — "No construction activity visible at the site" (`mal-wall-e3`).

**(2) Flood early-warning sensors (6 sites) — `mal-sensor` (Needs maintenance)**
Responsible office: *City DRRM Officer, Malabon CDRRMO.*
Scope: six water-level sensors that trigger sirens; two offline since August.
- **Interim measure (from CSV):** manual watchers at the two offline sites during advisories.
- **Current condition (cited sample evidence):** citizen photo report, 2026-09 — "Sensor at
  Tonsuya bridge has no power light" (`evidence.csv:mal-sensor-e1`); LGU update, 2026-08 —
  "Two units offline, batteries for replacement" (`mal-sensor-e2`).

These two gaps together mean the city's hardest-hit riverside stretch has a physical opening
in its flood wall **and** reduced automated warning coverage going into the season — the
reason interim measures matter now.

---

## 5. Recommended actions

**For the city DRRMO (three):**
1. Keep manual river watchers posted at the open Tullahan wall section (`mal-wall`) and the
   two offline sensor sites (`mal-sensor`) whenever PAGASA raises a rainfall or wind-signal
   advisory; relay readings on a fixed schedule.
2. Follow up with the DPWH Malabon-Navotas DEO for a revised completion date and interim
   reinforcement of the 120-m sandbag gap before the peak season (neutral status request;
   route any letter through the Ripples Reviewer).
3. Confirm readiness and signage for the city's evacuation centers — Malabon National High
   School (1,500), Tonsuya covered court (400), City hall annex (800) — and pre-position the
   CDRRMO on the Tonsuya side nearest the open wall gap.

**For residents (three):**
1. Follow PAGASA and NDRRMC advisories directly; do not wait for the local sirens, since two
   warning sensors are currently offline.
2. Know your nearest evacuation center in advance — Malabon National High School, Tonsuya
   covered court, or City hall annex — and the route that avoids the Tullahan riverside gap.
3. If you see a worsening condition at a flood defense (e.g., displaced sandbags, a dark
   sensor), report it through the barangay/partner channel so it can be corroborated — your
   identity is never published.

---

## Official-source line
**Follow official warnings and evacuation orders from PAGASA
(https://www.pagasa.dost.gov.ph/) and NDRRMC (https://ndrrmc.gov.ph/).** This brief does not
and cannot declare any area safe.

---

## Verification — exit test & safeguards

**Exit test:** PASS. The brief contains **all five required sections** (hazard profile;
seasonal outlook; commitments; open gaps + interim measures; three actions each for DRRMO and
residents) and cites PAGASA and NDRRMC sources. The seasonal outlook handles the "no current
PAGASA outlook" case explicitly, with live PAGASA/NDRRMC links provided.

**Safeguards:**
- S1 / CC-1 — No "safe" claim; defers to and links PAGASA/NDRRMC. ✔
- S3 — Neutral language only (`overdue`, `needs maintenance`, `on track`). ✔
- S4 / CC-4 — `real_risk_level` High / `risk_score` 4 quoted from `cities.csv`, not recomputed. ✔
- CC-7 / S7 — Sample-data labeled at top and in the commitments section. ✔
- R3.2 — External facts cited; missing PAGASA outlook stated plainly. ✔
