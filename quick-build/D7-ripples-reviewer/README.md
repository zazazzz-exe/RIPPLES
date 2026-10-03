# D7 — Ripples Reviewer (the approval gate)

The internal app where a human approves or rejects every AI output **before it has any effect**. Built on **Apps in Amazon Quick**. This folder is the repo artifact for Task 5.

- **Implements:** `quick-prompts.md` → D7 · design.md → "D7 — Ripples Reviewer"
- **Satisfies:** Requirement 11 (1–4), CC-2 (S2), CC-5 (S5); carries CC-3/CC-7
- **Depends on:** 4a, 4b, 4c (the flows that fill the queues)
- **Built before:** all D5 automations (they read the state this app sets)

## Files
| File | What it is |
|---|---|
| `app-spec.md` | Build/config contract for the Quick app: the three screens, the draft-state model, data sources, safeguards, and the mockup visual language. |
| `ripples-reviewer-app.html` | Single-file static mockup. Open in a browser. Renders all three queues in the project's dark-navy visual language with working Approve / Reject / Corroborate and live state transitions. |
| `exit-test.md` | Verifies both exit-test conditions and audits S1–S7. |

## The three screens
1. **Commitments** — AI-extracted LCCAP commitments with source page + editable fields (what, where, budget, deadline, responsible office) and Approve / Reject.
2. **Drafts** — follow-up letters (D4b), advisory cards (D4a) and readiness reports (D5c), each **beside its source record**; Approve / Reject.
3. **Reports** — citizen report triage results with matching-report context and a Corroborate / Reject control; **never shows reporter identity**.

## Draft-state model (what the automations consume)
```
review_state ∈ { DRAFT, APPROVED, REJECTED }

   DRAFT ──Approve / Corroborate──▶ APPROVED   (terminal; the flag D5a/b/c read before sending)
   DRAFT ──Reject────────────────▶ REJECTED    (terminal; returned, nothing sent)
```
Everything starts `DRAFT`. This app is the only writer of `review_state` and the only path out of `DRAFT`; it never sends. A D5 automation sends/shares/posts only when `review_state = APPROVED`.

## Exit test
- The DRAFT `mal-wall` follow-up letter (Task 4b) shows in the Drafts queue beside its `projects.csv` record and moves `DRAFT → APPROVED`. ✅
- The Reports queue renders a D4c triage result with no reporter identity; Corroborate is disabled for a lone `unverified` report. ✅

Open `ripples-reviewer-app.html` to see both. Full verification in `exit-test.md`.

> **Sample data.** Reads `data/projects.csv`, `advisories.csv`, `evidence.csv` and the D4 flow outputs. Real names used only to demonstrate the system; nothing describes a real LGU/DPWH/DENR/MMDA/PAGASA record.
