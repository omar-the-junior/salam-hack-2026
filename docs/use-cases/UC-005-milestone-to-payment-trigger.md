# UC-005 — Milestone-to-payment trigger

---

## 1. Header

| Field | Value |
| ----- | ----- |
| Use case ID | `UC-005` |
| Title | Milestone-to-payment trigger |
| Status | Draft |
| Priority | P0 |
| Owner | TBD |
| Last updated | 2026-04-27 |

---

## 2. Summary

From the contract detail page, the freelancer advances each milestone through its lifecycle (**Pending → In Progress → Submitted → Paid**) using inline action buttons. When a milestone reaches **Submitted**, the freelancer can click **"Request Payment"** — the system silently auto-generates a payment link for that milestone's amount and immediately shows it on the contract page, ready to copy. An email is automatically sent to the client with the payment link. The generated payment link follows the same lifecycle as any other payment link (`UC-002`, `UC-003`): once the client pays, the milestone status advances to **Paid**.

---

## 3. Actors and context

### Primary actor

Authenticated freelancer or small business owner.

### Secondary actors

- **Client** — receives an email with the milestone payment link; opens and pays via `UC-003`
- **System:** Laravel MVC + Inertia v3 + React; SQLite; Resend

### Preconditions

- [ ] A contract with `status = Active` exists (`UC-004`)
- [ ] The target milestone has `status = Submitted` before "Request Payment" can be triggered
- [ ] The contract's `client_email` is set (required for the auto-email)

### Postconditions (success — full happy path)

- [ ] Milestone `status` transitions through the lifecycle correctly at each action
- [ ] On "Request Payment": a `payment_links` row is created with `amount` and `currency` from the milestone, linked back to the milestone via `payment_link_id`
- [ ] The generated payment link's shareable URL is visible on the contract page instantly
- [ ] An email with the payment link is sent to `contract.client_email` via Resend
- [ ] When the payment link is paid (via `UC-003` webhook), the milestone `status` automatically advances to `Paid`

### Postconditions (failure — if applicable)

- [ ] If the email send fails, the payment link is still created and shown — email failure is non-blocking
- [ ] "Request Payment" cannot be triggered on a milestone that is not in `Submitted` status
- [ ] A milestone cannot have more than one active (non-Paid) payment link at a time

---

## 4. Traceability

| Type | IDs / references |
| ---- | ---------------- |
| Functional requirements | `FR-05` |
| Non-functional requirements | `NFR-01` (golden-path demo), `NFR-03` (auth on all state-change routes), `NFR-04` (immutable IDs, source traceability on income entries) |
| PRD | `docs/prd.md` — §3.3.2 Milestone Contract Builder (flow steps 4+, status per milestone) |
| Architecture | `docs/technical-specs.md` — §3.3–3.5 |
| Depends on | `UC-004` — contract and milestones must exist in `Active` state |
| Feeds into | `UC-003` — generated payment link follows the same status lifecycle; `UC-006` — payment triggers income entry |

---

## 5. User journey (happy path)

### 5.1 Contract detail page — milestone list

The contract detail page (`GET /contracts/{id}`) renders each milestone as a row in a table or card list. Each row shows:

| Column | Value |
|--------|-------|
| Title | e.g. "Design mockups" |
| Amount | e.g. "750 EGP (30%)" |
| Due date | If set |
| Status badge | Current lifecycle stage |
| Action button | Context-sensitive (see below) |

---

### 5.2 Milestone lifecycle — action buttons

Each milestone shows exactly **one primary action button** based on its current status:

| Current status | Button label | Next status | Notes |
|----------------|-------------|-------------|-------|
| `Pending` | **"Start work"** | `In Progress` | Signals the freelancer has begun this phase |
| `In Progress` | **"Mark as submitted"** | `Submitted` | Signals the deliverable is ready for client review |
| `Submitted` | **"Request payment →"** | Stays `Submitted` until paid | Triggers payment link creation (5.3 below) |
| `Submitted` + payment link exists | **"Copy payment link"** | — | Payment link already generated; just copies the URL |
| `Paid` | *(no button — status badge only)* | — | Terminal state |

**Interaction:**
1. Freelancer clicks a status-advance button (e.g. "Mark as submitted") on a milestone row.
2. Inertia sends `PUT /milestones/{milestone_id}/status` with `{ status: 'submitted' }`.
3. Controller validates: authenticated user owns the contract; transition is valid (no skipping stages).
4. `milestones` row is updated. Controller returns an Inertia redirect back to `GET /contracts/{id}` — the page reloads with the updated milestone state.

---

### 5.3 "Request Payment" — silent payment link generation

