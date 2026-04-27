# Financial OS — Technical Specifications (Hackathon MVP)

**Source:** Derived from `docs/prd.md`  
**Scope:** 4-day Salam Hack build (Track 2)  
**Version:** 1.0

---

## 1) Purpose and Scope

This document translates the PRD into implementation-ready technical requirements for a 4-day hackathon MVP.

It defines:

- Functional requirements (what the system must do)
- Non-functional requirements (quality and operational constraints)
- Requirement priorities for delivery sequencing

Priority scale:

- **P0 (Must Have):** Required for demo success
- **P1 (Should Have):** High value, build if P0 is stable
- **P2 (Nice to Have):** Optional polish or stretch scope

---

## 2) Hackathon Constraints and Assumptions

These assumptions are treated as fixed constraints for this build:

- Product operates under a **regulatory sandbox safe harbor** for moving funds and holding balances
- All users are considered **already KYC/AML verified**
- **Zero-liability / pre-authorized transaction** environment is assumed
- Sharia and ethical-finance architecture is **pre-approved**
- For Track 2, assume **open banking read/write APIs** are available when needed
- Tax calculations may rely on a **trusted tax engine behavior** for prototype logic
- Focus on the **golden path**; avoid edge-heavy operational workflows

Reference: [Salam Hack 2026 Sandbox Assumptions](https://raw.githubusercontent.com/tariqlabs/salamhack-resources/refs/heads/main/2026/assumptions.md)

---

## 3) System Context

### 3.1 Primary User

- Freelancer or small business owner in MENA (Arabic-first UX)

### 3.2 Core MVP Modules

- Payment Links and Milestone Contracts
- Income Manager
- Expense and Subscription Manager
- AI Email Subscription Scanner

### 3.3 Suggested Stack (from PRD)

- **Application:** Laravel (PHP) **MVC** — server-side routes and controllers (not a separate JSON API as the primary app surface)
- **UI bridge:** **Inertia.js v3** with **React + TypeScript** page components instead of Blade for the main product UI
- Database: SQLite
- AI: Gemini API
- Payments: Mock payment gateway (simulated checkout + webhook callbacks)
- Email integration: Gmail OAuth + Gmail API
- Notifications: Email

### 3.4 How Inertia fits (v3)

**Inertia.js** lets you build a client-rendered SPA (here: React) while keeping **routing, controllers, auth, and validation on the server** (Laravel). Controllers return `Inertia::render('Page/Name', [...props])` instead of Blade views; the first-party adapter wires that to your React pages. You still define URLs in Laravel’s router; you do **not** rely on a client-side router (for example React Router) for primary navigation the way a classic API+SPA split usually does.

Official v3 concepts: [How it works (Inertia v3)](https://github.com/inertiajs/docs/blob/main/v3/core-concepts/how-it-works.mdx).

### 3.5 JSON endpoints (exceptional, not the default)

Use small Laravel routes that return JSON **only where a non-Inertia client must call you** (for example mock payment gateway **webhooks**, or a minimal AJAX helper if you add one later). The golden-path screens (auth, dashboards, forms) should stay **Inertia visits + controller responses**.

---

## 4) Functional Requirements (with Priorities)

### FR-01 Authentication and User Profile

- **Priority:** P0
- System shall support user registration and login
- System shall persist basic profile fields (name, country, preferred currency)
- System shall protect all finance data behind authenticated routes

### FR-02 Payment Link Creation

- **Priority:** P0
- User shall create a payment link with amount, currency, description, client info, and due date
- System shall generate a unique shareable payment URL
- System shall store payment method/provider metadata and gateway reference ID
- System shall support at least one live/demo payment gateway integration path

### FR-03 Payment Status Tracking

- **Priority:** P0
- System shall ingest gateway webhook events
- System shall update payment status lifecycle: `Pending -> Paid -> Overdue`
- System shall expose payment status in list/detail views

### FR-04 Milestone Contract Builder

- **Priority:** P0
- User shall create contracts with project/client details and total value
- User shall define up to 5 milestones with percentage/amount and due date
- System shall generate a unique contract URL for client review
- Client shall be able to accept contract via checkbox-based e-sign action
- System shall record acceptance timestamp and source IP

### FR-05 Milestone-to-Payment Trigger

- **Priority:** P0
- When milestone status becomes "Ready for payment", system shall generate linked payment request
- Milestone status shall track lifecycle: `Pending -> In Progress -> Submitted -> Paid`

### FR-06 Income Entry and Aggregation

- **Priority:** P0
- System shall auto-create income entries from paid payment links
- User shall be able to add manual income entries (amount, source, date, client, category)
- System shall provide monthly totals and basic source/client breakdown

### FR-07 Expense Card CRUD

- **Priority:** P0
- User shall create, read, update, and archive/cancel expense cards
- Expense card fields shall include: name, category, type, amount, currency, billing cycle, renewal date, status, notes, tags
- System shall support recurring and one-time expense types

### FR-08 Expense Dashboard

- **Priority:** P0
- System shall display total monthly recurring burn
- System shall display upcoming renewals and current expense cards
- System shall provide filter/sort by status/category/cycle/date/amount

### FR-09 AI Cancel-Subscription Assistant

- **Priority:** P0
- User shall request cancel instructions by service name
- System shall call AI service and return:
  - cancel URL (if found)
  - step-by-step cancellation instructions
  - key notes (refund/penalty notices where available)
- Results shall be saved to the related expense card

### FR-10 Gmail Connection and Scan Trigger

- **Priority:** P0
- User shall connect Gmail account via OAuth
- User shall trigger scan for historical emails (target: last 6 months)
- System shall filter candidate emails using sender/subject/amount heuristics

### FR-11 AI Email Parsing and Review

- **Priority:** P0
- System shall parse candidate emails into structured fields:
  - service name, amount, currency, billing date, billing cycle, confidence
- System shall show a "Review and Confirm" queue before saving
- User-approved items shall create expense cards
- Rejected items shall not create expense cards

### FR-12 Renewal Alerting

- **Priority:** P1
- System shall send renewal reminders before next renewal date (default 7 days)
- Reminder payload shall include service, amount, and quick actions

### FR-13 Contract PDF Export

- **Priority:** P1
- System shall generate downloadable bilingual (Arabic/English) contract PDF

### FR-14 Data Export

- **Priority:** P1
- System shall allow monthly income export in CSV or PDF

### FR-15 Tax Estimate Widget

- **Priority:** P2
- System shall show estimated tax amount from configured brackets
- System shall show clear "estimate only" disclaimer

### FR-16 SaaS Cost vs Income Ratio

- **Priority:** P2
- System shall calculate monthly ratio of recurring SaaS cost to income
- System shall display simple risk color banding (green/yellow/red)

### FR-17 Currency Handling

- **Priority:** P1
- System shall support entry in EGP and USD for MVP flows
- System shall normalize reporting values to a base currency (EGP) using configured conversion logic
- Mixed currency within one contract is not allowed in MVP

---

## 5) Non-Functional Requirements (with Priorities)

### NFR-01 Delivery Reliability for Demo

- **Priority:** P0
- Core P0 flows must work end-to-end without manual DB edits:
  - create payment link -> status update
  - create contract with milestones
  - scan emails -> confirm -> create expense cards
  - dashboard views load usable data

### NFR-02 Performance (Hackathon Level)

- **Priority:** P1
- Dashboard and typical Inertia round-trips should return within ~2 seconds for typical demo data volumes
- Email scan initiation should respond immediately with async progress state

### NFR-03 Security Baseline

- **Priority:** P0
- All authenticated endpoints require auth token/session validation
- OAuth tokens and API secrets must be stored securely (env + encrypted storage where possible)
- Do not log raw secrets, OAuth tokens, or full sensitive payloads

### NFR-04 Data Integrity and Traceability

- **Priority:** P0
- Financial records shall use immutable IDs and timestamps
- Source attribution shall be stored (`manual`, `payment_link`, `email_parsed`)
- Payment webhook events should be idempotent (safe to process more than once)

### NFR-05 Privacy and Consent

- **Priority:** P0
- User must explicitly consent before connecting email
- Email scanning is limited to relevant payment/subscription signals for MVP workflow

### NFR-06 Availability and Recovery

- **Priority:** P1
- Application should recover gracefully from third-party API failure (payment, AI, email)
- Failures should present user-facing retry/error state, not silent failure

### NFR-07 Usability and Localization

- **Priority:** P1
- Core flows must be understandable for Arabic-first users
- MVP should avoid complex setup screens that are not part of demo-critical flow

### NFR-08 Observability

- **Priority:** P1
- System should log structured events for key flows:
  - payment created/paid
  - contract accepted
  - email scan run
  - AI parse result accepted/rejected

### NFR-09 Scalability (Prototype Constraint)

- **Priority:** P2
- Design should be modular enough to add Outlook, multi-user teams, and real card issuance post-MVP
- No requirement for production-grade horizontal scale during hackathon

---

## 6) Prioritized Delivery Slices (4 Days)

### Day 1 (P0 Foundation)

- Auth and profile
- Payment link create/list/detail
- Payment webhook status updates
- Basic contract + milestones flow
- DB schemas for income/expense/email scan records

### Day 2 (P0 Core Value)

- Income manager (auto + manual)
- Expense card CRUD + dashboard
- AI cancel-subscription endpoint + UI

### Day 3 (P0 Innovation)

- Gmail OAuth
- Email scan pipeline + AI parsing
- Review/confirm queue -> expense card creation

### Day 4 (P1 Polish + Demo Hardening)

- Renewal alerts
- Contract PDF export
- Export/report improvements
- Bug fixing, demo script, seeded sample data

---

## 7) Out of Scope (Hackathon MVP)

- Certified legal e-signature
- Real virtual card issuance
- Outlook/IMAP connectors
- Multi-user team accounts
- Escrow and complex dispute workflows
- Mobile app
- Deep accounting integrations

---

## 8) Demo Acceptance Checklist

The MVP is demo-ready when all of the following pass:

- User can create and share a payment link, and see status update
- User can create a contract with at least 2 milestones and capture client acceptance
- Income dashboard shows data from paid links plus manual entries
- User can create and manage expense cards
- AI cancel assistant returns actionable cancel guidance for a known tool (for example, Figma)
- Gmail scan finds subscription/payment emails, user confirms results, and expense cards are created
- Renewal and upcoming expense visibility appears in dashboard

---

## 9) Implementation Notes

- Prefer golden-path reliability over breadth of integrations
- Use realistic seeded data to de-risk demo dependencies
- Keep AI prompts deterministic and JSON-constrained for parsing
- Treat compliance-heavy concerns according to sandbox assumptions, not production regulations
