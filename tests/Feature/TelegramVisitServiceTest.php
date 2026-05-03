<?php

namespace Tests\Feature;

use App\Services\TelegramVisitService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class TelegramVisitServiceTest extends TestCase
{
    public function test_it_sends_notification_with_html_parse_mode()
    {
        Http::fake([
            'https://api.telegram.org/*' => Http::response(['ok' => true]),
            'http://ip-api.com/*' => Http::response(['status' => 'success', 'city' => 'Cairo', 'country' => 'Egypt']),
        ]);

        Config::set('services.telegram.bot_token', 'test-token');
        Config::set('services.telegram.chat_id', 'test-chat-id');

        $request = Request::create('/', 'GET');
        $request->setLaravelSession($this->app['session']->driver('array'));
        $request->headers->set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');

        TelegramVisitService::logVisit($request);

        Http::assertSent(function ($request) {
            return str_contains($request->url(), 'sendMessage') &&
                   $request['parse_mode'] === 'HTML' &&
                   str_contains($request['text'], '<b>New Visit</b>');
        });
    }

    public function test_it_escapes_special_characters_in_notification()
    {
        Http::fake([
            'https://api.telegram.org/*' => Http::response(['ok' => true]),
            'http://ip-api.com/*' => Http::response(['status' => 'fail']),
        ]);

        Config::set('services.telegram.bot_token', 'test-token');
        Config::set('services.telegram.chat_id', 'test-chat-id');

        $request = Request::create('/path_with_underscore', 'GET', ['q' => 'val&ue']);
        $request->setLaravelSession($this->app['session']->driver('array'));
        $request->headers->set('User-Agent', 'Agent_With_Underscore');
        $request->headers->set('Referer', 'http://example.com/?a=b&c=d');

        TelegramVisitService::logVisit($request);

        Http::assertSent(function ($request) {
            return str_contains($request->url(), 'sendMessage') &&
                   $request['parse_mode'] === 'HTML' &&
                   str_contains($request['text'], 'path_with_underscore') &&
                   str_contains($request['text'], 'val%26ue') &&
                   str_contains($request['text'], 'a=b&amp;c=d');
        });
    }
}
