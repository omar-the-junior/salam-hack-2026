<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Auth\Events\Verified;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class EmailVerificationController extends Controller
{
    public function notice(Request $request): Response|RedirectResponse
    {
        try {
            if ($request->user()->hasVerifiedEmail()) {
                return redirect()->intended(route('dashboard'));
            }

            return Inertia::render('auth/verify-email', [
                'status' => $request->session()->get('status'),
            ]);
        } catch (Throwable $e) {
            Log::error(static::class.'@notice', [
                'user_id' => auth()->id(),
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    public function verify(EmailVerificationRequest $request): RedirectResponse
    {
        try {
            if (! $request->user()->hasVerifiedEmail()) {
                $request->fulfill();
                event(new Verified($request->user()));
            }

            return redirect()->intended(route('dashboard').'?verified=1');
        } catch (Throwable $e) {
            Log::error(static::class.'@verify', [
                'user_id' => auth()->id(),
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    public function send(Request $request): RedirectResponse
    {
        try {
            if ($request->user()->hasVerifiedEmail()) {
                return redirect()->intended(route('dashboard'));
            }

            $request->user()->sendEmailVerificationNotification();

            return back()->with('status', 'verification-link-sent');
        } catch (Throwable $e) {
            Log::error(static::class.'@send', [
                'user_id' => auth()->id(),
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }
}
