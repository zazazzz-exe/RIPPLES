# Automation specification — Typhoon event playbook (D5b)

**Component:** D5b — Typhoon event playbook
**D-ID:** D5b
**Quick feature:** Quick Automate
**Implements:** `quick-prompts.md` → "D5b. Typhoon event playbook"; design.md → "D5b — Typhoon event playbook" + "Data flow — typhoon event (sequence)"
**Satisfies:** Requirement 8 (1–5), CC-1 (S1), CC-2 (S2); carries CC-3 (S3), CC-4 (S4), CC-7 (S7)
**Depends on:** 4.1 (D4a Advisory guidance card), 6.1 (D5a Deadline escalation), 2 (D2 Ripples Climate Scorecard), and the D7 Ripples Reviewer app (the approval gate)
**Operating-model stage:** Protect (with a Push hand-off to D5a)
**Pilot city:** Malabon City (built and verified against Malabon first, then generalized)
**Status:** Build artifact (sample data). This is the configuration contract for the Quick Automate automation; the automation itself lives inside the Quick space.

> **Sample data.** This automation reads the sample CSVs in `data/` (`cities.csv`, `projects.csv`, `advisories.csv`, `evacuation_centers.csv`). Every artifact it produces states it is sample data and uses real city/office names only to show how the system works — it does not describe the real status of any LGU, DPWH, DENR, MMDA or PAGASA record. **No advisory card, notice or letter is ever posted or sent by this playbook; it only queues DRAFTS and sends the team an internal status message. All demo sends go to test addresses only (S2 / CC-2).**

---

## 1. Purpose

When a tropical cyclone wind signal is raised over tracked cities, prepare **every affected city at once** so guidance and escalations are ready for a reviewer the moment the signal lands. For each affected city the playbook:

1. runs the **D4a Advisory guidance card** flow with the signal advisory (four-audience DRAFT card),
2. drafts an **interim-measure notice** that lists the city's open gaps for barangay officials (DRAFT),
3. queues the **D5a Deadline escalation** steps for that city's **overdue flood / drainage / dike / pump / seawall** projects, with a note that the advisory is active,
4. refreshes the **D2 Ripples Climate Scorecard**, and
5. sends the **team** an internal status message (cities affected, real-risk levels, open gaps in the path, drafts awaiting approval).

**Everything the playbook produces is a DRAFT.** The playbook stops at the D7 reviewer gate: it never sends an advisory card to the public, never posts a notice, and never emails a follow-up letter on its own. It only *prepares and queues* drafts and sends the team a heads-up. The one message it sends without approval is the **internal team status message**, which is team-facing situational awareness, not a public advisory or an office letter.

---

## 2. Why this cannot run before D7

