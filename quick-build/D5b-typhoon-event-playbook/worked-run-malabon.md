# Worked run — Typhoon event playbook (D5b), pilot city Malabon (Signal 3)

**Component:** Typhoon event playbook · **D-ID:** D5b · **Quick feature:** Quick Automate
**Implements:** R8 (1–5), CC-1, CC-2, CC-4, CC-7 · **Pilot city:** Malabon City
**Purpose:** work one raised **Signal 3** end to end for Malabon — a four-audience advisory card is
generated, affected cities are pushed to the expected fixed-rule level, and every output is left as a
DRAFT awaiting approval. This is the Task 6.2 exit test, worked. Generalization to all affected cities
is noted at the end.

> **⚠ Sample data.** This run uses the Ripples sample CSVs (`sample_data = yes`) and the D4a / D5a
> artifacts built from them. The signal is entered **manually** by the team (no live PAGASA feed in
> this version). Nothing in this run is posted or sent to any real office; the team status message
> goes to a **test** channel. The City Page target is the mockup.

---

## Run parameters

```
Automation:   Typhoon event playbook (D5b)
Trigger:      WIND SIGNAL RAISED — manual team entry
signal_level: Signal 3
affected:     [ malabon ]            (pilot-first; all-cities generalization noted below)
issued_at:    2026-10-02 09:00
source:       PAGASA (sample) — manual entry by the team
today:        2026-10-02  (cities.csv as_of = 2026-10)
Initiated by: team (demo)
```

---

## STEP 0 — Resolve affected city + fixed-rule level (R8.1, S4/CC-4)

`malabon` exists in `cities.csv`. The playbook builds the signal advisory for D4a:

```
type   = Typhoon
level  = Signal 3
source = PAGASA (sample) — manual entry, 2026-10-02 09:00
```

**Advisory level is an Appendix B lookup — not model scoring:**

| Fixed rule (Appendix B) | Value |
|---|---|
| Tropical cyclone wind signal → **Signal 3–5** | `hazard_points = 3` |
| Malabon precomputed open-gap burden (`cities.csv gap_points`) | `gap_points = 2` |
| Rules-engine score = hazard + gap | `3 + 2 = 5` |
| Band (Appendix B: 5–6 = Critical) | **Critical** |

So a raised **Signal 3 pushes Malabon to the expected level — Critical** (up from its baseline
High / score 4). This matches the mockup demo ("Malabon goes Critical"). The playbook **reads** this
rules-engine result; it does not compute, re-weight or edit the CSV (CC-4). ✔

---

## STEP 1 — Run the D4a Advisory guidance card (R8.1)

The playbook calls the **D4a "Advisory guidance card"** flow with
`{advisory_text = Signal 3 — Typhoon, city_id = malabon}`.

- **Classify (Appendix B lookup):** Type `Typhoon`, Level `Signal 3` → `hazard_points = 3`.
- **Open gaps (`projects.csv`, `gap ∈ {Overdue, Needs maintenance}`):** `mal-wall` (Dike, **Overdue**),
  `mal-sensor` (Warning, **Needs maintenance**). (`mal-pump` In progress, `mal-drain` Completed/OK →
  not open gaps.) 2 open gaps — consistent with `cities.csv gap_points = 2`.
- **Evacuation centers (`evacuation_centers.csv`):** Malabon National High School (1,500), Tonsuya
  covered court (400), City hall annex (800).

### DRAFT advisory card — Malabon City (D4a output)

> **DRAFT — for reviewer approval (D7). Not published. Sample data.**

**Advisory:** Typhoon — Tropical cyclone **Signal No. 3** raised over Malabon
**City:** Malabon City (`malabon`) · **Type:** Typhoon · **Level:** Signal 3 (hazard points 3, Appendix B)
**Issued:** 2026-10-02 09:00 · **Source:** PAGASA (sample) — manual entry

**For households**
Secure your roof, windows and loose outdoor items now, and prepare a go-bag with documents, water,
food and medicine for several days. Households in Tinajeros and other riverside and low-lying
barangays should be ready to move early to the nearest evacuation center — Malabon National High
School (1,500), Tonsuya covered court (400) or the City Hall annex (800). Charge phones and power
banks and follow your barangay's go-signal without waiting for water to rise.

**For schools**
Prepare for class suspension across the city and protect ground-floor equipment and records at
riverside campuses. Any suspension, dismissal or shift to remote learning follows DepEd and Malabon
LGU announcements.

**For farmers**
Fishpond and sluice-gate operators along the Tullahan should close gates, secure nets and harvest
any stock that can be moved before winds and the high tide peak. Secure equipment and move livestock
and inputs to higher ground; small boats should remain in port.

