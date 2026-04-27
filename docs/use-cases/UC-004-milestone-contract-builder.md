# UC-004 — Milestone contract builder

---

## 1. Header

| Field | Value |
| ----- | ----- |
| Use case ID | `UC-004` |
| Title | Milestone contract builder |
| Status | Draft |
| Priority | P0 |
| Owner | TBD |
| Last updated | 2026-04-27 |

---

## 2. Summary

An authenticated freelancer or small business owner creates a milestone-based project contract through a **3-step wizard**: project and client details → milestone breakdown → terms and review. The system generates a **unique contract URL** the freelancer shares with the client. The client opens the URL, reads the full contract preview, checks "I Agree", and submits — recording a digital acceptance with timestamp and IP. The freelancer receives a toast notification and email on signing. Both sides then see the contract in a signed state. This UC covers creation and client acceptance; milestone-to-payment triggering is handled by `UC-005`.

---

## 3. Actors and context

### Primary actor

Authenticated freelancer or small business owner.

### Secondary actors

- **Client** — unauthenticated; opens the contract URL to review and accept
- **System:** Laravel MVC + Inertia v3 + React; SQLite; DomPDF; Resend

### Preconditions

- [ ] User is authenticated and has completed onboarding (`UC-001b`) — `display_name` and `preferred_currency` are set and used as defaults
- [ ] `contracts` and `milestones` tables are migrated

### Postconditions (success — creation)

- [ ] One `contracts` row exists owned by the current user with `status = Draft`
- [ ] Up to 5 `milestones` rows exist linked to the contract
- [ ] A stable, unique `contract_token` exists so the shareable URL is non-guessable
- [ ] Freelancer is redirected to the contract detail/share page showing the copyable URL

### Postconditions (success — client acceptance)

- [ ] `contracts.status` = `Active`, `signed_at` timestamp and `client_ip` recorded
- [ ] Client sees a "Contract signed" confirmation screen
- [ ] Freelancer receives a toast flash on next load and an email via Resend

### Postconditions (failure — if applicable)

- [ ] No partial contract or orphaned milestone rows on validation failure
- [ ] Duplicate acceptance attempt on an already-signed contract is rejected gracefully

---

## 4. Traceability

| Type | IDs / references |
| ---- | ---------------- |
| Functional requirements | `FR-04` |
| Non-functional requirements | `NFR-01` (golden-path demo), `NFR-03` (auth on create routes; public on client review route), `NFR-04` (immutable IDs + timestamps), `NFR-07` (Arabic-first, RTL) |
| PRD | `docs/prd.md` — §3.3.2 Milestone Contract Builder, §3.3.3 Contract Templates Library |
| Architecture | `docs/technical-specs.md` — §3.3–3.5 (Laravel MVC + Inertia v3 + React) |
| Depends on | `UC-001b` — `display_name` and `preferred_currency` used as form defaults |
| Feeds into | `UC-005` — milestone-to-payment trigger; `UC-012` — contract PDF export |

---

## 5. User journey (happy path)

### 5.1 Entry point — template shortcut (optional)

1. User navigates to `GET /contracts/create` → `Inertia::render('Contracts/Create', [...])`.
2. Page opens at **Step 1** of the wizard with an optional **"Use a template"** shortcut in the top-right corner.
3. If the user clicks "Use a template":
   - A modal or slide-over panel opens listing the available templates:
     `Web Development · Design (Logo / Branding) · Consulting / Advisory · Content Writing · Monthly Retainer`
   - User picks one → the wizard fields for Step 1 and Step 3 are pre-filled with template defaults; milestones are pre-populated with typical stage names for that type (e.g. for Web Development: "Discovery & Planning 20%", "Design & Prototype 30%", "Development 40%", "Final Delivery & Launch 10%")
   - The user can edit everything freely after selection
4. If the user ignores the shortcut, they fill the form from scratch.

---

### 5.2 Step 1 — Project and client details

**Fields:**

| Field | Label | Input | Notes |
|-------|-------|-------|-------|
| `project_name` | Project name | Text | Required |
| `description` | Project description | Textarea | Optional — shown on client review page |
| `client_name` | Client name | Text | Required |
| `client_email` | Client email | Email | Required — used to pre-fill later payment links per milestone |
| `total_value` | Total project value (subtotal, pre-tax) | Number | Required — sum of milestones must equal this |
| `tax_rate` | Tax rate % | Number (0–100) | Defaults to user's `default_tax_rate`; editable. A live preview shows: `Tax: X EGP · Total: Y EGP`. Set to 0 for tax-free. |
| `currency` | Currency | Toggle (EGP / USD) | Defaults to user's `preferred_currency` |
| `start_date` | Project start date | Date picker | Optional |
| `end_date` | Expected end date | Date picker | Optional |

