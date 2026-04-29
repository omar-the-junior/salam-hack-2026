<?php

namespace App\Http\Controllers;

use App\Http\Requests\ExpenseCards\StoreExpenseCardRequest;
use App\Http\Requests\ExpenseCards\UpdateExpenseCardRequest;
use App\Http\Requests\ExpenseCards\UpdateExpenseCardStatusRequest;
use App\Models\ExpenseCard;
use App\Services\Expense\ExpenseCardService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ExpenseController extends Controller
{
    public function __construct(
        private ExpenseCardService $expenseCards,
    ) {}

    public function index(Request $request): Response
    {
        $user = $request->user();
        assert($user !== null);

        $preferred = $user->preferred_currency === 'USD' ? 'USD' : 'EGP';

        $status = $this->queryString($request, 'status') ?? 'all';
        $category = $this->queryString($request, 'category') ?? 'all';
        $billing = $this->queryString($request, 'billing_cycle') ?? 'all';
        $search = $this->queryString($request, 'search');
        if ($search !== null) {
            $search = trim($search);
            if ($search === '') {
                $search = null;
            }
        }

        $sortRaw = $this->queryString($request, 'sort');
        $sort = in_array($sortRaw, ['renewal', 'amount', 'name'], true) ? $sortRaw : 'renewal';

        $cards = $this->expenseCards->filteredCards($user, $status, $category, $billing, $search, $sort);

        return Inertia::render('expenses/index', [
            'filters' => [
                'status' => $status,
                'category' => $category,
                'billing_cycle' => $billing,
                'search' => $search ?? '',
                'sort' => $sort,
            ],
            'preferredCurrency' => $preferred,
            'summary' => $this->expenseCards->dashboardSummary($user, $preferred),
            'hasAnyExpenseEver' => ExpenseCard::query()->where('user_id', $user->id)->exists(),
            'expenses' => $cards->map(fn (ExpenseCard $card) => $this->expenseCards->cardForFrontend($card))->values()->all(),
        ]);
    }

    public function create(Request $request): Response
    {
        $user = $request->user();
        assert($user !== null);

        return Inertia::render('expenses/create', [
            'preferred_currency' => $user->preferred_currency === 'USD' ? 'USD' : 'EGP',
        ]);
    }

    public function store(StoreExpenseCardRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        ExpenseCard::create([
            'user_id' => (string) auth()->id(),
            'name' => $validated['name'],
            'category' => $validated['category'],
            'type' => $validated['type'],
            'amount' => $validated['amount'],
            'currency' => $validated['currency'],
            'billing_cycle' => $validated['billing_cycle'],
            'next_renewal_date' => $validated['next_renewal_date'] ?? null,
            'started_at' => $validated['started_at'] ?? null,
            'status' => 'active',
            'cancel_url' => $validated['cancel_url'] ?? null,
            'cancel_instructions' => null,
            'notes' => $validated['notes'] ?? null,
            'alert_days_before' => $validated['alert_days_before'] ?? 7,
            'auto_detected' => false,
            'source_email_id' => null,
            'last_alerted_at' => null,
        ]);

        return redirect()->route('expenses.index')
            ->with('flash', ['type' => 'success', 'message' => 'تمت إضافة بطاقة المصروف.']);
    }

    public function edit(ExpenseCard $expense): Response
    {
        abort_unless($expense->user_id === auth()->id(), 403);

        return Inertia::render('expenses/edit', [
            'expense' => array_merge($this->expenseCards->cardForFrontend($expense), [
                'startedAt' => $expense->started_at?->toDateString() ?? '',
                'alertDaysBefore' => $expense->alert_days_before,
            ]),
        ]);
    }

    public function update(UpdateExpenseCardRequest $request, ExpenseCard $expense): RedirectResponse
    {
        $validated = $request->validated();

        $payload = [];

        if (array_key_exists('name', $validated)) {
            $payload['name'] = $validated['name'];
        }
        if (array_key_exists('category', $validated)) {
            $payload['category'] = $validated['category'];
        }
        if (array_key_exists('type', $validated)) {
            $payload['type'] = $validated['type'];
        }
        if (array_key_exists('amount', $validated)) {
            $payload['amount'] = $validated['amount'];
        }
        if (array_key_exists('currency', $validated)) {
            $payload['currency'] = $validated['currency'];
        }
        if (array_key_exists('billing_cycle', $validated)) {
            $payload['billing_cycle'] = $validated['billing_cycle'];
        }
        if (array_key_exists('next_renewal_date', $validated)) {
            $payload['next_renewal_date'] = $validated['next_renewal_date'];
        }
        if (array_key_exists('started_at', $validated)) {
            $payload['started_at'] = $validated['started_at'];
        }
        if (array_key_exists('cancel_url', $validated)) {
            $payload['cancel_url'] = $validated['cancel_url'];
        }
        if (array_key_exists('notes', $validated)) {
            $payload['notes'] = $validated['notes'];
        }
        if (array_key_exists('alert_days_before', $validated)) {
            $payload['alert_days_before'] = $validated['alert_days_before'] ?? 7;
        }

        if ($payload !== []) {
            $expense->update($payload);
        }

        return redirect()->route('expenses.index')
            ->with('flash', ['type' => 'success', 'message' => 'تم تحديث بطاقة المصروف.']);
    }

    public function status(UpdateExpenseCardStatusRequest $request, ExpenseCard $expense): RedirectResponse
    {
        $status = $request->validated('status');

        if ($expense->status === 'cancelled' && $status === 'cancelled') {
            return redirect()->back();
        }

        $expense->update(['status' => $status]);

        return redirect()->back()
            ->with('flash', ['type' => 'success', 'message' => 'تم تحديث حالة المصروف.']);
    }

    public function destroy(ExpenseCard $expense): RedirectResponse
    {
        abort_unless($expense->user_id === auth()->id(), 403);

        $expense->delete();

        return redirect()->route('expenses.index')
            ->with('flash', ['type' => 'success', 'message' => 'تم حذف بطاقة المصروف.']);
    }

    private function queryString(Request $request, string $key): ?string
    {
        $raw = $request->query($key);

        return is_string($raw) ? $raw : null;
    }
}
