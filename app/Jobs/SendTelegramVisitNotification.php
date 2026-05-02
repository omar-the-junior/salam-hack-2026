<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Http;
use Jenssegers\Agent\Agent;

class SendTelegramVisitNotification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct(public array $visitInfo)
    {
        //
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $token = config('services.telegram.bot_token');
        $chatId = config('services.telegram.chat_id');

        if (! $token || ! $chatId) {
            return;
        }

        // Setup Agent
        $agent = new Agent;
        $agent->setUserAgent($this->visitInfo['user_agent']);

        $deviceType = $agent->isDesktop() ? 'Desktop' : ($agent->isMobile() ? 'Mobile' : ($agent->isTablet() ? 'Tablet' : 'Unknown'));
        $browser = $agent->browser().' '.$agent->version($agent->browser());
        $platform = $agent->platform().' '.$agent->version($agent->platform());

        // Attempt to get location from IP API
        $ip = $this->visitInfo['ip'];
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
        $text .= "Path: `{$this->visitInfo['path']}`\n";
        $text .= "IP: `{$ip}` ($locationStr)\n";
        $text .= "Device: {$deviceType} | {$browser} | {$platform}\n";

        if (! empty($this->visitInfo['referer'])) {
            $text .= "Referer: {$this->visitInfo['referer']}\n";
        }

        if (! empty($this->visitInfo['language'])) {
            $text .= "Lang: {$this->visitInfo['language']}\n";
        }

        if (! empty($this->visitInfo['query'])) {
            $queryString = http_build_query($this->visitInfo['query']);
            $text .= "Query: `{$queryString}`\n";
        }

        if (! empty($this->visitInfo['user'])) {
            $user = $this->visitInfo['user'];
            $text .= "\n👤 *User Info*\n";
            $text .= "ID: {$user['id']}\n";
            $text .= "Name: {$user['name']}\n";
            $text .= "Email: {$user['email']}\n";
            if (! empty($user['created_at'])) {
                $text .= "Registered: {$user['created_at']}\n";
            }
        } else {
            $text .= "\n👤 *Guest User*\n";
            $text .= 'Session: `'.substr($this->visitInfo['session_id'], 0, 8)."...`\n";
        }

        Http::post("https://api.telegram.org/bot{$token}/sendMessage", [
            'chat_id' => $chatId,
            'text' => $text,
            'parse_mode' => 'Markdown',
        ]);
    }
}
