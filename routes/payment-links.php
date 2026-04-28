<?php

use App\Http\Controllers\PaymentLinkController;
use App\Http\Middleware\EnsureOnboardingComplete;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', EnsureOnboardingComplete::class])->group(function () {
    Route::get('payment-links', [PaymentLinkController::class, 'index'])->name('payment-links.index');
    Route::get('payment-links/create', [PaymentLinkController::class, 'create'])->name('payment-links.create');
    Route::post('payment-links', [PaymentLinkController::class, 'store'])->name('payment-links.store');
    Route::get('payment-links/{paymentLink}', [PaymentLinkController::class, 'show'])->name('payment-links.show');
});
