<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class ForgotPasswordController extends Controller
{
    public function create(Request $request): Response
    {
        try {
            return Inertia::render('auth/forgot-password', [
                'status' => $request->session()->get('status'),
            ]);
        } catch (Throwable $e) {
            Log::error(static::class.'@create', [
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    public function store(Request $request): RedirectResponse
    {
        try {
            $request->validate([
                'email' => ['required', 'email'],
            ]);

            $status = Password::sendResetLink($request->only('email'));

            if ($status === Password::RESET_LINK_SENT) {
                return back()->with('status', __($status));
            }

            return back()->withErrors(['email' => __($status)]);
        } catch (Throwable $e) {
            Log::error(static::class.'@store', [
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }
}
