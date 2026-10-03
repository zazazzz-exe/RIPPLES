# Automation specification — Deadline escalation (D5a)

**Component:** D5a — Deadline escalation
**D-ID:** D5a
**Quick feature:** Quick Automate
**Implements:** `quick-prompts.md` → "D5a. Deadline escalation"; design.md → "D5a — Deadline escalation"
**Satisfies:** Requirement 7 (1–6), CC-2 (S2); carries CC-3 (S3), CC-4 (S4), CC-7 (S7)
**Depends on:** 4b (Follow-up letter flow), 5 (Ripples Reviewer app — the approval gate)
**Operating-model stage:** Push
**Pilot city:** Malabon City (built and verified against Malabon first)
**Status:** Build artifact (sample data). This is the configuration contract for the Quick Automate automation; the automation itself lives inside the Quick space.

> **Sample data.** This automation reads the sample CSVs in `data/` (`projects.csv`, `cities.csv`, `advisories.csv`, `evidence.csv`). Every artifact it produces states it is sample data and uses real city/office names only to show how the system works — it does not describe the real status of any LGU, DPWH, DENR, MMDA or PAGASA record. **All sends in this demo go to test addresses only; no real office is ever contacted (S2 / CC-2).**

---

## 1. Purpose

Chase overdue or unmaintained climate defenses on a schedule, without manual tracking. Each day the automation selects the projects that need a follow-up, runs the D4b "Follow-up letter" flow to draft one, and routes that DRAFT to the Ripples Reviewer (D7). **It then blocks and sends nothing until a reviewer approves.** On approval it sends to the office's **test** contact only, logs the send, and starts a 15-working-day reply clock. Replies are attached and posted; silences are recorded as a neutral **"No reply."** A weekly summary rolls up letters sent, replies, and silences by city and agency.

The automation is the first thing in the build that can cause a send, so the human-approval gate (D7) is non-negotiable: **the reviewer gate halts every send until a human approves the exact draft shown.**

---

## 2. Why this cannot run before D7

Build order is `D0 → D4 flows → D7 Reviewer → D5 automations`. This automation reads a draft's `review_state` (set by the D7 app) **before** it sends. With no gate, there is no `APPROVED` state to wait for — the automation would either never send (safe but useless) or send ungated (a direct S2/CC-2 violation). So D7 ships first, and this automation treats `review_state = APPROVED` as the only key that unlocks a send.

---

## 3. Interface

| | |
|---|---|
| **Trigger** | Daily scheduled check (plus manual run for the demo). |
| **Reads** | `data/projects.csv` (candidate selection + letter fields), `data/cities.csv` (join), `data/advisories.csv` (D4b hazard sentence), `data/evidence.csv` (reply matching), the automation's own run-state ledger (follow-up recency, clocks). |
| **Calls** | D4b "Follow-up letter" flow (draft a letter); D7 Ripples Reviewer (route draft, read `review_state`); `anchor_record` backend action **if connected** (else logs). |
| **Writes** | Run-state ledger only (candidates, draft refs, send log, reply clocks, status-change log). It never writes back to the source CSVs. |
| **Sends** | Only on `review_state = APPROVED`, and only to a **test** contact (never a real office). |
| **Output** | Per-project: a DRAFT letter routed to D7; on approval a logged send + a running reply clock; a weekly summary message. |

---

## 4. Trigger & candidate selection (R7.1)

`today` for this build = **2026-10-02** (`cities.csv` `as_of = 2026-10`). Deadlines in `projects.csv` are month-grained (`YYYY-MM`); a deadline is "before today" when its month is strictly earlier than the current month.

**Select a project when either rule holds, and the 30-day guard passes:**

```
SELECT project WHERE
    (
      status != "Completed" AND deadline < today        -- Rule A: overdue
      OR
      maintenance == "Needs maintenance"                 -- Rule B: unmaintained
    )
  AND no_followup_sent_in_last_30_days(project)          -- recency guard
```

- **Rule A — overdue:** the committed deadline has passed and the project is not Completed. `gap` is typically already `Overdue` for these; the automation reads `gap`/`status`/`deadline` as recorded and does **not** recompute them (CC-4 / S4).
- **Rule B — unmaintained:** a completed defense whose `maintenance = "Needs maintenance"` (e.g. a seawall being undermined by scour). These have passed their build deadline but still need a follow-up on upkeep.
- **Recency guard — `no_followup_sent_in_last_30_days`:** prevents re-pestering an office. `projects.csv` records `followups_sent` (a count) but not a per-send date, so the automation keeps a **`last_followup_sent_at`** timestamp per project in its run-state ledger. A project is skipped if that timestamp is within 30 days. On first run (empty ledger) every matching project is eligible; after a send the project is parked for 30 days. See §11 (assumptions).

