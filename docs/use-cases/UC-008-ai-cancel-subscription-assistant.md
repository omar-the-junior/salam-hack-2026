# UC-008 — AI cancel-subscription assistant

---

## 1. Header

| Field | Value |
| ----- | ----- |
| Use case ID | `UC-008` |
| Title | AI cancel-subscription assistant |
| Status | Draft |
| Priority | P0 |
| Owner | TBD |
| Last updated | 2026-04-27 |

---

## 2. Summary

When the user initiates a cancellation from the expense card dashboard (`UC-007`) and no cancel instructions exist yet, the AI cancel assistant fetches them on demand. The user sees an **inline loading spinner** inside the slide-over panel while the system calls the **Gemini API** with web search enabled. Gemini returns a structured result: a direct cancel URL, step-by-step instructions, and any important notes (e.g. refund policies). The result is **auto-saved** to the expense card immediately so it never needs to be fetched again. The same endpoint can also be triggered standalone — directly by service name — for cards that don't have instructions yet.

---

## 3. Actors and context

### Primary actor

Authenticated freelancer or small business owner (triggered from the cancel slide-over in `UC-007`).

### Secondary actors

- **System:** Laravel MVC + Inertia v3 + React; SQLite; Gemini API (gemini-2.5-pro with web search tool)

### Preconditions

- [ ] User is authenticated
- [ ] An `expense_cards` row exists owned by the user (with `cancel_instructions = null`)
- [ ] Gemini API key is configured in the environment

### Postconditions (success)

- [ ] `expense_cards.cancel_url` and `expense_cards.cancel_instructions` are populated and persisted
- [ ] The cancel slide-over panel in `UC-007` displays the instructions without requiring the panel to be reopened
- [ ] On any future open of the cancel panel for this card, instructions are served from DB — no re-fetch

### Postconditions (failure — if applicable)

- [ ] If the Gemini API call fails or times out, a friendly error message is shown inside the panel: *"Couldn't fetch instructions right now. You can try again or cancel manually."* — the expense card is not affected
- [ ] If Gemini returns low-confidence or no result, a fallback message is shown with a Google search link for the service name

---

## 4. Traceability

| Type | IDs / references |
| ---- | ---------------- |
| Functional requirements | `FR-09` |
| Non-functional requirements | `NFR-01` (golden-path demo), `NFR-03` (auth on all AI endpoints), `NFR-06` (graceful failure on AI timeout) |
| PRD | `docs/prd.md` — §5.4.3 Cancel Subscription AI Agent |
| Architecture | `docs/technical-specs.md` — §3.3–3.5; Gemini API |
| Depends on | `UC-007` — triggered from the cancel slide-over; expense card must exist |

---

## 5. User journey (happy path)

### 5.1 Trigger from cancel slide-over (`UC-007`)

1. User opens the cancel slide-over for an expense card that has no `cancel_instructions`.
2. The panel shows: *"We don't have cancel instructions for [service name] yet."* + **"Get cancel instructions →"** button.
3. User clicks the button → React sends `POST /expenses/{id}/fetch-cancel-instructions` (authenticated Inertia-compatible JSON or Inertia partial request).
4. **Inline loading spinner** replaces the button inside the panel — the panel stays open.
5. Controller calls the AI (section 5.2).
6. On success: result is persisted to the card (section 5.3) and the panel re-renders with the instructions in place of the spinner.

### 5.2 Gemini API call (server-side)

Controller calls `gemini-2.5-pro` with the **web search tool enabled**:

**Prompt:**

```
You are a subscription cancellation assistant.

The user wants to cancel their "{service_name}" subscription.

Using your web search capability, find the most up-to-date information and return a JSON object with exactly these fields:

{
  "cancel_url": "direct URL to the cancellation page, or null if not applicable",
  "steps": ["step 1 text", "step 2 text", ...],
  "notes": "any important warnings (refund policy, notice period, data deletion, cheaper plan alternative), or null",
  "confidence": "high | medium | low"
}

Respond only with valid JSON. Do not include any explanation outside the JSON.
```

**Input:** `service_name` = `expense_card.name` (e.g. `"Figma Pro"`, `"Adobe Creative Cloud"`)

**Expected output example:**

```json
{
  "cancel_url": "https://www.figma.com/billing",
  "steps": [
    "Go to figma.com and sign in to your account.",
    "Click your profile icon → Settings.",
    "Select 'Plans & Billing' from the sidebar.",
    "Click 'Cancel Plan' and follow the confirmation steps."
  ],
  "notes": "Cancelling does not delete your files. You keep Pro access until the end of your billing period. No partial refunds are issued.",
  "confidence": "high"
}
```

### 5.3 Persist and display result

