# UC-007 — Expense card CRUD and dashboard

---

## 1. Header

| Field | Value |
| ----- | ----- |
| Use case ID | `UC-007` |
| Title | Expense card CRUD and dashboard |
| Status | Draft |
| Priority | P0 |
| Owner | TBD |
| Last updated | 2026-04-27 |

---

## 2. Summary

The expense dashboard gives the freelancer full visibility into their business spending. It opens with two **summary cards** (total monthly burn, total annual commitment), then a **responsive grid of expense cards** — each showing the service name, amount, next renewal date, and status. The freelancer can **create** and **edit** expense cards on a dedicated page, and **cancel** a subscription through a mini-flow that surfaces the AI-fetched cancel instructions (`UC-008`) before confirming. Cards detected automatically by the email scanner (`UC-010`) also appear here with an "Auto-detected" badge.

---

## 3. Actors and context

### Primary actor

Authenticated freelancer or small business owner.

### Secondary actors

- **System:** Laravel MVC + Inertia v3 + React; SQLite
- **AI Cancel Assistant (`UC-008`):** invoked from within the cancel flow

### Preconditions

- [ ] User is authenticated and onboarded (`UC-001b`)
- [ ] `expense_cards` table is migrated

### Postconditions (success — create / edit)

- [ ] One `expense_cards` row is created or updated with all validated fields
- [ ] Dashboard immediately reflects the new/updated card on redirect

### Postconditions (success — cancel)

- [ ] `expense_cards.status = Cancelled`; card moves to a "Cancelled" visual state in the grid
- [ ] No accidental cancellation without explicit user confirmation

### Postconditions (failure — if applicable)

- [ ] Validation failure on create/edit: no DB write; user sees inline errors
- [ ] Cancelling a card that is already Cancelled: no-op; handled gracefully

---

## 4. Traceability

| Type | IDs / references |
| ---- | ---------------- |
| Functional requirements | `FR-07`, `FR-08` |
| Non-functional requirements | `NFR-01` (golden-path demo), `NFR-07` (Arabic-first, RTL) |
| PRD | `docs/prd.md` — §5 Module 3: Expense & SaaS Subscription Manager; §5.3 Expense Card Object; §5.4 Features |
| Architecture | `docs/technical-specs.md` — §3.3–3.5 |
| Depends on | `UC-001b` (auth + profile) |
| Feeds into | `UC-008` — AI cancel instructions surfaced in the cancel flow; `UC-010` — auto-detected cards land here; `UC-011` — renewal alerts read from `expense_cards` |

---

## 5. User journey (happy path)

### 5.1 Expense dashboard (`GET /expenses`)

Controller returns `Inertia::render('Expenses/Index', [...props])`.

**Summary cards (top row):**

| Card | Value | How calculated |
|------|-------|----------------|
| Total monthly burn | Sum of all `Active` recurring expense cards, normalized to monthly cost | `SUM(amount)` for Monthly cards + `SUM(amount / 12)` for Annual cards |
| Total annual commitment | Sum of all `Active` recurring expense cards, normalized to annual cost | `SUM(amount * 12)` for Monthly + `SUM(amount)` for Annual |

> One-time expense cards are excluded from both summary calculations.

**Filter and sort bar (below summary cards):**

- **Filter by status:** All · Active · Paused · Cancelled
- **Filter by category:** All · SaaS · Tool · Equipment · Marketing · Other
- **Filter by billing cycle:** All · Monthly · Annual · One-time
- **Sort by:** Next renewal (default) · Amount (high→low) · Name (A→Z)

**Expense card grid:**

Cards are displayed in a responsive grid (3 columns on desktop, 2 on tablet, 1 on mobile). Each card contains:

- **Service icon / logo:** Attempt to load from a known logo source (e.g. Clearbit logo API by domain); fallback to a colored circle with the first letter of the service name
- **Service name** (bold)
- **Amount + billing cycle:** e.g. "150 EGP / month" or "$15 / year"
- **Next renewal date:** e.g. "Renews May 3" — shown in amber if within 7 days, red if overdue
- **Status badge:** `Active` (green) · `Paused` (yellow) · `Cancelled` (grey, card is visually dimmed)
- **Auto-detected badge:** shown on cards created by the email scanner (`auto_detected = true`)
- **Action menu (⋯):** Edit · Cancel (or Re-activate if already Cancelled/Paused)

**Empty state:**
- Illustration + "No expenses tracked yet" + two CTAs: **"Add expense manually"** and **"Scan my emails"** (links to `UC-009`)

---

### 5.2 Create expense card (`GET /expenses/create`)

Controller returns `Inertia::render('Expenses/Create', [ 'preferred_currency' => ... ])`.

**Form fields:**

