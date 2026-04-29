# UC-014 — Paymob credit card payment on public payment link

---

## 1. Header

| Field          | Value                                      |
| -------------- | ------------------------------------------ |
| Use case ID    | `UC-003`                                   |
| Title          | Paymob credit card checkout (public link)  |
| Status         | Draft                                      |
| Priority       | P0                                         |
| Owner          | TBD                                        |
| Last updated   | 2026-04-29                                 |
| Depends on     | `UC-002` — payment link must exist         |

---

## 2. Summary

An **unauthenticated client (payer)** opens a public payment URL
(`/pay/{public_token}`), reviews the amount and description, and clicks
**Pay Now**. The system runs a three-step Paymob API flow to obtain a
payment key, redirects the client to the **Paymob hosted iframe** for
card entry, then receives a **signed webhook** from Paymob confirming the
outcome. On success the `payment_transactions` row is marked `paid` and
the parent `payment_links` row is marked `paid`. The freelancer (owner)
sees the updated status on their dashboard.

The client never authenticates against the Laravel application. The
payment link is already owned by a `users` row (the freelancer) via
`payment_links.user_id`.

---

## 3. Actors and context

### Primary actor

**Client (payer)** — unauthenticated. Identified only by possession of
the public token URL.

### Secondary actors

| Actor           | Role                                                              |
| --------------- | ----------------------------------------------------------------- |
| **Freelancer**  | Created the link (`UC-002`); observes status change on dashboard. |
| **Laravel app** | Orchestrates Paymob API calls; processes webhook.                 |
| **Paymob API**  | Authenticates, creates order, issues payment key, sends webhook.  |

### Preconditions

- [ ] `payment_links` row exists with `status = pending` and a valid `public_token`
- [ ] Paymob credentials (`PAYMOB_API_KEY`, `PAYMOB_INTEGRATION_ID`,
  `PAYMOB_IFRAME_ID`, `PAYMOB_HMAC_SECRET`) are set in `.env`
- [ ] `payment_transactions` migration has been run

### Postconditions (success)

- [ ] One `payment_transactions` row exists with `status = paid`,
  `paymob_transaction_id` set, and `hmac_verified = true`
- [ ] `payment_links.status` updated to `paid`
- [ ] Client sees a success confirmation page
- [ ] Freelancer dashboard reflects `paid` status

### Postconditions (failure)

- [ ] `payment_transactions` row exists with `status = failed` and
  `failure_reason` populated
- [ ] `payment_links.status` remains `pending`
- [ ] Client sees a failure page with a retry option

---

## 4. Actors clarification — no client auth

The client is **not** a registered user. There is no session, no login,
no `auth()->id()` in any public route. The only identity signal is the
`public_token` in the URL, which resolves the correct `payment_links`
row and its `user_id` (the freelancer).

`payment_transactions.user_id` is copied from
`payment_links.user_id` at insert time — it refers to the **freelancer**
who owns the link, not the payer.

---

## 5. Flow — happy path

### Step 1 — Client opens pay page

```
GET /pay/{public_token}
```

- Resolve `payment_links` by `public_token` only (no `user_id` guard).
- If not found → `404`.
- If `status = paid` → render **already paid** page, stop.
- If `status = cancelled` or link is past `due_date` → render **expired** page, stop.
- Otherwise → render `PaymentLinks/Pay` Inertia page with:
  - `amount`, `tax_rate`, `tax_amount`, `total_amount`, `currency`
  - `description`, `client_name`, `due_date`
  - No freelancer PII exposed to the client.

### Step 2 — Client clicks Pay Now

```
POST /payment/initiate/{public_token}
```

- Re-resolve the link (guard: still `pending`).
- Call `PaymobService`:
  1. `authenticate()` → `auth_token`
  2. `createOrder(auth_token, amount_cents, currency)` → `paymob_order_id`
  3. `getPaymentKey(auth_token, paymob_order_id, billing_data)` → `payment_key`
