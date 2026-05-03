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
                    $locationStr = $locResponse->json('city').', '.$locResponse->json('country');
                }
            } catch (\Exception $e) {
                // Ignore failure
            }
        }

        $text = "🔔 *New Visit*\n";
        $text .= "Path: `{$visitInfo['path']}`\n";
        $text .= "IP: `{$ip}` ($locationStr)\n";
        $text .= "Device: {$deviceType} | {$browser} | {$platform}\n";

        if (! empty($visitInfo['referer'])) {
            $text .= "Referer: {$visitInfo['referer']}\n";
        }

        if (! empty($visitInfo['language'])) {
            $text .= "Lang: {$visitInfo['language']}\n";
        }

        if (! empty($visitInfo['query'])) {
            $queryString = http_build_query($visitInfo['query']);
            $text .= "Query: `{$queryString}`\n";
        }

        if (! empty($visitInfo['user'])) {
            $user = $visitInfo['user'];
            $text .= "\n👤 *User Info*\n";
            $text .= "ID: {$user['id']}\n";
            $text .= "Name: {$user['name']}\n";
            $text .= "Email: {$user['email']}\n";
            if (! empty($user['created_at'])) {
                $text .= "Registered: {$user['created_at']}\n";
            }
        } else {
            $text .= "\n👤 *Guest User*\n";
            $text .= 'Session: `'.substr($visitInfo['session_id'], 0, 8)."...`\n";
        }

        try {
            $response = Http::post("https://api.telegram.org/bot{$token}/sendMessage", [
                'chat_id' => $chatId,
                'text' => $text,
                'parse_mode' => 'Markdown',
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
