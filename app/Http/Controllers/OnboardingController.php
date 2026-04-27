<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class OnboardingController extends Controller
{
    public function step1(): Response
    {
        return Inertia::render('onboarding/step-1');
    }

    public function step2(): Response
    {
        return Inertia::render('onboarding/step-2');
    }
}
