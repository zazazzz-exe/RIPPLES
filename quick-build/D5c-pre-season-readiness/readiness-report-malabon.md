# Pre-season readiness report — Malabon City

**DRAFT — not approved. Not shared or posted.**
Component: Pre-season readiness (D5c, Quick Automate) · Routed to: Ripples Reviewer (D7)
Review state: **DRAFT** · Queue item: `draft-malabon-readiness`
Real-risk level: **High** (`risk_score` 4) — read from `cities.csv` (fixed-rule, CC-4; hazard points 2 + open-gap points 2). This report does not recompute it.
Data as of: 2026-10 (`cities.csv`)

> **⚠ Sample data.** Every figure below comes from the Ripples sample CSVs (`sample_data = yes`)
> and the D3 Malabon brief / D2 Climate Scorecard built from them. Real city, office and agency
> names are used only to show how the system works. This report does **not** describe the actual
> status of any Malabon City, DPWH, MMDA, DENR or PAGASA record. For live, authoritative warnings
> and evacuation orders, always follow **PAGASA** and **NDRRMC**.

**Official-source line (first, S1/CC-1):** Follow official warnings and evacuation orders from
**PAGASA** (https://www.pagasa.dost.gov.ph/) and **NDRRMC** (https://ndrrmc.gov.ph/). This report
cannot and does not declare any area safe.

---

## Section A — Scorecard slice (from D2 Ripples Climate Scorecard) — sample data

Malabon City's row from the Ripples Climate Scorecard, read-only. The risk level and score are read
from `cities.csv` by the fixed Appendix B rules and are **not** recomputed here (CC-4).

| Field | Value | Source |
|---|---|---|
| Real-risk level | **High** — orange (`#e67e22`, D2 §3.2 palette) | `cities.csv.real_risk_level` |
| Risk score | **4** | `cities.csv.risk_score` |
| Promises kept on time | **67%** | `cities.csv.promises_kept_pct` |
| Maintained OK | **50%** | `cities.csv.maintained_pct` |
| Open gaps | **2** — 1 Overdue + 1 Needs maintenance | `projects.csv` (`gap ∈ {Overdue, Needs maintenance}`) |
| Follow-ups sent / replied | **3 sent / 1 replied** | `projects.csv.followups_sent` / `followups_replied` |

Neutral reading: of the follow-ups logged for Malabon's responsible offices, two have **no reply
recorded**. Open-gap count **2** matches `gap_points = 2` in the fixed risk read.

---

## Section B — City risk brief (from D3)

*(Assembled from `artifacts/city-risk-briefs/malabon-city-risk-brief.md` — all five D3 sections.)*

### B.1 Hazard profile
Malabon City (Metro Manila, Luzon; `lat 14.662, lon 120.957`) faces three main climate hazards per
the sample record (`cities.csv.hazards`): **flood, storm surge, and high tide.** As a low-lying
coastal city at the mouth of the Tullahan River, it is exposed to combined rainfall flooding and
tidal backflow, with much of the city at or below mean high-water level.

External context (cited):
- The Philippines is affected by an average of about 20 tropical cyclones per year, roughly half
  making landfall, with the main season spanning July–October. Source:
  [PAGASA — Tropical Cyclone Information](https://www.pagasa.dost.gov.ph/climate/tropical-cyclone-information)
  *(content rephrased for compliance)*.
- Metro Manila flooding is driven by a mix of monsoon rains, tropical cyclones, high tide and
  drainage capacity. Source: [NDRRMC — Situational Reports](https://ndrrmc.gov.ph/).

Real-risk level **High** / `risk_score` **4** are quoted from `cities.csv` (fixed-rule, CC-4).

### B.2 Seasonal outlook (next ~3 months)
**No current PAGASA seasonal climate outlook was retrieved for this build.** Rather than estimate or
fabricate a forecast, this report states that plainly (R3.2). For the authoritative current outlook
and any active warnings, consult the live sources directly:
- PAGASA — Seasonal Climate Outlook: https://www.pagasa.dost.gov.ph/climate/climate-prediction/seasonal-forecast
- PAGASA — Daily Weather / Tropical Cyclone Bulletins: https://www.pagasa.dost.gov.ph/
- NDRRMC: https://ndrrmc.gov.ph/

Until a live outlook is pulled in, **defer to PAGASA and NDRRMC for the current picture.**

### B.3 Climate commitments (from `projects.csv` — sample data)
Malabon has four LCCAP commitments in the sample data (`LCCAP 2020–2030`). Status grouping uses
neutral terms only.

**On track**
- **Floodgate pumping station upgrade** (`mal-pump`, MMDA — Flood Control and Sewerage Management
  Office). In progress, 70%, deadline 2027-01. No open gap. *(sample data)*
- **Barangay drainage mains, Longos** (`mal-drain`, City Engineer). Completed 100%, maintenance OK.
  *(sample data)*

**Overdue**
- **Tullahan River wall repair, Tinajeros** (`mal-wall`, DPWH — Malabon-Navotas DEO). Delayed, 30%,
  deadline 2026-05, `gap = Overdue`. *(sample data)*

**Needs maintenance**
- **Flood early-warning sensors, 6 sites** (`mal-sensor`, City DRRM Officer / CDRRMO). Completed
  100% but `maintenance = Needs maintenance`: two of six units offline since August. *(sample data)*

Open-gap count: **2** (one Overdue, one Needs maintenance) — matches `gap_points = 2`.

### B.4 Open gaps that matter most + interim measures
Ranked by what matters most for the coming wet/typhoon season.

**(1) Tullahan River wall repair, Tinajeros — `mal-wall` (Overdue)**
Responsible office: *District Engineer, DPWH Malabon-Navotas District Engineering Office.*
- **Interim measure (from CSV):** a temporary sandbag line covers the 120-m gap; it does not hold
  against a strong high tide.
- **Current condition (cited sample evidence):** citizen photo report, 2026-09 — "Gap in the wall
  still open, sandbags displaced" (`evidence.csv:mal-wall-e1`); satellite check, 2026-07 — "No
  construction activity visible at the site" (`mal-wall-e3`).

**(2) Flood early-warning sensors (6 sites) — `mal-sensor` (Needs maintenance)**
Responsible office: *City DRRM Officer, Malabon CDRRMO.*
- **Interim measure (from CSV):** manual watchers at the two offline sites during advisories.
- **Current condition (cited sample evidence):** citizen photo report, 2026-09 — "Sensor at Tonsuya
  bridge has no power light" (`evidence.csv:mal-sensor-e1`); LGU update, 2026-08 — "Two units
  offline, batteries for replacement" (`mal-sensor-e2`).

### B.5 Recommended actions
**For the city DRRMO (three):**
1. Keep manual river watchers posted at the open Tullahan wall section (`mal-wall`) and the two
   offline sensor sites (`mal-sensor`) whenever PAGASA raises a rainfall or wind-signal advisory.
2. Follow up with the DPWH Malabon-Navotas DEO for a revised completion date and interim
   reinforcement of the 120-m sandbag gap before peak season (neutral status request; route any
   letter through the Ripples Reviewer).
3. Confirm readiness and signage for the city's evacuation centers — Malabon National High School
   (1,500), Tonsuya covered court (400), City hall annex (800) — and pre-position the CDRRMO on the
   Tonsuya side nearest the open wall gap.

**For residents (three):**
1. Follow PAGASA and NDRRMC advisories directly; do not wait for the local sirens, since two warning
   sensors are currently offline.
2. Know your nearest evacuation center in advance — Malabon National High School, Tonsuya covered
   court, or City hall annex — and a route that avoids the Tullahan riverside gap.
3. If you see a worsening condition at a flood defense (displaced sandbags, a dark sensor), report it
   through the barangay/partner channel so it can be corroborated — your identity is never published.

---

## Section C — Pre-season readiness summary

Malabon City's recorded real-risk level is **High** (`risk_score` 4, read from `cities.csv`, not
recomputed). Going into the season it carries **2 open gaps**: an **Overdue** Tullahan River wall
repair (`mal-wall`) and a **Needs maintenance** early-warning sensor set (`mal-sensor`). Together
these mean the hardest-hit riverside stretch has a physical opening in its flood wall and reduced
automated warning coverage.

Interim measures are in place for both — a sandbag line at the wall gap and manual watchers at the
two offline sensor sites — but neither is a substitute for the permanent fix. The single clearest
pre-season item for the DRRMO is to secure a revised completion date and interim reinforcement for
the `mal-wall` 120-m gap, and to confirm manual-watcher coverage at both offline sensor sites.

Residents should follow **PAGASA** and **NDRRMC** directly for warnings and evacuation orders; with
two sensors offline, do not rely on local sirens alone. This report makes no safety declaration.

*(No new facts and no scoring were introduced in this summary — it synthesizes Sections A and B.)*

---

## Official-source line
Follow official warnings and evacuation orders from **PAGASA** (https://www.pagasa.dost.gov.ph/) and
**NDRRMC** (https://ndrrmc.gov.ph/). This report does not and cannot declare any area safe.

## Routing & approval (S2/CC-2)
Status: **DRAFT.** Routed to the **Ripples Reviewer (D7)**, Drafts queue, as item
`draft-malabon-readiness`. **Not** shared with the DRRMO, Sanggunian or media contacts and **not**
posted on the City Page unless and until a reviewer sets `review_state = APPROVED` in the Reviewer
app. The automation never approves its own report.

---

## Verification — exit test & safeguards

**Exit test:** PASS. This per-city (Malabon) readiness report combines the **D3 brief** (all five
sections, Section B) and the **D2 scorecard slice** (Section A), is marked **DRAFT** + sample data,
and is routed to the reviewer. With `review_state = DRAFT`, nothing is shared or posted.

**Safeguards:**
- S1 / CC-1 — No "safe" claim; official-source line first and last; defers to and links PAGASA/NDRRMC. ✔
- S2 / CC-2 — DRAFT marker visible; routing/approval footer present; share/post gated on APPROVED; demo sends to test addresses. ✔
- S3 — Neutral language only (`overdue`, `needs maintenance`, `on track`, `no reply recorded`). ✔
- S4 / CC-4 — `real_risk_level` High / `risk_score` 4 quoted from `cities.csv`, not recomputed. ✔
- S7 / CC-7 — Sample-data block in header and in Section A. ✔
