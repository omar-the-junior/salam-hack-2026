<?php

namespace Tests\Feature;

use App\Models\Contract;
use App\Models\ExpenseCard;
use App\Models\IncomeEntry;
use App\Models\Milestone;
use App\Models\PaymentLink;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Creates a PaymentLink with all required fields, linked to a new Contract+Milestone.
     *
     * @param  array<string, mixed>  $overrides
     */
    private function createPaymentLink(User $user, array $overrides = []): PaymentLink
    {
        $contract = Contract::create([
            'user_id' => $user->id,
            'contract_token' => (string) Str::uuid(),
            'project_name' => 'مشروع اختبار',
            'client_name' => 'عميل اختبار',
            'client_email' => 'test@example.com',
            'status' => 'active',
        ]);

        $milestone = Milestone::create([
            'contract_id' => $contract->id,
            'title' => 'مرحلة 1',
            'percentage' => '100.00',
            'amount' => $overrides['amount'] ?? '500.00',
        ]);

        return PaymentLink::create(array_merge([
            'user_id' => $user->id,
            'milestone_id' => $milestone->id,
            'client_name' => 'عميل اختبار',
            'client_email' => 'client@example.com',
            'description' => 'مشروع اختبار',
            'amount' => '500.00',
            'total_amount' => '500.00',
            'currency' => 'EGP',
            'status' => 'pending',
            'public_token' => (string) Str::uuid(),
            'mock_gateway_reference' => 'ref-'.Str::random(8),
        ], $overrides));
    }

    public function test_guests_are_redirected_to_the_login_page(): void
    {
        $response = $this->get(route('dashboard'));
        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_users_can_visit_the_dashboard(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $response = $this->get(route('dashboard'));
        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->has('walletBalances')
            ->where('walletBalances.0.currency', 'EGP')
            ->where('walletBalances.0.balance_cents', 0)
            ->where('walletBalances.0.balance', 0)
            ->where('walletBalances.0.formatted_balance', '0.00'));
    }

    public function test_dashboard_returns_all_required_props(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $this->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard')
                ->has('kpis')
                ->has('recentPaymentLinks')
                ->has('upcomingRenewals')
                ->has('incomeBreakdown')
                ->has('chartData')
                ->has('attentionItems')
                ->has('summaryStats'));
    }

    public function test_kpis_reflect_current_month_income_entries(): void
    {
        Carbon::setTestNow('2026-05-01');

        $user = User::factory()->create(['preferred_currency' => 'EGP']);

        IncomeEntry::factory()->create([
            'user_id' => $user->id,
            'amount' => '3000.00',
            'currency' => 'EGP',
            'date' => '2026-05-01',
        ]);
        IncomeEntry::factory()->create([
            'user_id' => $user->id,
            'amount' => '2000.00',
            'currency' => 'EGP',
            'date' => '2026-05-15',
        ]);

        $this->actingAs($user)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('kpis.this_month_income', 5000)
                ->where('kpis.currency', 'EGP'));

        Carbon::setTestNow();
    }

    public function test_kpis_pending_and_overdue_amounts_come_from_payment_links(): void
    {
        $user = User::factory()->create(['preferred_currency' => 'EGP']);

        $this->createPaymentLink($user, [
            'client_name' => 'عميل معلق',
            'client_email' => 'pending@example.com',
            'amount' => '1500.00',
            'total_amount' => '1500.00',
            'status' => 'pending',
        ]);
        $this->createPaymentLink($user, [
            'client_name' => 'عميل متأخر',
            'client_email' => 'overdue@example.com',
            'amount' => '800.00',
            'total_amount' => '800.00',
            'status' => 'overdue',
        ]);

        $this->actingAs($user)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('kpis.pending_amount', 1500)
                ->where('kpis.pending_count', 1)
                ->where('kpis.overdue_amount', 800)
                ->where('kpis.overdue_count', 1));
    }

    public function test_recent_payment_links_returns_latest_five(): void
    {
        $user = User::factory()->create();

        foreach (range(1, 6) as $i) {
            $this->createPaymentLink($user, [
                'client_name' => "عميل {$i}",
                'client_email' => "client{$i}@example.com",
                'description' => "وصف {$i}",
                'amount' => $i * 100,
                'total_amount' => $i * 100,
            ]);
        }

        $this->actingAs($user)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('recentPaymentLinks', 5));
    }

    public function test_upcoming_renewals_only_returns_future_active_recurring_expenses(): void
    {
        Carbon::setTestNow('2026-05-01');

        $user = User::factory()->create();

        ExpenseCard::factory()->create([
            'user_id' => $user->id,
            'name' => 'Figma Pro',
            'status' => 'active',
            'type' => 'recurring',
            'next_renewal_date' => '2026-05-10',
            'currency' => 'EGP',
        ]);
        ExpenseCard::factory()->create([
            'user_id' => $user->id,
            'name' => 'اشتراك منتهي',
            'status' => 'cancelled',
            'type' => 'recurring',
            'next_renewal_date' => '2026-05-15',
            'currency' => 'EGP',
        ]);
        ExpenseCard::factory()->create([
            'user_id' => $user->id,
            'name' => 'دفعة ماضية',
            'status' => 'active',
            'type' => 'recurring',
            'next_renewal_date' => '2026-04-28',
            'currency' => 'EGP',
        ]);

        $this->actingAs($user)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('upcomingRenewals', 1)
                ->where('upcomingRenewals.0.service', 'Figma Pro')
                ->where('upcomingRenewals.0.days_left', 9));

        Carbon::setTestNow();
    }

    public function test_income_breakdown_groups_by_source_for_current_month(): void
    {
        Carbon::setTestNow('2026-05-01');

        $user = User::factory()->create(['preferred_currency' => 'EGP']);

        IncomeEntry::factory()->create([
            'user_id' => $user->id,
            'amount' => '4000.00',
            'currency' => 'EGP',
            'date' => '2026-05-05',
            'source' => 'payment_link',
        ]);
        IncomeEntry::factory()->create([
            'user_id' => $user->id,
            'amount' => '1000.00',
            'currency' => 'EGP',
            'date' => '2026-05-10',
            'source' => 'manual',
        ]);

        $this->actingAs($user)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('incomeBreakdown.total', 5000)
                ->where('incomeBreakdown.currency', 'EGP')
                ->has('incomeBreakdown.sources', 2)
                ->where('incomeBreakdown.sources.0.source', 'payment_link')
                ->where('incomeBreakdown.sources.0.amount', 4000)
                ->where('incomeBreakdown.sources.0.percentage', 80));

        Carbon::setTestNow();
    }

    public function test_chart_data_has_six_months(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('chartData', 6));
    }

    public function test_summary_stats_count_correctly(): void
    {
        Carbon::setTestNow('2026-05-01');

        $user = User::factory()->create();

        $this->createPaymentLink($user, ['status' => 'pending']);
        ExpenseCard::factory()->create([
            'user_id' => $user->id,
            'status' => 'active',
        ]);
        ExpenseCard::factory()->create([
            'user_id' => $user->id,
            'status' => 'active',
        ]);
        IncomeEntry::factory()->create([
            'user_id' => $user->id,
            'date' => '2026-05-10',
        ]);

        $this->actingAs($user)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('summaryStats.pending_payment_links', 1)
                ->where('summaryStats.active_expense_cards', 2)
                ->where('summaryStats.income_entries_this_month', 1)
                ->where('summaryStats.active_contracts', 1));

        Carbon::setTestNow();
    }

    public function test_attention_items_includes_gmail_alert_when_not_linked(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('attentionItems')
                ->where('attentionItems.0.type', 'gmail_unlinked')
                ->where('attentionItems.0.severity', 'info'));
    }

    public function test_attention_items_includes_overdue_alert_when_payment_link_is_overdue(): void
    {
        $user = User::factory()->create();

        $this->createPaymentLink($user, [
            'client_name' => 'عميل متأخر',
            'client_email' => 'overdue@example.com',
            'status' => 'overdue',
        ]);

        $page = $this->actingAs($user)
            ->get(route('dashboard'))
            ->assertOk();

        $page->assertInertia(fn (Assert $assert) => $assert
            ->has('attentionItems')
            ->where('attentionItems.0.type', 'overdue_payment')
            ->where('attentionItems.0.severity', 'danger'));
    }

    public function test_user_can_dismiss_onboarding_checklist(): void
    {
        $user = User::factory()->create([
            'onboarding_completed' => true,
            'onboarding_checklist_dismissed_at' => null,
        ]);

        $this->actingAs($user)
            ->post(route('dashboard.checklist.dismiss'))
            ->assertRedirect(route('dashboard'));

        $this->assertNotNull($user->refresh()->onboarding_checklist_dismissed_at);
    }
}
