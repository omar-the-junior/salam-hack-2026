<?php

namespace App\Services\Expense;

use App\Models\ExpenseCard;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

class ExpenseCardService
{
    /**
     * @return array<string, float>
     */
    public function monthlyBurnByCurrency(User $user): array
    {
        return $this->aggregateRecurringActive($user, function (ExpenseCard $card): float {
            return match ($card->billing_cycle) {
                'monthly' => (float) $card->amount,
                'annual' => (float) $card->amount / 12,
                default => 0.0,
            };
        });
    }

    /**
     * @return array<string, float>
     */
    public function annualCommitmentByCurrency(User $user): array
    {
        return $this->aggregateRecurringActive($user, function (ExpenseCard $card): float {
            return match ($card->billing_cycle) {
                'monthly' => (float) $card->amount * 12,
                'annual' => (float) $card->amount,
                default => 0.0,
            };
        });
    }

    /**
     * Dashboard headline figures for UC-007 (active recurring only; one-time excluded).
     *
     * @return array{
     *     preferred_currency: string,
     *     monthly_burn: float,
     *     annual_commitment: float,
     *     by_currency: list<array{currency: string, monthly_burn: float, annual_commitment: float}>,
     * }
     */
    public function dashboardSummary(User $user, string $preferredCurrency): array
    {
        $monthly = $this->monthlyBurnByCurrency($user);
        $annual = $this->annualCommitmentByCurrency($user);

        $currencies = array_values(array_unique(array_merge(array_keys($monthly), array_keys($annual))));
        sort($currencies);

        $byCurrency = [];
        foreach ($currencies as $currency) {
            $byCurrency[] = [
                'currency' => $currency,
                'monthly_burn' => round((float) ($monthly[$currency] ?? 0.0), 2),
                'annual_commitment' => round((float) ($annual[$currency] ?? 0.0), 2),
            ];
        }

        return [
            'preferred_currency' => $preferredCurrency,
            'monthly_burn' => round((float) ($monthly[$preferredCurrency] ?? 0.0), 2),
            'annual_commitment' => round((float) ($annual[$preferredCurrency] ?? 0.0), 2),
            'by_currency' => $byCurrency,
        ];
    }

    /**
     * @param  callable(ExpenseCard): float  $contribution
     * @return array<string, float>
     */
    private function aggregateRecurringActive(User $user, callable $contribution): array
    {
        $totals = [];

        ExpenseCard::query()
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->where('type', 'recurring')
            ->each(function (ExpenseCard $card) use (&$totals, $contribution): void {
                $currency = $card->currency;
                $add = $contribution($card);
                if ($add === 0.0) {
                    return;
                }
                $totals[$currency] = ($totals[$currency] ?? 0.0) + $add;
            });

        return $totals;
    }

    /**
     * @return Collection<int, ExpenseCard>
     */
    public function filteredCards(
        User $user,
        ?string $status,
        ?string $category,
        ?string $billingCycle,
        ?string $search,
        string $sort,
    ): Collection {
        $query = ExpenseCard::query()->where('user_id', $user->id);

        if ($status !== null && $status !== 'all') {
            $query->where('status', $status);
        }

        if ($category !== null && $category !== 'all') {
            $query->where('category', $category);
        }

        if ($billingCycle !== null && $billingCycle !== 'all') {
            $query->where('billing_cycle', $billingCycle);
        }

        if ($search !== null && $search !== '') {
            $query->where('name', 'like', '%'.$search.'%');
        }

        $query = match ($sort) {
            'amount' => $query->orderByDesc('amount')->orderBy('name'),
            'name' => $query->orderBy('name'),
            default => $query->orderByRaw('CASE WHEN next_renewal_date IS NULL THEN 1 ELSE 0 END')
                ->orderBy('next_renewal_date'),
        };

        return $query->get();
    }

    /**
     * @return array<string, mixed>
     */
    public function cardForFrontend(ExpenseCard $card): array
    {
        return [
            'id' => $card->id,
            'name' => $card->name,
            'amount' => (float) $card->amount,
            'currency' => $card->currency,
            'status' => $card->status,
            'category' => $card->category,
            'type' => $card->type,
            'billingCycle' => $card->billing_cycle,
            'nextRenewalDate' => $card->next_renewal_date?->toDateString(),
            'autoDetected' => $card->auto_detected,
            'cancelUrl' => $card->cancel_url,
            'cancelInstructions' => ($card->cancel_instructions !== null && $card->cancel_instructions !== '')
                ? $card->cancel_instructions
                : null,
            'notes' => $card->notes ?? '',
        ];
    }
}