1. Controller parses the JSON response.
2. Updates `expense_cards` row:
   - `cancel_url` = `result.cancel_url` (if not null)
   - `cancel_instructions` = formatted text from `result.steps` + `result.notes` (store as structured JSON or plain text — team's choice)
3. Returns the parsed result to the frontend (Inertia prop update or JSON response depending on implementation pattern).
4. The slide-over panel re-renders:
   - **Cancel URL:** shown as a clickable link with an external link icon — *"Go to cancellation page →"*
   - **Steps:** numbered list, clearly readable
   - **Notes:** shown in an amber info box if present (e.g. "⚠️ No partial refunds")
   - **Confidence badge:** small label — "High confidence" (green) / "Medium confidence" (yellow) / "Low confidence" (red) — helps user assess reliability
5. The "Confirm cancellation" button at the bottom of the panel is now fully active.

---

## 6. Alternative and error flows (minimal)

| # | Condition | Expected behavior |
| - | --------- | ----------------- |
| A1 | Gemini API call fails (network error / timeout) | Show in panel: *"Couldn't fetch instructions right now. Try again or search manually."* + link to Google search for the service name. Card unchanged. |
| A2 | Gemini returns `confidence = low` or empty steps | Show instructions as-is with a "Low confidence" badge; add note: *"We couldn't find reliable instructions — verify before cancelling."* |
| A3 | `cancel_instructions` already exist on the card | Panel shows existing instructions immediately (no API call). A small **"Refresh"** link allows re-fetching if the user thinks the instructions are outdated. |
| A4 | User retries after a failed fetch | Button re-appears in the panel; same flow restarts cleanly |
| A5 | Unauthenticated request to `POST /expenses/{id}/fetch-cancel-instructions` | `401` — middleware blocks |
| A6 | User requests instructions for another user's card | `403` — ownership check |

---

## 7. Data and contracts

### Entities / tables (SQLite)

No new tables. Updates to `expense_cards` (already defined in `UC-007`):

```
cancel_url            string   nullable   -- direct URL from AI result
cancel_instructions   text     nullable   -- JSON or plain text: steps + notes
```

Optionally store the raw AI response for debugging:

```
cancel_instructions_raw   text   nullable   -- full Gemini JSON response (for debug)
cancel_fetched_at         datetime nullable  -- when instructions were last fetched
```

### Key reads / writes

- **Trigger endpoint:** `POST /expenses/{id}/fetch-cancel-instructions` — auth + ownership check, then Gemini call
- **Persist:** `UPDATE expense_cards SET cancel_url, cancel_instructions, cancel_fetched_at WHERE id = ? AND user_id = ?`
- **Serve from cache:** On cancel panel open, controller checks `cancel_instructions IS NOT NULL` → return from DB; no Gemini call needed

### External integrations

| Integration | Purpose | Notes |
| ----------- | ------- | ----- |
| Gemini API (gemini-2.5-pro) | Fetch cancel URL + instructions via web search | Prompt is deterministic JSON-constrained; parse with `json_decode` |
| Mock payment gateway | N/A | |
| Other | N/A | |

---

## 8. Mock and assumption box (hackathon)

- **Sandbox assumptions:** Reference: [Salam Hack 2026 Sandbox Assumptions](https://raw.githubusercontent.com/tariqlabs/salamhack-resources/refs/heads/main/2026/assumptions.md).
- **Demo reliability:** For demo day, seed Figma Pro (and 1–2 other known services) with pre-populated `cancel_instructions` so the cancel slide-over shows instructions instantly without depending on a live Gemini call. Reserve the live AI fetch for one card (e.g. "Notion") to demonstrate the real-time capability.
- **Prompt robustness:** Always constrain Gemini response to JSON-only. Wrap `json_decode` in a try/catch — if parsing fails, treat as a low-confidence result and show a graceful fallback.
- **Timeout:** Set a 15-second timeout on the Gemini HTTP call for hackathon; if exceeded, show the error state (A1 above).

---

## 9. Acceptance criteria (testable)

- [ ] Given an expense card with no `cancel_instructions`, when the user clicks "Get cancel instructions →" in the slide-over, then a loading spinner appears inside the panel
- [ ] Given the Gemini API returns a valid JSON result, then `cancel_url` and `cancel_instructions` are persisted to the expense card in the DB
- [ ] Given the result is persisted, when the user opens the cancel panel again (or another user session), then instructions are served from DB immediately with no API call
- [ ] Given instructions are displayed, then the cancel URL is shown as a clickable external link, steps as a numbered list, and notes in an amber info box
- [ ] Given a `high` confidence result, then a green "High confidence" badge is shown; `low` shows red badge with a caution note
- [ ] Given the Gemini API times out, then a friendly error message appears in the panel and the expense card is not modified
- [ ] Given `cancel_instructions` already exist, when the "Refresh" link is clicked, then a new Gemini call is made and the result replaces the old instructions
- [ ] Given an unauthenticated request, then `401` is returned
- [ ] Given a request for another user's card, then `403` is returned

---

## 10. Scope boundaries

### In scope

- On-demand AI fetch of cancel URL, steps, and notes via Gemini API
- Auto-save to expense card on success (no user action required)
- Inline loading state and error/fallback states within the cancel slide-over
- Confidence badge display
- "Refresh" link to re-fetch outdated instructions

### Out of scope (this use case only)

- Cancel slide-over UI and status update (owned by `UC-007`)
- Renewal alerts (`UC-011`)
- "Dead tool" detector (post-MVP)
- Cheaper plan suggestions (mentioned in PRD — not in MVP scope for this UC)

---

## 11. Demo script snippet

1. Open the cancel slide-over for a card that has **no** pre-seeded instructions (e.g. "Notion").
2. Click **"Get cancel instructions →"** — show the inline spinner.
3. After 2–4 seconds: instructions populate the panel (Gemini result).
4. Show: cancel URL link, numbered steps, amber notes box, confidence badge.
5. Click the cancel URL to demonstrate it opens the correct page.
6. Close and re-open the panel — instructions are served instantly from DB (no re-fetch).

---

## 12. Decisions (resolved)

| Topic | Decision |
|-------|----------|
| Loading UX | Inline spinner inside the open panel — no panel close/reopen cycle |
| Auto-save timing | Save immediately on successful Gemini response — not gated on user confirming cancellation |
| Re-fetch mechanism | "Refresh" link on already-populated panel — explicit user action to avoid overwriting good data |
| Prompt format | JSON-constrained output only; `json_decode` on server; graceful fallback if parsing fails |
| Confidence display | Show badge to set user expectations — low confidence = still usable, but user should verify |
| Demo reliability | Pre-seed instructions for 2 cards; demo live fetch on 1 card to prove real-time capability |
