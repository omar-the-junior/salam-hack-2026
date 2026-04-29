<?php

namespace App\Http\Middleware;

use App\Services\Payment\PaymobService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class VerifyPaymobWebhook
{
    public function handle(Request $request, Closure $next): Response
    {
        $hmac = $request->query('hmac', '');

        if (! $hmac || ! app(PaymobService::class)->verifyHmac($request->all(), $hmac)) {
            Log::warning('PaymobWebhook: invalid HMAC', [
                'ip' => $request->ip(),
                'hmac' => substr($hmac, 0, 8).'...',
            ]);

            return response('Unauthorized', 401);
        }

        return $next($request);
    }
}
