# D8 — End-to-end demo rehearsal & safeguard audit

**Task:** 8 — End-to-end demo rehearsal & safeguard audit (Wave 6, integration)
**D-ID:** D0–D7 (integration) · **Spec:** `.kiro/specs/ripples-quick-system/`
**Implements:** CC-1…CC-7 + all R · **Depends on:** 2, 3, 4.1, 4.2, 4.3, 5, 6.1, 6.2, 6.3, 7
**Pilot city:** Malabon City (the runsheet is worked through the Malabon path first)
**Status:** Integration artifact — repo-side rehearsal record and safeguard/gate audit.

> **⚠ Sample data.** Every figure, name and record referenced below comes from the Ripples
> sample CSVs in `data/` (`sample_data = yes`) and the D2–D7 build artifacts built from them.
> Real city, office and agency names are used only to show how the system works. Nothing here
> describes the actual status of any LGU, DPWH, DENR, MMDA or PAGASA record. For live,
> authoritative warnings and evacuation orders, always follow **PAGASA** and **NDRRMC**.

---

## 0. What this artifact proves

Three things, each with evidence drawn from the actual artifact files (not re-stated from memory):

1. **The full demo runsheet runs end to end** — scorecard → assistant → sample Signal 3 →
   escalation draft → approve in Reviewer → readiness report → close on the mockup — and each
   step connects to the next through a real, existing artifact.
2. **Every generated artifact holds S1–S7** — a per-artifact pass/fail audit table.
3. **The gate holds** — no D5 automation (D5a/D5b/D5c) sends, shares or posts before a D7
   `APPROVED`, and every demo send resolves to a **test** address only.

Data was hand-checked against the source CSVs during this rehearsal (see §4). The open-gap
total, per-city counts, and every city's `real_risk_level`/`risk_score` cited in the artifacts
match `data/projects.csv` and `data/cities.csv` exactly.

---

## 1. The demo runsheet — walked end to end (Malabon path)

Each step names the real artifact that performs it and the hand-off into the next step.

### Step 1 — Scorecard (D2)
**Artifact:** `quick-build/D2-ripples-climate-scorecard.md`
Open the **Ripples Climate Scorecard**. National overview shows **Open gaps = 12**, **Cities at
High/Critical = 3**, and the map colored from `cities.csv.real_risk_level`. The city table is
sorted by `risk_score` desc; **Malabon = High / orange, score 4, 2 open gaps, 3 sent / 1 replied.**
A persistent **"Sample data"** label sits in the title area.
→ **Hand-off:** the scorecard surfaces Malabon's two open gaps (`mal-wall` Overdue, `mal-sensor`
Needs maintenance) — the exact gaps the assistant is asked about next.

### Step 2 — Assistant question (D6)
**Artifact:** `quick-build/D6-ripples-city-assistant/exit-test-canonical-answers.md` (Q1)
Ask the **Ripples City Assistant**: *"Which open gaps raise Malabon's risk this season?"* It
answers from `cities.csv` + `projects.csv:mal-wall`/`:mal-sensor`, cites each row, flags sample
data, reads `real_risk_level = High` as stored (never recomputed), and closes by deferring to
PAGASA/NDRRMC for live conditions — never calling Malabon "safe."
→ **Hand-off:** the two gaps the assistant names are the same ones the Signal-3 playbook will
pick up when a storm is raised.

### Step 3 — Sample Signal 3 (D5b typhoon playbook)
**Artifact:** `quick-build/D5b-typhoon-event-playbook/worked-run-malabon.md`
Raise a **sample Signal 3** over Malabon (manual team entry). By fixed Appendix B lookup
(Signal 3–5 → `hazard_points = 3`) plus Malabon's precomputed `gap_points = 2`, the rules engine
bands `risk_score = 5 → **Critical**`. The playbook runs **D4a** (four-audience DRAFT advisory
card ending in the PAGASA/NDRRMC line), drafts the **interim-measure notice** (open gaps
`mal-wall` + `mal-sensor`), **queues D5a** for the overdue flood-related `mal-wall` (Dike) with
an advisory-active note, refreshes **D2**, and sends the **team** a status message to a test
channel. **Everything is left DRAFT.**
→ **Hand-off:** the queued `mal-wall` escalation becomes the escalation draft in Step 4.