Build order is `D0 → D4 flows → D7 Reviewer → D5 automations`. This playbook mass-produces drafts (one advisory card + one interim-measure notice per affected city, plus queued letters). Without the D7 gate there would be no `review_state` to hold those drafts behind, and the mass of generated content could escape ungated — a direct S2/CC-2 violation at the worst possible moment (an active storm). So D7 ships first; D5b sets `review_state = DRAFT` on everything it creates and never sets `APPROVED` itself. Approval, sharing and sending remain entirely with a human in D7 (and the actual sends are performed by D5a / D4a's own gated paths, never by this playbook).

---

## 3. Interface

| | |
|---|---|
| **Trigger** | A tropical cyclone **wind signal is raised** for one or more cities in `cities.csv`. In this version the signal is entered **manually** by the team (PAGASA auto-feed is future work). Input: `{signal_level, affected_city_ids[], issued_at, source}`. |
| **Reads** | `data/cities.csv` (affected-city join, `real_risk_level`/`risk_score` read-only), `data/projects.csv` (open gaps, overdue flood-related projects), `data/advisories.csv` (card shape), `data/evacuation_centers.csv` (via D4a). |
| **Calls** | **D4a** Advisory guidance card (per affected city); **D5a** Deadline escalation steps (per qualifying overdue flood-related project); **D2** scorecard refresh; the team messaging connector (internal status message). |
| **Writes** | Its own run-state ledger (per-city card ref, notice ref, queued escalation refs, draft states). It never writes back to the source CSVs. |
| **Sends** | **Nothing public.** Advisory cards / notices / letters are DRAFTS routed to D7 and are only ever sent by their own gated paths after a human approves. The sole outbound message is the **internal team status message** (team test channel). |
| **Output** | Per affected city: one DRAFT advisory card (D4a) + one DRAFT interim-measure notice; queued (DRAFT) D5a escalation steps for overdue flood-related projects with an advisory-active note; a refreshed D2 scorecard; one team status message. All DRAFT until approved in D7. |

---

## 4. Trigger & affected-city resolution (R8.1)

`today` for this build = **2026-10-02** (`cities.csv` `as_of = 2026-10`), matching the D4a / D5a sample artifacts.

The team raises a signal by entering `{signal_level, affected_city_ids[], issued_at, source}`. The playbook iterates the listed `affected_city_ids` (each must exist in `cities.csv`; an unknown id is surfaced as a visible gap, never guessed). For each affected city it builds the signal **advisory** to hand to D4a:

```
type   = Typhoon              (tropical cyclone wind signal)
level  = "Signal N"           (as raised, e.g. Signal 3)
source = PAGASA (sample) — manual entry by the team, issued_at
```

### Advisory LEVEL classification is a fixed-rule lookup, never model scoring (S4 / CC-4)

The "pushes affected cities to the expected level" in the exit test means the **advisory level** is read from the fixed Appendix B threshold table — it is a lookup, not a judgment, and the playbook does not re-weight or model-estimate anything:

**Appendix B — tropical cyclone wind signal → hazard points (highest-scoring active advisory):**

| Advisory | 0 | 1 | 2 | 3 |
|---|---|---|---|---|
| Tropical cyclone wind signal | none | Signal 1 | Signal 2 | **Signal 3–5** |

So a raised **Signal 3** → **`hazard_points = 3`** by fixed rule. The backend rules engine (Appendix B) bands `risk_score = hazard_points + gap_points (0–3, capped)` into Low (0–1) / Moderate (2–3) / High (4) / Critical (5–6). The playbook **reads** this result through D4a and the D2 scorecard; it never computes it. For Malabon, the city's precomputed `gap_points = 2` plus a Signal-3 `hazard_points = 3` gives `risk_score = 5 → Critical` — the expected level for the exit test (and the same jump the mockup demo shows: "Malabon goes Critical").

> The source `cities.csv` row stores Malabon's *baseline* `hazard_points = 2` / `risk_score = 4 / High` from its everyday advisories. Under a raised Signal 3 the fixed Appendix B rule yields `hazard_points = 3`; the backend recomputes the band to Critical. The playbook does not edit the CSV — it reads the rules-engine result and reflects it on the refreshed scorecard (CC-4).

---

## 5. Per-affected-city pipeline

For each affected city, in order. Malabon is worked end-to-end in `worked-run-malabon.md`.

### Step 1 — Run the D4a Advisory guidance card (R8.1)
Call the **D4a** flow with `{advisory_text = the Signal-N advisory, city_id}`. D4a classifies type/level by Appendix B lookup (Typhoon / Signal N → hazard points), looks up the city's open gaps (`gap ∈ {Overdue, Needs maintenance}`) and evacuation centers, writes the **four audience sections** (households, schools, farmers, barangay officials), and ends with the deferral line *"Follow official warnings and evacuation orders from PAGASA and NDRRMC."* The card is returned as a **DRAFT** in `advisories.csv` shape. The playbook adds no guidance language of its own (S1/S3 handled inside D4a's guards).

### Step 2 — Draft the interim-measure notice for barangay officials (R8.2)
Assemble a short **DRAFT** notice addressed to the city's barangay officials that **lists the city's open gaps** (from `projects.csv`, `gap ∈ {Overdue, Needs maintenance}`) and, for each, its recorded **`interim_measure`** verbatim. The notice is neutral (`overdue`, `needs maintenance` only), carries a DRAFT + sample-data marker, and is routed to the D7 Drafts queue. It is a distinct artifact from the D4a card (the card is four-audience guidance; the notice is an officials-only open-gap worklist).

### Step 3 — Queue D5a escalation steps for overdue flood-related projects (R8.3)
From the affected city's projects select those that are **overdue AND flood-related**:

