# App specification — Ripples Reviewer (D7)

**Component:** Ripples Reviewer — the approval gate
**D-ID:** D7
**Quick feature:** Apps in Amazon Quick
**Implements:** `quick-prompts.md` → "D7. Reviewer app (Apps in Amazon Quick)"; design.md → "D7 — Ripples Reviewer"
**Satisfies:** Requirement 11 (1–4), CC-2 (S2), CC-5 (S5); carries CC-3 (S3), CC-7 (S7)
**Depends on:** 4a (advisory card), 4b (follow-up letter), 4c (report triage) — the flows that populate the queues
**Pilot city:** Malabon City (built and verified against Malabon first)
**Status:** Build artifact (sample data). This is the configuration contract for the Quick app; the app itself lives inside the Quick space. A static HTML mockup (`ripples-reviewer-app.html`) renders the same three screens in the project's visual language.

> **Sample data.** This app reads the sample CSVs in `data/` (`projects.csv`, `advisories.csv`, `evidence.csv`) and the DRAFT outputs produced by the D4a/b/c flows. Everything shown is **sample data** and uses real city/office names only to demonstrate the system. Nothing in this app sends or publishes anything on its own.

---

## 1. Why this is built before the automations

Build order is `D0 → D4 flows → D7 Reviewer → D5 automations`. The Reviewer app is the **only** path from a draft to a sent/published artifact. Every D5 automation (deadline escalation, typhoon playbook, pre-season readiness) reads a draft's **state** that this app sets. If the app did not exist, an automation would have no gate to stop at — a direct violation of S2/CC-2. So D7 ships before any D5 automation is enabled.

The app itself never sends. It only moves a draft between states. A send/share/post action belongs to a D5 automation and may run **only** against a draft this app has moved to `APPROVED`.

---

## 2. The three screens

The app has one top nav with three queues and a persistent **Sample data** badge in the title area (S7/CC-7). The look matches the mockup: dark navy background, risk colors green / yellow / orange / red, condensed display headings (see §6).

### Screen 1 — Commitments queue
AI-extracted LCCAP commitments awaiting a reviewer's check before they enter the system of record.

- **Source:** the commitment-extraction step reads a project's LCCAP source and proposes structured fields. Here we ground the sample rows in `projects.csv` (each project is a commitment under a city LCCAP).
- **Each card shows** the extracted commitment with its **source page** reference (`lccap_source`, e.g. "LCCAP 2020–2030") and **editable fields**:
  - `what` — the commitment / project description (`projects.project` + `projects.summary`)
  - `where` — city + barangay/location (`projects.city`, derived area)
  - `budget` — `projects.budget_php_millions` (₱ millions) — display only, no money is handled (tech.md); the figure is a recorded commitment amount, not a transaction
  - `deadline` — `projects.deadline`
  - `responsible_office` — `projects.responsible_office`
- **Controls:** Approve / Reject. A reviewer may edit any field before approving (corrects an extraction error).
- **State effect:** Approve → `APPROVED` (the corrected commitment is trusted); Reject → `REJECTED` (sent back; not trusted).

### Screen 2 — Drafts queue
Follow-up **letters** (D4b), **advisory guidance cards** (D4a) and **readiness reports** (D5c, later) awaiting approval — each shown **beside its source record** so the reviewer can check the draft against the data it was built from.

