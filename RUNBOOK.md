# RUNBOOK — Driving Kiro to build the Ripples Quick system

## Run the web app (runnable demo on sample data)
```
cd app
npm install
npm start      # open http://localhost:3000 on desktop or phone (same network)
npm test
```
Demo path: 3D map → click Malabon (or open `/#/city/malabon`) → Tullahan River wall evidence → TYPHOON DEMO (Malabon goes Critical; guidance shows "awaiting approval") → Scorecard → approve the Malabon advisory card → back on the map it shows the four-audience guidance → NEXT flies to Marikina → Assistant: "Which open gaps raise Malabon's risk this season?" Reset from Simulate → Reset demo. Architecture: `docs/ARCHITECTURE.md`.

**Build mode:** Kiro builds components **directly in the Amazon Quick environment**.
**Spec:** `.kiro/specs/ripples-quick-system/` · **Steering:** `.kiro/steering/` · **Prompts implemented:** `quick-prompts.md` (D0–D7)

> Use these prompts in order. Each wave maps to `tasks.md`. Stop at each wave's checkpoint, confirm the exit tests, then continue. The 7 safeguards (`.kiro/steering/safeguards.md`) apply to every artifact.

---

## Step 0 — Preflight: confirm Kiro can reach Quick

```
Before building, confirm your connection to our Amazon Quick environment.
Tell me: (1) can you create Quick components directly — spaces, Quick Sight
dashboards, Flows, Automate automations, a chat agent, and an App? (2) If
any of those cannot be created directly, list which ones, so we can fall
back to pasting the matching D-prompt from quick-prompts.md for those only.
Do not build anything yet.
```

**If Kiro says it cannot reach a given component type:** for those items, its task output becomes the matching D-prompt from `quick-prompts.md`, which you paste into Quick. Everything else it builds directly.

---

## Step 1 — Ground Kiro in the spec

```
Load the steering files in .kiro/steering/ and the spec at
.kiro/specs/ripples-quick-system/. Confirm you can see requirements.md,
design.md, and tasks.md. Summarize the 6 build waves and the 7 safeguards
back to me so I know you have full context. Do not build yet.
```

---

## Step 2 — Build, wave by wave (recommended for the hackathon)

### Wave 1 — Foundation
```
Execute Wave 1 of the ripples-quick-system spec: Task 1 (D0) — create the
Quick space "Ripples: Climate Defense Map", upload the project document,
quick-prompts.md and all six CSVs, attempt the HTML mockup, and (optional)
add the PAGASA/NDRRMC web-crawler knowledge base. Run the D1 master kickoff
prompt and capture the build plan. Then run Task 1's exit test — ask
"How many open gaps does Malabon have and why?" and show me the answer is
CSV-grounded and labeled sample data. Stop and wait for my go-ahead.
```

### Wave 2 — Analytics, research, three flows (parallel)
```
Proceed to Wave 2. Run Tasks 2, 3, 4a, 4b, 4c concurrently — they depend
only on Task 1. Build each directly in Quick:
- Task 2: Ripples Climate Scorecard dashboard (D2)
- Task 3: City risk brief (D3) — build/verify for Malabon first
- Task 4a: Advisory guidance card flow (D4a)
- Task 4b: Follow-up letter flow (D4b)
- Task 4c: Citizen report triage flow (D4c)
Use the matching D-prompt in quick-prompts.md as each implementation.
Report every exit-test result. Enforce the 7 safeguards. Stop before Wave 3.
```

### Wave 3 — The approval gate (must finish before any automation)
```
Proceed to Wave 3: Task 5 — build the Ripples Reviewer app (D7) with the
three queues (commitments, drafts, reports). Hide reporter identity in the
reports queue. Confirm a DRAFT letter from Task 4b appears in the drafts
queue and can be approved. Match the mockup look (dark navy; green/yellow/
orange/red risk colors; condensed headings). Stop and confirm before Wave 4.
```

### Wave 4 — Automations (parallel, after the gate)
```
Proceed to Wave 4. Now that the Reviewer app exists, build Tasks 6a, 6b, 6c:
- Task 6a: Deadline escalation automation (D5a)
- Task 6b: Typhoon event playbook (D5b)
- Task 6c: Pre-season readiness automation (D5c)
Every automation must route drafts through the Reviewer app and send
nothing without approval; point all sends at TEST addresses. Verify Task 6a
stops at the approval gate before any send. Run each exit test. Stop before
Wave 5.
```

### Wave 5 — Chat agent
```
Proceed to Wave 5: Task 7 — create the Ripples City Assistant chat agent
(D6), grounded only in this space and the PAGASA/NDRRMC web sources. Test
the three canonical questions; confirm it cites sources, flags sample data,
links PAGASA/NDRRMC for live warnings, and never says a place is safe.
```

### Wave 6 — End-to-end rehearsal & safeguard audit
```
Proceed to Wave 6: Task 8 — run the full demo runsheet end to end
(scorecard → assistant question → sample Signal 3 → escalation draft →
approve in Reviewer → readiness report → close on the mockup). Audit every
generated artifact against safeguards S1–S7 and report any violation.
```
**Rehearsal record:** the worked runsheet, the per-artifact S1–S7 audit table, and the
gate-test proof live in `quick-build/D8-demo-rehearsal-and-audit.md`. Result: runsheet
complete, no safeguard violations, gate confirmed (no D5 send before a D7 approval; demo
sends go to test addresses only).

---

## Alternative — Run everything at once (less control)
```
Execute the ripples-quick-system spec. Run all tasks in tasks.md,
respecting the "Depends on" tags: build the dependency graph and run
independent tasks concurrently in waves. Stop after each wave and show me
what completed plus each task's exit-test result before continuing. Enforce
the 7 safeguards on every artifact. Never start a Wave 4 automation before
Task 5 (the Reviewer app) is done. Point all sends at test addresses.
```
In Kiro's UI this is the **"Run all tasks"** button on the spec; the prompt adds wave checkpoints and safeguard enforcement.

---

## Re-run a single component (example: the dashboard)
```
Re-run Task 2 (Ripples Climate Scorecard, D2) from the spec. Use the D2
prompt in quick-prompts.md as the implementation, verify against
requirements R2, and run its exit test: the open-gap total must match a
hand count of projects.csv rows where gap is Overdue or Needs maintenance.
```

---

## Guardrails to keep repeating to Kiro
- Build and verify against **Malabon** first, then generalize.
- Everything that sends is **DRAFT** until approved in the Reviewer app; demo sends go to **test addresses** only.
- Never build a **Wave 4** automation before **Task 5** (the gate) is done.
- Risk/advisory levels come from the **fixed rules**, never model scoring.
- A task is **done** only when its **exit test passes** and the artifact satisfies **S1–S7**.
```
