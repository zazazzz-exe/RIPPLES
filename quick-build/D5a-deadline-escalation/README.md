# D5a — Deadline escalation (Quick Automate)

Repo artifacts for **Task 6a** of `ripples-quick-system`. The automation itself is built inside the Quick space; these files are the build contract and the verified exit-test outputs. **All data is sample data; all sends in the demo go to test addresses only.**

| File | What it is |
|---|---|
| `automation-spec.md` | The Quick Automate configuration contract: daily trigger, selection rule, the per-candidate flow (D4b draft → **reviewer gate** → test-contact send → log → 15-working-day clock → reply/No-reply → `anchor_record`-or-log → weekly summary), run-state ledger, safeguards, error handling. Implements prompt D5a in `quick-prompts.md`. |
| `candidate-selection.md` | The full daily selection worked against `projects.csv` for `today = 2026-10-02`: 12 candidates (8 overdue + 4 needs-maintenance), what was excluded and why, and how the 30-day recency guard behaves across runs. |
| `worked-trace-mal-wall.md` | The exit-test trace: the automation selects Malabon's overdue `mal-wall`, **stops at the reviewer gate with nothing sent**, then on approval sends to a **test** address and starts the 15-working-day clock. |
| `sample-weekly-summary.md` | A sample weekly roll-up of letters sent / replies / silences by city and agency (R7.6), with the gate still holding unapproved drafts unsent. |

**Requirements:** R7 (1–6), CC-2 (S2 approval gate / test-only sends); carries CC-3, CC-4, CC-7.
**Depends on:** Task 4b (Follow-up letter flow) and Task 5 (Ripples Reviewer app — the gate). This automation reads the D7 `review_state` and **never sends on a `DRAFT`**.

## The one thing that matters
**The reviewer gate halts every send until a human approves.** A daily run can select, draft, and queue many candidates and still send **zero** letters. Only an explicit `review_state = APPROVED` in the D7 Reviewer app unlocks a send — and that send goes to a **test** address, never a real office. On approval the 15-working-day reply clock starts; replies are attached and posted to the City Page, and silence is recorded as a neutral **"No reply."**

All generated artifacts carry a visible **DRAFT**/sample-data marker and use only neutral status words (`Overdue`, `Needs maintenance`, `Delayed`, `No reply`). Nothing here recomputes a risk or advisory level — those fields are read from the CSVs as precomputed by the rules engine (Appendix B).
