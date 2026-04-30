<?php

namespace App\Http\Controllers;

use App\Http\Requests\Onboarding\StoreStep1Request;
use App\Http\Requests\Onboarding\StoreStep2Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class OnboardingController extends Controller
{
    public function openOnboarding(Request $request): Response|RedirectResponse
    {
        try {
            $user = $request->user();

            if ($user->onboarding_completed) {
                return redirect()->route('dashboard');
            }

            return Inertia::render('onboarding/step-1', [
                'role' => $request->session()->get('onboarding.role', $this->roleForInertia($user->role)),
            ]);
        } catch (Throwable $e) {
            Log::error(static::class.'@openOnboarding', [
                'user_id' => auth()->id(),
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    public function storeStep1(StoreStep1Request $request): RedirectResponse
    {
        try {
            $user = $request->user();

            if ($user->onboarding_completed) {
                return redirect()->route('dashboard');
            }

            $request->session()->put(
                'onboarding.role',
                $this->roleForDatabase($request->validated('role')),
            );

            return redirect()->route('onboarding.step2');
        } catch (Throwable $e) {
            Log::error(static::class.'@storeStep1', [
                'user_id' => auth()->id(),
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    public function openStep2(Request $request): Response|RedirectResponse
    {
        try {
            $user = $request->user();

            if ($user->onboarding_completed) {
                return redirect()->route('dashboard');
            }

            $role = $request->session()->get('onboarding.role', $user->role);

            if (! $role) {
                return redirect()->route('onboarding.step1');
            }

            return Inertia::render('onboarding/step-2', [
                'name' => $user->display_name ?? $user->name ?? '',
                'role' => $this->roleForInertia($role),
                'country' => $user->country ?? '',
                'preferred_currency' => $user->preferred_currency ?: 'EGP',
                'profession' => $user->profession ?? '',
            ]);
        } catch (Throwable $e) {
            Log::error(static::class.'@openStep2', [
                'user_id' => auth()->id(),
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    public function storeStep2(StoreStep2Request $request): RedirectResponse
    {
        try {
            $user = $request->user();

            if ($user->onboarding_completed) {
                return redirect()->route('dashboard');
            }

            $role = $request->session()->get('onboarding.role', $user->role);

            if (! $role) {
                return redirect()->route('onboarding.step1');
            }

            DB::transaction(function () use ($user, $request, $role): void {
                $user->fill($request->validated());
                $user->role = $role;
                $user->onboarding_completed = true;
                $user->onboarding_checklist_dismissed_at = null;

                if (! $user->preferred_currency) {
                    $user->preferred_currency = 'EGP';
                }

                $user->save();
            });

            $request->session()->flash('show_checklist', true);
            $request->session()->forget('onboarding.role');

            return redirect()->route('dashboard');
        } catch (Throwable $e) {
            Log::error(static::class.'@storeStep2', [
                'user_id' => auth()->id(),
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    private function roleForInertia(?string $dbRole): string
    {
        return match ($dbRole) {
            'freelancer' => 'Freelancer',
            'small_business' => 'Small Business Owner',
            default => '',
        };
    }

    private function roleForDatabase(string $inertiaRole): string
    {
        return match ($inertiaRole) {
            'Freelancer' => 'freelancer',
            'Small Business Owner' => 'small_business',
            default => 'freelancer',
        };
    }
}
