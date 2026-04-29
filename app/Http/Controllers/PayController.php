<?php

namespace App\Http\Controllers;

use App\Models\PaymentLink;
use App\Models\PaymentTransaction;
use App\Models\UserWallet;
use App\Notifications\PaymentReceivedNotification;
use App\Services\PaymobService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class PayController extends Controller
{
    public function show(string $token): Response
    {
        $link = PaymentLink::where('public_token', $token)->firstOrFail();

        $state = 'pending';

        if ($link->status === 'paid') {
            $state = 'paid';
        } elseif ($link->status === 'cancelled' || ($link->due_date && $link->due_date->isPast())) {
            $state = 'expired';
        }

        return Inertia::render('pay/show', [
            'paymentLink'  => [
                'amount'       => $link->amount,
                'tax_rate'     => $link->tax_rate,
                'tax_amount'   => $link->tax_amount,
                'total_amount' => $link->total_amount,
                'currency'     => $link->currency,
                'description'  => $link->description,
                'due_date'     => $link->due_date?->toDateString(),
                'state'        => $state,
            ],
            'initiateUrl'  => route('pay.initiate', $token),
            'paymentState' => request()->query('payment', ''),
        ]);
    }

    public function initiate(string $token, PaymobService $paymob): RedirectResponse
    {
        $link = PaymentLink::where('public_token', $token)
            ->where('status', 'pending')
            ->firstOrFail();

        $amountCents = (int) round($link->total_amount * 100);

        $billingData = [
            'first_name'      => $link->client_name ?? 'Client',
            'last_name'       => '.',
            'email'           => $link->client_email ?? 'client@placeholder.com',
            'phone_number'    => '+201000000000',
            'apartment'       => 'NA',
            'floor'           => 'NA',
            'street'          => 'NA',
            'building'        => 'NA',
            'shipping_method' => 'NA',
            'postal_code'     => 'NA',
            'city'            => 'NA',
            'country'         => 'EG',
            'state'           => 'NA',
        ];

        try {
            $authToken  = $paymob->authenticate();
            $orderId    = $paymob->createOrder($authToken, $amountCents, $link->currency);
            $paymentKey = $paymob->getPaymentKey($authToken, $orderId, $amountCents, $link->currency, $billingData);
        } catch (Throwable $e) {
            Log::error('Paymob initiate failed', ['token' => $token, 'error' => $e->getMessage()]);

            return redirect()->route('pay.show', $token)
                ->withErrors(['payment' => 'حدث خطأ أثناء الاتصال ببوابة الدفع. يرجى المحاولة مرة أخرى.']);
        }

        PaymentTransaction::create([
            'payment_link_id' => $link->id,
            'user_id'         => $link->user_id,
            'paymob_order_id' => $orderId,
            'amount_cents'    => $amountCents,
            'currency'        => $link->currency,
            'status'          => 'pending',
        ]);

        return redirect()->away($paymob->buildIframeUrl($paymentKey));
    }

    public function callback(Request $request): RedirectResponse
    {
        $paymobTxnId = $request->query('id');
        $orderId     = $request->query('order');

        $transaction = null;

        if ($paymobTxnId) {
            $transaction = PaymentTransaction::where('paymob_transaction_id', $paymobTxnId)->first();
        }

        if (! $transaction && $orderId) {
            $transaction = PaymentTransaction::where('paymob_order_id', $orderId)->first();
        }

        if (! $transaction) {
            // We cannot resolve which link; show a generic pending state
            return redirect()->back()->with('payment', 'pending');
        }

        $publicToken = $transaction->paymentLink->public_token;

        $payment = match ($transaction->status) {
            'paid'  => 'success',
            'failed' => 'failed',
            default  => 'pending',
        };

        return redirect()->route('pay.show', $publicToken)->with('payment', $payment);
    }

    public function webhook(Request $request): JsonResponse
    {
        $payload  = $request->all();
        $obj      = $payload['obj'] ?? [];
        $orderId  = (string) ($obj['order']['id'] ?? '');

        if (! $orderId) {
            return response()->json(['status' => 'ignored'], 200);
        }

        $transaction = PaymentTransaction::where('paymob_order_id', $orderId)->first();

        if (! $transaction) {
            Log::warning('PaymobWebhook: unknown order', ['paymob_order_id' => $orderId]);
            return response()->json(['status' => 'not_found'], 200);
        }

        if ($transaction->isPaid()) {
            return response()->json(['status' => 'already processed'], 200);
        }

        $success = (bool) ($obj['success'] ?? false);

        try {
            DB::transaction(function () use ($transaction, $obj, $payload, $success): void {
                if ($success) {
                    $transaction->update([
                        'status'                 => 'paid',
                        'paymob_transaction_id'  => (string) ($obj['id'] ?? ''),
                        'card_last_four'         => $obj['source_data']['pan'] ?? null,
                        'card_brand'             => $obj['source_data']['sub_type'] ?? null,
                        'gateway_response'       => $payload,
                        'hmac_verified'          => true,
                        'paid_at'                => now(),
                    ]);

                    $transaction->paymentLink->update(['status' => 'paid']);

                    UserWallet::firstOrCreate(
                        ['user_id' => $transaction->user_id, 'currency' => $transaction->currency],
                        ['balance_cents' => 0]
                    )->increment('balance_cents', $transaction->amount_cents);

                    $transaction->user->notify(new PaymentReceivedNotification($transaction));
                } else {
                    $transaction->update([
                        'status'                => 'failed',
                        'paymob_transaction_id' => (string) ($obj['id'] ?? ''),
                        'failure_reason'        => $obj['data']['message'] ?? null,
                        'gateway_response'      => $payload,
                        'hmac_verified'         => true,
                    ]);
                }
            });
        } catch (Throwable $e) {
            Log::error('PaymobWebhook: DB update failed', [
                'paymob_order_id' => $orderId,
                'error'           => $e->getMessage(),
            ]);

            return response()->json(['status' => 'error'], 500);
        }

        return response()->json(['status' => 'ok'], 200);
    }
}
