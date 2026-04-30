<?php

namespace App\Http\Controllers;

use App\Http\Requests\PaymentLinks\StorePaymentLinkRequest;
use App\Models\Contract;
use App\Models\Customer;
use App\Models\Milestone;
use App\Models\PaymentLink;
use App\Notifications\MilestonePaymentRequestNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class PaymentLinkController extends Controller
{
    public function index(): Response
    {
        try {
            $paymentLinks = PaymentLink::query()
                ->where('user_id', auth()->id())
                ->with(['milestone.contract'])
                ->latest()
                ->get();

            return Inertia::render('payment-links/index', [
                'paymentLinks' => $paymentLinks,
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

    public function create(): Response
    {
        try {
            $user = auth()->user();
            $newCustomerId = session('new_customer_id');
            $customers = Customer::query()
                ->where('user_id', auth()->id())
                ->latest()
                ->get(['id', 'name', 'email', 'phone']);

            $contractsWithMilestones = Contract::query()
                ->where('user_id', auth()->id())
                ->with(['milestones' => fn ($q) => $q->orderBy('title')])
                ->orderBy('project_name')
                ->get()
                ->map(fn (Contract $contract) => [
                    'id' => $contract->id,
                    'project_name' => $contract->project_name,
                    'client_name' => $contract->client_name,
                    'client_email' => $contract->client_email,
                    'currency' => $contract->currency,
                    'tax_rate' => $contract->tax_rate,
                    'milestones' => $contract->milestones->map(fn (Milestone $milestone) => [
                        'id' => $milestone->id,
                        'title' => $milestone->title,
                        'amount' => $milestone->amount,
                        'due_date' => $milestone->due_date?->toDateString(),
                    ])->values(),
                ])
                ->filter(fn (array $row) => $row['milestones']->isNotEmpty())
                ->values();

            $selectedMilestoneId = request()->query('milestone');
            if (is_string($selectedMilestoneId) && Str::isUuid($selectedMilestoneId)) {
                $valid = Milestone::query()
                    ->whereKey($selectedMilestoneId)
                    ->whereHas('contract', fn ($q) => $q->where('user_id', auth()->id()))
                    ->exists();
                if (! $valid) {
                    $selectedMilestoneId = null;
                }
            } else {
                $selectedMilestoneId = null;
            }

            return Inertia::render('payment-links/create', [
                'defaults' => [
                    'currency' => $user?->preferred_currency === 'USD' ? 'USD' : 'EGP',
                    'tax_rate' => (float) ($user?->default_tax_rate ?? 0),
                ],
                'customers' => $customers,
                'newCustomerId' => $newCustomerId,
                'contractsWithMilestones' => $contractsWithMilestones,
                'selectedMilestoneId' => $selectedMilestoneId,
            ]);
        } catch (Throwable $e) {
            Log::error(static::class.'@create', [
                'user_id' => auth()->id(),
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    public function store(StorePaymentLinkRequest $request): RedirectResponse
    {
        try {
            $validated = $request->validated();

            $amount = (float) $validated['amount'];
            $taxRate = (float) ($validated['tax_rate'] ?? 0);
            $taxAmount = round($amount * $taxRate / 100, 2);
            $totalAmount = round($amount + $taxAmount, 2);

            $paymentLink = PaymentLink::create([
                'user_id' => auth()->id(),
                'customer_id' => $validated['customer_id'] ?? null,
                'milestone_id' => $validated['milestone_id'],
                'public_token' => Str::lower(Str::ulid()->toBase32()),
                'amount' => $amount,
                'tax_rate' => $taxRate,
                'tax_amount' => $taxAmount,
                'total_amount' => $totalAmount,
                'currency' => $validated['currency'],
                'description' => $validated['description'],
                'client_name' => $validated['client_name'],
                'client_email' => $validated['client_email'],
                'due_date' => $validated['due_date'] ?? null,
                'status' => 'pending',
                'mock_gateway_reference' => 'mock_'.Str::upper(Str::random(12)),
                'mock_provider' => 'mock-sandbox',
                'source' => 'manual',
            ]);

            if ($paymentLink->milestone_id && $paymentLink->client_email) {
                Notification::route('mail', $paymentLink->client_email)
                    ->notify(new MilestonePaymentRequestNotification($paymentLink, $paymentLink->milestone));
            }

            return redirect()->route('payment-links.show', $paymentLink->id)
                ->with('flash', ['type' => 'success', 'message' => 'تم إنشاء رابط الدفع بنجاح']);
        } catch (Throwable $e) {
            Log::error(static::class.'@store', [
                'user_id' => auth()->id(),
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    public function show(PaymentLink $paymentLink): Response
    {
        try {
            $this->authorizePaymentLink($paymentLink);

            $paymentLink->loadMissing('milestone.contract');

            return Inertia::render('payment-links/show', [
                'paymentLink' => $paymentLink,
                'shareableUrl' => route('pay.show', ['token' => $paymentLink->public_token]),
            ]);
        } catch (Throwable $e) {
            Log::error(static::class.'@show', [
                'user_id' => auth()->id(),
                'payment_link_id' => $paymentLink->id,
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    private function authorizePaymentLink(PaymentLink $paymentLink): void
    {
        if ($paymentLink->user_id !== auth()->id()) {
            abort(403);
        }
    }
}
