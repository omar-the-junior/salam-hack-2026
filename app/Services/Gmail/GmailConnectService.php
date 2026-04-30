<?php

// app/Services/Gmail/GmailConnectService.php

namespace App\Services\Gmail;

use App\Models\ConnectedAccount;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GmailConnectService
{
    // ── Step 1: Build redirect URL ───────────────────────────────

    public function getAuthUrl(): string
    {
        $params = http_build_query([
            'client_id' => config('services.google.client_id'),
            'redirect_uri' => config('services.google.gmail_redirect'),
            'response_type' => 'code',
            'scope' => implode(' ', [
                'https://www.googleapis.com/auth/gmail.readonly',
                'https://www.googleapis.com/auth/userinfo.email',
            ]),
            'access_type' => 'offline',
            'prompt' => 'consent',
        ]);

        return 'https://accounts.google.com/o/oauth2/v2/auth?'.$params;
    }

    // ── Step 2: Handle callback ──────────────────────────────────

    public function handleCallback(User $user, string $code): ConnectedAccount
    {
        // Exchange code → tokens
        $tokens = $this->exchangeCodeForTokens($code);

        // Get Gmail address
        $email = $this->getUserEmail($tokens['access_token']);

        // Upsert connected_accounts
        return ConnectedAccount::updateOrCreate(
            [
                'user_id' => $user->id,
                'provider' => 'gmail',
            ],
            [
                'email' => $email,
                'access_token' => $tokens['access_token'],          // mutator encrypts
                'refresh_token' => $tokens['refresh_token'],         // mutator encrypts
                'token_expires_at' => now()->addSeconds($tokens['expires_in']),
            ]
        );
    }

    // ── Token refresh ────────────────────────────────────────────

    public function refreshIfExpired(ConnectedAccount $account): ConnectedAccount
    {
        if (! $account->isExpired()) {
            return $account;
        }

        $tokens = $this->refreshAccessToken($account->refresh_token);

        $account->update([
            'access_token' => $tokens['access_token'],
            'token_expires_at' => now()->addSeconds($tokens['expires_in']),
            // refresh_token stays the same — Google doesn't reissue it on refresh
        ]);

        return $account->fresh();
    }

    // ── Disconnect ───────────────────────────────────────────────

    public function disconnect(User $user): void
    {
        $account = ConnectedAccount::where('user_id', $user->id)
            ->where('provider', 'gmail')
            ->first();

        if ($account) {
            // Optionally revoke the token on Google's side
            Http::withoutVerifying()->get('https://oauth2.googleapis.com/revoke', [
                'token' => $account->access_token,
            ]);

            $account->delete();
        }
    }

    // ── Helper: get a fresh access token string ──────────────────
    // Used by GmailScannerService before every API call

    public function getFreshAccessToken(ConnectedAccount $account): string
    {
        $account = $this->refreshIfExpired($account);

        return $account->access_token; // accessor decrypts
    }

    // ─── Private HTTP calls ──────────────────────────────────────

    private function exchangeCodeForTokens(string $code): array
    {
        $response = Http::withoutVerifying()->asForm()->post('https://oauth2.googleapis.com/token', [
            'code' => $code,
            'client_id' => config('services.google.client_id'),
            'client_secret' => config('services.google.client_secret'),
            'redirect_uri' => config('services.google.gmail_redirect'),
            'grant_type' => 'authorization_code',
        ]);

        if ($response->failed()) {
            Log::error('Gmail Token Exchange Failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            throw new \RuntimeException(
                'Token exchange failed: '.$response->json('error_description')
            );
        }

        return $response->json();
    }

    private function refreshAccessToken(string $refreshToken): array
    {
        $response = Http::withoutVerifying()->asForm()->post('https://oauth2.googleapis.com/token', [
            'refresh_token' => $refreshToken,
            'client_id' => config('services.google.client_id'),
            'client_secret' => config('services.google.client_secret'),
            'grant_type' => 'refresh_token',
        ]);

        if ($response->failed()) {
            Log::error('Gmail Token Refresh Failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            throw new \RuntimeException(
                'Token refresh failed: '.$response->json('error_description')
            );
        }

        return $response->json();
    }

    private function getUserEmail(string $accessToken): string
    {
        $response = Http::withoutVerifying()->withToken($accessToken)
            ->get('https://www.googleapis.com/oauth2/v2/userinfo');

        if ($response->failed()) {
            Log::error('Gmail Fetch User Email Failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            throw new \RuntimeException('Could not fetch Gmail address from Google.');
        }

        return $response->json('email');
    }
}