| Field | Label | Input | Notes |
|-------|-------|-------|-------|
| `name` | Service name | Text | Required. e.g. "Figma Pro" |
| `category` | Category | Select | SaaS · Tool · Equipment · Marketing · Other |
| `type` | Type | Toggle | Recurring / One-time |
| `amount` | Amount | Number | Required |
| `currency` | Currency | Toggle (EGP / USD) | Defaults to `preferred_currency` |
| `billing_cycle` | Billing cycle | Select | Monthly · Annual · One-time (hidden when type = One-time; auto-set to One-time) |
| `next_renewal_date` | Next renewal date | Date picker | Required when type = Recurring |
| `started_at` | Started on | Date picker | Optional |
| `alert_days_before` | Remind me before renewal | Number | Default: 7; shown only for Recurring type |
| `cancel_url` | Cancel URL | URL input | Optional — can be filled later or by AI |
| `notes` | Notes | Textarea | Optional |

- Submit → Inertia `POST /expenses`
- Controller validates, inserts row with `status = Active`, `auto_detected = false`, redirects to `GET /expenses` with flash: *"Expense card added."*

---

### 5.3 Edit expense card (`GET /expenses/{id}/edit`)

Same form as create, pre-filled with current values.

- Submit → Inertia `PUT /expenses/{id}`
- Controller validates, updates row, redirects to `GET /expenses` with flash: *"Expense card updated."*
- Ownership check: `expense_cards.user_id = auth()->id()` — return `403` otherwise

---

### 5.4 Cancel flow (mini-flow, not a full page)

Triggered when the user clicks **"Cancel"** from the card's action menu (⋯).

**Step 1 — Cancel instructions panel:**

1. A **slide-over panel** opens on the right side of the screen (no page navigation).
2. Panel header: "Cancel [service name]"
3. The panel checks `expense_cards.cancel_instructions`:
   - **If instructions exist** (already fetched by `UC-008`): show them immediately
     - Cancel URL (clickable link)
     - Step-by-step instructions
     - Any notes (e.g. "Cancelling mid-cycle means no refund")
   - **If instructions are empty:** show a prompt — *"We don't have cancel instructions for this service yet."* + a **"Get cancel instructions →"** button that triggers `UC-008` inline (the AI result populates the panel without closing it)

**Step 2 — Confirmation:**

At the bottom of the panel (always visible regardless of instruction state):

> *"Have you cancelled this subscription?"*
> [**Confirm cancellation**] button · [Cancel / close] button

4. User clicks **"Confirm cancellation"** → Inertia `PUT /expenses/{id}/status` with `{ status: 'cancelled' }`.
5. Controller updates `expense_cards.status = Cancelled`.
6. Panel closes. Card in the grid updates to dimmed / Cancelled badge.

**Re-activate:** From the action menu of a Cancelled or Paused card, "Re-activate" → `PUT /expenses/{id}/status` with `{ status: 'active' }` — no confirmation needed.

---

## 6. Alternative and error flows (minimal)

| # | Condition | Expected behavior |
| - | --------- | ----------------- |
| A1 | Validation failure on create/edit | Redirect back with Inertia shared errors; no DB write |
| A2 | User opens `GET /expenses/{id}/edit` for another user's card | `403` — ownership check |
| A3 | Cancel attempted on already-Cancelled card | `PUT` is a no-op (status stays Cancelled); no error shown — slide-over closes normally |
| A4 | Logo API fails to resolve service icon | Fallback to colored initial circle — no broken image |
| A5 | `next_renewal_date` is null on a Recurring card (edge case from auto-detected) | Show "Renewal date unknown" in place of the date — no crash |
| A6 | One-time expense has `billing_cycle` field set | Server-side: ignore `billing_cycle` when `type = one-time`; force to `one-time` |

---

## 7. Data and contracts

### Entities / tables (SQLite)

**`expense_cards`:**

```
id                    uuid / bigint  PK
user_id               FK → users
name                  string
category              enum           'saas' | 'tool' | 'equipment' | 'marketing' | 'other'
type                  enum           'recurring' | 'one-time'
amount                decimal(10,2)
currency              string         'EGP' | 'USD'
billing_cycle         enum           'monthly' | 'annual' | 'one-time'
next_renewal_date     date           nullable
started_at            date           nullable
status                enum           'active' | 'cancelled' | 'paused'   default 'active'
cancel_url            string         nullable
cancel_instructions   text           nullable   -- populated by UC-008
notes                 text           nullable
alert_days_before     int            default 7
auto_detected         boolean        default false
source_email_id       string         nullable   -- reference to source email (UC-010)
created_at            datetime
updated_at            datetime
```

### Key reads / writes

- **Dashboard summary:** Two aggregation queries (monthly burn + annual commitment) filtered by `user_id` + `status = active` + `type = recurring`
- **Grid list:** `SELECT * WHERE user_id = ? ORDER BY next_renewal_date ASC` with filter params
- **Create:** `INSERT` with `status = active`, `auto_detected = false`
- **Edit:** `UPDATE WHERE id = ? AND user_id = ?`
- **Cancel / Re-activate:** `UPDATE expense_cards SET status = ? WHERE id = ? AND user_id = ?`

