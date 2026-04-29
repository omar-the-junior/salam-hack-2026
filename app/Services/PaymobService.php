<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class PaymobService
{
    private string $apiKey;
    private string $integrationId;
    private string $iframeId;
    private string $hmacSecret;

    public function __construct()
    {
        $this->apiKey        = config('services.paymob.api_key');
        $this->integrationId = config('services.paymob.integration_id');
        $this->iframeId      = config('services.paymob.iframe_id');
        $this->hmacSecret    = config('services.paymob.hmac_secret');
    }

    public function authenticate(): string
    {
        $response = Http::timeout(15)->retry(2, 500)
            ->post('https://accept.paymob.com/api/auth/tokens', [
                'api_key' => $this->apiKey,
            ]);

        if (! $response->successful() || empty($response->json('token'))) {
            throw new RuntimeException('Paymob authentication failed: '.$response->body());
        }

        return $response->json('token');
    }

    public function createOrder(string $authToken, int $amountCents, string $currency): string
    {
        $response = Http::timeout(15)->retry(2, 500)
            ->post('https://accept.paymob.com/api/ecommerce/orders', [
                'auth_token'       => $authToken,
                'delivery_needed'  => false,
                'amount_cents'     => $amountCents,
                'currency'         => $currency,
                'items'            => [],
            ]);

        if (! $response->successful() || empty($response->json('id'))) {
            throw new RuntimeException('Paymob order creation failed: '.$response->body());
        }

        return (string) $response->json('id');
    }

    public function getPaymentKey(
        string $authToken,
        string $orderId,
        int $amountCents,
        string $currency,
        array $billingData
    ): string {
        $response = Http::timeout(15)->retry(2, 500)
            ->post('https://accept.paymob.com/api/acceptance/payment_keys', [
                'auth_token'     => $authToken,
                'amount_cents'   => $amountCents,
                'expiration'     => 3600,
                'order_id'       => $orderId,
                'billing_data'   => $billingData,
                'currency'       => $currency,
                'integration_id' => (int) $this->integrationId,
            ]);

        if (! $response->successful() || empty($response->json('token'))) {
            throw new RuntimeException('Paymob payment key request failed: '.$response->body());
        }

        return $response->json('token');
    }

    public function buildIframeUrl(string $paymentKey): string
    {
        return "https://accept.paymob.com/api/acceptance/iframes/{$this->iframeId}?payment_token={$paymentKey}";
    }

    /**
     * Verifies the HMAC signature sent by Paymob on webhook/callback.
     * Boolean fields must be normalized to lowercase string before hashing.
     */
    public function verifyHmac(array $payload, string $receivedHmac): bool
    {
        $obj = $payload['obj'] ?? [];

        $fields = [
            'amount_cents'           => $this->normalize($obj['amount_cents'] ?? ''),
            'created_at'             => $this->normalize($obj['created_at'] ?? ''),
            'currency'               => $this->normalize($obj['currency'] ?? ''),
            'error_occured'          => $this->normalize($obj['error_occured'] ?? ''),
            'has_parent_transaction' => $this->normalize($obj['has_parent_transaction'] ?? ''),
            'id'                     => $this->normalize($obj['id'] ?? ''),
            'integration_id'         => $this->normalize($obj['integration_id'] ?? ''),
            'is_3d_secure'           => $this->normalize($obj['is_3d_secure'] ?? ''),
            'is_auth'                => $this->normalize($obj['is_auth'] ?? ''),
            'is_capture'             => $this->normalize($obj['is_capture'] ?? ''),
            'is_refunded'            => $this->normalize($obj['is_refunded'] ?? ''),
            'is_standalone_payment'  => $this->normalize($obj['is_standalone_payment'] ?? ''),
            'is_voided'              => $this->normalize($obj['is_voided'] ?? ''),
            'order'                  => $this->normalize($obj['order']['id'] ?? ''),
            'owner'                  => $this->normalize($obj['owner'] ?? ''),
            'pending'                => $this->normalize($obj['pending'] ?? ''),
            'source_data_pan'        => $this->normalize($obj['source_data']['pan'] ?? ''),
            'source_data_sub_type'   => $this->normalize($obj['source_data']['sub_type'] ?? ''),
            'source_data_type'       => $this->normalize($obj['source_data']['type'] ?? ''),
            'success'                => $this->normalize($obj['success'] ?? ''),
        ];

        $concatenated = implode('', array_values($fields));
        $computed     = hash_hmac('sha512', $concatenated, $this->hmacSecret);

        return hash_equals($computed, strtolower($receivedHmac));
    }

    /** Normalises booleans to lowercase string; leaves other values as string. */
    private function normalize(mixed $value): string
    {
        if (is_bool($value)) {
            return $value ? 'true' : 'false';
        }

        return (string) $value;
    }
}
