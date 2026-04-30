<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class LoginController extends Controller
{
    public function create(Request $request): Response
    {
        try {
            return Inertia::render('auth/login', [
                'canResetPassword' => true,
                'canRegister' => true,
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
                'email' => ['required', 'string', 'email'],
                'password' => ['required', 'string'],
            ]);

            if (! auth()->attempt($request->only('email', 'password'), $request->boolean('remember'))) {
                throw ValidationException::withMessages([
                    'email' => trans('auth.failed'),
                ]);
            }

            $request->session()->regenerate();

            $user = auth()->user();

            if (! $user->onboarding_completed) {
                return redirect()->route('onboarding.step1');
            }

            return redirect()->intended(route('dashboard'));
        } catch (Throwable $e) {
            Log::error(static::class.'@store', [
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    public function destroy(Request $request): RedirectResponse
    {
        try {
            auth()->logout();

            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login');
        } catch (Throwable $e) {
            Log::error(static::class.'@destroy', [
                'user_id' => auth()->id(),
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }
}
