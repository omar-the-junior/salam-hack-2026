# UC-010 — AI email parsing and review queue

---

## 1. Header

| Field | Value |
| ----- | ----- |
| Use case ID | `UC-010` |
| Title | AI email parsing and review queue |
| Status | Draft |
| Priority | P0 |
| Owner | TBD |
| Last updated | 2026-04-27 |

---

## 2. Summary

After the email scan job completes (`UC-009`), the user is directed to a **review queue** — a list of cards showing every subscription or payment the AI detected. Each card shows the service name, detected amount, billing cycle, and a **confidence badge**. The user **approves or rejects** each item individually. Approved items are converted into `expense_cards` in the expense dashboard. Rejected items are discarded. This UC also specifies the `ScanEmailsJob` internals: how emails are fetched from Gmail, filtered, parsed by Gemini, and stored as review candidates.

---

## 3. Actors and context

### Primary actor

Authenticated freelancer or small business owner.

### Secondary actors

- **System:** Laravel MVC + Inertia v3 + React; SQLite; Gmail API; Gemini API (gemini-2.5-pro)

### Preconditions

- [ ] `connected_accounts` row exists with a valid Gmail OAuth token (`UC-009`)
- [ ] `email_scans` row exists with `status = completed` and at least one `email_scan_results` row
- [ ] User navigates to the review queue (via toast link or directly from the Email Scanner page)

### Postconditions (success — review)

- [ ] Approved items: one `expense_cards` row created per approval, with `auto_detected = true` and `source_email_id` set
- [ ] Rejected items: `email_scan_results.status = rejected`; no expense card created
- [ ] Review queue shows remaining unreviewed items; completed items are removed from the queue

### Postconditions (failure — if applicable)

- [ ] If Gmail API fetch fails mid-job: scan status set to `failed`; partial results (if any) are discarded
- [ ] If Gemini returns unparseable JSON for an email: that email is skipped; scan continues

---

## 4. Traceability

| Type | IDs / references |
| ---- | ---------------- |
| Functional requirements | `FR-11` |
| Non-functional requirements | `NFR-05` (email scanning limited to payment/subscription signals only), `NFR-04` (source attribution on created expense cards) |
| PRD | `docs/prd.md` — §6.3.2 Scanning Flow; §6.3.3 AI Email Parsing Prompt Design; §6.3.4 Known Sender Whitelist |
| Architecture | `docs/technical-specs.md` — §3.3–3.5; Gmail API; Gemini API |
| Depends on | `UC-009` — Gmail connected + scan job dispatched |
| Feeds into | `UC-007` — approved items appear as expense cards in the expense dashboard |

---

## 5. User journey (happy path)

### 5.1 `ScanEmailsJob` internals (background)

This job runs after being dispatched by `UC-009`. Steps:

**Step 1 — Update scan status:**
- `UPDATE email_scans SET status = 'in_progress', started_at = now()`

**Step 2 — Fetch emails from Gmail API:**

```
Query: last 6 months
Filter (Gmail search query):
  subject:(receipt OR invoice OR subscription OR renewal OR charged OR "payment confirmed" OR "payment received")
  newer_than:180d
Limit: first 500 results (sufficient for demo; paginate if needed)
```

Also filter by known sender domains from the pre-built whitelist (Notion, Figma, Adobe, GitHub, Vercel, etc.) to reduce noise.

**Step 3 — Candidate selection:**

For each fetched email, apply heuristics to decide if it's worth sending to Gemini:
- Has an amount pattern (`$X.XX`, `EGP X`, `USD X`)
- OR sender domain matches the known whitelist
- Skip promotional/marketing emails with no transaction amount

**Step 4 — Gemini parsing (batch):**

For each candidate email, call Gemini with the parsing prompt (from PRD §6.3.3):

```
System: You are a financial data extractor. Given an email,
extract subscription/payment information as JSON.

Extract:
- service_name: string
- amount: number
- currency: string (USD/EGP/EUR etc)
- billing_cycle: monthly|annual|one-time|unknown
- billing_date: date (ISO format)
- confidence: high|medium|low

If the email is not about a payment or subscription, return null.
Respond only with valid JSON.
```

**Step 5 — Store results:**

For each non-null Gemini response, insert into `email_scan_results`:

```
{
  email_scan_id, user_id,
  service_name, amount, currency, billing_cycle, billing_date, confidence,
  raw_email_id, raw_email_subject, raw_email_snippet,
  status: 'pending'  -- awaiting user review
}
```

Duplicates: check `raw_email_id` — do not re-insert if already processed.

