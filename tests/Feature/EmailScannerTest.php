<?php

namespace Tests\Feature;

use App\Ai\Agents\EmailSubscriptionParserAgent;
use App\Models\ConnectedAccount;
use App\Models\EmailScan;
use App\Models\EmailScanResult;
use App\Models\User;
use App\Services\Email\EmailParserService;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Laravel\Ai\Responses\AgentResponse;
use Laravel\Ai\Responses\Data\Meta;
use Laravel\Ai\Responses\Data\Usage;
use Tests\TestCase;

class EmailScannerTest extends TestCase
{
    use RefreshDatabase;

    // ─── Helpers ─────────────────────────────────────────────────────

    private function fakeAgentResponse(string $json): AgentResponse
    {
        return new AgentResponse('fake-invocation', $json, new Usage, new Meta);
    }

    private function mockAgent(string $responseJson): void
    {
        $mock = $this->mock(EmailSubscriptionParserAgent::class);
        $mock->shouldReceive('prompt')
            ->andReturn($this->fakeAgentResponse($responseJson));
    }

    // ─── EmailParserService unit-level tests ─────────────────────────

    public function test_parser_skips_email_not_matching_candidate_heuristics(): void
    {
        $service = app(EmailParserService::class);

        $email = [
            'id' => 'msg-001',
            'subject' => 'Welcome to our newsletter!',
            'from' => 'noreply@randomnews.xyz',
            'date' => '2026-04-01',
            'snippet' => 'Top stories this week',
            'body' => 'Check out the latest articles.',
        ];

        $result = $service->parse($email);

        $this->assertNull($result);
    }

    public function test_parser_calls_ai_and_skips_non_subscription_response(): void
    {
        $this->mockAgent('{"is_subscription":false,"service_name":null,"amount":null,"currency":null,"billing_cycle":"unknown","billing_date":null,"confidence":"low"}');

        $email = [
            'id' => 'msg-002',
            'subject' => 'Your Figma invoice',
            'from' => 'billing@figma.com',
            'date' => '2026-04-10',
            'snippet' => 'Your invoice is ready',
            'body' => 'Invoice #1234 for $15.00',
        ];

        $result = app(EmailParserService::class)->parse($email);

        $this->assertNull($result);
    }

    public function test_parser_returns_structured_data_for_valid_ai_response(): void
    {
        $this->mockAgent('{"is_subscription":true,"service_name":"Figma","amount":15.00,"currency":"USD","billing_cycle":"monthly","billing_date":"2026-04-10","confidence":"high"}');

        $email = [
            'id' => 'msg-003',
            'subject' => 'Your Figma subscription receipt',
            'from' => 'billing@figma.com',
            'date' => '2026-04-10',
            'snippet' => 'Thanks for your payment of $15.00',
            'body' => 'Your Figma monthly plan was charged $15.00 on Apr 10.',
        ];

        $result = app(EmailParserService::class)->parse($email);

        $this->assertNotNull($result);
        $this->assertSame('Figma', $result['service_name']);
        $this->assertSame(15.0, $result['amount']);
        $this->assertSame('USD', $result['currency']);
        $this->assertSame('monthly', $result['billing_cycle']);
        $this->assertSame('2026-04-10', $result['billing_date']);
        $this->assertSame('high', $result['confidence']);
        $this->assertSame('msg-003', $result['raw_email_id']);
        $this->assertSame('pending', $result['status']);
    }

    public function test_parser_returns_null_for_unparseable_ai_response(): void
    {
        $this->mockAgent('This is not JSON at all.');

        $email = [
            'id' => 'msg-004',
            'subject' => 'Invoice from Notion',
            'from' => 'billing@notion.so',
            'date' => '2026-04-05',
            'snippet' => 'Payment received',
            'body' => 'Thank you for your payment.',
        ];

        $result = app(EmailParserService::class)->parse($email);

        $this->assertNull($result);
    }

