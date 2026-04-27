<?php

use App\Http\Controllers\PayController;
use Illuminate\Support\Facades\Route;

Route::get('pay/{token}', [PayController::class, 'show'])->name('pay.show');
Route::get('pay/{token}/receipt', [PayController::class, 'receipt'])->name('pay.receipt');