**Step 6 — Finalize:**
- `UPDATE email_scans SET status = 'completed', completed_at = now(), found_count = N`

---

### 5.2 Review queue page (`GET /email-scanner/review`)

Controller returns `Inertia::render('EmailScanner/Review', [ 'results' => [...pending items] ])`.

Page layout:

**Header:**
- *"We found [N] subscriptions in your emails. Review and add them to your expense tracker."*
- A **"Approve all"** button (adds all pending items at once — convenience shortcut)

**Results list — one card per detected item:**

Each card shows:
- **Service name** (large, bold) — e.g. "Figma"
- **Amount + currency** — e.g. "$15 / month"
- **Billing cycle** — badge: Monthly · Annual · One-time · Unknown
- **Detected date** — e.g. "From email: Mar 12"
- **Confidence badge:** High (green) · Medium (yellow) · Low (red)
- **Email snippet** — one line of the email subject for context (e.g. *"Your Figma subscription has been renewed"*)
- **Action buttons:**
  - ✅ **"Add to expenses"** — approves this item
  - ✗ **"Reject"** — dismisses this item

Cards with `confidence = low` are shown with a subtle amber border to signal the user should review carefully.

**Empty state:**
- If all items have been reviewed: *"All done! Your approved subscriptions are now in your expense tracker."* + **"Go to expenses →"** button

---

### 5.3 User approves an item

1. User clicks **"Add to expenses"** on a card → Inertia `POST /email-scanner/results/{result_id}/approve`.
2. Controller:
   - Validates: result belongs to user, status = `pending`
   - Creates an `expense_cards` row:
     - `name` = `result.service_name`
     - `amount` = `result.amount`
     - `currency` = `result.currency`
     - `billing_cycle` = `result.billing_cycle` (map `unknown` → `monthly` as default)
     - `next_renewal_date` = estimated from `result.billing_date` + one billing cycle (or `null` if unknown)
     - `status` = `active`
     - `auto_detected` = `true`
     - `source_email_id` = `result.raw_email_id`
     - `category` = `saas` (default; user can edit later)
   - Updates `email_scan_results.status = approved`
3. Card is removed from the review queue in the UI (page re-renders without it via Inertia redirect-back or optimistic update).

### 5.4 User rejects an item

1. User clicks **"Reject"** → Inertia `POST /email-scanner/results/{result_id}/reject`.
2. Controller: updates `email_scan_results.status = rejected`. No expense card created.
3. Card is removed from the review queue.

### 5.5 "Approve all" shortcut

1. User clicks **"Approve all"** → Inertia `POST /email-scanner/results/approve-all`.
2. Controller:
   - Fetches all `pending` results for the current user's latest scan
   - Creates expense cards for each (same logic as 5.3)
   - Updates all `status = approved`
3. Redirects to `GET /expenses` with flash: *"[N] subscriptions added to your expense tracker."*

---

## 6. Alternative and error flows (minimal)

| # | Condition | Expected behavior |
| - | --------- | ----------------- |
| A1 | Gemini returns null for an email | That email is skipped; scan continues with remaining candidates |
| A2 | Gemini JSON is unparseable | Skip that email; log a warning; scan continues |
| A3 | Gmail API returns an error mid-scan | Job catches the exception, sets `email_scans.status = failed`, stops processing |
| A4 | User opens review page with no pending items (all reviewed) | Empty state shown: "All done! Go to expenses →" |
| A5 | User opens review page before scan completes | Redirect to Email Scanner page showing "Scan in progress" status |
| A6 | Duplicate email_id (webhook / scan re-run) | `raw_email_id` uniqueness check prevents duplicate `email_scan_results` rows |
| A7 | `approve-all` on a large batch | Process synchronously for MVP (acceptable for hackathon data volumes); wrap in a DB transaction |

---

## 7. Data and contracts

### Entities / tables (SQLite)

**`email_scan_results`:**

```
id                  uuid / bigint  PK
email_scan_id       FK → email_scans
user_id             FK → users
service_name        string
amount              decimal(10,2)  nullable
currency            string         nullable
billing_cycle       enum           'monthly' | 'annual' | 'one-time' | 'unknown'
billing_date        date           nullable
confidence          enum           'high' | 'medium' | 'low'
raw_email_id        string         unique   -- Gmail message ID; prevents duplicates
raw_email_subject   string         nullable
raw_email_snippet   text           nullable -- one-line preview for display
status              enum           'pending' | 'approved' | 'rejected'  default 'pending'
created_at          datetime
```

### Key reads / writes

