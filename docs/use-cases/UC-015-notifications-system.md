# UC-015 — Notifications System

---

## 1. Header

| Field | Value |
| ----- | ----- |
| Use case ID | `UC-015` |
| Title | Notifications System |
| Status | Draft |
| Priority | P1 |
| Owner | TBD |
| Last updated | 2026-04-30 |

---

## 2. Summary

The notification system ensures users and their clients stay informed about critical events (payments, contract signings, subscription renewals, and email scans) without overwhelming them. It centralizes all alert logic across the platform. The system uses a unified Laravel database table (`notifications`) for persistent in-app alerts, Session Flash messages for immediate ephemeral feedback, and Resend for transactional email delivery.

---

## 3. Actors and context

### Primary actor

Authenticated freelancer or small business owner (receives most notifications).

### Secondary actors

- **Client:** Unauthenticated, receives automated payment requests and receipts.
- **System:** Laravel MVC + Inertia v3 + React; SQLite (`notifications` table); Laravel Mail/Resend.

### Preconditions

- [ ] User is authenticated and onboarded (`UC-001b`)
- [ ] Notifications table is migrated
- [ ] Resend API key is configured in the environment

### Postconditions (success)

- [ ] Users receive real-time or persistent alerts when key events occur.
- [ ] Clients receive correct email communications for invoices and contracts.
- [ ] DB notifications can be marked as read or dismissed.

---

## 4. Traceability

| Type | IDs / references |
| ---- | ---------------- |
| Functional requirements | `FR-03`, `FR-04`, `FR-05`, `FR-10`, `FR-11` |
| Non-functional requirements | `NFR-06` (Graceful email failure — fire-and-forget) |
| Depends on | `UC-003`, `UC-004`, `UC-005`, `UC-009`, `UC-011` |

---

## 5. Notification Matrix and User Journey

The system categorizes notifications into three delivery channels:
1. **In-App Toast/Flash:** Ephemeral messages shown on the next page load (stored via Laravel Session).
2. **In-App DB Notification:** Persistent alerts shown in a UI banner or notification center, requiring user dismissal.
3. **Email (Resend):** Transactional emails sent to the freelancer or client.

### 5.1 Event Matrix

| Event | Trigger | Recipient | In-App / DB Channel | Email Channel |
|-------|---------|-----------|---------------------|---------------|
| **Contract Signed** | Client signs via public contract URL (`UC-004`) | Freelancer | **DB Notification** & Flash toast | Yes — "✍️ [client name] signed your contract" |
| **Milestone Payment Request** | Freelancer clicks "Request Payment" (`UC-005`) | Client | N/A | Yes — "Payment request: [milestone] — [project]" |
| **Payment Received** | Webhook marks link as Paid (`UC-003`, `UC-005`) | Freelancer | **DB Notification** & Flash toast | Yes — "💰 Payment received — [description]" |
| **Payment Receipt** | Client completes payment (`UC-003`) | Client | N/A | Yes — Optional/Deferred to receipt page |
| **Renewal Alert** | Daily cron detects upcoming expense (`UC-011`) | Freelancer | **DB Notification** | Yes — "Upcoming renewal: [service]" |
| **Email Scan Completed** | `ScanEmailsJob` finishes (`UC-009`) | Freelancer | **DB Notification** & Flash toast | No |

### 5.2 Delivery Mechanisms

#### Ephemeral Toasts (Laravel Session Flash)
- Used for immediate feedback following a webhook or user action.
- Controllers set `session()->flash('success', 'message')`.
- The Inertia shared props middleware exposes these to the React layout.
- The React layout renders a temporary toast component that auto-hides.

#### Persistent DB Notifications (Laravel Database Notifications)
- **All key events** are now stored in the database to ensure the user has a permanent history of actions (e.g., Payments, Contracts, Renewals).
- Rendered via a **Bell Icon in the navigation bar**. When clicked, it opens a dropdown or popover showing unread/recent notifications.
- Replaces the bespoke `renewal_alerts` table suggested in `UC-011` with standard Laravel polymorphic notifications.
- Can be marked as read (dismissed) via `PATCH /notifications/{id}/read`.

#### Emails (Resend)
- Triggered asynchronously via Laravel Queue (e.g., `PaymentPaidJob`) to prevent blocking the web request.
- If the Resend API fails, the error is logged, but the application continues normally (`NFR-06`).

---

## 6. Alternative and error flows

| # | Condition | Expected behavior |
| - | --------- | ----------------- |
| A1 | Resend API is down or fails | Exception is caught and logged; database state updates (e.g., payment marked as Paid) still succeed. |
| A2 | User dismisses a DB notification | `read_at` timestamp is set; it no longer appears in the active banner/dropdown. |
| A3 | Multiple renewal alerts trigger on the same day | Job dispatches multiple notifications; user receives one email per service (or a daily digest post-MVP). |

---

## 7. Data and contracts

### Entities / tables (SQLite)

We use Laravel's default `notifications` table structure:

```sql
CREATE TABLE notifications (
    id char(36) PRIMARY KEY,
    type varchar(255),
    notifiable_type varchar(255),
    notifiable_id bigint,
    data text, -- JSON payload containing specific details
    read_at timestamp NULL,
    created_at timestamp,
    updated_at timestamp
);
```

**JSON Payload Example for Renewal Alert (`data` column):**
```json
{
    "title": "Upcoming Renewal",
    "message": "Figma Pro renews on 2026-05-01 for $15",
    "expense_card_id": 123,
    "action_url": "/expenses"
}
```

### Key reads / writes

- **Create:** `User->notify(new RenewalAlert($expense))` inserts into `notifications` table.
- **Read:** `SELECT * FROM notifications WHERE notifiable_id = ? AND read_at IS NULL` on dashboard load.
- **Update:** `UPDATE notifications SET read_at = now() WHERE id = ?`.

---

## 8. Mock and assumption box (hackathon)

- **Sandbox assumptions:** Email sending limits apply. For the demo, emails should ideally be routed to a catch-all Mailtrap inbox, or a verified test address in Resend.
- **Notification UI:** Unread DB notifications are shown within a dedicated **Bell Icon** dropdown in the global application navigation.
- **Job execution:** Queue workers will run with `database` driver during the demo.

---

## 9. Acceptance criteria (testable)

- [ ] Given a client signs a contract, then the freelancer sees a session flash toast on their next page load and receives a notification email.
- [ ] Given a milestone payment is requested, then the client receives an email containing the payment link.
- [ ] Given a payment webhook completes successfully, then the freelancer receives an email and a session flash toast.
- [ ] Given the daily cron job detects a renewal within the alert window, then a new row is added to the `notifications` table for the user, and an email is sent.
- [ ] Given an unread row in the `notifications` table, then a banner appears on the dashboard.
- [ ] Given the user clicks "Dismiss" on a notification banner, then `read_at` is populated and the banner disappears.
- [ ] Given an email provider failure (Resend), then the system logs the error and does not roll back the primary action (e.g., payment status update).

---

## 10. Scope boundaries

### In scope

- Unified `notifications` database table implementation for persistent alerts.
- **Bell icon dropdown** in the navigation bar to view and interact with DB notifications.
- Transactional email dispatch via Laravel Mail/Resend.
- Session flash toasts for ephemeral feedback.
- Notification dismissal logic.

### Out of scope (post-MVP)

- User preferences to toggle specific email notifications on/off.
- Notification digests (e.g., "Weekly summary").
- SMS or WhatsApp notifications.
- Complex full-page notification center (a simple dropdown bell is used instead).