**Behaviour:**
- "Continue →" submits to `POST /contracts/wizard/step-1` or stores in session.
- Controller validates, stores step-1 data in the Laravel session, redirects to `GET /contracts/create/step/2`.
- No DB write yet.

---

### 5.3 Step 2 — Milestones

**Initial state:** One milestone row is pre-rendered labelled **"Initial Payment"** with a suggested 30% default. The freelancer edits or replaces it.

**Each milestone row has:**

| Field | Label | Input | Notes |
|-------|-------|-------|-------|
| `title` | Milestone name | Text | e.g. "Design mockups" |
| `percentage` | % of total | Number (0–100) | Auto-calculates `amount` = `total_value × %` |
| `amount` | Amount | Read-only display | Derived from percentage; shown for clarity |
| `due_date` | Due date | Date picker | Optional per milestone |

**Controls:**
- **"+ Add milestone"** button appends a new empty row (up to 5 rows max; button is hidden at 5).
- **"✕"** on each row removes it (minimum 1 row must remain).
- A **running total bar** below the rows shows percentage used vs remaining (e.g. "70% assigned · 30% remaining") — turns red if total exceeds 100%.

**Behaviour:**
- "Continue →" validates that milestone percentages sum to exactly 100% and all titles are filled.
- Stores step-2 data in session, redirects to `GET /contracts/create/step/3`.
- No DB write yet.

---

### 5.4 Step 3 — Terms and review

**Left panel — Terms & Conditions:**
- A `<textarea>` pre-filled with a standard template for the contract type (if a template was chosen) or the app's default generic terms.
- Fully editable — the freelancer can paste their own terms.
- Label: *"These terms will be shown to your client before they sign."*

**Right panel — Contract summary (read-only preview):**
- Project name, client name, currency
- Milestone table (name · % · pre-tax amount · due date)
- **Financial summary:**
  - Subtotal: `total_value`
  - Tax (`tax_rate`%): `total_value × tax_rate / 100` (hidden row when `tax_rate = 0`)
  - **Grand total:** `total_value + tax_amount`
- A note: *"Your client will see the full contract including this breakdown on the review page."*

**Controls:**
- **"Create contract"** button → Inertia `POST /contracts` with the full payload (step-1 + step-2 + step-3 data merged from session + form).

**On submission:**
1. Controller validates the full payload.
2. In a single DB transaction:
   - Inserts `contracts` row with `status = Draft`, `contract_token` (unique random slug), `user_id`
   - Inserts all `milestones` rows linked to the contract
3. Clears wizard session data.
4. Redirects to `GET /contracts/{id}` (owner detail/share page) via Inertia.

---

### 5.5 Contract detail / share page (owner view)

1. Controller returns `Inertia::render('Contracts/Show', [...props])` with contract + milestones data.
2. Page shows:
   - Contract status badge: **Draft** (yellow) / **Active** (green) / **Completed** (grey)
   - Project name, client name, total value
   - Milestone list with status per milestone (all `Pending` on creation)
   - **"Share with client"** section: copyable URL → `/contracts/{contract_token}/review`
   - "Export PDF" button (deferred to `UC-012`)

---

### 5.6 Client contract review page (`/contracts/{contract_token}/review`)

1. Public route, no auth required.
2. Controller returns `Inertia::render('Contracts/Review', [...props])`.
3. Page renders the **full contract** top-to-bottom:

   - **Header:** "Contract between [freelancer display_name] and [client_name]"
   - Project name + description
   - Total value + currency
   - **Milestones table:** name · percentage · pre-tax amount · due date
   - **Financial summary** (when `tax_rate > 0`): Subtotal · Tax (rate%) · **Grand total**
   - **Terms and conditions** section (full text, styled and readable)
   - **Divider:** "Digital acceptance"
   - Checkbox: *"I, [client_name], have read and agree to the terms above."*
   - **"Sign & Accept"** button (disabled until checkbox is ticked)

4. If `status = Active` (already signed): render a **read-only signed view** showing the signed-at date and a "Contract already signed" banner — the form is hidden.

---

### 5.7 Client submits acceptance

