<?php

use App\Http\Controllers\EmailScannerController;
use App\Http\Middleware\EnsureOnboardingComplete;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', EnsureOnboardingComplete::class])->group(function () {
    Route::get('email-scanner', [EmailScannerController::class, 'index'])->name('email-scanner.index');
    Route::get('email-scanner/review', [EmailScannerController::class, 'review'])->name('email-scanner.review');

    // ── Gmail OAuth connect / disconnect ─────────────────────────
    Route::get('email-scanner/connect', [EmailScannerController::class, 'connectAccount'])->name('email-scanner.connect');
    Route::get('auth/gmail/callback', [EmailScannerController::class, 'handleOAuthCallback'])->name('gmail.callback');
    Route::delete('email-scanner/disconnect', [EmailScannerController::class, 'disconnect'])->name('email-scanner.disconnect');

    // ── Scan trigger + status polling ────────────────────────────
    Route::post('email-scanner/scan', [EmailScannerController::class, 'scan'])->name('email-scanner.scan');
    Route::get('email-scanner/status', [EmailScannerController::class, 'status'])->name('email-scanner.status');

    // ── Review actions ────────────────────────────────────────────
    Route::patch('email-scanner/results/{result}/approve', [EmailScannerController::class, 'approveResult'])->name('email-scanner.result.approve');
    Route::patch('email-scanner/results/{result}/reject', [EmailScannerController::class, 'rejectResult'])->name('email-scanner.result.reject');
    Route::post('email-scanner/results/approve-all', [EmailScannerController::class, 'approveAllResults'])->name('email-scanner.result.approve-all');
});
