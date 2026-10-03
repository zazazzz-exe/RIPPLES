# Worked Sample — D4b Follow-up letter (Malabon, `mal-wall`)

**— DRAFT — for reviewer approval (D7 Ripples Reviewer). Not sent.**
**Sample data.** Generated from the sample CSVs in `data/`. Real city and office names are used only to demonstrate the system; this does not describe the actual status of any LGU or DPWH record.

**Flow:** D4b "Follow-up letter"  ·  **Input `project_id`:** `mal-wall`  ·  **City:** Malabon City (`malabon`)
**Active advisory check:** `advisories.csv` → `malabon-a1` (Coastal / High tide) and `malabon-a2` (Flood / Advisory) are active → conditional hazard sentence **included**.

---

## Letter

To: **District Engineer, DPWH Malabon–Navotas District Engineering Office**
Agency: Department of Public Works and Highways (DPWH)
Re: Status request — Tullahan River wall repair, Tinajeros (sample reference `mal-wall`)
From: Ripples — Climate Defense Map (sample-data demonstration) · On behalf of the City Page follow-up program

Dear District Engineer,

We write regarding the **Tullahan River wall repair in Tinajeros**, a commitment under Malabon City's LCCAP 2020–2030. As recorded in our sample dataset, the project repairs and raises 900 m of river wall along the Tullahan River, where floodwater overtopped during the 2024 typhoon season. The recorded budget is **₱120 million**, with a committed **deadline of May 2026**.

Our records currently show the project's status as **Delayed**, with progress at about **30%**, and the status of the commitment marked **Overdue**. The recorded interim measure is a temporary sandbag line covering the 120-m gap, which the record notes does not hold against a strong high tide. We note that **2 follow-ups** have been recorded for this project with **0 replies** logged to date.

So that this record can be kept accurate and complete, we respectfully request the following:

1. **Current progress and a revised completion date** for the Tullahan River wall repair.
2. **Interim measures** your office recommends for the affected barangays in Tinajeros for the current season.
3. A copy of the **latest progress report**, requested under **Executive Order No. 2, s. 2016 (Freedom of Information)** or the applicable local FOI ordinance.

Your reply will be posted in full on the City Page so residents can read it directly. If no reply is received within **15 working days**, the record will note **"No reply"** for that period.

This defense matters this week because PAGASA (sample) has an active coastal high-tide advisory and a flood advisory for the Tullahan River, which raise the exposure of riverside barangays in Tinajeros while the wall repair is ongoing.

Thank you for your attention to this request. We would be glad to receive your response at your earliest convenience.

Respectfully,
Ripples Follow-up Program (sample-data demonstration)

**— END OF DRAFT —**

---

## Log entry

```
2026-10-02, mal-wall, "District Engineer, DPWH Malabon-Navotas District Engineering Office", drafted
```

---

## Exit-test verification

| Check | Result |
|---|---|
| `project_id` used | **`mal-wall`** — "Tullahan River wall repair, Tinajeros", Malabon City |
| Is Malabon's overdue river wall | ✅ `gap = Overdue`, `type = Dike` (river wall), city `malabon` |
| Marked **DRAFT** | ✅ DRAFT marker at top and bottom; routed to D7, nothing sent (S2/CC-2) |
| Contains all **three requests** | ✅ (1) progress + revised date · (2) interim measures for affected barangays · (3) latest progress report under EO No. 2 s.2016 / local FOI |
| Reply-clock statement | ✅ reply posted on City Page; "No reply" after 15 working days (R5.3) |
| Conditional hazard sentence | ✅ included — `malabon-a1` + `malabon-a2` are active (R5.4) |
| **Neutral** language (S3/CC-3) | ✅ only neutral status words (`Delayed`, `Overdue`); no accusatory terms |
| Never "safe" (S1/CC-1) | ✅ no "safe" phrasing |
| Fixed-rule levels only (CC-4) | ✅ status/gap read from `projects.csv`; advisory read from `advisories.csv`; nothing recomputed |
| Sample data labeled (S7/CC-7) | ✅ header states sample data |

**Commitment / budget / deadline / status / progress / gap all present (R5.1):**
commitment = LCCAP 2020–2030 Tullahan wall repair · budget = ₱120M · deadline = 2026-05 · status = Delayed · progress = 30% · gap = Overdue.
