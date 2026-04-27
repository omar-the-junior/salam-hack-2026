<?php

use App\Http\Controllers\OnboardingController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->group(function () {
    Route::get('onboarding/step/1', [OnboardingController::class, 'step1'])->name('onboarding.step1');
    Route::get('onboarding/step/2', [OnboardingController::class, 'step2'])->name('onboarding.step2');
});
