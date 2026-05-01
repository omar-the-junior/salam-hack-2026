<?php

namespace App\Http\Controllers;

use App\Models\ExpenseCard;
use App\Models\PaymentLink;
use App\Models\RenewalAlert;
use App\Models\User;
use App\Models\UserWallet;
use App\Services\Expense\ExpenseCardService;
use App\Services\Income\IncomeDashboardService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class DashboardController extends Controller
{
    public function index(Request $request, IncomeDashboardService $incomeSvc, ExpenseCardService $expenseSvc): Response
    {
        try {
            $user = $request->user();
            $preferredCurrency = $user->preferred_currency ?: 'EGP';

            $items = $this->buildChecklistItems($user->id);
            $allCompleted = collect($items)->every(fn (array $item): bool => $item['checked']);
            $showChecklist = (bool) $request->session()->get('show_checklist', false)
                || (! $allCompleted && $user->onboarding_checklist_dismissed_at === null);

            $walletBalances = [];
            if (Schema::hasTable('user_wallets')) {
                $walletBalances = $user->wallets()
                    ->orderBy('currency')
                    ->get()
                    ->map(fn (UserWallet $wallet) => [
                        'currency' => $wallet->currency,
                        'balance_cents' => $wallet->balance_cents,
                        'balance' => round($wallet->balance_cents / 100, 2),
                        'formatted_balance' => number_format($wallet->balance_cents / 100, 2, '.', ''),
                    ])
                    ->values()
                    ->all();
            }

            return Inertia::render('dashboard', [
                'checklist' => [
                    'show' => $showChecklist,
                    'all_completed' => $allCompleted,
                    'items' => $items,
                    'is_static_fallback' => ! Schema::hasTable('payment_links')
                        || ! Schema::hasTable('expense_cards')
                        || ! Schema::hasTable('connected_accounts'),
                ],
                'walletBalances' => $walletBalances,
                'kpis' => $this->buildKpis($user, $incomeSvc, $preferredCurrency),
                'recentPaymentLinks' => $this->buildRecentPaymentLinks($user),
                'upcomingRenewals' => $this->buildUpcomingRenewals($user),
                'incomeBreakdown' => $this->buildIncomeBreakdown($user, $preferredCurrency),
                'chartData' => $this->buildChartDataLastSixMonths($user, $incomeSvc, $expenseSvc, $preferredCurrency),
                'chartDataThisMonth' => $this->buildChartDataThisMonthByWeek($user, $incomeSvc, $expenseSvc, $preferredCurrency),
                'attentionItems' => $this->buildAttentionItems($user),
                'summaryStats' => $this->buildSummaryStats($user),
            ]);
        } catch (Throwable $e) {
            Log::error(static::class.'@index', [
                'user_id' => auth()->id(),
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    public function dismissChecklist(Request $request): RedirectResponse
    {
        try {
            $request->user()->forceFill([
                'onboarding_checklist_dismissed_at' => now(),
            ])->save();

            return redirect()->route('dashboard');
        } catch (Throwable $e) {
            Log::error(static::class.'@dismissChecklist', [
                'user_id' => auth()->id(),
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * @return array{
     *     this_month_income: float,
     *     this_month_income_change: float|null,
     *     pending_amount: float,
     *     pending_count: int,
     *     overdue_amount: float,
     *     overdue_count: int,
     *     currency: string,
     * }
     */
    private function buildKpis(User $user, IncomeDashboardService $incomeSvc, string $preferredCurrency): array
    {
        $now = Carbon::now();
        $monthStart = $now->copy()->startOfMonth();
        $monthEnd = $now->copy()->endOfMonth();
        $prevMonthStart = $now->copy()->subMonthNoOverflow()->startOfMonth();
        $prevMonthEnd = $now->copy()->subMonthNoOverflow()->endOfMonth();

        $totalsThisMonth = $incomeSvc->monthTotalsByCurrency($user, $monthStart, $monthEnd, null, null, null);
        $totalsPrevMonth = $incomeSvc->monthTotalsByCurrency($user, $prevMonthStart, $prevMonthEnd, null, null, null);

        $thisMonthIncome = $totalsThisMonth[$preferredCurrency] ?? 0.0;
        $prevMonthIncome = $totalsPrevMonth[$preferredCurrency] ?? 0.0;

        $change = null;
        if ($prevMonthIncome > 0) {
            $change = round((($thisMonthIncome - $prevMonthIncome) / $prevMonthIncome) * 100, 1);
        }

        $outstanding = $incomeSvc->paymentLinkOutstanding($user);

        return [
            'this_month_income' => $thisMonthIncome,
            'this_month_income_change' => $change,
            'pending_amount' => $outstanding['pending'],
            'pending_count' => $outstanding['pending_count'],
            'overdue_amount' => $outstanding['overdue'],
            'overdue_count' => $outstanding['overdue_count'],
            'currency' => $preferredCurrency,
        ];
    }

    /**
     * @return list<array{client: string, description: string, amount: float, status: string, initials: string}>
     */
    private function buildRecentPaymentLinks(User $user): array
    {
        if (! Schema::hasTable('payment_links')) {
            return [];
        }

        return PaymentLink::query()
            ->where('user_id', $user->id)
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn (PaymentLink $link) => [
                'client' => $link->client_name ?? '',
                'description' => $link->description ?? '',
                'amount' => (float) $link->total_amount,
                'status' => $link->status,
                'initials' => mb_substr($link->client_name ?? '?', 0, 1),
            ])
            ->values()
            ->all();
    }

    /**
     * @return list<array{id: string, service: string, amount: float, currency: string, category: string, billing_cycle: string, next_renewal_date: string, days_left: int, initials: string, alert_days_before: int}>
     */
    private function buildUpcomingRenewals(User $user): array
    {
        if (! Schema::hasTable('expense_cards')) {
            return [];
        }

        $today = Carbon::today();

        return ExpenseCard::query()
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->where('type', 'recurring')
            ->whereNotNull('next_renewal_date')
            ->where('next_renewal_date', '>=', $today->toDateString())
            ->orderBy('next_renewal_date')
            ->limit(5)
            ->get()
            ->map(fn (ExpenseCard $card) => [
                'id' => $card->id,
                'service' => $card->name,
                'amount' => (float) $card->amount,
                'currency' => $card->currency,
                'category' => $card->category ?? '',
                'billing_cycle' => $card->billing_cycle,
                'next_renewal_date' => $card->next_renewal_date->toDateString(),
                'days_left' => (int) $today->diffInDays($card->next_renewal_date),
                'initials' => mb_substr($card->name, 0, 1),
                'alert_days_before' => (int) $card->alert_days_before,
            ])
            ->values()
            ->all();
    }

    /**
     * @return array{
     *     total: float,
     *     currency: string,
     *     sources: list<array{label: string, amount: float, percentage: float, source: string}>,
     * }
     */
    private function buildIncomeBreakdown(User $user, string $preferredCurrency): array
    {
        if (! Schema::hasTable('income_entries')) {
            return ['total' => 0.0, 'currency' => $preferredCurrency, 'sources' => []];
        }

        $now = Carbon::now();
        $monthStart = $now->copy()->startOfMonth()->toDateString();
        $monthEnd = $now->copy()->endOfMonth()->toDateString();

        /** @var array<string, float> $bySource */
        $bySource = DB::table('income_entries')
            ->where('user_id', $user->id)
            ->where('currency', $preferredCurrency)
            ->whereBetween('date', [$monthStart, $monthEnd])
            ->selectRaw('source, SUM(amount) as total')
            ->groupBy('source')
            ->pluck('total', 'source')
            ->map(fn ($v) => round((float) $v, 2))
            ->all();

        $total = array_sum($bySource);

        $sourceLabels = [
            'payment_link' => 'روابط الدفع',
            'manual' => 'إدخال يدوي',
            'email_scan' => 'مستخرج من الإيميل',
            'upwork' => 'Upwork',
            'fiverr' => 'Fiverr',
            'bank_transfer' => 'تحويل بنكي',
            'fawry' => 'فوري',
            'vodafone_cash' => 'فودافون كاش',
            'other' => 'أخرى',
        ];

        $sources = [];
        foreach ($bySource as $source => $amount) {
            $sources[] = [
                'source' => $source,
                'label' => $sourceLabels[$source] ?? $source,
                'amount' => $amount,
                'percentage' => $total > 0 ? round(($amount / $total) * 100, 1) : 0.0,
            ];
        }

        usort($sources, fn (array $a, array $b) => $b['amount'] <=> $a['amount']);

        return [
            'total' => round($total, 2),
            'currency' => $preferredCurrency,
            'sources' => array_values($sources),
        ];
    }

    /**
     * @return list<array{month: string, income: float, expenses: float}>
     */
    private function buildChartDataLastSixMonths(User $user, IncomeDashboardService $incomeSvc, ExpenseCardService $expenseSvc, string $preferredCurrency): array
    {
        $incomeChart = $incomeSvc->chartLastSixMonths($user, $preferredCurrency);

        return $this->mergeIncomePeriodsWithMonthlyBurn(
            $incomeChart['periods'],
            $expenseSvc,
            $user,
            $preferredCurrency,
            splitMonthlyBurnAcrossBars: false,
        );
    }

    /**
     * @return list<array{month: string, income: float, expenses: float}>
     */
    private function buildChartDataThisMonthByWeek(User $user, IncomeDashboardService $incomeSvc, ExpenseCardService $expenseSvc, string $preferredCurrency): array
    {
        $incomeChart = $incomeSvc->chartThisMonthByWeek($user, $preferredCurrency);

        return $this->mergeIncomePeriodsWithMonthlyBurn(
            $incomeChart['periods'],
            $expenseSvc,
            $user,
            $preferredCurrency,
            splitMonthlyBurnAcrossBars: true,
        );
    }

    /**
     * @param  array<int, array{period: string, value: float}>  $periods
     * @return list<array{month: string, income: float, expenses: float}>
     */
    private function mergeIncomePeriodsWithMonthlyBurn(
        array $periods,
        ExpenseCardService $expenseSvc,
        User $user,
        string $preferredCurrency,
        bool $splitMonthlyBurnAcrossBars,
    ): array {
        $monthlyBurn = $expenseSvc->monthlyBurnByCurrency($user);
        $monthlyExpenses = round((float) ($monthlyBurn[$preferredCurrency] ?? 0.0), 2);
        $barCount = max(count($periods), 1);
        $expensesPerBar = $splitMonthlyBurnAcrossBars
            ? round($monthlyExpenses / $barCount, 2)
            : $monthlyExpenses;

        return array_map(fn (array $period) => [
            'month' => $period['period'],
            'income' => $period['value'],
            'expenses' => $expensesPerBar,
        ], $periods);
    }

    /**
     * @return list<array{title: string, description: string, action: string, severity: string, type: string, alertId?: string}>
     */
    private function buildAttentionItems(User $user): array
    {
        $items = [];

        if (Schema::hasTable('payment_links')) {
            $overdueLink = PaymentLink::query()
                ->where('user_id', $user->id)
                ->where('status', 'overdue')
                ->latest('updated_at')
                ->first(['client_name', 'total_amount', 'currency']);

            if ($overdueLink !== null) {
                $amount = number_format((float) $overdueLink->total_amount, 0);
                $items[] = [
                    'title' => 'رابط دفع متأخر',
                    'description' => ($overdueLink->client_name ?? 'عميل').' · '.$amount.' '.$overdueLink->currency,
                    'action' => 'تذكير',
                    'severity' => 'danger',
                    'type' => 'overdue_payment',
                ];
            }
        }

        $recentAlert = RenewalAlert::query()
            ->where('user_id', $user->id)
            ->whereNull('dismissed_at')
            ->with('expenseCard')
            ->latest('alerted_at')
            ->first();

        if ($recentAlert !== null && $recentAlert->expenseCard !== null) {
            $soonRenewal = $recentAlert->expenseCard;
            $amount = number_format((float) $soonRenewal->amount, 0);
            $items[] = [
                'title' => 'اشتراك يتجدد قريبًا',
                'description' => $soonRenewal->name.' · '.$amount.' '.$soonRenewal->currency,
                'action' => 'إلغاء',
                'severity' => 'warning',
                'type' => 'renewal_soon',
                'alertId' => $recentAlert->id,
            ];
        }

        $hasGmail = Schema::hasTable('connected_accounts') && DB::table('connected_accounts')
            ->where('user_id', $user->id)
            ->whereIn('provider', ['google', 'gmail'])
            ->exists();

        if (! $hasGmail) {
            $items[] = [
                'title' => 'Gmail غير مربوط',
                'description' => 'اربط البريد لاكتشاف الاشتراكات تلقائيًا',
                'action' => 'ربط',
                'severity' => 'info',
                'type' => 'gmail_unlinked',
            ];
        }

        if (Schema::hasTable('expense_cards')) {
            $pendingReviewCount = (int) ExpenseCard::query()
                ->where('user_id', $user->id)
                ->where('auto_detected', true)
                ->where('status', 'pending_review')
                ->count();

            if ($pendingReviewCount > 0) {
                $items[] = [
                    'title' => $pendingReviewCount.' اشتراكات بانتظار المراجعة',
                    'description' => 'اكتشفها مساعد الذكاء الاصطناعي',
                    'action' => 'مراجعة',
                    'severity' => 'success',
                    'type' => 'pending_review',
                ];
            }
        }

        return $items;
    }

    /**
     * @return array{
     *     pending_payment_links: int,
     *     active_contracts: int,
     *     income_entries_this_month: int,
     *     active_expense_cards: int,
     * }
     */
    private function buildSummaryStats(User $user): array
    {
        $now = Carbon::now();

        $pendingPaymentLinks = Schema::hasTable('payment_links')
            ? (int) DB::table('payment_links')
                ->where('user_id', $user->id)
                ->whereIn('status', ['pending', 'overdue'])
                ->count()
            : 0;

        $activeContracts = Schema::hasTable('contracts')
            ? (int) DB::table('contracts')
                ->where('user_id', $user->id)
                ->where('status', 'active')
                ->count()
            : 0;

        $incomeEntriesThisMonth = Schema::hasTable('income_entries')
            ? (int) DB::table('income_entries')
                ->where('user_id', $user->id)
                ->whereBetween('date', [
                    $now->copy()->startOfMonth()->toDateString(),
                    $now->copy()->endOfMonth()->toDateString(),
                ])
                ->count()
            : 0;

        $activeExpenseCards = Schema::hasTable('expense_cards')
            ? (int) DB::table('expense_cards')
                ->where('user_id', $user->id)
                ->where('status', 'active')
                ->count()
            : 0;

        return [
            'pending_payment_links' => $pendingPaymentLinks,
            'active_contracts' => $activeContracts,
            'income_entries_this_month' => $incomeEntriesThisMonth,
            'active_expense_cards' => $activeExpenseCards,
        ];
    }

    /**
     * @return array<int, array{key: string, label: string, href: string, checked: bool, cta: string}>
     */
    private function buildChecklistItems(string $userId): array
    {
        $hasPaymentLink = Schema::hasTable('payment_links')
            ? DB::table('payment_links')->where('user_id', $userId)->exists()
            : false;
        $hasContract = Schema::hasTable('contracts')
            ? DB::table('contracts')->where('user_id', $userId)->exists()
            : false;
        $hasExpense = Schema::hasTable('expense_cards')
            ? DB::table('expense_cards')->where('user_id', $userId)->exists()
            : false;
        $hasGmailConnection = Schema::hasTable('connected_accounts')
            ? DB::table('connected_accounts')
                ->where('user_id', $userId)
                ->whereIn('provider', ['google', 'gmail'])
                ->exists()
            : false;

        return [
            [
                'key' => 'account',
                'label' => 'تم إنشاء الحساب',
                'href' => route('dashboard'),
                'checked' => true,
                'cta' => 'مكتمل',
            ],
            [
                'key' => 'payment_link',
                'label' => 'أنشئ أول رابط دفع',
                'href' => route('payment-links.create'),
                'checked' => $hasPaymentLink,
                'cta' => $hasPaymentLink ? 'مكتمل' : 'ابدأ',
            ],
            [
                'key' => 'contract',
                'label' => 'أنشئ عقد مشروع',
                'href' => route('contracts.index'),
                'checked' => $hasContract,
                'cta' => $hasContract ? 'مكتمل' : 'ابدأ',
            ],
            [
                'key' => 'expense',
                'label' => 'أضف مصروف/اشتراك',
                'href' => route('expenses.create'),
                'checked' => $hasExpense,
                'cta' => $hasExpense ? 'مكتمل' : 'ابدأ',
            ],
            [
                'key' => 'gmail',
                'label' => 'اربط Gmail',
                'href' => route('email-scanner.index'),
                'checked' => $hasGmailConnection,
                'cta' => $hasGmailConnection ? 'مكتمل' : 'ربط',
            ],
        ];
    }
}
