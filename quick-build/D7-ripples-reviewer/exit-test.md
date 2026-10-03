# Exit test — Ripples Reviewer (D7)

**Task 5 exit test:** *a DRAFT letter from task 4b appears in the drafts queue and can be approved; reports queue shows no identity.*

> **Sample data.** All records below come from the sample CSVs in `data/` and the DRAFT outputs of the D4 flows. Nothing is sent, shared, or published by this app.

---

## Condition 1 — The DRAFT `mal-wall` letter appears in the Drafts queue, beside its source record, and can be approved

**Artifact under test:** `quick-build/D4b-follow-up-letter/sample-letter-mal-wall.md` (the DRAFT follow-up letter for Malabon's overdue river wall, produced by Task 4b).

| Check | Result |
|---|---|
| Letter appears as an item in the **Drafts** queue | ✅ item `draft-mal-wall-letter`, kind "Follow-up letter (D4b)" |
| Shown **beside its source record** | ✅ right-hand panel renders the `projects.csv` row for `mal-wall` (city, project, type, responsible office, budget ₱120.0 M, deadline 2026-05, status Delayed 30%, `gap = Overdue`, 2 sent / 0 replied) |
| DRAFT marker intact on the artifact | ✅ "DRAFT — not sent" shown above the letter body (S2/CC-2) |
| Can be **approved** | ✅ Approve button runs the transition `review_state: DRAFT → APPROVED` |
| Approval is what an automation reads | ✅ action note updates to "APPROVED → D5 automation may send to a test contact"; the app itself sends nothing |
| Reject path available | ✅ Reject runs `DRAFT → REJECTED` ("returned, nothing sent") |

**Draft-state transition exercised:**
```
draft-mal-wall-letter : DRAFT ──Approve──▶ APPROVED
```
After approval the item is locked (terminal state); the queue's DRAFT count decrements. D5a Deadline escalation, which generated this letter as DRAFT and routed it here, now reads `review_state = APPROVED` and may send to the office's **test** contact and start the 15-working-day clock. Before approval it reads `DRAFT` and sends nothing.

**Condition 1: PASS.**

---

## Condition 2 — The Reports queue renders a D4c triage result with no reporter identity

**Artifact under test:** the D4c triage runs in `quick-build/D4c-citizen-report-triage/sample-runs.md` (Run B `mal-wall` → `corroborated`; Run A `dag-tidegate` → `unverified`).

| Check | Result |
|---|---|
| Triage result renders in the **Reports** queue | ✅ `report-mal-wall` (corroborated) and `report-dag-tidegate` (unverified) |
| Shows triage status + matching-report context | ✅ `triage_status`, `matching_reports_30d`, `satellite_check_agrees`, `review_flag`, plus the `evidence.csv` matching rows with a "in 30-day window" marker |
| **No reporter identity anywhere** | ✅ no field, column, label, tooltip, log line, or export for a reporter; sources are channels only ("Citizen photo report", "Satellite check", "LGU update") (S5/CC-5) |
| Corroborate gated by the fixed rule | ✅ `mal-wall` (2 matches) → Corroborate **enabled**; `dag-tidegate` (0 matches) → Corroborate **disabled** with "needs ≥2 matching reports or a satellite check" (S6/CC-6) |
| Proposed evidence entry is de-identified + sample-labeled | ✅ shown as the raw `evidence.csv` row ending `…,yes,yes` / `…,no,yes` |

**Draft-state transition exercised:**
```
report-mal-wall    : DRAFT ──Corroborate──▶ APPROVED   (also sets evidence corroborated = yes; rule met)
report-dag-tidegate: Corroborate DISABLED (unverified, 0 matches) · Reject available
```

**Condition 2: PASS.**

---

## How the draft-state model works (summary for the automations)

```
review_state ∈ { DRAFT, APPROVED, REJECTED }

   DRAFT ──Approve / Corroborate──▶ APPROVED   (terminal)
   DRAFT ──Reject────────────────▶ REJECTED    (terminal)
```

- Every flow (D4a/b/c) emits its artifact as **DRAFT**. Default state, nothing acts on it.
- This app is the **only** writer of `review_state` and the **only** path out of `DRAFT`. It performs no send itself.
- **APPROVED** is the single flag the D5 automations check before any send/share/post:
  - **D5a** sends the follow-up letter to a test contact and starts the reply clock — only if APPROVED.
  - **D5b** shares an advisory card / interim-measure notice — only if APPROVED.
  - **D5c** shares/posts a readiness report — only if APPROVED.
- **REJECTED** returns the item; no automation acts on it.
- For reports, **Corroborate** is the approve transition, additionally setting the evidence row's `corroborated = yes`, and is enabled only when the fixed corroboration rule holds (≥2 matching 30-day reports or a satellite check) — reviewers cannot override the rule for a lone report.

---

## Safeguard audit (S1–S7)

| Safeguard | How this app satisfies it |
|---|---|
| **S1 — never "safe"** | App shows draft text verbatim; adds no "safe" phrasing; advisory card draft ends with the PAGASA/NDRRMC line. |
| **S2 — human approval** | Everything enters as DRAFT; the only path to a send is a reviewer APPROVED here; app never sends; D5 demo sends target test addresses. |
| **S3 — neutral language** | Only neutral status words shown (`Overdue`, `Needs maintenance`, `Delayed`, `No reply`). |
| **S4 — fixed-rule risk** | `gap`, status, advisory level and `hazard_points` are read from CSVs; the app never recomputes them. |
| **S5 — protect reporters** | Reports queue has no reporter-identity field anywhere; sources are channels only. |
| **S6 — fraud protection** | Reports stay `unverified` until the fixed rule is met; Corroborate disabled for lone reports; suspicious patterns arrive pre-flagged. |
| **S7 — label sample data** | "SAMPLE DATA" badge in the title area on every screen; every item carries `sample_data = yes`. |

**Both exit-test conditions PASS and no safeguard is violated.**
