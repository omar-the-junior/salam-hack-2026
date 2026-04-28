# UC-003 — Payment status tracking (client pay page, webhook, overdue)

---

## 1. Header

| Field | Value |
| ----- | ----- |
| Use case ID | `UC-003` |
| Title | Payment status tracking (client pay page, webhook, overdue) |
| Status | Draft |
| Priority | P0 |
| Owner | TBD |
| Last updated | 2026-04-27 |

---

## 2. Summary

A client opens the shareable payment URL created in `UC-002`, sees a **branded payment page** showing the freelancer's name, amount, and project details, then completes a **mock checkout**. The system processes a mock webhook, updates the payment link status to **Paid**, and shows the client a **receipt page** with a PDF export option. On the freelancer side, the status badge on the payment links list updates, a toast appears on next dashboard load, and an email notification is sent. Payment links whose due date has passed are automatically flipped to **Overdue** by a daily scheduled job.

---

## 3. Actors and context

### Primary actor

**Client (payer)** — unauthenticated, opens the pay URL shared by the freelancer.

### Secondary actors

- **Freelancer / Small Business Owner** — authenticated; sees status update, toast, and email
- **System:** Laravel MVC + Inertia v3 + React; SQLite; mock payment gateway; Laravel scheduler; email via Resend

### Preconditions

- [ ] A `payment_links` row with `status = Pending` exists and has a valid `public_token` (`UC-002`)
- [ ] The payment link's `due_date` is today or in the future (link not yet overdue)
- [ ] Mock gateway webhook route is reachable (JSON endpoint, no auth middleware)

### Postconditions (success — payment)

- [ ] `payment_links` row has `status = Paid`, `paid_at` timestamp, and `mock_gateway_reference` confirmed
- [ ] Client sees a receipt page at a stable URL with exportable PDF
- [ ] Owner's payment links list reflects `Paid` status badge
- [ ] Owner receives a toast flash message on next dashboard/payment-list load
- [ ] Owner receives an email notification (via Resend) with payment summary

### Postconditions (success — overdue)

- [ ] Any `payment_links` row with `status = Pending` and `due_date < today` has `status = Overdue` after the scheduler runs

### Postconditions (failure — if applicable)

- [ ] Duplicate webhook event does not double-update or create duplicate income entries (idempotent)
- [ ] If email sending fails, status update still completes (email is fire-and-forget)

---

## 4. Traceability

| Type | IDs / references |
| ---- | ---------------- |
| Functional requirements | `FR-03` |
| Non-functional requirements | `NFR-01` (golden-path demo), `NFR-03` (public route — no auth leakage), `NFR-04` (idempotent webhook, immutable timestamps), `NFR-06` (graceful failure on email), `NFR-07` (RTL on client pay page) |
| PRD | `docs/prd.md` — §3.3.1 Payment Link Generator (status lifecycle, auto-reminder); §2.3 User Journey |
| Architecture | `docs/technical-specs.md` — §3.3–3.5; mock gateway |
| Depends on | `UC-002` — payment link must exist with `Pending` status |
| Feeds into | `UC-006` — paid payment links auto-create income entries (`FR-06`) |

---

## 5. User journey (happy path)

### 5.1 Client opens the pay page

1. Client navigates to the shareable URL (e.g. `/pay/{public_token}`).
2. Laravel resolves the `public_token` → loads the `payment_links` row (no auth required).
3. Controller returns `Inertia::render('Pay/Show', [...props])` with the following data:

   | Prop | Value |
   |------|-------|
   | `freelancer_display_name` | From owner's profile (e.g. "Ahmed Design Studio") |
   | `subtotal` | Pre-tax amount formatted with currency (e.g. "2,500 EGP") |
   | `tax_rate` | e.g. `14` (percent) |
   | `tax_amount` | e.g. "350 EGP" |
   | `total_amount` | Final amount client pays (e.g. "2,850 EGP") |
   | `show_tax` | Boolean — `false` when `tax_rate = 0`; hides tax lines when not applicable |
   | `description` | Project/service description |
   | `client_name` | Client name stored on the link |
   | `due_date` | Formatted date |
   | `status` | Current status (`Pending` / `Paid` / `Overdue`) |
   | `public_token` | Used to construct receipt URL after payment |

4. The **branded pay page** renders:
   - Header: freelancer display name + "Invoice / Payment Request" label
   - **Amount breakdown** (when `show_tax = true`):
     - Subtotal: `2,500 EGP`
     - Tax (14%): `350 EGP`
     - **Total: 2,850 EGP** (large, prominent)
   - **Amount** (when `show_tax = false`): just the total, large and prominent — no breakdown shown
   - Description and client name
   - Due date with a subtle urgency indicator if within 3 days
   - Payment section: for MVP a single **"Pay Now"** mock button (labelled with available methods: Card / Fawry / Vodafone Cash)
   - Footer: "Powered by مُسْتَحَقّ" branding

> **If `status = Paid`:** render the receipt page directly (section 5.3) — the payment is already done.
> **If `status = Overdue`:** render the pay page with an overdue banner; payment can still be attempted.

### 5.2 Client completes mock checkout

