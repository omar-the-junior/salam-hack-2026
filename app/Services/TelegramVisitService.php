<?php

namespace App\Services;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Jenssegers\Agent\Agent;

class TelegramVisitService
{
    public static function logVisit(Request $request): void
    {
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

        self::sendNotification($visitInfo);
    }

    private static function sendNotification(array $visitInfo): void
    {
        $token = config('services.telegram.bot_token');
        $chatId = config('services.telegram.chat_id');

        if (! $token || ! $chatId) {
            return;
        }

        // Setup Agent
        $agent = new Agent;
        $agent->setUserAgent($visitInfo['user_agent']);

        $deviceType = $agent->isDesktop() ? 'Desktop' : ($agent->isMobile() ? 'Mobile' : ($agent->isTablet() ? 'Tablet' : 'Unknown'));
        $browser = $agent->browser().' '.$agent->version($agent->browser());
        $platform = $agent->platform().' '.$agent->version($agent->platform());

        // Attempt to get location from IP API
        $ip = $visitInfo['ip'];
        $locationStr = 'Unknown';
        if ($ip && $ip !== '127.0.0.1' && $ip !== '::1') {
            try {
                $locResponse = Http::timeout(3)->get("http://ip-api.com/json/{$ip}");
                if ($locResponse->successful() && $locResponse->json('status') === 'success') {
                    $city = $locResponse->json('city');
                    $region = $locResponse->json('regionName');
                    $country = $locResponse->json('country');
                    $timezone = $locResponse->json('timezone');
                    $locationStr = "{$city}, {$region}, {$country} ({$timezone})";
                }
            } catch (\Exception $e) {
                // Ignore failure
            }
        }

        $text = "🔔 <b>New Visit</b>\n";
        $text .= 'Path: <code>'.e($visitInfo['path'])."</code>\n";
        $text .= 'IP: <code>'.e($ip).'</code> ('.e($locationStr).")\n";
        $text .= 'Device: '.e("{$deviceType} | {$browser} | {$platform}")."\n";

        if (! empty($visitInfo['referer'])) {
            $text .= 'Referer: '.e($visitInfo['referer'])."\n";
        }

        if (! empty($visitInfo['language'])) {
            $text .= 'Lang: '.e($visitInfo['language'])."\n";
        }

        if (! empty($visitInfo['query'])) {
            $queryString = http_build_query($visitInfo['query']);
            $text .= 'Query: <code>'.e($queryString)."</code>\n";
        }

        if (! empty($visitInfo['user'])) {
            $user = $visitInfo['user'];
            $text .= "\n👤 <b>User Info</b>\n";
            $text .= 'ID: '.e($user['id'])."\n";
            $text .= 'Name: '.e($user['name'])."\n";
            $text .= 'Email: '.e($user['email'])."\n";
            if (! empty($user['created_at'])) {
                $text .= 'Registered: '.e($user['created_at'])."\n";
            }
        } else {
            $text .= "\n👤 <b>Guest User</b>\n";
            $text .= 'Session: <code>'.e(substr($visitInfo['session_id'], 0, 8))."...</code>\n";
        }

        try {
            $response = Http::post("https://api.telegram.org/bot{$token}/sendMessage", [
                'chat_id' => $chatId,
                'text' => $text,
                'parse_mode' => 'HTML',
            ]);

            if (! $response->successful()) {
                Log::error('Telegram notification failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
            }
        } catch (\Throwable $e) {
            Log::error('Telegram notification exception', [
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);
        }
    }
}
