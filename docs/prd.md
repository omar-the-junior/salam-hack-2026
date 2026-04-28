# مُسْتَحَقّ — Product Requirements Document (MVP)
**Hackathon:** SalamHack · Track 2 · Fintech (Financial Tools for Freelancers & Small Businesses)
**Version:** 1.0
**Status:** MVP Scope

---

## 1. Product Overview

### 1.1 One-Line Pitch
> We're building **مُسْتَحَقّ**, an Arabic-first financial operating system for MENA freelancers and small businesses that combines milestone contracts, payment links, income tracking, and AI-powered subscription management in one platform.

### 1.2 Problem Statement
MENA freelancers and small businesses (Egypt, Saudi, UAE) manage their finances across 5–10 disconnected tools:
- WhatsApp for sending payment info
- Excel sheets for tracking income
- Gmail for receiving payment confirmations
- Random apps for expense tracking
- Zero visibility into recurring SaaS costs eating their income

**The result:** lost income, forgotten subscriptions, no contracts, and zero financial clarity.

### 1.3 Target User
- **Primary:** Egyptian / MENA freelancer or small business owner (developer, designer, marketer, consultant, agency owner, shop owner)
- **Secondary:** Solo product owner / micro-agency / small business with 1–10 people
- **Revenue:** $500–$5,000/month from 2–10 active clients
- **Pain level:** Tracks income in Excel or in their head. Has been burned by a client who didn't pay.

---

## 2. User Journey (End-to-End Flow)

### 2.1 Full User Journey Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Landing Page                                 │
│           Value prop · Feature highlights · CTA buttons             │
└───────────────────────┬─────────────────────┬───────────────────────┘
                        │                     │
               [Sign Up]│                     │[Log In]
                        ▼                     ▼
              ┌──────────────┐       ┌─────────────────┐
              │  Register    │       │  Login          │
              │  (UC-001)    │       │  (UC-001)       │
              └──────┬───────┘       └────────┬────────┘
                     │                        │
                     │ new user               │ check onboarding_completed
                     ▼                        ├─── false ──▶ Onboarding wizard
              ┌──────────────────────┐        │
              │  Onboarding Wizard   │        │ true
              │  (UC-001b)           │        │
              │                      │        │
              │  Step 1: Role        │        │
              │  Step 2: Profile     │        │
              └──────────┬───────────┘        │
                         │                    │
                         └──────────┬─────────┘
                                    ▼
              ┌─────────────────────────────────────┐
              │             Dashboard               │
              │                                     │
              │  [Getting Started Checklist]        │
              │   ✅ Account created                │
              │   ⬜ Create payment link    [→]     │
              │   ⬜ Set up a contract      [→]     │
              │   ⬜ Add a subscription     [→]     │
              │   ⬜ Connect Gmail          [→]     │
              │                                     │
              │  Income summary · Expense summary   │
              │  Cash flow forecast widget          │
              └──────────────┬──────────────────────┘
                             │
          ┌──────────────────┼────────────────────┐
          ▼                  ▼                    ▼
  ┌───────────────┐  ┌────────────────┐  ┌────────────────────┐
  │ Payment Links │  │   Contracts    │  │ Expense / SaaS     │
  │ & Contracts   │  │ & Milestones   │  │ Subscription Mgr   │
  │ (Module 1)    │  │ (Module 1)     │  │ (Module 3 + 4)     │
  └───────────────┘  └────────────────┘  └────────────────────┘
          │                  │                    │
          └──────────────────▼────────────────────┘
                    ┌────────────────┐
                    │ Income Manager │
                    │  (Module 2)    │
                    │ Auto + Manual  │
                    └────────────────┘