**For barangay officials**
Two open gaps matter now. The Tullahan River wall repair in Tinajeros is **overdue**; the interim
measure is the temporary sandbag line over the 120-m gap, which does not hold against a strong high
tide, so station a watcher there, pre-position more sandbags and pre-identify households for early
evacuation. The flood early-warning sensors **need maintenance** with two sites offline; the interim
measure is manual watchers at those two sites throughout the signal.

**Follow official warnings and evacuation orders from PAGASA and NDRRMC.**

→ Routed to D7 as `draft-malabon-typhoon-card` (`review_state = DRAFT`). **4 audience sections
present; no "safe" phrasing; ends with the PAGASA/NDRRMC line.** ✔

---

## STEP 2 — Draft the interim-measure notice for barangay officials (R8.2)

> **DRAFT — for reviewer approval (D7). Not posted. Sample data.**

**Interim-measure notice — Malabon City barangay officials**
**Context:** Tropical cyclone **Signal No. 3** raised, 2026-10-02 (sample). City real-risk level:
**Critical** (fixed rule, Appendix B).

Open gaps and their interim measures to activate now:

| project_id | project | type | gap | interim measure (from `projects.csv`) |
|---|---|---|---|---|
| `mal-wall` | Tullahan River wall repair, Tinajeros | Dike | **Overdue** | A temporary sandbag line covers the 120-m gap. It does not hold against a strong high tide. |
| `mal-sensor` | Flood early-warning sensors (6 sites) | Warning | **Needs maintenance** | Manual watchers at the two offline sites during advisories. |

Defer to and monitor PAGASA and NDRRMC for signal changes and evacuation orders.

→ Routed to D7 as `draft-malabon-interim-notice` (`review_state = DRAFT`). Neutral language only;
interim measures carried verbatim from the CSV. ✔

---

## STEP 3 — Queue D5a escalation for overdue flood-related projects (R8.3)

Selection for Malabon:

```
SELECT project WHERE city_id = malabon
  AND gap == "Overdue"
  AND type ∈ { Dike, Drainage, Pump, Seawall }
```

| project_id | type | gap | status | selected? | why |
|---|---|---|---|---|---|
| `mal-wall` | Dike | Overdue | Delayed | **YES** | overdue + flood-related (Dike) |
| `mal-sensor` | Warning | Needs maintenance | Completed | no | not Overdue, and Warning type is not flood-related |
| `mal-pump` | Pump | (none) | In progress | no | not overdue (not an open gap) |
| `mal-drain` | Drainage | (none / OK) | Completed | no | not an open gap |

→ **Queue the D5a Deadline escalation steps for `mal-wall`** with an advisory-active note:

```
queued_escalation:
  project_id    = mal-wall
  flow          = D5a (D4b draft → D7 reviewer gate → test-contact send → 15-working-day clock)
  advisory_active = yes
  signal        = Signal 3
  issued_at     = 2026-10-02 09:00
  review_state  = DRAFT          ← D5a blocks here; queuing sends nothing
```

Because `advisory_active = yes`, the D4b letter D5a drafts will include its one hazard sentence on why
the Tullahan wall matters this week. **No letter is sent by the playbook** — D5a's own reviewer gate
holds it at DRAFT exactly as in `D5a/worked-trace-mal-wall.md`. ✔

---

## STEP 4 — Refresh the D2 scorecard (R8.4)

The playbook triggers a refresh of the **Ripples Climate Scorecard**. With the Signal 3 active, the
rules engine bands Malabon to **Critical** (score 5); the national map pin turns red and the city
table re-sorts. The scorecard **reads** `real_risk_level` / `risk_score`; the playbook does not
compute them (CC-4). ✔

---

## STEP 5 — Send the team status message (R8.4)

Sent to the **team test channel** (internal situational awareness — not a public advisory, not an
office letter):

> **[Ripples — SAMPLE DATA] Typhoon playbook run — Signal 3, 2026-10-02 09:00**
> **Cities affected:** Malabon City.
> **Real-risk levels (fixed rule, Appendix B):** Malabon — **Critical** (hazard 3 from Signal 3 +
> gaps 2).
> **Open gaps in the path:** `mal-wall` Tullahan River wall repair — **Overdue** (Dike, queued for
> escalation); `mal-sensor` flood early-warning sensors — **Needs maintenance**.
> **Drafts awaiting approval in the Reviewer (D7):** 1 advisory card (`draft-malabon-typhoon-card`),
> 1 interim-measure notice (`draft-malabon-interim-notice`), 1 queued follow-up letter for `mal-wall`.
> All outputs are DRAFT. Nothing has been posted or sent to any office. Please review in D7.
> Defer to PAGASA and NDRRMC for official warnings and evacuation orders.