1. Client clicks **"Pay Now"**.
2. React form submits to `POST /pay/{public_token}/checkout` (public, no auth).
3. Controller validates the link exists and is not already `Paid`.
4. Controller generates a mock payment response:
   - `mock_transaction_id` — random UUID
   - `paid_at` — current timestamp
   - Simulates a webhook call internally (or fires a real self-request to the webhook endpoint)
5. Controller redirects the client to `GET /pay/{public_token}/receipt` (Inertia).

> **For hackathon:** the webhook can be simulated synchronously within the controller — no need for an actual async HTTP callback during demo. Document this as a mock simplification.

### 5.3 Client receipt page (`/pay/{public_token}/receipt`)

1. Controller returns `Inertia::render('Pay/Receipt', [...props])` with:

   | Prop | Value |
   |------|-------|
   | `freelancer_display_name` | e.g. "Ahmed Design Studio" |
   | `subtotal` | Pre-tax amount formatted |
   | `tax_rate` | e.g. `14` |
   | `tax_amount` | Formatted |
   | `total_amount` | Final amount paid — prominent on receipt |
   | `show_tax` | Boolean — hides tax lines when `tax_rate = 0` |
   | `description` | Project/service description |
   | `client_name` | |
   | `paid_at` | Formatted date + time |
   | `reference_number` | `mock_transaction_id` (truncated, human-readable) |
   | `receipt_url` | Stable public URL for this receipt (`/pay/{public_token}/receipt`) |

2. The receipt page renders:
   - **"Payment Confirmed ✓"** heading
   - Receipt card:
     - From: freelancer display name
     - Description, client name, date, reference number
     - Amount breakdown (when `show_tax = true`): Subtotal · Tax (rate%) · **Total paid**
     - Amount (when `show_tax = false`): just **Total paid** — no breakdown
   - **"Copy receipt link"** button — copies `receipt_url` to clipboard
   - **"Export as PDF"** button — triggers `GET /pay/{public_token}/receipt/pdf` (server-rendered PDF via DomPDF, returned as a download)
   - The receipt URL is permanent and bookmarkable (no auth required to view)

### 5.4 Webhook ingestion and status update

1. Mock webhook fires `POST /webhooks/payment` with `{ mock_gateway_reference, status: 'paid', mock_transaction_id, paid_at }`.
2. Laravel webhook route (JSON, outside Inertia, no session auth) receives the event.
3. Controller looks up `payment_links` by `mock_gateway_reference`.
4. **Idempotency check:** if `status` is already `Paid`, return `200` and stop — no duplicate processing.
5. DB update: `status = Paid`, `paid_at`, `mock_transaction_id`.
6. Dispatch a queued (or synchronous for MVP) job: `PaymentPaidJob` that:
   - Creates an income entry (feeds `UC-006`)
   - Sets a flash notification for the owner (`payment_paid_flash` in their session or a `notifications` table row)
   - Sends email to the owner via Resend

### 5.5 Freelancer sees the update

1. **Status badge:** Next time the owner loads `GET /payment-links` (Inertia), the controller fetches fresh data — the row shows `Paid` with a green badge. No websockets needed for MVP.
2. **Toast / flash:** Dashboard and payment-links controllers check for a pending notification for the authenticated user. If found, pass it as a shared Inertia prop (`flash.payment_paid`) and clear it. The React layout renders a toast: *"Payment received: [description] — [amount]"*.
3. **Email (Resend):** A plain, clean email is sent to the owner's address:
   - Subject: "💰 Payment received — [description]"
   - Body: amount, client name, date, link to payment-links detail page

---

## 6. Alternative and error flows (minimal)

| # | Condition | Expected behavior |
| - | --------- | ----------------- |
| A1 | Client opens `/pay/{invalid_token}` | `404` page — "This payment link does not exist" |
| A2 | Client opens a link with `status = Paid` | Receipt page is shown directly (not the pay form) |
| A3 | Client opens a link with `status = Overdue` | Pay page shown with overdue banner; payment can still proceed |
| A4 | Webhook fires twice for the same reference | Idempotency check returns `200` immediately; no double income entry |
| A5 | Resend email fails | Log the error; status update and flash notification still complete |
| A6 | Client tries `POST /pay/{token}/checkout` on an already-Paid link | Controller returns a redirect to the receipt page with no DB changes |
| A7 | Overdue scheduler runs on a Paid link | `WHERE status = 'pending'` filter excludes it — no change |

---

## 7. Data and contracts

### Entities / tables (SQLite)

**`payment_links`** — new columns added by this UC:

```
paid_at             datetime   nullable
mock_transaction_id string     nullable   -- reference shown on receipt
```

**`notifications`** (or use Laravel session flash — pick one):

```
id            uuid
user_id       FK → users
type          string   -- 'payment_paid'
payload       json     -- { amount, currency, description, payment_link_id }
read_at       datetime nullable
created_at    datetime
```

> **MVP shortcut:** If a `notifications` table adds complexity, use Laravel session flash stored during webhook processing and read on next controller load. Document the choice made.

### Key reads / writes

