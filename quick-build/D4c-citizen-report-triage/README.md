# Citizen report triage (D4c) — Quick Flows artifact

Repo artifact for spec task **4c** of `ripples-quick-system`. Implements prompt **D4c** in `quick-prompts.md`; satisfies **Requirement 6 (1–4)**, **CC-5 (S5)**, **CC-6 (S6)**, **CC-7 (S7)**.

| File | What it is |
|---|---|
| `flow-spec.md` | The Quick Flows flow specification: inputs, read-only reference data, the five triage steps (match → count 30-day matches → fixed corroboration rule → suspicious-pattern flag → one-line evidence entry), output shape, and the safeguard checklist. |
| `sample-runs.md` | Two worked runs verifying the exit test — a lone report (`dag-tidegate`) → `unverified`, and a report with ≥2 matching reports (`mal-wall`) → `corroborated`. Neither output names a reporter. |

**Sample data.** Runs on the sample CSVs in `data/`; all outputs are **DRAFT** and labeled **sample data**. The built flow itself lives in the Quick space; this folder is the traceable repo copy (per `.kiro/steering/structure.md`).

**Safeguards honored:** no reporter identity anywhere (S5/CC-5); default `unverified` until ≥2 matching reports or a satellite check corroborate, with suspicious patterns flagged for a reviewer (S6/CC-6); sample-data labeling (S7/CC-7); DRAFT until reviewer approval (S2/CC-2); no model-invented risk scoring (CC-4).
