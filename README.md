<div align="center">
  <h1>مُسْتَحَقّ (Mustahaq)</h1>
  <p><strong>Arabic-first financial OS for MENA freelancers</strong></p>

  [![PHP](https://img.shields.io/badge/PHP-8.3-blue)](https://php.net)
  [![Laravel](https://img.shields.io/badge/Laravel-13-red)](https://laravel.com)
  [![React](https://img.shields.io/badge/React-19-cyan)](https://react.dev)
  [![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)
  
  <br />
  <br />
  
  <!-- Add your project screenshot/banner here -->
  <img src="https://placehold.co/800x400/252525/FFF?text=Mustahaq+Dashboard+Preview" alt="Mustahaq Dashboard Preview" width="800" style="border-radius: 8px;" />
  
  <br />
  <br />

  [**<img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/globe.svg" width="16" height="16" align="center" /> View Live Demo**](https://mustahaq.example.com) • [**<img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/book.svg" width="16" height="16" align="center" /> Documentation**](docs/prd.md) • [**<img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/bug.svg" width="16" height="16" align="center" /> Report Bug**](https://github.com/omar-the-junior/salam-hack-2026/issues)
</div>

---

## <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/list.svg" width="24" height="24" align="center" /> Index (Table of Contents)

- [<img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/sparkles.svg" width="16" height="16" align="center" /> What It Does](#what-it-does)
- [<img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/rocket.svg" width="16" height="16" align="center" /> Quick Start & Installation](#quick-start--installation)
- [<img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/wrench.svg" width="16" height="16" align="center" /> Tech Stack](#tech-stack)
- [<img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/folder-open.svg" width="16" height="16" align="center" /> Documentation Directory](#documentation-directory)
- [<img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/scroll-text.svg" width="16" height="16" align="center" /> Scripts](#scripts)
- [<img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/users.svg" width="16" height="16" align="center" /> Contributors](#contributors)
- [<img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/file-text.svg" width="16" height="16" align="center" /> License](#license)

---

## <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/sparkles.svg" width="24" height="24" align="center" /> What It Does

| Feature | What It Does |
|---------|--------------|
| **Payment Links** | Shareable payment requests via Paymob (Cards, Fawry, Vodafone Cash, Orange Money) |
| **Milestone Contracts** | Professional contracts with client acceptance and staged payment releases |
| **Income Tracker** | Unified dashboard — auto-logs from payments + manual entries |
| **Expense Manager** | Track SaaS subscriptions with renewal alerts and AI cancellation help |
| **AI Email Scanner** | Connect Gmail → auto-detect subscriptions from emails |

---

## <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/rocket.svg" width="24" height="24" align="center" /> Quick Start & Installation

To get a local copy up and running, follow these simple steps.

### Prerequisites
Ensure you have the following installed on your machine:
- **PHP** 8.3+
- **Composer** 2.x
- **Node.js** 20+

### Installation Steps

```bash
# 1. Clone the repository
git clone https://github.com/omar-the-junior/salam-hack-2026.git
cd salam-hack-2026

# 2. Setup the application (Installs dependencies, runs migrations, and builds frontend)
composer setup

# 3. Start the development environment (Starts server, queue worker, and Vite)
composer dev
```

Once running, visit `http://localhost:8000` in your browser.

---

## <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/wrench.svg" width="24" height="24" align="center" /> Tech Stack

- **Backend:** Laravel 13 + PHP 8.3 + SQLite
- **Frontend:** React 19 + TypeScript + Inertia.js v3 + shadcn/ui + TailwindCSS 4
- **AI Integration:** Gemini API (email parsing, cancellation instructions)
- **Payment Gateway:** Paymob API
- **Email Services:** Gmail OAuth + Resend
- **Storage:** MinIO / Cloudflare R2

---

## <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/folder-open.svg" width="24" height="24" align="center" /> Documentation Directory

| Type | Link | Description |
|------|------|-------------|
| **PRD** | [docs/prd.md](docs/prd.md) | Product Requirements Document |
| **Architecture** | [docs/architecture.md](docs/architecture.md) | System Design & Architecture |
| **DB Schema** | [docs/DB-design.md](docs/DB-design.md) | Database Structure |
| **Use Cases** | [docs/use-cases/](docs/use-cases/) | UC-001 → UC-014 details |
| **Deploy** | [docs/deploy-handbook.md](docs/deploy-handbook.md) | Deployment guidelines |

---

## <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/scroll-text.svg" width="24" height="24" align="center" /> Scripts

| Command | Action |
|---------|--------|
| `composer setup` | Full install + database migrate + frontend build |
| `composer dev` | Run server + queue worker + Vite development server |
| `composer test` | Run tests + linting |
| `npm run build` | Production frontend build |
| `npm run lint` | ESLint fix |
| `npm run format` | Prettier code formatting |

---

## <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/users.svg" width="24" height="24" align="center" /> Contributors

Thanks to these amazing people who have contributed to building Mustahaq:

| Avatar | Name | Role | GitHub |
|:---:|:---|:---|:---|
| <img src="https://avatars.githubusercontent.com/u/74640539?v=4" width="50" style="border-radius:50%;"/> | **Omar (The Junior)** | Full Stack Developer & Architect | [@omar-the-junior](https://github.com/omar-the-junior) |
| <img src="https://ui-avatars.com/api/?name=Contributor+Name&background=random" width="50" style="border-radius:50%;"/> | **[Name Here]** | [Role Here] | [@username](https://github.com/username) |
| <img src="https://ui-avatars.com/api/?name=Contributor+Name&background=random" width="50" style="border-radius:50%;"/> | **[Name Here]** | [Role Here] | [@username](https://github.com/username) |

*(Note: Feel free to update the table above with actual team members, their roles, and GitHub profiles)*

---

<div align="center">
  <b>SalamHack 2026 · Track 2 · Fintech</b> <br>
  Distributed under the MIT License. See <code>LICENSE</code> for more information.
</div>
