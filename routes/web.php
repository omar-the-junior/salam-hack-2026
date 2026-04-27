<?php

use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
});

require __DIR__.'/onboarding.php';
require __DIR__.'/payment-links.php';
require __DIR__.'/contracts.php';
require __DIR__.'/income.php';
require __DIR__.'/expenses.php';
require __DIR__.'/email-scanner.php';
require __DIR__.'/pay.php';

require __DIR__.'/settings.php';