```

### 2.2 Journey Phases

| # | Phase | User state | Key screens | Use cases |
|---|-------|-----------|-------------|-----------|
| 1 | Discovery | Anonymous | Landing page | — |
| 2 | Sign up | Unauthenticated | Register form | UC-001 |
| 3 | Log in | Unauthenticated | Login form | UC-001 |
| 4 | Initialization | Authenticated, not initialized | Onboarding wizard (2 steps) | UC-001b |
| 5 | First use | Authenticated, initialized | Dashboard + Getting Started checklist | UC-001b |
| 6 | Core actions | Authenticated | Payment links, contracts, income, expenses | UC-002+ |
| 7 | Returning use | Authenticated | Dashboard → any module | all UCs |

### 2.3 Onboarding Initialization (after first signup)

After registration the user must complete a **2-step onboarding wizard** before reaching the dashboard. This collects the minimum data needed for all downstream modules to work correctly.

**Step 1 — Role selection (1 question):**
> "How do you use مُسْتَحَقّ?"
- Freelancer — "I work independently for clients"
- Small Business Owner — "I run a business or agency"

**Step 2 — Profile setup (4 fields):**

| Field | Purpose |
|-------|---------|
| Display name / Business name | Appears on every payment link and contract clients see |
| Country | Drives currency default (Egypt → EGP, UAE/SA → USD) and tax brackets |
| Preferred currency | Pre-fills all payment link and contract forms |
| Profession (chips) | Developer · Designer · Marketer · Consultant · Content Creator · Other — auto-suggests relevant contract templates |

**Design principles applied:**
- **Progressive disclosure:** only what's needed for day-one use — no phone number, bank account, or logo at this stage
- **Time-to-value under 90 seconds:** two steps, no long forms, no uploads
- **Empty state prevention:** on first dashboard load the Getting Started checklist replaces any blank screen and drives the first action

### 2.4 Getting Started Checklist (post-onboarding dashboard)

Shown on the dashboard until dismissed or all items completed. Each item links directly to the relevant creation flow.

```
Getting started with مُسْتَحَقّ          [dismiss]
────────────────────────────────────────────────────
✅  Account created
⬜  Create your first payment link          [→ Create]
⬜  Set up a project contract               [→ Create]
⬜  Add a subscription or expense           [→ Add]
⬜  Connect Gmail to scan subscriptions     [→ Connect]
```

---

## 3. Core Modules (MVP Scope)

### Module 1 — Payment Links & Project Contracts
### Module 2 — Income Manager
### Module 3 — Expense & SaaS Subscription Manager
### Module 4 — AI Subscription Scanner (Email Agent)

---

## 3. Module 1: Payment Links & Milestone Contracts

### 3.1 Overview
Allow freelancers and small businesses to create professional payment requests and project contracts with milestone-based payment releases — without needing a company, a bank agreement, or a payment terminal.

### 3.2 User Stories

| # | As a... | I want to... | So that... |
|---|---------|-------------|------------|
| 1.1 | Freelancer / Small Business Owner | Generate a payment link for a project | I can share it via WhatsApp/email and get paid instantly |
| 1.2 | Freelancer / Small Business Owner | Create a milestone-based contract | My client agrees to pay in stages, not all upfront |
| 1.3 | Freelancer / Small Business Owner | Track which payment links are paid/unpaid | I know who owes me money |
| 1.4 | Freelancer / Small Business Owner | Send automatic payment reminders | I don't have to awkwardly ask for my money |
| 1.5 | Client | Click a link and pay securely | I can pay without needing an app or account |
| 1.6 | Freelancer / Small Business Owner | Set a default tax rate on my profile and override it per invoice | I don't re-enter my VAT rate every time but can still adjust it |

### 3.3 Features

#### 3.3.1 Payment Link Generator
- **Input:** Amount (subtotal), currency (EGP / USD), description, client name, due date, tax rate (optional, defaults to profile setting)
- **Tax calculation:** `tax_amount = subtotal × tax_rate / 100`; `total_amount = subtotal + tax_amount`. Both stored on the record.
- **Client pays:** `total_amount` (subtotal + tax shown as a line breakdown on the pay page and receipt)
- **Output:** Shareable link (e.g., `mustahaq.app/pay/xyz`)
- **Accepted methods:** Cards (Visa/Mastercard), Fawry, Vodafone Cash, Orange Money
- **Integration:** Paymob API or Fawaterk API (no commercial register required)
- **Status tracking:** Pending → Paid → Overdue
- **Auto-reminder:** Email/WhatsApp notification at due date + 3 days after

#### 3.3.2 Milestone Contract Builder
- **Fields:**
  - Project name & description
  - Client name + email
  - Total project value (subtotal before tax)
  - Tax rate (optional; defaults to profile `default_tax_rate`; overridable per contract)
  - Milestone breakdown (name, %, pre-tax amount, due date)
  - Terms & conditions (template provided, editable)
- **Tax on contracts:** Tax rate applies at the contract level. Each milestone's payment link amount = `milestone_subtotal + (milestone_subtotal × tax_rate / 100)`. The contract summary shows: subtotal, tax amount, and grand total.
- **Flow:**
  1. Freelancer or small business owner creates contract
  2. System generates a unique contract URL
  3. Client opens URL, reviews contract including tax breakdown, clicks "I Agree" (digital acceptance with timestamp + IP)
  4. Each milestone triggers a payment link automatically when marked "Ready for payment"
- **PDF export:** Auto-generate a professional PDF contract (Arabic + English bilingual)
- **Status per milestone:** Pending → In Progress → Submitted → Paid

#### 3.3.3 Contract Templates Library
- Web Development Project
- Design Project (Logo, Branding)
- Consulting / Advisory
- Content Writing
- Monthly Retainer
*(All templates in Arabic + English)*

### 3.4 MVP Constraints
- No escrow (funds go directly to the freelancer or small business owner's linked bank/wallet)
- Single currency per contract (EGP or USD, not mixed)
- Max 5 milestones per contract in MVP
- e-sign = checkbox acceptance (not a certified digital signature for MVP)
- Tax rate is a simple flat percentage (no compound tax, no tax-on-tax); default is 0% (tax-free) if not set
- Tax applies uniformly to all milestones on a contract at the contract's tax rate

---

## 4. Module 2: Income Manager

### 4.1 Overview
A unified income dashboard that aggregates all earnings from multiple sources — payment links, manual entries, and auto-parsed notifications — giving the freelancer or small business owner a real-time picture of their cash flow.

### 4.2 User Stories

| # | As a... | I want to... | So that... |
|---|---------|-------------|------------|
| 2.1 | Freelancer / Small Business Owner | See all my income in one dashboard | I know exactly how much I've earned this month |
| 2.2 | Freelancer / Small Business Owner | Log income from Upwork/Fiverr/bank transfers manually | Every source is tracked, not just our payment links |
| 2.3 | Freelancer / Small Business Owner | Have income from my payment links auto-logged | I don't double-enter data |
| 2.4 | Freelancer / Small Business Owner | See income by client, project, and month | I understand which clients and services make me the most money |
| 2.5 | Freelancer / Small Business Owner | Get a monthly income summary | I can estimate my tax and plan my spending |

### 4.3 Features

#### 4.3.1 Income Sources
| Source | How It Enters |
|--------|--------------|
| مُسْتَحَقّ payment links | Automatic via webhook from payment gateway |
| Manual entry | User inputs: amount, source, date, client, category |
| Email parsing (AI Agent) | See Module 4 — scans for payment confirmation emails |
| SMS/notification parsing | User pastes SMS text → AI extracts amount + sender |

#### 4.3.2 Income Dashboard
- **Monthly summary card:** Total earned, pending, overdue
- **Income timeline:** Bar chart by week/month
- **Per-client breakdown:** Revenue per client (current month + all time)
- **Per-category breakdown:** Freelance, Product Sales, Consulting, Other
- **Currency handling:** All amounts stored in base currency (EGP), with USD conversion at time of entry
- **Export:** Download monthly income report as PDF or CSV

#### 4.3.3 Smart Income Tagging
- AI auto-suggests category based on description
- Example: "Vodafone Cash from Ahmed" → suggests "Freelance Payment"
- Example: "Gumroad payout" → suggests "Digital Product Sale"

#### 4.3.4 Tax Estimate Widget
- Displays estimated Egyptian income tax due based on current year earnings
- Based on Egyptian progressive tax brackets (0% → 10% → 15% → 20% → 22.5% → 25%)
- **Disclaimer displayed:** "This is an estimate only. Consult a tax professional."
- Shows when to register for tax card (threshold: 15,000 EGP/year)

---

## 5. Module 3: Expense & SaaS Subscription Manager

### 5.1 Overview
Every expense (one-time or recurring) is created as a structured "card" object — a rich data container that holds everything about that expense including cancel links, renewal alerts, and cost tracking.

### 5.2 User Stories

| # | As a... | I want to... | So that... |
|---|---------|-------------|------------|
| 3.1 | Freelancer / Small Business Owner | See all my work expenses in one place | I know exactly what I'm spending on my business |
| 3.2 | Freelancer / Small Business Owner | Create an expense card for every SaaS subscription | I never forget what I'm paying for |
| 3.3 | Freelancer / Small Business Owner | Get alerted 7 days before a subscription renews | I decide whether to keep or cancel it before getting charged |
| 3.4 | Freelancer / Small Business Owner | Find the cancel link for any subscription in 1 click | I stop paying for tools I don't use |
| 3.5 | Freelancer / Small Business Owner | See my total monthly SaaS spend | I understand how much my "tools cost" vs my income |
| 3.6 | Freelancer / Small Business Owner | Issue a virtual "expense card" per service | I mentally separate each service's payment |

### 5.3 Expense Card Object

Each expense is a card with the following fields:

```
ExpenseCard {
  id: uuid
  name: string                    // "Figma Pro"
  category: enum                  // SaaS / Tool / Equipment / Marketing / Other
  type: enum                      // Recurring / One-time
  amount: decimal
  currency: string                // EGP / USD
  billing_cycle: enum             // Monthly / Annual / One-time
  next_renewal_date: date
  started_at: date
  status: enum                    // Active / Cancelled / Paused
  cancel_url: string              // Found by AI agent
  cancel_instructions: text       // Step-by-step from AI agent
  notes: text
  tags: string[]
  alert_days_before: int          // Default: 7
  auto_detected: boolean          // Was this found by email scanner?
  source_email_id: string         // Reference to the email that created it
}
```

### 5.4 Features

#### 5.4.1 Expense Card Dashboard
- **Total monthly burn** (sum of all active recurring expenses)
- **Total annual commitment** (what you're locked into this year)
- **Expense cards grid:** Each card shows logo, name, amount, next renewal, status
- **Filter by:** Category, Status, Currency, Billing cycle
- **Sort by:** Next renewal, Amount, Name

#### 5.4.2 Renewal Alert System
- Push notification + email alert 7 days before renewal (configurable)
- Alert contains:
  - Service name + amount
  - "Keep" or "Cancel" action buttons
  - Direct cancel link (if found)
- If user clicks "Cancel" → shows cancel instructions fetched by AI agent

#### 5.4.3 Cancel Subscription AI Agent
- User inputs service name (e.g., "Adobe Creative Cloud")
- Agent calls Gemini API with web search tool
- Returns:
  - Direct cancel URL
  - Step-by-step cancellation instructions
  - Any important notes (e.g., "cancelling mid-cycle means no refund")
  - Alternative cheaper plan suggestion if available
- Result is saved to the expense card permanently

#### 5.4.4 Virtual Expense Card (Conceptual for MVP)
- Each expense card represents a "mental account" for that service
- Shows total spent on this service (lifetime + this year)
- Can attach receipts/invoices (PDF/image upload)
- *Note: Actual virtual card issuance is post-MVP — in MVP this is a tracking concept, not a real issued card*

#### 5.4.5 SaaS Cost vs Income Ratio
- Widget showing: **"Your tools cost X% of your monthly income"**
- Green (< 10%), Yellow (10–20%), Red (> 20%)
- Recommendation: "You're spending $X on tools you haven't used this month: [list]"

---

## 6. Module 4: AI Subscription Scanner (Email Agent)

### 6.1 Overview
The most technically innovative feature of the MVP. An AI agent connects to the user's Gmail/Outlook, scans for subscription and payment emails, and automatically populates the Expense Manager — eliminating manual data entry entirely.

### 6.2 User Stories

| # | As a... | I want to... | So that... |
|---|---------|-------------|------------|
| 4.1 | Freelancer / Small Business Owner | Connect my Gmail and have it scan for subscriptions | I don't have to remember every service I pay for |
| 4.2 | Freelancer / Small Business Owner | Review AI-detected subscriptions before they're added | I stay in control of what's in my expense list |
| 4.3 | Freelancer / Small Business Owner | Have new subscription emails auto-detected going forward | My list stays up to date without effort |
| 4.4 | Freelancer / Small Business Owner | See subscriptions I forgot I was paying for | I find and kill zombie subscriptions |

### 6.3 Technical Approach

#### 6.3.1 Email Connection Options (in priority order)
| Method | Complexity | For Hackathon? |
|--------|-----------|----------------|
| **Gmail OAuth + Gmail API** | Medium | ✅ Yes — best choice |
| **Google MCP server** | Low | ✅ Yes — if available |
| **Outlook / Microsoft Graph API** | Medium | ⚠️ Post-MVP |
| **IMAP generic** | High | ❌ Too complex for hackathon |

#### 6.3.2 Scanning Flow
```
1. User clicks "Scan My Emails"
2. OAuth consent screen (Gmail)
3. System fetches last 6 months of emails
4. Filter emails by sender patterns:
   - Known subscription senders (Notion, Figma, Adobe, etc.)
   - Subject patterns: "receipt", "invoice", "subscription", 
     "renewal", "charged", "payment confirmed"
   - Amount patterns: "$X.XX", "EGP X"
