# Worked candidate selection — D5a Deadline escalation

**— DRAFT working artifact — sample data.**
**Sample data.** Produced from `data/projects.csv`. Real city/office names are used only to demonstrate the system; this does not describe the real status of any LGU, DPWH, DENR or MMDA record.

**Automation:** D5a "Deadline escalation" · **Daily check** · **`today = 2026-10-02`** (`cities.csv` `as_of = 2026-10`)

Selection rule (R7.1):
```
(status != "Completed" AND deadline < today)      -- Rule A: overdue
OR (maintenance == "Needs maintenance")            -- Rule B: unmaintained
AND no_followup_sent_in_last_30_days               -- recency guard (ledger)
```
Deadlines are `YYYY-MM`; "before today" = deadline month earlier than 2026-10. Fields are read verbatim from the CSV — nothing is recomputed (CC-4 / S4).

---

## Candidates (first run — empty ledger, so the 30-day guard excludes none)

### Rule A — overdue (status ≠ Completed AND deadline < 2026-10)

| project_id | city | project | status | deadline | gap (read) | agency | selected |
|---|---|---|---|---|---|---|---|
| `dag-dike` | Dagupan | Pantal River dike raising, Ph2 | Delayed | 2026-06 | Overdue | DPWH | ✅ |
| **`mal-wall`** | **Malabon** | **Tullahan River wall repair, Tinajeros** | **Delayed** | **2026-05** | **Overdue** | **DPWH** | ✅ **(pilot)** |
| `mar-wall` | Marikina | Riverbank flood wall, Tumana | Delayed | 2026-03 | Overdue | DPWH | ✅ |
| `leg-lahar` | Legazpi | Yawa River lahar dike extension | Not started | 2026-01 | Overdue | DPWH | ✅ |
| `tac-embank` | Tacloban | Storm-surge embankment, city segment | Delayed | 2025-12 | Overdue | DPWH | ✅ |
| `ilo-pump` | Iloilo | Pumping station, La Paz | Delayed | 2026-06 | Overdue | City Gov | ✅ |
| `cdo-telemetry` | Cagayan de Oro | River level telemetry upgrade | Delayed | 2026-04 | Overdue | City Gov | ✅ |
| `dav-floodwall` | Davao | Davao River floodwall, Bucana | Not started | 2026-08 | Overdue | DPWH | ✅ |

### Rule B — unmaintained (maintenance = "Needs maintenance")

| project_id | city | project | status | maintenance | gap (read) | agency | selected |
|---|---|---|---|---|---|---|---|
| `dag-drain` | Dagupan | Downtown drainage declogging & box culverts | Completed | Needs maintenance | Needs maintenance | City Gov | ✅ |
| `mal-sensor` | Malabon | Flood early-warning sensors (6 sites) | Completed | Needs maintenance | Needs maintenance | City Gov | ✅ |
| `leg-seawall` | Legazpi | Boulevard seawall reinforcement | Completed | Needs maintenance | Needs maintenance | DPWH | ✅ |
| `ilo-floodway` | Iloilo | Jaro floodway desilting | Completed | Needs maintenance | Needs maintenance | DPWH | ✅ |

**Total candidates: 12** (8 overdue + 4 needs-maintenance).

---

## Not selected (and why)

| project_id | reason not selected |
|---|---|
| `dag-mangrove`, `mal-pump`, `mar-dredge`, `mar-green`, `leg-evac`, `tac-buffer`, `tac-drain`, `cdo-dike`, `cdo-forest`, `dav-matina`, `dav-cool` | In progress / not started but **deadline is in the future** (≥ 2026-10) and maintenance is not "Needs maintenance". No rule triggers. |
| `dag-tidegate`, `ilo-basin` | Not started but **deadline in the future** (2027-03, 2026-12); maintenance blank. |
| `mal-drain`, `mar-siren`, `leg-mangrove`, `tac-siren`, `ilo-esplanade`, `cdo-reloc`, `dav-forest` | **Completed AND maintenance = OK** — no overdue condition, no maintenance need. |

Hand-check: 32 total projects − 12 selected = 20 not selected. ✅

---

## Recency guard across runs (illustration)

On the **first** daily run the ledger is empty, so all 12 are eligible. Suppose `mal-wall` is drafted, approved, and sent on 2026-10-02; the ledger records `last_followup_sent_at = 2026-10-02`.

- **Next day (2026-10-03):** `mal-wall` still matches Rule A, but the 30-day guard parks it (`sent 1 day ago`) → **not re-selected**. The other 11 (not yet sent) remain eligible.
- **On 2026-11-02 (31 days later):** if still overdue and still no reply resolution requiring a new letter, `mal-wall` becomes eligible again.

This is what prevents the automation from re-pestering an office daily (R7.1 "no follow-up sent in the last 30 days").

---

## Safeguards on this step

- **S4 / CC-4** — every field above (`status`, `deadline`, `maintenance`, `gap`) is read straight from `projects.csv`; no level is recomputed.
- **S3 / CC-3** — only neutral status words appear.
- **S7 / CC-7** — this artifact is labeled sample data.
- Selection causes **no send** — it only produces the candidate list that feeds the per-candidate flow (draft → gate → …).
