<?php

// app/Services/Gmail/GmailScannerService.php

namespace App\Services\Gmail;

use App\Models\ConnectedAccount;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GmailScannerService
{
    // Gmail REST API base
    private const BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';

    public function __construct(
        private GmailConnectService $connectService
    ) {}

    // ── Main: fetch all billing emails from last N months ────────

    public function fetchEmails(ConnectedAccount $account, int $months = 6): array
    {
        $token = $this->connectService->getFreshAccessToken($account);
        $query = $this->buildQuery($months);

        $messageIds = $this->listMessageIds($token, $query);
        $emails = [];

        foreach ($messageIds as $id) {
            try {
                $emails[] = $this->fetchMessage($token, $id);
            } catch (\Exception $e) {
                Log::warning('Failed to fetch Gmail message', [
                    'id' => $id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $emails;
    }

    // ── Step A: Get list of message IDs ─────────────────────────

    private function listMessageIds(string $token, string $query): array
    {
        $ids = [];
        $pageToken = null;

        do {
            $params = [
                'q' => $query,
                'maxResults' => 100,
            ];

            if ($pageToken) {
                $params['pageToken'] = $pageToken;
            }

            $response = Http::withoutVerifying()->withToken($token)
                ->get(self::BASE.'/messages', $params);

            if ($response->failed()) {
                throw new \RuntimeException(
                    'Gmail messages.list failed ('.$response->status().'): '.$response->body()
                );
            }

            $data = $response->json();

            // Collect IDs from this page
            foreach ($data['messages'] ?? [] as $msg) {
                $ids[] = $msg['id'];
            }

            $pageToken = $data['nextPageToken'] ?? null;

        } while ($pageToken);

        return $ids;
    }

    // ── Step B: Fetch full message by ID ─────────────────────────

    private function fetchMessage(string $token, string $messageId): array
    {
        $response = Http::withoutVerifying()->withToken($token)
            ->get(self::BASE.'/messages/'.$messageId, [
                'format' => 'full',
            ]);

        if ($response->failed()) {
            throw new \RuntimeException('Failed to fetch message: '.$messageId);
        }

        return $this->normalize($response->json());
    }

    // ── Normalize raw Gmail JSON → flat array ─────────────────────

    private function normalize(array $message): array
    {
        $headers = collect($message['payload']['headers'] ?? [])
            ->keyBy('name');

        return [
            'id' => $message['id'],
            'subject' => $headers->get('Subject')['value'] ?? '',
            'from' => $headers->get('From')['value'] ?? '',
            'date' => $headers->get('Date')['value'] ?? '',
            'snippet' => $message['snippet'] ?? '',
            'body' => $this->extractBody($message['payload']),
        ];
    }

    // ── Extract plain or HTML text body from payload ──────────────

    private function extractBody(array $payload): string
    {
        $mimeType = $payload['mimeType'] ?? '';

        // Direct plain text at root level
        if ($mimeType === 'text/plain') {
            return $this->decode($payload['body']['data'] ?? '');
        }

        // Direct HTML at root level (no multipart, common in transactional emails)
        if ($mimeType === 'text/html') {
            return strip_tags($this->decode($payload['body']['data'] ?? ''));
        }

        $parts = $payload['parts'] ?? [];

        // Prefer plain text part
        foreach ($parts as $part) {
            if (($part['mimeType'] ?? '') === 'text/plain') {
                return $this->decode($part['body']['data'] ?? '');
            }
        }

        // Fallback: HTML stripped
        foreach ($parts as $part) {
            if (($part['mimeType'] ?? '') === 'text/html') {
                return strip_tags($this->decode($part['body']['data'] ?? ''));
            }
        }

        // Nested multipart (e.g. multipart/alternative inside multipart/mixed)
        foreach ($parts as $part) {
            if (str_starts_with($part['mimeType'] ?? '', 'multipart/')) {
                $nested = $this->extractBody($part);
                if ($nested !== '') {
                    return $nested;
                }
            }
        }

        return '';
    }

    // ── Gmail uses URL-safe base64 ────────────────────────────────

    private function decode(string $data): string
    {
        if (! $data) {
            return '';
        }

        return base64_decode(strtr($data, '-_', '+/')) ?: '';
    }

    // ── Build Gmail search query ──────────────────────────────────

    private function buildQuery(int $months): string
    {
        $keywords = implode(' OR ', [
            'subject:invoice',
            'subject:receipt',
            'subject:subscription',
            'subject:payment',
            'subject:billing',
            'subject:renewal',
            'subject:charged',
            'subject:"your order"',
            'subject:"order confirmation"',
            'subject:expiring',
            'subject:expired',
            'subject:"auto-renew"',
            'subject:"renewal reminder"',
            'subject:"domain registration"',
        ]);

        $after = now()->subMonths($months)->format('Y/m/d');

        return "({$keywords}) after:{$after}";
    }
}
