<?php

namespace App\Services\Payment;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class PaymobService
{
    public function __construct(
        private string $apiKey = '',
        private string $integrationId = '',
        private string $iframeId = '',
        private string $hmacSecret = '',
    ) {
        $this->apiKey = config('services.paymob.api_key');
        $this->integrationId = config('services.paymob.integration_id');
        $this->iframeId = config('services.paymob.iframe_id');
        $this->hmacSecret = config('services.paymob.hmac_secret');
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
                'auth_token' => $authToken,
                'delivery_needed' => false,
                'amount_cents' => $amountCents,
                'currency' => $currency,
                'items' => [],
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
                'auth_token' => $authToken,
                'amount_cents' => $amountCents,
                'expiration' => 3600,
                'order_id' => $orderId,
                'billing_data' => $billingData,
                'currency' => $currency,
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
        $fields = [
            'amount_cents' => $this->normalize($this->hmacField($payload, 'amount_cents')),
            'created_at' => $this->normalize($this->hmacField($payload, 'created_at')),
            'currency' => $this->normalize($this->hmacField($payload, 'currency')),
            'error_occured' => $this->normalize($this->hmacField($payload, 'error_occured')),
            'has_parent_transaction' => $this->normalize($this->hmacField($payload, 'has_parent_transaction')),
            'id' => $this->normalize($this->hmacField($payload, 'id')),
            'integration_id' => $this->normalize($this->hmacField($payload, 'integration_id')),
            'is_3d_secure' => $this->normalize($this->hmacField($payload, 'is_3d_secure')),
            'is_auth' => $this->normalize($this->hmacField($payload, 'is_auth')),
            'is_capture' => $this->normalize($this->hmacField($payload, 'is_capture')),
            'is_refunded' => $this->normalize($this->hmacField($payload, 'is_refunded')),
            'is_standalone_payment' => $this->normalize($this->hmacField($payload, 'is_standalone_payment')),
            'is_voided' => $this->normalize($this->hmacField($payload, 'is_voided')),
            'order' => $this->normalize($this->hmacField($payload, 'order')),
            'owner' => $this->normalize($this->hmacField($payload, 'owner')),
            'pending' => $this->normalize($this->hmacField($payload, 'pending')),
            'source_data_pan' => $this->normalize($this->hmacField($payload, 'source_data_pan')),
            'source_data_sub_type' => $this->normalize($this->hmacField($payload, 'source_data_sub_type')),
            'source_data_type' => $this->normalize($this->hmacField($payload, 'source_data_type')),
            'success' => $this->normalize($this->hmacField($payload, 'success')),
        ];

        $concatenated = implode('', array_values($fields));
        $computed = hash_hmac('sha512', $concatenated, $this->hmacSecret);

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

    private function hmacField(array $payload, string $field): mixed
    {
        return match ($field) {
            'order' => data_get($payload, 'obj.order.id')
                ?? data_get($payload, 'obj.order')
                ?? $payload['order']
                ?? '',
            'source_data_pan' => data_get($payload, 'obj.source_data.pan')
                ?? data_get($payload, 'source_data.pan')
                ?? $payload['source_data_pan']
                ?? '',
            'source_data_sub_type' => data_get($payload, 'obj.source_data.sub_type')
                ?? data_get($payload, 'source_data.sub_type')
                ?? $payload['source_data_sub_type']
                ?? '',
            'source_data_type' => data_get($payload, 'obj.source_data.type')
                ?? data_get($payload, 'source_data.type')
                ?? $payload['source_data_type']
                ?? '',
            default => data_get($payload, "obj.{$field}") ?? $payload[$field] ?? '',
        };
    }
}
