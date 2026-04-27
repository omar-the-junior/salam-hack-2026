<?php

use App\Http\Controllers\EmailScannerController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('email-scanner', [EmailScannerController::class, 'index'])->name('email-scanner.index');
    Route::get('email-scanner/review', [EmailScannerController::class, 'review'])->name('email-scanner.review');
});
