<?php

namespace App\Http\Controllers\Auth;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class RegisterController extends Controller
{
    use PasswordValidationRules, ProfileValidationRules;

    public function create(): Response
    {
        try {
            return Inertia::render('auth/register');
        } catch (Throwable $e) {
            Log::error(static::class.'@create', [
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    public function store(): RedirectResponse
    {
        try {
            $validated = request()->validate([
                ...$this->profileRules(),
                'password' => $this->passwordRules(),
            ]);

            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => $validated['password'],
            ]);

            auth()->login($user);

            return redirect()->route('onboarding.step1');
        } catch (Throwable $e) {
            Log::error(static::class.'@store', [
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }
}
