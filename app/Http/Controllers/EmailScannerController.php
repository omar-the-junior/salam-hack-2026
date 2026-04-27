<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class EmailScannerController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('email-scanner/index');
    }

    public function review(): Response
    {
        return Inertia::render('email-scanner/review');
    }
}
