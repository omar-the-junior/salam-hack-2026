# UC-001 — Register, login, and basic profile

---

## 1. Header

| Field | Value |
| ----- | ----- |
| Use case ID | `UC-001` |
| Title | Register, login, and basic profile |
| Status | Draft |
| Priority | P0 |
| Owner | TBD |
| Last updated | 2026-04-27 |

---

## 2. Summary

A freelancer or small business owner can create an account, sign in, and have basic profile data (name, country, preferred currency) stored so every later flow (payment links, contracts, income, expenses) runs under a single authenticated identity. The app uses **Laravel MVC** with **Inertia.js v3** and **React** (no Blade for these screens): Laravel routes and controllers own auth and redirects, while Inertia renders React pages and passes server data as props. This use case is the foundation for all other P0 features and satisfies protected access to finance data behind Laravel middleware.

---

## 3. Actors and context

### Primary actor

Freelancer or small business owner using the web app.

### Secondary actors

- **System:** Laravel (MVC controllers, form requests, middleware), **Inertia.js v3** (React page mounting and visits), SQLite, **Laravel session** (Inertia default, same-origin cookie)
- **Identity providers (when enabled):** social login via **default Laravel** patterns (for example Socialite) — no bespoke protocol work in this UC

### Preconditions

- [ ] User has a valid email (or chosen identifier) and password meeting app-defined minimum rules
- [ ] Application and database are running with migrations applied

### Postconditions (success)

- [ ] New user row exists with `onboarding_completed = false` and basic auth fields persisted (`name`, `email`, `password_hash`)
- [ ] User receives a **Laravel session** (Inertia default: same-origin session cookie) usable on subsequent **authenticated Laravel routes** (including Inertia page loads)
- [ ] **New users** are redirected to the onboarding wizard (`/onboarding/step/1`) before reaching the dashboard — see `UC-001b`
- [ ] **Returning users** with `onboarding_completed = true` are redirected directly to the dashboard
- [ ] Unauthenticated users cannot load finance Inertia pages or hit protected controller actions

### Postconditions (failure — if applicable)

- [ ] No partial user record left in an inconsistent state (or clearly documented rollback)
- [ ] User sees a clear error message; no secrets in client logs
- [ ] `onboarding_completed` is never set to `true` by this UC — only `UC-001b` sets it

---

## 4. Traceability

| Type | IDs / references |
| ---- | ---------------- |
| Functional requirements | `FR-01`, `FR-01b` (onboarding redirect gate) |
| Non-functional requirements | `NFR-01` (enables end-to-end demo flows without manual DB edits), `NFR-03` (authenticated endpoints, secret handling), `NFR-07` (Arabic-first UX including RTL on auth and profile surfaces) |
| PRD | `docs/prd.md` — Section 9 Hackathon Build Priority (Day 1: Auth); implied prerequisite for Modules 1–4 |
| Architecture | `docs/technical-specs.md` — §3.3–3.5 (Laravel MVC + Inertia v3 + React) |

---

## 5. User journey (happy path)

### Registration

1. User opens the **Register** Inertia page (React), served by a Laravel route (for example `GET /register`) that returns `Inertia::render('Auth/Register', [...])`.
2. User submits the form via an **Inertia visit** (for example `router.post('/register', data)` or an `<Form>` from `@inertiajs/react`) to a Laravel `POST /register` action.
3. Controller validates input, hashes the password, persists `users` (and profile columns or a `profiles` row) in SQLite with `onboarding_completed = false`, then **logs the user in** using the **default Laravel** registration behavior.
4. Laravel issues a session and responds with a **redirect** to `/onboarding/step/1` as an **Inertia** navigation — **not** the dashboard. The full profile collection and dashboard redirect are handled by `UC-001b`.

### Login

1. User opens the **Login** Inertia page from a Laravel route (for example `GET /login`) → `Inertia::render('Auth/Login', [...])`.
2. User submits credentials via Inertia to `POST /login`.
3. Laravel authenticates the user and establishes a session.
4. Controller checks `onboarding_completed`:
   - `false` → redirect to `/onboarding/step/1` (user never finished setup)
   - `true` → redirect to `/dashboard`

### Authenticated access

1. User navigates to a protected finance page (for example payment links index) via an Inertia link to a Laravel route (for example `GET /payment-links`).
2. Route runs `auth` middleware; controller returns `Inertia::render('PaymentLinks/Index', [...])` with props. Unauthenticated access uses **Laravel + Inertia defaults** (typically redirect to login; Inertia may surface `409` on version conflicts — handle per framework guidance).

### Profile read/update (minimal)

1. User opens profile/settings as an Inertia page (for example `GET /profile`) with props for current name, country, preferred currency.
2. User saves changes via Inertia `PUT /profile` (or `PATCH /profile`); controller validates, updates SQLite, then redirects back or re-renders the same page with updated props.

---

## 6. Alternative and error flows (minimal)