1. Client ticks the checkbox and clicks **"Sign & Accept"** → Inertia `POST /contracts/{contract_token}/accept`.
2. Controller:
   - Validates contract exists and `status = Draft`
   - Records: `signed_at = now()`, `client_ip = request()->ip()`, `status = Active`
3. Controller redirects client to `GET /contracts/{contract_token}/review` (same page, now in read-only signed state) with a flash: *"Contract signed successfully. Keep this page bookmarked."*

**Freelancer notification:**
- A session flash is set for the owner: `contract_signed_flash` with contract name + client name
- Resend email sent to owner: *"✍️ [client_name] signed your contract — [project_name]"*
- On the owner's next load of `/contracts` or `/dashboard`, the toast appears and clears

---

## 6. Alternative and error flows (minimal)

| # | Condition | Expected behavior |
| - | --------- | ----------------- |
| A1 | Milestone percentages don't sum to 100% on step 2 | Inline validation error: "Milestones must add up to 100%"; no session save |
| A2 | User navigates directly to step 2 or 3 without completing earlier steps | Session check — missing step data → redirect to step 1 |
| A3 | Validation fails on step 3 final submit | Redirect back with Inertia shared errors; no DB write; session data preserved |
| A4 | Client opens `/contracts/{invalid_token}/review` | `404` — "This contract does not exist" |
| A5 | Client tries to accept an already-signed contract (`status = Active`) | Controller detects existing signature → redirect to signed read-only view, no changes |
| A6 | Owner opens another user's contract detail page | `403` or `404` — never expose other users' contracts |
| A7 | User tries to add a 6th milestone | "+ Add milestone" button is hidden at 5 rows; server-side validation also caps at 5 |

---

## 7. Data and contracts

### Entities / tables (SQLite)

**`contracts`:**

```
id                  uuid / bigint  PK
user_id             FK → users
contract_token      string         unique, non-guessable slug
project_name        string
description         text           nullable
client_name         string
client_email        string
total_value         decimal(10,2)   -- subtotal, pre-tax
tax_rate            decimal(5,2)    default 0   -- e.g. 14.00 for 14%
tax_amount          decimal(10,2)   -- stored: total_value × tax_rate / 100
grand_total         decimal(10,2)   -- stored: total_value + tax_amount
currency            string          -- 'EGP' | 'USD'
start_date          date            nullable
end_date            date            nullable
terms               text
status              enum           'draft' | 'active' | 'completed'
signed_at           datetime       nullable
client_ip           string         nullable
created_at          datetime
updated_at          datetime
```

**`milestones`:**

```
id                  uuid / bigint  PK
contract_id         FK → contracts
title               string
percentage          decimal(5,2)
amount              decimal(10,2)   stored (= total_value × percentage / 100)
due_date            date            nullable
status              enum            'pending' | 'in_progress' | 'submitted' | 'paid'
payment_link_id     FK → payment_links   nullable  (set by UC-005)
created_at          datetime
updated_at          datetime
```

### Key reads / writes

- **Wizard steps 1 & 2:** No DB write — Laravel session only
- **Step 3 submit:** Single transaction — 1 `INSERT` into `contracts` + N `INSERT`s into `milestones`
- **Client acceptance:** Single `UPDATE contracts SET status, signed_at, client_ip WHERE contract_token = ?`
- **Owner detail page:** `SELECT contracts + milestones WHERE id = ? AND user_id = auth()->id()`
- **Client review page:** `SELECT contracts + milestones WHERE contract_token = ?` (no user_id check — public)

### External integrations

| Integration | Purpose | Notes |
| ----------- | ------- | ----- |
| Resend | Notify freelancer when client signs | Fire-and-forget; failure is non-blocking |
| DomPDF | Contract PDF export | Used in `UC-012`; contract data model is ready here |
| Mock payment gateway | N/A in this UC | Payment links are created per milestone in `UC-005` |
| Gemini API | N/A | Not used in this UC |

---

## 8. Mock and assumption box (hackathon)