1. Freelancer clicks **"Request payment →"** on a `Submitted` milestone.
2. Inertia sends `POST /milestones/{milestone_id}/request-payment`.
3. Controller validates:
   - User owns the contract
   - Milestone `status = Submitted`
   - No existing `payment_link_id` on this milestone (prevent duplicates)
4. Controller creates a `payment_links` row with:
   - `user_id` = owner
   - `amount` = `milestone.amount` (pre-tax subtotal)
   - `tax_rate` = `contract.tax_rate`
   - `tax_amount` = `milestone.amount × contract.tax_rate / 100`
   - `total_amount` = `milestone.amount + tax_amount` (what the client actually pays)
   - `currency` = `contract.currency`
   - `description` = `"[contract.project_name] — [milestone.title]"`
   - `client_name` = `contract.client_name`
   - `client_email` = `contract.client_email`
   - `due_date` = `milestone.due_date` (if set, else null)
   - `status` = `Pending`
   - `public_token` = generated unique slug
   - `mock_gateway_reference` = generated mock reference
   - `source` = `milestone` (for income entry traceability in `UC-006`)
5. Controller updates `milestones.payment_link_id` = new link's ID.
6. Controller fires a Resend email to `contract.client_email` (5.4 below).
7. Controller redirects back to `GET /contracts/{id}` via Inertia.

**On page reload**, the milestone row now shows:
- Status badge: **Submitted** (unchanged until paid)
- A **payment link section** beneath the milestone row with:
  - The full shareable URL (e.g. `/pay/{public_token}`)
  - **"Copy link"** button
  - Payment status badge: **Pending**

---

### 5.4 Auto-email to client

Immediately after payment link creation, Resend sends an email to `contract.client_email`:

- **Subject:** `"Payment request: [milestone.title] — [contract.project_name]"`
- **Body:**
  - Greeting: "Hi [client_name],"
  - Context: "[freelancer display_name] has completed the [milestone.title] milestone and sent a payment request."
  - Amount: bold, prominent
  - CTA button: **"Pay now"** → links to `/pay/{public_token}`
  - Footer: "This payment is for [contract.project_name]. View the contract: `/contracts/{contract_token}/review`"

If Resend fails: log the error, continue — the link is still visible on the contract page for manual sharing.

---

### 5.5 Milestone auto-advances to Paid after payment

When the payment link is paid (mock webhook fires in `UC-003`), the `PaymentPaidJob` checks if the paid `payment_links` row has a linked milestone (`source = 'milestone'`). If so:

1. Find the `milestones` row via `payment_link_id`.
2. Update `milestones.status = Paid`.
3. Check if **all milestones** on the contract are now `Paid` → if yes, set `contracts.status = Completed`.

This happens inside the same `PaymentPaidJob` that creates the income entry in `UC-006`.

---

## 6. Alternative and error flows (minimal)

| # | Condition | Expected behavior |
| - | --------- | ----------------- |
| A1 | "Request Payment" clicked on a milestone that is not `Submitted` | `422` validation error; button is not rendered for non-Submitted milestones anyway |
| A2 | "Request Payment" clicked when `payment_link_id` already set | Controller detects duplicate attempt → redirect back with flash: "Payment link already generated" |
| A3 | Status transition attempted out of order (e.g. Pending → Submitted directly) | Controller validates allowed transitions; invalid transition returns `422` |
| A4 | Email to client fails | Log error; payment link is still created and visible on contract page |
| A5 | Freelancer tries to advance a milestone on someone else's contract | `403` — controller checks `contract.user_id = auth()->id()` |
| A6 | All milestones paid — contract status update | `contracts.status` set to `Completed` automatically in `PaymentPaidJob` |

---

## 7. Data and contracts

### Entities / tables (SQLite)

No new tables. Changes to existing tables:

**`milestones`** — already defined in `UC-004`; the `status` and `payment_link_id` columns are used here:

```
status              enum   'pending' | 'in_progress' | 'submitted' | 'paid'
payment_link_id     FK → payment_links   nullable
```

**`payment_links`** — add a `source` column to support traceability:

```
source              string   nullable   -- 'manual' | 'milestone'
milestone_id        FK → milestones     nullable
```

### Key reads / writes

- **Status advance:** `UPDATE milestones SET status = ? WHERE id = ? AND contract.user_id = auth_id`; validate transition
- **Request payment:** `INSERT INTO payment_links` + `UPDATE milestones SET payment_link_id = ?` — both in one transaction
- **Auto-complete check:** `SELECT COUNT(*) FROM milestones WHERE contract_id = ? AND status != 'paid'` — if 0, update `contracts.status = Completed`
- **Contract detail page:** `SELECT contracts + milestones + payment_links (via payment_link_id)` in a single query to render all state in one Inertia prop

