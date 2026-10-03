# Worked sample — D5a weekly summary (R7.6)

**— DRAFT team-facing summary — sample data. Not sent to any office; this is an internal roll-up.**
**Sample data.** Counts are derived from the sample CSVs in `data/` and the automation's run-state ledger. Real city/office names are used only to demonstrate the system.

**Automation:** D5a "Deadline escalation" · **Week of:** 2026-09-28 → 2026-10-02 · **`today = 2026-10-02`**

This summary reports **letters sent, replies received, and silences (No reply) recorded**, grouped by **city** and by **agency** (R7.6). It uses neutral status words only (S3 / CC-3). "No reply" is a factual record of silence, not a judgement.

> Illustrative scenario: the week's 12 candidates (see `candidate-selection.md`) were drafted and routed to the reviewer. The reviewer approved 7, which were sent to **test** contacts; 2 of those have replied; 5 candidates are still awaiting approval and so remain unsent (the gate holds).

---

## By city

| City | Candidates | Drafts awaiting approval | Letters sent (test) | Replies received | No reply (silence) |
|---|---|---|---|---|---|
| Malabon | 2 (`mal-wall`, `mal-sensor`) | 1 | 1 | 0 | 0 |
| Dagupan | 2 (`dag-dike`, `dag-drain`) | 1 | 1 | 1 | 0 |
| Marikina | 1 (`mar-wall`) | 0 | 1 | 1 | 0 |
| Legazpi | 2 (`leg-lahar`, `leg-seawall`) | 1 | 1 | 0 | 0 |
| Tacloban | 1 (`tac-embank`) | 0 | 1 | 0 | 0 |
| Iloilo | 2 (`ilo-pump`, `ilo-floodway`) | 1 | 1 | 0 | 0 |
| Cagayan de Oro | 1 (`cdo-telemetry`) | 1 | 0 | 0 | 0 |
| Davao | 1 (`dav-floodwall`) | 0 | 1 | 0 | 0 |
| **Total** | **12** | **5** | **7** | **2** | **0** |

## By agency

| Agency | Candidates | Letters sent (test) | Replies received | No reply (silence) |
|---|---|---|---|---|
| DPWH | 8 (`mal-wall`, `dag-dike`, `mar-wall`, `leg-lahar`, `leg-seawall`, `tac-embank`, `dav-floodwall`, `ilo-floodway`) | 6 | 1 | 0 |
| City Government | 4 (`mal-sensor`, `dag-drain`, `ilo-pump`, `cdo-telemetry`) | 1 | 1 | 0 |
| MMDA | 0 | 0 | 0 | 0 |
| DENR | 0 | 0 | 0 | 0 |
| **Total** | **12** | **7** | **2** | **0** |

(8 DPWH + 4 City Government = 12 candidates; MMDA and DENR had no overdue/needs-maintenance projects this week. Agency labels are read verbatim from `projects.csv` — `ilo-floodway` (Jaro floodway desilting) is a DPWH project. The by-city table above is the authoritative per-project list.)

---

## Notes for the team

- **5 drafts are still awaiting approval** and were **not** sent — the reviewer gate is holding them (S2 / CC-2). Nothing goes out until a reviewer approves the exact draft.
- **All 7 sends went to test addresses** (`reviewer+<office-slug>@ripples.test`); no real office was contacted.
- Reply clocks are running for the 7 sent letters; **0 silences** have been recorded yet because no 15-working-day clock has expired this week.
- No accusatory language is used anywhere in this summary (S3 / CC-3).

**Safeguards:** S2/CC-2 (gate holds unsent drafts; test-only sends) ✅ · S3/CC-3 (neutral words only) ✅ · S4/CC-4 (counts from read-only fields/ledger) ✅ · S7/CC-7 (labeled sample data) ✅.
