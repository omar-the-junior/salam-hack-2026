<?php

use App\Http\Controllers\ExpenseController;
use App\Http\Middleware\EnsureOnboardingComplete;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', EnsureOnboardingComplete::class])->group(function () {
    Route::get('expenses', [ExpenseController::class, 'index'])->name('expenses.index');
    Route::get('expenses/create', [ExpenseController::class, 'create'])->name('expenses.create');
    Route::get('expenses/{expense}/edit', [ExpenseController::class, 'edit'])->name('expenses.edit');
});
