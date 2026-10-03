# AGENTS.md — Ripples

This file is picked up automatically by Kiro as steering context. It gives any agent the ground rules for working in this repo. Deeper detail lives in `.kiro/steering/` and the spec in `.kiro/specs/ripples-quick-system/`.

## What this project is
Ripples is an Amazon Quick–powered climate accountability system for the Philippines (**Detect → Protect → Push**), built with **Kiro** under spec-driven development. The public 3D map is a mockup; we build the Quick orchestration layer behind it. All data is **sample data**.

## How we work (sprint momentum)
- **Spec-driven only.** No feature work without a task in `.kiro/specs/ripples-quick-system/tasks.md`. If something is missing, add a task (with requirement + prompt-ID references) before building.
- **Run tasks in parallel waves.** Tasks carry `Depends on` tags; Kiro runs independent tasks concurrently. Respect the waves — don't start a task whose dependencies are unmet.
- **The approval gate (D7) comes before automations (D5).** Anything that sends routes through the Reviewer app first.
- **Pilot-first.** Build and verify against **Malabon City**, then generalize.
- **Traceability.** Every change references the requirement(s) and prompt ID (D-x) it implements. Keep component names and D-IDs consistent (see `.kiro/steering/structure.md`).
- **Definition of done = exit test passes + safeguards hold.** A task isn't done until its exit test passes and the artifact satisfies S1–S7.

## The seven safeguards (never violate — see `.kiro/steering/safeguards.md`)
1. Never say anyone is "safe"; defer to and link PAGASA/NDRRMC.
2. Human approval before any send/publish; demo sends go to test addresses.
3. Neutral language only.
4. Risk/advisory levels from fixed rules, never model scoring.
5. Never expose a citizen reporter's identity.
6. Reports stay "unverified" until corroborated; flag suspicious patterns.
7. Label sample data everywhere.

## Key files
- `.kiro/steering/` — product.md, tech.md, structure.md, safeguards.md (always/auto loaded)
- `.kiro/specs/ripples-quick-system/` — requirements.md → design.md → tasks.md
- `quick-prompts.md` — the paste-ready D0–D7 prompts each task implements
- `ripples-project-document.md` — concept source of truth
- `ARCHITECTURE-AND-EXECUTION-PLAN.md` — phased build plan

## When in doubt
Prefer the spec and steering files over memory. If a rule here conflicts with a request, the safeguards win — raise it rather than working around it.
