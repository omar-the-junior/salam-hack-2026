<?php

namespace App\Http\Controllers;

use App\Http\Requests\PaymentLinks\StorePaymentLinkRequest;
use App\Models\Customer;
use App\Models\PaymentLink;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class PaymentLinkController extends Controller
{
    public function index(): Response
    {
        $paymentLinks = PaymentLink::query()
            ->where('user_id', auth()->id())
            ->latest()
            ->get();

        return Inertia::render('payment-links/index', [
            'paymentLinks' => $paymentLinks,
        ]);
    }

    public function create(): Response
    {
        $user = auth()->user();
        $newCustomerId = session('new_customer_id');
        $customers = Customer::query()
            ->where('user_id', auth()->id())
            ->latest()
            ->get(['id', 'name', 'email', 'phone']);

        return Inertia::render('payment-links/create', [
            'defaults' => [
                'currency' => $user?->preferred_currency === 'USD' ? 'USD' : 'EGP',
                'tax_rate' => (float) ($user?->default_tax_rate ?? 0),
            ],
            'customers' => $customers,
            'newCustomerId' => $newCustomerId,
        ]);
    }

    public function store(StorePaymentLinkRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $amount = (float) $validated['amount'];
        $taxRate = (float) ($validated['tax_rate'] ?? 0);
        $taxAmount = round($amount * $taxRate / 100, 2);
        $totalAmount = round($amount + $taxAmount, 2);

        $paymentLink = PaymentLink::create([
            'user_id' => auth()->id(),
            'customer_id' => $validated['customer_id'] ?? null,
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

        return redirect()->route('payment-links.show', $paymentLink->id)
            ->with('flash', ['type' => 'success', 'message' => 'تم إنشاء رابط الدفع بنجاح']);
    }

    public function show(PaymentLink $paymentLink): Response
    {
        $this->authorizePaymentLink($paymentLink);

        return Inertia::render('payment-links/show', [
            'paymentLink' => $paymentLink,
            'shareableUrl' => route('pay.show', ['token' => $paymentLink->public_token]),
        ]);
    }

    private function authorizePaymentLink(PaymentLink $paymentLink): void
    {
        if ($paymentLink->user_id !== auth()->id()) {
            abort(403);
        }
    }
}