```
SELECT project WHERE city_id ∈ affected
  AND gap == "Overdue"                                   -- overdue (read, not recomputed)
  AND type ∈ { Dike, Drainage, Pump, Seawall }           -- flood / drainage / dike / pump / seawall
```

(`Dike` covers river-wall / flood-wall / dike works such as `mal-wall`.) For each selected project, **queue the D5a Deadline escalation steps** (D4b draft → reviewer gate → test-contact send → clock) with an **advisory-active note** attached (`advisory_active = yes; signal = Signal N; issued_at`). D5a's own reviewer gate still applies — queuing here does **not** send anything; D5a blocks on `review_state = DRAFT` exactly as in its own spec. The advisory-active note is what makes D4b add its one hazard sentence ("why this defense matters this week"). Projects that are **Needs maintenance** but not **Overdue** (e.g. `mal-sensor`) are listed in the Step-2 notice but are **not** queued for escalation (the rule is *overdue* flood-related).

### Step 4 — Refresh the D2 scorecard (R8.4)
Trigger a refresh of the **Ripples Climate Scorecard** so the national map, KPI tiles and city table reflect the raised signal. The scorecard reads `real_risk_level` / `risk_score` from the rules engine (Appendix B) — the refresh **shows** the Critical banding for affected cities; the playbook does not compute or write it (CC-4).

### Step 5 — Send the team status message (R8.4)
Send the **team** (internal test channel) one situational-awareness message:

- **Cities affected** and the raised signal.
- **Real-risk levels** for each (read from the refreshed scorecard / rules engine).
- **Open gaps in the path** (the overdue flood-related projects queued in Step 3, plus other open gaps listed).
- **Drafts awaiting approval** — the per-city advisory cards, interim-measure notices, and queued escalation letters now sitting in the D7 Drafts queue.

This message is **team-facing** and informational: counts and neutral status words only, no accusatory language (S3), and it never says any city is "safe" (S1). It is the only message the playbook sends without approval, and it goes to a **test** channel.

### Step 6 — Stop at the gate (R8.5)
The playbook **ends here**. Every advisory card, interim-measure notice and queued escalation letter remains `review_state = DRAFT`. Nothing is shared, posted or emailed to any office. A human must open each item in **D7** and approve it; only then do the respective gated paths (D4a publish, D5a send-to-test-contact) run. The playbook never sets `APPROVED`.

---

## 6. Run-state ledger (what the playbook stores)

The playbook never mutates the source CSVs. It keeps a per-run ledger so a storm run is idempotent and auditable.

```
# per run
run_id
signal_level                 # e.g. "Signal 3"
issued_at , source           # source = PAGASA (sample) — manual entry
affected_city_ids[]
sample_data = yes

# per affected city
city_id
advisory_card_ref            # D7 Drafts item, e.g. draft-malabon-typhoon-card
notice_ref                   # D7 Drafts item, e.g. draft-malabon-interim-notice
queued_escalations[]         # D5a step refs for overdue flood-related projects (advisory_active=yes)
real_risk_level              # read from rules engine / D2 (never computed here)
review_states                # mirror of D7 states: all DRAFT until a human decides
```

---

## 7. Safeguard checklist (must all hold before "done")

| ID | Check | How this playbook satisfies it |
|---|---|---|
| **S1 / CC-1** | Never "safe"; defer to & link PAGASA/NDRRMC | Produces no guidance of its own; every D4a card ends with the PAGASA/NDRRMC deferral line; the team status message states risk levels and open gaps, never that any city is "safe." |
| **S2 / CC-2** | DRAFT until approved; no auto-send/post; demo sends to test addresses | Every card, notice and queued letter is `review_state = DRAFT`; the playbook **posts/sends nothing public** and stops at the D7 gate; the only outbound message is the internal **team** status message to a **test** channel. Actual sends run only via D5a/D4a's own gated paths after human approval. |
| **S3 / CC-3** | Neutral language only | Only neutral status words (`overdue`, `needs maintenance`); the notice carries each project's recorded `interim_measure` verbatim; the team message reports counts and levels, no judgements. |
| **S4 / CC-4** | Fixed-rule levels only | Advisory level is an **Appendix B lookup** (Signal 3–5 → hazard points 3); real-risk banding comes from the rules engine; the playbook reads `real_risk_level`/`risk_score` and never re-weights or model-scores them. |
| **S7 / CC-7** | Sample data labeled | Every card, notice, team message and ledger row states sample data (`sample_data = yes`). |
| **(gate)** | No D5 send/post before a D7 approval | The playbook can prepare a full storm's worth of drafts and still cause **zero** public sends/posts; a send is reachable only from the `APPROVED` branch of D5a/D4a, decided by a human in D7. |