### External integrations

| Integration | Purpose | Notes |
| ----------- | ------- | ----- |
| Resend | Email client with payment link on "Request Payment" | Fire-and-forget; failure non-blocking |
| Mock payment gateway | Milestone payment link follows `UC-003` flow | No extra integration here — reuses the existing payment link lifecycle |
| Gemini API | N/A | Not used in this UC |

---

## 8. Mock and assumption box (hackathon)

- **Sandbox assumptions:** Instant settlement assumed. Reference: [Salam Hack 2026 Sandbox Assumptions](https://raw.githubusercontent.com/tariqlabs/salamhack-resources/refs/heads/main/2026/assumptions.md).
- **PaymentPaidJob:** For MVP this job can run synchronously (no queue worker needed). It handles: income entry creation (`UC-006`), milestone status → Paid, contract completion check, owner flash notification, owner email.
- **Demo path:** Seed a contract with one milestone in `Submitted` state so the demo can jump straight to "Request Payment" without walking through all lifecycle stages.

---

## 9. Acceptance criteria (testable)

- [ ] Given a `Pending` milestone, when the freelancer clicks "Start work", then `status = In Progress` and the button changes to "Mark as submitted"
- [ ] Given an `In Progress` milestone, when the freelancer clicks "Mark as submitted", then `status = Submitted` and the button changes to "Request payment →"
- [ ] Given a `Submitted` milestone with no payment link, when the freelancer clicks "Request payment →", then a `payment_links` row is created with the correct amount, currency, client name, and `status = Pending`
- [ ] Given a generated payment link, then it is immediately visible on the contract page with a "Copy link" button and a Pending badge
- [ ] Given a generated payment link, then an email is sent to `contract.client_email` containing the pay URL and milestone details
- [ ] Given "Request payment →" is clicked a second time on the same milestone, then no duplicate payment link is created and a flash error is shown
- [ ] Given the milestone payment link is paid (via `UC-003` webhook), then `milestone.status = Paid` automatically
- [ ] Given all milestones on a contract are `Paid`, then `contracts.status = Completed`
- [ ] Given a transition attempt that skips a stage (e.g. Pending → Submitted), then a `422` error is returned
- [ ] Given a user attempting to advance a milestone on another user's contract, then a `403` is returned

---

## 10. Scope boundaries

### In scope

- Milestone lifecycle buttons on the contract detail page (Pending → In Progress → Submitted)
- "Request Payment" auto-generates a payment link silently on the same page
- Auto-email to client with the payment link
- Milestone auto-advances to `Paid` when the payment link is paid (via `PaymentPaidJob`)
- Contract auto-completes when all milestones are `Paid`

### Out of scope (this use case only)

- Payment link checkout and receipt (handled by `UC-003`)
- Income entry creation on payment (handled by `UC-006` via `PaymentPaidJob`)
- Contract PDF export (`UC-012`)
- Editing or cancelling a milestone after a payment link has been generated (post-MVP)

---

## 11. Demo script snippet

1. Open the seeded contract with one milestone in **Submitted** state.
2. Click **"Request payment →"** — show the payment link appearing instantly on the page below the milestone row.
3. Show the "Copy link" button and the Pending badge.
4. Open the client email (or show the Resend log) — confirm the auto-email was sent.
5. Open the pay link in a new tab — complete mock checkout (`UC-003` flow).
6. Return to the contract page — show milestone badge updated to **Paid** and contract status updated to **Completed**.

---

## 12. Decisions (resolved)

| Topic | Decision |
|-------|----------|
| Lifecycle advancement | Action buttons on contract page — one primary button per milestone based on current status |
| Payment link generation UX | Silent auto-generate on "Request Payment" — link appears inline on the contract page, no separate screen |
| Client notification | Auto-email via Resend + link visible on contract page for manual copy/share |
| Duplicate prevention | Check `payment_link_id IS NOT NULL` before creating; return flash error if already exists |
| Contract completion | Auto-set `contracts.status = Completed` when all milestones reach `Paid` — inside `PaymentPaidJob` |
| `PaymentPaidJob` | Synchronous for MVP (no queue worker); handles: income entry + milestone Paid + contract completion + owner notifications |
| Tax on milestone payment links | Generated payment link inherits `contract.tax_rate`; `tax_amount` and `total_amount` computed server-side; client pays `total_amount`; pay page and receipt show tax breakdown when `tax_rate > 0` |
