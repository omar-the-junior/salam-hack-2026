# UC-009 — Gmail connection and email scan trigger

---

## 1. Header

| Field | Value |
| ----- | ----- |
| Use case ID | `UC-009` |
| Title | Gmail connection and email scan trigger |
| Status | Draft |
| Priority | P0 |
| Owner | TBD |
| Last updated | 2026-04-27 |

---

## 2. Summary

The user can connect their Gmail account via OAuth from two entry points: a **"Scan my emails" banner** on the expense dashboard, and a dedicated **Email Scanner page** in the sidebar. Once connected, the user triggers a scan of their last 6 months of email. The scan runs **in the background** (Laravel queue job) — the user is free to keep using the app and receives a **toast notification** when results are ready. A status indicator on the Email Scanner page shows progress. The AI parsing and review queue are handled in `UC-010`.

---

## 3. Actors and context

### Primary actor

Authenticated freelancer or small business owner.

### Secondary actors

- **Gmail / Google OAuth:** authorization and email access
- **System:** Laravel MVC + Inertia v3 + React; SQLite; Gmail API; Laravel queue (database driver)

### Preconditions

- [ ] User is authenticated and onboarded (`UC-001b`)
- [ ] Google OAuth credentials (client ID + secret) are configured in the environment
- [ ] `connected_accounts` and `email_scans` tables are migrated
- [ ] Laravel queue worker is running (database driver — no Redis required)

### Postconditions (success — connect Gmail)

- [ ] A `connected_accounts` row exists with an encrypted Gmail OAuth token for the user
- [ ] The Email Scanner page shows the connected Gmail address and a "Scan emails" button

### Postconditions (success — scan trigger)

- [ ] An `email_scans` row is created with `status = queued`
- [ ] The background job is dispatched to the queue
- [ ] The user sees a toast: *"Scanning your emails in the background — we'll notify you when done."*
- [ ] When the scan completes, a second toast appears: *"Scan complete — X subscriptions found. Review them →"*

### Postconditions (failure — if applicable)

- [ ] If Gmail OAuth is denied by the user, no `connected_accounts` row is created; user is redirected back with an informative message
- [ ] If the scan job fails, `email_scans.status = failed` and the user sees a retry option

---

## 4. Traceability

| Type | IDs / references |
| ---- | ---------------- |
| Functional requirements | `FR-10` |
| Non-functional requirements | `NFR-03` (OAuth token stored encrypted), `NFR-05` (explicit consent before email connect), `NFR-06` (graceful failure on scan job error) |
| PRD | `docs/prd.md` — §6 Module 4: AI Subscription Scanner; §6.3.1 Email Connection Options; §6.3.2 Scanning Flow |
| Architecture | `docs/technical-specs.md` — §3.3–3.5; Gmail API |
| Depends on | `UC-001b` (auth) |
| Feeds into | `UC-010` — scan job output is consumed by the AI parsing step |

---

## 5. User journey (happy path)

### 5.1 Entry points

**Entry point A — Expense dashboard banner:**
- A persistent banner at the top of the expense dashboard: *"Connect Gmail to automatically detect your subscriptions"* + **"Scan my emails →"** button
- Banner is hidden once Gmail is connected

**Entry point B — Email Scanner page (`GET /email-scanner`):**
- Accessible from the sidebar navigation
- Controller returns `Inertia::render('EmailScanner/Index', [ 'connected_account' => ..., 'latest_scan' => ... ])`

Both entry points route the user to the same Gmail OAuth flow.

---

### 5.2 Gmail OAuth connect

1. User clicks "Scan my emails →" (from either entry point).
2. If no Gmail account is connected yet: user is redirected to `GET /auth/gmail` (Laravel Socialite or manual OAuth flow).
3. Google OAuth consent screen opens — user grants permission to **read emails** (readonly scope: `https://www.googleapis.com/auth/gmail.readonly`).
4. Google redirects to `GET /auth/gmail/callback`.
5. Controller:
   - Exchanges code for access + refresh tokens
   - Stores in `connected_accounts`: `{ user_id, provider: 'gmail', email, access_token (encrypted), refresh_token (encrypted) }`
