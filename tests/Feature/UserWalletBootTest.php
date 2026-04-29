<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserWalletBootTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_factory_with_preferred_currency_creates_matching_zero_balance_wallet(): void
    {
        $user = User::factory()->create([
            'preferred_currency' => 'USD',
        ]);

        $this->assertDatabaseHas('user_wallets', [
            'user_id' => $user->id,
            'currency' => 'USD',
            'balance_cents' => 0,
        ]);
    }
}
