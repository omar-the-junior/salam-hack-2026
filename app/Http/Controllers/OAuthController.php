<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;
use Throwable;

class OAuthController extends Controller
{
    public function redirect(): \Symfony\Component\HttpFoundation\RedirectResponse
    {
        try {
            return Socialite::driver('google')->redirect();
        } catch (Throwable $e) {
            Log::error(static::class.'@redirect', [
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    public function callback(Request $request): RedirectResponse
    {
        try {
            try {
                $googleUser = Socialite::driver('google')->user();
            } catch (\Exception $e) {
                return redirect('/login')->withErrors(['oauth' => __('auth.oauth_failed')]);
            }

            $user = User::where('email', $googleUser->getEmail())->first();

            if ($user) {
                $user->update([
                    'provider_id' => $googleUser->getId(),
                    'avatar_url' => $googleUser->getAvatar(),
                ]);
            } else {
                $user = User::create([
                    'name' => $googleUser->getName(),
                    'email' => $googleUser->getEmail(),
                    'provider_id' => $googleUser->getId(),
                    'avatar_url' => $googleUser->getAvatar(),
                    'password' => null,
                    'email_verified_at' => now(),
                    'onboarding_completed' => false,
                ]);
            }

            Auth::login($user);

            if (! $user->onboarding_completed) {
                return redirect()->route('onboarding.step1');
            }

            return redirect()->intended(route('dashboard', [], false));
        } catch (Throwable $e) {
            Log::error(static::class.'@callback', [
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }
}
