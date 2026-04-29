<?php

namespace Tests\Feature;

use App\Models\PaymentLink;
use App\Models\PaymentTransaction;
use App\Models\User;
use App\Notifications\PaymentReceivedNotification;
use App\Services\PaymobService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PaymobPaymentFlowTest extends TestCase
{
    use RefreshDatabase;

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private function makeFreelancer(): User
    {
        return User::factory()->create(['email' => 'freelancer@example.com']);
    }

    private function makeLink(User $user, string $status = 'pending'): PaymentLink
    {
        return PaymentLink::create([
            'user_id' => $user->id,
            'public_token' => Str::lower(Str::ulid()->toBase32()),
            'amount' => '500.00',
            'tax_rate' => '14.00',
            'tax_amount' => '70.00',
            'total_amount' => '570.00',
            'currency' => 'EGP',
            'description' => 'خدمة تصميم',
            'client_name' => 'أحمد سالم',
            'client_email' => 'client@example.com',
            'status' => $status,
            'mock_gateway_reference' => 'mock_'.Str::upper(Str::random(12)),
            'mock_provider' => 'mock-sandbox',
            'source' => 'manual',
        ]);
    }

    private function makeTransaction(PaymentLink $link, string $status = 'pending', string $orderId = 'ORD-001'): PaymentTransaction
    {
        return PaymentTransaction::create([
            'payment_link_id' => $link->id,
            'user_id' => $link->user_id,
            'paymob_order_id' => $orderId,
            'amount_cents' => 57000,
            'currency' => 'EGP',
            'status' => $status,
        ]);
    }

    private function buildWebhookPayload(string $orderId, bool $success, string $txnId = 'TXN-001'): array
    {
        return [
            'obj' => [
                'id' => $txnId,
                'success' => $success,
                'order' => ['id' => $orderId],
                'amount_cents' => 57000,
                'currency' => 'EGP',
                'created_at' => now()->toIso8601String(),
                'error_occured' => false,
                'has_parent_transaction' => false,
                'integration_id' => 99999,
                'is_3d_secure' => false,
                'is_auth' => false,
                'is_capture' => false,
                'is_refunded' => false,
                'is_standalone_payment' => true,
                'is_voided' => false,
                'owner' => 1,
                'pending' => false,
                'source_data' => ['pan' => '1234', 'sub_type' => 'VISA', 'type' => 'card'],
                'data' => ['message' => 'Do not honor'],
            ],
        ];
    }

    // ─── Tests ────────────────────────────────────────────────────────────────

    public function test_guest_can_view_pending_payment_link(): void
    {
        $freelancer = $this->makeFreelancer();
        $link = $this->makeLink($freelancer);

        $response = $this->get(route('pay.show', $link->public_token));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('pay/show')
            ->where('paymentLink.state', 'pending')
        );
    }

    public function test_guest_sees_paid_state_when_link_already_paid(): void
    {
        $freelancer = $this->makeFreelancer();
        $link = $this->makeLink($freelancer, 'paid');

        $response = $this->get(route('pay.show', $link->public_token));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('pay/show')
            ->where('paymentLink.state', 'paid')
        );
    }

    public function test_initiate_creates_pending_transaction_and_redirects_to_paymob(): void
    {
        $freelancer = $this->makeFreelancer();
        $link = $this->makeLink($freelancer);

        $this->mock(PaymobService::class, function ($mock) {
            $mock->shouldReceive('authenticate')->once()->andReturn('auth-token');
            $mock->shouldReceive('createOrder')->once()->andReturn('PAYMOB-ORDER-999');
            $mock->shouldReceive('getPaymentKey')->once()->andReturn('payment-key-abc');
            $mock->shouldReceive('buildIframeUrl')->once()->andReturn('https://accept.paymob.com/api/acceptance/iframes/123?payment_token=payment-key-abc');
        });

        $response = $this->post(route('pay.initiate', $link->public_token));

        $response->assertRedirect('https://accept.paymob.com/api/acceptance/iframes/123?payment_token=payment-key-abc');

        $this->assertDatabaseHas('payment_transactions', [
            'payment_link_id' => $link->id,
            'user_id' => $freelancer->id,
            'paymob_order_id' => 'PAYMOB-ORDER-999',
            'status' => 'pending',
        ]);
    }

    public function test_initiate_does_not_create_transaction_on_paymob_api_failure(): void
    {
        $freelancer = $this->makeFreelancer();
        $link = $this->makeLink($freelancer);

        $this->mock(PaymobService::class, function ($mock) {
            $mock->shouldReceive('authenticate')->once()->andThrow(new \RuntimeException('auth failed'));
        });

        $response = $this->post(route('pay.initiate', $link->public_token));

        $response->assertRedirect(route('pay.show', $link->public_token));
        $this->assertDatabaseCount('payment_transactions', 0);
    }

    public function test_callback_redirects_to_pay_page_with_pending_state(): void
    {
        $freelancer = $this->makeFreelancer();
        $link = $this->makeLink($freelancer);
        $transaction = $this->makeTransaction($link, 'pending', 'ORD-CALLBACK');

        $response = $this->get(route('pay.callback', ['order' => 'ORD-CALLBACK']));

        $response->assertRedirect(route('pay.show', $link->public_token));
    }

    public function test_callback_does_not_update_database(): void
    {
        $freelancer = $this->makeFreelancer();
        $link = $this->makeLink($freelancer);
        $this->makeTransaction($link, 'pending', 'ORD-NOCHANGE');

        $this->get(route('pay.callback', ['order' => 'ORD-NOCHANGE', 'success' => '1']));

        $this->assertDatabaseHas('payment_transactions', [
            'paymob_order_id' => 'ORD-NOCHANGE',
            'status' => 'pending',
        ]);
    }

    public function test_webhook_with_invalid_hmac_returns_401(): void
    {
        $this->mock(PaymobService::class, function ($mock) {
            $mock->shouldReceive('verifyHmac')->once()->andReturn(false);
        });

        $response = $this->postJson(route('webhook.paymob').'?hmac=badhmacsignature', []);

        $response->assertStatus(401);
    }

    public function test_webhook_success_marks_transaction_paid_and_increments_wallet(): void
    {
        Notification::fake();

        $freelancer = $this->makeFreelancer();
        $link = $this->makeLink($freelancer);
        $transaction = $this->makeTransaction($link, 'pending', 'ORD-SUCCESS');

        $this->mock(PaymobService::class, function ($mock) {
            $mock->shouldReceive('verifyHmac')->once()->andReturn(true);
        });

        $payload = $this->buildWebhookPayload('ORD-SUCCESS', true, 'TXN-001');
        $response = $this->postJson(route('webhook.paymob').'?hmac=validhmac', $payload);

        $response->assertOk();
        $response->assertJson(['status' => 'ok']);

        $this->assertDatabaseHas('payment_transactions', [
            'paymob_order_id' => 'ORD-SUCCESS',
            'status' => 'paid',
            'paymob_transaction_id' => 'TXN-001',
            'hmac_verified' => true,
        ]);

        $this->assertDatabaseHas('payment_links', [
            'id' => $link->id,
            'status' => 'paid',
        ]);

        $this->assertDatabaseHas('user_wallets', [
            'user_id' => $freelancer->id,
            'currency' => 'EGP',
            'balance_cents' => 57000,
        ]);

        Notification::assertSentTo($freelancer, PaymentReceivedNotification::class);
    }

    public function test_webhook_success_is_idempotent_for_already_paid_transaction(): void
    {
        Notification::fake();

        $freelancer = $this->makeFreelancer();
        $link = $this->makeLink($freelancer, 'paid');
        $transaction = $this->makeTransaction($link, 'paid', 'ORD-DUPE');

        $this->mock(PaymobService::class, function ($mock) {
            $mock->shouldReceive('verifyHmac')->once()->andReturn(true);
        });

        $payload = $this->buildWebhookPayload('ORD-DUPE', true, 'TXN-DUPE');
        $response = $this->postJson(route('webhook.paymob').'?hmac=validhmac', $payload);

        $response->assertOk();
        $response->assertJson(['status' => 'already processed']);

        Notification::assertNothingSent();
    }

    public function test_webhook_failure_marks_transaction_failed_and_keeps_link_pending(): void
    {
        Notification::fake();

        $freelancer = $this->makeFreelancer();
        $link = $this->makeLink($freelancer);
        $transaction = $this->makeTransaction($link, 'pending', 'ORD-FAIL');

        $this->mock(PaymobService::class, function ($mock) {
            $mock->shouldReceive('verifyHmac')->once()->andReturn(true);
        });

        $payload = $this->buildWebhookPayload('ORD-FAIL', false, 'TXN-FAIL');
        $response = $this->postJson(route('webhook.paymob').'?hmac=validhmac', $payload);

        $response->assertOk();
        $response->assertJson(['status' => 'ok']);

        $this->assertDatabaseHas('payment_transactions', [
            'paymob_order_id' => 'ORD-FAIL',
            'status' => 'failed',
            'failure_reason' => 'Do not honor',
            'hmac_verified' => true,
        ]);

        $this->assertDatabaseHas('payment_links', [
            'id' => $link->id,
            'status' => 'pending',
        ]);

        $this->assertDatabaseCount('user_wallets', 0);
        Notification::assertNothingSent();
    }
}