5. AI Agent (Gemini API) processes each matched email:
   - Extract: service name, amount, currency, billing date, billing cycle
   - Classify: new subscription vs renewal vs one-time
6. Present results to user as "Review & Confirm" list
7. User approves/rejects each item
8. Approved items → create ExpenseCard objects
9. Set up ongoing watch: new matching emails → auto-create cards
```

#### 6.3.3 AI Email Parsing Prompt Design
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

#### 6.3.4 Known Sender Whitelist (pre-built for demo)
Adobe, Figma, Notion, Canva, GitHub, Vercel, DigitalOcean, AWS, Google Workspace, Zoom, Slack, ChatGPT/OpenAI, Midjourney, Grammarly, Dropbox, Spotify, Netflix, YouTube Premium, JetBrains, Linear, Postman, Cloudflare, Namecheap, GoDaddy, Shopify, Mailchimp, ConvertKit, Loom, Typeform

---

## 7. 💡 AI-Powered Feature Ideas (Competitive Edge)

These go beyond the base MVP and make the product genuinely valuable:

### 7.1 "Dead Tool" Detector
- Track last login/usage date of connected SaaS tools (via OAuth if available)
- Surface tools not used in 30+ days: *"You haven't used Loom in 47 days — you're paying $12/month"*

### 7.2 Cash Flow Forecast
- Based on upcoming invoice due dates + recurring expenses
- Show projected balance for next 30/60/90 days
- Alert: *"Warning: You have $180 in subscriptions renewing this month but only $0 in confirmed incoming payments"*

### 7.3 Client Profitability Score
- Income from client vs time/effort implied by project count
- Shows which clients are worth keeping vs dropping
- *"Client A: $2,400 total, 3 projects. Client B: $800 total, 5 projects. Consider raising Client B's rates."*

### 7.4 Negotiation Intelligence
- When a freelancer or small business owner creates a payment link, AI suggests optimal price based on:
  - Project type and scope
  - Market rates for MENA region
  - User's own history (avg rate per project type)

### 7.5 Late Payment Predictor
- Based on client payment history, predict likelihood of on-time payment
- *"Ahmed has paid late on 2 of 3 previous invoices — consider requiring 50% upfront"*

### 7.6 Expense Optimization Suggestions
- Detect duplicate tools: *"You have both Notion AND Coda — they serve the same purpose"*
- Suggest cheaper alternatives: *"Figma Pro ($15/mo) → Penpot (free, open source)"*
- Detect annual vs monthly savings: *"Switching Canva to annual saves you $48/year"*

### 7.7 WhatsApp Bot Integration
- Freelancer or small business owner can interact with مُسْتَحَقّ via WhatsApp
- *"Send 5000 EGP link to Mohamed for logo design"* → generates payment link
- *"What's my income this month?"* → responds with summary
- *"Add expense Vercel $20 monthly"* → creates expense card

### 7.8 Bank Statement Import
- Upload Egyptian bank statement (PDF from CIB, NBE, Banque Misr)
- AI parses transactions → auto-categorizes as income or expense
- Merges with existing data, flags duplicates

---

## 8. Technical Architecture (MVP)

### 8.1 Tech Stack
| Layer | Technology |
|-------|-----------|
| Backend | Laravel (PHP) — Mohamed's primary stack |
| Frontend | React (TypeScript) |
| Database | SQLite |
| Payment Gateway | Paymob API / Fawaterk API |
| AI Engine | Gemini API (gemini-2.5-pro) |
| Email Integration | Gmail API (OAuth 2.0) |
| PDF Generation | DomPDF (Laravel) |
| Notifications | Firebase Cloud Messaging / Email via Resend |
| File Storage | S3-compatible (MinIO or Cloudflare R2) |
| Deployment | Railway / Render (fast hackathon deploy) |

### 8.2 Core Data Models

```
User
  ├── Profile (name, country, currency preference)
  ├── PaymentLinks []
  ├── Contracts []
  │     └── Milestones []
  ├── IncomeEntries []
  ├── ExpenseCards []
  └── ConnectedAccounts [] (Gmail, etc.)

