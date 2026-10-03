# D5c — Pre-season readiness (Quick Automate)

The repo-side build artifact for the **Pre-season readiness** automation. For each city it runs the
**D3 City risk brief**, attaches the city's **D2 scorecard** slice, and produces a **readiness
report** — emitted as **DRAFT** and routed to the **D7 Ripples Reviewer**. Nothing is shared with the
DRRMO, Sanggunian or media contacts, and nothing is posted on the City Page, until a reviewer sets
`review_state = APPROVED`.

- **Implements:** R9 (1–2), CC-1, CC-2, CC-7 · **Prompt:** `quick-prompts.md` → D5c
- **Depends on:** Task 3 (D3), Task 2 (D2), Task 5 (D7 Reviewer — the approval gate)
- **Pilot city:** Malabon City (built and verified first)
- **Sample data** throughout; demo sends go to **test** addresses; the City Page target is the mockup.

## Files

| File | What it is |
|---|---|
| `automation-spec.md` | The configuration contract: trigger, per-city pipeline, reviewer-gate contract, share/post targets, safeguards, build notes. |
| `report-template.md` | The fixed shape of every per-city readiness report (header, Sections A/B/C, footer). |
| `readiness-report-malabon.md` | The worked pilot report for Malabon — DRAFT, sample data, routed to the reviewer. |
| `worked-run-malabon.md` | The on-demand run trace proving the exit test: produced → routed as DRAFT → not shared until approved. |

## Exit test (Task 6c)
> An on-demand run produces a per-city report routed to the reviewer, not shared until approved.

**Result: PASS** — see `worked-run-malabon.md`. The Malabon report is produced, marked DRAFT, routed
to the D7 Drafts queue as `draft-malabon-readiness`, and nothing is shared or posted while the item
is not `APPROVED`. **The report is reviewer-gated.**

## The gate (why this is safe)
D5c is a Wave-4 automation and runs only after D7 exists (build order
`D0 → D4 flows → D7 Reviewer → D5 automations`). D5c sets `review_state = DRAFT` and reads the state
D7 sets; it **never** sets `APPROVED` itself. The share/post steps execute only on `APPROVED`,
honoring S2/CC-2.
