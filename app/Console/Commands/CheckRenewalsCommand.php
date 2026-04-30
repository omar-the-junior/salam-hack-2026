<?php

namespace App\Console\Commands;

use App\Models\ExpenseCard;
use App\Notifications\RenewalAlertNotification;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CheckRenewalsCommand extends Command
{
    protected $signature = 'expenses:check-renewals';

    protected $description = 'Check for upcoming expense renewals and send notifications';

    public function handle(): void
    {
        // Find expenses that have an upcoming renewal, have an alert configured, and haven't been alerted for this cycle yet
        $expenses = ExpenseCard::whereNotNull('next_renewal_date')
            ->where('alert_days_before', '>', 0)
            ->where(function ($query) {
                $query->whereNull('last_alerted_at')
                    ->orWhere('last_alerted_at', '<', DB::raw('next_renewal_date'));
            })
            ->with('user')
            ->get();

        $count = 0;

        foreach ($expenses as $expense) {
            $alertDate = $expense->next_renewal_date->copy()->subDays($expense->alert_days_before);

            // If today is the alert date or past the alert date (and we haven't alerted yet)
            if (now()->startOfDay()->greaterThanOrEqualTo($alertDate->startOfDay())) {
                $expense->user->notify(new RenewalAlertNotification($expense));
                $expense->update(['last_alerted_at' => now()]);
                $count++;
            }
        }

        $this->info("Checked renewals. Sent $count alerts.");
    }
}