- Insert `payment_transactions` row with `status = pending`.
- Return redirect to `PaymobService::buildIframeUrl(payment_key)`.

### Step 3 — Client completes card entry on Paymob iframe

Paymob hosts the card form. Laravel is not involved during card entry.

### Step 4 — Paymob fires webhook (async, server-to-server)

```
POST /webhook/paymob
```

- `VerifyPaymobWebhook` middleware validates HMAC before controller runs.
- Resolve `payment_transactions` by `paymob_order_id`
  (`obj.order.id` in payload).
- If `obj.success === true`:
  - Update `payment_transactions`: `status = paid`, `paid_at = now()`,
    `paymob_transaction_id`, `card_last_four`, `card_brand`,
    `gateway_response`, `hmac_verified = true`.
  - Update `payment_links.status = paid`.
- If `obj.success === false`:
  - Update `payment_transactions`: `status = failed`, `failure_reason`,
    `gateway_response`, `hmac_verified = true`.
- Return `200 OK` (Paymob retries on non-200).

### Step 5 — Paymob redirects client to callback URL

```
GET /payment/callback
```

- Read query params: `success`, `txn_response_code`, `id` (Paymob txn id).
- Do **not** update any status here — webhook is the source of truth.
- Resolve `payment_transactions` by `paymob_transaction_id` (from `id` param).
- Render success or failure page based on current DB status, not URL params.

---

## 6. Routes

```php
// routes/web.php

// Public — no auth middleware
Route::get('/pay/{token}', [PaymobController::class, 'show'])
    ->name('pay.show');

Route::post('/payment/initiate/{token}', [PaymobController::class, 'initiate'])
    ->name('pay.initiate');

Route::get('/payment/callback', [PaymobController::class, 'callback'])
    ->name('pay.callback');

// Webhook — HMAC middleware replaces auth
Route::post('/webhook/paymob', [PaymobController::class, 'webhook'])
    ->middleware(VerifyPaymobWebhook::class)
    ->withoutMiddleware([\App\Http\Middleware\VerifyCsrfToken::class])
    ->name('webhook.paymob');
```

> The webhook route must be excluded from CSRF verification because
> Paymob posts without a CSRF token. Add it to
> `$except` in `VerifyCsrfToken` **or** use the `withoutMiddleware` call
> above.

---

## 7. Controller — `PaymobController`

**Namespace:** `App\Http\Controllers\Payment\PaymobController`

### `show(string $token): Response`

```
Resolves payment link by public_token.
Guards: not found → 404, paid → already-paid page, expired → expired page.
Returns Inertia render with safe link fields only.
No auth. No user_id check.
```

**Inertia props to pass:**
- `amount`, `tax_rate`, `tax_amount`, `total_amount`, `currency`
- `description`, `due_date`
- `initiate_url` → `route('pay.initiate', $token)`

**Do not pass:** `user_id`, `client_email`, `mock_gateway_reference`.

---

### `initiate(string $token): RedirectResponse`

```
1. Re-resolve payment link (status must still be pending).
2. Call PaymobService — 3 sequential API calls.
3. Insert payment_transactions row (status = pending).
4. Redirect to Paymob iframe URL.
```

**On any Paymob API failure:** catch exception, return back with error
message. Do not leave a dangling `pending` transaction if the payment key
was never issued — only insert the row after all three calls succeed.

**Amount conversion:**
```php
$amountCents = (int) round($link->total_amount * 100);
```

**Billing data to send to Paymob** (required fields, use placeholder
values since the client is unauthenticated):
```php
$billingData = [
    'first_name'    => $link->client_name ?? 'Client',
    'last_name'     => '.',
    'email'         => $link->client_email ?? 'client@placeholder.com',
    'phone_number'  => '+201000000000',
    'apartment'     => 'NA',
    'floor'         => 'NA',
    'street'        => 'NA',
    'building'      => 'NA',
    'shipping_method' => 'NA',
    'postal_code'   => 'NA',
    'city'          => 'NA',
    'country'       => 'EG',
    'state'         => 'NA',
];
```

