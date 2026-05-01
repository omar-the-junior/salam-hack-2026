<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\OAuthController;
use App\Http\Middleware\EnsureOnboardingComplete;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome', ['canRegister' => true])->name('home');
Route::inertia('/terms', 'terms')->name('terms');
Route::inertia('/privacy', 'privacy')->name('privacy');
Route::inertia('/blog', 'blog')->name('blog');

Route::get('/auth/google/redirect', [OAuthController::class, 'redirect'])->name('oauth.google.redirect');
Route::get('/auth/google/callback', [OAuthController::class, 'callback'])->name('oauth.google.callback');

Route::middleware(['auth', EnsureOnboardingComplete::class])->group(function (): void {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::post('dashboard/checklist-dismiss', [DashboardController::class, 'dismissChecklist'])->name('dashboard.checklist.dismiss');
});

require __DIR__.'/auth.php';
require __DIR__.'/onboarding.php';
require __DIR__.'/payment-links.php';
require __DIR__.'/contracts.php';
require __DIR__.'/income.php';
require __DIR__.'/expenses.php';
require __DIR__.'/email-scanner.php';
require __DIR__.'/pay.php';
require __DIR__.'/customers.php';

require __DIR__.'/settings.php';
require __DIR__.'/notifications.php';