    public function test_parser_strips_markdown_fences_from_ai_response(): void
    {
        $this->mockAgent("```json\n{\"is_subscription\":true,\"service_name\":\"Notion\",\"amount\":8.00,\"currency\":\"USD\",\"billing_cycle\":\"monthly\",\"billing_date\":\"2026-03-01\",\"confidence\":\"medium\"}\n```");

        $email = [
            'id' => 'msg-005',
            'subject' => 'Notion monthly receipt',
            'from' => 'billing@notion.so',
            'date' => '2026-03-01',
            'snippet' => '$8 charge',
            'body' => 'You were charged $8.00 for Notion.',
        ];

        $result = app(EmailParserService::class)->parse($email);

        $this->assertNotNull($result);
        $this->assertSame('Notion', $result['service_name']);
        $this->assertSame(8.0, $result['amount']);
    }

    // ─── Review controller tests ─────────────────────────────────────

    public function test_guest_cannot_access_review_page(): void
    {
        $response = $this->get(route('email-scanner.review'));

        $response->assertRedirect(route('login'));
    }

    public function test_review_page_shows_only_pending_results_for_user(): void
    {
        $user = User::factory()->create(['email' => 'scanner-review@example.com']);
        $scan = EmailScan::factory()->create(['user_id' => $user->id]);

        EmailScanResult::factory()->create([
            'user_id' => $user->id,
            'email_scan_id' => $scan->id,
            'service_name' => 'Figma',
            'status' => 'pending',
        ]);

        EmailScanResult::factory()->create([
            'user_id' => $user->id,
            'email_scan_id' => $scan->id,
            'service_name' => 'Notion',
            'status' => 'approved',
        ]);

        $response = $this->actingAs($user)->get(route('email-scanner.review'));

        $response->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('email-scanner/review')
            ->has('results', 1)
            ->where('results.0.serviceName', 'Figma')
        );
    }

    public function test_approve_result_creates_expense_card_and_marks_approved(): void
    {
        $user = User::factory()->create(['email' => 'scanner-approve@example.com']);
        $scan = EmailScan::factory()->create(['user_id' => $user->id]);

        $result = EmailScanResult::factory()->create([
            'user_id' => $user->id,
            'email_scan_id' => $scan->id,
            'service_name' => 'GitHub',
            'amount' => 4.00,
            'currency' => 'USD',
            'billing_cycle' => 'monthly',
            'billing_date' => '2026-04-15',
            'status' => 'pending',
        ]);

        $response = $this->actingAs($user)->patch(route('email-scanner.result.approve', $result));

        $response->assertRedirect(route('email-scanner.review'));

        $this->assertDatabaseHas('expense_cards', [
            'user_id' => $user->id,
            'name' => 'GitHub',
            'amount' => '4.00',
            'currency' => 'USD',
            'billing_cycle' => 'monthly',
            'auto_detected' => true,
            'source_email_id' => $result->raw_email_id,
        ]);

        $this->assertDatabaseHas('email_scan_results', [
            'id' => $result->id,
            'status' => 'approved',
        ]);
    }

    public function test_approve_result_rejects_other_users_result(): void
    {
        $owner = User::factory()->create(['email' => 'scanner-owner@example.com']);
        $intruder = User::factory()->create(['email' => 'scanner-intruder@example.com']);
        $scan = EmailScan::factory()->create(['user_id' => $owner->id]);

        $result = EmailScanResult::factory()->create([
            'user_id' => $owner->id,
            'email_scan_id' => $scan->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($intruder)->patch(route('email-scanner.result.approve', $result));

        $response->assertForbidden();
        $this->assertDatabaseCount('expense_cards', 0);
        $this->assertDatabaseHas('email_scan_results', ['id' => $result->id, 'status' => 'pending']);
    }

    public function test_reject_result_marks_status_rejected_without_creating_expense_card(): void
    {
        $user = User::factory()->create(['email' => 'scanner-reject@example.com']);
        $scan = EmailScan::factory()->create(['user_id' => $user->id]);

        $result = EmailScanResult::factory()->create([
            'user_id' => $user->id,
            'email_scan_id' => $scan->id,
            'service_name' => 'Adobe',
            'status' => 'pending',
        ]);

        $response = $this->actingAs($user)->patch(route('email-scanner.result.reject', $result));

        $response->assertRedirect(route('email-scanner.review'));

        $this->assertDatabaseHas('email_scan_results', [
            'id' => $result->id,
            'status' => 'rejected',
        ]);

        $this->assertDatabaseCount('expense_cards', 0);
    }

    public function test_approve_all_creates_expense_cards_for_all_pending_results(): void
    {
        $user = User::factory()->create(['email' => 'scanner-approveall@example.com']);
        $scan = EmailScan::factory()->create(['user_id' => $user->id]);

        EmailScanResult::factory()->count(3)->create([
            'user_id' => $user->id,
            'email_scan_id' => $scan->id,
            'billing_cycle' => 'monthly',
            'status' => 'pending',
        ]);

        $response = $this->actingAs($user)->post(route('email-scanner.result.approve-all'));

        $response->assertRedirect(route('email-scanner.review'));

        $this->assertDatabaseCount('expense_cards', 3);

        $this->assertDatabaseMissing('email_scan_results', [
            'user_id' => $user->id,
            'status' => 'pending',
        ]);
    }

    public function test_duplicate_raw_email_id_is_not_re_inserted(): void
    {
        $user = User::factory()->create(['email' => 'scanner-dup@example.com']);
        $scan = EmailScan::factory()->create(['user_id' => $user->id]);
        $existingEmailId = 'gmail-msg-existing-001';

        EmailScanResult::factory()->create([
            'user_id' => $user->id,
            'email_scan_id' => $scan->id,
            'raw_email_id' => $existingEmailId,
            'status' => 'pending',
        ]);

        $this->assertDatabaseCount('email_scan_results', 1);

        $this->expectException(UniqueConstraintViolationException::class);

        EmailScanResult::factory()->create([
            'user_id' => $user->id,
            'email_scan_id' => $scan->id,
            'raw_email_id' => $existingEmailId,
        ]);
    }

    public function test_status_endpoint_returns_current_scan_state(): void
    {
        $user = User::factory()->create(['email' => 'scanner-status@example.com']);
        EmailScan::factory()->create([
            'user_id' => $user->id,
            'status' => 'completed',
            'found_count' => 5,
        ]);

        $response = $this->actingAs($user)->getJson(route('email-scanner.status'));

        $response->assertOk()->assertJson([
            'status' => 'completed',
            'found_count' => 5,
        ]);
    }

    public function test_status_endpoint_returns_none_when_no_scan_exists(): void
    {
        $user = User::factory()->create(['email' => 'scanner-nostatus@example.com']);

        $response = $this->actingAs($user)->getJson(route('email-scanner.status'));

        $response->assertOk()->assertJson(['status' => 'none']);
    }

    public function test_approve_already_approved_result_returns_422(): void
    {
        $user = User::factory()->create(['email' => 'scanner-already@example.com']);
        $scan = EmailScan::factory()->create(['user_id' => $user->id]);

        $result = EmailScanResult::factory()->approved()->create([
            'user_id' => $user->id,
            'email_scan_id' => $scan->id,
        ]);

        $response = $this->actingAs($user)->patch(route('email-scanner.result.approve', $result));

        $response->assertStatus(422);
        $this->assertDatabaseCount('expense_cards', 0);
    }

    public function test_connected_account_must_exist_before_scan(): void
    {
        $user = User::factory()->create(['email' => 'scanner-noconn@example.com']);

        $response = $this->actingAs($user)->post(route('email-scanner.scan'));

        $response->assertRedirect(route('email-scanner.index'));
        $this->assertDatabaseCount('email_scans', 0);
    }

    public function test_scan_is_not_dispatched_if_one_is_already_running(): void
    {
        $user = User::factory()->create(['email' => 'scanner-running@example.com']);

        ConnectedAccount::factory()->create([
            'user_id' => $user->id,
            'provider' => 'gmail',
            'email' => 'user@gmail.com',
        ]);

        EmailScan::factory()->inProgress()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->post(route('email-scanner.scan'));

        $response->assertRedirect();
        $this->assertDatabaseCount('email_scans', 1);
    }
}
