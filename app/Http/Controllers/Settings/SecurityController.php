<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\PasswordUpdateRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class SecurityController extends Controller
{
    public function edit(): Response
    {
        try {
            return Inertia::render('settings/security');
        } catch (Throwable $e) {
            Log::error(static::class.'@edit', [
                'user_id' => auth()->id(),
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    public function update(PasswordUpdateRequest $request): RedirectResponse
    {
        try {
            $request->user()->update([
                'password' => $request->password,
            ]);

            Inertia::flash('toast', ['type' => 'success', 'message' => __('Password updated.')]);

            return back();
        } catch (Throwable $e) {
            Log::error(static::class.'@update', [
                'user_id' => auth()->id(),
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }
}
