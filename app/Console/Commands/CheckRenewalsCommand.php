<?php

namespace App\Console\Commands;

use App\Models\ExpenseCard;
use App\Models\RenewalAlert;
use App\Notifications\RenewalAlertNotification;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Throwable;

class CheckRenewalsCommand extends Command
{
    protected $signature = 'renewals:check';

    protected $description = 'Check for upcoming expense renewals and send alerts (UC-011)';

    public function handle(): void
    {
        $today = now()->startOfDay();

        /**
         * Broad SQL filter: active recurring cards with an upcoming (not past) renewal date
         * that haven't been alerted yet in the current cycle.
         *
         * Idempotency: last_alerted_at IS NULL OR last_alerted_at < (next_renewal_date - alert_days_before)
         * ensures we don't re-alert within the same cycle window.
         *
         * Per-card window check (next_renewal_date <= today + alert_days_before) is done in PHP
         * because alert_days_before differs per card.
         */
        $candidates = ExpenseCard::query()
            ->where('status', 'active')
            ->where('type', 'recurring')
            ->whereNotNull('next_renewal_date')
            ->where('next_renewal_date', '>=', $today->toDateString())
            ->where(function ($query): void {
                $query->whereNull('last_alerted_at')
                    ->orWhereRaw("last_alerted_at < DATE(next_renewal_date, '-' || alert_days_before || ' days')");
            })
            ->with('user')
            ->get();

        $count = 0;

        foreach ($candidates as $expense) {
            $alertStartDate = $expense->next_renewal_date->copy()->subDays($expense->alert_days_before)->startOfDay();

            if ($today->lessThan($alertStartDate)) {
                continue;
            }

            try {
                $expense->user->notify(new RenewalAlertNotification($expense));

                RenewalAlert::create([
                    'user_id' => $expense->user_id,
                    'expense_card_id' => $expense->id,
                    'alerted_at' => now(),
                ]);

                $expense->update(['last_alerted_at' => now()]);

                $count++;
            } catch (Throwable $e) {
                Log::error('renewals:check failed for card', [
                    'expense_card_id' => $expense->id,
                    'exception' => $e::class,
                    'message' => $e->getMessage(),
                ]);
            }
        }

        $this->info("Checked renewals. Sent {$count} alert(s).");
    }
}
