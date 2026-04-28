<?php

use App\Http\Controllers\OnboardingController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->group(function () {
    Route::get('onboarding/step/1', [OnboardingController::class, 'openOnboarding'])->name('onboarding.step1');
    Route::post('onboarding/step/1', [OnboardingController::class, 'storeStep1'])->name('onboarding.step1.store');
    Route::get('onboarding/step/2', [OnboardingController::class, 'openStep2'])->name('onboarding.step2');
    Route::post('onboarding/step/2', [OnboardingController::class, 'storeStep2'])->name('onboarding.step2.store');
});
