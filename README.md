<div align="center">

<img src="public/logo/logo-full-primary.svg" alt="Mustahaq Logo" width="280" />

<br />
<br />

**The Arabic-first financial operating system for MENA freelancers**

*Contract · Collect · Track · Protect your earned money*

<br />

[![PHP](https://img.shields.io/badge/PHP-8.4-777BB4?style=flat-square&logo=php&logoColor=white)](https://php.net)
[![Laravel](https://img.shields.io/badge/Laravel-13-FF2D20?style=flat-square&logo=laravel&logoColor=white)](https://laravel.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docker.com)
[![License](https://img.shields.io/badge/License-MIT-0F766E?style=flat-square)](LICENSE)

<br />

<img src="public/images/dashboard-current-preview.png" alt="Mustahaq Dashboard" width="860" style="border-radius: 12px; border: 1px solid #e2e8f0;" />

<br />
<br />

[🌐 **Live Demo**](https://mustahaq.omarjr.dev/) · [📖 **Documentation**](docs/prd.md) · [🐛 **Report Bug**](https://github.com/omar-the-junior/salam-hack-2026/issues) · [🚀 **Deploy Guide**](docs/deploy-handbook.md)

</div>

---

## ✨ What It Does

مُسْتَحَقّ brings scattered freelance finances into one orderly workspace — no more WhatsApp links, Excel chaos, or forgotten subscriptions.

<table>
<tr>
<td width="50%">

### 💳 Payment Links
Shareable payment requests via **Paymob** — Cards, Fawry, Vodafone Cash, Orange Money. Get paid in seconds.

</td>
<td width="50%">

### 📜 Milestone Contracts
Professional contracts with client acceptance and staged payment releases. Document-like, not generic SaaS.

</td>
</tr>
<tr>
<td width="50%">

### 📊 Income Tracker
Unified dashboard — auto-logs from payments + manual entries. See your cash flow at a glance.

</td>
<td width="50%">

### 💸 Expense Manager
Track SaaS subscriptions with renewal alerts and AI-powered cancellation help. Stop leaking money.

</td>
</tr>
<tr>
<td colspan="2" align="center">

### 🤖 AI Email Scanner
Connect Gmail → auto-detect subscriptions from emails. Gemini + OpenRouter parse your inbox so you don't have to.

</td>
</tr>
</table>

---

## 🚀 Quick Start

### Prerequisites

- **PHP** 8.4+
- **Composer** 2.x
- **Node.js** 20+
- **pnpm** (enabled via corepack)

### Local Development

```bash
# 1. Clone
git clone https://github.com/omar-the-junior/salam-hack-2026.git
cd salam-hack-2026

# 2. Setup (installs dependencies, runs migrations, builds frontend)
composer setup

# 3. Start dev environment (server + queue worker + Vite)
composer dev
```

Visit **http://localhost:8000** — local dev uses SQLite, no PostgreSQL needed.

### Docker (Production)

```bash
# Build the production image
docker build -t mustahaq:local .

# Run with PostgreSQL env vars
docker run --rm -p 8080:80 \
  -e APP_KEY="base64:YOUR_KEY" \
  -e APP_ENV=production \
  -e DB_CONNECTION=pgsql \
  -e DB_HOST=your-postgres-host \
  -e DB_PORT=5432 \
  -e DB_DATABASE=mustahaq \
  -e DB_USERNAME=mustahaq_user \
  -e DB_PASSWORD=your-password \
  mustahaq:local
```

See the [**Deployment Handbook**](docs/deploy-handbook.md) for full VPS + Dockploy setup.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Laravel 13 · PHP 8.4 · PostgreSQL |
| **Frontend** | React 19 · TypeScript · Inertia.js v3 · shadcn/ui · TailwindCSS 4 |
| **AI** | Google Gemini · OpenRouter (fallback) |
| **Payments** | Paymob API (Cards, Fawry, Mobile Wallets) |
| **Email** | Gmail OAuth (scanner) · Resend (notifications) |
| **Storage** | Local (Docker volume) · MinIO / Cloudflare R2 (future) |
| **Infrastructure** | Docker · Apache · GitHub Actions CI/CD · Dockploy |

---

## 🏗 Architecture

```mermaid
flowchart TB
    classDef person fill:#1A9E8C,stroke:#148F7E,color:#fff,font-weight:bold
    classDef container fill:#B2E0DA,stroke:#1A9E8C,color:#1a1a1a,font-weight:bold
    classDef db fill:#2D9E4F,stroke:#228B3B,color:#fff,font-weight:bold
    classDef queue fill:#4B4EC9,stroke:#3A3DB0,color:#fff,font-weight:bold
    classDef external fill:#D4A017,stroke:#B8890F,color:#1a1a1a,font-weight:bold
    classDef storage fill:#F5E6B8,stroke:#D4A017,color:#1a1a1a,font-weight:bold

    subgraph mustahaq["مُسْتَحَقّ"]
        direction TB
        web_app["Laravel Web App<br/>PHP / Laravel 13<br/>MVC + Inertia.js v3<br/>Routing · Auth · Logic"]
        spa["React SPA<br/>React 19 + TypeScript<br/>shadcn/ui · TailwindCSS 4<br/>Inertia Pages"]
        db[("PostgreSQL Database<br/>Production Entities<br/>PaymentLinks · Income")]
        queue["Queue Worker<br/>Laravel Queue<br/>Email scan · Alerts"]
        files[("File Storage<br/>Docker Volume (Local)<br/>Contract PDFs · Receipts")]
    end

    paymob["Paymob API<br/>Payment gateway"]
    gmail["Gmail API<br/>Email provider"]
    gemini["Gemini API<br/>AI engine"]
    resend["Resend<br/>Transactional email"]

    freelancer["👤 Freelancer / SBO"]
    client["👤 Client / Payer"]

    class freelancer person
    class client person
    class web_app container
    class spa container
    class db db
    class queue queue
    class files storage
    class paymob external
    class gmail external
    class gemini external
    class resend external

    freelancer -->|"HTTPS, Inertia visits"| web_app
    client -->|"HTTPS, /pay/token"| web_app
    web_app -->|"Inertia::render() props"| spa
    spa -->|"Inertia form submissions"| web_app
    web_app -->|"Eloquent ORM"| db
    web_app -->|"dispatch() jobs"| queue
    queue -->|"Read/write job state"| db
    queue -->|"Parse emails"| gemini
    queue -->|"Fetch emails"| gmail
    queue -->|"Send notifications"| resend
    web_app -->|"Auth, Order, Pay Key"| paymob
    web_app -->|"Store/retrieve files"| files
    paymob -->|"Webhook POST"| web_app
```

---

## 📂 Documentation

| Document | Description |
|---|---|
| [PRD](docs/prd.md) | Product Requirements Document |
| [Architecture](docs/architecture.md) | System Design & Architecture |
| [Design System](docs/DESIGN.md) | Brand Identity, Colors, Typography |
| [DB Schema](docs/DB-design.md) | Database Structure |
| [Deployment](docs/DEPLOYMENT.md) | Docker & CI/CD Reference |
| [Deploy Handbook](docs/deploy-handbook.md) | VPS + Dockploy + PostgreSQL Setup |
| [Technical Specs](docs/technical-specs.md) | Technical Specifications |

<details>
<summary><b>Use Cases (UC-001 → UC-015)</b></summary>

- [UC-001: Register, Login, and Profile](docs/use-cases/UC-001-register-login-and-profile.md)
- [UC-001b: Account Initialization](docs/use-cases/UC-001b-account-initialization.md)
- [UC-002: Create Payment Link](docs/use-cases/UC-002-create-payment-link.md)
- [UC-003: Payment Status Tracking](docs/use-cases/UC-003-payment-status-tracking.md)
- [UC-004: Milestone Contract Builder](docs/use-cases/UC-004-milestone-contract-builder.md)
- [UC-005: Milestone to Payment Trigger](docs/use-cases/UC-005-milestone-to-payment-trigger.md)
- [UC-006: Income Entry and Dashboard](docs/use-cases/UC-006-income-entry-and-dashboard.md)
- [UC-007: Expense Card CRUD & Dashboard](docs/use-cases/UC-007-expense-card-crud-dashboard.md)
- [UC-008: AI Cancel Subscription Assistant](docs/use-cases/UC-008-ai-cancel-subscription-assistant.md)
- [UC-009: Gmail Connection & Scan Trigger](docs/use-cases/UC-009-gmail-connection-and-scan-trigger.md)
- [UC-010: AI Email Parsing & Review Queue](docs/use-cases/UC-010-ai-email-parsing-and-review-queue.md)
- [UC-011: Renewal Alerting](docs/use-cases/UC-011-renewal-alerting.md)
- [UC-012: Contract PDF Export](docs/use-cases/UC-012-contract-pdf-export.md)
- [UC-013: Income Data Export](docs/use-cases/UC-013-income-data-export.md)
- [UC-014: Paymob CC Payment](docs/use-cases/UC-014-paymob%20credit%20card%20payment%20on%20public%20payment%20link.md)
- [UC-015: Notifications System](docs/use-cases/UC-015-notifications-system.md)

</details>

---

## ⌨️ Scripts

| Command | Action |
|---|---|
| `composer setup` | Full install + migrate + frontend build |
| `composer dev` | Server + queue worker + Vite dev server |
| `composer test` | Run tests + linting |
| `pnpm run build` | Production frontend build |
| `pnpm run lint` | ESLint fix |
| `pnpm run format` | Prettier code formatting |
| `vendor/bin/pint` | PHP code formatting (Laravel Pint) |

---

## 👥 Contributors

<table>
<tr>
<td align="center">
  <a href="https://github.com/MohamedThabt">
    <img src="https://avatars.githubusercontent.com/u/153439581?s=96&v=4" width="64" style="border-radius:50%;" /><br />
    <b>Mohamed Thabet</b>
  </a>
</td>
<td align="center">
  <a href="https://github.com/omar-the-junior">
    <img src="https://avatars.githubusercontent.com/u/44696488?v=4" width="64" style="border-radius:50%;" /><br />
    <b>Omar (The Junior)</b>
  </a>
</td>
</tr>
</table>

---

<div align="center">

**SalamHack 2026 · Track 2 · Fintech**

<img src="public/logo/logo-icon-primary.svg" width="24" /> مُسْتَحَقّ — *What is owed, deserved, or due*

Distributed under the MIT License. See [`LICENSE`](LICENSE) for more information.

</div>