---

### `webhook(Request $request): JsonResponse`

```
HMAC already verified by middleware.
Resolve payment_transactions by paymob_order_id.
Wrap DB update in a transaction.
Return 200 always — even on business logic errors — to prevent Paymob retries
on non-recoverable cases. Log errors internally.
```

**Idempotency guard:**
```php
if ($transaction->status === 'paid') {
    return response()->json(['status' => 'already processed'], 200);
}
```

**Fields to extract from payload:**

| Payload path                  | Column                          |
| ----------------------------- | ------------------------------- |
| `obj.id`                      | `paymob_transaction_id`         |
| `obj.success`                 | determines `status`             |
| `obj.source_data.pan`         | `card_last_four`                |
| `obj.source_data.sub_type`    | `card_brand`                    |
| `obj.data.message`            | `failure_reason` (on failure)   |
| full `$request->all()`        | `gateway_response` (json)       |

---

### `callback(Request $request): Response`

```
Read: ?success=1&id={paymob_txn_id}&txn_response_code=APPROVED
Do NOT update DB here.
Resolve transaction by paymob_transaction_id from query param.
Render page based on transaction.status from DB.
```

If `id` param is missing or transaction not found → render generic
"payment received, please wait" page. The webhook will have already or
will soon update the status.

---

## 8. Service — `PaymobService`

**Namespace:** `App\Services\PaymobService`

All HTTP calls use Laravel's `Http` facade with a timeout and retry.

### Constructor / config

```php
public function __construct(
    private string $apiKey       = '',
    private string $integrationId = '',
    private string $iframeId     = '',
    private string $hmacSecret   = '',
) {
    $this->apiKey        = config('services.paymob.api_key');
    $this->integrationId = config('services.paymob.integration_id');
    $this->iframeId      = config('services.paymob.iframe_id');
    $this->hmacSecret    = config('services.paymob.hmac_secret');
}
```

Add to `config/services.php`:
```php
'paymob' => [
    'api_key'        => env('PAYMOB_API_KEY'),
    'integration_id' => env('PAYMOB_INTEGRATION_ID'),
    'iframe_id'      => env('PAYMOB_IFRAME_ID'),
    'hmac_secret'    => env('PAYMOB_HMAC_SECRET'),
],
```

---

### `authenticate(): string`

```
POST https://accept.paymob.com/api/auth/tokens
Body: { "api_key": $this->apiKey }
Returns: response.token
Throws: RuntimeException on failure.
```

---

### `createOrder(string $authToken, int $amountCents, string $currency): string`

```
POST https://accept.paymob.com/api/ecommerce/orders
Body:
{
  "auth_token": $authToken,
  "delivery_needed": false,
  "amount_cents": $amountCents,
  "currency": $currency,
  "items": []
}
Returns: response.id (paymob_order_id, cast to string)
```

---

### `getPaymentKey(string $authToken, string $orderId, int $amountCents, string $currency, array $billingData): string`

```
POST https://accept.paymob.com/api/acceptance/payment_keys
Body:
{
  "auth_token": $authToken,
  "amount_cents": $amountCents,
  "expiration": 3600,
  "order_id": $orderId,
  "billing_data": $billingData,
  "currency": $currency,
  "integration_id": $this->integrationId
}
Returns: response.token (the payment_key)
```

---

### `buildIframeUrl(string $paymentKey): string`

```php
return "https://accept.paymob.com/api/acceptance/iframes/{$this->iframeId}?payment_token={$paymentKey}";
```

---

### `verifyHmac(array $payload, string $receivedHmac): bool`

Paymob HMAC is computed from a specific set of fields concatenated in a
fixed order. The exact field order from Paymob docs:

