<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class IncomeController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('income/index');
    }

    public function create(): Response
    {
        return Inertia::render('income/create');
    }
}
