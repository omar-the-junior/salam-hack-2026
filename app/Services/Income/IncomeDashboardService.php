<?php

namespace App\Services\Income;

use App\Models\IncomeEntry;
use App\Models\PaymentLink;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class IncomeDashboardService
{
    /** @var array<string, string> slug => stored category label */
    public const CATEGORY_SLUG_TO_LABEL = [
        'freelance' => 'Freelance',
        'product_sale' => 'Product Sale',
        'consulting' => 'Consulting',
        'content' => 'Content',
        'other' => 'Other',
    ];

    /**
     * @return array{currency:string, periods:array<int, array{period:string,value:float}>}
     */
    public function chartThisMonthByWeek(User $user, string $preferredCurrency): array
    {
        $monthStart = Carbon::now()->locale('ar')->startOfMonth();
        $monthEnd = Carbon::now()->locale('ar')->endOfMonth();

        return $this->chartByWeekBetween($user, $preferredCurrency, $monthStart, $monthEnd);
    }

    /**
     * @return array{currency:string, periods:array<int, array{period:string,value:float}>}
     */
    public function chartLastSixMonths(User $user, string $preferredCurrency): array
    {
        $end = Carbon::now()->locale('ar')->startOfMonth();
        $start = $end->copy()->subMonthsNoOverflow(5);

        $rows = IncomeEntry::query()
            ->where('user_id', $user->id)
            ->where('currency', $preferredCurrency)
            ->where('date', '>=', $start->toDateString())
            ->where('date', '<', $end->copy()->addMonth()->toDateString())
            ->get(['date', 'amount']);

        $totals = [];
        foreach ($rows as $row) {
            $m = $row->date->copy()->startOfMonth()->format('Y-m');
            $totals[$m] = ($totals[$m] ?? 0.0) + (float) $row->amount;
        }

        $periods = [];
        $cursor = $start->copy();
        while ($cursor->lte($end)) {
            $key = $cursor->format('Y-m');
            $periods[] = [
                'period' => $cursor->locale('ar')->translatedFormat('F Y'),
                'value' => round((float) ($totals[$key] ?? 0.0), 2),
            ];
            $cursor->addMonth();
        }

        return [
            'currency' => $preferredCurrency,
            'periods' => $periods,
        ];
    }

    /**
     * @return array<int, array{slug:string,label:string}>
     */
    public function categoryFilterOptions(User $user): array
    {
        $distinct = IncomeEntry::query()
            ->where('user_id', $user->id)
            ->whereNotNull('category')
            ->distinct()
            ->pluck('category');

        $labels = [];
        foreach ($distinct as $label) {
            $slug = $this->labelToSlug((string) $label);
            if ($slug !== '') {
                $labels[$slug] = (string) $label;
            }
        }

        foreach (self::CATEGORY_SLUG_TO_LABEL as $slug => $label) {
            $labels[$slug] = $label;
        }

        $out = [];
        foreach ($labels as $slug => $label) {
            $out[] = ['slug' => $slug, 'label' => $label];
        }

        usort($out, fn (array $a, array $b) => strcmp($a['label'], $b['label']));

        return $out;
    }

    /**
     * Base query for dashboard list, totals, and exports (same filters, no ordering).
     *
     * @param  ?string  $categorySlug  Slug from UI or `'all'`.
     * @param  ?string  $search  Trimmed search string or null.
     */
    public function filteredIncomeEntriesQuery(
        User $user,
        Carbon $monthStart,
        Carbon $monthEnd,
        ?string $sourceFilter,
        ?string $categorySlug,
        ?string $search,
    ): Builder {
        $query = IncomeEntry::query()
            ->where('user_id', $user->id)
            ->where('date', '>=', $monthStart->toDateString())
            ->where('date', '<', $monthEnd->copy()->addDay()->toDateString());

        $this->applySourceFilter($query, $sourceFilter);
        $this->applyCategorySlugFilter($query, $categorySlug);
        $this->applySearchFilter($query, $search);

        return $query;
    }

    /**
     * @return LengthAwarePaginator<int, IncomeEntry>
     */
    public function paginatedEntries(
        User $user,
        Carbon $monthStart,
        Carbon $monthEnd,
        ?string $sourceFilter,
        ?string $categorySlug,
        ?string $search,
        int $perPage,
    ): LengthAwarePaginator {
        $query = $this->filteredIncomeEntriesQuery(
            $user,
            $monthStart,
            $monthEnd,
            $sourceFilter,
            $categorySlug,
            $search,
        )
            ->orderByDesc('date')
            ->orderByDesc('id');

        return $query->paginate($perPage)->withQueryString();
    }

    /**
     * @return array<string, float>
     */
    public function monthTotalsByCurrency(
        User $user,
        Carbon $monthStart,
        Carbon $monthEnd,
        ?string $sourceFilter,
        ?string $categorySlug,
        ?string $search,
    ): array {
        $query = $this->filteredIncomeEntriesQuery(
            $user,
            $monthStart,
            $monthEnd,
            $sourceFilter,
            $categorySlug,
            $search,
        );

        /** @var Collection<string, string|int|float|null> $raw */
        $raw = $query
            ->selectRaw('currency, SUM(amount) as total')
            ->groupBy('currency')
            ->pluck('total', 'currency');

        $out = [];
        foreach ($raw as $currency => $total) {
            $out[(string) $currency] = round((float) $total, 2);
        }

        return $out;
    }

    public static function slugToCategoryLabel(?string $slug): ?string
    {
        if ($slug === null || $slug === '') {
            return null;
        }

        return self::CATEGORY_SLUG_TO_LABEL[$slug] ?? null;
    }

    public static function slugToSourceLabel(?string $slug): ?string
    {
        if ($slug === null || $slug === '') {
            return null;
        }

        /** @var array<string, string> $map */
        $map = [
            'upwork' => 'Upwork',
            'fiverr' => 'Fiverr',
            'bank_transfer' => 'Bank transfer',
            'fawry' => 'Fawry',
            'vodafone_cash' => 'Vodafone Cash',
            'other' => 'Other',
        ];

        return $map[$slug] ?? null;
    }

    private function applySourceFilter(Builder $query, ?string $sourceFilter): void
    {
        if ($sourceFilter === null || $sourceFilter === '' || $sourceFilter === 'all') {
            return;
        }

        $query->where('source', $sourceFilter);
    }

    private function applyCategorySlugFilter(Builder $query, ?string $categorySlug): void
    {
        if ($categorySlug === null || $categorySlug === '' || $categorySlug === 'all') {
            return;
        }

        if (! isset(self::CATEGORY_SLUG_TO_LABEL[$categorySlug])) {
            return;
        }

        $query->where('category', self::CATEGORY_SLUG_TO_LABEL[$categorySlug]);
    }

    private function applySearchFilter(Builder $query, ?string $search): void
    {
        if ($search === null || $search === '') {
            return;
        }

        $like = '%'.$search.'%';
        $query->where(function (Builder $q) use ($like): void {
            $q->where('client_name', 'like', $like)
                ->orWhere('description', 'like', $like);
        });
    }

    private function labelToSlug(string $label): string
    {
        foreach (self::CATEGORY_SLUG_TO_LABEL as $slug => $l) {
            if ($l === $label) {
                return $slug;
            }
        }

        return '';
    }

    /**
     * @return array{currency:string, periods:array<int, array{period:string,value:float}>}
     */
    private function chartByWeekBetween(User $user, string $preferredCurrency, Carbon $from, Carbon $to): array
    {
        $rows = IncomeEntry::query()
            ->where('user_id', $user->id)
            ->where('currency', $preferredCurrency)
            ->where('date', '>=', $from->toDateString())
            ->where('date', '<', $to->copy()->addDay()->toDateString())
            ->get(['date', 'amount']);

        /** @var array<string, float> $bucket */
        $bucket = [];

        foreach ($rows as $row) {
            $weekStart = $row->date->copy()->startOfWeek(Carbon::MONDAY);
            $key = $weekStart->toDateString();
            $bucket[$key] = ($bucket[$key] ?? 0.0) + (float) $row->amount;
        }

        $periods = [];
        $monday = $from->copy()->startOfWeek(Carbon::MONDAY);

        while ($monday->lte($to)) {
            $key = $monday->toDateString();
            $weekEnd = $monday->copy()->endOfWeek(Carbon::SUNDAY);
            if ($weekEnd->gt($to)) {
                $weekEnd = $to->copy();
            }

            $periods[] = [
                'period' => $monday->isoFormat('D MMM').' – '.$weekEnd->isoFormat('D MMM'),
                'value' => round((float) ($bucket[$key] ?? 0.0), 2),
            ];
            $monday = $monday->copy()->addWeek();
        }

        if ($periods === []) {
            $periods[] = ['period' => $from->locale('ar')->translatedFormat('F'), 'value' => 0.0];
        }

        return [
            'currency' => $preferredCurrency,
            'periods' => $periods,
        ];
    }

    /**
     * @return array{pending:float, overdue:float, currency:string|null, pending_count:int, overdue_count:int}
     */
    public function paymentLinkOutstanding(User $user): array
    {
        $preferred = $user->preferred_currency ?: 'EGP';

        $pending = (float) PaymentLink::query()
            ->where('user_id', $user->id)
            ->where('status', 'pending')
            ->where('currency', $preferred)
            ->sum('total_amount');

        $overdue = (float) PaymentLink::query()
            ->where('user_id', $user->id)
            ->where('status', 'overdue')
            ->where('currency', $preferred)
            ->sum('total_amount');

        $pendingCount = (int) PaymentLink::query()
            ->where('user_id', $user->id)
            ->where('status', 'pending')
            ->where('currency', $preferred)
            ->count();

        $overdueCount = (int) PaymentLink::query()
            ->where('user_id', $user->id)
            ->where('status', 'overdue')
            ->where('currency', $preferred)
            ->count();

        return [
            'pending' => round($pending, 2),
            'overdue' => round($overdue, 2),
            'currency' => $preferred,
            'pending_count' => $pendingCount,
            'overdue_count' => $overdueCount,
        ];
    }
}