S5 (reporter identity) and S6 (report corroboration) are not exercised — the playbook handles advisories and projects, not citizen reports. (n/a)

---

## 8. Error handling & edge cases

- **Unknown `city_id` in the affected list:** skip it and surface a visible gap in the run log; never guess coordinates or a risk level (design: "surface a visible gap rather than guessing").
- **A city has no overdue flood-related project:** Step 3 queues zero escalations for it; Steps 1–2 (card + notice) and the team message still run. A city with no open gaps at all still gets a card and a notice (the notice simply lists "no open gaps recorded"); the card never implies the city is "safe."
- **Advisory text does not map to an Appendix B row:** D4a surfaces the classification gap for the reviewer rather than inventing a level (CC-4).
- **Reviewer never decides / rejects:** drafts stay at `DRAFT` (nothing public happens) or are logged `rejected`; the storm run is safe by default.
- **D2 refresh unavailable:** log the refresh failure and still send the team message with the levels read directly from the rules engine; do not fabricate a dashboard state.
- **Multiple cities affected:** each city is processed independently; one city's missing data never blocks the others.

---

## 9. Exit test (Requirement 8)

> A sample **Signal 3** pushes affected cities to the expected level, generates 4-audience advisory cards, and leaves drafts awaiting approval.

Verified in `worked-run-malabon.md`:
1. A sample **Signal 3** is raised for Malabon (manual team entry). By fixed Appendix B lookup, Signal 3–5 → `hazard_points = 3`; with Malabon's precomputed `gap_points = 2`, the rules engine bands `risk_score = 5 → **Critical**` — the expected level (CC-4).
2. The playbook runs **D4a** and produces the **four-audience** advisory card (households, schools, farmers, barangay officials) as a DRAFT ending in the PAGASA/NDRRMC line.
3. It drafts the interim-measure notice (open gaps `mal-wall` Overdue, `mal-sensor` Needs maintenance), queues **D5a** for the overdue flood-related `mal-wall` (Dike) with an advisory-active note, refreshes **D2**, and sends the **team** status message.
4. **Every output is left as DRAFT in D7**; nothing is posted or sent to any office. Drafts await approval.

Generalization to all affected cities is noted at the end of the worked run.

---

## 10. Build notes — configuring this in Quick Automate

1. **Trigger:** a manual-entry form (Quick Automate manual trigger) collecting `signal_level`, `affected_city_ids` (multi-select from `cities.csv`), `issued_at`, `source`. (PAGASA auto-feed is future work.)
2. **Loop:** "for each affected city" → sub-steps call the **D4a flow** (built in Wave 2) and compose the interim-measure notice from `projects.csv` open-gap rows.
3. **Escalation hand-off:** filter `projects.csv` to `gap = Overdue AND type ∈ {Dike, Drainage, Pump, Seawall}` for affected cities; invoke the **D5a** steps with `advisory_active = yes`. D5a's reviewer gate is unchanged.
4. **Scorecard refresh:** call the D2 dataset refresh action.
5. **Team message:** compose from the ledger and send to the team **test** channel via the messaging connector.
6. **Gate everything:** set `review_state = DRAFT` on every card/notice/queued letter; never set `APPROVED` in this automation. Enable this automation **only after** D7 exists and D4a + D5a are built (dependencies 4.1, 6.1, 2).
7. **Assumptions:** `today = 2026-10-02` (from `cities.csv as_of`); signal is entered manually; "flood-related" = project `type ∈ {Dike, Drainage, Pump, Seawall}` (Dike covers river-wall / flood-wall / dike works); test channel + test contacts only.