```php
$fields = [
    'amount_cents'      => $payload['obj']['amount_cents'] ?? '',
    'created_at'        => $payload['obj']['created_at'] ?? '',
    'currency'          => $payload['obj']['currency'] ?? '',
    'error_occured'     => $payload['obj']['error_occured'] ?? '',
    'has_parent_transaction' => $payload['obj']['has_parent_transaction'] ?? '',
    'id'                => $payload['obj']['id'] ?? '',
    'integration_id'    => $payload['obj']['integration_id'] ?? '',
    'is_3d_secure'      => $payload['obj']['is_3d_secure'] ?? '',
    'is_auth'           => $payload['obj']['is_auth'] ?? '',
    'is_capture'        => $payload['obj']['is_capture'] ?? '',
    'is_refunded'       => $payload['obj']['is_refunded'] ?? '',
    'is_standalone_payment' => $payload['obj']['is_standalone_payment'] ?? '',
    'is_voided'         => $payload['obj']['is_voided'] ?? '',
    'order'             => $payload['obj']['order']['id'] ?? '',
    'owner'             => $payload['obj']['owner'] ?? '',
    'pending'           => $payload['obj']['pending'] ?? '',
    'source_data_pan'       => $payload['obj']['source_data']['pan'] ?? '',
    'source_data_sub_type'  => $payload['obj']['source_data']['sub_type'] ?? '',
    'source_data_type'      => $payload['obj']['source_data']['type'] ?? '',
    'success'           => $payload['obj']['success'] ?? '',
];

$concatenated = implode('', array_values($fields));
$computed = hash_hmac('sha512', $concatenated, $this->hmacSecret);

return hash_equals($computed, $receivedHmac);
```

> Boolean fields must be cast to lowercase string: `true → 'true'`,
> `false → 'false'`. Paymob sends them as JSON booleans; convert before
> concatenation.

---

## 9. Middleware — `VerifyPaymobWebhook`

**Namespace:** `App\Http\Middleware\VerifyPaymobWebhook`

```
1. Extract hmac from request query param: ?hmac={value}
2. Get full request payload as array.
3. Call PaymobService::verifyHmac($payload, $hmac).
4. If invalid → return 401 and log the attempt.
5. If valid → pass to next.
```

```php
public function handle(Request $request, Closure $next): Response
{
    $hmac = $request->query('hmac', '');

    if (! $hmac || ! app(PaymobService::class)->verifyHmac($request->all(), $hmac)) {
        Log::warning('PaymobWebhook: invalid HMAC', ['ip' => $request->ip()]);
        return response('Unauthorized', 401);
    }

    return $next($request);
}
```

---

## 10. Database — `payment_transactions`

### Migration

```php
Schema::create('payment_transactions', function (Blueprint $table) {
    $table->id();

    $table->foreignId('payment_link_id')
          ->constrained('payment_links')
          ->cascadeOnDelete();

    // user_id = freelancer who owns the link, not the payer
    $table->foreignId('user_id')
          ->constrained('users');

    // Paymob references
    $table->string('paymob_order_id')->nullable()->index();
    $table->string('paymob_transaction_id')->nullable()->unique()->index();

    // Money — integer cents (piastres for EGP)
    $table->unsignedBigInteger('amount_cents');
    $table->char('currency', 3); // EGP | USD

    // Status: pending | paid | failed
    $table->string('status', 20)->default('pending')->index();

    // Card detail (from webhook, safe to store)
    $table->string('payment_method', 30)->default('card');
    $table->string('card_last_four', 4)->nullable();
    $table->string('card_brand', 20)->nullable();

    // Audit
    $table->json('gateway_response')->nullable();
    $table->string('failure_reason')->nullable();
    $table->boolean('hmac_verified')->default(false);
    $table->timestamp('paid_at')->nullable();

    $table->timestamps();
});
```

