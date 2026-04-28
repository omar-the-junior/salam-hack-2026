<?php

use App\Http\Controllers\EmailScannerController;
use App\Http\Middleware\EnsureOnboardingComplete;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', EnsureOnboardingComplete::class])->group(function () {
    Route::get('email-scanner', [EmailScannerController::class, 'index'])->name('email-scanner.index');
    Route::get('email-scanner/review', [EmailScannerController::class, 'review'])->name('email-scanner.review');
});