### Step 4 — Escalation draft (D5a → D4b)
**Artifacts:** `quick-build/D5a-deadline-escalation/worked-trace-mal-wall.md`,
`quick-build/D4b-follow-up-letter/sample-letter-mal-wall.md`
The **D5a Deadline escalation** steps run for `mal-wall`: D5a calls **D4b**, which drafts the
neutral follow-up letter (commitment, ₱120M budget, 2026-05 deadline, Delayed/30%, `gap = Overdue`,
the three FOI requests, the 15-working-day reply-clock statement, and — because `malabon-a1`/`a2`
are active — one conditional hazard sentence). D5a routes the DRAFT to D7 and **blocks**:
`review_state = DRAFT`, **zero sends.**
→ **Hand-off:** the DRAFT letter now sits in the D7 Drafts queue awaiting a human decision.

### Step 5 — Approve in Reviewer (D7)
**Artifacts:** `quick-build/D7-ripples-reviewer/exit-test.md`, `…/app-spec.md`,
`…/ripples-reviewer-app.html`
In the **Ripples Reviewer**, the `draft-mal-wall-letter` item appears in the Drafts queue
**beside its `projects.csv` source record**. The reviewer checks it and clicks **Approve**:
`review_state: DRAFT → APPROVED`. Only now may D5a send — to the office's **test** contact
(`reviewer+dpwh-malabon-navotas@ripples.test`) — and start the 15-working-day reply clock
(2026-10-02 → 2026-10-23). The Reports queue (shown for the demo) renders triage results with
**no reporter identity** and the Corroborate control gated by the fixed rule.
→ **Hand-off:** with the approval path demonstrated, the demo moves to the pre-season artifact.

### Step 6 — Readiness report (D5c → D3 + D2)
**Artifacts:** `quick-build/D5c-pre-season-readiness/readiness-report-malabon.md`,
`artifacts/city-risk-briefs/malabon-city-risk-brief.md`
Run **Pre-season readiness** for Malabon on demand. It assembles the **D3 brief** (five cited
sections, Section B) + the **D2 scorecard slice** (Section A) into one **DRAFT** readiness report
and routes it to D7 as `draft-malabon-readiness`. With `review_state = DRAFT`, **nothing is shared
or posted**; share/post to the DRRMO/Sanggunian/media **test** contacts and the City Page runs
only on `APPROVED`.
→ **Hand-off:** the approved report posts to the **City Page**, which is the mockup — the close.

### Step 7 — Close on the mockup
**Artifact:** `ripples-climate-map.html`
Close on the **3D map mockup**. It carries the persistent **SAMPLE DATA** badge and the footer
*"…sample data showing how the app works. It does not describe the real status of these LGUs'
projects. Always follow PAGASA and NDRRMC."* The **TYPHOON DEMO** control raises the
**DEMO MODE** banner — *"Simulated typhoon. Not a real advisory."* (in Critical red) — matching
the Signal-3 story from Step 3. The City Page dossier and the project-evidence overlay show the
same `mal-wall` record; the letter modal keeps the neutral-language note and a **"Mark as sent
(demo)"** action. The map is a mockup only (not wired to Quick in this version).

**Runsheet result: COMPLETE.** Each of the seven steps references a real, existing artifact and
flows into the next; the Malabon pilot path is continuous from scorecard to mockup close.

---

## 2. Per-artifact safeguard audit (S1–S7)

Legend: **✔** holds · **n/a** not exercised by this artifact (and nothing in it violates the
safeguard). Every artifact was read in full for this audit; findings in §3.

