# UC-006 — Income entry and dashboard

---

## 1. Header

| Field | Value |
| ----- | ----- |
| Use case ID | `UC-006` |
| Title | Income entry and dashboard |
| Status | Draft |
| Priority | P0 |
| Owner | TBD |
| Last updated | 2026-04-27 |

---

## 2. Summary

The income dashboard gives the freelancer a real-time picture of their earnings. It consists of three **summary cards** (total earned this month, pending, overdue), a **bar chart** (this month by week, togglable to last 6 months), and a **paginated income list** showing all entries. Paid payment links are **auto-logged** as income entries via `PaymentPaidJob` (`UC-003`, `UC-005`) — no manual re-entry needed. The freelancer can also add income from external sources (Upwork, Fawry transfer, bank deposit) through a dedicated **"Add income" page**. Income entries are read-only in the list for MVP; editing is out of scope.

---

## 3. Actors and context

### Primary actor

Authenticated freelancer or small business owner.

### Secondary actors

- **System:** Laravel MVC + Inertia v3 + React; SQLite; `PaymentPaidJob` (auto-logging trigger)

### Preconditions

- [ ] User is authenticated and onboarded (`UC-001b`)
- [ ] `income_entries` table is migrated
- [ ] At least one paid payment link exists (for auto-log demo) or a manual entry has been added

### Postconditions (success — dashboard view)

- [ ] Dashboard loads with correct summary cards, chart, and income list for the current user
- [ ] Auto-logged entries from paid payment links appear in the list without any user action

### Postconditions (success — manual income entry)

- [ ] A new `income_entries` row exists with all fields persisted
- [ ] The entry is immediately reflected in the dashboard summary and list on next load

### Postconditions (failure — if applicable)

- [ ] If `PaymentPaidJob` fails to create an income entry, the payment link status is still marked Paid — income logging failure must not block payment confirmation
- [ ] Manual entry validation failure: no DB row created; user sees inline errors

---

## 4. Traceability

| Type | IDs / references |
| ---- | ---------------- |
| Functional requirements | `FR-06` |
| Non-functional requirements | `NFR-01` (golden-path demo), `NFR-04` (source attribution on all entries), `NFR-07` (Arabic-first, RTL) |
| PRD | `docs/prd.md` — §4 Module 2: Income Manager; §4.3.2 Income Dashboard; §4.3.3 Smart Income Tagging |
| Architecture | `docs/technical-specs.md` — §3.3–3.5 |
| Depends on | `UC-001b` (auth), `UC-003` / `UC-005` (auto-logging via `PaymentPaidJob`) |
| Feeds into | `UC-013` — income export (FR-14); `FR-15` — tax estimate widget reads from this data |

---

## 5. User journey (happy path)

### 5.1 Income dashboard page (`GET /income`)

Controller returns `Inertia::render('Income/Index', [...props])` with:

**Summary cards (top row):**

| Card | Value | Source |
|------|-------|--------|
| Total earned this month | Sum of `income_entries` where `date` is within current calendar month | `income_entries` |
| Pending | Sum of `payment_links` with `status = Pending` owned by the user | `payment_links` |
| Overdue | Sum of `payment_links` with `status = Overdue` owned by the user | `payment_links` |

> Pending and Overdue pull from `payment_links` directly (not from `income_entries`) because they haven't been received yet.

**Bar chart (middle section):**

- **Default view:** This month, broken down by week (4–5 bars, each bar = sum of income in that ISO week)
- **Toggle:** "Last 6 months" view — one bar per month
- Toggle is a button group (e.g. `This month | Last 6 months`) in the top-right of the chart card
- Chart data is passed as a prop from the controller (pre-aggregated server-side — no separate AJAX call)
- Chart library: use whatever lightweight option is in the React stack (e.g. Recharts or Chart.js)

**Income list (bottom section):**

Each row shows:

| Column | Value |
|--------|-------|
| Amount | Formatted with currency |
| Source badge | `Payment Link` (blue) · `Manual` (grey) · `Email Parsed` (purple) |
| Client | `client_name` if set; "—" if empty |
| Category | e.g. "Freelance", "Product Sale", "Consulting" |
| Date | Formatted (e.g. "Apr 20") |

