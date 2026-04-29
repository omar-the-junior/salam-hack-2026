<?php

use App\Http\Controllers\IncomeController;
use App\Http\Middleware\EnsureOnboardingComplete;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', EnsureOnboardingComplete::class])->group(function () {
    Route::get('income', [IncomeController::class, 'index'])->name('income.index');
    Route::get('income/create', [IncomeController::class, 'create'])->name('income.create');
    Route::post('income', [IncomeController::class, 'store'])->name('income.store');
    Route::match(['put', 'patch'], 'income/{incomeEntry}', [IncomeController::class, 'update'])->name('income.update');
});
