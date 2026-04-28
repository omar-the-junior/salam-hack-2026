<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $items = $this->buildChecklistItems($user->id);
        $allCompleted = collect($items)->every(fn (array $item): bool => $item['checked']);
        $showChecklist = (bool) $request->session()->get('show_checklist', false)
            || (! $allCompleted && $user->onboarding_checklist_dismissed_at === null);

        return Inertia::render('dashboard', [
            'checklist' => [
                'show' => $showChecklist,
                'all_completed' => $allCompleted,
                'items' => $items,
                'is_static_fallback' => ! Schema::hasTable('payment_links')
                    || ! Schema::hasTable('expense_cards')
                    || ! Schema::hasTable('connected_accounts'),
            ],
        ]);
    }

    public function dismissChecklist(Request $request): RedirectResponse
    {
        $request->user()->forceFill([
            'onboarding_checklist_dismissed_at' => now(),
        ])->save();

        return redirect()->route('dashboard');
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
