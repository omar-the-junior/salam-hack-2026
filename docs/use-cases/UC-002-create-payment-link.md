# UC-002 — Create payment link (shareable URL)

---

## 1. Header

| Field | Value |
| ----- | ----- |
| Use case ID | `UC-002` |
| Title | Create payment link (shareable URL) |
| Status | Draft |
| Priority | P0 |
| Owner | TBD |
| Last updated | 2026-04-27 |

---

## 2. Summary

An authenticated freelancer or small business owner creates a **payment request** with amount, currency, description, client details, and due date. The system persists a **payment link** record in SQLite, assigns a **mock gateway reference**, and exposes a **unique, shareable URL** (for example `/pay/{public_token}`) the owner can copy and send to a client. This UC satisfies **FR-02**; **capturing payment and webhook-driven status changes** are **UC-003** (`FR-03`).

---

## 3. Actors and context

### Primary actor

Authenticated freelancer or small business owner (depends on `UC-001`).

### Secondary actors

- **Client (payer):** may open the public pay URL later; **completing checkout** is not required to close this UC.
- **System:** Laravel MVC + Inertia v3 + React; SQLite; **mock payment gateway** identifiers only (no real PSP in hackathon path).

### Preconditions

- [ ] User is authenticated (`UC-001`)
- [ ] Migrations define `payment_links` (or equivalent) with fields needed for this flow

### Postconditions (success)

- [ ] One `payment_links` row exists owned by the current user with validated input and initial status **`Pending`**
- [ ] A stable **public token** or slug exists so the shareable URL is unique and non-guessable enough for demo
- [ ] A **mock gateway reference ID** (and optional provider label) is stored for later webhook correlation in `UC-003`

### Postconditions (failure — if applicable)

- [ ] No payment link row on validation failure; user sees Inertia validation errors
- [ ] No leakage of other users’ links or tokens

---

## 4. Traceability

| Type | IDs / references |
| ---- | ---------------- |
| Functional requirements | `FR-02` |
| Non-functional requirements | `NFR-01` (golden-path demo), `NFR-03` (auth on create routes), `NFR-04` (immutable id + timestamps on create), `NFR-07` (Arabic-first form UX where applicable) |
| PRD | `docs/prd.md` — §3 Module 1, §3.3.1 Payment Link Generator (inputs and shareable link); **PSP names in PRD are superseded** by mock gateway in `technical-specs.md` |
| Architecture | `docs/technical-specs.md` — §3.3–3.5, mock payment gateway |
| Related | `UC-003` — payment completion + webhook + status (`FR-03`) |

---

## 5. User journey (happy path)

### Open create form

1. User visits authenticated route (for example `GET /payment-links/create`) → controller returns `Inertia::render('PaymentLinks/Create', [...])` with defaults: `preferred_currency` and `default_tax_rate` from the user's profile.

### Submit create

1. User fills: amount (subtotal), currency (**EGP** or **USD** only for MVP), description, client name, client email (if required by product rules), due date, and **tax rate** (pre-filled from `default_tax_rate`; editable).
2. A **live tax preview** beneath the amount field shows: `Subtotal: X · Tax (Y%): Z · Total: X+Z`. When tax rate is 0, only the total is shown with no breakdown.
3. User submits via Inertia to `POST /payment-links` (or equivalent named route).
4. Controller validates. Computes: `tax_amount = amount × tax_rate / 100`, `total_amount = amount + tax_amount`. Generates **public token** + **mock gateway reference**, inserts row with `status = Pending`, `user_id` = auth id.
5. Controller **redirects** to the payment link **show** page for the owner (for example `GET /payment-links/{id}`) with Inertia props: link fields (including subtotal, tax_rate, tax_amount, total_amount), **full shareable URL** string for copy-to-clipboard, and `Pending` status.

### Share

1. User copies the shareable URL from the UI and sends it to the client (out of band: WhatsApp, email, etc.).

---

