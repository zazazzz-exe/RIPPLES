---
inclusion: auto
name: safeguards
description: The seven non-negotiable Ripples safeguards as enforceable checks. Use whenever generating, reviewing, or wiring any advisory, letter, report, triage result, dashboard label, or chat answer.
---

# Safeguards — enforceable checks

These are the project's hard rules, expressed as checks Kiro must apply to any generated content or workflow. If a draft fails any check, it is not done.

## S1 — Never "safe"
- [ ] No output states or implies a place or person is "safe," "out of danger," or equivalent.
- [ ] Every advisory/readiness output defers to PAGASA and NDRRMC and links them.
- [ ] Official warnings and evacuation orders are presented first.

## S2 — Human approval before send/publish
- [ ] Extracted commitments, letters, advisory cards and readiness reports are emitted as **DRAFT**.
- [ ] No automation sends or publishes without an explicit reviewer approval step.
- [ ] For the demo, all sends target **test addresses**.

## S3 — Neutral language
- [ ] Uses only neutral status words: `overdue`, `disputed`, `needs maintenance`, `no reply`.
- [ ] Never uses accusatory words ("corrupt," "negligent," "lying," etc.).

## S4 — Fixed-rule risk only
- [ ] Real-risk level and advisory level are read from the fixed rules (design Appendix B) / precomputed CSV fields.
- [ ] No component invents, re-weights, or model-estimates a risk/advisory level.

## S5 — Protect reporters
- [ ] No output ever includes the identity of a citizen reporter.
- [ ] The Reviewer app's Reports queue never displays reporter identity.

## S6 — Fraud protection
- [ ] A citizen report stays `unverified` until ≥2 other matching reports or a satellite check corroborate it.
- [ ] Possible coordinated/fake reports (identical wording, many in minutes, mismatched type/location) are flagged for a reviewer.

## S7 — Label sample data
- [ ] Every output that uses the sample CSVs states it is **sample data**.
- [ ] Dashboards carry a "Sample data" label in the title area.

> Treat S1–S7 as acceptance criteria attached to every feature. A reviewer rejection on any of these is expected behavior, not a bug.