| # | Artifact (file) | S1 never "safe" | S2 DRAFT/approval, test sends | S3 neutral | S4 fixed-rule | S5 no reporter id | S6 corroborate-first | S7 sample-data |
|---|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| D2 | `D2-ripples-climate-scorecard.md` | ✔ | n/a (read-only view) | ✔ | ✔ | ✔ (no id field) | n/a (shows stored flag) | ✔ |
| D3 | `artifacts/city-risk-briefs/malabon-city-risk-brief.md` | ✔ | n/a (brief, not a send) | ✔ | ✔ | ✔ | n/a | ✔ |
| D3-T | `artifacts/city-risk-briefs/TEMPLATE-city-risk-brief.md` | ✔ | n/a | ✔ | ✔ | ✔ | n/a | ✔ |
| D4a | `D4a-advisory-guidance-card/flow-spec.md` + `sample-malabon-card.md` | ✔ | ✔ (DRAFT→D7) | ✔ | ✔ | n/a | n/a | ✔ |
| D4b | `D4b-follow-up-letter/flow-spec.md` + `sample-letter-mal-wall.md` | ✔ | ✔ (DRAFT→D7) | ✔ (banned-word guard) | ✔ | n/a | n/a | ✔ |
| D4c | `D4c-citizen-report-triage/flow-spec.md` + `sample-runs.md` | ✔ | ✔ (DRAFT→D7) | ✔ | ✔ | ✔ (Step 0 strips id) | ✔ (≥2 or satellite) | ✔ |
| D5a | `D5a-deadline-escalation/automation-spec.md` + `worked-trace-mal-wall.md` | ✔ | ✔ (blocks on DRAFT; test contact) | ✔ | ✔ | n/a | n/a | ✔ |
| D5b | `D5b-typhoon-event-playbook/automation-spec.md` + `worked-run-malabon.md` | ✔ | ✔ (all DRAFT; test channel) | ✔ | ✔ | n/a | n/a | ✔ |
| D5c | `D5c-pre-season-readiness/automation-spec.md` + `readiness-report-malabon.md` | ✔ | ✔ (DRAFT; share only on APPROVED, test addr) | ✔ | ✔ | n/a | n/a | ✔ |
| D6 | `D6-ripples-city-assistant/agent-spec.md` + `exit-test-canonical-answers.md` | ✔ | ✔ (Q3 drafts marked DRAFT) | ✔ | ✔ | ✔ | n/a | ✔ |
| D7 | `D7-ripples-reviewer/app-spec.md` + `exit-test.md` | ✔ | ✔ (sole DRAFT→APPROVED writer; never sends) | ✔ | ✔ | ✔ (no id anywhere) | ✔ (Corroborate rule-gated) | ✔ |
| mock | `ripples-climate-map.html` | ✔ (footer defers to PAGASA/NDRRMC) | ✔ ("Mark as sent (demo)"; neutral-letter note) | ✔ | ✔ (reads stored levels) | ✔ | n/a | ✔ (SAMPLE DATA badge + footer) |

**Audit result:** every generated artifact holds all safeguards that apply to it. No artifact
uses "safe"/"out of danger"; every draftable artifact carries a DRAFT marker and routes to D7;
only neutral status words appear; risk/advisory levels are read from fixed rules; no reporter
identity appears anywhere; corroboration stays rule-gated; and sample data is labeled throughout.

### Safeguard-by-safeguard notes
- **S1 (never "safe"):** D3, D4a, D5b, D5c and D6 each end deferring to PAGASA/NDRRMC; none makes
  a safety claim. The D5a "No reply"/silence record is explicitly framed as a neutral fact, not
  an implication of safety.
- **S2 (approval + test sends):** D7 is the only writer of `review_state` and never sends. D5a
  blocks on `DRAFT` and resolves sends to `reviewer+<office-slug>@ripples.test`. D5b sends only
  an internal team status message to a **test** channel. D5c shares/posts only on `APPROVED` to
  test addresses, with the City Page target being the mockup. See the gate proof in §3.
- **S3 (neutral language):** D4b carries an explicit banned-word guard; all artifacts use only
  `overdue`, `disputed`, `needs maintenance`, `no reply`, `delayed`, `in progress`, `completed`.
- **S4 (fixed-rule):** every component reads `real_risk_level`/`risk_score`/`hazard_points`/
  advisory `level` as stored. D5b's Signal-3→Critical banding is a documented Appendix B lookup
  (hazard 3 + gap 2 = 5), read from the rules engine, not computed by the playbook.
- **S5 (protect reporters):** D4c Step 0 strips any identifier before processing; D7's Reports
  queue has no identity field/column/tooltip/export; D6 surfaces evidence observations only.
- **S6 (corroboration-first):** D4c defaults to `unverified` and only sets `corroborated` on ≥2
  matching 30-day reports or a satellite check; D7's Corroborate control is disabled for lone
  reports and suspicious patterns arrive pre-flagged.
- **S7 (sample data):** every artifact — plus the dashboard title area and the mockup badge —
  states sample data; every CSV/ledger row carries `sample_data = yes`.

---

## 3. Gate test — no D5 send before a D7 approval; demo sends to test addresses only

The gate is the serialization point of the whole system (`D0 → D4 flows → D7 Reviewer → D5
automations`). It is confirmed in three places, each cited to the actual spec/flow lines.

**The single state the automations read (D7 app-spec §3):**
```
review_state ∈ { DRAFT, APPROVED, REJECTED }
DRAFT   → automations may do NOTHING (no send/share/post)
APPROVED→ the dependent D5 automation may send to a TEST contact / share / post
REJECTED→ NOTHING; item returned
```
D7 is the **only** writer of `review_state` and performs no send itself (D7 app-spec §1, §3).

