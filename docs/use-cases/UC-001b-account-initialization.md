# UC-001b — Account initialization (onboarding wizard)

---

## 1. Header

| Field | Value |
| ----- | ----- |
| Use case ID | `UC-001b` |
| Title | Account initialization (onboarding wizard) |
| Status | Implemented (MVP, core flow) |
| Priority | P0 |
| Owner | TBD |
| Last updated | 2026-04-28 |

---

## 2. Summary

Immediately after a new user completes registration (`UC-001`), the system detects that their profile is incomplete and redirects them to a **two-step onboarding wizard** before they reach the dashboard. The wizard collects the minimum data needed to make every downstream feature (payment links, contracts, income tracking, expense cards) work correctly from the very first use. On completion the user lands on the dashboard with a **Getting Started checklist** — never a blank screen. Returning users who are already initialized bypass this flow entirely.

---

## Current implementation state (2026-04-28)

- Implemented in app code and merged via commits `6fb6fd9` (static pages) and `3fb069d` (backend logic).
- Onboarding gate is active and consistent across login paths:
  - incomplete users are redirected to `/onboarding/step/1`
  - completed users bypass onboarding
- Step 1 role is stored in session; step 2 performs an atomic DB write for profile fields + `onboarding_completed`.
- Session onboarding role is cleared after successful step 2 completion.
- Dashboard checklist is now server-driven:
  - checklist items are computed from user data/tables
  - dismiss action is persisted using `onboarding_checklist_dismissed_at`
  - safe fallback exists when some downstream module tables are not yet available
- Related tracking issues `#2` and `#3` have been completed and closed.

---

## 3. Actors and context

### Primary actor

Newly registered freelancer or small business owner (authenticated, profile not yet initialized).

### Secondary actors

- **System:** Laravel MVC + Inertia v3 + React; SQLite; Laravel session middleware

### Preconditions

- [ ] User has just completed registration and is authenticated (`UC-001`)
- [ ] User's profile has `onboarding_completed = false` (or equivalent flag)
- [ ] `users` / `profiles` table has the onboarding fields and flag defined in migrations

### Postconditions (success)

- [ ] Profile row is updated with: `display_name`, `role`, `country`, `preferred_currency`, `profession`, `onboarding_completed = true`
- [ ] User is redirected to the dashboard (`/dashboard`)
- [ ] Dashboard renders a Getting Started checklist component on first login
- [ ] On any subsequent login the onboarding wizard is never shown again

### Postconditions (failure — if applicable)

- [ ] If the user closes the browser mid-wizard, their partial progress is lost and they restart from step 1 on next login
- [ ] If validation fails on any step, the user stays on that step and sees inline errors; no partial save

---

## 4. Traceability

| Type | IDs / references |
| ---- | ---------------- |
| Functional requirements | `FR-01b` (see `technical-specs.md`) |
| Non-functional requirements | `NFR-07` (Arabic-first UX, RTL), `NFR-01` (golden-path reliability for demo) |
| PRD | `docs/prd.md` — §2.5 User Journey, §8.1 Tech Stack |
| Architecture | `docs/technical-specs.md` — §3.3–3.5 (Laravel MVC + Inertia v3 + React) |
| Depends on | `UC-001` — user must be authenticated |
| Required by | `UC-002` and all subsequent UCs (display name on payment links, currency defaults, contract templates) |

---

## 5. User journey (happy path)

### Gate check (middleware)

1. After any login or registration, a Laravel middleware (`EnsureOnboardingComplete`) runs on protected routes.
2. If `onboarding_completed = false` → redirect to `GET /onboarding/step/1`.
3. If `onboarding_completed = true` → allow through to the intended route.

### Step 1 — Who are you? (role selection)

1. Controller returns `Inertia::render('Onboarding/Step1', [])`.
2. The page shows a single question: **"How do you use مُسْتَحَقّ?"**
   - Option A: **Freelancer** — "I work independently for clients"
   - Option B: **Small Business Owner** — "I run a business or agency"
