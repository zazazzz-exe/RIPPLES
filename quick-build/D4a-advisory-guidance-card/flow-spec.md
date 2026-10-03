# D4a — Advisory guidance card (Quick Flows) — Flow specification

**Component:** Advisory guidance card
**D-ID:** D4a · **Quick feature:** Quick Flows
**Spec:** `ripples-quick-system` · **Implements prompt:** D4a in `quick-prompts.md`
**Requirements:** R4 (1–4), CC-1, CC-2, CC-4 · **Safeguards:** S1, S2, S4, S7
**Status:** Build artifact (repo-side specification of a component that lives in the Quick space)

> All data referenced here is **sample data** (`sample_data = yes`) drawn from `data/`. It uses real
> city names to show how the system works; it does not describe the real status of any LGU, DPWH,
> DENR, MMDA or PAGASA record.

---

## Purpose

Turn one pasted PAGASA/NDRRMC advisory for one city into four-audience guidance, grounded in that
city's **open gaps** and **evacuation centers**. The card is always a **DRAFT** for reviewer
approval (D7), never says any area is "safe," and ends by deferring to the official sources.

## Inputs

| Input | Type | Source | Notes |
|---|---|---|---|
| `advisory_text` | string | pasted from PAGASA or NDRRMC | the raw advisory wording |
| `city_id` | slug | join key | e.g. `malabon`; keys into `cities.csv`, `projects.csv`, `evacuation_centers.csv` |

## Outputs

- One **DRAFT** advisory card in the exact `advisories.csv` column structure (see §Output shape).
- The card is routed to the **Ripples Reviewer** drafts queue (D7). It does not publish or send on
  its own (S2 / CC-2).

---

## Ordered steps

### Step 1 — Classify advisory type and level (fixed rules, Appendix B — never model-scored)

Read the advisory text and assign:

- **Type** — one of: `Heat`, `Rain`, `Flood`, `Typhoon`, `Drought`, `Thunderstorm`, `Coastal`.
- **Level** and **`hazard_points` (0–3)** — taken directly from the Appendix B threshold table below.
  The level/points are a **lookup**, not a judgment. The flow does not invent, re-weight, or
  model-estimate a level (CC-4 / S4). If the text does not clearly map to a row, the flow surfaces
  that gap for the reviewer rather than guessing.

**Appendix B — hazard points (highest-scoring active advisory for the city):**

| Advisory | 0 | 1 | 2 | 3 |
|---|---|---|---|---|
| Heat index (PAGASA) | Caution 27–32°C | Extreme Caution 33–41°C | Danger 42–51°C | Extreme Danger ≥52°C |
| Rainfall warning (PAGASA) | none | Yellow | Orange | Red |
| Flood | none | Watch | Advisory | Warning |
| Tropical cyclone wind signal | none | Signal 1 | Signal 2 | Signal 3–5 |
| Drought | none | Dry condition / dry spell | Drought | — |
| Other (thunderstorm advisory, gale warning, high tide) | — | 1 | — | — |

The resolved `type`, `level`, and `hazard_points` are written to the card and are the same values the
backend rules engine uses for `real_risk_level`; the flow only reads them.

### Step 2 — Look up the city's open gaps and evacuation centers

- **Open gaps** — from `projects.csv`, select rows where `city_id` matches **and** `gap ∈ {Overdue,
  Needs maintenance}`. Capture `project`, `type`, `responsible_office`, `gap`, and `interim_measure`
  for each.
- **Evacuation centers** — from `evacuation_centers.csv`, select rows where `city_id` matches.
  Capture `name` and `capacity_persons`.

### Step 3 — Write four audience sections (2–3 sentences each)

1. **For households** — what to prepare and when to go to which named evacuation center (from Step 2).
2. **For schools** — suggested schedule changes, explicitly deferring to DepEd and LGU announcements.
3. **For farmers** — crops, drainage, irrigation, fisherfolk actions appropriate to the hazard.
4. **For barangay officials** — which **open gaps** (Step 2) matter now and the **interim measure**
   for each, named explicitly.

No section may state or imply any place or person is "safe," "out of danger," or equivalent (S1 / CC-1).
Language stays neutral — `overdue`, `needs maintenance` (S3).

### Step 4 — Append the official-source line

Record the official `source` and issue time, then end the card with the exact line:

> **Follow official warnings and evacuation orders from PAGASA and NDRRMC.**

Official warnings and evacuation orders are deferred to first and last (S1 / CC-1).

### Step 5 — Emit as DRAFT in `advisories.csv` shape

Produce one row in the `advisories.csv` column order and mark it **DRAFT** for the reviewer (S2 /
CC-2). It is not published until approved in D7.

---

## Output shape (`advisories.csv` columns)

```
advisory_id,city_id,type,level,hazard_points,issued,title,source,for_households,for_schools,for_farmers,for_barangay_officials,sample_data
```

The generated card carries a visible **DRAFT** marker (e.g. in the `title`/`source` area and in the
card header shown to the reviewer) until approval. `sample_data = yes`.

---

## Safeguard checklist (must all hold before the card is "done")

- [ ] **S1 / CC-1** — No section says or implies "safe"; card ends deferring to PAGASA & NDRRMC.
- [ ] **S2 / CC-2** — Emitted as **DRAFT**; nothing publishes without reviewer approval (D7).
- [ ] **S3** — Neutral status words only (`overdue`, `needs maintenance`).
- [ ] **S4 / CC-4** — `level` / `hazard_points` are an Appendix B lookup, never model-scored.
- [ ] **S7 / CC-7** — Output states it is **sample data** (`sample_data = yes`).

## Pilot-first

Built and verified against **Malabon City** first (see `sample-malabon-card.md`), then generalized to
any `city_id`.
