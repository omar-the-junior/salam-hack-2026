<?php

namespace App\Http\Controllers\Auth;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class RegisterController extends Controller
{
    use PasswordValidationRules, ProfileValidationRules;

    public function create(): Response
    {
        return Inertia::render('auth/register');
    }

    public function store(): RedirectResponse
    {
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
    }
}
