<?php

namespace App\Http\Controllers;

use App\Models\PaymentLink;
use Inertia\Inertia;
use Inertia\Response;

class PayController extends Controller
{
    public function show(string $token): Response
    {
        $paymentLink = PaymentLink::query()
            ->where('public_token', $token)
            ->firstOrFail();

        return Inertia::render('pay/show', [
            'paymentLink' => $paymentLink,
        ]);
    }

    public function receipt(string $token): Response
    {
        return Inertia::render('pay/receipt');
    }
}
