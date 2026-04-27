<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class ContractController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('contracts/create');
    }

    public function createStep2(): Response
    {
        return Inertia::render('contracts/create/step-2');
    }

    public function createStep3(): Response
    {
        return Inertia::render('contracts/create/step-3');
    }

    public function show(string $contract): Response
    {
        return Inertia::render('contracts/show');
    }

    public function review(string $token): Response
    {
        return Inertia::render('contracts/review');
    }
}
