<?php

namespace App\Http\Controllers\Auth;

use App\Concerns\PasswordValidationRules;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class ResetPasswordController extends Controller
{
    use PasswordValidationRules;

    public function create(Request $request): Response
    {
        try {
            return Inertia::render('auth/reset-password', [
                'email' => $request->email,
                'token' => $request->route('token'),
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
                'token' => ['required'],
                'email' => ['required', 'email'],
                'password' => $this->passwordRules(),
            ]);

            $status = Password::reset(
                $request->only('email', 'password', 'password_confirmation', 'token'),
                function (User $user, string $password): void {
                    $user->forceFill(['password' => $password, 'remember_token' => Str::random(60)])->save();
                    event(new PasswordReset($user));
                }
            );

            if ($status === Password::PASSWORD_RESET) {
                return redirect()->route('login')->with('status', __($status));
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
