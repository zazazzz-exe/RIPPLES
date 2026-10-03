# D5b — Typhoon event playbook (Quick Automate)

The repo-side build artifact for the **Typhoon event playbook** automation. When a tropical cyclone
wind signal is raised (manual entry in this version), the playbook prepares **every affected city at
once**: it runs the **D4a Advisory guidance card**, drafts an **interim-measure notice** of the
city's open gaps for barangay officials, queues the **D5a Deadline escalation** steps for overdue
flood-related projects (with an advisory-active note), refreshes the **D2 scorecard**, and sends the
**team** an internal status message. **Everything it produces is a DRAFT — the playbook stops at the
D7 reviewer gate and posts/sends nothing public on its own.**

- **Implements:** R8 (1–5), CC-1 (never "safe"), CC-2 (approval gate / test-only sends); carries CC-3, CC-4, CC-7 · **Prompt:** `quick-prompts.md` → D5b
- **Depends on:** 4.1 (D4a Advisory guidance card), 6.1 (D5a Deadline escalation), 2 (D2 Climate Scorecard), and the D7 Ripples Reviewer app (the approval gate)
- **Pilot city:** Malabon City (built and verified first, then generalized)
- **Sample data** throughout; the signal is entered **manually**; demo sends go to **test** addresses/channels; the City Page target is the mockup.

## Files

| File | What it is |
|---|---|
| `automation-spec.md` | The Quick Automate configuration contract: wind-signal trigger (manual entry), the per-city pipeline (D4a card → interim-measure notice → queue D5a for overdue flood-related projects → refresh D2 → team status message), the reviewer-gate contract, the fixed-rule (Appendix B) advisory-level lookup, run-state ledger, safeguards checklist, Quick Automate build notes, and the exit test. Implements prompt D5b. |
| `worked-run-malabon.md` | The exit-test trace: a sample **Signal 3** raised over Malabon pushes the city to the expected fixed-rule level (**Critical**), generates the 4-audience D4a card, drafts the interim-measure notice, queues D5a for the overdue `mal-wall` (Dike) with an advisory-active note, refreshes D2, sends the team message — and **leaves every output as a DRAFT awaiting approval**. Ends with the all-cities generalization. |

## Exit test (Task 6.2)
> A sample **Signal 3** pushes affected cities to the expected level, generates 4-audience advisory
> cards, and leaves drafts awaiting approval.

**Result: PASS** — see `worked-run-malabon.md`. A raised Signal 3 is classified by the fixed Appendix B
rule (Signal 3–5 → `hazard_points = 3`); with Malabon's precomputed `gap_points = 2` the rules engine
bands `risk_score = 5 → **Critical**` (read, never model-scored). The playbook produces the
four-audience advisory card via D4a, drafts the interim-measure notice (`mal-wall` Overdue,
`mal-sensor` Needs maintenance), queues D5a for the overdue flood-related `mal-wall` with
`advisory_active = yes`, refreshes D2, and sends the team status message. **Every card, notice and
queued letter is left as DRAFT in the D7 Reviewer; nothing is posted or sent to any office** — only an
internal team status message goes out, to a test channel.

## The one thing that matters
**The playbook prepares a whole storm's worth of guidance and stops at the human-approval gate.** It
can run for many affected cities and still cause **zero** public sends/posts: advisory cards, interim
notices and follow-up letters are all `review_state = DRAFT` and are only ever released by D4a's and
D5a's own gated paths after a reviewer approves them in **D7**. The playbook never sets `APPROVED`.
Advisory levels come from the fixed Appendix B rule (never model scoring); every artifact carries a
visible **DRAFT** / sample-data marker and uses only neutral status words (`Overdue`,
`Needs maintenance`); no output ever says any city is "safe."