| # | Condition | Expected behavior |
| - | --------- | ----------------- |
| A1 | Duplicate email on register | Redirect back with validation error; no duplicate user |
| A2 | Wrong password on login | Redirect back with validation errors or generic flash (do not reveal whether email exists) |
| A3 | Expired or invalid session | Redirect to login; stale Inertia asset/version edge cases per **Inertia defaults** |
| A4 | Profile update with invalid currency | Redirect back with validation errors (Inertia shared errors) |

---

## 7. Data and contracts

### Entities / tables (SQLite)

- **`users`** (or split `users` + **`profiles`**): at minimum `id`, `email`, `password_hash`, `name`, `onboarding_completed` (boolean, default `false`), `created_at`, `updated_at`. Fields `display_name`, `role`, `country`, `preferred_currency`, `profession` are added by `UC-001b` migrations — nullable at this stage.
- **`sessions`** (or equivalent): per **default Laravel** session driver configuration (SQLite is the app DB; session driver may be `file`/`database`/`redis` per env — follow starter defaults)

### Key reads / writes

- **Register:** insert user (+ profile) with `onboarding_completed = false`; never store plaintext password
- **Login:** read user by email, verify hash, establish Laravel session, then branch on `onboarding_completed` for redirect destination
- **Profile:** update name for authenticated user id (full profile fields are managed by `UC-001b`)
- **Inertia:** controllers return `Inertia::render(...)` for GET pages; mutations use redirects or same-page reload patterns consistent with [Inertia v3 responses](https://github.com/inertiajs/docs/blob/main/v3/the-basics/responses.mdx)

### External integrations

| Integration | Purpose | Notes |
| ----------- | ------- | ----- |
| Mock payment gateway | N/A | Not used in this UC |
| Gemini API | N/A | Not used in this UC |
| Other | N/A | |

---

## 8. Mock and assumption box (hackathon)

- **Sandbox assumptions:** Users are treated as already KYC/AML verified per hackathon rules; this UC does not implement KYC. Reference: [Salam Hack 2026 Sandbox Assumptions](https://raw.githubusercontent.com/tariqlabs/salamhack-resources/refs/heads/main/2026/assumptions.md).
- **Mock behavior:** None for payments. Auth may use seeded demo user for judges if desired, but golden path is real register → login → protected Inertia pages.

---

## 9. Acceptance criteria (testable)

- [ ] Given no account, when user registers with valid data, then a user exists in SQLite with `onboarding_completed = false`, the user is **logged in automatically**, and the next page is `/onboarding/step/1` (not the dashboard)
- [ ] Given valid credentials and `onboarding_completed = true`, when user logs in, then they are redirected to `/dashboard` and subsequent protected routes load correctly
- [ ] Given valid credentials and `onboarding_completed = false`, when user logs in, then they are redirected to `/onboarding/step/1`
- [ ] Given no or invalid auth, when user visits a protected finance route, then they are blocked (redirect to login or equivalent) and do not receive sensitive props
- [ ] Given logged-in user, when profile is updated, then persisted fields match on next `GET` profile
- [ ] Passwords are never returned in Inertia props or JSON responses and are not logged (aligns with `NFR-03`)
- [ ] **Arabic / RTL:** auth-related and profile screens respect Arabic-first layout and RTL when the app or user is in an RTL locale (`NFR-07`)
- [ ] **Account lifecycle (Laravel defaults):** forgot password, email verification, MFA, and social login **may** be enabled; where present, they behave per **stock Laravel + Inertia** (no custom flows specified in this UC)

---

## 10. Scope boundaries

### In scope (explicit)

- **Account recovery and trust:** forgot password, email verification, MFA, and social login — implemented with **default Laravel + Inertia** building blocks (no bespoke auth protocol design in this document).
- **Arabic-first UX:** RTL and Arabic-friendly auth and profile surfaces (`NFR-07`).

### Out of scope (this use case only)

- Team / multi-user accounts
- Role-based access control beyond “owner of this account”

---

## 11. Demo script snippet (optional)

1. Register a new user with name and email — show automatic redirect to `/onboarding/step/1` (not dashboard).
2. Complete the onboarding wizard (`UC-001b` demo covers the rest).
3. Log out and log back in as the same user — show direct redirect to dashboard (wizard skipped).
4. Open a protected Inertia page as an unauthenticated visitor — show redirect to login.

---

## 12. Decisions (resolved)

| Topic | Decision |
| ----- | -------- |
| Inertia behavior | Use **Inertia v3 defaults** (visits, forms, redirects, shared data) as documented by Inertia and the chosen Laravel starter. |
| After registration | **Auto-login** the user, then redirect to `/onboarding/step/1`. The dashboard redirect is handled by `UC-001b` after onboarding completes. |
| Laravel auth stack | Use **default Laravel implementation** with Inertia (for example official starter scaffolding); **no further custom auth architecture** is specified in this UC — defer to framework and package docs. |
| Session | **Laravel session** (same-origin cookie) with Inertia; no separate token-based SPA API for this UC. |