### Column reference

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | `bigint PK` | no | Auto-increment. |
| `payment_link_id` | `bigint FK` | no | Parent link. One link → many transaction attempts. |
| `user_id` | `bigint FK` | no | The **freelancer**, copied from `payment_links.user_id`. Not the payer. |
| `paymob_order_id` | `string` | yes | Set after step 2 (create order). Used to match incoming webhooks. |
| `paymob_transaction_id` | `string, unique` | yes | Set from webhook `obj.id`. Null until webhook fires. Unique to prevent duplicate processing. |
| `amount_cents` | `bigint unsigned` | no | `total_amount × 100`. Paymob requires integer. |
| `currency` | `char(3)` | no | `EGP` or `USD`. |
| `status` | `string(20)` | no | `pending → paid` or `pending → failed`. Only webhook may set `paid`. |
| `payment_method` | `string(30)` | no | `card` for MVP. |
| `card_last_four` | `string(4)` | yes | From `obj.source_data.pan`. |
| `card_brand` | `string(20)` | yes | From `obj.source_data.sub_type`. `VISA`, `MasterCard`, etc. |
| `gateway_response` | `json` | yes | Full raw webhook payload. Never trimmed. |
| `failure_reason` | `string` | yes | From `obj.data.message` on failure. |
| `hmac_verified` | `boolean` | no | `true` only if HMAC passed in middleware. |
| `paid_at` | `timestamp` | yes | Set in the same DB transaction as `status = paid`. |

---

## 11. Model — `PaymentTransaction`

```php
class PaymentTransaction extends Model
{
    protected $fillable = [
        'payment_link_id', 'user_id',
        'paymob_order_id', 'paymob_transaction_id',
        'amount_cents', 'currency',
        'status', 'payment_method',
        'card_last_four', 'card_brand',
        'gateway_response', 'failure_reason',
        'hmac_verified', 'paid_at',
    ];

    protected $casts = [
        'gateway_response' => 'array',
        'hmac_verified'    => 'boolean',
        'paid_at'          => 'datetime',
    ];

    public function paymentLink(): BelongsTo
    {
        return $this->belongsTo(PaymentLink::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isPaid(): bool
    {
        return $this->status === 'paid';
    }
}
```

---

## 12. Error handling matrix

| Scenario | Where caught | Behavior |
|---|---|---|
| `public_token` not found | `show()` | 404 response |
| Link already paid | `show()` | Render "already paid" page |
| Link past due date | `show()` | Render "expired" page |
| Paymob auth fails | `initiate()` | Back with flash error, no DB row |
| Paymob order creation fails | `initiate()` | Back with flash error, no DB row |
| Payment key request fails | `initiate()` | Back with flash error, no DB row |
| HMAC mismatch on webhook | Middleware | 401, logged, request blocked |
| Duplicate webhook delivery | `webhook()` | Idempotency check, 200 returned silently |
| DB error during webhook update | `webhook()` | 500 logged, Paymob retries |
| `callback` with unknown txn id | `callback()` | Render "pending" page |

---

## 13. `.env` variables required

```env
PAYMOB_API_KEY=
PAYMOB_INTEGRATION_ID=
PAYMOB_IFRAME_ID=
PAYMOB_HMAC_SECRET=
```

---

## 14. Acceptance criteria

- [ ] Client can open `/pay/{token}` without being logged in
- [ ] Clicking Pay Now redirects to the Paymob iframe
- [ ] A `payment_transactions` row with `status = pending` exists before the redirect
- [ ] Successful payment: webhook sets `status = paid`, `paid_at` is set, `payment_links.status = paid`
- [ ] Failed payment: webhook sets `status = failed`, `failure_reason` is populated
- [ ] A webhook with an invalid HMAC returns `401` and is logged
- [ ] A duplicate webhook for an already-paid transaction returns `200` without altering the row
- [ ] The callback page reads status from DB, not from URL params
- [ ] No `auth()->id()` call exists anywhere in the public payment flow

---

## 15. Out of scope (defer)

- Client account creation / registration
- Paymob refund API integration
- Payment reminders / due date notifications
- Multi-method checkout (mobile wallets, Fawaterk)
- Income auto-logging on paid (separate UC)