| Automation | Where it blocks | Proof line (file) | Where the send resolves |
|---|---|---|---|
| **D5a** Deadline escalation | Step 2 "route to the reviewer and BLOCK"; a send is reachable **only** from the `APPROVED` branch | `D5a-deadline-escalation/automation-spec.md` §5 Step 2–3; `worked-trace-mal-wall.md` T2 (blocks) → T3 (approve → send) | **test** contact `reviewer+dpwh-malabon-navotas@ripples.test`; real office never emailed (spec §3, §5 Step 3) |
| **D5b** Typhoon playbook | Step 6 "stop at the gate"; every card/notice/queued letter stays `DRAFT`; posts/sends nothing public | `D5b-typhoon-event-playbook/automation-spec.md` §5 Step 6, §7 (gate row); `worked-run-malabon.md` Step 6 table (all "No") | only outbound is the internal **team** status message to a **test** channel; actual sends run via D5a/D4a gated paths after approval |
| **D5c** Pre-season readiness | Step 4 "STOP here" gate between route and share; steps 5–6 run only on `APPROVED` | `D5c-pre-season-readiness/automation-spec.md` §3 pipeline, §4 contract table; `readiness-report-malabon.md` "Routing & approval" footer (DRAFT, not shared/posted) | DRRMO/Sanggunian/media **test** inboxes + mockup City Page, only on `APPROVED` (spec §5) |

**Gate test result: CONFIRMED.**
- No D5 automation can send, share or post while an item is `DRAFT` — a storm run (D5b) can
  prepare a full set of drafts and still cause **zero** public sends.
- The only path out of `DRAFT` is a human `APPROVED` in D7; the automations never set `APPROVED`
  themselves (D5a §2, D5b §2, D5c §4).
- Every demo send resolves to a **test** address or **test** channel; the mockup is the City Page
  target. No real `responsible_office` is contacted anywhere in this version.

---

## 4. Data hand-check (performed during this rehearsal)

Verified directly against the source CSVs so the runsheet rests on real numbers, not restated
claims:

- **Open-gap total = 12**, counted from `data/projects.csv` where `gap ∈ {Overdue, Needs
  maintenance}` — matches the D2 scorecard exactly. By city: dagupan 2, malabon 2, legazpi 2,
  iloilo 2, marikina 1, tacloban 1, cdo 1, davao 1 = 12.
- **Risk levels** from `data/cities.csv` match the D2 table and every artifact that quotes them:
  Dagupan/Malabon/Legazpi **High (4)**; Iloilo **Moderate (3)**; Marikina/Tacloban/CDO
  **Moderate (2)**; Davao **Low (1)**. No `Critical` city at baseline (Malabon reaches Critical
  only under the Signal-3 rules-engine banding in D5b).
- **Malabon pilot path:** `mal-wall` (Dike, Overdue, Delayed 30%, deadline 2026-05, ₱120M,
  2 sent / 0 replied) and `mal-sensor` (Warning, Needs maintenance, 1 sent / 1 replied) exist in
  `projects.csv` exactly as the D3/D4/D5/D6 artifacts cite them.
- **D4c references** `dag-tidegate` (Pump, Dagupan, Not started) — confirmed a real `projects.csv`
  row; the lone-report → `unverified` case is valid.

---

## 5. Violations found & resolution

**None.** The rehearsal read every generated artifact and the two source CSVs. No artifact
violates a safeguard, every runsheet step connects to a real artifact, and the approval gate
holds across all three D5 automations. No artifact required a fix, so no re-audit was needed.

(For traceability: the only cross-artifact nit considered was the `dag-tidegate` vs the
Dagupan open-gap pair `dag-dike`/`dag-drain`. These are three distinct real rows in
`projects.csv`; `dag-tidegate` has no gap and is correctly used in D4c as the lone-report
example, while `dag-dike`/`dag-drain` are correctly Dagupan's two open gaps in D2. No conflict.)

---

## 6. Exit test

> *The full runsheet completes; no artifact violates a safeguard; nothing sent without approval.*

| Exit-test clause | Result | Evidence |
|---|---|---|
| Full runsheet completes, each step → real artifact → next | **PASS** | §1 Steps 1–7, all seven artifacts exist and chain through the Malabon path |
| S1–S7 audit covers every artifact, no unaddressed violation | **PASS** | §2 table (12 artifacts) + notes; §5 (none found) |
| Gate: nothing sends before D7 approval | **PASS** | §3 — D5a/D5b/D5c each block on `review_state = DRAFT`; only `APPROVED` unlocks a send |
| Demo sends go to test addresses only | **PASS** | §3 — D5a test contact, D5b test channel, D5c test inboxes + mockup City Page; no real office contacted |

**Overall: PASS.** The end-to-end demo runsheet completes along the Malabon pilot path, every
generated artifact holds S1–S7, and the approval gate is confirmed — no D5 automation sends,
shares or posts before a human `APPROVED` in D7, and every demo send resolves to a test address.
```