### Neutral fixed-field reads (CC-4 / S4)
`status`, `deadline`, `maintenance`, `gap`, `progress_pct`, `followups_sent`, `followups_replied` are read verbatim from `projects.csv`. The automation never re-derives a risk level, advisory level, or gap classification — those are precomputed by the rules engine (Appendix B) and read-only here.

---

## 5. Per-candidate flow

For each selected project, in order:

### Step 1 — Draft (call D4b)
Call the D4b "Follow-up letter" flow with the `project_id`. D4b reads the project + city rows, drafts the neutral letter (commitment, budget, deadline, status, progress, gap + the three FOI requests + the 15-working-day reply-clock statement + a conditional hazard sentence if an advisory is active), and returns a **DRAFT** letter plus a one-line log entry. The automation adds no language of its own; it carries D4b's output verbatim (S3 / CC-3 handled inside D4b's neutral-language guard).

### Step 2 — Route to the reviewer and BLOCK (R7.2, S2/CC-2)
Create a Drafts-queue item in D7 with `review_state = DRAFT`, `kind = letter`, `source_ref = project_id`, pointing at the DRAFT letter beside its `projects.csv` source record. Notify the reviewer (test email/Slack).

**The automation now blocks on this project. It performs no send, email, or post while `review_state = DRAFT`.** It polls / waits for the reviewer's decision:

| `review_state` becomes | Automation does |
|---|---|
| `DRAFT` (unchanged) | **Nothing.** Keep waiting. The gate holds. |
| `REJECTED` | Stop this project. Log `rejected`; do **not** send. Optionally re-draft later (new `DRAFT`). |
| `APPROVED` | Proceed to Step 3. |

This is the gate: **nothing leaves the system on a `DRAFT`.** The daily run can select, draft, and queue many candidates and still send zero letters if no one has approved them.

### Step 3 — Send to the TEST contact + log (R7.3, S2/CC-2)
Only reachable when `review_state = APPROVED`.
- Resolve the office's **test** contact for the demo (a Ripples-owned test address, e.g. `reviewer+<office-slug>@ripples.test`). **The real `responsible_office` is never emailed in this version (CC-2 / S2).**
- Send the approved letter to that test address via the email/Slack action connector.
- Write a send-log line: `date, project_id, office, test_contact, "sent"`.
- Record a status change `drafted → sent` (feeds Step 5 and the weekly summary).

### Step 4 — Start the 15-working-day reply clock (R7.3, R7.4)
- Start a reply clock of **15 working days** (Mon–Fri; the ledger holds `clock_started_at` and computes `clock_due` by skipping weekends). Holidays are out of scope for this build (see §11).
- **If a reply arrives before the clock expires:** attach it to the project (store reply text + date against `project_id`) and post it to the **City Page** (demo: the mockup City Page / a draft post routed through the gate). Record a status change `sent → replied`. Reply detection for the demo = a matching inbound message / a new `evidence.csv` row referencing the `project_id` (see §7).
- **If the clock expires with no reply:** record a neutral **"No reply"** for the scorecard against the project and period. Record a status change `sent → no_reply`. "No reply" is a factual record of silence, never an accusation (S3 / CC-3).

### Step 5 — anchor_record (if connected) (R7.5)
On **every** status change in Steps 3–4 (`drafted → sent`, `sent → replied`, `sent → no_reply`):
- **IF the backend action `anchor_record` is connected** → call it with `{project_id, status_change, timestamp, actor: "ripples-automation", sample_data: "yes"}`.
- **ELSE (not connected — the default in this version)** → write the change to the status-change log and **skip** the anchor call. No error; the automation continues. (Design → Error handling: "Backend not connected (R7): log status changes, skip `anchor_record`.")

### Step 6 — Weekly summary (R7.6)
Once per week, send the team a summary message: **letters sent, replies received, silences (No reply) recorded — grouped by city and by agency.** The summary is informational (team-facing) and contains no accusatory language; it reports counts and neutral status words only. See `sample-weekly-summary.md`.

---

## 6. Run-state ledger (what the automation stores)

The automation never mutates the source CSVs. It keeps its own ledger so the daily run is idempotent and the clocks survive restarts.

```
# per project the automation has touched
project_id
last_followup_sent_at      # drives the 30-day recency guard (Rule, §4)
current_draft_ref          # D7 Drafts-queue item id, e.g. draft-mal-wall-letter
review_state               # mirror of D7 state: DRAFT | APPROVED | REJECTED
sent_at                    # timestamp of the test-contact send (null until sent)
test_contact               # the test address used (never a real office)
clock_started_at           # reply-clock start (null until sent)
clock_due                  # start + 15 working days
reply_received_at          # null until a reply is attached
outcome                    # pending | sent | replied | no_reply | rejected
sample_data = yes
```