- **Pay page load:** `SELECT` by `public_token` — no auth, read-only
- **Checkout submit:** validate + trigger mock webhook (sync for hackathon)
- **Webhook handler:** `UPDATE payment_links SET status, paid_at, mock_transaction_id WHERE mock_gateway_reference = ?` — idempotent
- **Flash notification:** set on webhook, read + clear on next owner page load
- **Receipt PDF:** server-side DomPDF render of receipt data, streamed as download

### External integrations

| Integration | Purpose | Notes |
| ----------- | ------- | ----- |
| Mock payment gateway | Simulate checkout + webhook | No real HTTP; mock handled synchronously in controller for hackathon |
| Resend (email) | Notify freelancer of payment | Fire-and-forget; failure does not block status update |
| DomPDF (Laravel) | Generate receipt PDF for client | Triggered by `GET /pay/{token}/receipt/pdf` |
| Gemini API | N/A | Not used in this UC |

---

## 8. Mock and assumption box (hackathon)

- **Sandbox assumptions:** Instant settlement assumed per hackathon rules; no real card charge. Reference: [Salam Hack 2026 Sandbox Assumptions](https://raw.githubusercontent.com/tariqlabs/salamhack-resources/refs/heads/main/2026/assumptions.md).
- **Mock checkout:** The "Pay Now" button directly triggers the status update without an external gateway redirect. This simulates the webhook synchronously. The receipt page is shown immediately after.
- **Overdue scheduler:** Laravel `Schedule::command('payments:check-overdue')->daily()` — for demo, a manual artisan call (`php artisan payments:check-overdue`) is acceptable.
- **Email:** Resend is the preferred integration. If not configured, the system logs the email content and continues.

---

## 9. Acceptance criteria (testable)

- [ ] Given a valid `public_token`, when an unauthenticated client opens `/pay/{token}`, then they see the freelancer display name, formatted amount, description, and a Pay Now button
- [ ] Given a `Pending` payment link, when the client submits mock checkout, then `status = Paid`, `paid_at` is set, and the client is redirected to the receipt page
- [ ] Given the receipt page, when the client clicks "Export as PDF", then a PDF download begins with receipt details
- [ ] Given the receipt page, when the client clicks "Copy receipt link", then the stable receipt URL is in the clipboard
- [ ] Given a paid payment, when the owner opens the payment links list, then the status badge shows "Paid" in green
- [ ] Given a paid payment, when the owner loads the dashboard or payment links page, then a toast appears with payment details — and does not appear again on the next load
- [ ] Given a paid payment, then the owner's registered email receives a Resend notification (or the email payload is logged if Resend is not configured)
- [ ] Given a `Pending` link whose `due_date` is yesterday, when the overdue job runs, then `status = Overdue`
- [ ] Given a `Paid` link whose `due_date` has passed, when the overdue job runs, then status remains `Paid` (not overwritten)
- [ ] Given a duplicate webhook for the same `mock_gateway_reference`, then no second income entry is created and the response is `200`
- [ ] Given an invalid or unknown `public_token`, then a `404` response is returned — no data leakage

---

## 10. Scope boundaries

### In scope

- Public client pay page (branded, no auth)
- Mock checkout and synchronous webhook simulation
- Client receipt page with copy-link and PDF export
- Owner status badge update, toast flash, and email notification
- Daily overdue scheduler (Artisan command + Laravel scheduler)

### Out of scope (this use case only)

- Real Paymob / Fawaterk gateway integration (post-MVP)
- Real-time push updates to owner (WebSockets / Pusher — post-MVP)
- Auto-reminder emails to client before due date (FR mentions this; defer to Day 4 polish or `UC-011`)
- Income entry creation (feeds into `UC-006` — only triggered by the `PaymentPaidJob` here)
- Multi-method checkout UI beyond the mock "Pay Now" button

---

## 11. Demo script snippet

1. As the **freelancer**, show the Pending payment link from `UC-002`.
2. Open the shareable URL in a separate browser tab (client view) — show the branded pay page with freelancer name and amount.
3. Click **"Pay Now"** — redirect to the receipt page.
4. Show the receipt: amount, reference number, "Copy receipt link", "Export as PDF".
5. Switch back to the freelancer tab — refresh payment links list — show the **Paid** green badge and the toast notification.
6. Open the overdue demo: manually run `php artisan payments:check-overdue` against a seeded link with a past due date — show status flip to **Overdue**.

---

## 12. Decisions (resolved)

| Topic | Decision |
|-------|----------|
| Webhook simulation | Synchronous mock inside the checkout controller for hackathon — no real HTTP webhook roundtrip needed |
| Receipt URL | Permanent public URL at `/pay/{token}/receipt` — no auth, always accessible |
| Flash vs notifications table | Use **Laravel session flash** for MVP to avoid extra table; if income-entry jobs are async, promote to a `notifications` table |
| Overdue trigger | Laravel scheduler (`daily`) + Artisan command `payments:check-overdue`; manual artisan call acceptable for demo |
| PDF library | DomPDF (already in PRD stack) for both receipt (this UC) and contracts (UC-012) |
| Email provider | Resend (already in PRD stack); failure is non-blocking |
