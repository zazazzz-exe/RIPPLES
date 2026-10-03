# Flow Specification — D4b "Follow-up letter"

**Component:** D4b — Follow-up letter
**Quick feature:** Quick Flows
**Spec:** `.kiro/specs/ripples-quick-system/` (requirements R5 1–5, CC-2, CC-3; design §D4b)
**Implements prompt:** `quick-prompts.md` → "D4b. Follow-up letter"
**Operating model stage:** Push
**Status:** Build artifact (sample data). This is the configuration contract for the Quick Flow; the flow itself lives inside the Quick space.

> **Sample data.** This flow reads the sample CSVs in `data/`. Every letter it emits states it is sample data and uses real city/office names only to show how the system works — it does not describe the real status of any LGU, DPWH, DENR or MMDA record.

---

## 1. Purpose

Given one `project_id`, draft a formal, strictly neutral follow-up letter to the office responsible for a climate-defense project, asking for status and three Freedom-of-Information (FOI) items, stating the reply clock, and (only when a hazard advisory is active for the city) adding one sentence on why the defense matters this week. The letter is emitted as **DRAFT** for the Reviewer app (D7); nothing sends from this flow.

## 2. Interface

| | |
|---|---|
| **Input** | `project_id` (string, lowercase slug — e.g. `mal-wall`) |
| **Reads** | `data/projects.csv` (project row), `data/cities.csv` (city row), `data/advisories.csv` (active-advisory check) |
| **Output** | (a) a DRAFT letter (plain text / Markdown), (b) a one-line log entry |
| **Side effects** | None. The flow never sends, emails, or publishes. Output is a draft routed to D7. |

### Input validation
- IF `project_id` is not found in `projects.csv` THEN stop and return a visible error: `project_id "<id>" not found in projects.csv (sample data)`. Do not fabricate a project.
- The flow does **not** recompute any risk or advisory level (CC-4). It only reads precomputed fields and the advisory rows.

## 3. Field mapping (projects.csv → letter)

| Letter element | CSV source |
|---|---|
| Responsible office (addressee) | `projects.responsible_office` |
| Agency | `projects.agency` |
| Project name | `projects.project` |
| LCCAP commitment / description | `projects.summary` + `projects.lccap_source` |
| Budget | `projects.budget_php_millions` (₱ millions) |
| Deadline | `projects.deadline` |
| Current status | `projects.status` |
| Progress | `projects.progress_pct` |
| Gap (neutral status word) | `projects.gap` |
| Interim measure context | `projects.interim_measure` |
| Follow-ups already sent / replied | `projects.followups_sent`, `projects.followups_replied` |
| City | `projects.city` / join `projects.city_id → cities.city_id` |

## 4. Steps

### Step 1 — Read the records
1. Look up the project row in `projects.csv` by `project_id`.
2. Join to the city row in `cities.csv` on `city_id`.
3. Carry forward the fields in the table above. Keep `gap` verbatim (`Overdue`, `Needs maintenance`, etc.) — these are the only status words allowed (CC-3 / S3).

### Step 2 — Draft the neutral letter
Compose a formal letter addressed to `responsible_office`. The body states, factually and without judgement:
- the LCCAP commitment (what the project is, from `summary` + `lccap_source`);
- the budget (`budget_php_millions`);
- the deadline (`deadline`);
- the current status (`status`) and progress (`progress_pct`);
- the gap (`gap`), described only with the neutral status word.

Then make **three requests** (all three are mandatory — this is the exit-test contract):
1. **Request 1 — Progress + date:** current progress and a revised completion date.
2. **Request 2 — Interim measures:** interim measures for affected barangays this season.
3. **Request 3 — FOI report:** a copy of the latest progress report under **Executive Order No. 2, s. 2016 (Freedom of Information)** or the applicable local FOI ordinance.

### Step 3 — Reply-clock statement
State that the reply will be posted in full on the City Page, and that **"No reply"** will be recorded after **15 working days** (R5.3). "No reply" is a neutral record, not an accusation.

### Step 4 — Conditional hazard sentence
Check `advisories.csv` for any row where `city_id` matches the project's city. 
- IF one or more active typhoon/rainfall/flood/coastal advisories affect the city THEN add exactly **one** sentence explaining why this defense matters this week, naming the advisory type/level and source (e.g. "PAGASA (sample)"). 
- ELSE omit the sentence entirely. Do not fabricate an advisory, and do not say the city is "safe" when none is active (S1).

### Step 5 — Emit DRAFT + log entry
- Emit the letter with a visible **DRAFT** marker and a sample-data line (S2 / S7).
- Append a one-line log entry: `date, project_id, office, "drafted"`.

## 5. Safeguard checks (must all hold before "done")

| ID | Check | How this flow satisfies it |
|---|---|---|
| **S2 / CC-2** | DRAFT until approved; no auto-send | Output carries a DRAFT marker; flow has no send/publish action. Routed to D7. |
| **S3 / CC-3** | Neutral language only | Only `gap` status words used; a banned-word guard rejects accusatory terms (see §6). |
| **S1 / CC-1** | Never "safe" | No "safe"/"out of danger" phrasing; hazard sentence is conditional and omitted when no advisory. |
| **S4 / CC-4** | Fixed-rule levels only | Flow reads advisory rows / precomputed fields; it never scores risk or advisory level. |
| **S7 / CC-7** | Sample data labeled | Letter header and log state sample data. |

## 6. Neutral-language guard (S3 / CC-3)

Before emitting, scan the draft. Reject and re-draft if any of these (or similar) appear:
`corrupt, corruption, negligent, negligence, lying, liar, incompetent, lazy, fault, blame, scandal, anomaly, deceit, cover-up, failed to, refuse(d) to, ignored`.

Allowed status vocabulary only: `overdue`, `disputed`, `needs maintenance`, `no reply`, `delayed`, `in progress`, `not started`, `completed`.

## 7. Exit test

> Letter for Malabon's overdue river wall (`mal-wall`) is neutral, marked DRAFT, and contains all three requests.

See `sample-letter-mal-wall.md` for the worked, verified output.
