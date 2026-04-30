<?php

namespace Database\Factories;

use App\Models\ConnectedAccount;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ConnectedAccount>
 */
class ConnectedAccountFactory extends Factory
{
    protected $model = ConnectedAccount::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'provider' => 'gmail',
            'email' => fake()->safeEmail(),
            'access_token' => encrypt(fake()->sha256()),
            'refresh_token' => encrypt(fake()->sha256()),
            'token_expires_at' => now()->addHour(),
        ];
    }
}
