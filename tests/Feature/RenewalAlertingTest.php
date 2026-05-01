<?php

namespace Tests\Feature;

use App\Models\ExpenseCard;
use App\Models\RenewalAlert;
use App\Models\User;
use App\Notifications\RenewalAlertNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class RenewalAlertingTest extends TestCase
{
    use RefreshDatabase;

    public function test_alert_fires_when_card_is_within_window(): void
    {
        Notification::fake();

        $user = User::factory()->create(['email' => 'freelancer@example.com']);

        $card = ExpenseCard::factory()->create([
            'user_id' => $user->id,
            'name' => 'Figma Pro',
            'status' => 'active',
            'type' => 'recurring',
            'next_renewal_date' => now()->addDays(5)->toDateString(),
            'alert_days_before' => 7,
            'last_alerted_at' => null,
        ]);

        $this->artisan('renewals:check');

        Notification::assertSentTo($user, RenewalAlertNotification::class);
        $this->assertDatabaseHas('renewal_alerts', [
            'user_id' => $user->id,
            'expense_card_id' => $card->id,
            'dismissed_at' => null,
        ]);
        $this->assertNotNull($card->fresh()->last_alerted_at);
    }

    public function test_no_duplicate_alert_within_same_cycle(): void
    {
        Notification::fake();

        $user = User::factory()->create(['email' => 'freelancer2@example.com']);

        $renewalDate = now()->addDays(5)->toDateString();

        ExpenseCard::factory()->create([
            'user_id' => $user->id,
            'status' => 'active',
            'type' => 'recurring',
            'next_renewal_date' => $renewalDate,
            'alert_days_before' => 7,
            'last_alerted_at' => now(),
        ]);

        $this->artisan('renewals:check');

        Notification::assertNothingSent();
        $this->assertDatabaseCount('renewal_alerts', 0);
    }

    public function test_alert_skipped_for_non_active_card(): void
    {
        Notification::fake();

        $user = User::factory()->create(['email' => 'freelancer3@example.com']);

        ExpenseCard::factory()->create([
            'user_id' => $user->id,
            'status' => 'cancelled',
            'type' => 'recurring',
            'next_renewal_date' => now()->addDays(3)->toDateString(),
            'alert_days_before' => 7,
            'last_alerted_at' => null,
        ]);

        $this->artisan('renewals:check');

        Notification::assertNothingSent();
        $this->assertDatabaseCount('renewal_alerts', 0);
    }

    public function test_alert_skipped_for_non_recurring_card(): void
    {
        Notification::fake();

        $user = User::factory()->create(['email' => 'freelancer4@example.com']);

        ExpenseCard::factory()->create([
            'user_id' => $user->id,
            'status' => 'active',
            'type' => 'one-time',
            'next_renewal_date' => now()->addDays(3)->toDateString(),
            'alert_days_before' => 7,
            'last_alerted_at' => null,
        ]);

        $this->artisan('renewals:check');

        Notification::assertNothingSent();
        $this->assertDatabaseCount('renewal_alerts', 0);
    }

    public function test_alert_skipped_when_renewal_date_is_in_the_past(): void
    {
        Notification::fake();

        $user = User::factory()->create(['email' => 'freelancer5@example.com']);

        ExpenseCard::factory()->create([
            'user_id' => $user->id,
            'status' => 'active',
            'type' => 'recurring',
            'next_renewal_date' => now()->subDay()->toDateString(),
            'alert_days_before' => 7,
            'last_alerted_at' => null,
        ]);

        $this->artisan('renewals:check');

        Notification::assertNothingSent();
        $this->assertDatabaseCount('renewal_alerts', 0);
    }

    public function test_alert_skipped_when_outside_alert_window(): void
    {
        Notification::fake();

        $user = User::factory()->create(['email' => 'freelancer6@example.com']);

        ExpenseCard::factory()->create([
            'user_id' => $user->id,
            'status' => 'active',
            'type' => 'recurring',
            'next_renewal_date' => now()->addDays(30)->toDateString(),
            'alert_days_before' => 7,
            'last_alerted_at' => null,
        ]);

        $this->artisan('renewals:check');

        Notification::assertNothingSent();
        $this->assertDatabaseCount('renewal_alerts', 0);
    }

    public function test_dismiss_sets_dismissed_at(): void
    {
        $user = User::factory()->create(['email' => 'freelancer7@example.com']);

        $card = ExpenseCard::factory()->create([
            'user_id' => $user->id,
            'status' => 'active',
            'type' => 'recurring',
            'next_renewal_date' => now()->addDays(3)->toDateString(),
        ]);

        $alert = RenewalAlert::create([
            'user_id' => $user->id,
            'expense_card_id' => $card->id,
            'alerted_at' => now(),
        ]);

        $response = $this->actingAs($user)
            ->put(route('renewal-alerts.dismiss', $alert));

        $response->assertRedirect();
        $this->assertNotNull($alert->fresh()->dismissed_at);
    }

    public function test_dismiss_forbidden_for_another_user(): void
    {
        $owner = User::factory()->create(['email' => 'owner@example.com']);
        $other = User::factory()->create(['email' => 'other@example.com']);

        $card = ExpenseCard::factory()->create([
            'user_id' => $owner->id,
            'status' => 'active',
            'type' => 'recurring',
            'next_renewal_date' => now()->addDays(3)->toDateString(),
        ]);

        $alert = RenewalAlert::create([
            'user_id' => $owner->id,
            'expense_card_id' => $card->id,
            'alerted_at' => now(),
        ]);

        $response = $this->actingAs($other)
            ->put(route('renewal-alerts.dismiss', $alert));

        $response->assertForbidden();
        $this->assertNull($alert->fresh()->dismissed_at);
    }

    public function test_undismissed_alerts_appear_in_expenses_index_props(): void
    {
        $user = User::factory()->create(['email' => 'freelancer8@example.com']);

        $card = ExpenseCard::factory()->create([
            'user_id' => $user->id,
            'name' => 'Adobe Creative Cloud',
            'status' => 'active',
            'type' => 'recurring',
            'next_renewal_date' => now()->addDays(4)->toDateString(),
        ]);

        RenewalAlert::create([
            'user_id' => $user->id,
            'expense_card_id' => $card->id,
            'alerted_at' => now(),
        ]);

        $response = $this->actingAs($user)
            ->get(route('expenses.index'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->has('renewalAlerts', 1)
            ->where('renewalAlerts.0.expenseCard.name', 'Adobe Creative Cloud')
        );
    }

    public function test_dismissed_alerts_do_not_appear_in_expenses_index_props(): void
    {
        $user = User::factory()->create(['email' => 'freelancer9@example.com']);

        $card = ExpenseCard::factory()->create([
            'user_id' => $user->id,
            'status' => 'active',
            'type' => 'recurring',
            'next_renewal_date' => now()->addDays(4)->toDateString(),
        ]);

        RenewalAlert::create([
            'user_id' => $user->id,
            'expense_card_id' => $card->id,
            'alerted_at' => now()->subHour(),
            'dismissed_at' => now(),
        ]);

        $response = $this->actingAs($user)
            ->get(route('expenses.index'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->has('renewalAlerts', 0)
        );
    }

    public function test_new_cycle_alert_fires_after_renewal_reset(): void
    {
        Notification::fake();

        $user = User::factory()->create(['email' => 'freelancer10@example.com']);

        $newRenewalDate = now()->addDays(5)->toDateString();

        ExpenseCard::factory()->create([
            'user_id' => $user->id,
            'status' => 'active',
            'type' => 'recurring',
            'next_renewal_date' => $newRenewalDate,
            'alert_days_before' => 7,
            'last_alerted_at' => now()->subMonth(),
        ]);

        $this->artisan('renewals:check');

        Notification::assertSentTo($user, RenewalAlertNotification::class);
    }
}
