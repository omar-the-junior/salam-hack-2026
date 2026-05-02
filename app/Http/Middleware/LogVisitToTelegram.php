<?php

namespace App\Http\Middleware;

use App\Jobs\SendTelegramVisitNotification;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class LogVisitToTelegram
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $visitInfo = [
            'path' => $request->path(),
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'referer' => $request->headers->get('referer'),
            'language' => $request->getPreferredLanguage(),
            'query' => $request->query(),
            'session_id' => $request->session()->getId(),
            'user' => null,
        ];

        if ($request->user()) {
            $user = $request->user();
            $visitInfo['user'] = [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'created_at' => $user->created_at?->diffForHumans(),
            ];
        }

        SendTelegramVisitNotification::dispatch($visitInfo);

        return $response;
    }
}
