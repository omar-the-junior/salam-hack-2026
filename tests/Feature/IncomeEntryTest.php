<?php

namespace Tests\Feature;

use App\Models\IncomeEntry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class IncomeEntryTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_view_income_dashboard(): void
    {
        $response = $this->get(route('income.index'));

        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_user_can_submit_manual_income(): void
    {
        $freelancer = User::factory()->create(['email' => 'income-owner@example.com']);

        $payload = [
            'amount' => '1200.50',
            'currency' => 'EGP',
            'date' => '2026-04-29',
            'source_label' => 'upwork',
            'client_name' => 'شركة الاختبار',
            'category' => 'freelance',
            'description' => 'دفعة تجريبية',
        ];

        $response = $this->actingAs($freelancer)->post(route('income.store'), $payload);

        $response->assertRedirect(route('income.index'));
        $response->assertSessionHas('flash.message');

        $this->assertDatabaseHas('income_entries', [
            'user_id' => $freelancer->id,
            'amount' => '1200.50',
            'currency' => 'EGP',
            'source' => 'manual',
            'source_label' => 'Upwork',
            'client_name' => 'شركة الاختبار',
            'category' => 'Freelance',
            'description' => 'دفعة تجريبية',
        ]);
    }

    public function test_income_dashboard_loads_inertia_props(): void
    {
        $freelancer = User::factory()->create(['email' => 'income-dash@example.com']);

        IncomeEntry::factory()->create([
            'user_id' => $freelancer->id,
            'amount' => '100.00',
            'currency' => 'EGP',
            'date' => '2026-04-01',
            'source' => 'manual',
            'category' => 'Freelance',
        ]);

        $response = $this->actingAs($freelancer)->get(route('income.index', ['month' => '2026-04']));

        $response->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('income/index')
            ->has('monthTotalsByCurrency')
            ->has('incomeEntries.data', 1)
            ->where('hasAnyIncomeEver', true)
        );
    }

    public function test_user_cannot_update_another_users_income_entry(): void
    {
        $owner = User::factory()->create(['email' => 'owner-income@example.com']);
        $intruder = User::factory()->create(['email' => 'bad@example.com']);

        $entry = IncomeEntry::factory()->create([
            'user_id' => $owner->id,
            'amount' => '99.00',
            'currency' => 'EGP',
            'date' => '2026-03-10',
            'source' => 'manual',
            'category' => 'Freelance',
        ]);

        $response = $this->actingAs($intruder)->patch(route('income.update', ['incomeEntry' => $entry]), [
            'amount' => '999.00',
        ]);

        $response->assertForbidden();

        $this->assertDatabaseHas('income_entries', [
            'id' => $entry->id,
            'amount' => '99.00',
        ]);
    }
}
