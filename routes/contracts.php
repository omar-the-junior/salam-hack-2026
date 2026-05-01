<?php

use App\Http\Controllers\ContractController;
use App\Http\Controllers\MilestoneController;
use App\Http\Middleware\EnsureOnboardingComplete;
use Illuminate\Support\Facades\Route;

Route::get('contracts/{token}/review', [ContractController::class, 'review'])
    ->name('contracts.review');

Route::post('contracts/{token}/accept', [ContractController::class, 'accept'])
    ->name('contracts.accept');

Route::middleware(['auth', EnsureOnboardingComplete::class])->group(function () {
    Route::get('contracts', [ContractController::class, 'index'])->name('contracts.index');
    Route::get('contracts/create', [ContractController::class, 'create'])->name('contracts.create');
    Route::get('contracts/create/milestones', [ContractController::class, 'createMilestones'])->name('contracts.create.milestones');
    Route::get('contracts/create/summary', [ContractController::class, 'createSummary'])->name('contracts.create.summary');
    Route::post('contracts', [ContractController::class, 'store'])->name('contracts.store');
    Route::get('contracts/{contract}/edit', [ContractController::class, 'edit'])->name('contracts.edit');
    Route::get('contracts/{contract}', [ContractController::class, 'show'])->name('contracts.show');
    Route::put('contracts/{contract}', [ContractController::class, 'update'])->name('contracts.update');

    Route::post('contracts/{contract}/milestones', [MilestoneController::class, 'store'])->name('milestones.store');
    Route::post('contracts/{contract}/milestones/bulk', [MilestoneController::class, 'storeBulk'])->name('milestones.store-bulk');
    Route::get('milestones/{milestone}', [MilestoneController::class, 'show'])->name('milestones.show');
    Route::put('milestones/{milestone}', [MilestoneController::class, 'update'])->name('milestones.update');
});
