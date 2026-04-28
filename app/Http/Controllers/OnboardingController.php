<?php

namespace App\Http\Controllers;

use App\Http\Requests\Onboarding\StoreStep1Request;
use App\Http\Requests\Onboarding\StoreStep2Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OnboardingController extends Controller
{
    public function openOnboarding(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        if ($user->onboarding_completed) {
            return redirect()->route('dashboard');
        }

        return Inertia::render('onboarding/step-1', [
            'role' => $this->roleForInertia($user->role),
        ]);
    }

    public function storeStep1(StoreStep1Request $request): RedirectResponse
    {
        $user = $request->user();
        if ($user->onboarding_completed) {
            return redirect()->route('dashboard');
        }

        $user->role = $this->roleForDatabase($request->validated('role'));
        $user->save();

        return redirect()->route('onboarding.step2');
    }

    public function openStep2(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        if ($user->onboarding_completed) {
            return redirect()->route('dashboard');
        }

        if (! $user->role) {
            return redirect()->route('onboarding.step1');
        }

        return Inertia::render('onboarding/step-2', [
            'name' => $user->display_name ?? $user->name ?? '',
            'role' => $this->roleForInertia($user->role),
            'country' => $user->country ?? '',
            'preferred_currency' => $user->preferred_currency ?: 'EGP',
            'profession' => $user->profession ?? '',
        ]);
    }

    public function storeStep2(StoreStep2Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user->onboarding_completed) {
            return redirect()->route('dashboard');
        }

        if (! $user->role) {
            return redirect()->route('onboarding.step1');
        }

        $user->fill($request->validated());
        $user->onboarding_completed = true;
        if (! $user->preferred_currency) {
            $user->preferred_currency = 'EGP';
        }
        $user->save();

        $request->session()->flash('show_checklist', true);

        return redirect()->route('dashboard');
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
