<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureOnboardingComplete
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = auth()->user();

        if ($user && ! $user->onboarding_completed && ! $request->routeIs('onboarding.*', 'verification.*', 'logout')) {
            return redirect()->route('onboarding.step1');
        }

        return $next($request);
    }
}
