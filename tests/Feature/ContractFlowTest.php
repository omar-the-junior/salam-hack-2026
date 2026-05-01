<?php

namespace Tests\Feature;

use App\Models\Contract;
use App\Models\Customer;
use App\Models\User;
use App\Notifications\ContractSignatureCodeNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ContractFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_can_view_contract_review_by_token(): void
    {
        $freelancerUser = User::factory()->create([
            'email' => 'freelancer@example.com',
            'display_name' => 'المستقل التجريبي',
        ]);
        $contract = Contract::create([
            'user_id' => $freelancerUser->id,
            'contract_token' => (string) Str::uuid(),
            'project_name' => 'مشروع تجريبي',
            'description' => 'وصف',
            'client_name' => 'العميل التجريبي',
            'client_email' => 'client@example.com',
            'total_value' => 1000,
            'tax_rate' => 14,
            'tax_amount' => 140,
            'grand_total' => 1140,
            'currency' => 'EGP',
            'start_date' => null,
            'end_date' => null,
            'terms' => 'الشروط',
            'status' => 'draft',
            'signature_code_hash' => Hash::make('123456'),
        ]);

        $response = $this->get(route('contracts.review', ['token' => $contract->contract_token]));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('contracts/review')
            ->has('contract'));
    }

    public function test_guest_can_accept_draft_contract_with_correct_code(): void
    {
        $freelancerUser = User::factory()->create();
        $token = (string) Str::uuid();
        $plainCode = '654321';
        $contract = Contract::create([
            'user_id' => $freelancerUser->id,
            'contract_token' => $token,
            'project_name' => 'مشروع',
            'description' => null,
            'client_name' => 'عميل',
            'client_email' => 'client@example.com',
            'total_value' => 1000,
            'tax_rate' => 0,
            'tax_amount' => 0,
            'grand_total' => 1000,
            'currency' => 'EGP',
            'start_date' => null,
            'end_date' => null,
            'terms' => 'الشروط',
            'status' => 'draft',
            'signature_code_hash' => Hash::make($plainCode),
        ]);

        $response = $this->post(route('contracts.accept', ['token' => $token]), [
            'agreed' => true,
            'signature_code' => $plainCode,
        ]);

        $response->assertRedirect(route('contracts.review', ['token' => $token]));

        $contract->refresh();
        $this->assertSame('active', $contract->status);
        $this->assertNotNull($contract->signed_at);
        $this->assertNotNull($contract->client_ip);
    }

    public function test_accepting_contract_with_wrong_code_is_rejected(): void
    {
        $freelancerUser = User::factory()->create();
        $token = (string) Str::uuid();
        $contract = Contract::create([
            'user_id' => $freelancerUser->id,
            'contract_token' => $token,
            'project_name' => 'مشروع',
            'description' => null,
            'client_name' => 'عميل',
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
            'signature_code_hash' => Hash::make('111111'),
        ]);

        $response = $this->post(route('contracts.accept', ['token' => $token]), [
            'agreed' => true,
            'signature_code' => '999999',
        ]);

        $response->assertSessionHasErrors(['signature_code']);

        $contract->refresh();
        $this->assertSame('draft', $contract->status);
        $this->assertNull($contract->signed_at);
    }

    public function test_accepting_contract_without_code_fails_validation(): void
    {
        $freelancerUser = User::factory()->create();
        $token = (string) Str::uuid();
        Contract::create([
            'user_id' => $freelancerUser->id,
            'contract_token' => $token,
            'project_name' => 'مشروع',
            'description' => null,
            'client_name' => 'عميل',
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
            'signature_code_hash' => Hash::make('123456'),
        ]);

        $response = $this->post(route('contracts.accept', ['token' => $token]), [
            'agreed' => true,
        ]);

        $response->assertSessionHasErrors(['signature_code']);
    }

    public function test_accepting_already_active_contract_does_not_change_signature(): void
    {
        $freelancerUser = User::factory()->create();
        $token = (string) Str::uuid();
        $originalSignedAt = now()->subDay();
        $contract = Contract::create([
            'user_id' => $freelancerUser->id,
            'contract_token' => $token,
            'project_name' => 'مشروع',
            'description' => null,
            'client_name' => 'عميل',
            'client_email' => 'client@example.com',
            'total_value' => 1000,
            'tax_rate' => 0,
            'tax_amount' => 0,
            'grand_total' => 1000,
            'currency' => 'EGP',
            'start_date' => null,
            'end_date' => null,
            'terms' => 'الشروط',
            'status' => 'active',
            'signed_at' => $originalSignedAt,
            'client_ip' => '127.0.0.1',
            'signature_code_hash' => Hash::make('123456'),
        ]);

        $response = $this->post(route('contracts.accept', ['token' => $token]), [
            'agreed' => true,
            'signature_code' => '123456',
        ]);

        $response->assertRedirect(route('contracts.review', ['token' => $token]));

        $contract->refresh();
        $this->assertSame(
            $originalSignedAt->format('Y-m-d H:i:s'),
            $contract->signed_at->format('Y-m-d H:i:s'),
        );
    }

    public function test_store_contract_generates_otp_and_emails_client(): void
    {
        Notification::fake();

        $freelancerUser = User::factory()->create(['email' => 'freelancer@example.com']);
        $this->actingAs($freelancerUser);

        $this->post(route('contracts.store'), [
            'project_name' => 'مشروع الاختبار',
            'description' => null,
            'client_name' => 'عميل الاختبار',
            'client_email' => 'otp-client@example.com',
            'total_value' => 5000,
            'tax_rate' => 0,
            'currency' => 'EGP',
        ]);

        $contract = Contract::where('client_email', 'otp-client@example.com')->first();
        $this->assertNotNull($contract);
        $this->assertNotNull($contract->signature_code_hash);
        $this->assertNotNull($contract->signature_code_sent_at);

        Notification::assertSentOnDemand(
            ContractSignatureCodeNotification::class,
            function (ContractSignatureCodeNotification $notification, array $channels, AnonymousNotifiable $notifiable) use ($contract) {
                return $notifiable->routes['mail'] === $contract->client_email;
            }
        );
    }

    public function test_store_contract_rejects_end_date_before_start_date(): void
    {
        $freelancerUser = User::factory()->create();
        $this->actingAs($freelancerUser);

        $response = $this->post(route('contracts.store'), [
            'project_name' => 'مشروع',
            'description' => null,
            'client_name' => 'عميل',
            'client_email' => 'date-range-invalid@example.com',
            'total_value' => 1000,
            'tax_rate' => 0,
            'currency' => 'EGP',
            'start_date' => '2026-06-01',
            'end_date' => '2026-05-01',
        ]);

        $response->assertSessionHasErrors(['end_date']);
        $this->assertDatabaseMissing('contracts', [
            'client_email' => 'date-range-invalid@example.com',
        ]);
    }

    public function test_contract_update_rejects_end_date_before_start_date(): void
    {
        $ownerUser = User::factory()->create();
        $contract = Contract::create([
            'user_id' => $ownerUser->id,
            'contract_token' => (string) Str::uuid(),
            'project_name' => 'مشروع',
            'description' => null,
            'client_name' => 'عميل',
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

        $response = $this->actingAs($ownerUser)
            ->from(route('contracts.edit', $contract))
            ->put(route('contracts.update', $contract), [
                'project_name' => 'مشروع',
                'description' => null,
                'client_name' => 'عميل',
                'client_email' => 'client@example.com',
                'total_value' => 1000,
                'tax_rate' => 0,
                'currency' => 'EGP',
                'start_date' => '2026-08-01',
                'end_date' => '2026-07-01',
                'terms' => null,
                'continue_wizard' => true,
            ]);

        $response->assertSessionHasErrors(['end_date']);
        $contract->refresh();
        $this->assertNull($contract->start_date);
        $this->assertNull($contract->end_date);
    }

    public function test_authenticated_owner_can_store_milestone(): void
    {
        $ownerUser = User::factory()->create();
        $this->actingAs($ownerUser);

        $contract = Contract::create([
            'user_id' => $ownerUser->id,
            'contract_token' => (string) Str::uuid(),
            'project_name' => 'مشروع',
            'description' => null,
            'client_name' => 'عميل',
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

        $response = $this->post(route('milestones.store', ['contract' => $contract->id]), [
            'title' => 'مرحلة أولى',
            'percentage' => 100,
            'due_date' => null,
        ]);

        $response->assertRedirect(route('contracts.show', $contract->id));
        $this->assertDatabaseHas('milestones', [
            'contract_id' => $contract->id,
            'title' => 'مرحلة أولى',
        ]);
    }

    public function test_store_milestone_rejected_when_aggregate_percentage_exceeds_100(): void
    {
        $ownerUser = User::factory()->create();
        $this->actingAs($ownerUser);

        $contract = Contract::create([
            'user_id' => $ownerUser->id,
            'contract_token' => (string) Str::uuid(),
            'project_name' => 'مشروع',
            'description' => null,
            'client_name' => 'عميل',
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

        foreach ([15, 20, 20] as $i => $pct) {
            $contract->milestones()->create([
                'title' => 'مرحلة '.($i + 1),
                'percentage' => $pct,
                'amount' => $contract->total_value * $pct / 100,
                'due_date' => null,
                'status' => 'pending',
            ]);
        }

        $response = $this->from(route('contracts.show', $contract))
            ->post(route('milestones.store', ['contract' => $contract->id]), [
                'title' => 'مرحلة زائدة',
                'percentage' => 50,
                'due_date' => null,
            ]);

        $response->assertSessionHasErrors(['percentage']);
    }

    public function test_store_milestone_succeeds_when_aggregate_percentage_reaches_100(): void
    {
        $ownerUser = User::factory()->create();
        $this->actingAs($ownerUser);

        $contract = Contract::create([
            'user_id' => $ownerUser->id,
            'contract_token' => (string) Str::uuid(),
            'project_name' => 'مشروع',
            'description' => null,
            'client_name' => 'عميل',
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

        $contract->milestones()->create([
            'title' => 'مرحلة أولى',
            'percentage' => 80,
            'amount' => 800,
            'due_date' => null,
            'status' => 'pending',
        ]);

        $response = $this->post(route('milestones.store', ['contract' => $contract->id]), [
            'title' => 'مرحلة ثانية',
            'percentage' => 20,
            'due_date' => null,
        ]);

        $response->assertRedirect(route('contracts.show', $contract->id));
        $this->assertDatabaseHas('milestones', [
            'contract_id' => $contract->id,
            'title' => 'مرحلة ثانية',
            'percentage' => 20,
        ]);
    }

    public function test_update_milestone_rejected_when_aggregate_percentage_exceeds_100(): void
    {
        $ownerUser = User::factory()->create();
        $this->actingAs($ownerUser);

        $contract = Contract::create([
            'user_id' => $ownerUser->id,
            'contract_token' => (string) Str::uuid(),
            'project_name' => 'مشروع',
            'description' => null,
            'client_name' => 'عميل',
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

        $first = $contract->milestones()->create([
            'title' => 'مرحلة أولى',
            'percentage' => 40,
            'amount' => 400,
            'due_date' => null,
            'status' => 'pending',
        ]);
        $contract->milestones()->create([
            'title' => 'مرحلة ثانية',
            'percentage' => 30,
            'amount' => 300,
            'due_date' => null,
            'status' => 'pending',
        ]);
        $contract->milestones()->create([
            'title' => 'مرحلة ثالثة',
            'percentage' => 20,
            'amount' => 200,
            'due_date' => null,
            'status' => 'pending',
        ]);

        $response = $this->from(route('milestones.show', $first))
            ->put(route('milestones.update', $first), [
                'percentage' => 70,
            ]);

        $response->assertSessionHasErrors(['percentage']);
        $first->refresh();
        $this->assertEqualsWithDelta(40.0, (float) $first->percentage, 0.01);
    }

    public function test_authenticated_owner_bulk_milestones_redirects_to_wizard_summary(): void
    {
        $ownerUser = User::factory()->create();
        $this->actingAs($ownerUser);

        $contract = Contract::create([
            'user_id' => $ownerUser->id,
            'contract_token' => (string) Str::uuid(),
            'project_name' => 'مشروع',
            'description' => null,
            'client_name' => 'عميل',
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

        $response = $this->post(route('milestones.store-bulk', ['contract' => $contract->id]), [
            'milestones' => [
                ['title' => 'مرحلة أولى', 'percentage' => 40, 'due_date' => null],
                ['title' => 'مرحلة ثانية', 'percentage' => 60, 'due_date' => null],
            ],
        ]);

        $response->assertRedirect(route('contracts.create.summary', ['contract_id' => $contract->id]));
        $this->assertDatabaseHas('milestones', [
            'contract_id' => $contract->id,
            'title' => 'مرحلة أولى',
        ]);
    }

    public function test_store_bulk_milestones_rejected_when_existing_plus_payload_exceeds_100(): void
    {
        $ownerUser = User::factory()->create();
        $this->actingAs($ownerUser);

        $contract = Contract::create([
            'user_id' => $ownerUser->id,
            'contract_token' => (string) Str::uuid(),
            'project_name' => 'مشروع',
            'description' => null,
            'client_name' => 'عميل',
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

        $contract->milestones()->create([
            'title' => 'موجودة',
            'percentage' => 70,
            'amount' => 700,
            'due_date' => null,
            'status' => 'pending',
        ]);

        $response = $this->post(route('milestones.store-bulk', ['contract' => $contract->id]), [
            'milestones' => [
                ['title' => 'جديدة 1', 'percentage' => 40, 'due_date' => null],
            ],
        ]);

        $response->assertSessionHasErrors(['milestones']);
        $this->assertDatabaseMissing('milestones', [
            'contract_id' => $contract->id,
            'title' => 'جديدة 1',
        ]);
    }

    public function test_create_summary_redirects_when_contract_not_draft(): void
    {
        $ownerUser = User::factory()->create();
        $this->actingAs($ownerUser);

        $contract = Contract::create([
            'user_id' => $ownerUser->id,
            'contract_token' => (string) Str::uuid(),
            'project_name' => 'مشروع',
            'description' => null,
            'client_name' => 'عميل',
            'client_email' => 'client@example.com',
            'total_value' => 1000,
            'tax_rate' => 0,
            'tax_amount' => 0,
            'grand_total' => 1000,
            'currency' => 'EGP',
            'start_date' => null,
            'end_date' => null,
            'terms' => null,
            'status' => 'active',
        ]);

        $response = $this->get(route('contracts.create.summary', ['contract_id' => $contract->id]));

        $response->assertRedirect(route('contracts.show', $contract));
    }

    public function test_create_summary_renders_for_draft_contract(): void
    {
        $ownerUser = User::factory()->create();
        $this->actingAs($ownerUser);

        $contract = Contract::create([
            'user_id' => $ownerUser->id,
            'contract_token' => (string) Str::uuid(),
            'project_name' => 'مشروع',
            'description' => null,
            'client_name' => 'عميل',
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

        $response = $this->get(route('contracts.create.summary', ['contract_id' => $contract->id]));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('contracts/create-summary')
            ->has('contract'));
    }

    public function test_contract_create_page_passes_default_tax_rate_from_profile(): void
    {
        $user = User::factory()->create([
            'default_tax_rate' => 14.5,
        ]);

        $this->actingAs($user)
            ->get(route('contracts.create'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('contracts/create')
                ->has('customers', 0)
                ->has('newCustomerId')
                ->has('initialCustomerId')
                ->where('mode', 'create')
                ->where('contract', null)
                ->where('defaults.tax_rate', 14.5));
    }

    public function test_contract_create_page_includes_saved_customers(): void
    {
        $user = User::factory()->create();
        Customer::create([
            'user_id' => $user->id,
            'name' => 'عميل محفوظ',
            'email' => 'saved@example.com',
        ]);

        $this->actingAs($user)
            ->get(route('contracts.create'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('contracts/create')
                ->has('customers', 1)
                ->where('customers.0.email', 'saved@example.com')
                ->where('mode', 'create'));
    }

    public function test_storing_customer_with_contract_context_redirects_to_contract_create(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->post(route('customers.store'), [
                'name' => 'عميل جديد',
                'email' => 'fresh@example.com',
                'context' => 'contract',
            ]);

        $response->assertRedirect(route('contracts.create'));
        $response->assertSessionHas('new_customer_id');

        $this->assertDatabaseHas('customers', [
            'user_id' => $user->id,
            'email' => 'fresh@example.com',
        ]);
    }

    public function test_owner_can_view_contract_edit_step(): void
    {
        $ownerUser = User::factory()->create();
        $contract = Contract::create([
            'user_id' => $ownerUser->id,
            'contract_token' => (string) Str::uuid(),
            'project_name' => 'مشروع',
            'description' => null,
            'client_name' => 'عميل',
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

        $this->actingAs($ownerUser)
            ->get(route('contracts.edit', $contract))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('contracts/create')
                ->where('mode', 'edit')
                ->where('contract.id', $contract->id)
                ->where('contract.project_name', 'مشروع'));
    }

    public function test_non_owner_cannot_view_contract_edit_step(): void
    {
        $ownerUser = User::factory()->create();
        $otherUser = User::factory()->create();
        $contract = Contract::create([
            'user_id' => $ownerUser->id,
            'contract_token' => (string) Str::uuid(),
            'project_name' => 'مشروع',
            'description' => null,
            'client_name' => 'عميل',
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

        $this->actingAs($otherUser)
            ->get(route('contracts.edit', $contract))
            ->assertForbidden();
    }

    public function test_contract_update_with_continue_wizard_redirects_to_milestones(): void
    {
        $ownerUser = User::factory()->create();
        $contract = Contract::create([
            'user_id' => $ownerUser->id,
            'contract_token' => (string) Str::uuid(),
            'project_name' => 'مشروع قديم',
            'description' => null,
            'client_name' => 'عميل',
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

        $response = $this->actingAs($ownerUser)
            ->from(route('contracts.edit', $contract))
            ->put(route('contracts.update', $contract), [
                'project_name' => 'مشروع محدّث',
                'description' => null,
                'client_name' => 'عميل',
                'client_email' => 'client@example.com',
                'total_value' => 2000,
                'tax_rate' => 10,
                'currency' => 'EGP',
                'start_date' => null,
                'end_date' => null,
                'terms' => null,
                'continue_wizard' => true,
            ]);

        $response->assertRedirect(route('contracts.create.milestones', ['contract_id' => $contract->id]));

        $contract->refresh();
        $this->assertSame('مشروع محدّث', $contract->project_name);
        $this->assertSame('2000.00', $contract->total_value);
    }
}