6. User is redirected to `GET /email-scanner` (Inertia) — now shows the connected Gmail address.

> **NFR-05 consent:** The OAuth consent screen explicitly lists the permissions being requested. No additional in-app consent screen is required — Google's own screen is the consent mechanism.

---

### 5.3 Trigger scan

1. On the Email Scanner page, user sees:
   - Connected Gmail address
   - Last scan status (if any): *"Last scan: Apr 20 — 12 subscriptions found"* or *"No previous scan"*
   - **"Scan last 6 months"** button (disabled if a scan is already in progress)

2. User clicks **"Scan last 6 months"** → Inertia `POST /email-scanner/scan`.

3. Controller:
   - Creates an `email_scans` row: `{ user_id, status: 'queued', started_at: null }`
   - Dispatches `ScanEmailsJob` to the Laravel queue
   - Returns Inertia redirect back to `GET /email-scanner` with flash: *"Scanning your emails in the background — we'll notify you when done."*

4. **Status polling:** The Email Scanner page polls `GET /email-scanner/status` every **5 seconds** while a scan is `queued` or `in_progress`:

   | Scan status | Page shows |
   |-------------|------------|
   | `queued` | "Scan queued..." with a spinner |
   | `in_progress` | "Scanning emails... [N emails processed]" with a progress indicator |
   | `completed` | "Scan complete — N subscriptions found. [Review results →]" |
   | `failed` | "Scan failed. [Try again]" button |

5. When polling detects `status = completed`, the page:
   - Stops polling
   - Shows a **toast**: *"Scan complete — [N] subscriptions found. Review them →"* (with a link to the review queue)
   - Updates the page status display

---

### 5.4 `ScanEmailsJob` (background, handled by `UC-010`)

The job itself (email fetching + AI parsing) is fully specified in `UC-010`. From this UC's perspective, the job:

1. Sets `email_scans.status = in_progress`, `started_at = now()`
2. Fetches emails from Gmail API (last 6 months, filtered by heuristics)
3. Passes matches to Gemini for parsing
4. Stores parsed results as `email_scan_results` rows
5. Sets `email_scans.status = completed`, `completed_at = now()`, `found_count = N`

---

## 6. Alternative and error flows (minimal)

| # | Condition | Expected behavior |
| - | --------- | ----------------- |
| A1 | User denies Gmail OAuth consent | Redirect to `/email-scanner` with flash: *"Gmail access was not granted. Connect anytime to enable email scanning."* |
| A2 | OAuth token expires during scan | Job attempts token refresh using `refresh_token`; if refresh fails, sets scan status to `failed` with error note |
| A3 | Scan job fails (unhandled exception) | `email_scans.status = failed`; status polling detects it; user sees "Scan failed. Try again." |
| A4 | User clicks "Scan" while a scan is already running | Button is disabled; controller returns `409` if called directly |
| A5 | User disconnects Gmail | `DELETE /auth/gmail` — deletes `connected_accounts` row; existing scan results and expense cards are retained |

---

## 7. Data and contracts

### Entities / tables (SQLite)

**`connected_accounts`:**

```
id              uuid / bigint  PK
user_id         FK → users     unique per provider
provider        string         'gmail'
email           string         -- connected Gmail address
access_token    text           encrypted
refresh_token   text           encrypted
token_expires_at datetime      nullable
created_at      datetime
updated_at      datetime
```

**`email_scans`:**

```
id              uuid / bigint  PK
user_id         FK → users
status          enum           'queued' | 'in_progress' | 'completed' | 'failed'
started_at      datetime       nullable
completed_at    datetime       nullable
found_count     int            nullable   -- number of candidate subscriptions found
error_message   text           nullable
created_at      datetime
```

### Key reads / writes

- **OAuth callback:** `UPSERT connected_accounts` (update tokens if already connected)
- **Scan trigger:** `INSERT email_scans` + `dispatch(ScanEmailsJob)`
- **Status poll:** `SELECT status, found_count FROM email_scans WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`

