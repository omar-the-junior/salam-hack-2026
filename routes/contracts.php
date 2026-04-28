<?php

use App\Http\Controllers\ContractController;
use App\Http\Middleware\EnsureOnboardingComplete;
use Illuminate\Support\Facades\Route;

Route::get('contracts/{token}/review', [ContractController::class, 'review'])
    ->name('contracts.review');

Route::middleware(['auth', EnsureOnboardingComplete::class])->group(function () {
    Route::get('contracts/create', [ContractController::class, 'create'])->name('contracts.create');
    Route::get('contracts/create/step/2', [ContractController::class, 'createStep2'])
        ->name('contracts.create.step2');
    Route::get('contracts/create/step/3', [ContractController::class, 'createStep3'])
        ->name('contracts.create.step3');
    Route::get('contracts/{contract}', [ContractController::class, 'show'])->name('contracts.show');
});
