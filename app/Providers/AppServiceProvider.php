<?php

namespace App\Providers;

use Carbon\CarbonImmutable;
use Illuminate\Auth\Middleware\RedirectIfAuthenticated;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use SocialiteProviders\Google\Provider;
use SocialiteProviders\Manager\SocialiteWasCalled;

class AppServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $this->configureDefaults();
        $this->configureRateLimiting();

        RedirectIfAuthenticated::redirectUsing(static function (Request $request): string {
            return route('dashboard', [], false);
        });

        Event::listen(function (SocialiteWasCalled $event) {
            $event->extendSocialite('google', Provider::class);
        });
    }

    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(app()->isProduction());

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }

    private function configureRateLimiting(): void
    {
        RateLimiter::for('login', function (Request $request) {
            $throttleKey = Str::transliterate(Str::lower($request->input('email')).'|'.$request->ip());

            return Limit::perMinute(5)->by($throttleKey);
        });
    }
}
