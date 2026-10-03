# D4a — Worked sample: Malabon advisory guidance card (DRAFT)

**Component:** Advisory guidance card (D4a) · **Pilot city:** Malabon City
**Purpose:** verify the Task 4a exit test — a sample Malabon advisory yields a 4-section DRAFT card
that never says "safe" and ends with the PAGASA/NDRRMC line.

> **SAMPLE DATA.** Generated from `data/` (`sample_data = yes`). Uses the real city name Malabon to
> show how the flow works; it does not describe the real status of any LGU, DPWH, MMDA or PAGASA
> record.

---

## Flow trace

### Input
- `advisory_text`: *"PAGASA Flood Advisory, 02 Oct 2026 09:00 — The Tullahan River is rising and is
  above normal. Riverside residents should be ready. Issued by PAGASA (sample)."*
- `city_id`: `malabon`

### Step 1 — Classify (Appendix B lookup, fixed rule — not model-scored)
- **Type:** `Flood`
- **Level:** `Advisory` → Appendix B *Flood → Advisory* = **`hazard_points = 2`**
  (level and points read from the fixed threshold table; the flow does not score them).

### Step 2 — Open gaps + evacuation centers (from CSVs)

Malabon open gaps (`projects.csv`, `gap ∈ {Overdue, Needs maintenance}`):

| project_id | project | type | responsible_office | gap | interim_measure |
|---|---|---|---|---|---|
| `mal-wall` | Tullahan River wall repair, Tinajeros | Dike | District Engineer, DPWH Malabon-Navotas DEO | **Overdue** | Temporary sandbag line covers the 120-m gap; it does not hold against a strong high tide. |
| `mal-sensor` | Flood early-warning sensors (6 sites) | Warning | City DRRM Officer, Malabon CDRRMO | **Needs maintenance** | Manual watchers at the two offline sites during advisories. |

(2 open gaps → matches `cities.csv` `gap_points = 2` for Malabon. `mal-pump` is In progress and
`mal-drain` is Completed/OK, so neither is an open gap.)

Malabon evacuation centers (`evacuation_centers.csv`):

| center_id | name | capacity_persons |
|---|---|---|
| `malabon-ev1` | Malabon National High School | 1500 |
| `malabon-ev2` | Tonsuya covered court | 400 |
| `malabon-ev3` | City hall annex | 800 |

### Steps 3–5 — Four sections, official-source line, emit DRAFT (below)

---

## DRAFT advisory card — Malabon City

> **DRAFT — for reviewer approval (D7). Not published. Sample data.**

**Advisory:** Flood Advisory — Tullahan River above normal
**City:** Malabon City (`malabon`) · **Type:** Flood · **Level:** Advisory (hazard points 2, Appendix B)
**Issued:** 2026-10-02 09:00 · **Source:** PAGASA (sample)

**For households**
Move vehicles, appliances and valuables to higher floors now, and pack a go-bag with documents,
water and medicine. Riverside residents in Tinajeros and along the Tullahan should be ready to move
to the nearest evacuation center — Malabon National High School (1,500), Tonsuya covered court (400)
or the City Hall annex (800) — if the river keeps rising. Follow your barangay's go-signal.

**For schools**
Prepare to adjust or shorten schedules for campuses in riverside barangays and avoid ground-floor
rooms near the river. Any suspension or dismissal follows DepEd and Malabon LGU announcements.

**For farmers**
Fishpond and sluice-gate operators along the Tullahan should secure gates and nets before the river
peaks and move harvestable stock out of low-lying ponds. Clear field and pond drains so rising water
can pass.

**For barangay officials**
Two open gaps matter now. The Tullahan River wall repair in Tinajeros is **overdue**; the interim
measure is the temporary sandbag line over the 120-m gap, which does not hold against a strong high
tide, so station a watcher there and pre-position more sandbags. The flood early-warning sensors
**need maintenance** with two sites offline; the interim measure is manual watchers at those two
sites during this advisory.

**Follow official warnings and evacuation orders from PAGASA and NDRRMC.**

---

## Emitted row — `advisories.csv` shape (DRAFT)

```
advisory_id,city_id,type,level,hazard_points,issued,title,source,for_households,for_schools,for_farmers,for_barangay_officials,sample_data
malabon-draft-d4a,malabon,Flood,Advisory,2,2026-10-02 09:00,[DRAFT] Flood advisory: Tullahan River above normal,PAGASA (sample) — DRAFT pending reviewer approval,"Move vehicles, appliances and valuables to higher floors now, and pack a go-bag with documents, water and medicine. Riverside residents in Tinajeros and along the Tullahan should be ready to move to the nearest evacuation center — Malabon National High School (1,500), Tonsuya covered court (400) or the City Hall annex (800) — if the river keeps rising. Follow your barangay's go-signal.","Prepare to adjust or shorten schedules for campuses in riverside barangays and avoid ground-floor rooms near the river. Any suspension or dismissal follows DepEd and Malabon LGU announcements.","Fishpond and sluice-gate operators along the Tullahan should secure gates and nets before the river peaks and move harvestable stock out of low-lying ponds. Clear field and pond drains so rising water can pass.","Two open gaps matter now. The Tullahan River wall repair in Tinajeros is overdue; the interim measure is the temporary sandbag line over the 120-m gap, which does not hold against a strong high tide, so station a watcher there and pre-position more sandbags. The flood early-warning sensors need maintenance with two sites offline; the interim measure is manual watchers at those two sites during this advisory. Follow official warnings and evacuation orders from PAGASA and NDRRMC.",yes
```

---

## Exit-test verification

| Check | Result |
|---|---|
| 4 audience sections (households, schools, farmers, barangay officials) | ✅ all four present |
| Never says "safe" / "out of danger" | ✅ no such phrasing anywhere |
| Ends with the PAGASA/NDRRMC line | ✅ "Follow official warnings and evacuation orders from PAGASA and NDRRMC." |
| Emitted as DRAFT (S2/CC-2) | ✅ DRAFT markers in header, title and source |
| Level from fixed rule, not model (S4/CC-4) | ✅ Flood→Advisory→2 via Appendix B lookup |
| Grounded in Malabon open gaps + evac centers (R4.2) | ✅ `mal-wall`, `mal-sensor`; 3 named centers |
| Sample-data labeled (S7/CC-7) | ✅ labeled in header; `sample_data = yes` |
| Neutral language (S3) | ✅ "overdue", "needs maintenance" only |