Status-change log (append-only), one line per transition, also the `anchor_record` payload source:
```
timestamp, project_id, from_state, to_state, anchored(yes|no|skipped)
```

---

## 7. Reply detection (demo)

Live inbound mail/webhooks are future work. For the demo, a reply is recognised when **either**:
1. an inbound message to the test address references the `project_id` / letter reference, or
2. a new `evidence.csv` row appears for the same `project_id` with `source` indicating an office reply (e.g. `latest_reply` text on the project row, which several sample projects already carry — e.g. `mar-wall`'s "DPWH: right-of-way resolved…").

On reply: attach text + date to the project in the ledger, post to the City Page (as a DRAFT post through the gate), mark `outcome = replied`. Otherwise, when `clock_due` passes, mark `outcome = no_reply`.

---

## 8. Safeguard checklist (must all hold before "done")

| ID | Check | How this automation satisfies it |
|---|---|---|
| **S2 / CC-2** | DRAFT until approved; no auto-send; demo sends to test addresses | The automation **blocks on `review_state = DRAFT`** and sends only on `APPROVED`; Step 3 resolves to a **test** address and never emails the real office. |
| **S1 / CC-1** | Never "safe" | It emits no guidance of its own; the D4b letter it carries has no "safe" phrasing and its hazard sentence is conditional. "No reply" / silence records never imply safety. |
| **S3 / CC-3** | Neutral language only | Only neutral status words (`Overdue`, `Needs maintenance`, `Delayed`, `No reply`, `sent`, `replied`); D4b's banned-word guard applies to the letter; the weekly summary reports counts, not judgements. |
| **S4 / CC-4** | Fixed-rule levels only | Selection and letters read `status`/`deadline`/`maintenance`/`gap` verbatim; no risk or advisory level is computed. |
| **S7 / CC-7** | Sample data labeled | Every draft, send log, City-Page post and weekly summary states sample data; ledger rows carry `sample_data = yes`. |
| **(gate)** | No D5 send before a D7 approval | The run can queue many drafts and send zero; a send is reachable **only** from the `APPROVED` branch of Step 2. |

---

## 9. Error handling & edge cases

- **Reviewer never decides:** the project stays blocked at `DRAFT`; nothing sends. It simply waits (and shows as `pending` in the ledger). Safe by default.
- **Reviewer rejects:** stop, log `rejected`, no send. A later run may re-draft (new `DRAFT`).
- **`anchor_record` not connected:** log the status change and skip (R7.5) — no error, no retry storm.
- **Deadline / fields missing or malformed:** skip the project and surface a visible gap in the run log rather than guessing (design: "surface a visible gap rather than guessing"). Do not fabricate a deadline or status.
- **No candidates on a given day:** the run completes with zero drafts; the weekly summary still reports zeros by city/agency.
- **Duplicate sends:** the ledger's `outcome`/`last_followup_sent_at` make the daily run idempotent — an already-sent project is parked by the 30-day guard; an already-queued project is not re-queued.

---

## 10. Exit test (Requirement 7)

> Run stops at the reviewer gate and sends nothing until approved; approval sends to a test address and starts the clock.

Verified in `worked-trace-mal-wall.md`:
1. The daily check selects Malabon's overdue `mal-wall` (Rule A: `status = Delayed`, `deadline = 2026-05 < 2026-10`), among other candidates.
2. The automation calls D4b, gets the DRAFT letter, routes it to D7, and **blocks** — **zero sends** while `review_state = DRAFT`.
3. A reviewer approves in D7 (`DRAFT → APPROVED`). Only then does the automation send to the **test** contact and start the 15-working-day reply clock.

See also `candidate-selection.md` (the full daily selection against `projects.csv`) and `sample-weekly-summary.md`.

---

## 11. Assumptions (documented for review)

- **`today = 2026-10-02`** for the build, from `cities.csv` `as_of = 2026-10`, matching the D4b sample log date.
- **Month-grained deadlines:** "deadline < today" compares the deadline month to the current month (strictly earlier = overdue).
- **30-day recency guard** uses a `last_followup_sent_at` timestamp in the automation's ledger because `projects.csv` records only a `followups_sent` count, not per-send dates. On an empty ledger (first run) all matching projects are eligible.
- **Working-day clock** counts Mon–Fri only; Philippine public holidays are out of scope for this build (a future enhancement would subtract an official holiday calendar).
- **Test contacts** are Ripples-owned addresses of the form `reviewer+<office-slug>@ripples.test`; no real office address is used anywhere in this version.
