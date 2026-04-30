<?php

use App\Http\Controllers\PayController;
use App\Http\Middleware\VerifyPaymobWebhook;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Support\Facades\Route;

Route::get('pay/{token}', [PayController::class, 'show'])->name('pay.show');

Route::post('payment/initiate/{token}', [PayController::class, 'initiate'])->name('pay.initiate');

Route::get('payment/callback', [PayController::class, 'callback'])->name('pay.callback');

Route::post('webhook/paymob', [PayController::class, 'webhook'])
    ->middleware(VerifyPaymobWebhook::class)
    ->withoutMiddleware([ValidateCsrfToken::class])
    ->name('webhook.paymob');
