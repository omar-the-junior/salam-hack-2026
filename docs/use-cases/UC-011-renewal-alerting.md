# UC-011 — Renewal alerting

---

## 1. Header

| Field | Value |
| ----- | ----- |
| Use case ID | `UC-011` |
| Title | Renewal alerting |
| Status | Draft |
| Priority | P1 |
| Owner | TBD |
| Last updated | 2026-04-27 |

---

## 2. Summary

The system automatically checks all `Active` recurring expense cards daily and sends the freelancer an **email alert** (via Resend) when a subscription is due to renew within the card's configured `alert_days_before` window (default: 7 days). A matching **in-app notification** also appears as a banner on the expense dashboard. The alert includes the service name, renewal amount, and direct action links: "Keep" (dismiss) and "Cancel" (opens the cancel flow from `UC-007`/`UC-008`).

---

## 3. Actors and context

### Primary actor

Authenticated freelancer or small business owner (notification recipient).

### Secondary actors

- **System:** Laravel scheduler; Resend; SQLite

### Preconditions

- [ ] At least one `expense_cards` row with `status = active`, `type = recurring`, and a `next_renewal_date` set
- [ ] Laravel scheduler is running (`php artisan schedule:run` via cron or `schedule:work` in dev)

### Postconditions (success)

- [ ] Email alert sent to the user's registered email for each qualifying card
- [ ] An in-app alert row is stored so the dashboard banner can display it
- [ ] Each card is not re-alerted within the same alert window (idempotent)

### Postconditions (failure — if applicable)

- [ ] If Resend email fails, the in-app alert is still stored — email is fire-and-forget
- [ ] If the scheduler misses a run, the alert fires on the next run (no permanent loss)

---

## 4. Traceability

| Type | IDs / references |
| ---- | ---------------- |
| Functional requirements | `FR-12` |
| Non-functional requirements | `NFR-06` (graceful email failure), `NFR-07` (Arabic-first email content) |
| PRD | `docs/prd.md` — §5.4.2 Renewal Alert System |
| Architecture | `docs/technical-specs.md` — §3.3–3.5; Resend |
| Depends on | `UC-007` — expense cards are the data source; `UC-008` — "Cancel" action links to cancel flow |

---

## 5. User journey (happy path)

### 5.1 Scheduled check (`CheckRenewalsCommand`)

Runs daily via Laravel scheduler:

```php
Schedule::command('renewals:check')->daily();
```

**Logic:**

```
For each expense_card WHERE:
  status = 'active'
  AND type = 'recurring'
  AND next_renewal_date IS NOT NULL
  AND next_renewal_date <= today + alert_days_before
  AND next_renewal_date >= today  -- not already past
  AND last_alerted_at IS NULL
      OR last_alerted_at < (next_renewal_date - alert_days_before)  -- not re-alerted for this cycle
```

For each qualifying card:
1. Send email via Resend (section 5.2)
2. Insert a `renewal_alerts` row
3. Update `expense_cards.last_alerted_at = now()`

### 5.2 Email alert (Resend)

- **Subject:** `"⏰ [service_name] renews in [N] days — [amount] [currency]"`
- **Body:**
  - Service name + amount + renewal date
  - Two CTA buttons:
    - **"Keep it"** → links to `GET /expenses` (dismisses concern)
    - **"Cancel it"** → links to `GET /expenses/{id}` with `?action=cancel` (auto-opens the cancel slide-over)
  - Footer: "Manage all subscriptions at [app URL]"

### 5.3 In-app dashboard banner

- `renewal_alerts` rows with `dismissed_at = null` are fetched on the expense dashboard load
- Shown as a dismissible banner above the card grid:
  - *"⏰ [service_name] renews on [date] — [amount]"*
  - **"Cancel"** link (opens cancel slide-over) · **"Dismiss"** button
- "Dismiss" → `PUT /renewal-alerts/{id}/dismiss` → sets `dismissed_at = now()`

---

## 6. Alternative and error flows (minimal)

| # | Condition | Expected behavior |
| - | --------- | ----------------- |
| A1 | Email send fails | In-app alert still created; failure logged |
| A2 | Card is cancelled before alert fires | `WHERE status = 'active'` excludes it — no alert sent |
| A3 | `next_renewal_date` is in the past | `AND next_renewal_date >= today` excludes it — no alert; user should update the card |
| A4 | User updates `alert_days_before` on a card | Next scheduler run picks up the new value — no backfill needed |

---

## 7. Data and contracts

### Entities / tables (SQLite)

**`expense_cards`** — new column:

```
last_alerted_at     datetime   nullable
```

**`renewal_alerts`:**

```
id              uuid / bigint  PK
user_id         FK → users
expense_card_id FK → expense_cards
alerted_at      datetime
dismissed_at    datetime   nullable
created_at      datetime
```

### Key reads / writes

- **Scheduler query:** `SELECT expense_cards WHERE status = active AND type = recurring AND next_renewal_date <= today + N AND last_alerted_at check`
- **On alert:** `INSERT renewal_alerts` + `UPDATE expense_cards.last_alerted_at`
- **Dashboard load:** `SELECT renewal_alerts WHERE user_id = ? AND dismissed_at IS NULL`
- **Dismiss:** `UPDATE renewal_alerts SET dismissed_at = now()`

### External integrations

| Integration | Purpose | Notes |
| ----------- | ------- | ----- |
| Resend | Email renewal alert | Fire-and-forget |

---

## 8. Mock and assumption box (hackathon)

- **Demo trigger:** Run `php artisan renewals:check` manually before the demo. Seed one expense card with `next_renewal_date = tomorrow` to guarantee an alert fires.
- **Scheduler:** Configure `schedule:work` in a dev terminal or add to crontab. For demo, manual artisan call is acceptable.

---

## 9. Acceptance criteria (testable)

- [ ] Given a card with `next_renewal_date = today + 5` and `alert_days_before = 7`, when the check command runs, then an email is sent and a `renewal_alerts` row is created
- [ ] Given the same card, when the command runs again the same day, then no duplicate alert is sent (`last_alerted_at` check)
- [ ] Given a `renewal_alerts` row with `dismissed_at = null`, when the expense dashboard loads, then the banner is shown
- [ ] Given the user clicks "Dismiss", then `dismissed_at` is set and the banner disappears on next load
- [ ] Given a Cancelled card, when the command runs, then no alert is sent for it

---

## 10. Scope boundaries

### In scope

- Daily scheduled command + email alert via Resend
- In-app dismissible banner on expense dashboard
- Idempotency (no duplicate alerts per renewal cycle)

### Out of scope

- Push notifications / FCM (post-MVP)
- WhatsApp alerts (post-MVP)
- Snooze functionality (post-MVP)

---

## 11. Demo script snippet

1. Run `php artisan renewals:check` with a seeded card due tomorrow.
2. Show the email received in the test inbox (Resend dashboard or Mailtrap).
3. Open the expense dashboard — show the renewal banner above the grid.
4. Click "Dismiss" — banner disappears.

---

## 12. Decisions (resolved)

| Topic | Decision |
|-------|----------|
| Alert channel | Email (Resend) + in-app banner — covers both real-time and passive discovery |
| Idempotency | `last_alerted_at` on the expense card guards against re-alerting within the same cycle |
| In-app alert storage | `renewal_alerts` table — allows multiple undismissed alerts to stack up |
