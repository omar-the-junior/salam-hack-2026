<?php

namespace Tests\Feature;

use App\Models\Contract;
use App\Models\PaymentLink;
use App\Models\PaymentTransaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Tests\TestCase;

class ControllerExceptionLoggingTest extends TestCase
{
    use RefreshDatabase;

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private function makeFreelancer(): User
    {
        return User::factory()->create(['email' => 'freelancer@example.com']);
    }

    private function makePaymentLink(User $user): PaymentLink
    {
        $contract = Contract::create([
            'user_id' => $user->id,
            'contract_token' => (string) Str::uuid(),
            'project_name' => 'Test Project',
            'description' => null,
            'client_name' => 'Test Client',
            'client_email' => 'client@example.com',
            'total_value' => 1000,
            'tax_rate' => 0,
            'tax_amount' => 0,
            'grand_total' => 1000,
            'currency' => 'EGP',
            'start_date' => null,
            'end_date' => null,
            'terms' => null,
            'status' => 'draft',
        ]);

        $milestone = $contract->milestones()->create([
            'title' => 'Milestone 1',
            'percentage' => 100,
            'amount' => 1000,
            'due_date' => null,
            'status' => 'pending',
        ]);

        return PaymentLink::create([
            'user_id' => $user->id,
            'milestone_id' => $milestone->id,
            'public_token' => Str::lower(Str::ulid()->toBase32()),
            'amount' => '1000.00',
            'tax_rate' => '0.00',
            'tax_amount' => '0.00',
            'total_amount' => '1000.00',
            'currency' => 'EGP',
            'description' => 'Test',
            'client_name' => 'Test Client',
            'client_email' => 'client@example.com',
            'status' => 'pending',
            'mock_gateway_reference' => 'mock_'.Str::upper(Str::random(12)),
            'mock_provider' => 'mock-sandbox',
            'source' => 'manual',
        ]);
    }

    private function buildSuccessPayload(string $orderId, string $txnId = 'TXN-001'): array
    {
        return [
            'obj' => [
                'id' => $txnId,
                'success' => true,
                'order' => ['id' => $orderId],
                'amount_cents' => 100000,
                'currency' => 'EGP',
                'source_data' => ['pan' => '1234', 'sub_type' => 'VISA', 'type' => 'card'],
                'data' => [],
            ],
        ];
    }

    // ─── Webhook notification logging tests ──────────────────────────────────

    public function test_webhook_payment_succeeds_even_when_notifications_table_is_missing(): void
    {
        $this->withoutMiddleware();

        Log::spy();

        $freelancer = $this->makeFreelancer();
        $link = $this->makePaymentLink($freelancer);

        PaymentTransaction::create([
            'payment_link_id' => $link->id,
            'user_id' => $freelancer->id,
            'paymob_order_id' => 'ORD-NOTIF-MISSING',
            'amount_cents' => 100000,
            'currency' => 'EGP',
            'status' => 'pending',
        ]);

        Schema::dropIfExists('notifications');

        $response = $this->postJson(
            route('webhook.paymob').'?hmac=validhmac',
            $this->buildSuccessPayload('ORD-NOTIF-MISSING', 'TXN-NOTIF-MISSING')
        );

        // Payment must succeed despite the missing notifications table
        $response->assertOk();
        $response->assertJson(['status' => 'ok']);

        $this->assertDatabaseHas('payment_transactions', [
            'paymob_order_id' => 'ORD-NOTIF-MISSING',
            'status' => 'paid',
        ]);

        // The notification failure must be logged with identifying context
        Log::shouldHaveReceived('error')
            ->withArgs(function (string $message, array $context): bool {
                return str_contains($message, 'notification failed')
                    && isset($context['payment_transaction_id'])
                    && isset($context['notification_target_user_id']);
            });
    }

    // ─── General controller exception logging tests ───────────────────────────

    public function test_controller_exception_is_logged_before_being_rethrown(): void
    {
        Log::spy();

        $authenticatedUser = User::factory()->create(['email' => 'auth@example.com']);

        // Drop the customers table so CustomerController@index throws a DB exception
        Schema::dropIfExists('customers');

        $response = $this->actingAs($authenticatedUser)->get(route('customers.index'));

        // Laravel's exception handler converts the rethrown exception to a 500
        $response->assertStatus(500);

        // The exception must have been logged with controller context
        Log::shouldHaveReceived('error')
            ->withArgs(function (string $message, array $context): bool {
                return str_contains($message, 'CustomerController@index')
                    && isset($context['user_id'])
                    && isset($context['exception'])
                    && isset($context['message']);
            });
    }

    public function test_mark_all_read_is_a_no_op_when_notifications_table_is_missing(): void
    {
        $this->withoutMiddleware();

        $user = User::factory()->create();

        Schema::dropIfExists('notifications');

        $response = $this->actingAs($user)->patch(route('notifications.read-all'));

        // Should redirect back safely — no 500
        $response->assertRedirect();
    }

    public function test_mark_single_read_is_a_no_op_when_notifications_table_is_missing(): void
    {
        $this->withoutMiddleware();

        $user = User::factory()->create();

        Schema::dropIfExists('notifications');

        $response = $this->actingAs($user)->patch(route('notifications.read', Str::uuid()));

        // Should redirect back safely — no 500
        $response->assertRedirect();
    }
}
