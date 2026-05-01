<?php

namespace Tests\Feature;

use App\Models\Contract;
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
}