- **Each item shows**
  - the **DRAFT** artifact (the letter / card / report text, with its DRAFT marker intact), and
  - the **source record** panel beside it (the `projects.csv` row for a letter; the `advisories.csv` row + the city's open gaps for a card).
- **Controls:** Approve / Reject.
- **State effect (the contract the automations read):** Approve → `APPROVED`; Reject → `REJECTED`. A D5 automation sends/shares a letter or card **only** when its state is `APPROVED`.

### Screen 3 — Reports queue
Citizen report **triage results** (D4c) with matching-reports context and a **corroborate / reject** control.

- **Each item shows**
  - the triage result: `triage_status` (`corroborated` | `unverified`), `matching_reports_30d`, `satellite_check_agrees`, `review_flag` + reasons;
  - the **matching reports** context (the recent `evidence.csv` rows for the same project that the triage counted);
  - the de-identified one-line evidence entry the flow proposed.
- **NEVER shows reporter identity** — there is no field for it anywhere on this screen, in any tooltip, log line, or export (S5/CC-5). The triage flow (D4c) already strips identity at Step 0; this screen has no column, label, or control that could surface one.
- **Controls:** **Corroborate** / **Reject**.
  - **Corroborate** is enabled **only** when the fixed corroboration rule is already met (`matching_reports_30d ≥ 2` OR `satellite_check_agrees`). A reviewer cannot hand-corroborate a lone `unverified` report — that would break S6/CC-6. When the rule is not met, the control is disabled with the note "needs ≥2 matching reports or a satellite check."
  - **Reject** marks the report dismissed (e.g. a flagged suspicious pattern).
- **State effect:** Corroborate → evidence `corroborated = yes` and draft state `APPROVED`; Reject → `REJECTED`.

---

## 3. Draft-state model (what the automations consume)

Every item the app handles carries a single `review_state` field. This is the status D5a/D5b/D5c read **before** they send, share, or post.

```
review_state ∈ { DRAFT, APPROVED, REJECTED }
```

| State | Set by | Meaning | What automations may do |
|---|---|---|---|
| `DRAFT` | the D4a/b/c flow at creation | Awaiting a reviewer. The default for everything. | **Nothing.** No send, share, or post. |
| `APPROVED` | a reviewer, in this app | A human approved the exact artifact shown. | The dependent D5 automation may send to a **test** contact / share / post. |
| `REJECTED` | a reviewer, in this app | A human rejected it. | **Nothing.** The item is returned, not sent. |

### Transitions
```
            Approve / Corroborate
   DRAFT ───────────────────────────▶ APPROVED
     │
     │      Reject
     └───────────────────────────────▶ REJECTED
```
- Only `DRAFT` can transition. `APPROVED` and `REJECTED` are terminal for a given artifact version (re-drafting creates a new `DRAFT`).
- The transition is the app's **only** write. The app never performs the send itself.
- For reports, `Corroborate` is the approve transition and additionally sets the evidence row's `corroborated = yes`; it is gated by the fixed corroboration rule (§2, Screen 3).

### Item record (what the app stores per queue item)
```
item_id            e.g. draft-mal-wall-letter
queue              commitments | drafts | reports
kind               commitment | letter | advisory_card | readiness_report | triage_result
source_ref         project_id / advisory_id / evidence project_id
title              short display title
review_state       DRAFT | APPROVED | REJECTED        ← read by D5a/b/c
decided_by         reviewer id (never a reporter)
decided_at         timestamp
sample_data        yes
```

### How each automation reads the state
- **D5a Deadline escalation** — generates a D4b letter as `DRAFT`, routes it here, and **blocks** until `review_state = APPROVED`; only then sends to the office's test contact and starts the reply clock. On `REJECTED` it stops and logs.
- **D5b Typhoon playbook** — emits advisory cards + interim-measure notices as `DRAFT`; shares a card only once `APPROVED`.
- **D5c Pre-season readiness** — emits a per-city readiness report as `DRAFT`; shares/posts only once `APPROVED`.

This is the serialization point in the dependency graph: no automation acts on an artifact until this app has moved it out of `DRAFT`.

---

## 4. Data sources (read-only)

| Screen | Reads | For |
|---|---|---|
| Commitments | `projects.csv` | extracted commitment fields + `lccap_source` as "source page" |
| Drafts | D4b letter output + `projects.csv` row; D4a card output + `advisories.csv` row + open gaps | the draft and its source record |
| Reports | D4c triage result + `evidence.csv` matching rows | triage result + matching-report context (no identity) |

Joins follow the data model: `projects.city_id → cities.city_id`; `evidence.project_id → projects.project_id`. The app never recomputes a risk or advisory level (CC-4) and never writes back to the CSVs — it only sets `review_state` on queue items.

---

## 5. Safeguard checklist (must all hold)

- [x] **S2 / CC-2** — Everything enters as `DRAFT`; the only path to a send is a reviewer `APPROVED` here; the app itself never sends; demo sends (in D5a) go to test addresses.
- [x] **S5 / CC-5** — The Reports queue has no field, column, tooltip, log, or export for reporter identity; the triage flow strips it upstream.
- [x] **S6 / CC-6** — Reports stay `unverified` until the fixed rule is met; `Corroborate` is disabled for lone reports; suspicious patterns arrive pre-flagged for a human.
- [x] **S3 / CC-3** — Draft text is shown verbatim; the app adds no language of its own beyond neutral status words.
- [x] **S4 / CC-4** — Risk/advisory levels are read from precomputed fields / fixed rules; the app displays, never computes.
- [x] **S7 / CC-7** — A "Sample data" badge sits in the title area on every screen; every item carries `sample_data = yes`.

---

## 6. Visual language (match the mockup)

Taken from `ripples-climate-map.html` so the Reviewer app reads as one product.

| Token | Value | Use |
|---|---|---|
| Background base | `#020817` (`--ink-0`) | app background (dark navy) |
| Panel | `#06122b` / `#0b1d3f` (`--ink-1` / `--ink-2`) | cards, columns |
| Lines | `#1d3a68` / `#2f5794` (`--line` / `--line-hi`) | borders, dividers |
| Text | `#dde9ff` / `#93a9cf` / `#6a82aa` (`--ice` / `--ice-dim` / `--mute`) | body / secondary / tertiary |
| Risk — Low | `#35e39a` (green) | `real_risk_level = Low`, Completed/OK |
| Risk — Moderate | `#ffd23f` (yellow) | `Moderate` |
| Risk — High | `#ff8a2b` (orange) | `High`, Overdue |
| Risk — Critical | `#ff2e5b` (red) | `Critical` |
| Accent | `#ffcf4a` (`--sun`) | sample-data badge, DRAFT marker, focus |
| Display font | Big Shoulders Display (condensed) | headings, queue titles, risk pills |
| Body font | Instrument Sans | body text |
| Mono font | ui-monospace | IDs, state labels, metadata |

Headings are condensed display type, uppercase, with wide letter-spacing (matching `.brand-name` / `.rk` in the mockup). Risk pills use the display font on a solid risk-color background with ink-0 text.

---

## 7. Exit test (Requirement 11)

> A DRAFT letter from task 4b appears in the drafts queue and can be approved; reports queue shows no identity.

Verified in `exit-test.md`:
1. The DRAFT follow-up letter for `mal-wall` (`quick-build/D4b-follow-up-letter/sample-letter-mal-wall.md`) appears in the Drafts queue **beside its `projects.csv` source record** and can be moved `DRAFT → APPROVED`, which is what D5a reads before sending.
2. The Reports queue renders a D4c triage result (from `quick-build/D4c-citizen-report-triage/`) with matching-report context and **no reporter identity** anywhere.

The static `ripples-reviewer-app.html` renders both conditions in the project's visual language.
