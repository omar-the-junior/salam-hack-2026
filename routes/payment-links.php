<?php

use App\Http\Controllers\PaymentLinkController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('payment-links', [PaymentLinkController::class, 'index'])->name('payment-links.index');
    Route::get('payment-links/create', [PaymentLinkController::class, 'create'])->name('payment-links.create');
    Route::get('payment-links/{paymentLink}', [PaymentLinkController::class, 'show'])->name('payment-links.show');
});
