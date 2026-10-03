# D4b — Follow-up letter (Quick Flows)

Repo artifacts for Task 4b of `ripples-quick-system`. The flow itself is built inside the Quick space; these files are the build contract and the verified exit-test output.

| File | What it is |
|---|---|
| `flow-spec.md` | The Quick Flow configuration: input `project_id`, steps, field mapping, safeguard checks, neutral-language guard. Implements prompt D4b in `quick-prompts.md`. |
| `sample-letter-mal-wall.md` | Worked sample letter for Malabon's overdue river wall (`mal-wall`), with the exit-test verification table. |

**Requirements:** R5 (1–5), CC-2 (DRAFT/approval), CC-3 (neutral language).
**Exit test:** letter for Malabon's overdue river wall is neutral, marked DRAFT, and contains all three FOI requests — verified in `sample-letter-mal-wall.md`.

All data is **sample data** (`sample_data = yes`). Nothing in this flow sends or publishes; drafts route to the D7 Ripples Reviewer app.
