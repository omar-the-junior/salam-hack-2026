<?php

namespace Tests\Feature;

use App\Models\ExpenseCard;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ExpenseCardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_view_expenses_dashboard(): void
    {
        $response = $this->get(route('expenses.index'));

        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_user_can_create_expense_card(): void
    {
        $user = User::factory()->create(['email' => 'expense-owner@example.com']);

        $payload = [
            'name' => 'Figma Pro',
            'category' => 'saas',
            'type' => 'recurring',
            'amount' => '15.00',
            'currency' => 'USD',
            'billing_cycle' => 'monthly',
            'next_renewal_date' => '2026-05-03',
            'started_at' => '2025-11-03',
            'cancel_url' => 'https://www.figma.com/account/billing/',
            'notes' => 'ملاحظة',
            'alert_days_before' => '7',
        ];

        $response = $this->actingAs($user)->post(route('expenses.store'), $payload);

        $response->assertRedirect(route('expenses.index'));
        $response->assertSessionHas('flash.message');

        $this->assertDatabaseHas('expense_cards', [
            'user_id' => $user->id,
            'name' => 'Figma Pro',
            'amount' => '15.00',
            'currency' => 'USD',
            'type' => 'recurring',
            'billing_cycle' => 'monthly',
            'status' => 'active',
            'auto_detected' => false,
        ]);
    }

    public function test_recurring_expense_requires_next_renewal_date(): void
    {
        $user = User::factory()->create(['email' => 'expense-val@example.com']);

        $response = $this->actingAs($user)->post(route('expenses.store'), [
            'name' => 'Test',
            'category' => 'saas',
            'type' => 'recurring',
            'amount' => '10.00',
            'currency' => 'EGP',
            'billing_cycle' => 'monthly',
            'next_renewal_date' => '',
        ]);

        $response->assertSessionHasErrors('next_renewal_date');
        $this->assertDatabaseCount('expense_cards', 0);
    }

    public function test_expenses_dashboard_includes_summary_totals_and_filters(): void
    {
        $user = User::factory()->create([
            'email' => 'expense-dash@example.com',
            'preferred_currency' => 'USD',
        ]);

        ExpenseCard::factory()->create([
            'user_id' => $user->id,
            'name' => 'Monthly Tool',
            'type' => 'recurring',
            'billing_cycle' => 'monthly',
            'amount' => '100.00',
            'currency' => 'USD',
            'status' => 'active',
        ]);

        ExpenseCard::factory()->create([
            'user_id' => $user->id,
            'name' => 'Annual Suite',
            'type' => 'recurring',
            'billing_cycle' => 'annual',
            'amount' => '1200.00',
            'currency' => 'USD',
            'status' => 'active',
        ]);

        ExpenseCard::factory()->create([
            'user_id' => $user->id,
            'name' => 'One-off',
            'type' => 'one-time',
            'billing_cycle' => 'one-time',
            'amount' => '500.00',
            'currency' => 'USD',
            'status' => 'active',
            'next_renewal_date' => null,
        ]);

        $response = $this->actingAs($user)->get(route('expenses.index'));

        $response->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('expenses/index')
            ->where('summary.monthly_burn', 200)
            ->where('summary.annual_commitment', 2400)
            ->where('summary.preferred_currency', 'USD')
            ->has('expenses', 3)
        );

        $filtered = $this->actingAs($user)->get(route('expenses.index', ['status' => 'cancelled']));
        $filtered->assertOk()->assertInertia(fn (Assert $page) => $page
            ->has('expenses', 0)
        );
    }

    public function test_user_cannot_update_another_users_expense_card(): void
    {
        $owner = User::factory()->create(['email' => 'exp-owner@example.com']);
        $intruder = User::factory()->create(['email' => 'exp-bad@example.com']);

        $card = ExpenseCard::factory()->create([
            'user_id' => $owner->id,
            'name' => 'Secret',
            'amount' => '50.00',
            'currency' => 'EGP',
        ]);

        $response = $this->actingAs($intruder)->patch(route('expenses.update', ['expense' => $card]), [
            'name' => 'Hacked',
        ]);

        $response->assertForbidden();

        $this->assertDatabaseHas('expense_cards', [
            'id' => $card->id,
            'name' => 'Secret',
        ]);
    }

    public function test_user_can_cancel_expense_via_status_endpoint(): void
    {
        $user = User::factory()->create(['email' => 'exp-cancel@example.com']);
        $card = ExpenseCard::factory()->create([
            'user_id' => $user->id,
            'status' => 'active',
        ]);

        $response = $this->actingAs($user)->patch(route('expenses.status', ['expense' => $card]), [
            'status' => 'cancelled',
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('expense_cards', [
            'id' => $card->id,
            'status' => 'cancelled',
        ]);
    }

    public function test_user_can_delete_own_expense_card(): void
    {
        $user = User::factory()->create(['email' => 'exp-del@example.com']);
        $card = ExpenseCard::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->delete(route('expenses.destroy', ['expense' => $card]));

        $response->assertRedirect(route('expenses.index'));
        $this->assertDatabaseMissing('expense_cards', ['id' => $card->id]);
    }

    public function test_user_cannot_delete_another_users_expense_card(): void
    {
        $owner = User::factory()->create(['email' => 'exp-own2@example.com']);
        $intruder = User::factory()->create(['email' => 'exp-in2@example.com']);
        $card = ExpenseCard::factory()->create(['user_id' => $owner->id]);

        $response = $this->actingAs($intruder)->delete(route('expenses.destroy', ['expense' => $card]));

        $response->assertForbidden();
        $this->assertDatabaseHas('expense_cards', ['id' => $card->id]);
    }
}
