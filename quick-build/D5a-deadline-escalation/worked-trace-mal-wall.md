# Worked trace — D5a Deadline escalation (Malabon, `mal-wall`)

**— DRAFT working artifact — sample data. Nothing in this trace was sent to any real office.**
**Sample data.** Produced from the sample CSVs in `data/`. Real city/office names are used only to demonstrate the system; this does not describe the real status of any LGU or DPWH record.

**Automation:** D5a "Deadline escalation" · **Input:** daily check, `today = 2026-10-02` · **Pilot project:** `mal-wall`

This trace is the exit test for Task 6a:
> Run stops at the reviewer gate and sends nothing until approved; approval sends to a test address and starts the clock.

---

## T0 — Daily check selects a candidate (R7.1)

The daily check scans `projects.csv`. `mal-wall` matches **Rule A (overdue)**:

```
project_id = mal-wall
status     = Delayed          (!= Completed)        ✅
deadline   = 2026-05          (< 2026-10)           ✅  → overdue
gap        = Overdue          (read, not computed)
maintenance= (blank)
followups_sent = 2 , followups_replied = 0
30-day guard: ledger empty for mal-wall → eligible  ✅
```

→ `mal-wall` enters the candidate list (alongside 11 others — see `candidate-selection.md`). **No send yet. Nothing has left the system.**

---

## T1 — Draft via D4b (R7.2)

The automation calls the **D4b "Follow-up letter"** flow with `project_id = mal-wall`. D4b returns a **DRAFT** letter (the verified one in `quick-build/D4b-follow-up-letter/sample-letter-mal-wall.md`): neutral, marked DRAFT, with all three FOI requests, the 15-working-day reply-clock statement, and a conditional hazard sentence (Malabon has active advisories `malabon-a1` + `malabon-a2`), plus the one-line log entry:

```
2026-10-02, mal-wall, "District Engineer, DPWH Malabon-Navotas District Engineering Office", drafted
```

Ledger after T1:
```
project_id=mal-wall  current_draft_ref=draft-mal-wall-letter  review_state=DRAFT
sent_at=null  clock_started_at=null  outcome=pending  sample_data=yes
```

**No send yet.** The automation adds no language of its own.

---

## T2 — Route to D7 and BLOCK at the gate (R7.2, S2/CC-2)  ← the stop point

The automation creates a Drafts-queue item in the **Ripples Reviewer (D7)**:

```
item_id=draft-mal-wall-letter  queue=drafts  kind=letter
source_ref=mal-wall  title="Follow-up — Tullahan River wall repair (sample)"
review_state=DRAFT         ← the gate key
```

The reviewer is notified at a **test** inbox. The automation now **blocks on `mal-wall`**.

**State of the world while `review_state = DRAFT`:**

| Action | Performed? |
|---|---|
| Email to the real DPWH office | ❌ never (not in this version at all) |
| Email to a test address | ❌ not yet — blocked |
| Post to the City Page | ❌ not yet — blocked |
| `anchor_record` call | ❌ no status change to anchor yet |
| **Any outbound effect** | **❌ none — the gate holds** |

> **The gate halts all sends until approval.** The daily run could end right here — with `mal-wall` and all other candidates sitting in the Drafts queue — and the number of letters sent would be **zero**. A reviewer who never decides leaves it blocked forever; a rejection stops it. Only an explicit human `APPROVED` unlocks the next step.

### Branch T2-R — if the reviewer REJECTS
```
review_state: DRAFT → REJECTED
automation: log "rejected", send nothing, stop this project.
outcome=rejected
```
Still **zero sends**.

---

## T3 — Reviewer APPROVES → send to the TEST contact only (R7.3, S2/CC-2)

A reviewer opens the draft beside its `projects.csv` source record, checks it, and clicks **Approve** in D7:

```
review_state: DRAFT → APPROVED   (decided_by = reviewer, decided_at = 2026-10-02T09:40)
```

Only now does the automation proceed:

1. Resolve the **test** contact for the office:
   `test_contact = reviewer+dpwh-malabon-navotas@ripples.test`
   (The real `responsible_office` — "District Engineer, DPWH Malabon–Navotas DEO" — is **never** emailed. CC-2 / S2.)
2. Send the approved letter to that test address.
3. Send log:
   ```
   2026-10-02, mal-wall, "District Engineer, DPWH Malabon-Navotas District Engineering Office", reviewer+dpwh-malabon-navotas@ripples.test, "sent"
   ```
4. Status change recorded: `drafted → sent`.

---

## T4 — Start the 15-working-day reply clock (R7.3, R7.4)

```
clock_started_at = 2026-10-02 (Fri)
clock_due        = 2026-10-23 (Fri)   # 15 working days, Mon–Fri, weekends skipped
outcome          = sent
```

Count: Oct 2 is day 0 (sent). Working days 1–15 land on Oct 23, skipping the weekends of Oct 3–4, 10–11, 17–18. Holidays out of scope (see automation-spec §11).

- **If a reply arrives on/before 2026-10-23:** attach it to `mal-wall`, post it to the City Page (as a DRAFT post through the gate), record `sent → replied`, `outcome=replied`.
- **If 2026-10-23 passes with no reply:** record neutral **"No reply"** for the scorecard, `sent → no_reply`, `outcome=no_reply`. (Silence is recorded, never called negligence — S3.)

---

## T5 — anchor_record per status change (R7.5)

For `drafted → sent` (and later `sent → replied` / `sent → no_reply`):

- **`anchor_record` connected?** In this version — **no**. → write to the status-change log and **skip** the call:
  ```
  2026-10-02T09:41, mal-wall, drafted, sent, anchored=skipped
  ```
- **If it were connected**, the automation would instead call
  `anchor_record({project_id:"mal-wall", status_change:"drafted→sent", timestamp:..., sample_data:"yes"})`
  and record `anchored=yes`.

No error either way; the automation continues.

---

## Exit-test verification

| Check | Result |
|---|---|
| Daily check selects a candidate | ✅ `mal-wall` selected by Rule A (Delayed, deadline 2026-05 < 2026-10) |
| Run **stops at the reviewer gate** | ✅ blocks on `review_state = DRAFT` at T2 |
| **Sends nothing until approved** | ✅ zero outbound effects while `DRAFT`; rejection also sends nothing |
| Approval **sends to a test address** | ✅ `reviewer+dpwh-malabon-navotas@ripples.test`; real office never contacted |
| Approval **starts the clock** | ✅ 15-working-day clock `2026-10-02 → 2026-10-23` |
| Reply / No-reply handling defined | ✅ reply attached + posted to City Page; else neutral "No reply" (R7.4) |
| `anchor_record` if connected, else log+skip | ✅ not connected → logged + skipped (R7.5) |
| Neutral language (S3/CC-3) | ✅ only `Delayed`, `Overdue`, `sent`, `No reply` |
| Never "safe" (S1/CC-1) | ✅ no "safe" phrasing; silence record implies no safety |
| Fixed-rule fields read, not recomputed (S4/CC-4) | ✅ `status`/`deadline`/`gap` read from `projects.csv` |
| Sample data labeled (S7/CC-7) | ✅ header + logs state sample data |

**Result: the reviewer gate halts all sends until a human approves. On approval, the letter goes only to a test address and the 15-working-day reply clock starts.**