3. User selects one option (large tap-friendly cards, not a dropdown).
4. User clicks **"Continue"** → Inertia `POST /onboarding/step/1` with `{ role }`.
5. Controller validates, stores `role` in the session (not yet persisted to DB — wait for final save), redirects to `GET /onboarding/step/2`.

### Step 2 — Set up your profile (4 fields)

1. Controller returns `Inertia::render('Onboarding/Step2', [ 'name' => auth()->user()->name ])`.
2. The page shows a form pre-filled where possible:

   | Field | Label | Input type | Notes |
   |-------|-------|-----------|-------|
   | `display_name` | "What name will clients see?" | Text | Pre-filled from registration name; editable. Appears on payment links and contracts. |
   | `country` | "Where are you based?" | Select | Options: Egypt, Saudi Arabia, UAE, Other |
   | `preferred_currency` | "Preferred currency" | Toggle/Select | EGP / USD. Auto-selected based on country (Egypt → EGP, else USD). |
   | `profession` | "What do you mainly do?" | Chip multi-select (pick one) | Developer · Designer · Marketer · Consultant · Content Creator · Other |

3. User fills the form and clicks **"Get started →"** → Inertia `POST /onboarding/step/2` with all fields.
4. Controller validates all fields + the `role` stored in session, then in a **single DB write**:
   - Updates `users` / `profiles` row with: `display_name`, `role`, `country`, `preferred_currency`, `profession`, `onboarding_completed = true`
5. Controller redirects to `GET /dashboard` (standard Inertia redirect).

### Dashboard first-login state

1. Dashboard controller detects `onboarding_completed` was just set (or checks a `show_checklist` flag / first-visit session key).
2. Dashboard renders the **Getting Started checklist** component:

   ```
   Getting started with مُسْتَحَقّ          [dismiss ×]
   ────────────────────────────────────────────────────
   ✅  Account created
   ⬜  Create your first payment link          [→ Create]
   ⬜  Set up a project contract               [→ Create]
   ⬜  Add a subscription or expense           [→ Add]
   ⬜  Connect Gmail to scan subscriptions     [→ Connect]
   ```

3. Each checklist item links directly to the relevant creation flow.
4. The checklist persists across sessions until dismissed or all items are completed.

---

## 6. Alternative and error flows (minimal)

| # | Condition | Expected behavior |
| - | --------- | ----------------- |
| A1 | User navigates directly to `/dashboard` while `onboarding_completed = false` | Middleware intercepts and redirects to `/onboarding/step/1` |
| A2 | User navigates directly to `/onboarding/step/2` without completing step 1 | Session has no `role` → redirect back to `/onboarding/step/1` |
| A3 | Validation failure on step 2 (e.g. missing display name) | Redirect back with Inertia shared validation errors; no DB write |
| A4 | User closes browser at step 1 or step 2 mid-flow | Session role data is lost on session expiry; user restarts from step 1 on next login — acceptable for MVP |
| A5 | Already-initialized user hits `/onboarding/step/1` directly | Middleware detects `onboarding_completed = true` → redirect to `/dashboard` |
| A6 | `preferred_currency` not provided (edge case) | Default to EGP; document this fallback in validation |

---

## 7. Data and contracts

### Entities / tables (SQLite)

Extend the `users` table (or `profiles` if split) with the following new columns:

```
users / profiles
  ├── display_name       string  nullable  -- what clients see on links & contracts
  ├── role               enum('freelancer', 'small_business')  nullable
  ├── country            string  nullable  -- 'EG' | 'SA' | 'AE' | 'OTHER'
  ├── preferred_currency string  default 'EGP'  -- 'EGP' | 'USD'
  ├── profession         string  nullable  -- 'developer' | 'designer' | 'marketer' | 'consultant' | 'content_creator' | 'other'
  └── onboarding_completed  boolean  default false
```

> **Note:** `name` and `email` already exist from `UC-001`. `display_name` may equal `name` but can differ (e.g. business name). Keep both.

### Key reads / writes

