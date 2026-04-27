<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class PayController extends Controller
{
    public function show(string $token): Response
    {
        return Inertia::render('pay/show');
    }

    public function receipt(string $token): Response
    {
        return Inertia::render('pay/receipt');
    }
}
