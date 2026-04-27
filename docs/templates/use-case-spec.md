# Use case spec — template

Copy this file per use case (for example `docs/use-cases/UC-001-create-payment-link.md`) and fill every section. Keep scope tight for the hackathon golden path.

---

## 1. Header

| Field | Value |
| ----- | ----- |
| Use case ID | `UC-###` |
| Title | |
| Status | Draft / Ready / Implemented / Cut |
| Priority | P0 / P1 / P2 |
| Owner | |
| Last updated | YYYY-MM-DD |

---

## 2. Summary

Placeholder: one paragraph covering who, what outcome, and why it matters for the demo.

---

## 3. Actors and context

### Primary actor

Placeholder: for example freelancer or small business owner.

### Secondary actors

Placeholder: for example client, mock payment gateway, Gemini, Gmail.

### Preconditions

- [ ] Item

### Postconditions (success)

- [ ] Item

### Postconditions (failure — if applicable)

- [ ] Item

---

## 4. Traceability

| Type | IDs / references |
| ---- | ---------------- |
| Functional requirements | `FR-##` |
| Non-functional requirements | `NFR-##` |
| PRD | Optional: module and section |

---

## 5. User journey (happy path)

1. Step
2. Step
3. Step

Placeholder: number UI steps and system steps (API, DB, redirects, webhooks).

---

## 6. Alternative and error flows (minimal)

| # | Condition | Expected behavior |
| - | --------- | ----------------- |
| A1 | | |
| A2 | | |

---

## 7. Data and contracts

### Entities / tables (SQLite)

- Placeholder

### Key reads / writes

- Placeholder

### External integrations

| Integration | Purpose | Notes |
| ----------- | ------- | ----- |
| Mock payment gateway | | |
| Gemini API | | |
| Other | | |

Optional: link or paste minimal JSON for webhook or AI response.

---

## 8. Mock and assumption box (hackathon)

- **Sandbox assumptions:** link or bullets (for example Salam Hack sandbox).
- **Mock behavior:** how pay succeeds, webhook idempotency, seeded data.

---

## 9. Acceptance criteria (testable)

- [ ] Given … when … then …
- [ ] Item
- [ ] Item

---

## 10. Out of scope (this use case only)

- Placeholder

---

## 11. Demo script snippet (optional)

1. Step
2. Step
3. Step

---

## 12. Open questions

- Placeholder