- **Step 1:** No DB write — store `role` in Laravel session only.
- **Step 2:** Single `UPDATE` on `users`/`profiles` for the authenticated user. Never trust `user_id` from client — always `auth()->id()`.
- **Middleware gate:** `SELECT onboarding_completed FROM users WHERE id = ?` on every protected route load (cached in session after first check to avoid repeated queries).
- **Dashboard:** Pass `show_checklist = true` as an Inertia prop on first post-onboarding visit; check via a `first_dashboard_visit` session key that is cleared after the first render.

### External integrations

| Integration | Purpose | Notes |
| ----------- | ------- | ----- |
| Mock payment gateway | N/A | Not used in this UC |
| Gemini API | N/A | Not used in this UC |
| Other | N/A | |

---

## 8. Mock and assumption box (hackathon)

- **Sandbox assumptions:** No KYC required per hackathon rules. The role and profile fields are self-declared; no verification is needed. Reference: [Salam Hack 2026 Sandbox Assumptions](https://raw.githubusercontent.com/tariqlabs/salamhack-resources/refs/heads/main/2026/assumptions.md).
- **Mock behavior:** For the demo, the seeded demo user should have `onboarding_completed = true` so judges skip the wizard. A secondary "fresh" test account may be used to demonstrate the wizard if needed.
- **Session storage for step 1 → 2:** Using Laravel's standard session is sufficient. No Redis or additional session drivers needed for hackathon.

---

## 9. Acceptance criteria (testable)

- [ ] Given a brand-new registered user (`onboarding_completed = false`), when they are redirected after registration, then they land on `/onboarding/step/1` (not the dashboard)
- [ ] Given step 1 is complete, when the user submits, then they reach step 2 with no DB changes yet
- [ ] Given step 2 is submitted with valid data, then `onboarding_completed = true`, all profile fields are persisted, and the user lands on the dashboard
- [ ] Given a returning user with `onboarding_completed = true`, when they log in, then they go directly to the dashboard and never see the onboarding wizard
- [ ] Given an incomplete user who navigates directly to `/dashboard`, then middleware redirects them to `/onboarding/step/1`
- [ ] Given step 2 is submitted with a missing `display_name`, then no DB write occurs and the error is shown inline
- [ ] Given a fresh post-onboarding dashboard visit, then the Getting Started checklist is visible with account-created plus 4 action items
- [ ] Given Arabic locale, then both onboarding steps and the checklist render RTL correctly (`NFR-07`)
- [ ] `display_name` value is reflected on the payment link creation form as a default client-visible name (`UC-002` dependency)

---

## 10. Scope boundaries

### In scope

- Two-step wizard (role selection + profile form)
- `EnsureOnboardingComplete` middleware guard on all authenticated routes
- Getting Started checklist on the dashboard (display only; checking off items is P1 polish)
- Arabic/RTL support on wizard and checklist screens

### Out of scope (this use case only)

- Logo / avatar upload (post-MVP)
- Phone number or bank account collection (not needed for any P0 feature)
- Email verification flow (handled by Laravel defaults in `UC-001`)
- Checking off checklist items (the items link to their respective flows; auto-completion based on user actions is P1)
- Social login onboarding variations

---

## 11. Demo script snippet

1. Open the app with a **fresh account** (not the seeded demo user).
2. Register → show automatic redirect to `/onboarding/step/1`.
3. Select **Freelancer**, click Continue.
4. Fill in display name ("Ahmed Design"), country (Egypt), currency (EGP), profession (Designer). Click **"Get started →"**.
5. Land on the dashboard — show the Getting Started checklist.
6. Click **"Create your first payment link"** to flow directly into `UC-002`.

---

## 12. Decisions (resolved)

| Topic | Decision |
| ----- | -------- |
| Number of steps | Two steps max — keeps time-to-value under 90 seconds and avoids judge friction during demo |
| When to write to DB | Only on final step 2 submission — avoids partial profile records |
| Role field scope | Two values only for MVP: `freelancer` / `small_business` |
| Step 1 persistence | Laravel session (not DB) until full wizard is completed |
| Middleware placement | Apply to all authenticated routes except `/onboarding/*` itself |
| Checklist persistence | Shown until dismissed or all items are completed (account-created + 4 action items); stored as a user preference flag |
| `display_name` vs `name` | Keep both — `name` is the auth identity, `display_name` is the client-facing business name |
