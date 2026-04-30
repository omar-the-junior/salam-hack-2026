<?php

namespace App\Services\Email;

use App\Ai\Agents\EmailSubscriptionParserAgent;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class EmailParserService
{
    // ─── Subject keywords that signal this might be a billing email ─

    /** @var list<string> */
    private const BILLING_KEYWORDS = [
        'invoice', 'receipt', 'billing', 'subscription', 'payment',
        'charge', 'renewal', 'renewed', 'plan', 'statement',
        'payment confirmed', 'thank you for your payment',
        'your order', 'monthly', 'annual', 'yearly',
        'expir', 'renew', 'order confirmation', 'order receipt',
        'domain', 'hosting', 'auto-renew',
    ];

    // ─── Known sender domains → skip to AI immediately ──────────────

    /** @var list<string> */
    private const KNOWN_DOMAINS = [
        'netflix.com', 'spotify.com', 'apple.com', 'microsoft.com',
        'amazon.com', 'google.com', 'notion.so', 'github.com',
        'slack.com', 'dropbox.com', 'adobe.com', 'zoom.us',
        'canva.com', 'figma.com', 'digitalocean.com', 'openai.com',
        'anthropic.com', 'paypal.com', 'shopify.com', 'vercel.com',
        'cloudflare.com', 'stripe.com', 'namecheap.com', 'godaddy.com',
        'hostinger.com', 'hetzner.com', 'aws.amazon.com', 'linode.com',
        'vultr.com', 'name.com', 'porkbun.com', 'gandi.net',
    ];

    // ─── Regex patterns to find money amounts (pre-filter only) ─────

    /** @var list<string> */
    private const AMOUNT_PATTERNS = [
        '/(?:USD|EGP|EUR|GBP|SAR|AED)\s*\d{1,6}(?:[.,]\d{1,2})?/i',
        '/\d{1,6}(?:[.,]\d{1,2})?\s*(?:USD|EGP|EUR|GBP|SAR|AED)/i',
        '/[\$£€]\s*\d{1,6}(?:[.,]\d{1,2})?/i',
    ];

    // ─── Valid enum values for normalizing AI output ─────────────────

    private const VALID_CYCLES = ['monthly', 'annual', 'one-time', 'unknown'];

    private const VALID_CONFIDENCE = ['high', 'medium', 'low'];

    private const VALID_CURRENCIES = ['USD', 'EGP', 'EUR', 'GBP', 'SAR', 'AED'];

    // ─── Main entry point ────────────────────────────────────────────

    /**
     * Parse a normalized email via AI. Returns structured data array or null (skip).
     *
     * @param  array{id: string, subject: string, from: string, date: string, snippet: string, body: string}  $email
     * @return array{service_name: ?string, amount: ?float, currency: string, billing_cycle: string, billing_date: ?string, confidence: string, raw_email_id: string, raw_email_subject: string, raw_email_snippet: string, status: string}|null
     */
    public function parse(array $email): ?array
    {
        if (! $this->isCandidateEmail($email)) {
            return null;
        }

        $aiResult = $this->callAi($email);

        if ($aiResult === null || ! ($aiResult['is_subscription'] ?? false)) {
            return null;
        }

        return [
            'service_name' => $this->stringOrNull($aiResult['service_name'] ?? null),
            'amount' => $this->floatOrNull($aiResult['amount'] ?? null),
            'currency' => $this->normalizeEnum($aiResult['currency'] ?? null, self::VALID_CURRENCIES, 'USD'),
            'billing_cycle' => $this->normalizeEnum($aiResult['billing_cycle'] ?? null, self::VALID_CYCLES, 'unknown'),
            'billing_date' => $this->parseDateOrNull($aiResult['billing_date'] ?? null, $email['date']),
            'confidence' => $this->normalizeEnum($aiResult['confidence'] ?? null, self::VALID_CONFIDENCE, 'low'),
            'raw_email_id' => $email['id'],
            'raw_email_subject' => $email['subject'],
            'raw_email_snippet' => substr($email['snippet'], 0, 500),
            'status' => 'pending',
        ];
    }

    // ─── Pre-filter: cheap heuristics to avoid calling AI on obvious non-billing emails ──

    /**
     * @param  array{id: string, subject: string, from: string, date: string, snippet: string, body: string}  $email
     */
    private function isCandidateEmail(array $email): bool
    {
        $subject = strtolower($email['subject']);
        $from = strtolower($email['from']);

        foreach (self::BILLING_KEYWORDS as $kw) {
            if (str_contains($subject, $kw)) {
                return true;
            }
        }

        foreach (self::KNOWN_DOMAINS as $domain) {
            if (str_contains($from, $domain)) {
                return true;
            }
        }

        $bodyChunk = substr($email['body'], 0, 1000);
        foreach (self::AMOUNT_PATTERNS as $pattern) {
            if (preg_match($pattern, $bodyChunk)) {
                return true;
            }
        }

        return false;
    }

    // ─── AI call via OpenRouter ──────────────────────────────────────

    /**
     * @param  array{id: string, subject: string, from: string, date: string, snippet: string, body: string}  $email
     * @return array<string, mixed>|null
     */
    private function callAi(array $email): ?array
    {
        $maxBodyChars = (int) config('ai.email_parser.max_body_chars', 2000);
        $body = substr($email['body'], 0, $maxBodyChars);

        $prompt = implode("\n", [
            'Subject: '.$email['subject'],
            'From: '.$email['from'],
            'Date: '.$email['date'],
            'Snippet: '.substr($email['snippet'], 0, 300),
            'Body excerpt:',
            $body,
        ]);

        try {
            $response = app(EmailSubscriptionParserAgent::class)->prompt(
                $prompt,
                model: (string) config('ai.email_parser.openrouter_model', 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free'),
                timeout: (int) config('ai.email_parser.timeout', 30),
            );
        } catch (\Throwable $e) {
            Log::warning('EmailParserService: AI call failed', [
                'email_id' => $email['id'],
                'error' => $e->getMessage(),
            ]);

            return null;
        }

        return $this->decodeResponse($response, $email['id']);
    }

    // ─── JSON extraction and validation ─────────────────────────────

    /**
     * @return array<string, mixed>|null
     */
    private function decodeResponse(mixed $response, string $emailId): ?array
    {
        $text = (string) $response;

        // Strip markdown fences if the model wraps output
        if (preg_match('/```(?:json)?\s*(\{.*?\})\s*```/s', $text, $match)) {
            $text = $match[1];
        } elseif (preg_match('/(\{[^{}]*\})/s', $text, $match)) {
            $text = $match[1];
        }

        /** @var array<string, mixed>|null $data */
        $data = json_decode(trim($text), true);

        if (! is_array($data)) {
            Log::warning('EmailParserService: unparseable AI response', [
                'email_id' => $emailId,
                'raw' => substr((string) $response, 0, 500),
            ]);

            return null;
        }

        return $data;
    }

    // ─── Normalization helpers ───────────────────────────────────────

    /**
     * @param  list<string>  $allowed
     */
    private function normalizeEnum(mixed $value, array $allowed, string $default): string
    {
        if (is_string($value)) {
            $lower = strtolower($value);
            foreach ($allowed as $canonical) {
                if (strtolower($canonical) === $lower) {
                    return $canonical;
                }
            }
        }

        return $default;
    }

    private function floatOrNull(mixed $value): ?float
    {
        if (is_numeric($value) && (float) $value > 0) {
            return (float) $value;
        }

        return null;
    }

    private function stringOrNull(mixed $value): ?string
    {
        if (is_string($value) && trim($value) !== '' && strtolower(trim($value)) !== 'null') {
            return trim($value);
        }

        return null;
    }

    private function parseDateOrNull(mixed $aiDate, string $emailDate): ?string
    {
        // Prefer AI-detected date; fall back to email header date
        foreach ([$aiDate, $emailDate] as $candidate) {
            if (! is_string($candidate) || trim($candidate) === '') {
                continue;
            }
            try {
                return Carbon::parse($candidate)->toDateString();
            } catch (\Exception) {
                // Try next candidate
            }
        }

        return null;
    }
}