PaymentLink
  ├── amount, currency, description
  ├── client_name, client_email
  ├── due_date, status
  └── gateway_reference_id

Contract
  ├── project details, client info
  ├── total_value, status
  ├── signed_at, client_ip
  └── Milestones []
        ├── title, amount, percentage
        ├── due_date, status
        └── payment_link_id (FK)

IncomeEntry
  ├── amount, currency, date
  ├── source (payment_link | manual | email_parsed)
  ├── category, client_name
  └── reference_id

ExpenseCard
  ├── name, amount, currency
  ├── type (recurring | one-time)
  ├── billing_cycle, next_renewal_date
  ├── cancel_url, cancel_instructions
  ├── status, auto_detected
  └── source_email_id
```

### 8.3 API Endpoints (Key)

```
POST   /api/payment-links              Create payment link
GET    /api/payment-links              List all
GET    /api/payment-links/:id          Get + status
POST   /api/contracts                  Create contract
POST   /api/contracts/:id/milestones   Add milestone
PUT    /api/milestones/:id/status      Update milestone status
GET    /api/income/summary             Dashboard data
POST   /api/income                     Manual income entry
GET    /api/expenses                   All expense cards
POST   /api/expenses                   Create expense card
POST   /api/expenses/scan-emails       Trigger email scan
POST   /api/ai/cancel-instructions     Get cancel info for service
GET    /api/ai/cash-flow-forecast      30/60/90 day forecast
```

---

## 9. Hackathon Build Priority

### Day 1 — Core Infrastructure + Payments
| Priority | Feature | Time Estimate |
|----------|---------|---------------|
| P0 | Auth (register/login) | 1h |
| P0 | Payment link creation + Paymob integration | 3h |
| P0 | Payment link status tracking (webhook) | 1h |
| P0 | Milestone contract builder (basic) | 3h |
| P1 | Contract PDF generation | 1h |
| P1 | Income dashboard (manual + auto from payment links) | 2h |

### Day 2 — AI Features + Expense Manager
| Priority | Feature | Time Estimate |
|----------|---------|---------------|
| P0 | Expense card CRUD + dashboard | 2h |
| P0 | Cancel subscription AI agent (Gemini API + web search) | 2h |
| P0 | Email scanner (Gmail OAuth + Gemini parsing) | 3h |
| P1 | Renewal alert notifications | 1h |
| P1 | Cash flow forecast widget | 1h |
| P2 | Tax estimate widget | 30min |
| P2 | SaaS cost vs income ratio | 30min |

---

## 10. MVP Success Metrics (Demo Day)

| Metric | Target |
|--------|--------|
| Live payment link created and paid | ✅ Demo live |
| Contract with 2 milestones created | ✅ Demo live |
| Email scan detects 5+ subscriptions | ✅ Demo live |
| Cancel instructions for "Figma" returned by AI | ✅ Demo live |
| Income dashboard populated | ✅ Demo live |
| Expense dashboard with renewal alerts shown | ✅ Demo live |

---

## 11. Out of Scope (Post-MVP)

- Real virtual card issuance (requires Nymcard/Stripe Issuing partnership)
- Certified legal e-signatures (DocuSign-level)
- Multi-user / team accounts
- Accounting software integrations (QuickBooks, Xero)
- Mobile app (React Native)
- Outlook / IMAP email scanning
- Crypto payment acceptance
- ZATCA e-invoicing compliance (Saudi)
- Multi-currency contracts
- Escrow payments

---

## 12. Competitive Differentiation

| Feature | مُسْتَحَقّ | Polar.sh | Lemon Squeezy | Paymob | ezPayments |
|---------|-------------|----------|---------------|--------|------------|
| Freelance service contracts | ✅ | ❌ | ❌ | ❌ | ❌ |
| Milestone payments | ✅ | ❌ | ❌ | ❌ | ❌ |
| AI email subscription scanner | ✅ | ❌ | ❌ | ❌ | ❌ |
| Cancel subscription AI agent | ✅ | ❌ | ❌ | ❌ | ❌ |
| Income + expense in one view | ✅ | ❌ | ❌ | ❌ | ❌ |
| Arabic-first UI | ✅ | ❌ | ❌ | ✅ | ❌ |
| Works for EG individuals (no register) | ✅ | ✅ | ✅ | ✅ | ❌ |
| MENA local payment methods | ✅ | ❌ | ❌ | ✅ | ❌ |

**Our moat:** The only product that combines contract → payment → income tracking → expense intelligence in one Arabic-first MENA platform.

---

*Document prepared for SalamHack 2025 · مُسْتَحَقّ MVP*