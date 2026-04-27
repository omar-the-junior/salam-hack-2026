<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class ExpenseController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('expenses/index');
    }

    public function create(): Response
    {
        return Inertia::render('expenses/create');
    }

    public function edit(string $expense): Response
    {
        return Inertia::render('expenses/edit');
    }
}
