<?php

use App\Http\Controllers\IncomeController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('income', [IncomeController::class, 'index'])->name('income.index');
    Route::get('income/create', [IncomeController::class, 'create'])->name('income.create');
});
