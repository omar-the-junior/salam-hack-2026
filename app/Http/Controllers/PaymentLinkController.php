<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class PaymentLinkController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('payment-links/index');
    }

    public function create(): Response
    {
        return Inertia::render('payment-links/create');
    }

    public function show(string $paymentLink): Response
    {
        return Inertia::render('payment-links/show');
    }
}