### External integrations

| Integration | Purpose | Notes |
| ----------- | ------- | ----- |
| Google OAuth (Socialite or manual) | Gmail account authorization | Scope: `gmail.readonly` only |
| Gmail API | Fetch emails in scan job | Used inside `ScanEmailsJob` — see `UC-010` |
| Gemini API | Parse emails | Used inside `ScanEmailsJob` — see `UC-010` |

---

## 8. Mock and assumption box (hackathon)

- **Sandbox assumptions:** Gmail OAuth requires real credentials. For demo, use a pre-connected test Gmail account (seeded `connected_accounts` row with valid tokens). Reference: [Salam Hack 2026 Sandbox Assumptions](https://raw.githubusercontent.com/tariqlabs/salamhack-resources/refs/heads/main/2026/assumptions.md).
- **Queue driver:** Use Laravel's **database** queue driver — no Redis needed. Run `php artisan queue:work` in a separate terminal before the demo.
- **Status polling:** Simple `GET /email-scanner/status` JSON endpoint (not Inertia) — returns `{ status, found_count }`. Frontend uses `setInterval` in the React component, clears on `completed` or `failed`.
- **Token encryption:** Use Laravel's built-in `encrypt()`/`decrypt()` helpers for storing OAuth tokens.

---

## 9. Acceptance criteria (testable)

- [ ] Given no connected Gmail, when the user clicks "Scan my emails →", then they are redirected to Google OAuth consent
- [ ] Given OAuth consent is granted, then a `connected_accounts` row exists with encrypted tokens and the Email Scanner page shows the connected address
- [ ] Given OAuth consent is denied, then no row is created and a friendly message is shown
- [ ] Given a connected Gmail, when the user clicks "Scan last 6 months", then an `email_scans` row with `status = queued` is created and a background job is dispatched
- [ ] Given a running scan, when the frontend polls `/email-scanner/status`, then the current status is returned correctly
- [ ] Given `status = completed`, when the frontend detects it via polling, then polling stops and a toast with results count appears
- [ ] Given a scan job failure, then `status = failed` and a "Try again" button is shown
- [ ] Given a scan already in progress, when the user tries to start another, then the button is disabled and a `409` is returned if called directly
- [ ] Given `NFR-05`, the `gmail.readonly` scope is the only scope requested — no write access to Gmail

---

## 10. Scope boundaries

### In scope

- Gmail OAuth connect and disconnect
- Email Scanner page with connect state, scan trigger, and status display
- Background scan job dispatch (Laravel queue, database driver)
- Status polling (JSON endpoint, 5-second interval)
- Toast notification on scan completion

### Out of scope (this use case only)

- Email fetching, AI parsing, and review queue (`UC-010`)
- Ongoing watch for new emails post-scan (post-MVP)
- Outlook / IMAP (post-MVP, out of PRD scope for MVP)

---

## 11. Demo script snippet

1. Show the expense dashboard — point to the "Scan my emails →" banner.
2. Click it — show the Email Scanner page with the pre-connected Gmail address (use seeded account for reliability).
3. Click **"Scan last 6 months"** — show the toast and the "Scan queued..." status.
4. Watch the status update in real-time via polling: queued → in_progress → completed.
5. Toast appears: "Scan complete — 8 subscriptions found." Click "Review them →" (transitions to `UC-010` demo).

---

## 12. Decisions (resolved)

| Topic | Decision |
|-------|----------|
| Entry points | Both expense dashboard banner and dedicated sidebar page — user can reach the scanner from where they naturally are |
| Scan progress UX | Background job + status polling every 5 seconds — user stays unblocked; toast on completion |
| Queue driver | Laravel database driver — no Redis required; works with SQLite for hackathon |
| Token storage | Laravel `encrypt()`/`decrypt()` — simple, built-in, sufficient for hackathon |
| Polling mechanism | `setInterval` in React component with auto-clear on terminal status |