- **ScanEmailsJob:** batch `INSERT` into `email_scan_results`; idempotent on `raw_email_id`
- **Review page:** `SELECT * FROM email_scan_results WHERE user_id = ? AND status = 'pending' ORDER BY confidence DESC`
- **Approve:** `INSERT expense_cards` + `UPDATE email_scan_results SET status = 'approved'` — in one transaction
- **Reject:** `UPDATE email_scan_results SET status = 'rejected'`
- **Approve-all:** same as Approve but in a loop within a DB transaction

### External integrations

| Integration | Purpose | Notes |
| ----------- | ------- | ----- |
| Gmail API | Fetch emails in `ScanEmailsJob` | Uses `connected_accounts.access_token`; refreshes if expired |
| Gemini API (gemini-2.5-pro) | Parse each candidate email into structured fields | JSON-constrained prompt; null = skip |

---

## 8. Mock and assumption box (hackathon)

- **Sandbox assumptions:** Reference: [Salam Hack 2026 Sandbox Assumptions](https://raw.githubusercontent.com/tariqlabs/salamhack-resources/refs/heads/main/2026/assumptions.md).
- **Demo data:** Seed 5–8 `email_scan_results` rows with `status = pending` so the review queue is ready to demo without needing to run a live Gmail scan. Use real service names (Figma, Notion, GitHub, Adobe, Spotify) with varied confidence levels.
- **Gemini batching:** For hackathon, process candidate emails **sequentially** (not in parallel) to avoid rate limits and keep the code simple. Acceptable for demo data volumes.
- **Known sender whitelist:** Hardcoded array in the job class. No DB table needed.
- **`next_renewal_date` estimation:** If `billing_date` is known and `billing_cycle = monthly`, set `next_renewal_date = billing_date + 1 month`. If unknown, leave null — user can edit on the expense card.

---

## 9. Acceptance criteria (testable)

- [ ] Given the scan job completes, when the user visits `/email-scanner/review`, then a card is shown for each `pending` `email_scan_results` row with service name, amount, billing cycle, and confidence badge
- [ ] Given a card with `confidence = low`, then it has an amber border distinguishing it from high/medium cards
- [ ] Given the user clicks "Add to expenses" on a card, then an `expense_cards` row is created with `auto_detected = true` and the card is removed from the review queue
- [ ] Given the user clicks "Reject" on a card, then `status = rejected` and no expense card is created
- [ ] Given "Approve all" is clicked, then all `pending` items are approved and expense cards created in one action
- [ ] Given all items are reviewed, then the empty state "All done! Go to expenses →" is shown
- [ ] Given a duplicate `raw_email_id` in a re-scan, then no duplicate `email_scan_results` row is created
- [ ] Given the Gemini API returns null for an email, then that email is silently skipped and the scan continues
- [ ] Given the review page is opened while the scan is still in progress, then the user is redirected to the scanner status page

---

## 10. Scope boundaries

### In scope

- `ScanEmailsJob` internals: Gmail API fetch, heuristic candidate filtering, Gemini parsing, `email_scan_results` storage
- Review queue page: card list with Approve / Reject / Approve-all
- Expense card creation on approval (`auto_detected = true`, `source_email_id` set)
- Confidence badge display

### Out of scope (this use case only)

- Gmail OAuth connection (`UC-009`)
- Ongoing email watch (new subscription emails auto-detected going forward — post-MVP)
- AI category suggestion beyond default `saas` (P2)
- Editing the detected values before approving (user can edit the expense card after creation)

---

## 11. Demo script snippet

1. Navigate to the review queue (`/email-scanner/review`) — show the seeded list of 8 detected subscriptions.
2. Point out the confidence badges — one High, some Medium, one Low (amber border).
3. Click **"Add to expenses"** on "Figma · $15 / month · High confidence" — card disappears from queue.
4. Click **"Reject"** on a low-confidence item.
5. Click **"Approve all"** on the remaining items — all disappear, empty state shown.
6. Navigate to the expense dashboard — show all approved cards now appear with "Auto-detected" badges.

---

## 12. Decisions (resolved)

| Topic | Decision |
|-------|----------|
| Review queue display | Card list (not table) — richer visual context with confidence badge, email snippet, and clear Approve/Reject CTA per item |
| Approve-all | Available as a convenience shortcut — wrapped in a DB transaction for data integrity |
| Low-confidence card styling | Amber border (not hidden) — user should see and consciously decide, not have the system filter them out |
| `next_renewal_date` estimation | Computed from `billing_date + 1 cycle` if possible; null if unknown — user can always edit |
| Default category on approval | `saas` — most common type for auto-detected subscriptions; editable on the expense card |
| Gemini batching | Sequential for MVP — simpler code, sufficient for demo volumes |
