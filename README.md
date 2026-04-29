# مُسْتَحَقّ (Mustahaq)

> Arabic-first financial OS for MENA freelancers

[![PHP](https://img.shields.io/badge/PHP-8.3-blue)](https://php.net)
[![Laravel](https://img.shields.io/badge/Laravel-13-red)](https://laravel.com)
[![React](https://img.shields.io/badge/React-19-cyan)](https://react.dev)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## What It Does

| Feature | What It Does |
|---------|--------------|
| **Payment Links** | Shareable payment requests via Paymob (Cards, Fawry, Vodafone Cash, Orange Money) |
| **Milestone Contracts** | Professional contracts with client acceptance and staged payment releases |
| **Income Tracker** | Unified dashboard — auto-logs from payments + manual entries |
| **Expense Manager** | Track SaaS subscriptions with renewal alerts and AI cancellation help |
| **AI Email Scanner** | Connect Gmail → auto-detect subscriptions from emails |

---

## Quick Start

```bash
composer setup      # One-command install
composer dev        # Run server + queue + vite
```

Visit `http://localhost:8000`

**Requirements:** PHP 8.3+, Composer 2.x, Node.js 20+

---

## Docs

| Type | Link |
|------|------|
| **PRD** | [docs/prd.md](docs/prd.md) |
| **Architecture** | [docs/architecture.md](docs/architecture.md) |
| **DB Schema** | [docs/DB-design.md](docs/DB-design.md) |
| **Use Cases** | [docs/use-cases/](docs/use-cases/) (UC-001 → UC-014) |
| **Deploy** | [docs/deploy-handbook.md](docs/deploy-handbook.md) |

---

## Stack

```
Backend:  Laravel 13 + PHP 8.3 + SQLite
Frontend: React 19 + TypeScript + Inertia.js v3 + shadcn/ui + TailwindCSS 4
AI:       Gemini API (email parsing, cancel instructions)
Payment:  Paymob API
Email:    Gmail OAuth + Resend
Storage:  MinIO / Cloudflare R2
```

---

## Scripts

| Command | Action |
|---------|--------|
| `composer setup` | Full install + migrate + build |
| `composer dev` | Server + queue + Vite |
| `composer test` | Tests + lint |
| `npm run build` | Prod build |
| `npm run lint` | ESLint fix |
| `npm run format` | Prettier fix |

---

**SalamHack 2026 · Track 2 · Fintech** · MIT License
