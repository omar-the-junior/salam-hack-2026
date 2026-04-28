<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Facades\Auth;

class OAuthController extends Controller
{
    public function redirect()
    {
        return Socialite::driver('google')->redirect();
    }

    public function callback(Request $request)
    {
        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (\Exception $e) {
            return redirect('/login')->withErrors(['oauth' => 'Failed to authenticate with Google.']);
        }

        $user = User::where('email', $googleUser->getEmail())->first();

        if ($user) {
            // Returning user: update provider details
            $user->update([
                'provider_id' => $googleUser->getId(),
                'avatar_url' => $googleUser->getAvatar(),
            ]);
        } else {
            // New user registration via Google
            $user = User::create([
                'name' => $googleUser->getName(),
                'email' => $googleUser->getEmail(),
                'provider_id' => $googleUser->getId(),
                'avatar_url' => $googleUser->getAvatar(),
                'password' => null,
                'email_verified_at' => now(), // Google emails are implicitly verified
                'onboarding_completed' => false,
            ]);
        }

        Auth::login($user);

        // Required by UC-001 & UC-001b: Gate for un-onboarded users
        if (!$user->onboarding_completed) {
            return redirect()->route('onboarding.step1');
        }

        return redirect()->intended(route('dashboard', [], false));
    }
}
