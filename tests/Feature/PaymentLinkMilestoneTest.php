<?php

namespace Tests\Feature;

use App\Models\Contract;
use App\Models\PaymentLink;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PaymentLinkMilestoneTest extends TestCase
{
    use RefreshDatabase;

    public function test_create_page_includes_contracts_with_milestones(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();

        $owned = Contract::create([
            'user_id' => $owner->id,
            'contract_token' => (string) Str::uuid(),
            'project_name' => 'مشروعي',
            'description' => null,
            'client_name' => 'عميلي',
            'client_email' => 'mine@example.com',
            'total_value' => 2000,
            'tax_rate' => 10,
            'tax_amount' => 200,
            'grand_total' => 2200,
            'currency' => 'EGP',
            'start_date' => null,
            'end_date' => null,
            'terms' => null,
            'status' => 'draft',
        ]);
        $owned->milestones()->create([
            'title' => 'مرحلة ١',
            'percentage' => 50,
            'amount' => 1000,
            'due_date' => null,
            'status' => 'pending',
        ]);

        Contract::create([
            'user_id' => $other->id,
            'contract_token' => (string) Str::uuid(),
            'project_name' => 'مشروع غريب',
            'description' => null,
            'client_name' => 'عميل',
            'client_email' => 'other@example.com',
            'total_value' => 500,
            'tax_rate' => 0,
            'tax_amount' => 0,
            'grand_total' => 500,
            'currency' => 'EGP',
            'start_date' => null,
            'end_date' => null,
            'terms' => null,
            'status' => 'draft',
        ]);

        $this->actingAs($owner)
            ->get(route('payment-links.create'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('payment-links/create')
                ->has('contractsWithMilestones', 1)
                ->where('contractsWithMilestones.0.project_name', 'مشروعي')
                ->has('contractsWithMilestones.0.milestones', 1)
            );
    }

    public function test_create_page_passes_selected_milestone_from_query(): void
    {
        $owner = User::factory()->create();
        $contract = Contract::create([
            'user_id' => $owner->id,
            'contract_token' => (string) Str::uuid(),
            'project_name' => 'مشروع',
            'description' => null,
            'client_name' => 'عميل',
            'client_email' => 'c@example.com',
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
            'title' => 'مرحلة',
            'percentage' => 100,
            'amount' => 1000,
            'due_date' => null,
            'status' => 'pending',
        ]);

        $this->actingAs($owner)
            ->get(route('payment-links.create', ['milestone' => $milestone->id]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('selectedMilestoneId', $milestone->id)
            );
    }

    public function test_store_requires_milestone_id(): void
    {
        $owner = User::factory()->create();
        $this->actingAs($owner)
            ->post(route('payment-links.store'), [
                'amount' => 100,
                'tax_rate' => 0,
                'currency' => 'EGP',
                'description' => 'وصف',
                'client_name' => 'ع',
                'client_email' => 'a@b.com',
            ])
            ->assertSessionHasErrors('milestone_id');
    }

    public function test_store_rejects_milestone_from_other_users_contract(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();

        $contract = Contract::create([
            'user_id' => $intruder->id,
            'contract_token' => (string) Str::uuid(),
            'project_name' => 'سرقة',
            'description' => null,
            'client_name' => 'ا',
            'client_email' => 'x@y.com',
            'total_value' => 100,
            'tax_rate' => 0,
            'tax_amount' => 0,
            'grand_total' => 100,
            'currency' => 'EGP',
            'start_date' => null,
            'end_date' => null,
            'terms' => null,
            'status' => 'draft',
        ]);
        $milestone = $contract->milestones()->create([
            'title' => 'م',
            'percentage' => 100,
            'amount' => 100,
            'due_date' => null,
            'status' => 'pending',
        ]);

        $this->actingAs($owner)
            ->post(route('payment-links.store'), [
                'milestone_id' => $milestone->id,
                'amount' => 100,
                'tax_rate' => 0,
                'currency' => 'EGP',
                'description' => 'وصف',
                'client_name' => 'ع',
                'client_email' => 'a@b.com',
            ])
            ->assertSessionHasErrors('milestone_id');
    }

    public function test_store_saves_milestone_id_for_owned_milestone(): void
    {
        $owner = User::factory()->create();
        $contract = Contract::create([
            'user_id' => $owner->id,
            'contract_token' => (string) Str::uuid(),
            'project_name' => 'مشروع',
            'description' => null,
            'client_name' => 'عميل',
            'client_email' => 'c@example.com',
            'total_value' => 1000,
            'tax_rate' => 10,
            'tax_amount' => 100,
            'grand_total' => 1100,
            'currency' => 'EGP',
            'start_date' => null,
            'end_date' => null,
            'terms' => null,
            'status' => 'draft',
        ]);
        $milestone = $contract->milestones()->create([
            'title' => 'مرحلة',
            'percentage' => 100,
            'amount' => 1000,
            'due_date' => null,
            'status' => 'pending',
        ]);

        $this->actingAs($owner)
            ->post(route('payment-links.store'), [
                'milestone_id' => $milestone->id,
                'amount' => 100,
                'tax_rate' => 0,
                'currency' => 'EGP',
                'description' => 'وصف',
                'client_name' => 'عميل',
                'client_email' => 'c@example.com',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('payment_links', [
            'milestone_id' => $milestone->id,
            'user_id' => $owner->id,
        ]);
    }

    public function test_milestone_show_includes_payment_links(): void
    {
        $owner = User::factory()->create();
        $contract = Contract::create([
            'user_id' => $owner->id,
            'contract_token' => (string) Str::uuid(),
            'project_name' => 'مشروع',
            'description' => null,
            'client_name' => 'عميل',
            'client_email' => 'c@example.com',
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
            'title' => 'مرحلة',
            'percentage' => 100,
            'amount' => 1000,
            'due_date' => null,
            'status' => 'pending',
        ]);

        PaymentLink::create([
            'user_id' => $owner->id,
            'milestone_id' => $milestone->id,
            'public_token' => Str::lower(Str::ulid()->toBase32()),
            'amount' => 50,
            'tax_rate' => 0,
            'tax_amount' => 0,
            'total_amount' => 50,
            'currency' => 'EGP',
            'description' => 'اختبار',
            'client_name' => 'ع',
            'client_email' => 'a@b.com',
            'status' => 'pending',
            'mock_gateway_reference' => 'mock_ABCDEF123456',
            'mock_provider' => 'mock-sandbox',
            'source' => 'manual',
        ]);

        $this->actingAs($owner)
            ->get(route('milestones.show', $milestone->id))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('milestones/show')
                ->has('paymentLinks', 1)
            );
    }
}