- **Sandbox assumptions:** E-sign = checkbox acceptance only (not a certified digital signature). Timestamp + IP is sufficient per hackathon rules. Reference: [Salam Hack 2026 Sandbox Assumptions](https://raw.githubusercontent.com/tariqlabs/salamhack-resources/refs/heads/main/2026/assumptions.md).
- **Wizard session:** Standard Laravel session; no Redis needed. Wizard data is keyed under `contract_wizard` in session and cleared on final submit or explicit abandonment.
- **Templates:** Pre-built as static PHP arrays / JSON config; no DB table needed for MVP. The template list is hardcoded.
- **Demo data:** Seeded contract with 2–3 milestones in `Active` status for Day 4 polish.

---

## 9. Acceptance criteria (testable)

- [ ] Given an authenticated user, when they complete all 3 wizard steps with valid data, then one `contracts` row and the correct number of `milestones` rows exist in SQLite with `status = Draft`
- [ ] Given a complete wizard, when the user lands on the contract detail page, then a copyable shareable URL is visible
- [ ] Given a contract URL, when an unauthenticated client opens it, then the full contract (project, milestones, terms) is visible and an "I Agree" checkbox + "Sign & Accept" button is present
- [ ] Given the client ticks "I Agree" and submits, then `status = Active`, `signed_at` and `client_ip` are persisted
- [ ] Given a newly signed contract, when the client reloads the review page, then only the signed read-only view is shown — no acceptance form
- [ ] Given a signed contract, when the owner loads `/contracts` or the dashboard, then a toast appears with the client's name and project name — and disappears on subsequent loads
- [ ] Given a signed contract, then the owner's email receives a Resend notification
- [ ] Given milestone percentages that don't sum to 100%, when the user tries to proceed from step 2, then an inline error appears and no session save occurs
- [ ] Given a "Use a template" selection (e.g. Web Development), then the form fields and milestones are pre-filled with template defaults and remain fully editable
- [ ] Given Arabic locale, then the wizard, review page, and confirmation screen render correctly in RTL (`NFR-07`)
- [ ] Given an already-signed contract, when the client posts to `/contracts/{token}/accept` again, then no changes occur and the signed view is returned

---

## 10. Scope boundaries

### In scope

- 3-step contract creation wizard (project + client / milestones / terms)
- Optional "Use a template" shortcut (pre-fills form; templates are static config)
- Dynamic milestone rows with percentage-to-amount auto-calculation and running total bar
- Contract detail / share page for the owner
- Public client contract review page with full content and digital acceptance
- Owner toast + email on signing
- Client "Contract signed" confirmation screen

### Out of scope (this use case only)

- Milestone status updates and payment link generation per milestone (`UC-005`)
- Contract PDF export (`UC-012`)
- Certified legal e-signature (post-MVP)
- Editing a contract after it has been signed (post-MVP)
- Multi-currency contracts (single currency per contract, MVP constraint)

---

## 11. Demo script snippet

1. Log in as the demo freelancer. Navigate to **Contracts → New Contract**.
2. Click **"Use a template"** — select **Web Development** — show pre-filled fields and 4 milestones.
3. Adjust one milestone name and click **Continue**.
4. Step 2: show the running total bar at 100%, then click **Continue**.
5. Step 3: show the pre-filled terms textarea. Click **Create contract**.
6. Show the contract detail page with the copyable shareable URL.
7. Open the URL in a new tab (client view) — scroll through the full contract — tick "I Agree" — click **"Sign & Accept"**.
8. Client sees "Contract signed" confirmation screen.
9. Switch back to freelancer tab — show the toast notification and the `Active` status badge on the contract.

---

## 12. Decisions (resolved)

| Topic | Decision |
|-------|----------|
| Wizard vs single page | **3-step wizard** — reduces perceived complexity for a form with up to 5 milestones + editable terms |
| Milestone default | Start with one row labelled "Initial Payment" at 30% — editable; "+ Add milestone" appends more |
| Percentage vs fixed amount | User inputs **percentage**; `amount` is derived and displayed read-only. Stored both in DB for downstream payment link creation |
| Tax on contracts | Tax rate set at contract level; defaults to `default_tax_rate` from profile; milestone `amount` values are pre-tax subtotals; each milestone payment link adds tax on top when generated in `UC-005` |
| Tax = 0 behaviour | When `tax_rate = 0`, all tax lines are hidden on client review page, contract summary, and generated receipts — no confusing "Tax: 0 EGP" line |
| Template storage | Static PHP config / JSON file — no DB table for MVP |
| Wizard state storage | Laravel session under `contract_wizard` key; cleared on final submit |
| DB write timing | Single atomic transaction on step 3 final submit only |
| E-sign mechanism | Checkbox + "Sign & Accept" button; timestamp + IP recorded — per hackathon sandbox rules |
| Client review route | Public, no auth — same pattern as pay page (`UC-003`) |