### External integrations

| Integration | Purpose | Notes |
| ----------- | ------- | ----- |
| Clearbit Logo API | Resolve service logo by domain name | Optional / best-effort; fallback to initial circle if unavailable |
| AI Cancel Assistant | Surface cancel instructions in cancel flow | Invoked from within the slide-over panel — see `UC-008` |
| Gemini API | N/A directly in this UC | Used in `UC-008` which is triggered from here |

---

## 8. Mock and assumption box (hackathon)

- **Sandbox assumptions:** No real payment cancellation is processed. Reference: [Salam Hack 2026 Sandbox Assumptions](https://raw.githubusercontent.com/tariqlabs/salamhack-resources/refs/heads/main/2026/assumptions.md).
- **Seeded data:** For demo, seed 5–7 expense cards (mix of Active Monthly, Active Annual, one Cancelled) with varied renewal dates — ensures the grid, summary cards, and renewal urgency states are all visible.
- **Logo API:** Use Clearbit `https://logo.clearbit.com/{domain}` for known SaaS logos. If not available at demo time, colored initials are sufficient.

---

## 9. Acceptance criteria (testable)

- [ ] Given the expense dashboard, when it loads, then "Total monthly burn" shows the correct sum of active recurring expenses normalized to monthly cost
- [ ] Given a mix of Active, Paused, and Cancelled cards, when the status filter is set to "Active", then only Active cards appear in the grid
- [ ] Given the create form with valid data, when submitted, then a new `expense_cards` row exists with `status = active` and `auto_detected = false`
- [ ] Given a Recurring expense with a missing `next_renewal_date`, when the form is submitted, then a validation error appears and no row is created
- [ ] Given an existing card, when the user edits it and submits valid data, then the row is updated and the dashboard shows the changes
- [ ] Given the cancel action menu, when clicked, then the slide-over panel opens showing either AI cancel instructions or the "Get cancel instructions" prompt
- [ ] Given the cancel panel, when the user clicks "Confirm cancellation", then `status = Cancelled` and the card visually dims in the grid
- [ ] Given a Cancelled card, when the user clicks "Re-activate", then `status = active` and the card returns to normal display
- [ ] Given a card with a renewal within 7 days, when the grid loads, then the renewal date is shown in amber
- [ ] Given another user's card ID, when the current user attempts to edit or cancel it, then `403` is returned
- [ ] Given Arabic locale, then grid, create/edit form, and cancel slide-over render RTL correctly (`NFR-07`)

---

## 10. Scope boundaries

### In scope

- Expense dashboard: 2 summary cards + filterable/sortable card grid
- Create expense card (separate page)
- Edit expense card (separate page, same form)
- Cancel flow with slide-over panel + AI instructions integration + confirmation
- Re-activate Cancelled/Paused cards
- Auto-detected badge for email-scanned cards

### Out of scope (this use case only)

- AI cancel instructions fetching (the trigger is here; the AI call is in `UC-008`)
- Renewal alert notifications (`UC-011`)
- Email scan → auto-create cards (`UC-010`)
- Attach receipts / invoice uploads (post-MVP)
- "Dead tool" detector — tracks last usage (post-MVP)
- SaaS cost vs income ratio widget (`FR-16`, P2)

---

## 11. Demo script snippet

1. Open the expense dashboard — show summary cards (monthly burn + annual commitment) with seeded data.
2. Apply the "Active" filter — show only active cards.
3. Point out a card with a renewal within 7 days — show the amber date.
4. Click **"Add expense manually"** — create "Figma Pro · $15 · Monthly · Renews next week".
5. Return to dashboard — show the new card in the grid and the updated monthly burn.
6. Click ⋯ → **"Cancel"** on a seeded card — slide-over opens, AI instructions are already populated (seeded). Read them, click **"Confirm cancellation"** — card dims to Cancelled.

---

## 12. Decisions (resolved)

| Topic | Decision |
|-------|----------|
| Card display | Responsive grid — visually richer than a table; SaaS tool names + logos benefit from card format |
| Create/edit UX | Separate page — form has too many fields (10+) to fit comfortably in a modal |
| Cancel UX | Slide-over mini-flow — keeps the user on the dashboard while surfacing AI instructions; two-step to prevent accidental cancellation |
| Cancel confirmation gate | Always shown regardless of whether AI instructions exist — prevents accidental status change |
| Summary card scope | Only `Active` + `Recurring` cards count toward burn and annual commitment; one-time and cancelled are excluded |
| Annual normalization | Monthly burn = `monthly_cards.sum + (annual_cards.sum / 12)`; annual commitment = `(monthly_cards.sum * 12) + annual_cards.sum` |