- Default sort: newest first
- Default filter: current month
- Filter controls: **Month picker** (prev/next arrows + current month label) · **Source** (All / Payment Link / Manual / Email Parsed) · **Category** (All + list of used categories)
- No edit or delete actions on rows for MVP — entries are append-only
- Pagination or infinite scroll (team's choice); show 20 per page

**Empty state:**
- If no income entries yet: illustration + "No income recorded yet" + two CTA buttons: **"Create a payment link"** and **"Add income manually"**

---

### 5.2 Auto-logging from paid payment links

Triggered inside `PaymentPaidJob` (defined in `UC-003`) after a payment link is marked Paid:

1. Insert into `income_entries`:
   - `user_id` = payment link owner
   - `amount` = `payment_link.total_amount` (what was actually received, tax-inclusive)
   - `currency` = `payment_link.currency`
   - `date` = `payment_link.paid_at` (date portion)
   - `source` = `payment_link`
   - `client_name` = `payment_link.client_name`
   - `category` = `Freelance` (default for MVP; AI tagging is P2)
   - `reference_id` = `payment_link.id`
   - `description` = `payment_link.description`

> **Tax note (MVP):** `total_amount` is recorded as income for simplicity. Separating tax-collected from net income is a post-MVP accounting feature.

---

### 5.3 "Add income" page (`GET /income/create`)

Separate create page — same structural pattern as payment link creation.

Controller returns `Inertia::render('Income/Create', [ 'categories' => [...], 'preferred_currency' => ... ])`.

**Form fields:**

| Field | Label | Input | Notes |
|-------|-------|-------|-------|
| `amount` | Amount | Number | Required |
| `currency` | Currency | Toggle (EGP / USD) | Defaults to `preferred_currency` |
| `date` | Date received | Date picker | Defaults to today |
| `source_label` | Source | Select | Upwork · Fiverr · Bank transfer · Fawry · Vodafone Cash · Other |
| `client_name` | Client name | Text | Optional |
| `category` | Category | Select | Freelance · Product Sale · Consulting · Content · Other |
| `description` | Description / notes | Textarea | Optional |

**Behaviour:**
- User submits → Inertia `POST /income`
- Controller validates, inserts row with `source = manual`, redirects to `GET /income` with flash: *"Income entry added."*

---

## 6. Alternative and error flows (minimal)

| # | Condition | Expected behavior |
| - | --------- | ----------------- |
| A1 | `PaymentPaidJob` income insert fails | Log error; payment link status remains `Paid`; income entry can be added manually by the user |
| A2 | Manual entry submitted with missing amount | Redirect back with Inertia validation error; no DB write |
| A3 | User switches month filter to a month with no entries | List shows empty state for that month; summary cards show 0; chart shows flat bars |
| A4 | Auto-logged entry is a duplicate (webhook fires twice) | `PaymentPaidJob` idempotency check (`reference_id` unique constraint on `income_entries`) prevents duplicate row |

---

## 7. Data and contracts

### Entities / tables (SQLite)

**`income_entries`:**

```
id              uuid / bigint  PK
user_id         FK → users
amount          decimal(10,2)   -- total amount received (tax-inclusive for payment link entries)
currency        string          -- 'EGP' | 'USD'
date            date            -- date income was received
source          enum            -- 'payment_link' | 'manual' | 'email_parsed'
source_label    string          nullable  -- e.g. 'Upwork', 'Fiverr', 'Bank transfer' (for manual entries)
client_name     string          nullable
category        string          -- 'Freelance' | 'Product Sale' | 'Consulting' | 'Content' | 'Other'
description     text            nullable
reference_id    string          nullable  unique  -- payment_link.id or email_id; prevents duplicate auto-logs
created_at      datetime
updated_at      datetime
```

**`users` / `profiles`** — no new columns for this UC.

### Key reads / writes

- **Dashboard load:** Single query per card + aggregation for chart data — all server-side, passed as Inertia props
  - Monthly total: `SUM(amount) WHERE user_id = ? AND date BETWEEN first_day AND last_day`
  - Chart data: `SUM(amount) GROUP BY week/month`
  - Income list: `SELECT * WHERE user_id = ? ORDER BY date DESC LIMIT 20 OFFSET ?`
- **Auto-log (PaymentPaidJob):** `INSERT ... ON CONFLICT (reference_id) DO NOTHING` — idempotent
- **Manual create:** `INSERT INTO income_entries` with `source = manual`, no `reference_id`

### External integrations

| Integration | Purpose | Notes |
| ----------- | ------- | ----- |
| Mock payment gateway | N/A (income is logged after webhook — no gateway call in this UC) | |
| Gemini API | AI category suggestion (P2 — not in MVP) | Stub in code; return default `'Freelance'` for now |
| Other | N/A | |

---

## 8. Mock and assumption box (hackathon)

- **Sandbox assumptions:** All amounts are self-reported or derived from mock payments. No bank API required. Reference: [Salam Hack 2026 Sandbox Assumptions](https://raw.githubusercontent.com/tariqlabs/salamhack-resources/refs/heads/main/2026/assumptions.md).
- **Seeded data:** For demo, seed 5–8 income entries across 3–4 months (mix of `payment_link` and `manual` sources) so the chart and filters are non-trivial to show.
- **Currency normalization:** PRD states all amounts stored in base currency (EGP) with USD converted at time of entry. For MVP: store in original currency and display as-is; currency normalization for the summary cards is a Day 4 polish item.

---

## 9. Acceptance criteria (testable)

- [ ] Given a paid payment link, when `PaymentPaidJob` runs, then an `income_entries` row exists with `source = payment_link`, correct `amount`, `client_name`, and `reference_id`
- [ ] Given a duplicate webhook (same `reference_id`), when `PaymentPaidJob` runs again, then no duplicate income entry is created
- [ ] Given the income dashboard, when it loads, then the "Total earned this month" card shows the correct sum for the current calendar month
- [ ] Given the income dashboard, when the user clicks "Last 6 months", then the chart re-renders with monthly bars (no page reload — toggle updates props or local state)
- [ ] Given the month picker, when the user navigates to a previous month, then the income list and summary card update to show that month's data
- [ ] Given an authenticated user, when they submit a valid manual income entry, then a row with `source = manual` exists and a flash confirmation appears on the income dashboard
- [ ] Given a manual entry with no amount, when submitted, then no DB row is created and a validation error is shown
- [ ] Given no income entries, when the dashboard loads, then the empty state with two CTAs is shown instead of the list
- [ ] Given Arabic locale, then dashboard, chart labels, and form render RTL correctly (`NFR-07`)

---

## 10. Scope boundaries

### In scope

- Income dashboard: 3 summary cards + bar chart (week/month toggle) + income list with filters
- Auto-logging from paid payment links (via `PaymentPaidJob`)
- Manual income entry via a separate create page
- Month-based filtering and source/category filters on the list
- Empty state with CTAs

### Out of scope (this use case only)

- AI category auto-suggestion (P2 — stub returns `'Freelance'` default)
- Income from email parsing (logged by `UC-010`)
- Currency normalization across EGP/USD (Day 4 polish)
- Editing or deleting income entries (post-MVP)
- Income export to CSV/PDF (`UC-013`)
- Tax estimate widget (`FR-15`, P2)
- Per-client and per-category breakdown drilldown views (P1 polish)

---

## 11. Demo script snippet

1. Show the income dashboard — summary cards populated with seeded data.
2. Toggle the chart between "This month" and "Last 6 months".
3. Open the payment link pay page in another tab, complete mock checkout (`UC-003`).
4. Return to income dashboard — refresh — show the new auto-logged entry at the top of the list with source badge "Payment Link".
5. Click **"Add income manually"** — fill in "Upwork payout · 1,200 EGP · Freelance" — submit.
6. Show the new manual entry in the list and the updated "Total earned this month" card.

---

## 12. Decisions (resolved)

| Topic | Decision |
|-------|----------|
| Chart default | This month by week (most actionable for day-to-day use); toggle to last 6 months for trend view |
| Chart toggle | Button group (no separate page load) — controller passes both datasets as props; React shows the active one |
| Manual entry UX | Separate create page (consistent with payment link pattern; avoids modal complexity) |
| Income list actions | Read-only for MVP — no edit/delete on rows; append-only to preserve financial record integrity |
| Auto-log amount | Records `total_amount` (tax-inclusive) for simplicity; net income vs tax separation is post-MVP |
| Duplicate prevention | `reference_id` unique constraint + `INSERT ... ON CONFLICT DO NOTHING` in `PaymentPaidJob` |
| Empty state | Two CTAs guide the user to the two most common first actions |