## 6. Alternative and error flows (minimal)

| # | Condition | Expected behavior |
| - | --------- | ----------------- |
| A1 | Validation failure (bad amount, missing client, invalid currency, bad date) | Redirect back with Inertia shared validation errors; no DB row |
| A2 | Unauthenticated `POST /payment-links` | Middleware blocks (redirect login) |
| A3 | Owner opens another user’s `GET /payment-links/{id}` | `403` or “not found” per app policy (document one) |

---

## 7. Data and contracts

### Entities / tables (SQLite)

Suggested minimum (adjust names to match implementation):

- **`payment_links`**: `id`, `user_id`, `public_token` (unique), `amount` (subtotal), `tax_rate` (decimal, default 0), `tax_amount` (decimal, computed), `total_amount` (decimal, computed), `currency`, `description`, `client_name`, `client_email` (nullable if product allows), `due_date`, `status` (`Pending` at creation), `source` (string, nullable — `manual` / `milestone`), `milestone_id` (FK nullable), `mock_gateway_reference`, `mock_provider` (optional string, for example `mock-sandbox`), `created_at`, `updated_at`

### Key reads / writes

- **Create:** compute `tax_amount` and `total_amount` server-side from submitted `amount` and `tax_rate`; never trust computed values from client; insert one row; never trust `user_id` from client — always from `auth()->id()`
- **Show (owner):** load by `id` + `user_id` constraint
- **Public pay page (optional in this UC):** resolve by `public_token` only for **read-only** display of amount/description for demo; **do not** mark paid here (`UC-003`)

### External integrations

| Integration | Purpose | Notes |
| ----------- | ------- | ----- |
| Mock payment gateway | Record a reference for a future “checkout” and webhook | Generate reference server-side; no external HTTP required for link creation |
| Gemini API | N/A | |
| Other | N/A | |

---

## 8. Mock and assumption box (hackathon)

- **Sandbox assumptions:** Instant settlement and simplified rails per hackathon; mock gateway is acceptable. [Salam Hack 2026 Sandbox Assumptions](https://raw.githubusercontent.com/tariqlabs/salamhack-resources/refs/heads/main/2026/assumptions.md).
- **Mock behavior:** On create, assign a deterministic or random `mock_gateway_reference` string; no real card charge. **Paid / Overdue** transitions belong to `UC-003`.

---

## 9. Acceptance criteria (testable)

- [ ] Given authenticated user, when they submit valid payment link data, then a row exists with `Pending` status, correct `user_id`, and a unique `public_token`
- [ ] Given success, when owner lands on show page, then they see a **copy-ready** full shareable URL
- [ ] Given invalid input, when they submit, then no row is created and errors are visible
- [ ] Given unauthenticated user, when they hit create or store routes, then they cannot create a link
- [ ] Shareable URL format is stable and documented (example pattern: `https://{app_domain}/pay/{public_token}`)

---

## 10. Scope boundaries

### In scope

- Create + owner **show** page with copyable URL and `Pending` status
- EGP and USD only at link level (aligns with product MVP)

### Out of scope (defer to `UC-003` or later)

- Client completes mock checkout
- Webhook ingestion and `Paid` / `Overdue` lifecycle (`FR-03`)
- Payment reminders, real Paymob/Fawaterk, multi-method checkout UI beyond mock
- Income auto-logging on paid (`FR-06`) — follows successful payment in a later UC

---

## 11. Demo script snippet (optional)

1. Log in as demo user.
2. Create a payment link with EGP amount and a due date.
3. Show the **Pending** status and copy the **shareable URL** from the show page.

---

## 12. Decisions / open items

| Topic | Decision / note |
| ----- | ---------------- |
| Public URL path | Use `/pay/{public_token}` (or team convention) — document in routes table |
| Client email | Required vs optional — pick one and align validation |
| Pay page | Read-only preview by token can ship with `UC-002` or `UC-003`; if only owner show in `UC-002`, note in implementation |
