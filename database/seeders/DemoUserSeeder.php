<?php

namespace Database\Seeders;

use App\Models\ConnectedAccount;
use App\Models\Contract;
use App\Models\Customer;
use App\Models\EmailScan;
use App\Models\EmailScanResult;
use App\Models\ExpenseCard;
use App\Models\IncomeEntry;
use App\Models\Milestone;
use App\Models\PaymentLink;
use App\Models\PaymentTransaction;
use App\Models\RenewalAlert;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DemoUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $user = User::query()->updateOrCreate(
            ['email' => 'demo@example.com'],
            [
                'name' => 'Demo User',
                'password' => Hash::make('password'),
                'preferred_currency' => 'EGP',
                'role' => 'freelancer',
                'onboarding_completed' => true,
                'email_verified_at' => now(),
            ],
        );

        ConnectedAccount::query()->updateOrCreate(
            ['user_id' => $user->id, 'provider' => 'gmail'],
            [
                'email' => $user->email,
                'access_token' => 'demo-access-token',
                'refresh_token' => 'demo-refresh-token',
                'token_expires_at' => now()->addDays(30),
            ],
        );

        $customer = Customer::query()->updateOrCreate(
            ['user_id' => $user->id, 'email' => 'acme.client@example.com'],
            [
                'name' => 'ACME Client',
                'phone' => '+201001234567',
                'notes' => 'Primary test customer.',
            ],
        );

        $contract = Contract::query()->updateOrCreate(
            ['contract_token' => 'demo-contract-token'],
            [
                'user_id' => $user->id,
                'project_name' => 'Website Revamp',
                'description' => 'Demo contract for dashboard and contract screens.',
                'client_name' => 'ACME Client',
                'client_email' => $customer->email,
                'total_value' => 12000,
                'tax_rate' => 14,
                'tax_amount' => 1680,
                'grand_total' => 13680,
                'currency' => 'EGP',
                'start_date' => Carbon::today()->subDays(15),
                'end_date' => Carbon::today()->addDays(45),
                'terms' => '50% upfront, 50% on delivery.',
                'status' => 'active',
            ],
        );

        $milestoneOne = Milestone::query()->updateOrCreate(
            ['contract_id' => $contract->id, 'title' => 'Discovery & Wireframes'],
            [
                'percentage' => 40,
                'amount' => 5472,
                'due_date' => Carbon::today()->subDays(7),
                'status' => 'submitted',
            ],
        );

        $milestoneTwo = Milestone::query()->updateOrCreate(
            ['contract_id' => $contract->id, 'title' => 'Implementation'],
            [
                'percentage' => 60,
                'amount' => 8208,
                'due_date' => Carbon::today()->addDays(14),
                'status' => 'in_progress',
            ],
        );

        $pendingLink = PaymentLink::query()->updateOrCreate(
            ['public_token' => 'demo-payment-link-pending'],
            [
                'user_id' => $user->id,
                'customer_id' => $customer->id,
                'milestone_id' => $milestoneTwo->id,
                'amount' => 3600,
                'tax_rate' => 14,
                'tax_amount' => 504,
                'total_amount' => 4104,
                'currency' => 'EGP',
                'description' => 'Implementation milestone payment',
                'client_name' => $customer->name,
                'client_email' => $customer->email,
                'due_date' => Carbon::today()->addDays(7),
                'status' => 'pending',
                'source' => 'milestone',
                'mock_gateway_reference' => 'demo-ref-pending',
                'mock_provider' => 'mock-sandbox',
            ],
        );

        $overdueLink = PaymentLink::query()->updateOrCreate(
            ['public_token' => 'demo-payment-link-overdue'],
            [
                'user_id' => $user->id,
                'customer_id' => $customer->id,
                'milestone_id' => $milestoneOne->id,
                'amount' => 2000,
                'tax_rate' => 14,
                'tax_amount' => 280,
                'total_amount' => 2280,
                'currency' => 'EGP',
                'description' => 'Discovery milestone payment',
                'client_name' => 'Legacy Client',
                'client_email' => 'legacy.client@example.com',
                'due_date' => Carbon::today()->subDays(5),
                'status' => 'overdue',
                'source' => 'milestone',
                'mock_gateway_reference' => 'demo-ref-overdue',
                'mock_provider' => 'mock-sandbox',
            ],
        );

        PaymentTransaction::query()->updateOrCreate(
            ['paymob_transaction_id' => 'demo-paid-transaction'],
            [
                'payment_link_id' => $pendingLink->id,
                'user_id' => $user->id,
                'paymob_order_id' => 'demo-order-1',
                'amount_cents' => 410400,
                'currency' => 'EGP',
                'status' => 'paid',
                'payment_method' => 'card',
                'card_last_four' => '4242',
                'card_brand' => 'visa',
                'gateway_response' => ['ok' => true, 'source' => 'demo'],
                'hmac_verified' => true,
                'paid_at' => now()->subDays(2),
            ],
        );

        $this->seedIncomeEntries($user);

        $renewingExpense = ExpenseCard::query()->updateOrCreate(
            ['user_id' => $user->id, 'name' => 'Figma Pro'],
            [
                'category' => 'saas',
                'type' => 'recurring',
                'amount' => 480,
                'currency' => 'EGP',
                'billing_cycle' => 'monthly',
                'next_renewal_date' => Carbon::today()->addDays(4),
                'started_at' => Carbon::today()->subMonths(8),
                'status' => 'active',
                'cancel_url' => 'https://www.figma.com/settings/billing',
                'cancel_instructions' => 'Go to Figma billing settings and cancel plan.',
                'notes' => 'Design team subscription.',
                'alert_days_before' => 7,
                'auto_detected' => true,
                'source_email_id' => 'demo-email-renewal-1',
            ],
        );

        ExpenseCard::query()->updateOrCreate(
            ['user_id' => $user->id, 'name' => 'Google Workspace'],
            [
                'category' => 'tool',
                'type' => 'recurring',
                'amount' => 250,
                'currency' => 'EGP',
                'billing_cycle' => 'monthly',
                'next_renewal_date' => Carbon::today()->addDays(12),
                'started_at' => Carbon::today()->subMonths(10),
                'status' => 'active',
                'cancel_url' => 'https://admin.google.com',
                'cancel_instructions' => null,
                'notes' => null,
                'alert_days_before' => 5,
                'auto_detected' => false,
                'source_email_id' => null,
            ],
        );

        RenewalAlert::query()->updateOrCreate(
            ['user_id' => $user->id, 'expense_card_id' => $renewingExpense->id],
            [
                'alerted_at' => now()->subHours(8),
                'dismissed_at' => null,
            ],
        );

        $scan = EmailScan::query()->updateOrCreate(
            ['user_id' => $user->id, 'status' => 'completed'],
            [
                'started_at' => now()->subMinutes(20),
                'completed_at' => now()->subMinutes(15),
                'found_count' => 2,
                'error_message' => null,
                'created_at' => now()->subMinutes(20),
            ],
        );

        EmailScanResult::query()->updateOrCreate(
            ['raw_email_id' => 'demo-raw-email-1'],
            [
                'email_scan_id' => $scan->id,
                'user_id' => $user->id,
                'service_name' => 'Figma',
                'amount' => 12,
                'currency' => 'USD',
                'billing_cycle' => 'monthly',
                'billing_date' => Carbon::today()->addDays(4),
                'confidence' => 'high',
                'raw_email_subject' => 'Your Figma monthly invoice',
                'raw_email_snippet' => 'Invoice #1001 for your subscription.',
                'status' => 'approved',
                'created_at' => now()->subMinutes(18),
            ],
        );

        EmailScanResult::query()->updateOrCreate(
            ['raw_email_id' => 'demo-raw-email-2'],
            [
                'email_scan_id' => $scan->id,
                'user_id' => $user->id,
                'service_name' => 'Notion',
                'amount' => 8,
                'currency' => 'USD',
                'billing_cycle' => 'monthly',
                'billing_date' => Carbon::today()->addDays(11),
                'confidence' => 'medium',
                'raw_email_subject' => 'Notion receipt',
                'raw_email_snippet' => 'Thanks for paying for Notion.',
                'status' => 'pending',
                'created_at' => now()->subMinutes(17),
            ],
        );

        // Keep seed idempotent by removing old placeholder transactions if present.
        PaymentTransaction::query()
            ->where('payment_link_id', $overdueLink->id)
            ->whereNull('paymob_transaction_id')
            ->delete();
    }

    private function seedIncomeEntries(User $user): void
    {
        $series = [
            ['months_ago' => 0, 'day' => 3, 'amount' => 5000, 'source' => 'payment_link', 'label' => 'Payment link'],
            ['months_ago' => 0, 'day' => 11, 'amount' => 1800, 'source' => 'manual', 'label' => 'Bank transfer'],
            ['months_ago' => 1, 'day' => 8, 'amount' => 4200, 'source' => 'payment_link', 'label' => 'Payment link'],
            ['months_ago' => 2, 'day' => 9, 'amount' => 3500, 'source' => 'manual', 'label' => 'Manual'],
            ['months_ago' => 3, 'day' => 6, 'amount' => 3900, 'source' => 'payment_link', 'label' => 'Payment link'],
            ['months_ago' => 4, 'day' => 14, 'amount' => 4100, 'source' => 'manual', 'label' => 'Bank transfer'],
            ['months_ago' => 5, 'day' => 5, 'amount' => 4700, 'source' => 'payment_link', 'label' => 'Payment link'],
        ];

        foreach ($series as $item) {
            $date = Carbon::now()
                ->subMonthsNoOverflow($item['months_ago'])
                ->startOfMonth()
                ->addDays($item['day'] - 1)
                ->toDateString();

            IncomeEntry::query()->updateOrCreate(
                ['reference_id' => 'demo-income-'.$item['months_ago'].'-'.$item['day']],
                [
                    'user_id' => $user->id,
                    'amount' => $item['amount'],
                    'currency' => 'EGP',
                    'date' => $date,
                    'source' => $item['source'],
                    'source_label' => $item['label'],
                    'client_name' => 'ACME Client',
                    'category' => 'Freelance',
                    'description' => 'Demo seeded income entry '.Str::lower($item['source']),
                ],
            );
        }
    }
}
