<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileDeleteRequest;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class ProfileController extends Controller
{
    public function edit(Request $request): Response
    {
        try {
            return Inertia::render('settings/profile', [
                'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
                'status' => $request->session()->get('status'),
            ]);
        } catch (Throwable $e) {
            Log::error(static::class.'@edit', [
                'user_id' => auth()->id(),
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        try {
            $validated = $request->validated();

            if (! array_key_exists('display_name', $validated) || blank($validated['display_name'])) {
                $validated['display_name'] = $validated['name'] ?? $request->user()->name;
            }

            if (! array_key_exists('preferred_currency', $validated) || blank($validated['preferred_currency'])) {
                $validated['preferred_currency'] = $request->user()->preferred_currency ?: 'EGP';
            }

            $request->user()->fill($validated);

            if ($request->user()->isDirty('email')) {
                $request->user()->email_verified_at = null;
            }

            $request->user()->save();

            Inertia::flash('toast', ['type' => 'success', 'message' => __('Profile updated.')]);

            return to_route('profile.edit');
        } catch (Throwable $e) {
            Log::error(static::class.'@update', [
                'user_id' => auth()->id(),
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    public function destroy(ProfileDeleteRequest $request): RedirectResponse
    {
        try {
            $user = $request->user();

            Auth::logout();

            $user->delete();

            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect('/');
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