Counts and neutral status words only; never says Malabon is "safe." ✔

---

## STEP 6 — Stop at the gate (R8.5)

The playbook ends. State of everything it produced:

| Artifact | Where it is | State | Sent/posted? |
|---|---|---|---|
| Advisory card (`draft-malabon-typhoon-card`) | D7 Drafts queue | DRAFT | **No** |
| Interim-measure notice (`draft-malabon-interim-notice`) | D7 Drafts queue | DRAFT | **No** |
| `mal-wall` follow-up letter (via D5a) | D7 Drafts queue (D5a-gated) | DRAFT | **No** |
| D2 scorecard | refreshed (read-only levels) | — | n/a |
| Team status message | team **test** channel | sent (internal) | internal only |

════ HUMAN APPROVAL GATE (D7) ════ The playbook never sets `APPROVED`. A reviewer must open each item
and approve it; only then do D4a's publish path and D5a's send-to-test-contact path run.

---

## Exit-test result (Task 6.2)

> *Exit test:* a sample **Signal 3** pushes affected cities to the expected level, generates
> 4-audience advisory cards, and leaves drafts awaiting approval.

| Check | Result |
|---|---|
| Sample **Signal 3** raised (manual entry) | **PASS** (`signal_level = Signal 3`, affected = malabon) |
| Pushes affected city to the **expected level** (fixed rule) | **PASS** — Appendix B: Signal 3–5 → hazard 3; + gap 2 → score 5 → **Critical** (read, not computed) |
| Generates a **4-audience** advisory card via D4a | **PASS** — households, schools, farmers, barangay officials; ends with PAGASA/NDRRMC line |
| Drafts an interim-measure notice of open gaps | **PASS** (`draft-malabon-interim-notice`: `mal-wall`, `mal-sensor`) |
| Queues D5a for overdue flood-related projects w/ advisory-active note | **PASS** — `mal-wall` (Dike, Overdue) queued, `advisory_active = yes` |
| Refreshes the D2 scorecard | **PASS** — Malabon shown Critical on refresh |
| Sends the team status message | **PASS** — cities, levels, open gaps in path, drafts awaiting approval |
| **Leaves every output as DRAFT awaiting approval** | **PASS** — nothing posted/sent to any office; only the internal team message went out (test channel) |

**Overall: PASS — a Signal 3 prepares Malabon end-to-end and stops at the reviewer gate; every output is a DRAFT awaiting approval.**

---

## Safeguards audit for this run

- **S1 / CC-1** — card and notice defer to & link PAGASA/NDRRMC; no "safe" claim anywhere; team
  message states Critical, never "safe." ✔
- **S2 / CC-2** — every card/notice/letter is DRAFT and reviewer-gated; the playbook posts/sends
  nothing public; the only send is the internal team message to a **test** channel. ✔
- **S3 / CC-3** — neutral language only (`Overdue`, `Needs maintenance`); interim measures verbatim. ✔
- **S4 / CC-4** — advisory level is an Appendix B lookup (Signal 3–5 → 3); Critical banding read from
  the rules engine / D2, never model-scored or written back. ✔
- **S7 / CC-7** — sample data labeled on every artifact and the team message; ledger `sample_data = yes`. ✔
- **S5 / S6** — not exercised (no citizen-report handling in this automation). ✔ (n/a)

---

## Generalizing beyond Malabon

The same six-step pipeline + gate runs for **every** `city_id` in the raised signal's
`affected_city_ids`. If a Signal 3 were raised over, say, `legazpi` and `tacloban` as well:

- Each gets its own DRAFT D4a card (classified by the same Appendix B Signal 3–5 → hazard 3 lookup)
  and its own interim-measure notice.
- **Expected fixed-rule levels** under Signal 3 (hazard 3 + each city's precomputed `gap_points`):
  Legazpi `3 + 2 = 5 → Critical`; Tacloban `3 + 1 = 4 → High`. (Read from the rules engine, not
  computed by the playbook.)
- Overdue flood-related projects queue for D5a with the advisory-active note — e.g. Legazpi
  `leg-lahar` (Dike, Overdue) and `leg-seawall` (Seawall, but Needs maintenance → listed in the
  notice, not queued, since it is not *Overdue*); Tacloban `tac-embank` (Seawall, Overdue → queued).
- One combined team status message lists all affected cities, their levels, the open gaps in the
  path, and all drafts awaiting approval.

Each city's outputs are independently reviewer-gated — nothing for any city is posted or sent until
its own D7 item is `APPROVED`.
